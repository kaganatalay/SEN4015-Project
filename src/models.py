import uuid
import random

class Player:
    def __init__(self, session_id, username, is_admin=False):
        self.session_id = session_id  # The unique socket ID for this connection
        self.username = username
        self.score = 0
        self.is_admin = is_admin

    def to_dict(self):
        return {
            "pid": self.session_id,
            "username": self.username,
            "score": self.score,
            "is_admin": self.is_admin
        }

    def __repr__(self):
        return f"<Player {self.username} (Admin: {self.is_admin})>"

class Game:
    WORDS = [
        "araba", "bilgisayar", "telefon", "uçak", "helikopter",
        "gemi", "bisiklet", "motosiklet", "tren", "otobüs",
        "kedi", "köpek", "fil", "zürafa", "aslan",
        "kaplan", "ayı", "tavşan", "balık", "kuş",
        "elma", "armut", "muz", "çilek", "karpuz",
        "pizza", "hamburger", "dondurma", "pasta", "ekmek",
        "ev", "okul", "hastane", "köprü", "cami",
        "kale", "çadır", "apartman", "fabrika", "stadyum",
        "gözlük", "saat", "ayakkabı", "şapka", "çanta",
        "kamera", "televizyon", "radyo", "gitar", "piyano",
        "doktor", "polis", "itfaiyeci", "öğretmen", "aşçı",
        "pilot", "ressam", "yüzücü", "futbolcu", "asker",
        "güneş", "ay", "yıldız", "bulut", "yağmur",
        "kar", "şimşek", "gökkuşağı", "deniz", "dağ"
    ]

    def __init__(self):
        self.id = str(uuid.uuid4())[:4].upper()  # Simple short ID
        self.creator_sid = None
        self.players: dict[str, Player] = {}  # session_id: Player
        self.is_game_active = False
        self.current_drawer = None
        self.current_word = ""
        self.guessed_players = set()

    def add_player(self, player: Player):        
        if (player.is_admin and any(p.is_admin for p in self.players.values())):
            player.is_admin = False
            
        self.players[player.session_id] = player
    
    def remove_player(self, session_id):
        if session_id in self.players:
            del self.players[session_id]

    def get_all_players(self):
        return [p.to_dict() for p in self.players.values()]

    def start_new_round(self):
        player_list = list(self.players.values())

        if len(player_list) < 2:
            return None

        self.is_game_active = True
        self.guessed_players.clear()

        self.current_drawer = random.choice(player_list)

        self.current_word = random.choice(self.WORDS)

        return {
            "drawer": self.current_drawer.username,
            "drawer_id": self.current_drawer.session_id,
            "word": self.current_word
        }

    def process_guess(self, session_id, guess_text):
        if not self.is_game_active:
            return None

        if self.current_drawer and session_id == self.current_drawer.session_id:
            return None 

        clean_guess = guess_text.strip().lower()
        target_word = self.current_word.lower()

        if clean_guess == target_word:

            winner = self.players[session_id]
            winner.score += 10
            self.is_game_active = False
            
            return {
                "type": "ROUND_WIN",
                "winner": winner.username,
                "word": self.current_word
            }

        return {"type": "CHAT_MESSAGE", "message": guess_text}
