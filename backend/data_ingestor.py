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

def fetch_data(endpoint, params):
    """Generic function to fetch data from an endpoint."""
    try:
        response = requests.get(f"{OPENF1_API_BASE}/{endpoint}", params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"  -> Could not fetch {endpoint} for params {params}: {e}")
        return None
    except json.JSONDecodeError:
        print(f"  -> Failed to decode JSON from {endpoint} for params {params}")
        return None

def populate_all_data():
    """
    Main function to re-ingest a comprehensive dataset from the OpenF1 API.
    This version is more robust and clears data on a per-session basis.
    """
    try:
        cutoff_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        cutoff_date_str = cutoff_utc.isoformat(timespec='seconds')
        print(f"--- Starting comprehensive data ingestion ---")
        print(f"Fetching data for all sessions completed before: {cutoff_date_str}Z")

        # 1. Fetch all meetings and upsert them into the meetings collection
        print("\n--- Step 1: Fetching and storing all meetings ---")
        meetings_data = fetch_data('meetings', {})
        if not meetings_data:
            raise Exception("Failed to fetch meetings. The API might be down. Aborting.")
        
        meeting_updates = [ReplaceOne({'_id': m['meeting_key']}, {**m, '_id': m['meeting_key']}, upsert=True) for m in meetings_data]
        if meeting_updates:
            db.meetings.bulk_write(meeting_updates)
            print(f"Upserted {len(meeting_updates)} meetings.")

        # 2. Fetch all sessions and filter for completed ones
        print("\n--- Step 2: Identifying completed sessions ---")
        all_meetings = list(db.meetings.find({}, {'_id': 1}))
        completed_sessions = []
        for meeting in all_meetings:
            sessions_data = fetch_data('sessions', {'meeting_key': meeting['_id']})
            if sessions_data:
                for session in sessions_data:
                    if session.get('date_end') and session.get('date_end') < cutoff_date_str:
                        completed_sessions.append({**session, '_id': session['session_key']})
        
        if not completed_sessions:
            print("No new completed sessions found to process. Exiting.")
            return
        
        # Upsert the session documents
        session_updates = [ReplaceOne({'_id': s['_id']}, s, upsert=True) for s in completed_sessions]
        db.sessions.bulk_write(session_updates)
        print(f"Found and stored {len(completed_sessions)} completed sessions.")

        # 3. For each completed session, clear its related data and re-ingest
        print(f"\n--- Step 3: Fetching detailed data for {len(completed_sessions)} sessions ---")
        
        session_endpoints = [
            'drivers', 'intervals', 'laps', 'pit', 'position', 
            'race_control', 'session_result', 'stints', 'weather'
        ]

        for session in completed_sessions:
            session_key = session['_id']
            print(f"\nProcessing session: {session.get('session_name', 'N/A')} (Key: {session_key})")
            
            # Clear existing data for this session to avoid duplicates
            for endpoint in session_endpoints:
                collection_name = endpoint
                if endpoint == 'pit': collection_name = 'pit_stops'
                if endpoint == 'session_result': collection_name = 'session_results'
                if endpoint != 'drivers': # Don't clear master driver list
                    db[collection_name].delete_many({'session_key': session_key})

            # Fetch new data for this session
            for endpoint in session_endpoints:
                time.sleep(0.1) # Be kind to the API
                collection_name = endpoint
                if endpoint == 'pit': collection_name = 'pit_stops'
                if endpoint == 'session_result': collection_name = 'session_results'

                data = fetch_data(endpoint, {'session_key': session_key})
                if data:
                    if endpoint == 'drivers':
                        driver_updates = [ReplaceOne({'_id': d['driver_number']}, {**d, '_id': d['driver_number']}, upsert=True) for d in data]
                        if driver_updates:
                            db.drivers.bulk_write(driver_updates, ordered=False)
                            print(f"  -> Upserted {len(driver_updates)} drivers.")
                    else:
                        db[collection_name].insert_many(data, ordered=False)
                        print(f"  -> Stored {len(data)} documents in '{collection_name}'")

        print("\nData population complete!")

    except Exception as e:
        print(f"\nAn unexpected high-level error occurred: {e}")
    finally:
        client.close()
        print("MongoDB connection closed.")


if __name__ == '__main__':
    populate_all_data()
