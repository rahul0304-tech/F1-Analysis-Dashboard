# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

DATABASE = 'f1_data.db'
# This will hold the status of the data ingestion process
ingestion_status = {'is_running': False}

def get_db_connection():
    """Establishes a connection to the database."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # This allows access to columns by name
    return conn

def init_db():
    """Initializes the SQLite database schema if it doesn't exist."""
    if not os.path.exists(DATABASE):
        print("Database not found. Initializing a new one.")
        conn = get_db_connection()
        cursor = conn.cursor()
        # Create tables
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
        # Create a table to store metadata like last update time
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')
        conn.commit()
        conn.close()
        print("Database initialized successfully.")

@app.route('/api/status')
def get_status():
    """API endpoint to check the status of data ingestion."""
    conn = get_db_connection()
    cursor = conn.cursor()
    last_update_row = cursor.execute("SELECT value FROM metadata WHERE key = 'last_update_utc'").fetchone()
    conn.close()
    
    last_update = last_update_row['value'] if last_update_row else None
    
    return jsonify({
        'is_ingesting': ingestion_status['is_running'],
        'last_update_utc': last_update
    })

@app.route('/api/meetings')
def get_meetings():
    """API endpoint to get all stored meetings, ordered by date."""
    conn = get_db_connection()
    meetings = conn.execute('SELECT * FROM meetings ORDER BY date_start DESC').fetchall()
    conn.close()
    return jsonify([dict(row) for row in meetings])

@app.route('/api/sessions')
def get_sessions():
    """API endpoint to get sessions for a given meeting_key."""
    meeting_key = request.args.get('meeting_key')
    if not meeting_key:
        return jsonify({"error": "meeting_key is required"}), 400
    
    conn = get_db_connection()
    sessions = conn.execute(
        'SELECT * FROM sessions WHERE meeting_key = ? ORDER BY date_start DESC', 
        (meeting_key,)
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in sessions])

@app.route('/api/laps')
def get_laps():
    """API endpoint to get lap data for a given session_key."""
    session_key = request.args.get('session_key')
    if not session_key:
        return jsonify({"error": "session_key is required"}), 400

    conn = get_db_connection()
    # Join laps with drivers to get driver info (full_name, team_color)
    laps = conn.execute('''
        SELECT l.*, d.full_name, d.team_color 
        FROM laps l 
        JOIN drivers d ON l.driver_number = d.driver_number 
        WHERE l.session_key = ? 
        ORDER BY l.lap_number
    ''', (session_key,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in laps])

@app.route('/api/drivers')
def get_drivers():
    """API endpoint to get all drivers, or drivers for a given session if session_key is provided."""
    session_key = request.args.get('session_key')
    conn = get_db_connection()
    
    if session_key:
        # Get distinct drivers from the laps table for the given session
        drivers = conn.execute('''
            SELECT DISTINCT d.driver_number, d.full_name, d.team_name, d.team_color
            FROM drivers d
            JOIN laps l ON d.driver_number = l.driver_number
            WHERE l.session_key = ?
            ORDER BY d.team_name, d.full_name
        ''', (session_key,)).fetchall()
    else:
        # Get all drivers if no session_key is provided
        drivers = conn.execute('''
            SELECT driver_number, full_name, team_name, team_color
            FROM drivers
            ORDER BY team_name, full_name
        ''').fetchall()
            
    conn.close()
    return jsonify([dict(row) for row in drivers])

@app.route('/api/drivers/<int:driver_number>')
def get_driver_detail(driver_number):
    conn = get_db_connection()
    driver = conn.execute('SELECT driver_number, full_name, team_name, team_color FROM drivers WHERE driver_number = ?', (driver_number,)).fetchone()
    conn.close()
    if driver:
        return jsonify(dict(driver))
    else:
        return jsonify({"error": "Driver not found"}), 404

@app.route('/api/laps/driver')
def get_laps_by_driver():
    """API endpoint to get lap data for a specific driver in a given session."""
    session_key = request.args.get('session_key')
    driver_number = request.args.get('driver_number')
    if not session_key or not driver_number:
        return jsonify({"error": "session_key and driver_number are required"}), 400

    conn = get_db_connection()
    laps = conn.execute('''
        SELECT l.*, d.full_name, d.team_color
        FROM laps l
        JOIN drivers d ON l.driver_number = d.driver_number
        WHERE l.session_key = ? AND l.driver_number = ?
        ORDER BY l.lap_number
    ''', (session_key, driver_number)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in laps])

