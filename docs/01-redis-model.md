# 01. Redis Model

## Profile graczy

Klucz:

```text
player:{playerId}
```

Typ:

```text
Hash
```

Pola:

- `id`
- `nick`
- `avatar`
- `gamesPlayed`
- `correctAnswers`
- `wrongAnswers`
- `totalScore`

Przykładowe komendy:

```bash
HGETALL player:demo-roch
HINCRBY player:demo-roch gamesPlayed 1
HINCRBY player:demo-roch correctAnswers 1
HINCRBY player:demo-roch totalScore 100
```

## Ranking globalny

Klucz:

```text
leaderboard:global
```

Typ:

```text
Sorted Set
```

Member to `playerId`, score to liczba punktów.

Przykładowe komendy:

```bash
ZADD leaderboard:global 500 demo-roch
ZINCRBY leaderboard:global 100 demo-roch
ZREVRANGE leaderboard:global 0 9 WITHSCORES
ZREVRANK leaderboard:global demo-roch
ZSCORE leaderboard:global demo-roch
```

## Ranking tygodniowy

Klucz:

```text
leaderboard:weekly:{YYYY-WW}
```

Przykład:

```text
leaderboard:weekly:2026-19
```

Typ:

```text
Sorted Set
```

Po pierwszej zmianie punktów backend ustawia `EXPIRE` na 14 dni. Dzięki temu stary ranking tygodniowy usuwa się automatycznie.

Przykładowe komendy:

```bash
ZINCRBY leaderboard:weekly:2026-19 100 demo-roch
ZREVRANGE leaderboard:weekly:2026-19 0 9 WITHSCORES
TTL leaderboard:weekly:2026-19
EXPIRE leaderboard:weekly:2026-19 1209600
```

## Pub/Sub

Kanał:

```text
leaderboard:updates
```

Po poprawnej odpowiedzi i zmianie punktów backend publikuje event:

```json
{
  "type": "leaderboard.score.updated",
  "player": {
    "id": "demo-roch",
    "nick": "Roch",
    "avatar": "rocket"
  },
  "pointsDelta": 100,
  "globalScore": 600,
  "globalRank": 1,
  "weeklyScore": 600,
  "weeklyRank": 1,
  "weekKey": "leaderboard:weekly:2026-19"
}
```

Przykładowe komendy:

```bash
SUBSCRIBE leaderboard:updates
PUBLISH leaderboard:updates '{"type":"manual.test"}'
PUBSUB CHANNELS leaderboard:*
```

## Historia ostatnich gier

Dodatkowy klucz:

```text
player:{playerId}:games
```

Typ:

```text
List
```

Backend zapisuje ostatnie 10 odpowiedzi przez `LPUSH` i `LTRIM`, a klucz dostaje TTL 30 dni. To uzupełnia zakres logiki gry, ale główny ranking nadal opiera się na Sorted Sets.

