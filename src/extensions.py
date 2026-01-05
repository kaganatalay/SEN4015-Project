from gevent import monkey
monkey.patch_all()

from flask_socketio import SocketIO
from src.game_manager import GameManager

socketio = SocketIO(cors_allowed_origins="*", async_mode='gevent')
game_manager = GameManager()