@app.route('/api/sessions/fastest_laps')
def get_fastest_laps_per_session():
    """API endpoint to get the fastest lap for each driver in a given session."""
    session_key = request.args.get('session_key')
    if not session_key:
        return jsonify({"error": "session_key is required"}), 400

    conn = get_db_connection()
    fastest_laps = conn.execute('''
        SELECT
            d.full_name,
            d.team_name,
            d.team_color,
            MIN(l.lap_duration) AS fastest_lap_time
        FROM laps l
        JOIN drivers d ON l.driver_number = d.driver_number
        WHERE l.session_key = ?
        GROUP BY d.driver_number, d.full_name, d.team_name, d.team_color
        ORDER BY fastest_lap_time ASC
    ''', (session_key,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in fastest_laps])

@app.route('/api/sessions/team_performance')
def get_team_performance_by_session():
    """API endpoint to get average lap times per team for a given session."""
    session_key = request.args.get('session_key')
    if not session_key:
        return jsonify({"error": "session_key is required"}), 400

    conn = get_db_connection()
    team_performance = conn.execute('''
        SELECT
            d.team_name,
            d.team_color,
            AVG(l.lap_duration) AS average_lap_time,
            COUNT(l.lap_id) AS total_laps
        FROM laps l
        JOIN drivers d ON l.driver_number = d.driver_number
        WHERE l.session_key = ?
        GROUP BY d.team_name, d.team_color
        ORDER BY average_lap_time ASC
    ''', (session_key,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in team_performance])

@app.route('/api/meeting/<int:meeting_key>')
def get_single_meeting_details(meeting_key):
    """API endpoint to get details for a specific meeting."""
    conn = get_db_connection()
    meeting = conn.execute('SELECT * FROM meetings WHERE meeting_key = ?', (meeting_key,)).fetchone()
    conn.close()
    if meeting:
        return jsonify(dict(meeting))
    return jsonify({"error": "Meeting not found"}), 404

@app.route('/api/driver/<int:driver_number>')
def get_driver_career_overview(driver_number):
    """API endpoint to get all historical data for a specific driver."""
    conn = get_db_connection()
    # Get driver details
    driver_info = conn.execute('SELECT * FROM drivers WHERE driver_number = ?', (driver_number,)).fetchone()
    if not driver_info:
        conn.close()
        return jsonify({"error": "Driver not found"}), 404

    # Get all laps for the driver, joined with session and meeting info
    career_laps = conn.execute('''
        SELECT
            l.*,
            s.session_name,
            s.session_type,
            m.meeting_name,
            m.year,
            m.circuit_short_name
        FROM laps l
        JOIN sessions s ON l.session_key = s.session_key
        JOIN meetings m ON s.meeting_key = m.meeting_key
        WHERE l.driver_number = ?
        ORDER BY m.date_start DESC, s.date_start DESC, l.lap_number ASC
    ''', (driver_number,)).fetchall()
    conn.close()

    return jsonify({
        'driver_info': dict(driver_info),
        'career_laps': [dict(row) for row in career_laps]
    })

@app.route('/api/sessions/tyre_analysis')
def get_tyre_analysis():
    """API endpoint to analyze lap times by tyre compound and stint for a given session."""
    session_key = request.args.get('session_key')
    if not session_key:
        return jsonify({"error": "session_key is required"}), 400

    conn = get_db_connection()
    tyre_data = conn.execute('''
        SELECT
            l.tyre_compound,
            l.stint,
            AVG(l.lap_duration) AS average_lap_duration,
            MIN(l.lap_duration) AS fastest_lap_duration,
            COUNT(l.lap_id) AS total_laps_on_compound
        FROM laps l
        WHERE l.session_key = ?
        GROUP BY l.tyre_compound, l.stint
        ORDER BY l.stint ASC, l.tyre_compound ASC
    ''', (session_key,)).fetchall()
    conn.close()
    return jsonify([dict(row) for row in tyre_data])

if __name__ == '__main__':
    init_db()  # Ensure the database and tables exist before starting
    print("Starting Flask backend on http://127.0.0.1:5000")
    # Use a production-ready server like Waitress instead of Flask's built-in dev server
    # For development, app.run() is fine.
    app.run(debug=True, port=5000)
