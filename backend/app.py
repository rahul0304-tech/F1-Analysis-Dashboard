# backend/app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
import json
import logging

# --- Setup ---
app = Flask(__name__)
# Using the simplest, most permissive CORS setup for maximum compatibility.
CORS(app) 
logging.basicConfig(level=logging.INFO)


# --- Database Connection ---
MONGO_URI = os.environ.get('MONGO_URI')
if not MONGO_URI:
    logging.error("FATAL: MONGO_URI environment variable not set!")
    raise Exception("MONGO_URI environment variable not set!")

DB_NAME = 'f1_data'
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def parse_json(data):
    """Helper function to convert MongoDB BSON to JSON."""
    return json.loads(json_util.dumps(data))

# --- API Endpoints with Robust Error Handling ---

@app.route('/api/status')
def get_status():
    """API endpoint to check if the service is running."""
    return jsonify({'status': 'ok', 'message': 'F1 API is running.'})

@app.route('/api/meetings')
def get_all_meetings():
    try:
        meetings = list(db.meetings.find().sort([('year', -1), ('date_start', -1)]))
        return jsonify(parse_json(meetings))
    except Exception as e:
        logging.error(f"Error in /api/meetings: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/meetings/<int:meeting_key>')
def get_meeting_details(meeting_key):
    try:
        meeting = db.meetings.find_one({'_id': meeting_key})
        if not meeting:
            return jsonify({"error": "Meeting not found"}), 404
        return jsonify(parse_json(meeting))
    except Exception as e:
        logging.error(f"Error in /api/meetings/{meeting_key}: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/meetings/<int:meeting_key>/sessions')
def get_sessions_for_meeting(meeting_key):
    try:
        session_type_filter = request.args.get('type')
        query = {'meeting_key': meeting_key}
        if session_type_filter:
            query['session_name'] = {'$regex': f'^{session_type_filter}$', '$options': 'i'}
        
        sessions = list(db.sessions.find(query).sort('date_start', -1))
        return jsonify(parse_json(sessions))
    except Exception as e:
        logging.error(f"Error in /api/meetings/{meeting_key}/sessions: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/sessions/<int:session_key>')
def get_session_details(session_key):
    try:
        session = db.sessions.find_one({'_id': session_key})
        if not session:
            return jsonify({"error": "Session not found"}), 404
        return jsonify(parse_json(session))
    except Exception as e:
        logging.error(f"Error in /api/sessions/{session_key}: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/sessions/<int:session_key>/positions')
def get_session_positions(session_key):
    try:
        # THE FIX: A simpler, more reliable pipeline to determine finishing order.
        pipeline = [
            # 1. Match all laps for the session
            {'$match': {'session_key': session_key}},
            # 2. Sort by lap number to easily find the last lap for each driver
            {'$sort': {'lap_number': -1}},
            # 3. Group by driver to get their last lap's data
            {'$group': {
                '_id': '$driver_number',
                'laps_completed': {'$first': '$lap_number'},
                'final_position_on_lap': {'$first': '$position'}
            }},
            # 4. Sort by who completed the most laps, then by their final position
            {'$sort': {
                'laps_completed': -1,
                'final_position_on_lap': 1
            }},
            # 5. Join with driver details
            {'$lookup': {
                'from': 'drivers',
                'localField': '_id',
                'foreignField': '_id',
                'as': 'driver_info'
            }},
            {'$unwind': '$driver_info'},
            # 6. Project the necessary fields, the rank will be added in Python
            {'$project': {
                '_id': 0,
                'driver_number': '$_id',
                'full_name': '$driver_info.full_name',
                'team_name': '$driver_info.team_name',
                'team_color': '$driver_info.team_color',
                'laps_completed': '$laps_completed'
            }}
        ]
        
        results = list(db.laps.aggregate(pipeline))
        
        # 7. Add the position number in Python for 100% reliability
        final_positions = []
        for i, driver_data in enumerate(results):
            driver_data['position'] = i + 1
            final_positions.append(driver_data)
            
        return jsonify(parse_json(final_positions))
        
    except Exception as e:
        logging.error(f"Error in /api/sessions/{session_key}/positions: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/api/laps')
def get_laps():
    try:
        session_key = int(request.args.get('session_key'))
        sort_order = request.args.get('sort')
        
        match_stage = {'session_key': session_key, 'lap_duration': {'$ne': None}}
        
        if sort_order == 'fastest':
            pipeline = [
                {'$match': match_stage},
                {'$sort': {'lap_duration': 1}},
                {'$group': {
                    '_id': '$driver_number',
                    'fastest_lap_duration': {'$first': '$lap_duration'},
                    'lap_number': {'$first': '$lap_number'}
                }},
                {'$sort': {'fastest_lap_duration': 1}},
                {'$limit': 10},
                {'$lookup': {
                    'from': 'drivers', 'localField': '_id', 'foreignField': '_id', 'as': 'driver_info'
                }},
                {'$unwind': '$driver_info'},
                {'$project': {
                    '_id': 0, 'driver_number': '$_id', 'full_name': '$driver_info.full_name',
                    'team_name': '$driver_info.team_name', 'team_color': '$driver_info.team_color',
                    'lap_duration': '$fastest_lap_duration', 'lap_number': '$lap_number'
                }}
            ]
        else:
            # Default behavior to get all laps
            pipeline = [
                {'$match': match_stage},
                {'$lookup': {'from': 'drivers', 'localField': 'driver_number', 'foreignField': '_id', 'as': 'driver_info'}},
                {'$unwind': '$driver_info'},
                {'$addFields': {'full_name': '$driver_info.full_name', 'team_color': '$driver_info.team_color', 'team_name': '$driver_info.team_name'}},
                {'$project': {'driver_info': 0}},
                {'$sort': {'lap_number': 1}}
            ]
        
        laps = list(db.laps.aggregate(pipeline))
        return jsonify(parse_json(laps))
    except (ValueError, TypeError):
        return jsonify({"error": "session_key must be a valid integer"}), 400
    except Exception as e:
        logging.error(f"Error in /api/laps: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/drivers')
def get_drivers():
    try:
        session_key = int(request.args.get('session_key'))
        distinct_driver_nums = db.laps.distinct('driver_number', {'session_key': session_key})
        drivers = list(db.drivers.find({'_id': {'$in': distinct_driver_nums}}).sort('team_name', 1))
        return jsonify(parse_json(drivers))
    except (ValueError, TypeError):
        return jsonify({"error": "session_key must be a valid integer"}), 400
    except Exception as e:
        logging.error(f"Error in /api/drivers: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

# --- LEGACY ENDPOINT (for original dashboard) ---
@app.route('/api/sessions')
def get_sessions_by_query():
    try:
        meeting_key = int(request.args.get('meeting_key'))
        sessions = list(db.sessions.find({'meeting_key': meeting_key}).sort('date_start', -1))
        return jsonify(parse_json(sessions))
    except (ValueError, TypeError):
        return jsonify({"error": "meeting_key must be a valid integer"}), 400
    except Exception as e:
        logging.error(f"Error in /api/sessions?meeting_key=...: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
