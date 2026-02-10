# 04 -- Nadzorcy i Role

## Kto Operuje na Meta-Grafie

Meta-graf nie modyfikuje się sam. Zawsze stoi za zmianą **nadzorca** -- byt odpowiedzialny za definiowanie, precyzowanie i zatwierdzanie meta-opisu w swoim obszarze.

---

## Typy Nadzorców

### Nadzorca-Człowiek

Najbardziej naturalny model, szczególnie na początku (MVP) i w krytycznych obszarach.

**Profil typowego nadzorcy-człowieka:**
- **Architekt** -- definiuje strukturę systemu, moduły, interfejsy, wzorce
- **Senior Developer** -- precyzuje komponenty, algorytmy, szczegóły implementacyjne
- **Product Owner** -- definiuje reguły biznesowe, przepływy, wymagania funkcjonalne
- **Osoba bez wiedzy technicznej** -- promptuje od zera, agent buduje meta-graf konwersacyjnie

Każdy z tych profili jest prawidłowy. System nie blokuje nikogo -- enable'uje każdego. Różnica polega na głębokości i precyzji meta-opisu:

| Profil | Jak pracuje z meta | Jakość wynikowa |
|---|---|---|
| Architekt | Precyzyjne specyfikacje, diagramy, constrainty | Najwyższa -- agent ma jednoznaczny kontekst |
| Senior Dev | Techniczne opisy, pseudokod, wzorce | Bardzo dobra -- agent ma solidne ramy |
| Product Owner | Reguły biznesowe, user stories, przepływy | Dobra dla logiki biznesowej, może wymagać tech. nadzorcy dodatkowo |
| Laik | Opis "po normalnemu" co chce osiągnąć | Prototypowa -- agent zgaduje wiele decyzji, ale prototyp powstaje |

**Zasada: system jest tak dobry, jak precyzyjny jest meta-opis. Ale nawet nieprecyzyjny meta-opis daje wynik -- po prostu mniej deterministyczny.**

### Nadzorca-Agent AI

Agent AI wyznaczony jako nadzorca danego obszaru. Działa w ramach constraintów zdefiniowanych przez wyższy poziom (człowieka lub innego nadzorcę).

**Scenariusze:**
- Człowiek definiuje architekturę wysokopoziomową, agent-nadzorca rozbija ją na szczegółowe komponenty
- Człowiek zatwierdza zmiany proponowane przez agenta-nadzorcę
- Agent-nadzorca monitoruje testy i proponuje poprawki meta-opisu gdy testy failują

### Nadzorca "Wypromptowany"

System sam identyfikuje potrzebę nadzorcy w danym obszarze i go tworzy. To jest scenariusz docelowy, nie MVP.

Przykład: system widzi, że poddrzewo "Moduł Payments" staje się złożone i nie ma przypisanego nadzorcy. Proponuje stworzenie nadzorcy-agenta z kontekstem tego poddrzewa.

---

## Obszary Odpowiedzialności

### Niezależność Obszarów

Kluczowa zasada: **obszary w grafie są co do zasady niezależne i mogą mieć niezależnych nadzorców**.

```
System (root) ← nadzorca: CTO (człowiek)
├── Moduł: Auth ← nadzorca: Security Architect (człowiek)
├── Moduł: Users ← nadzorca: Agent AI (wyznaczony)
├── Moduł: Orders ← nadzorca: Senior Dev (człowiek)
├── Moduł: Payments ← nadzorca: Payments Specialist (człowiek)
└── Moduł: Reports ← nadzorca: Agent AI (wypromptowany)
```

Każdy nadzorca:
- **Widzi i edytuje** swoje poddrzewo
- **Widzi (read-only)** interfejsy sąsiednich modułów (żeby znać kontrakty)
- **Nie musi znać** implementacyjnych detali innych obszarów
- **Może pracować równolegle** z innymi nadzorcami na oddzielnych branchach

### Hierarchia Nadzorców

