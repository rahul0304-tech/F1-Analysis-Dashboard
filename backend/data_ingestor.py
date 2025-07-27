# backend/data_ingestor.py
import os
import requests
import time
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient, ReplaceOne

# --- Configuration ---
# The MongoDB connection string will be loaded from an environment variable
MONGO_URI = os.environ.get('MONGO_URI')
if not MONGO_URI:
    raise Exception("MONGO_URI environment variable not set!")

DB_NAME = 'f1_data'
OPENF1_API_BASE = 'https://api.openf1.org/v1'

# --- Database Connection ---
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def populate_all_data():
    """
    Main function to clear and re-ingest all historical F1 data from the
    OpenF1 API up to yesterday, storing it in MongoDB.
    """
    try:
        # 1. Clear existing collections for a fresh start
        print("--- Clearing existing data from MongoDB ---")
        db.meetings.delete_many({})
        db.sessions.delete_many({})
        db.laps.delete_many({})
        db.drivers.delete_many({})
        print("Existing data cleared successfully.")

        # 2. Calculate the cutoff date (yesterday in UTC)
        yesterday_utc = datetime.now(timezone.utc) - timedelta(days=1)
        yesterday_date_str = yesterday_utc.isoformat(timespec='seconds')
        print(f"\n--- Fetching new data for sessions completed before: {yesterday_date_str}Z ---")

        # 3. Fetch and store ALL meetings
        print("--- Fetching all meetings ---")
        meetings_response = requests.get(f"{OPENF1_API_BASE}/meetings")
        meetings_response.raise_for_status()
        meetings_data = meetings_response.json()
        
        if meetings_data:
            # Prepare data for MongoDB, using meeting_key as the unique _id
            meetings_to_insert = [{**m, '_id': m['meeting_key']} for m in meetings_data]
            db.meetings.insert_many(meetings_to_insert, ordered=False)
            print(f"Stored {len(meetings_to_insert)} meetings in total.")

        # 4. Fetch and filter sessions
        print("\n--- Fetching and filtering sessions ---")
        all_meetings = list(db.meetings.find({}, {'_id': 1, 'meeting_name': 1}))
        sessions_to_insert = []
        for meeting in all_meetings:
            time.sleep(0.1)
            try:
                sessions_response = requests.get(f"{OPENF1_API_BASE}/sessions?meeting_key={meeting['_id']}")
                sessions_response.raise_for_status()
                for session in sessions_response.json():
                    if session.get('date_end') and session.get('date_end') < yesterday_date_str:
                        # Prepare data for MongoDB, using session_key as the unique _id
                        sessions_to_insert.append({**session, '_id': session['session_key']})
            except requests.exceptions.RequestException as e:
                print(f"Could not fetch sessions for meeting {meeting['_id']}: {e}")
        
        if sessions_to_insert:
            db.sessions.insert_many(sessions_to_insert, ordered=False)
            print(f"Stored {len(sessions_to_insert)} completed sessions.")

        # 5. Fetch laps and drivers for stored sessions
        print("\n--- Fetching laps and drivers for stored sessions ---")
        all_sessions = list(db.sessions.find({}, {'_id': 1, 'session_name': 1}))
        for session in all_sessions:
            session_key = session['_id']
            print(f"Processing session: {session['session_name']} (Key: {session_key})")
            time.sleep(0.2)
            
            # Fetch drivers
            drivers_response = requests.get(f"{OPENF1_API_BASE}/drivers?session_key={session_key}")
            if drivers_response.ok:
                drivers_data = drivers_response.json()
                if drivers_data:
                    # Use ReplaceOne with upsert=True to add/update driver profiles
                    driver_updates = [ReplaceOne({'_id': d['driver_number']}, {**d, '_id': d['driver_number']}, upsert=True) for d in drivers_data]
                    db.drivers.bulk_write(driver_updates, ordered=False)
                    print(f"  -> Upserted {len(drivers_data)} drivers.")
            
            # Fetch laps
            laps_response = requests.get(f"{OPENF1_API_BASE}/laps?session_key={session_key}")
            if laps_response.ok:
                laps_data = laps_response.json()
                if laps_data:
                    db.laps.insert_many(laps_data, ordered=False)
                    print(f"  -> Inserted {len(laps_data)} laps.")

        print("\nData population complete!")

    except requests.exceptions.RequestException as e:
        print(f"\nAN ERROR OCCURRED: {e}")
        print("This could be a temporary API issue or a network problem.")
    except Exception as e:
        print(f"\nAn unexpected error occurred during data ingestion: {e}")
    finally:
        client.close()
        print("MongoDB connection closed.")


if __name__ == '__main__':
    populate_all_data()
