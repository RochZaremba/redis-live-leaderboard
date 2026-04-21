# 02. API

Base URL:

```text
http://localhost:8000
```

## Health

```http
GET /api/health
```

Odpowiedź:

```json
{
  "status": "ok",
  "redis": "ok"
}
```

## Players

```http
POST /api/players
```

Body:

```json
{
  "nick": "Roch",
  "avatar": "rocket"
}
```

```http
GET /api/players/{player_id}
GET /api/players/{player_id}/rank
```

Rank zwraca miejsce globalne i tygodniowe:

```json
{
  "playerId": "demo-roch",
  "globalRank": 1,
  "globalScore": 500,
  "weeklyRank": 1,
  "weeklyScore": 500,
  "weekKey": "leaderboard:weekly:2026-19"
}
```

## Game

```http
GET /api/questions
```

Zwraca pytania bez poprawnej odpowiedzi.

```http
POST /api/game/answer
```

Body:

```json
{
  "playerId": "demo-roch",
  "questionId": "q-redis-sorted-set",
  "answer": "Sorted Set"
}
```

Dla poprawnej odpowiedzi backend:

- zwiększa `gamesPlayed`,
- zwiększa `correctAnswers`,
- dodaje `totalScore += 100`,
- robi `ZINCRBY` w rankingu globalnym i tygodniowym,
- publikuje event Pub/Sub.

## Leaderboard

```http
GET /api/leaderboard/global?limit=10
GET /api/leaderboard/weekly?limit=10
```

Odpowiedź:

```json
{
  "scope": "global",
  "weekKey": null,
  "entries": [
    {
      "playerId": "demo-roch",
      "nick": "Roch",
      "avatar": "rocket",
      "score": 500,
      "rank": 1
    }
  ]
}
```

## Dev

```http
POST /api/dev/seed
POST /api/dev/reset
```

`seed` tworzy przykładowych graczy i rankingi. `reset` usuwa klucze `player:*` oraz `leaderboard:*`.

