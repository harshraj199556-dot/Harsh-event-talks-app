# BigQuery Release Notes Tracker

A premium, responsive web application built with **Python Flask** and **Vanilla HTML/CSS/JavaScript** that parses and tracks the latest Google Cloud BigQuery Release Notes.

## Features
- **Smart Parsing**: Breaks down the daily feed entries from the Google Cloud Feed into individual, searchable, and categorizable update cards (Features, Announcements, Deprecated, Fixed, Changed).
- **Interactive Metrics**: Highlights totals and breakdown numbers dynamically.
- **Filtering & Search**: Instantly search for keywords in updates or filter by category pills.
- **Tweet Composer Modal**: Prefills a formatted update tweet within a modal, complete with character limit warnings, character count visualization, and standard Twitter/X sharing web intents.
- **Local Cache**: Caches feed entries locally for 1 hour to ensure lightning-fast page loading and protect against feed rate-limits. Includes error fallbacks if connection is lost.
- **Toast Notifications**: Interactive slide-in notifications for actions like copying text or links.

## Prerequisites
- Python 3.8 or higher

## Installation & Setup

1. **Activate the Virtual Environment**:
   - On Windows (PowerShell):
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - On Linux/macOS:
     ```bash
     source .venv/bin/activate
     ```

2. **Install Dependencies** (If setting up fresh elsewhere):
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Application**:
   ```bash
   python app.py
   ```
   The application will start running at [http://127.0.0.1:5000/](http://127.0.0.1:5000/).

## File Structure
- [app.py](file:///C:/Users/harsh/agy-cli-projects/app.py) - Flask backend with XML feed parsing, BeautifulSoup item separation, and cache handling.
- [requirements.txt](file:///C:/Users/harsh/agy-cli-projects/requirements.txt) - Python project dependencies.
- [templates/index.html](file:///C:/Users/harsh/agy-cli-projects/templates/index.html) - Premium UI structure with responsive filters, timeline feed, compose modals, and icons.
- [static/css/style.css](file:///C:/Users/harsh/agy-cli-projects/static/css/style.css) - Custom styling utilizing sleek dark theme design, glassmorphism, responsive grids, status indicators, and transitions.
- [static/js/app.js](file:///C:/Users/harsh/agy-cli-projects/static/js/app.js) - Client-side state management, search filters, modal controller, API integrations, clipboard interaction, and skeletons.
- [.gitignore](file:///C:/Users/harsh/agy-cli-projects/.gitignore) - Prevents temporary files, caches, virtual environments, and editor configurations from being committed.

## Version Control & GitHub Integration

This project is fully initialized as a local Git repository tracking the `main` branch and linked to the remote GitHub repository:
`https://github.com/harshraj199556-dot/Harsh-event-talks-app.git`

### Useful Git Commands
- **Check Status**:
  ```bash
  git status
  ```
- **Push Local Changes**:
  ```bash
  git add .
  git commit -m "Your commit message"
  git push
  ```

### GitHub CLI (gh) Integration
We have installed the GitHub CLI (`gh`) on this system. You can use it to manage pull requests, issues, releases, and repository settings from your command line:
1. **Authenticate**:
   ```bash
   gh auth login
   ```
2. **View Repository Status**:
   ```bash
   gh repo view
   ```

