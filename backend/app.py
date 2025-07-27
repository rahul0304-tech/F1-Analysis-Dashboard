# backend/app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
import json

app = Flask(__name__)
CORS(app)

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

@app.route('/api/meetings')
def get_meetings():
    """API endpoint to get all stored meetings, ordered by date."""
    meetings = list(db.meetings.find().sort('date_start', -1))
    return jsonify(parse_json(meetings))

@app.route('/api/sessions')
def get_sessions():
    """API endpoint to get sessions for a given meeting_key."""
    try:
        meeting_key = int(request.args.get('meeting_key'))
    except (TypeError, ValueError):
        return jsonify({"error": "A valid integer meeting_key is required"}), 400
    
    sessions = list(db.sessions.find({'meeting_key': meeting_key}).sort('date_start', -1))
    return jsonify(parse_json(sessions))

@app.route('/api/laps')
def get_laps():
    """API endpoint to get lap data for a given session_key."""
    try:
        session_key = int(request.args.get('session_key'))
    except (TypeError, ValueError):
        return jsonify({"error": "A valid integer session_key is required"}), 400

    # MongoDB aggregation pipeline to join laps with drivers
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

    # Get distinct driver numbers from the laps collection for the session
    distinct_driver_nums = db.laps.distinct('driver_number', {'session_key': session_key})
    
    # Find all driver documents that match the distinct numbers
    drivers = list(db.drivers.find({'_id': {'$in': distinct_driver_nums}}).sort('team_name', 1))
    return jsonify(parse_json(drivers))

if __name__ == '__main__':
    # Gunicorn will be used in production, this is for local testing
    app.run(debug=True, port=5000)
