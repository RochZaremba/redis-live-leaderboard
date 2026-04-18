# 05. Demo Scenario

## Uruchomienie

```bash
docker compose up --build
```

Sprawdzenie API:

```bash
curl http://localhost:8000/api/health
```

## Demo w przeglądarce

1. Wejdź na http://localhost:5173.
2. Kliknij `Seed`.
3. Pokaż ranking globalny i tygodniowy.
4. Utwórz nowego gracza.
5. Odpowiedz poprawnie na pytanie o Redis Sorted Set.
6. Pokaż, że punkty wzrosły o 100.
7. Otwórz drugi tab i powtórz odpowiedź. Ranking odświeży się live.
8. Kliknij `Reset`, żeby pokazać czyszczenie danych.

## Demo w redis-cli

Po `Seed`:

```bash
redis-cli -p 6380 HGETALL player:demo-roch
redis-cli -p 6380 ZREVRANGE leaderboard:global 0 9 WITHSCORES
redis-cli -p 6380 ZREVRANK leaderboard:global demo-roch
redis-cli -p 6380 ZSCORE leaderboard:global demo-roch
```

Klucz tygodniowy weź z odpowiedzi `POST /api/dev/seed` albo z API:

```bash
curl http://localhost:8000/api/leaderboard/weekly
```

Następnie:

```bash
redis-cli -p 6380 ZREVRANGE leaderboard:weekly:2026-19 0 9 WITHSCORES
redis-cli -p 6380 TTL leaderboard:weekly:2026-19
redis-cli -p 6380 PUBSUB CHANNELS leaderboard:*
```

## Demo Pub/Sub

Terminal 1:

```bash
redis-cli -p 6380 SUBSCRIBE leaderboard:updates
```

Terminal 2:

```bash
curl -X POST http://localhost:8000/api/game/answer \
  -H "Content-Type: application/json" \
  -d '{"playerId":"demo-roch","questionId":"q-redis-sorted-set","answer":"Sorted Set"}'
```

W terminalu 1 powinien pojawić się event JSON.
