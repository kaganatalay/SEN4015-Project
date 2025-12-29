from models import Game, Player

class GameManager:
    def __init__(self):
        self.games: dict[str, Game] = {}  # game_id: Game

    def create_game(self) -> Game:
        """Yeni bir oyun oluştur ve ID'sini döndür."""
        new_game = Game()
        self.games[new_game.id] = new_game
        return new_game
    
    def get_game(self, game_id: str):
        """Belirli bir oyun ID'sine ait oyunu döndür."""
        return self.games.get(game_id.upper())

    def delete_game(self, game_id: str):
        """Oyun sona erdikten sonra sil."""
        if game_id in self.games:
            del self.games[game_id]
