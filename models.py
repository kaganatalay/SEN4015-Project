class Player:
    def __init__(self, session_id, username, is_admin=False):
        self.session_id = session_id  # The unique socket ID for this connection
        self.username = username
        self.score = 0
        self.is_admin = is_admin

    def to_dict(self):
        """Helper to convert player data to a dictionary for JSON responses."""
        return {
            "username": self.username,
            "score": self.score,
            "is_admin": self.is_admin
        }

    def __repr__(self):
        return f"<Player {self.username} (Admin: {self.is_admin})>"