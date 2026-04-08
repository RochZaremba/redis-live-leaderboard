# Projekt Quiz z Rankingiem (Redis)

Prosty quiz oparty na WebSocketach i Redisie do zliczania punktów. Gra pozwala na szybkie odpowiadanie na pytania i podgląd wyników na żywo.

## Jak odpalić

Najłatwiej przez Dockera:
```bash
docker compose up --build
```

Aplikacja będzie pod adresami:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Redis: localhost:6380

Kliknij "Seed" na frontendzie żeby wrzucić testowych graczy do Redisa, i zacznij grać.

## Komendy do odpytania Redisa

Jak wejdziesz przez klienta `redis-cli -p 6380`, to sprawdzisz topkę w ten sposób:
```bash
ZREVRANGE leaderboard:global 0 9 WITHSCORES
```

A jak chcesz sprawdzić detale jakiegoś ziomka to:
```bash
HGETALL player:id_gracza
```
