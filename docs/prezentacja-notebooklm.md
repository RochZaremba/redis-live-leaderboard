# Quiz Leaderboard - opis prezentacji projektu

## Slajd 1: Quiz Leaderboard

### Tekst na slajdzie
- Quiz Leaderboard
- Aplikacja quizowa z rankingiem live opartym o Redis
- Projekt na przedmiot NoSQL
- Hubert Marciniak
- Mateusz Mańczak
- Roch Zaremba

### Obrazek
Slajd powinien być prosty i czytelny. Na środku duży tytuł "Quiz Leaderboard", pod nim krótszy podtytuł "Aplikacja quizowa z rankingiem live opartym o Redis". Niżej mniejszym tekstem "Projekt na przedmiot NoSQL" oraz nazwiska autorów: Hubert Marciniak, Mateusz Mańczak, Roch Zaremba. W tle może być przyciemniony zrzut ekranu aplikacji albo prosty schemat React -> FastAPI -> Redis. Po prawej stronie można dodać mały element wizualny rankingu, np. podium lub tabelę z trzema miejscami. Kolory powinny nawiązywać do Redisa: czerwień, ciemne tło i jasny tekst.

### Notatka dla prowadzącego
Na początku przedstawiamy nazwę projektu i autorów. Mówimy krótko, że jest to aplikacja quizowa, w której Redis odpowiada za przechowywanie danych i ranking aktualizowany na żywo. Nie wchodzimy jeszcze w szczegóły techniczne, bo one pojawią się na kolejnych slajdach.

---

## Slajd 2: Co robi aplikacja

### Tekst na slajdzie
- Tworzenie profilu gracza
- Wybór lub utworzenie quizu
- Odpowiadanie na pytania
- Naliczanie punktów
- Podgląd rankingu globalnego i tygodniowego
- Aktualizacja rankingu bez odświeżania strony

### Obrazek
Schemat ekranów: profil gracza -> wybór quizu -> pytanie -> wynik i ranking.

### Notatka dla prowadzącego
Użytkownik zaczyna od profilu, potem wybiera quiz i odpowiada na pytania. Za poprawną odpowiedź dostaje 100 punktów. Po zakończeniu widzi swój wynik oraz miejsce w rankingu. Ranking może się odświeżać na żywo, ponieważ frontend ma połączenie WebSocket z backendem.

---

## Slajd 3: Architektura projektu

### Tekst na slajdzie
- React wysyła żądania do FastAPI
- FastAPI wykonuje logikę gry
- Redis zapisuje dane i ranking
- WebSocket przekazuje aktualizacje live
- Docker Compose uruchamia trzy usługi: frontend, backend, Redis

### Obrazek
Diagram: React -> FastAPI -> Redis oraz Redis -> WebSocket -> React.

### Notatka dla prowadzącego
Projekt składa się z trzech kontenerów: frontend działa na porcie 5173, backend na 8000, a Redis na 6380. Frontend komunikuje się z API backendu. Backend zapisuje i odczytuje dane z Redisa. Przy zmianie wyniku backend publikuje informację, która przez WebSocket trafia do przeglądarki.

---

## Slajd 4: Dane zapisane w Redisie

### Tekst na slajdzie
| Dane | Klucz | Typ |
|---|---|---|
| Gracz | `player:{id}` | Hash |
| Ranking globalny | `leaderboard:{quizId}:global` | Sorted Set |
| Ranking tygodniowy | `leaderboard:{quizId}:weekly:{rok-tydzien}` | Sorted Set |
| Odpowiedziane pytania | `player:{id}:quiz:{quizId}:answered_questions` | Set |
| Historia gry | `player:{id}:quiz:{quizId}:games` | List |
| Quiz | `quiz:{quizId}` | Hash |
| Pytania quizu | `quiz:{quizId}:questions` | List |

### Obrazek
Tabela lub mapa kluczy Redis używanych w projekcie.

### Notatka dla prowadzącego
Ten slajd pokazuje faktyczny model danych projektu. Nie ma tu tabel relacyjnych. Dane są podzielone na klucze Redis, a każdy klucz ma typ dopasowany do konkretnej potrzeby aplikacji: profil gracza, ranking, historia odpowiedzi albo lista pytań.

---

## Slajd 5: Ranking w projekcie

