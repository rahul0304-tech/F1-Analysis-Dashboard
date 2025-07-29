# backend/app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util
import json
import logging
from datetime import datetime

# --- Setup ---
app = Flask(__name__)
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

# --- NEW POWERFUL ANALYSIS ENDPOINT ---
@app.route('/api/analysis')
def get_analysis():
    try:
        analysis_type = request.args.get('type')
        driver_ids_str = request.args.get('drivers')
        driver_ids = [int(num) for num in driver_ids_str.split(',')] if driver_ids_str else []

        if not analysis_type or not driver_ids:
            return jsonify({"error": "type and drivers parameters are required"}), 400

        # --- Career Stats Analysis ---
        if analysis_type == 'career':
            results = []
            for driver_id in driver_ids:
                wins = db.session_results.count_documents({'driver_number': driver_id, 'position': 1, 'session_name': 'Race'})
                podiums = db.session_results.count_documents({'driver_number': driver_id, 'position': {'$lte': 3}, 'session_name': 'Race'})
                poles = db.session_results.count_documents({'driver_number': driver_id, 'position': 1, 'session_name': 'Qualifying'})
                results.append({
                    'driver_number': driver_id,
                    'wins': wins,
                    'podiums': podiums,
                    'poles': poles
                })
            return jsonify(parse_json(results))

        # --- Season Stats Analysis ---
        elif analysis_type == 'season':
            year_str = request.args.get('year')
            if not year_str:
                return jsonify({"error": "year parameter is required for season analysis"}), 400
            year = int(year_str)
            
            results = []
            for driver_id in driver_ids:
                wins = db.session_results.count_documents({'driver_number': driver_id, 'position': 1, 'session_name': 'Race', 'year': year})
                podiums = db.session_results.count_documents({'driver_number': driver_id, 'position': {'$lte': 3}, 'session_name': 'Race', 'year': year})
                results.append({
                    'driver_number': driver_id,
                    'year': year,
                    'wins': wins,
                    'podiums': podiums
                })
            return jsonify(parse_json(results))
        
        # --- Track Performance Analysis ---
        elif analysis_type == 'track':
            circuit_key_str = request.args.get('circuit_key')
            if not circuit_key_str:
                return jsonify({"error": "circuit_key parameter is required for track analysis"}), 400
            circuit_key = int(circuit_key_str)

            results = []
            for driver_id in driver_ids:
                pipeline = [
                    {'$match': {'driver_number': driver_id, 'circuit_key': circuit_key, 'lap_duration': {'$ne': None}}},
                    {'$sort': {'lap_duration': 1}},
                    {'$limit': 1},
                    {'$project': {'_id': 0, 'fastest_lap': '$lap_duration', 'year': '$year'}}
                ]
                best_lap = list(db.laps.aggregate(pipeline))
                results.append({
                    'driver_number': driver_id,
                    'circuit_key': circuit_key,
                    'best_lap_time': best_lap[0] if best_lap else None
                })
            return jsonify(parse_json(results))

        else:
            return jsonify({"error": "Invalid analysis type specified"}), 400

    except Exception as e:
        logging.error(f"Error in /api/analysis: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


# ... (rest of your existing app.py code)
# I have omitted the other endpoints for brevity. You should add the new /api/analysis endpoint to your existing file.

@app.route('/api/status')
def get_status():
    return jsonify({'status': 'ok', 'message': 'F1 API is running.'})

@app.route('/api/stats/season/<int:year>')
def get_season_stats(year):
    total_sessions = db.sessions.count_documents({'year': year})
    pipeline = [
        {'$match': {'year': year}},
        {'$lookup': {'from': 'session_results', 'localField': '_id', 'foreignField': 'session_key', 'as': 'results'}},
        {'$unwind': '$results'},
        {'$group': {'_id': '$results.driver_number'}}
    ]
    drivers = list(db.sessions.aggregate(pipeline))
    total_drivers = len(drivers)
    return jsonify({'year': year, 'total_sessions': total_sessions, 'total_drivers': total_drivers})

@app.route('/api/meetings')
def get_all_meetings():
    meetings = list(db.meetings.find().sort([('year', -1), ('date_start', -1)]))
    return jsonify(parse_json(meetings))

@app.route('/api/meetings/<int:meeting_key>')
def get_meeting_details(meeting_key):
    meeting = db.meetings.find_one({'_id': meeting_key})
    return jsonify(parse_json(meeting)) if meeting else (jsonify({"error": "Meeting not found"}), 404)

@app.route('/api/meetings/<int:meeting_key>/sessions')
def get_sessions_for_meeting(meeting_key):
    sessions = list(db.sessions.find({'meeting_key': meeting_key}).sort('date_start', -1))
    return jsonify(parse_json(sessions))

@app.route('/api/sessions/<int:session_key>')
def get_session_details(session_key):
    session = db.sessions.find_one({'_id': session_key})
    return jsonify(parse_json(session)) if session else (jsonify({"error": "Session not found"}), 404)

@app.route('/api/sessions/<int:session_key>/positions')
def get_session_positions(session_key):
    pipeline = [
        {'$match': {'session_key': session_key}},
        {'$addFields': {'is_finisher': {'$cond': { 'if': { '$eq': [ "$dnf", False ] }, 'then': 1, 'else': 2 }}}},
        {'$sort': {'is_finisher': 1, 'position': 1}},
        {'$lookup': {'from': 'drivers', 'localField': 'driver_number', 'foreignField': '_id', 'as': 'driver_info'}},
        {'$unwind': '$driver_info'},
        {'$project': {
            '_id': 0, 'position': '$position', 'driver_number': '$driver_number',
            'full_name': '$driver_info.full_name', 'team_name': '$driver_info.team_name',
            'team_color': '$driver_info.team_colour', 'laps_completed': '$number_of_laps',
            'headshot_url': '$driver_info.headshot_url', 'dnf': '$dnf'
        }}
    ]
    positions = list(db.session_results.aggregate(pipeline))
    return jsonify(parse_json(positions))

@app.route('/api/laps')
def get_laps():
    session_key = int(request.args.get('session_key'))
    sort_order = request.args.get('sort')
    match_stage = {'session_key': session_key, 'lap_duration': {'$ne': None}}
    if sort_order == 'fastest':
        pipeline = [
            {'$match': match_stage}, {'$sort': {'lap_duration': 1}},
            {'$group': {'_id': '$driver_number', 'fastest_lap_duration': {'$first': '$lap_duration'}, 'lap_number': {'$first': '$lap_number'}}},
            {'$sort': {'fastest_lap_duration': 1}}, {'$limit': 10},
            {'$lookup': {'from': 'drivers', 'localField': '_id', 'foreignField': '_id', 'as': 'driver_info'}},
            {'$unwind': '$driver_info'},
            {'$project': {'_id': 0, 'driver_number': '$_id', 'full_name': '$driver_info.full_name', 'team_name': '$driver_info.team_name', 'team_color': '$driver_info.team_colour', 'lap_duration': '$fastest_lap_duration', 'lap_number': '$lap_number'}}
        ]
    else:
        pipeline = [
            {'$match': match_stage},
            {'$lookup': {'from': 'drivers', 'localField': 'driver_number', 'foreignField': '_id', 'as': 'driver_info'}},
            {'$unwind': '$driver_info'},
            {'$addFields': {'full_name': '$driver_info.full_name', 'team_color': '$driver_info.team_colour', 'team_name': '$driver_info.team_name'}},
            {'$project': {'driver_info': 0}}, {'$sort': {'lap_number': 1}}
        ]
    laps = list(db.laps.aggregate(pipeline))
    return jsonify(parse_json(laps))

@app.route('/api/drivers/all')
def get_all_drivers():
    drivers = list(db.drivers.find().sort('full_name', 1))
    return jsonify(parse_json(drivers))

@app.route('/api/drivers')
def get_drivers_by_session():
    session_key = int(request.args.get('session_key'))
    distinct_driver_nums = db.session_results.distinct('driver_number', {'session_key': session_key})
    if not distinct_driver_nums:
        distinct_driver_nums = db.laps.distinct('driver_number', {'session_key': session_key})
    drivers = list(db.drivers.find({'_id': {'$in': distinct_driver_nums}}).sort('team_name', 1))
    return jsonify(parse_json(drivers))

if __name__ == '__main__':
    app.run(debug=True, port=5000)
