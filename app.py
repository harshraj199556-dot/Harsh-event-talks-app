import os
import time
import json
import logging
import requests
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_FILE = "release_notes_cache.json"
CACHE_EXPIRY = 3600  # Cache duration in seconds (1 hour)

def parse_html_content(html_content, date_str, base_link):
    """
    Parses HTML content from a feed entry and splits it into individual updates by <h3> tags.
    If no <h3> tags are found, treats the entire block as a single general update.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    h3_tags = soup.find_all('h3')
    updates = []

    if not h3_tags:
        # Treat the entire content as one update
        text_content = soup.get_text(separator=' ').strip()
        # Clean up double spaces
        text_content = " ".join(text_content.split())
        updates.append({
            'category': 'Update',
            'html': str(html_content),
            'text': text_content
        })
    else:
        for idx, h3 in enumerate(h3_tags):
            category = h3.get_text().strip()
            
            sibling_htmls = []
            sibling_texts = []
            
            # Walk sibling elements until the next h3
            curr = h3.next_sibling
            while curr and curr.name != 'h3':
                sibling_htmls.append(str(curr))
                if hasattr(curr, 'get_text'):
                    sibling_texts.append(curr.get_text(separator=' ').strip())
                else:
                    sibling_texts.append(str(curr).strip())
                curr = curr.next_sibling
                
            item_html = "".join(sibling_htmls).strip()
            item_text = " ".join(sibling_texts).strip()
            item_text = " ".join(item_text.split()) # normalize spaces
            
            updates.append({
                'category': category,
                'html': item_html,
                'text': item_text
            })
            
    return updates

def fetch_and_parse_feed():
    """
    Fetches the feed from Google Cloud and parses it.
    """
    logging.info(f"Fetching feed from {FEED_URL}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    response = requests.get(FEED_URL, headers=headers, timeout=15)
    response.raise_for_status()
    
    # Parse the XML feed content
    feed = feedparser.parse(response.content)
    
    all_updates = []
    
    for entry_idx, entry in enumerate(feed.entries):
        date_str = entry.get('title', 'Unknown Date')
        link = entry.get('link', '')
        
        # Parse published/updated timestamp for sorting
        published_parsed = entry.get('updated_parsed') or entry.get('published_parsed')
        timestamp = time.mktime(published_parsed) if published_parsed else 0
        
        content_list = entry.get('content', [])
        html_content = ""
        if content_list:
            html_content = content_list[0].get('value', '')
        else:
            html_content = entry.get('summary', '')
            
        # Split daily log into individual updates
        entry_updates = parse_html_content(html_content, date_str, link)
        
        for item_idx, update in enumerate(entry_updates):
            # Generate a unique ID for frontend selection/linking
            unique_id = f"bq-update-{entry_idx}-{item_idx}"
            
            # Anchor tag targeting the specific date on the official release notes
            # Format usually: #June_22_2026
            date_anchor = date_str.replace(' ', '_').replace(',', '')
            specific_link = f"https://docs.cloud.google.com/bigquery/docs/release-notes#{date_anchor}"
            
            all_updates.append({
                'id': unique_id,
                'date': date_str,
                'link': specific_link,
                'category': update['category'],
                'html': update['html'],
                'text': update['text'],
                'timestamp': timestamp
            })
            
    # Sort updates by timestamp descending (newest first)
    all_updates.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return {
        'title': feed.feed.get('title', 'BigQuery Release Notes'),
        'updated': feed.feed.get('updated', ''),
        'updates': all_updates,
        'cached_at': time.time()
    }

def get_release_notes(force_refresh=False):
    """
    Retrieves release notes from cache or fetches new ones if expired or force_refresh is True.
    """
    if not force_refresh and os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
            
            # Check cache age
            age = time.time() - cached_data.get('cached_at', 0)
            if age < CACHE_EXPIRY:
                logging.info(f"Returning cached release notes (age: {int(age)}s)")
                cached_data['from_cache'] = True
                return cached_data
        except Exception as e:
            logging.error(f"Error reading cache file: {e}")
            
    # Cache miss or force refresh
    try:
        data = fetch_and_parse_feed()
        data['from_cache'] = False
        
        # Save to cache
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return data
    except Exception as e:
        logging.error(f"Error fetching feed: {e}")
        # If fetch fails but we have a cache, fall back to cache even if expired
        if os.path.exists(CACHE_FILE):
            try:
                logging.warning("Fetch failed. Falling back to expired cache.")
                with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                    cached_data = json.load(f)
                cached_data['from_cache'] = True
                cached_data['error_fallback'] = True
                return cached_data
            except Exception as read_err:
                logging.error(f"Failed to read expired cache: {read_err}")
        
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def api_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        data = get_release_notes(force_refresh)
        return jsonify(data)
    except Exception as e:
        logging.exception("Failed to retrieve release notes")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Start the server on port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
