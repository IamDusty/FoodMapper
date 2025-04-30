import os
import logging
import requests
import datetime
from flask import Flask, render_template, request, jsonify
from urllib.parse import urlencode

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Get Google API key from environment variables
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

@app.route('/')
def index():
    """Render the main page of the application."""
    return render_template('index.html', google_api_key=GOOGLE_API_KEY)

@app.route('/api/test', methods=['GET'])
def test_api():
    """Test endpoint for Google API key."""
    try:
        # Test Places API
        places_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        places_params = {
            'location': '40.7128,-74.0060',  # New York coordinates as a test
            'radius': 500,
            'type': 'restaurant',
            'key': GOOGLE_API_KEY
        }
        
        places_response = requests.get(f"{places_url}?{urlencode(places_params)}")
        places_data = places_response.json()
        
        # Get information about the API key
        key_info = {
            'key_last_4': GOOGLE_API_KEY[-4:] if GOOGLE_API_KEY else "None",
            'places_api_status': places_data.get('status'),
            'places_api_error': places_data.get('error_message'),
            'test_timestamp': str(datetime.datetime.now())
        }
        
        return jsonify({
            'status': 'OK',
            'tests': {
                'places_api': {
                    'status': places_data.get('status'),
                    'error_message': places_data.get('error_message', None),
                    'results_count': len(places_data.get('results', [])),
                }
            },
            'key_info': key_info
        })
    except Exception as e:
        return jsonify({
            'status': 'ERROR',
            'error': str(e)
        }), 500

@app.route('/api/places/nearby', methods=['GET'])
def nearby_places():
    """Proxy endpoint for Google Places API nearby search."""
    try:
        # Get parameters from request
        location = request.args.get('location')
        radius = request.args.get('radius', 1500)
        type = request.args.get('type', 'restaurant')
        keyword = request.args.get('keyword', '')
        
        # Build the Google Places API URL
        base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': location,
            'radius': radius,
            'type': type,
            'keyword': keyword,
            'key': GOOGLE_API_KEY
        }
        
        # Log API call details
        logger.debug(f"Making request to Google Places API: {base_url} with params: {params}")
        
        # Make the request to Google Places API
        response = requests.get(f"{base_url}?{urlencode(params)}")
        response_data = response.json()
        
        # Log the response status and data
        logger.debug(f"Google Places API response status: {response.status_code}")
        logger.debug(f"Google Places API response data: {response_data}")
        
        # Check for API errors
        if response_data.get('status') != 'OK':
            logger.error(f"Google Places API error: {response_data.get('status')} - {response_data.get('error_message', 'No error message')}")
        
        # Return the response from Google Places API
        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Error in nearby_places endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "status": "SERVER_ERROR"}), 500

@app.route('/api/places/details', methods=['GET'])
def place_details():
    """Proxy endpoint for Google Places API place details."""
    try:
        # Get place_id from request
        place_id = request.args.get('place_id')
        
        # Build the Google Places API URL
        base_url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': place_id,
            'fields': 'name,formatted_address,rating,price_level,photos,types,opening_hours,website',
            'key': GOOGLE_API_KEY
        }
        
        # Log API call details
        logger.debug(f"Making request to Google Places Details API: {base_url} with params: {params}")
        
        # Make the request to Google Places API
        response = requests.get(f"{base_url}?{urlencode(params)}")
        response_data = response.json()
        
        # Log the response status and data
        logger.debug(f"Google Places Details API response status: {response.status_code}")
        logger.debug(f"Google Places Details API response data: {response_data}")
        
        # Check for API errors
        if response_data.get('status') != 'OK':
            logger.error(f"Google Places Details API error: {response_data.get('status')} - {response_data.get('error_message', 'No error message')}")
        
        # Return the response from Google Places API
        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Error in place_details endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": str(e), "status": "SERVER_ERROR"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
