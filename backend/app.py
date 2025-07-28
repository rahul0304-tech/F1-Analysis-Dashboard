# backend/app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
import json

app = Flask(__name__)

# --- A more robust CORS configuration ---
CORS(app, resources={r"/api/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})


# --- Database Connection ---
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

# --- API Endpoints ---

@app.route('/api/meetings')
def get_all_meetings():
    meetings = list(db.meetings.find().sort([('year', -1), ('date_start', -1)]))
    return jsonify(parse_json(meetings))

@app.route('/api/meetings/<int:meeting_key>')
def get_meeting_details(meeting_key):
    meeting = db.meetings.find_one({'_id': meeting_key})
    if not meeting:
        return jsonify({"error": "Meeting not found"}), 404
    return jsonify(parse_json(meeting))

@app.route('/api/meetings/<int:meeting_key>/sessions')
def get_sessions_for_meeting(meeting_key):
    session_type_filter = request.args.get('type')
    query = {'meeting_key': meeting_key}
    if session_type_filter:
        query['session_name'] = {'$regex': f'^{session_type_filter}$', '$options': 'i'}
    sessions = list(db.sessions.find(query).sort('date_start', -1))
    if not sessions:
        return jsonify({"error": f"No sessions found for meeting {meeting_key}"}), 404
    return jsonify(parse_json(sessions))

@app.route('/api/sessions/<int:session_key>')
def get_session_details(session_key):
    session = db.sessions.find_one({'_id': session_key})
    if not session:
        return jsonify({"error": "Session not found"}), 404
    return jsonify(parse_json(session))

# --- NEW ENDPOINT FOR FINAL POSITIONS ---
@app.route('/api/sessions/<int:session_key>/positions')
def get_session_positions(session_key):
    """Gets the final classification/positions for a given race session."""
    pipeline = [
        {'$match': {'session_key': session_key}},
        {'$group': {
            '_id': '$driver_number',
            'max_lap': {'$max': '$lap_number'}
        }},
        {'$sort': {'max_lap': -1}},
        {'$lookup': {
            'from': 'drivers',
            'localField': '_id',
            'foreignField': '_id',
            'as': 'driver_info'
        }},
        {'$unwind': '$driver_info'},
        {'$project': {
            '_id': 0,
            'position': {'$rank': {}},
            'driver_number': '$_id',
            'full_name': '$driver_info.full_name',
            'team_name': '$driver_info.team_name',
            'team_color': '$driver_info.team_color',
            'laps_completed': '$max_lap'
        }}
    ]
    positions = list(db.laps.aggregate(pipeline))
    return jsonify(parse_json(positions))

@app.route('/api/laps')
def get_laps():
    """
    API endpoint to get lap data for a given session_key.
    Accepts an optional 'sort' query parameter.
    ?sort=fastest -> returns top 10 fastest laps
    """
    session_key_str = request.args.get('session_key')
    sort_order = request.args.get('sort')

    if not session_key_str:
        return jsonify({"error": "session_key query parameter is required"}), 400
    try:
        session_key = int(session_key_str)
        
        match_stage = {
            'session_key': session_key,
            'lap_duration': {'$ne': None}
        }

        sort_stage = {'lap_number': 1} # Default sort
        limit_stage = None

        if sort_order == 'fastest':
            sort_stage = {'lap_duration': 1} # Sort by fastest lap
            limit_stage = {'$limit': 10} # Limit to top 10

        pipeline = [
            {'$match': match_stage},
            {'$lookup': {'from': 'drivers', 'localField': 'driver_number', 'foreignField': '_id', 'as': 'driver_info'}},
            {'$unwind': '$driver_info'},
            {'$addFields': {'full_name': '$driver_info.full_name', 'team_color': '$driver_info.team_color'}},
            {'$project': {'driver_info': 0}},
            {'$sort': sort_stage}
        ]

        if limit_stage:
            pipeline.append(limit_stage)

        laps = list(db.laps.aggregate(pipeline))
        return jsonify(parse_json(laps))
    except (ValueError, TypeError):
        return jsonify({"error": "session_key must be a valid integer"}), 400

@app.route('/api/drivers')
def get_drivers():
    """API endpoint to get drivers who participated in a given session."""
    session_key_str = request.args.get('session_key')
    if not session_key_str:
        return jsonify({"error": "session_key query parameter is required"}), 400
    try:
        session_key = int(session_key_str)
        distinct_driver_nums = db.laps.distinct('driver_number', {'session_key': session_key})
        drivers = list(db.drivers.find({'_id': {'$in': distinct_driver_nums}}).sort('team_name', 1))
        return jsonify(parse_json(drivers))
    except (ValueError, TypeError):
        return jsonify({"error": "session_key must be a valid integer"}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
