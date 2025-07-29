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

# --- API Endpoints ---

@app.route('/api/status')
def get_status():
    return jsonify({'status': 'ok', 'message': 'F1 API is running.'})

# --- Meetings Endpoints ---

@app.route('/api/meetings')
def get_all_meetings():
    try:
        # This pipeline ensures no duplicate meetings are returned
        pipeline = [
            {'$sort': {'date_start': -1}},
            {'$group': {
                '_id': {'year': '$year', 'meeting_name': '$meeting_name'},
                'doc': {'$first': '$$ROOT'}
            }},
            {'$replaceRoot': {'newRoot': '$doc'}},
            {'$sort': {'year': -1, 'date_start': -1}}
        ]
        meetings = list(db.meetings.aggregate(pipeline))
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

# --- NEW: Consolidated endpoint for MeetingDetailPage ---
@app.route('/api/meetings/<int:meeting_key>/details')
def get_meeting_details_consolidated(meeting_key):
    try:
        meeting = db.meetings.find_one({'_id': meeting_key})
        if not meeting:
            return jsonify({"error": "Meeting not found"}), 404
        
        sessions = list(db.sessions.find({'meeting_key': meeting_key}).sort('date_start', -1))
        
        winner = None
        race_session = next((s for s in sessions if s['session_name'].lower() == 'race'), None)
        if race_session:
            pipeline = [
                {'$match': {'session_key': race_session['_id'], 'position': 1}},
                {'$limit': 1},
                {'$lookup': {'from': 'drivers', 'localField': 'driver_number', 'foreignField': '_id', 'as': 'driver_info'}},
                {'$unwind': '$driver_info'},
                {'$project': {
                    '_id': 0, 'position': '$position', 'driver_number': '$driver_number',
                    'full_name': '$driver_info.full_name', 'team_name': '$driver_info.team_name',
                    'team_color': '$driver_info.team_colour', 'laps_completed': '$number_of_laps',
                    'headshot_url': '$driver_info.headshot_url', 'dnf': '$dnf'
                }}
            ]
            winner_data = list(db.session_results.aggregate(pipeline))
            if winner_data:
                winner = winner_data[0]
        
        response = {'meeting_details': meeting, 'sessions': sessions, 'winner': winner}
        return jsonify(parse_json(response))
    except Exception as e:
        logging.error(f"Error in /api/meetings/{meeting_key}/details: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

# --- Sessions Endpoints ---

@app.route('/api/meetings/<int:meeting_key>/sessions')
def get_sessions_for_meeting(meeting_key):
    try:
        query = {'meeting_key': meeting_key}
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

# --- NEW: Consolidated endpoint for SessionDetailPage ---
@app.route('/api/sessions/<int:session_key>/details')
def get_session_details_consolidated(session_key):
    try:
        session = db.sessions.find_one({'_id': session_key})
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        meeting = db.meetings.find_one({'_id': session['meeting_key']})
        
        positions_pipeline = [
            {'$match': {'session_key': session_key}},
            {'$addFields': {'is_finisher': {'$cond': {'if': {'$eq': ["$dnf", False]}, 'then': 1, 'else': 2}}}},
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
        positions = list(db.session_results.aggregate(positions_pipeline))
        
        laps_pipeline = [
            {'$match': {'session_key': session_key, 'lap_duration': {'$ne': None}}},
            {'$sort': {'lap_duration': 1}},
            {'$group': {
                '_id': '$driver_number', 'fastest_lap_duration': {'$first': '$lap_duration'},
                'lap_number': {'$first': '$lap_number'}
            }},
            {'$sort': {'fastest_lap_duration': 1}},
            {'$limit': 10},
            {'$lookup': {'from': 'drivers', 'localField': '_id', 'foreignField': '_id', 'as': 'driver_info'}},
            {'$unwind': '$driver_info'},
            {'$project': {
                '_id': 0, 'driver_number': '$_id', 'full_name': '$driver_info.full_name',
                'team_name': '$driver_info.team_name', 'team_color': '$driver_info.team_colour',
                'lap_duration': '$fastest_lap_duration', 'lap_number': '$lap_number'
            }}
        ]
        fastest_laps = list(db.laps.aggregate(laps_pipeline))
        
        response = {
            'session': session, 'meeting': meeting,
            'positions': positions, 'fastest_laps': fastest_laps
        }
        return jsonify(parse_json(response))
    except Exception as e:
        logging.error(f"Error in /api/sessions/{session_key}/details: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/sessions/<int:session_key>/positions')
def get_session_positions(session_key):
    try:
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
    except Exception as e:
        logging.error(f"Error in /api/sessions/{session_key}/positions: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

# --- Other Endpoints ---

@app.route('/api/laps')
def get_laps():
    try:
        session_key = int(request.args.get('session_key'))
        sort_order = request.args.get('sort')
        match_stage = {'session_key': session_key, 'lap_duration': {'$ne': None}}
        if sort_order == 'fastest':
            pipeline = [
                {'$match': match_stage}, {'$sort': {'lap_duration': 1}},
                {'$group': {
                    '_id': '$driver_number', 'fastest_lap_duration': {'$first': '$lap_duration'},
                    'lap_number': {'$first': '$lap_number'}
                }},
                {'$sort': {'fastest_lap_duration': 1}}, {'$limit': 10},
                {'$lookup': {'from': 'drivers', 'localField': '_id', 'foreignField': '_id', 'as': 'driver_info'}},
                {'$unwind': '$driver_info'},
                {'$project': {
                    '_id': 0, 'driver_number': '$_id', 'full_name': '$driver_info.full_name',
                    'team_name': '$driver_info.team_name', 'team_color': '$driver_info.team_colour',
                    'lap_duration': '$fastest_lap_duration', 'lap_number': '$lap_number'
                }}
            ]
        else:
            pipeline = [
                {'$match': match_stage},
                {'$lookup': {'from': 'drivers', 'localField': 'driver_number', 'foreignField': '_id', 'as': 'driver_info'}},
                {'$unwind': '$driver_info'},
                {'$addFields': {'full_name': '$driver_info.full_name', 'team_color': '$driver_info.team_colour', 'team_name': '$driver_info.team_name'}},
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

@app.route('/api/drivers/all')
def get_all_drivers():
    try:
        drivers = list(db.drivers.find().sort('full_name', 1))
        return jsonify(parse_json(drivers))
    except Exception as e:
        logging.error(f"Error in /api/drivers/all: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/drivers')
def get_drivers_by_session():
    try:
        session_key = int(request.args.get('session_key'))
        distinct_driver_nums = db.session_results.distinct('driver_number', {'session_key': session_key})
        if not distinct_driver_nums:
            distinct_driver_nums = db.laps.distinct('driver_number', {'session_key': session_key})
        drivers = list(db.drivers.find({'_id': {'$in': distinct_driver_nums}}).sort('team_name', 1))
        return jsonify(parse_json(drivers))
    except (ValueError, TypeError):
        return jsonify({"error": "session_key must be a valid integer"}), 400
    except Exception as e:
        logging.error(f"Error in /api/drivers: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

# --- The original endpoints from your file are preserved below ---
@app.route('/api/stats/season/<int:year>')
def get_season_stats(year):
    try:
        total_sessions = db.sessions.count_documents({'year': year})
        pipeline = [
            {'$match': {'year': year}},
            {'$lookup': {
                'from': 'session_results',
                'localField': '_id',
                'foreignField': 'session_key',
                'as': 'results'
            }},
            {'$unwind': '$results'},
            {'$group': {'_id': '$results.driver_number'}}
        ]
        drivers = list(db.sessions.aggregate(pipeline))
        total_drivers = len(drivers)

        return jsonify({
            'year': year,
            'total_sessions': total_sessions,
            'total_drivers': total_drivers
        })
    except Exception as e:
        logging.error(f"Error in /api/stats/season/{year}: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500
        
@app.route('/api/drivers/<int:driver_number>/stats')
def get_driver_stats(driver_number):
    try:
        wins = db.session_results.count_documents({
            'driver_number': driver_number,
            'position': 1,
            'session_name': 'Race'
        })
        stats = {
            'driver_number': driver_number,
            'grand_prix_victories': wins,
            'championships_won': 0 
        }
        return jsonify(parse_json(stats))
    except Exception as e:
        logging.error(f"Error in /api/drivers/{driver_number}/stats: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

@app.route('/api/sessions/<int:session_key>/compare')
def get_driver_comparison(session_key):
    try:
        driver_ids_str = request.args.get('drivers')
        if not driver_ids_str:
            return jsonify({"error": "drivers query parameter is required"}), 400
        
        driver_ids = [int(num) for num in driver_ids_str.split(',')]
        
        positions_data = list(db.session_results.find({'session_key': session_key, 'driver_number': {'$in': driver_ids}}))
        fastest_laps_data = list(db.laps.aggregate([
            {'$match': {'session_key': session_key, 'driver_number': {'$in': driver_ids}, 'lap_duration': {'$ne': None}}},
            {'$sort': {'lap_duration': 1}},
            {'$group': {'_id': '$driver_number', 'fastest_lap': {'$first': '$lap_duration'}}}
        ]))
        pit_stops_data = list(db.pit_stops.aggregate([
            {'$match': {'session_key': session_key, 'driver_number': {'$in': driver_ids}}},
            {'$group': {'_id': '$driver_number', 'pit_stop_count': {'$sum': 1}}}
        ]))

        def get_driver_stat(data_list, driver_num, key, default_val=None):
            item = next((d for d in data_list if d.get('_id') == driver_num or d.get('driver_number') == driver_num), None)
            return item.get(key) if item else default_val

        comparison_results = []
        for driver_num in driver_ids:
            driver_data = {
                'driver_number': driver_num,
                'position': get_driver_stat(positions_data, driver_num, 'position', 'N/A'),
                'fastest_lap': get_driver_stat(fastest_laps_data, driver_num, 'fastest_lap', 'N/A'),
                'pit_stops': get_driver_stat(pit_stops_data, driver_num, 'pit_stop_count', 0)
            }
            comparison_results.append(driver_data)
        
        return jsonify(parse_json(comparison_results))

    except Exception as e:
        logging.error(f"Error in /api/sessions/{session_key}/compare: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
