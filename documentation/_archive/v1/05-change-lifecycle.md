# 05 -- Cykl Życia Zmiany: Od Briefu do Materializacji

## Scenariusz: Brief od Klienta

Mam meta-graf systemu. Dostaję prośbę od klienta o obsłużenie nowej funkcjonalności. Przygotowuję "Brief" jako wsad. Co dalej?

---

## Pełny Przepływ

### Faza 1: Brief (Wsad)

Brief to **niestrukturalny opis potrzeby** -- może to być:
- Opis funkcjonalności od klienta
- Wymaganie biznesowe od Product Ownera
- Pomysł techniczny od architekta
- Zgłoszenie buga od użytkownika

Brief wchodzi do systemu i **trafia do nadzorcy** odpowiedniego obszaru (lub do nadzorcy root, jeśli dotyczy całego systemu).

```
Przykład Brief:
"Klienci chcą móc resetować hasło przez email. 
Po kliknięciu 'zapomniałem hasła' dostają link ważny 24h."
```

### Faza 2: Analiza Wpływu (Impact Analysis)

Nadzorca (lub agent analizy) skanuje istniejący meta-graf i identyfikuje:

1. **Które node'y są dotknięte** -- Moduł Auth, Komponent LoginService, prawdopodobnie nowy node EmailService
2. **Jakie relacje trzeba dodać/zmienić** -- Auth -> EmailService (nowa relacja Related)
3. **Jakie interfejsy mogą się zmienić** -- AuthAPI dostaje nowy endpoint
4. **Jakie moduły mogą być pośrednio dotknięte** -- moduły zależne od AuthAPI muszą wiedzieć o nowym endpoincie (ale nie muszą się zmieniać)
5. **Jaka jest szacunkowa złożoność** -- ile node'ów trzeba dodać/zmienić

```
Agent analizy:
"Brief dotyczy modułu Auth. Proponuję:
 - Nowy node: PasswordResetService (child of Auth)
 - Nowy node: PasswordResetEmail (child of Auth, related to EmailService)
 - Zmiana: AuthAPI - nowy endpoint POST /auth/reset-password
 - Zmiana: AuthAPI - nowy endpoint POST /auth/reset-password/confirm
 - Nowa relacja: Auth -> EmailService (uses)
 - Nowy constraint: reset link validity = 24h
 
 Moduły Users i Orders nie są dotknięte.
 EmailService może wymagać rozbudowy jeśli nie obsługuje jeszcze szablonów."
```

### Faza 3: Utworzenie Gałęzi (Branch)

System tworzy **nową gałąź w meta-grafie** (analogicznie do git branch). Wszystkie zmiany będą dokonywane na tej gałęzi, nie na main.

```
main (produkcyjny meta-graf)
  └── branch: feature/password-reset
```

Na tej gałęzi nadzorca (lub agent) dokonuje zmian w meta-grafie.

### Faza 4: Modyfikacja Meta-Grafu

Nadzorca przegląda propozycję agenta analizy i:
- **Akceptuje** propozycje, które są poprawne
- **Modyfikuje** to, co wymaga korekty
- **Dodaje** brakujące elementy
- **Precyzuje** opisy i constrainty

