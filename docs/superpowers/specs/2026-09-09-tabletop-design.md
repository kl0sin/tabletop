# Tabletop – design

Data: 2026-09-09
Status: zatwierdzony w brainstormie, do implementacji

## Cel

Statyczna, mobile-first "platforma" hostowana na GitHub Pages, w której z dashboardu
wybiera się instancję (grę lub narzędzie przy stole). Pierwsze dwie instancje:

1. **Flip 7** – licznik punktów z historią rozgrywek.
2. **Picker** – losowanie, kto zaczyna, przez położenie palców na ekranie.

Dane wyłącznie w `localStorage` przeglądarki. Brak backendu, brak logowania.

Poza zakresem (świadomie): synchronizacja między urządzeniami, wspólny licznik
konfigurowalny per gra, tryb "ustal kolejność" w pickerze, historia na dashboardzie.

## Stack

- Vite (multi-page) + vanilla TypeScript (strict), bez frameworka UI.
- CSS zwykły, zmienne CSS. Dashboard i Picker dzielą `theme.css`; każda gra ma
  własne, niezależne style.
- Vitest do testów logiki. Prettier. Bez ESLinta na start.
- PWA: `vite-plugin-pwa` – manifest (standalone, ikony) + service worker do pracy
  offline.
- Deploy: GitHub Actions na push do `main` → testy → build → GitHub Pages.
  `base: '/tabletop/'`, adres `https://mkklosin.github.io/tabletop/`.

## Struktura

```
tabletop/
├── index.html                 # dashboard
├── src/
│   ├── shared/
│   │   ├── storage.ts         # wrapper localStorage
│   │   ├── theme.css          # wspólny motyw dashboard + picker
│   │   └── games.ts           # rejestr instancji
│   ├── dashboard/             # main.ts, style
│   ├── picker/
│   │   ├── index.html
│   │   └── main.ts, style
│   └── flip7/
│       ├── index.html
│       ├── scoring.ts         # czysta logika punktacji (testowana)
│       ├── game.ts            # stan gry, rundy, koniec gry, undo (testowane)
│       ├── storage.ts         # klucze flip7:* (na bazie shared/storage)
│       └── main.ts, widoki, style
├── public/                    # ikony, favicon
├── docs/superpowers/          # specs, plans
├── CLAUDE.md
├── vite.config.ts
└── .github/workflows/deploy.yml
```

Zasady:

- Instancje są niezależne: nie importują się nawzajem. Współdzielą tylko
  `shared/storage.ts`, `shared/games.ts` i (dashboard + picker) `shared/theme.css`.
- Dodanie nowej gry = nowy folder w `src/`, wpis w `games.ts`, wpis w `rollupOptions.input`.

## Moduły wspólne

### `shared/storage.ts`

```ts
read<T>(key: string): T | null      // JSON.parse; null gdy brak, błąd parsowania
                                    // lub localStorage niedostępny
write<T>(key: string, value: T): boolean   // false gdy QuotaExceeded / niedostępny
remove(key: string): void
```

Każda instancja używa własnego prefiksu (`flip7:`). Zapisywane obiekty niosą pole
`version: number` na potrzeby przyszłych migracji.

### `shared/games.ts`

```ts
interface GameEntry {
  id: string;
  name: string;
  description: string;
  path: string; // np. 'flip7/'
  icon: string; // emoji lub ścieżka do SVG
  hasActiveGame?: () => boolean;
}
export const games: GameEntry[];
```

`hasActiveGame` dla Flip 7 sprawdza tylko istnienie klucza `flip7:current` –
dashboard nie zna formatu danych gry.

## Dashboard

- Nagłówek "Tabletop".
- Siatka kafelków z rejestru (1–2 kolumny na telefonie). Kafelek: ikona, nazwa,
  opis. Tap → instancja.
- Jeśli `hasActiveGame()` zwraca true, kafelek dostaje znaczek "w toku"; instancja
  sama decyduje, że po wejściu wraca do trwającej gry.
- Brak ustawień, brak historii, brak listy graczy.

## Picker

Przebieg:

1. Pusty ekran z podpowiedzią "Połóżcie palce na ekranie". Licznik wykrytych palców.
2. Każdy dotyk (Pointer Events, po `pointerId`) dostaje kolorowy krąg podążający
   za palcem. `touch-action: none` na całej powierzchni; blokada pull-to-refresh
   i zoomu.
3. Gdy ≥ 2 palce i przez ~2 s skład się nie zmienia → odliczanie: kręgi pulsują
   coraz szybciej.
