# backend/data_ingestor.py
import requests
import sqlite3
import time
from datetime import datetime, timedelta, timezone

# --- Configuration ---
DATABASE = 'f1_data.db'
OPENF1_API_BASE = 'https://api.openf1.org/v1'
# A global variable to be managed by the main execution block
ingestion_status = {'is_running': False} 

def get_db_connection():
    """Establishes a connection to the database."""
    conn = sqlite3.connect(DATABASE)
    return conn

def init_db():
    """Initializes the database and creates tables if they don't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    print("--- Initializing database schema ---")
    # Create tables if they don't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meetings (
            meeting_key INTEGER PRIMARY KEY,
            meeting_name TEXT,
            circuit_key INTEGER,
            circuit_short_name TEXT,
            location TEXT,
            country_name TEXT,
            year INTEGER,
            date_start TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            session_key INTEGER PRIMARY KEY,
            meeting_key INTEGER,
            session_name TEXT,
            session_type TEXT,
            date_start TEXT,
            date_end TEXT,
            FOREIGN KEY (meeting_key) REFERENCES meetings(meeting_key)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS laps (
            lap_id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_key INTEGER,
            driver_number INTEGER,
            lap_number INTEGER,
            lap_duration REAL,
            is_pit_out_lap BOOLEAN,
            stint INTEGER,
            tyre_compound TEXT,
            FOREIGN KEY (session_key) REFERENCES sessions(session_key)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drivers (
            driver_number INTEGER PRIMARY KEY,
            full_name TEXT,
            first_name TEXT,
            last_name TEXT,
            country_code TEXT,
            team_name TEXT,
            team_color TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("Database schema is ready.")

def clear_all_data(conn):
    """Clears all data from the tables to prepare for a fresh ingest."""
    print("--- Clearing existing data from database ---")
    cursor = conn.cursor()
    # The order matters due to foreign key constraints
    cursor.execute('DELETE FROM laps')
    cursor.execute('DELETE FROM sessions')
    cursor.execute('DELETE FROM meetings')
    cursor.execute('DELETE FROM drivers')
    cursor.execute('DELETE FROM metadata')
    conn.commit()
    print("Existing data cleared successfully.")

def update_metadata(conn, key, value):
    """Updates a key-value pair in the metadata table."""
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", (key, value))
    conn.commit()

def populate_all_data():
    """
    Main function to initialize, clear, and re-ingest all historical F1 data
    from the OpenF1 API up to yesterday.
    """
    global ingestion_status
    if ingestion_status['is_running']:
        print("Ingestion is already in progress. Skipping.")
        return

    ingestion_status['is_running'] = True
    
    # Ensure the database and tables exist before doing anything else
    init_db()
    
    conn = get_db_connection()
    
    try:
        # 1. Clear all existing data for a fresh start
        clear_all_data(conn)
        
        # 2. Calculate the cutoff date (yesterday in UTC)
        yesterday_utc = datetime.now(timezone.utc) - timedelta(days=1)
        yesterday_date_str = yesterday_utc.isoformat(timespec='seconds')
        print(f"\n--- Fetching new data for sessions completed before: {yesterday_date_str}Z ---")

        # 3. Fetch and store ALL meetings. This is our first API call.
        # If this fails, the API is likely locked for a live event.
        print("--- Fetching all meetings ---")
        meetings_response = requests.get(f"{OPENF1_API_BASE}/meetings")
        meetings_response.raise_for_status() # Will raise an error if status is 4xx or 5xx
        meetings_data = meetings_response.json()
        
        cursor = conn.cursor()
        for meeting in meetings_data:
            cursor.execute('''
                INSERT OR IGNORE INTO meetings (
                    meeting_key, meeting_name, circuit_key, circuit_short_name,
                    location, country_name, year, date_start
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                meeting.get('meeting_key'), meeting.get('meeting_name'),
                meeting.get('circuit_key'), meeting.get('circuit_short_name'),
                meeting.get('location'), meeting.get('country_name'),
                meeting.get('year'), meeting.get('date_start')
            ))
        conn.commit()
        print(f"Stored {len(meetings_data)} meetings in total.")

        # 4. Fetch sessions for each meeting and filter them by the 'yesterday' cutoff date
        print("\n--- Fetching and filtering sessions for all meetings ---")
        meetings_in_db = conn.execute('SELECT meeting_key, meeting_name FROM meetings').fetchall()
        
        for row in meetings_in_db:
            meeting_key, meeting_name = row[0], row[1]
            time.sleep(0.1) # Be kind to the API
            try:
                sessions_response = requests.get(f"{OPENF1_API_BASE}/sessions?meeting_key={meeting_key}")
                sessions_response.raise_for_status()
                sessions_data = sessions_response.json()
                
                stored_count = 0
                for session in sessions_data:
                    # THE CRITICAL FILTER: Only add sessions that have an end date and ended before our cutoff time
                    if session.get('date_end') and session.get('date_end') < yesterday_date_str:
                        cursor.execute('''
                            INSERT OR IGNORE INTO sessions (
                                session_key, meeting_key, session_name, session_type,
                                date_start, date_end
                            ) VALUES (?, ?, ?, ?, ?, ?)
                        ''', (
                            session.get('session_key'), session.get('meeting_key'),
                            session.get('session_name'), session.get('session_type'),
                            session.get('date_start'), session.get('date_end')
                        ))
                        stored_count += 1
                conn.commit()
                if stored_count > 0:
                    print(f"Stored {stored_count} completed sessions for meeting: {meeting_name}")

            except requests.exceptions.RequestException as e:
                print(f"Could not fetch sessions for meeting {meeting_key} ({meeting_name}): {e}")

        # 5. Fetch laps and drivers ONLY for the sessions we stored in the DB
        print("\n--- Fetching laps and drivers for stored, completed sessions ---")
        sessions_in_db = conn.execute('SELECT session_key, session_name FROM sessions').fetchall()
        
        if not sessions_in_db:
            print("No completed sessions found in DB. Cannot fetch laps/drivers.")
        else:
            for session_row in sessions_in_db:
                session_key, session_name = session_row[0], session_row[1]
                print(f"Processing session: {session_name} (Key: {session_key})")
                time.sleep(0.2) # Be kind to the API
                
                # Fetch and store drivers for the session
                try:
                    drivers_response = requests.get(f"{OPENF1_API_BASE}/drivers?session_key={session_key}")
                    drivers_response.raise_for_status()
                    drivers_data = drivers_response.json()
                    for driver in drivers_data:
                        cursor.execute('''
                            INSERT OR IGNORE INTO drivers (
                                driver_number, full_name, first_name, last_name,
                                country_code, team_name, team_color
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            driver.get('driver_number'), driver.get('full_name'),
                            driver.get('first_name'), driver.get('last_name'),
                            driver.get('country_code'), driver.get('team_name'),
                            driver.get('team_color')
                        ))
                    conn.commit()
                    print(f"  -> Stored {len(drivers_data)} drivers.")
                except requests.exceptions.RequestException as e:
                    print(f"  -> Could not fetch drivers for session {session_key}: {e}")

                # Fetch and store laps for the session
                try:
                    laps_response = requests.get(f"{OPENF1_API_BASE}/laps?session_key={session_key}")
                    laps_response.raise_for_status()
                    laps_data = laps_response.json()
                    for lap in laps_data:
                        cursor.execute('''
                            INSERT OR IGNORE INTO laps (
                                session_key, driver_number, lap_number, lap_duration,
                                is_pit_out_lap, stint, tyre_compound
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            lap.get('session_key'), lap.get('driver_number'),
                            lap.get('lap_number'), lap.get('lap_duration'),
                            lap.get('is_pit_out_lap'), lap.get('stint'),
                            lap.get('tyre_compound')
                        ))
                    conn.commit()
                    print(f"  -> Stored {len(laps_data)} laps.")
                except requests.exceptions.RequestException as e:
                    print(f"  -> Could not fetch laps for session {session_key}: {e}")
        
        # 6. Update metadata with the completion time
        update_metadata(conn, 'last_update_utc', datetime.now(timezone.utc).isoformat())
        print("\nData population complete!")

    except requests.exceptions.RequestException as e:
        print(f"\nAN ERROR OCCURRED: {e}")
        print("\nThis likely means the OpenF1 API is temporarily locked for a live race session.")
        print("Please try running the script again a few hours after the race concludes.")
    except Exception as e:
        print(f"\nAn unexpected error occurred during data ingestion: {e}")
    finally:
        ingestion_status['is_running'] = False
        conn.close()


if __name__ == '__main__':
    # This block runs when you execute `python data_ingestor.py`
    populate_all_data()
