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

def populate_all_data():
    """
    Main function to clear and re-ingest all historical F1 data.
    """
    try:
        print("--- Clearing existing data from MongoDB ---")
        db.meetings.delete_many({})
        db.sessions.delete_many({})
        db.laps.delete_many({})
        db.drivers.delete_many({})
        print("Existing data cleared successfully.")

        cutoff_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        cutoff_date_str = cutoff_utc.isoformat(timespec='seconds')
        print(f"\n--- Fetching new data for sessions completed before: {cutoff_date_str}Z ---")

        print("--- Fetching all meetings ---")
        meetings_response = requests.get(f"{OPENF1_API_BASE}/meetings")
        meetings_response.raise_for_status()
        meetings_data = meetings_response.json()
        
        if meetings_data:
            meetings_to_insert = [{**m, '_id': m['meeting_key']} for m in meetings_data]
            db.meetings.insert_many(meetings_to_insert, ordered=False)
            print(f"Stored {len(meetings_to_insert)} meetings.")

        print("\n--- Fetching and filtering sessions ---")
        all_meetings = list(db.meetings.find({}, {'_id': 1, 'meeting_name': 1}))
        sessions_to_insert = []
        for meeting in all_meetings:
            time.sleep(0.1)
            try:
                sessions_response = requests.get(f"{OPENF1_API_BASE}/sessions?meeting_key={meeting['_id']}")
                sessions_response.raise_for_status()
                for session in sessions_response.json():
                    if session.get('date_end') and session.get('date_end') < cutoff_date_str:
                        sessions_to_insert.append({**session, '_id': session['session_key']})
            except requests.exceptions.RequestException as e:
                print(f"Could not fetch sessions for meeting {meeting['_id']}: {e}")
        
        if sessions_to_insert:
            db.sessions.insert_many(sessions_to_insert, ordered=False)
            print(f"Stored {len(sessions_to_insert)} completed sessions.")

        print("\n--- Fetching laps and drivers for stored sessions ---")
        all_sessions = list(db.sessions.find({}, {'_id': 1, 'session_name': 1}))
        for session in all_sessions:
            session_key = session['_id']
            print(f"Processing session: {session['session_name']} (Key: {session_key})")
            time.sleep(0.2)
            
            drivers_response = requests.get(f"{OPENF1_API_BASE}/drivers?session_key={session_key}")
            if drivers_response.ok:
                drivers_data = drivers_response.json()
                if drivers_data:
                    driver_updates = [ReplaceOne({'_id': d['driver_number']}, {**d, '_id': d['driver_number']}, upsert=True) for d in drivers_data]
                    db.drivers.bulk_write(driver_updates, ordered=False)
                    print(f"  -> Upserted {len(drivers_data)} drivers.")
            
            laps_response = requests.get(f"{OPENF1_API_BASE}/laps?session_key={session_key}")
            if laps_response.ok:
                laps_data = laps_response.json()
                if laps_data:
                    # THE FIX: Ensure all relevant fields, especially 'position' and 'date', are included.
                    # We are now inserting the full lap document from the API.
                    db.laps.insert_many(laps_data, ordered=False)
                    print(f"  -> Inserted {len(laps_data)} laps with full data.")

        print("\nData population complete!")

    except Exception as e:
        print(f"\nAn unexpected error occurred during data ingestion: {e}")
    finally:
        client.close()
        print("MongoDB connection closed.")


if __name__ == '__main__':
    populate_all_data()