4. Losowanie: kręgi gasną kolejno w losowej kolejności; ostatni rośnie i wypełnia
   ekran swoim kolorem. `navigator.vibrate` jeśli dostępne.
5. Reset: oderwanie wszystkich palców po wyniku. Zmiana składu palców w trakcie
   odliczania przerywa je i zaczyna od nowa.

Losowość: `crypto.getRandomValues`. Brak stanu, brak storage.
Limit równoczesnych dotyków zależy od sprzętu (iPhone ~5, iPad ~11, Android ~10) –
stąd licznik palców na ekranie.

## Flip 7

### Zasady punktacji (moduł `scoring.ts`)

Wejście: lista kart gracza w rundzie. Karty:

- liczbowe: `0..12`
- modyfikatory: `+2, +4, +6, +8, +10, x2`

Wyjście: `{ score: number; busted: boolean; flip7Bonus: boolean }`.

- Dubel karty liczbowej → `busted = true`, `score = 0`.
- `score = (suma kart liczbowych) * (x2 ? 2 : 1) + suma modyfikatorów dodatnich`
- 7 unikalnych kart liczbowych → `flip7Bonus = true`, `+15`.
- Karty akcji (Freeze, Flip Three, Second Chance) nie występują w modelu – nie
  wpływają na punkty.

Czysta funkcja, bez DOM, pokryta testami jednostkowymi.

### Model gry (moduł `game.ts`)

```ts
interface Player {
  id: string;
  name: string;
}
interface Round {
  scores: Record<playerId, number>;
}
interface Game {
  version: 1;
  id: string;
  createdAt: string; // ISO
  finishedAt?: string;
  players: Player[];
  target: number; // domyślnie 200
  dealerIndex: number; // rotuje co rundę
  rounds: Round[];
  winnerId?: string;
}
```

Operacje (czyste, testowane): `startGame`, `addRound`, `undoLastRound`,
`totals(game)`, `checkWinner(game)` – zwycięzca to gracz z najwyższą sumą, gdy po
zamknięciu rundy ktokolwiek ma ≥ `target`. Remis: gra trwa dalej.

### Storage

- `flip7:current` – gra w toku (lub brak).
- `flip7:history` – tablica zakończonych gier, najnowsze pierwsze.
- `flip7:lastPlayers` – nazwy graczy z ostatniej gry (podpowiedź).

### Ekrany

1. **Start**: lista graczy (dodaj, usuń, zmień kolejność), próg (domyślnie 200),
   przycisk "Graj". Jeśli istnieje `flip7:current` → pytanie "Kontynuować / Nowa".
   Link do historii.
2. **Tabela gry**: wiersz per gracz z sumą; numer rundy; wyróżniony dealer.
   Przyciski "Zakończ rundę" i "Cofnij ostatnią rundę".
3. **Wpisywanie rundy**: gracz po graczu. Domyślnie duża klawiatura numeryczna
   - przycisk "Bust" (0). Przycisk "Policz z kart" otwiera wybór kart (kafelki
     0–12 i modyfikatory); wynik liczony na żywo z `scoring.ts`, widoczny bust
     i bonus; wartość zatwierdzana ręcznie. Po ostatnim graczu → `addRound`.
4. **Koniec gry**: ekran zwycięzcy z tabelą końcową, gra trafia do historii,
   przycisk "Rewanż" (ten sam skład, nowa gra).
5. **Historia**: lista zakończonych gier (data, zwycięzca, wyniki), usuwanie wpisu.

Styl własny, inspirowany kolorystyką gry; nie korzysta z `theme.css`.

## Obsługa błędów

- Brak / pełny `localStorage`: aplikacja działa w pamięci, przy zapisie pokazuje
  krótki komunikat "Nie udało się zapisać".
- Uszkodzone dane (błąd parsowania): traktowane jak brak danych.
- Picker: utrata `pointercancel` (np. gest systemowy) traktowana jak oderwanie palca.

## Testy

- Vitest: `scoring.ts`, `game.ts`, `shared/storage.ts` (z mockiem localStorage).
- Widoki i picker: ręcznie na telefonie (iOS Safari, Android Chrome).
- CI blokuje deploy, gdy testy nie przechodzą.

## CLAUDE.md (zakres)

Struktura repo, zasada niezależności instancji, przepis "jak dodać nową grę",
komendy (`dev`, `build`, `test`, `format`), mobile-first jako wymóg, lokalizacja
speców i planów w `docs/superpowers/`.
