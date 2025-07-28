# backend/app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
import json

app = Flask(__name__)
# Be more explicit about which routes are open and to whom
CORS(app, resources={r"/api/*": {"origins": "*"}})


# --- Database Connection ---
# The MongoDB connection string will be loaded from an environment variable
MONGO_URI = os.environ.get('MONGO_URI')
if not MONGO_URI:
    raise Exception("MONGO_URI environment variable not set!")

DB_NAME = 'f1_data'
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def parse_json(data):
    """Helper function to convert MongoDB BSON to JSON."""
    return json.loads(json_util.dumps(data))

@app.route('/api/status')
def get_status():
    """API endpoint to check if the service is running."""
    return jsonify({'status': 'ok'})

# --- Existing Endpoints (for the main dashboard) ---

@app.route('/api/meetings')
def get_all_meetings():
    """API endpoint to get all stored meetings, ordered by date."""
    meetings = list(db.meetings.find().sort([('year', -1), ('date_start', -1)]))
    return jsonify(parse_json(meetings))

# --- NEW, More Specific Endpoints ---

@app.route('/api/meetings/<int:meeting_key>')
def get_meeting_details(meeting_key):
    """Fetches details for a single meeting by its key."""
    meeting = db.meetings.find_one({'_id': meeting_key})
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404
    return jsonify(parse_json(meeting))

@app.route('/api/meetings/<int:meeting_key>/sessions')
def get_sessions_for_meeting(meeting_key):
    """
    Fetches all sessions for a specific meeting.
    Optionally filters by session type (e.g., 'Race', 'Qualifying').
    """
    session_type_filter = request.args.get('type') # e.g., /sessions?type=Race

    query = {'meeting_key': meeting_key}
    if session_type_filter:
        query['session_name'] = {'$regex': f'^{session_type_filter}$', '$options': 'i'}

    sessions = list(db.sessions.find(query).sort('date_start', -1))
    
    if not sessions:
        return jsonify({"error": f"No sessions found for meeting {meeting_key}" + (f" of type {session_type_filter}" if session_type_filter else "")}), 404

    return jsonify(parse_json(sessions))

# --- NEW ENDPOINT TO FETCH A SINGLE SESSION ---
@app.route('/api/sessions/<int:session_key>')
def get_session_details(session_key):
    """Fetches details for a single session by its key."""
    session = db.sessions.find_one({'_id': session_key})
    if not session:
        return jsonify({"error": "Session not found"}), 404
    return jsonify(parse_json(session))


# --- Lap and Driver Endpoints (no changes needed here for now) ---

@app.route('/api/laps')
def get_laps():
    """API endpoint to get lap data for a given session_key."""
    try:
        session_key = int(request.args.get('session_key'))
    except (TypeError, ValueError):
        return jsonify({"error": "A valid integer session_key is required"}), 400

    pipeline = [
        {'$match': {'session_key': session_key}},
        {'$lookup': {
            'from': 'drivers',
            'localField': 'driver_number',
            'foreignField': '_id',
            'as': 'driver_info'
        }},
        {'$unwind': '$driver_info'},
        {'$addFields': {
            'full_name': '$driver_info.full_name',
            'team_color': '$driver_info.team_color'
        }},
        {'$project': {'driver_info': 0}},
        {'$sort': {'lap_number': 1}}
    ]
    laps = list(db.laps.aggregate(pipeline))
    return jsonify(parse_json(laps))

@app.route('/api/drivers')
def get_drivers():
    """API endpoint to get drivers who participated in a given session."""
    try:
        session_key = int(request.args.get('session_key'))
    except (TypeError, ValueError):
        return jsonify({"error": "A valid integer session_key is required"}), 400

    distinct_driver_nums = db.laps.distinct('driver_number', {'session_key': session_key})
    drivers = list(db.drivers.find({'_id': {'$in': distinct_driver_nums}}).sort('team_name', 1))
    return jsonify(parse_json(drivers))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