### Tekst na slajdzie
- Ranking jest zapisany jako Redis Sorted Set
- ID gracza jest elementem rankingu
- Liczba punktów jest wynikiem sortowania
- Backend aktualizuje ranking po każdej odpowiedzi
- Aplikacja pokazuje ranking globalny i tygodniowy

### Obrazek
Ranking graczy:
1. Roch - 500 pkt
2. Hubert - 400 pkt
3. Maniek - 300 pkt

### Notatka dla prowadzącego
Najważniejsza struktura w projekcie to Sorted Set. Backend dodaje punkty graczowi po poprawnej odpowiedzi. Ten sam mechanizm działa dla rankingu globalnego i tygodniowego. Dzięki temu aplikacja może szybko pobrać top graczy i pozycję konkretnego użytkownika.

---

## Slajd 6: Gracz, odpowiedzi i historia

### Tekst na slajdzie
- Profil gracza jest zapisany jako Hash
- Statystyki gracza: liczba gier, poprawne i błędne odpowiedzi, wynik
- Set przechowuje pytania, na które gracz już odpowiedział
- List przechowuje ostatnią historię gry
- Ponowna odpowiedź na to samo pytanie jest blokowana

### Obrazek
Trzy bloki: `player:{id}` jako profil, `answered_questions` jako lista unikalnych pytań, `games` jako historia.

### Notatka dla prowadzącego
Profil gracza jest Hashem, czyli zestawem pól takich jak nick, avatar, gamesPlayed i totalScore. Projekt używa też Setu, żeby zapamiętać, na które pytania gracz już odpowiedział. To blokuje ponowne zdobycie punktów za to samo pytanie. Historia ostatnich odpowiedzi jest trzymana w Liście.

---

## Slajd 7: Aktualizacje live

### Tekst na slajdzie
- Redis ma kanał `leaderboard:updates`
- Po zmianie wyniku backend publikuje event
- Backend odbiera event i wysyła go przez WebSocket
- Frontend odświeża widok rankingu
- W aplikacji widać status `Live` lub `Offline`

### Obrazek
Gracz odpowiada -> Redis `leaderboard:updates` -> WebSocket -> ranking w przeglądarce.

### Notatka dla prowadzącego
Po zapisaniu wyniku backend publikuje wiadomość na kanale Redis. Druga część backendu nasłuchuje tego kanału i przekazuje wiadomość do połączonych klientów WebSocket. Dzięki temu ranking może zmienić się w przeglądarce bez ręcznego odświeżania.

---

## Slajd 8: Teraz demo

### Tekst na slajdzie
- Uruchomienie projektu
- Dodanie przykładowych graczy przyciskiem Seed
- Odpowiedź na pytanie quizowe
- Podgląd zmiany rankingu w aplikacji
- Sprawdzenie danych bezpośrednio w Redis CLI

### Obrazek
Podział ekranu: aplikacja po lewej, terminal Redis CLI po prawej.

### Notatka dla prowadzącego
W tej części pokazuję działający projekt. Najpierw uruchamiam `docker compose up --build`, otwieram frontend i klikam Seed. Potem odpowiadam na pytanie i pokazuję, że ranking zmienia się w aplikacji. Następnie w terminalu można wejść do Redisa przez `redis-cli -p 6380` i sprawdzić dane komendami:

```bash
ZREVRANGE leaderboard:default:global 0 9 WITHSCORES
HGETALL player:demo-hubert
KEYS leaderboard:default:weekly:*
```

---

## Slajd 9: Podsumowanie

### Tekst na slajdzie
- Redis jest główną bazą danych projektu
- Ranking działa na Sorted Set
- Profile graczy działają na Hash
- Odpowiedzi gracza działają na Set
- Historia gry działa na List
- WebSocket i Redis Pub/Sub dają aktualizacje live

### Obrazek
Końcowy schemat: quiz -> punkty -> Redis -> ranking live.

### Notatka dla prowadzącego
Projekt pokazuje praktyczne użycie Redisa w aplikacji NoSQL. Najważniejszy jest ranking, który działa na Sorted Set. Pozostałe struktury są użyte do konkretnych danych projektu: Hash dla profilu, Set dla odpowiedzianych pytań i List dla historii gry. Całość kończy WebSocket, który pozwala pokazać ranking na żywo.
