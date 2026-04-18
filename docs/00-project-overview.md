# 00. Project Overview

## Cel

Projekt pokazuje ranking dla prostej gry quizowej online. Gracz odpowiada na pytania, za poprawną odpowiedź dostaje 100 punktów, a frontend widzi zmiany rankingu na żywo.

## Problem

W klasycznym rankingu trzeba szybko:

- zapisać profil gracza,
- dodać punkty,
- pobrać top N graczy,
- sprawdzić miejsce konkretnego gracza,
- rozesłać informację o zmianie do wielu klientów.

To są operacje, które dobrze pasują do Redisa.

## Dlaczego Redis

Redis jest główną bazą projektu, nie dodatkiem:

- `Hash` przechowuje profil i statystyki gracza pod kluczem `player:{playerId}`,
- `Sorted Set` trzyma ranking globalny `leaderboard:global`,
- `Sorted Set` trzyma ranking tygodniowy `leaderboard:weekly:{YYYY-WW}`,
- `Pub/Sub` publikuje eventy na kanale `leaderboard:updates`,
- `EXPIRE` i `TTL` pokazują wygasanie rankingu tygodniowego.

## Architektura

Projekt jest jednym monolitem FastAPI, bez mikroserwisów i bez SQL. Frontend React łączy się z API HTTP oraz z WebSocketem `/ws/leaderboard`.

Flow:

1. Frontend pobiera pytania z `GET /api/questions`.
2. Gracz wysyła odpowiedź do `POST /api/game/answer`.
3. Backend waliduje odpowiedź i nalicza 100 punktów za poprawną.
4. Backend aktualizuje Hash gracza oraz Sorted Sets.
5. Backend publikuje event Redis Pub/Sub.
6. Zadanie WebSocket w backendzie odbiera Pub/Sub i robi broadcast do klientów.

