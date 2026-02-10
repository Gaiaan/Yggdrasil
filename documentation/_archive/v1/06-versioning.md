# 06 -- Wersjonowanie i Branchowanie Meta-Grafu

## Dlaczego Wersjonowanie Jest Kluczowe

Meta-graf jest jedynym źródłem prawdy. Musi być wersjonowany z tą samą (lub większą) rygoryznością co kod w tradycyjnym podejściu. Ale meta-graf to nie płaskie pliki -- to **strukturalny, relacyjny, wielowymiarowy graf**. To wymaga przemyślanego podejścia.

---

## Model Branchowania: Analogia do Git, ale na Grafie

System branchowania meta-grafu jest **koncepcyjnie analogiczny do Git**, bo ta analogia jest zrozumiała i sprawdzona. Ale implementacja jest inna, bo operuje na grafie, nie na plikach.

### Main (Gałąź Główna)

Stan produkcyjny meta-grafu. Reprezentuje "prawdę" -- aktualny, zatwierdzony model systemu.

- Tylko zatwierdzone (Approved) i zmaterializowane changesety trafiają do main
- Main jest zawsze spójny -- nigdy nie ma w nim niekompletnych zmian
- Z main materializuje się produkcyjny kod

### Feature Branch (Gałąź Funkcjonalności)

Gałąź robocza, na której nadzorca wprowadza zmiany. Odpowiednik feature branch w Git.

- Tworzona z main
- Izolowane środowisko na zmiany
- Może żyć równolegle z innymi branchami
- Mergowana do main po przejściu przez stany (Draft -> Review -> Approved -> Materialized)

### Hotfix Branch

Szybka poprawka krytycznego problemu:
- Tworzona z main
- Minimalne zmiany w meta-grafie (np. poprawka constraintu)
- Szybka ścieżka zatwierdzenia i materializacji

---

## Changeset: Atomiczna Jednostka Zmiany

Changeset to **zbiór zmian w meta-grafie w ramach jednej sesji**. Obejmuje:

- Dodane node'y
- Usunięte node'y
- Zmodyfikowane node'y (zmiana dokumentacji, constraintów, relacji)
- Dodane/usunięte relacje
- Zmiany w artefaktach (diagramy, opisy, specyfikacje)

### Cztery Stany Changesetu

| Stan | Opis | Kto odpowiada | Co się dzieje |
|---|---|---|---|
| **Draft** | Nadzorca pracuje nad zmianami | Nadzorca autora | Swobodna edycja, eksperymentowanie, iteracja |
| **Review** | Changeset gotowy do przeglądu | Reviewer(s) | Przegląd zmian, komentarze, propozycje poprawek |
| **Approved** | Zatwierdzony, gotowy do materializacji | System / Nadzorca | Oczekuje na decyzję o materializacji |
| **Materialized** | Kod wygenerowany i zwalidowany | System | Testy przechodzą, gotowe do merge |

Przejścia:
```
Draft ──> Review ──> Approved ──> Materialized ──> Merged to Main
  ^          │           │              │
  └──────────┘           │              │
  (wymaga poprawek)      │              │
  ^                      │              │
  └──────────────────────┘              │
  (wymaga zmian meta po review)         │
  ^                                     │
  └─────────────────────────────────────┘
  (testy failują -> powrót do precyzowania meta)
```

---

## Merge: Łączenie Gałęzi

### Merge bez Konfliktów

Jeśli changeset dotyka node'ów, które nie były zmieniane na main od momentu rozgałęzienia:
- Automatyczny merge
- Regeneracja dotkniętych node'ów (jeśli kontekst się zmienił)
- Walidacja testami

### Merge z Konfliktami

Jeśli dwa changesety dotykają tych samych node'ów:

```
main ─────A─────B──────────M (merge)
            \             /
             └──C──D──E──┘  (feature branch)
             
Gdzie B zmienił node X, a E też zmienił node X.
```

**Rozwiązywanie konfliktów:**

1. **System identyfikuje** które node'y są w konflikcie
2. **System pokazuje** obie wersje zmian z pełnym kontekstem
3. **Agent AI może zaproponować rozwiązanie** -- widzi intencje obu zmian, rozumie strukturę grafu, proponuje zharmonizowaną wersję
4. **Nadzorca zatwierdza** rozwiązanie lub modyfikuje ręcznie
5. **Regeneracja** dotkniętych node'ów po merge
6. **Walidacja** testami

Propozycja agenta nie jest wiążąca -- ale jest pomocna, bo agent widzi pełny kontekst obu zmian i strukturę grafu. Nadzorca klika "zaproponuj rozwiązanie" i dostaje propozycję, którą może przyjąć lub zmienić.

---

## Co Dokładnie Jest Wersjonowane

Wersjonowanie obejmuje **kompletny stan meta-grafu ze wszystkimi artefaktami**:

### Struktura grafu
- Drzewo node'ów (parent-child)
- Relacje (related)
- Tagi na node'ach

### Artefakty per node
- Opisy tekstowe
- Diagramy
- Constrainty
- Specyfikacje interfejsów
- Reguły biznesowe

### Metadane
- Przypisania nadzorców
- Statusy implementacji
- Historia zmian (kto, kiedy, co, dlaczego)

---

## Eventing i Historia Zmian

Każda zmiana w meta-grafie jest **zdarzeniem** (event). Historia grafu to **sekwencja zdarzeń**:

```
Event 1: NodeCreated { id: "auth-rate-limiter", parent: "auth", type: "Component" }
Event 2: ArtifactAdded { node: "auth-rate-limiter", type: "description", content: "..." }
Event 3: ConstraintAdded { node: "auth-rate-limiter", constraint: "max_attempts=5" }
Event 4: RelationCreated { from: "auth-rate-limiter", to: "login-service", type: "related" }
Event 5: ArtifactModified { node: "auth-rate-limiter", type: "description", diff: "..." }
```

To podejście event-sourcingowe daje:
- **Pełną historię** z kontekstem "dlaczego" (każdy event ma opis)
- **Odtworzenie stanu** z dowolnego momentu (replay events do danego punktu)
- **Audit trail** -- kto, kiedy i co zmienił
- **Naturalną obsługę branchy** -- branch to sekwencja eventów od punktu rozgałęzienia

---

## Wersjonowanie a Multi-Repo

Jedna sesja na meta-grafie może dotyczyć wielu repozytoriów kodu. System musi zapewnić **spójność między wersją meta-grafu a wersjami kodu w repozytoriach**.

```
Meta-graf v42 (main)
├── Repo: backend (branch: main, commit: abc123)
├── Repo: frontend (branch: main, commit: def456)
└── Repo: api-specs (branch: main, commit: ghi789)

Meta-graf branch: feature/password-reset
├── Repo: backend (branch: feature/password-reset)
├── Repo: api-specs (branch: feature/password-reset)
└── Repo: frontend (nie dotknięte, zostaje na main)
```

Gałąź meta-grafu **automatycznie tworzy odpowiadające gałęzie** w repozytoriach kodu, które są dotknięte zmianami. Repozytoria niedotknięte pozostają na swoich gałęziach.

Merge meta-grafu do main **odpowiada merge'owi** w dotkniętych repozytoriach.

Szczegóły zarządzania repozytoriami opisane w [07-code-generation.md](07-code-generation.md).