Może to robić konwersacyjnie (chat z agentem), bezpośrednio (edycja node'ów) lub wizualnie (manipulacja grafem).

```
Nadzorca: "Tak, ale PasswordResetService powinien też obsługiwać
           reset przez SMS, nie tylko email. Dodaj SMSProvider 
           jako alternatywę. I ogranicz liczbę resetów do 3 na godzinę."

Agent: [Dodaje node SMSProvider]
       [Dodaje relację PasswordResetService -> SMSProvider]
       [Dodaje constraint: max 3 resets per hour per user]
       [Aktualizuje diagramy sekwencji]
```

### Faza 5: Stan "Do Zatwierdzenia" (Review)

Kiedy nadzorca uznaje, że zmiany w meta-grafie są kompletne, changeset przechodzi do stanu **Review**:

- W prostym scenariuszu (jeden nadzorca): sam zatwierdza
- W scenariuszu zespołowym: inny nadzorca lub nadzorca wyższego poziomu przegląda changeset
- W scenariuszu z wieloma obszarami: nadzorcy dotkniętych obszarów muszą zatwierdzić zmiany w "swoich" node'ach

To jest **merge request do meta-grafu** -- analogiczny do merge requesta w Git, ale na poziomie grafu.

### Faza 6: Zatwierdzenie (Approved)

Changeset jest zatwierdzony. Ale **jeszcze nie zmaterializowany** -- to osobny krok.

Nadzorca (lub proces automatyczny) decyduje o materializacji. Może zdecydować:
- Materializuj natychmiast
- Materializuj razem z innymi zmianami (batch)
- Materializuj konkretne node'y, a inne później

### Faza 7: Planowanie Implementacji

System analizuje **drzewo zależności** zmienionych/nowych node'ów i ustala kolejność materializacji:

```
Kolejność implementacji (dependency-driven):

1. EmailService (jeśli nie istnieje lub wymaga zmian)
   └── nie zależy od niczego nowego
   
2. SMSProvider
   └── nie zależy od niczego nowego

3. PasswordResetService
   └── zależy od: EmailService, SMSProvider (oba muszą być gotowe)
   
4. AuthAPI (aktualizacja interfejsu)
   └── zależy od: PasswordResetService
   
5. Testy integracyjne
   └── zależą od: wszystkich powyższych
```

### Faza 8: Materializacja (Code Generation)

Dla każdego node'a w kolejności zależności:

1. **Budowanie kontekstu** -- zbierz meta-opis node'a + kontekst z hierarchii + kontrakty z relacji
2. **Wywołanie generatora kodu** -- przekaż kontekst do wybranego generatora (Claude, Gemini, inny)
3. **Wygenerowanie kodu** -- generator tworzy implementację zgodną z meta-opisem
4. **Wygenerowanie testów** -- generator tworzy testy wynikające z constraintów i specyfikacji
5. **Uruchomienie testów** -- natychmiastowa weryfikacja

```
Materializacja: PasswordResetService

Kontekst dla generatora:
- Node: PasswordResetService (opis, constrainty, reguły biznesowe)
- Hierarchia: Auth -> globalny tech stack (TypeScript, NestJS)
- Relacje: używa EmailService (interfejs: ...), używa SMSProvider (interfejs: ...)
- Constrainty: max 3 resets/hour, link ważny 24h, obsługuje email i SMS

Generator: [tworzy implementację]
Tester: [uruchamia testy wynikające z constraintów]
Wynik: PASS / FAIL
```

### Faza 9: Walidacja

Jeśli wszystkie testy przechodzą -- implementacja jest gotowa.

Jeśli testy failują -- **pętla powraca do nadzorcy**:
- Agent raportuje: "Test X failuje bo [powód]"
- Nadzorca decyduje: doprecyzuj meta-opis ALBO podziel node na mniejsze ALBO zmień constraint
- Regeneracja dotkniętych node'ów
- Ponowne testy

**Nadzorca NIGDY nie poprawia wygenerowanego kodu.**

### Faza 10: Merge do Main

Kiedy materialized branch jest zwalidowany:
1. Merge meta-grafu do main
2. Merge kodu do odpowiednich repozytoriów
3. Aktualizacja statusów implementacji w grafie
4. Opcjonalnie: deployment

---

## Cztery Stany Changesetu

Changeset (sesja zmian w meta-grafie) przechodzi przez 4 stany:

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────────┐
│  DRAFT   │───>│  REVIEW  │───>│ APPROVED │───>│ MATERIALIZED  │
│          │    │          │    │          │    │               │
│ Pracuję  │    │ Do       │    │ Ktoś     │    │ Kod           │
│ nad      │    │ zatwier- │    │ zatwier- │    │ zmateriali-   │
│ zmianami │    │ dzenia   │    │ dził     │    │ zowany i      │
│          │    │          │    │          │    │ zwalidowany   │
└──────────┘    └──────────┘    └──────────┘    └───────────────┘
      │               │               │
      └──── powrót ◄──┘──── powrót ◄──┘
       (wymaga poprawek)  (wymaga zmian)
```

---

## Sesja jako Koncept Spójności

Jedna sesja zmian (changeset) na meta-grafie może dotyczyć **wielu node'ów, wielu modułów, a nawet wielu repozytoriów kodu**. Sesja jest atomiczną jednostką zmiany.

Przykład: dodanie funkcji "reset hasła" zmienia:
- 3 node'y w meta-grafie
- 2 pliki w repozytorium backend
- 1 plik w repozytorium API specs
- 1 plik w repozytorium email templates

Wszystkie te zmiany należą do **jednej sesji** i są traktowane atomicznie. Sesja ma swoją gałąź w meta-grafie i odpowiadające gałęzie w repozytoriach kodu (patrz: [07-code-generation.md](07-code-generation.md) dla szczegółów zarządzania repozytoriami).

---

## Obsługa Równoległych Zmian

Dwóch nadzorców pracuje równolegle nad "zahaczającymi" się funkcjonalnościami:

```
main
├── branch: feature/password-reset     (nadzorca A)
│   └── zmienia: Auth, EmailService
└── branch: feature/2fa-authentication (nadzorca B)
    └── zmienia: Auth, SMSProvider
```

Oba branche dotykają modułu Auth. System obsługuje to analogicznie do Git:

1. Pierwszy merge do main przechodzi bez problemów
2. Drugi merge wykrywa konflikt w meta-grafie (oba zmieniają Auth)
3. System pokazuje konflikt nadzorcy B
4. Agent może **zaproponować rozwiązanie** (widzi oba changesety, rozumie intencje)
5. Nadzorca B zatwierdza lub modyfikuje propozycję
6. Merge przechodzi, kod jest regenerowany dla dotkniętych node'ów

Szczegóły wersjonowania i branchowania opisane w [06-versioning.md](06-versioning.md).
