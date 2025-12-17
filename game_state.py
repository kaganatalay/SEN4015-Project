import random
from models import Player


class GameState:
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
        # Oyuncuları session_id'ye göre saklayacağız
        # Örnek: {'h7s8...': Player(...), 'a9d2...': Player(...)}
        self.players = {}
        self.is_game_active = False
        self.current_drawer = None
        self.current_word = ""
        self.guessed_players = set()

    def add_player(self, session_id, username):
        """Oyuna yeni bir oyuncu ekler."""
        # İlk gelen oyuncuyu otomatik admin yapalım
        is_admin = (len(self.players) == 0)

        new_player = Player(session_id, username, is_admin)
        self.players[session_id] = new_player
        return new_player

    def remove_player(self, session_id):
        """Oyuncuyu oyundan çıkarır."""
        if session_id in self.players:
            del self.players[session_id]

    def get_all_players(self):
        """Frontend'e göndermek için oyuncu listesini döndürür."""
        # Sözlükteki value'ları alıp listeye çeviriyoruz
        return [p.to_dict() for p in self.players.values()]

    def start_new_round(self):
        """Yeni bir tur başlatır: Çizen ve Kelime seçer."""
        player_list = list(self.players.values())

        # Mantıken en az 2 kişi lazım, yoksa oyun başlamaz
        if len(player_list) < 2:
            return None  # Veya hata fırlatabiliriz

        self.is_game_active = True
        self.guessed_players.clear()  # Yeni tur, bilenleri sıfırla

        # 1. Rastgele Çizen Seç (İleride sırayla yapılabilir, şimdilik rastgele)
        self.current_drawer = random.choice(player_list)

        # 2. Rastgele Kelime Seç
        self.current_word = random.choice(self.WORDS)

        return {
            "drawer": self.current_drawer.username,
            "drawer_id": self.current_drawer.session_id,
            "word": self.current_word
        }

    def process_guess(self, session_id, guess_text):
        """
        Gelen tahminin doğru olup olmadığını kontrol eder.
        Dönüş Değeri: Sonuçla ilgili bir sözlük (Dict) döner.
        """
        # Oyun aktif değilse veya gönderen çizen kişiyse işlem yapma
        if not self.is_game_active:
            return None

        if self.current_drawer and session_id == self.current_drawer.session_id:
            return None  # Çizen kişi kendi kelimesini tahmin edemez

        # Harf büyüklüğünü yoksay (Normalization)
        # "Elma", "ELMA", "elma " -> hepsi "elma" olur
        clean_guess = guess_text.strip().lower()
        target_word = self.current_word.lower()

        if clean_guess == target_word:
            # Oyuncu daha önce bildi mi?
            if session_id in self.guessed_players:
                return {"type": "ALREADY_GUESSED"}

            # DOĞRU TAHMİN!
            self.guessed_players.add(session_id)
            player = self.players[session_id]
            player.score += 10  # Basit puanlama: Her bilene 10 puan

            # Tur bitti mi kontrolü (Çizen hariç herkes bildi mi?)
            # Toplam oyuncu - 1 (çizen) = Bilmesi gereken kişi sayısı
            needed_guesses = len(self.players) - 1
            round_over = (len(self.guessed_players) >= needed_guesses)

            return {
                "type": "CORRECT_GUESS",
                "player_name": player.username,
                "new_score": player.score,
                "round_over": round_over
            }

        # Yanlış tahminse sadece sohbet mesajı olarak algılanır
        return {"type": "CHAT_MESSAGE", "message": guess_text}