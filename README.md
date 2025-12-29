# SEN4015 Project - Drawing Guessing Game

A real-time drawing and guessing game built with Python Flask and SocketIO, inspired by games like Gartic.io.

## Features

- **Real-time drawing**: Players can draw on a shared canvas using HTML5 Canvas
- **Word guessing**: Players guess the word being drawn in real-time chat
- **Multiplayer**: Support for multiple games and players
- **Turkish words**: Word bank containing Turkish words for drawing
- **Game management**: Create and join games with unique game IDs

## Quick Start

### Prerequisites

- Python 3.14+
- pip (Python package manager)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/kaganatalay/SEN4015-Project.git
cd SEN4015-Project
```

2. Create and activate virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -e .
```

### Running the Application

```bash
python app.py
```

Open your browser to `http://localhost:5000` to start playing.

## Game Rules

1. **Create a game** or **join an existing game** using a game ID
2. The game creator (admin) can start the game when ready
3. One player is randomly selected to draw while others guess
4. Players guess the word in the chat
5. Correct guesses earn points
6. The round ends when all players (except drawer) guess correctly

## Project Structure

```
.
├── app.py                 # Main Flask application
├── extensions.py          # Flask extensions (SocketIO, GameManager)
├── models.py              # Data models (Player, Game classes)
├── socket_events.py       # SocketIO event handlers
├── templates/
│   └── index.html         # Main HTML template
├── static/
│   ├── script.js          # Frontend JavaScript
│   └── style.css          # Frontend styles
└── pyproject.toml         # Project configuration
```

## Environment Variables

- `SECRET_KEY`: Flask secret key (change in production)

## Development

### Dependencies

- Flask 3.1.2+
- Flask-SocketIO 5.6.0+

### Browser Support

- Modern browsers with WebSocket support
- HTML5 Canvas support required for drawing

## License

This project is part of SEN4015 coursework.
