# backend/data_ingestor.py
import os
import requests
import time
from datetime import datetime, timezone
from pymongo import MongoClient, ReplaceOne

# --- Configuration ---
MONGO_URI = os.environ.get('MONGO_URI')
if not MONGO_URI:
    raise Exception("MONGO_URI environment variable not set!")

DB_NAME = 'f1_data'
OPENF1_API_BASE = 'https://api.openf1.org/v1'

# --- Database Connection ---
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def clear_all_collections():
    """Clears all data from all collections for a fresh start."""
    print("--- Clearing all existing data from MongoDB ---")
    collections = db.list_collection_names()
    for collection_name in collections:
        db[collection_name].delete_many({})
        print(f"Cleared collection: {collection_name}")
    print("All collections cleared successfully.")

def fetch_and_store(endpoint, params, collection_name, is_driver_data=False):
    """Generic function to fetch data from an endpoint and store it."""
    try:
        response = requests.get(f"{OPENF1_API_BASE}/{endpoint}", params=params)
        response.raise_for_status()
        data = response.json()
        
        if data:
            if is_driver_data:
                # For drivers, we upsert to build a master list without duplicates
                updates = [ReplaceOne({'_id': d['driver_number']}, {**d, '_id': d['driver_number']}, upsert=True) for d in data]
                if updates:
                    db[collection_name].bulk_write(updates, ordered=False)
            else:
                # For other data, we just insert it all
                db[collection_name].insert_many(data, ordered=False)
            print(f"  -> Stored {len(data)} documents in '{collection_name}'")
        else:
            print(f"  -> No data found for '{collection_name}'")

    except requests.exceptions.RequestException as e:
        print(f"  -> Could not fetch {endpoint} for params {params}: {e}")
    except Exception as e:
        print(f"  -> An error occurred while storing data for {collection_name}: {e}")


def populate_all_data():
    """
    Main function to clear and re-ingest a comprehensive dataset from the OpenF1 API.
    """
    try:
        clear_all_collections()

        cutoff_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        cutoff_date_str = cutoff_utc.isoformat(timespec='seconds')
        print(f"\n--- Fetching new data for sessions completed before: {cutoff_date_str}Z ---")

        # 1. Fetch Meetings and Sessions first to get session_keys
        fetch_and_store('meetings', {}, 'meetings')
        
        all_meetings = list(db.meetings.find({}, {'_id': 1}))
        sessions_to_insert = []
        for meeting in all_meetings:
            try:
                response = requests.get(f"{OPENF1_API_BASE}/sessions", params={'meeting_key': meeting['_id']})
                response.raise_for_status()
                for session in response.json():
                    if session.get('date_end') and session.get('date_end') < cutoff_date_str:
                        sessions_to_insert.append({**session, '_id': session['session_key']})
            except requests.exceptions.RequestException as e:
                print(f"Could not fetch sessions for meeting {meeting['_id']}: {e}")
        
        if sessions_to_insert:
            db.sessions.insert_many(sessions_to_insert, ordered=False)
            print(f"\nStored {len(sessions_to_insert)} completed sessions.")

        # 2. Iterate through each completed session and fetch all related data
        all_sessions = list(db.sessions.find({}, {'_id': 1, 'session_name': 1}))
        print(f"\n--- Fetching detailed data for {len(all_sessions)} sessions ---")

        # Define endpoints to fetch for each session
        session_endpoints = [
            'drivers', 'intervals', 'laps', 'pit', 'position', 
            'race_control', 'session_result', 'stints', 'weather'
        ]
        
        # NOTE: 'car_data' and 'location' are excluded by default as they are very large datasets.
        # You can add them to the list above if you need full telemetry.
        # session_endpoints.extend(['car_data', 'location'])

        for session in all_sessions:
            session_key = session['_id']
            print(f"\nProcessing session: {session['session_name']} (Key: {session_key})")
            
            for endpoint in session_endpoints:
                time.sleep(0.2) # Be kind to the API
                collection_name = endpoint.replace('_', '_') # e.g., session_result -> session_results
                if collection_name == 'pit': collection_name = 'pit_stops' # Adjust for schema name
                
                fetch_and_store(
                    endpoint=endpoint,
                    params={'session_key': session_key},
                    collection_name=collection_name,
                    is_driver_data=(endpoint == 'drivers')
                )

        print("\nData population complete!")

    except Exception as e:
        print(f"\nAn unexpected high-level error occurred: {e}")
    finally:
        client.close()
        print("MongoDB connection closed.")


if __name__ == '__main__':
    populate_all_data()
