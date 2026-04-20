# 04. Team Workflow

## Podział pracy

Roch, `rochzaremba@gmail.com`:

- quiz trivia,
- pytania i odpowiedzi,
- walidacja odpowiedzi,
- naliczanie 100 punktów za poprawną odpowiedź,
- historia ostatnich gier,
- opis mechaniki punktacji.

Hubert, `hubertik@hotmail.com`:

- połączenie z Redis przez `redis.asyncio`,
- Sorted Sets,
- Hashes,
- TTL rankingu tygodniowego,
- Pub/Sub,
- endpointy rankingu,
- komendy Redis do pokazania na zaliczeniu.

Maniek, `mateuszmanczak@icloud.com`:

- React/Vite/TypeScript,
- ekran gry,
- profil gracza,
- ranking live,
- natywny WebSocket API,
- dashboard demo.

## Branche

- `main` - wersja stabilna oddawana na zaliczenie.
- `develop` - integracja PR-ów.
- `feature/game-logic` - praca Rocha.
- `feature/redis-ranking-api` - praca Huberta.
- `feature/frontend-live-leaderboard` - praca Mańka.
- `feature/docker-and-docs` - Docker Compose i dokumentacja.
- `feature/tests` - testy backendu.

## PR workflow

1. Każda osoba tworzy swój branch z `develop`.
2. Każda osoba robi commity tylko ze swoją realną konfiguracją git.
3. Po skończeniu zakresu powstaje PR do `develop`.
4. Druga osoba robi review.
5. Po akceptacji branch jest mergowany do `develop`.
6. Na końcu `develop` jest mergowany do `main`.

## Uczciwość historii

Historia commitów ma być prawdziwa. Nie należy ustawiać autorów innych osób, antydatować commitów ani przepisywać historii tylko po to, żeby wyglądała na starszą. Jeżeli commity powstały między 7 kwietnia 2026 i 10 maja 2026, dokumentacja może opisać ten przebieg. Jeżeli nie powstały, trzeba pokazać faktyczny stan repozytorium.

