# 06. Git Workflow

Ten plik jest opisem zalecanego, uczciwego przebiegu pracy. Nie jest instrukcją fałszowania historii. Autor, data i czas commita powinny wynikać z realnej pracy danej osoby na jej komputerze.

## PR-y

1. `feature/game-logic` -> `develop`, autor: Roch.
2. `feature/redis-ranking-api` -> `develop`, autor: Hubert.
3. `feature/frontend-live-leaderboard` -> `develop`, autor: Maniek.
4. `feature/docker-and-docs` -> `develop`, autorzy według faktycznych zmian.
5. `feature/tests` -> `develop`, autorzy według faktycznych zmian.
6. `develop` -> `main`, finalny merge.

## Przykładowa sensowna kolejność commitów

Jeżeli zespół faktycznie pracował w oknie 7.04.2026 - 10.05.2026, historia może wyglądać podobnie do poniższej. Daty są przykładem raportowym, a nie poleceniem do ustawiania commitów wstecz.

### Roch - `feature/game-logic`

- 2026-04-07 rano: `Add quiz question model and sample trivia set`
- 2026-04-09 wieczorem: `Implement answer validation and scoring rules`
- 2026-04-14 po południu: `Store recent game attempts for each player`
- 2026-04-21 wieczorem: `Document scoring mechanics in project docs`
- 2026-05-03 po południu: `Polish game answer response schema`

### Hubert - `feature/redis-ranking-api`

- 2026-04-08 po południu: `Add async Redis client configuration`
- 2026-04-11 wieczorem: `Implement player hashes and profile API`
- 2026-04-16 rano: `Add global sorted set leaderboard service`
- 2026-04-22 wieczorem: `Add weekly leaderboard with TTL`
- 2026-04-29 po południu: `Publish ranking updates through Redis Pub/Sub`
- 2026-05-06 wieczorem: `Add Redis demo commands to docs`

### Maniek - `feature/frontend-live-leaderboard`

- 2026-04-10 wieczorem: `Scaffold Vite React dashboard`
- 2026-04-15 po południu: `Build player profile and quiz screen`
- 2026-04-24 wieczorem: `Add live leaderboard WebSocket client`
- 2026-05-01 po południu: `Style dashboard and leaderboard panels`
- 2026-05-08 wieczorem: `Connect seed and reset demo controls`

### Integracja

- 2026-05-04: `Add docker compose for backend frontend and redis`
- 2026-05-05: `Add backend scoring and leaderboard tests`
- 2026-05-09: `Update README and presentation script`
- 2026-05-10: `Merge develop into main for submission`

## Zasada

W systemie kontroli wersji pokazujemy prawdziwe PR-y, prawdziwych autorów i rzeczywisty czas pracy. Jeżeli prowadzący sprawdzi metadane repozytorium, projekt powinien bronić się kodem, dokumentacją i działającym demo, a nie sztucznie ustawioną historią.

