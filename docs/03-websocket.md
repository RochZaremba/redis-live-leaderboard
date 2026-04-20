# 03. WebSocket

Endpoint:

```text
WS /ws/leaderboard
```

Frontend używa natywnego WebSocket API:

```ts
const socket = new WebSocket("ws://localhost:8000/ws/leaderboard");
socket.onmessage = (message) => {
  const event = JSON.parse(message.data);
  console.log(event);
};
```

## Integracja z Pub/Sub

Backend ma jedno zadanie działające w tle:

1. Subskrybuje Redis kanał `leaderboard:updates`.
2. Odbiera wiadomości z Pub/Sub.
3. Parsuje JSON.
4. Rozsyła event do aktywnych połączeń WebSocket przez `ConnectionManager`.

## Event po zmianie wyniku

```json
{
  "type": "leaderboard.score.updated",
  "player": {
    "id": "demo-hubert",
    "nick": "Hubert",
    "avatar": "bolt"
  },
  "pointsDelta": 100,
  "globalScore": 500,
  "globalRank": 1,
  "weeklyScore": 500,
  "weeklyRank": 1,
  "weekKey": "leaderboard:weekly:2026-19",
  "updatedAt": "2026-05-09T12:00:00+00:00"
}
```

## Event po seedzie

```json
{
  "type": "leaderboard.seeded",
  "players": 4,
  "weekKey": "leaderboard:weekly:2026-19"
}
```

Frontend po każdym evencie odświeża ranking globalny i tygodniowy przez HTTP. Dzięki temu WebSocket przenosi informację o zmianie, a API pozostaje źródłem aktualnego widoku.

