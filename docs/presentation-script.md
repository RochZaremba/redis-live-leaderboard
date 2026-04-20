# Presentation Script

## Roch

Ja opowiem o logice gry. Mamy prosty quiz trivia, pytania są trzymane w backendzie, a endpoint `GET /api/questions` zwraca je bez poprawnej odpowiedzi. Gdy frontend wysyła `POST /api/game/answer`, backend znajduje pytanie, normalizuje odpowiedź i sprawdza, czy zgadza się z poprawną.

Za poprawną odpowiedź gracz dostaje 100 punktów. Przy każdej odpowiedzi aktualizujemy profil gracza w Redis Hashu: rośnie `gamesPlayed`, a potem albo `correctAnswers`, albo `wrongAnswers`. Dla poprawnej odpowiedzi rośnie też `totalScore`. Dodatkowo zapisujemy ostatnie odpowiedzi gracza w liście `player:{id}:games`, żeby dało się pokazać historię ostatnich gier.

## Hubert

Ja opowiem o Redisie. Profile graczy są zapisane jako Hash pod kluczem `player:{playerId}`. Ranking globalny jest w Sorted Set `leaderboard:global`, gdzie memberem jest ID gracza, a score to liczba punktów. Dzięki temu `ZINCRBY` dodaje punkty, `ZREVRANGE` pobiera topkę, `ZREVRANK` sprawdza miejsce gracza, a `ZSCORE` pokazuje wynik.

Ranking tygodniowy jest drugim Sorted Setem, na przykład `leaderboard:weekly:2026-19`. Po pierwszym zapisie backend ustawia `EXPIRE`, więc można pokazać `TTL` i widać, że ranking ma czas życia. Po zmianie wyniku backend publikuje JSON na kanale `leaderboard:updates`, czyli używamy Redis Pub/Sub do integracji z WebSocketem.

Komendy do pokazania:

```bash
redis-cli -p 6380 HGETALL player:demo-roch
redis-cli -p 6380 ZREVRANGE leaderboard:global 0 9 WITHSCORES
redis-cli -p 6380 ZREVRANK leaderboard:global demo-roch
redis-cli -p 6380 ZSCORE leaderboard:global demo-roch
redis-cli -p 6380 TTL leaderboard:weekly:2026-19
redis-cli -p 6380 PUBSUB CHANNELS leaderboard:*
```

## Maniek

Ja opowiem o froncie. Aplikacja jest w React i Vite. Na jednym ekranie mamy formularz gracza, pytanie quizowe, ranking globalny, ranking tygodniowy i eventy live. Frontend używa normalnych fetchy do API HTTP oraz natywnego `WebSocket`, bez dodatkowych bibliotek do socketów.

Po połączeniu z `/ws/leaderboard` klient czeka na eventy. Gdy backend wyśle `leaderboard.score.updated`, frontend odświeża rankingi i profil gracza. Dlatego przy dwóch otwartych kartach w przeglądarce widać zmianę rankingu prawie od razu po poprawnej odpowiedzi.

## Demo wspólne

Najpierw uruchamiamy:

```bash
docker compose up --build
```

Potem wchodzimy na frontend, klikamy `Seed`, pokazujemy dane w Redisie, tworzymy gracza i odpowiadamy poprawnie. Na końcu pokazujemy drugi tab albo `redis-cli -p 6380 SUBSCRIBE leaderboard:updates`, żeby udowodnić Pub/Sub i live update.