Nadzorca wyższego poziomu ma autorytet nad nadzorcami podrzędnymi:

```
Nadzorca root (CTO)
├── Definiuje: globalne zasady, tech stack, standardy
├── Zatwierdza: zmiany w interfejsach między modułami
└── Deleguje: szczegóły modułów do nadzorców obszarowych
    
    Nadzorca modułu Auth (Security Architect)
    ├── Definiuje: strukturę wewnątrz Auth, komponenty, przepływy
    ├── Respektuje: globalne constrainty z root
    └── Zmienia: cokolwiek wewnątrz swojego poddrzewa
```

Zmiany w interfejsach (node'y Related łączące moduły różnych nadzorców) mogą wymagać zatwierdzenia przez nadzorcę wyższego poziomu lub koordynacji między nadzorcami.

---

## Jak Nadzorca Pracuje z Meta-Grafem

### Tryb Konwersacyjny (Chat/Prompt)

Nadzorca rozmawia z agentem AI, który modyfikuje meta-graf:

```
Nadzorca: "Dodaj do modułu Auth mechanizm rate limitingu. 
           Maksymalnie 5 nieudanych prób logowania na 15 minut, 
           potem blokada konta tymczasowa."

Agent: [Tworzy nowy node "RateLimiter" jako dziecko Auth]
       [Dodaje constrainty: max_attempts=5, window=15min]
       [Dodaje relację Related do LoginService]
       [Aktualizuje diagram integracyjny Auth]
       
Nadzorca: [Przegląda zmiany w grafie, zatwierdza lub koryguje]
```

Jest to analogiczne do obecnych trybów Agent + Plan + Ask, ale zamiast operować na kodzie, agent operuje na meta-grafie. To jest naturalne zastosowanie tych trybów -- precyzowanie funkcjonalności jest dokładnie tym, w czym są dobre. Wywalają się dopiero przy implementacji na skomplikowanym kodzie.

### Tryb Bezpośredni (Edycja Ręczna)

Nadzorca bezpośrednio edytuje node'y, ich dokumentację, diagramy, relacje. Dla doświadczonych osób, które wiedzą dokładnie czego chcą.

### Tryb Wizualny (Przeglądanie Grafu)

Nadzorca przegląda graf wizualnie, widzi strukturę, statusy implementacji, problemy. Może manipulować graf drag-and-drop, tworzyć relacje wizualnie, przeglądać dokumentację node'ów.

**Wybór trybu zależy od preferencji nadzorcy.** Ktoś woli tekst, ktoś woli widzieć node'y. Oba podejścia są równoważne.

---

## Nadzorca a Implementacja -- Kluczowy Przepływ

```
                    ┌──────────────┐
                    │   Nadzorca   │
                    │ (def. meta)  │
                    └──────┬───────┘
                           │ definiuje / precyzuje
                           ▼
                    ┌──────────────┐
                    │  Meta-Graf   │
                    │ (source of   │
                    │   truth)     │
                    └──────┬───────┘
                           │ klika "Implementuj"
                           ▼
                    ┌──────────────┐
                    │   Silnik     │
                    │ materializacji│
                    │ (generatory) │
                    └──────┬───────┘
                           │ generuje
                           ▼
                    ┌──────────────┐
                    │  Kod + Testy │
                    │ (artefakty)  │
                    └──────┬───────┘
                           │ uruchamia testy
                           ▼
                    ┌──────────────┐
                    │   Wynik      │
                    │  testów      │
                    └──────┬───────┘
                           │ raportuje do
                           ▼
                    ┌──────────────┐
                    │   Nadzorca   │
                    │  (weryfikuje │
                    │   i iteruje) │
                    └──────────────┘
```

Jeśli testy failują -> nadzorca precyzuje meta -> regeneracja -> ponowne testy. Pętla trwa aż do sukcesu albo decyzji nadzorcy o innym podejściu.

**Nadzorca NIGDY nie poprawia kodu. Zawsze wraca do meta.**
