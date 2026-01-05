from src.models import Game

class GameManager:
    def __init__(self):
        self.games: dict[str, Game] = {}  # game_id: Game

    def create_game(self) -> Game:
        new_game = Game()
        self.games[new_game.id] = new_game
        return new_game
    
    def get_game(self, game_id: str):
        return self.games.get(game_id.upper())

    def delete_game(self, game_id: str):
        if game_id in self.games:
            del self.games[game_id]
