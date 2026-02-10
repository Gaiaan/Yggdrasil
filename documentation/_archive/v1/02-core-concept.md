# 02 -- Koncept Fundamentalny: Dwa Światy

## Zasada Naczelna: Meta i Kod

System operuje na dwóch odrębnych, ale powiązanych płaszczyznach:

```
┌─────────────────────────────────────────────────┐
│                  ŚWIAT META                      │
│                                                  │
│  Edytowalny przez nadzorcę (człowiek / AI)      │
│  Wersjonowany, branchowalny, audytowalny        │
│  Graf obiektów + dokumentacja + constrainty      │
│                                                  │
│  ═══════════════ BARIERA ═══════════════════     │
│         (jednokierunkowa materializacja)          │
│                                                  │
│                  ŚWIAT KODU                       │
│                                                  │
│  Generowany automatycznie z meta-opisu           │
│  NIGDY nie edytowany bezpośrednio                │
│  Testy wynikające z meta weryfikują poprawność   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Bariera między światami jest jednokierunkowa

Meta -> Kod. Zawsze. Bez wyjątków.

- Chcesz zmienić zachowanie systemu? Zmień meta-opis.
- Znalazłeś buga? Napraw go na meta-poziomie (doprecyzuj opis, dodaj constraint) i regeneruj.
- Chcesz zrefaktorować? Zmień strukturę grafu i pozwól na rematerializację.

Ta zasada jest **absolutna i nienaruszalna**. Kod nie jest edytowalny. Można jedynie precyzować metapoziom. To jest analogia do Infrastructure as Code (Terraform) doprowadzona do poziomu całej aplikacji -- nie logujesz się na serwer i nie edytujesz ręcznie, zmieniasz deklarację i aplikujesz.

### Dlaczego to jest nienaruszalne?

Gdyby kod był edytowalny, meta-graf straciłby status jedynego źródła prawdy. Powstałby drift -- meta mówi jedno, kod robi co innego. System traci sens istnienia. Dlatego:

- **Meta-graf = specyfikacja = source of truth**
- **Kod = artefakt kompilacji z meta-grafu**
- **Testy = artefakt kompilacji z meta-grafu, weryfikujący kod**

---

## Trzy Filary Systemu

### Filar 1: Meta-Graf jako Formalna Reprezentacja Systemu

System jest reprezentowany jako **hierarchiczny graf obiektów** o potencjalnie nieskończonej głębokości:

```
System (root)
├── Moduł: Auth
│   ├── Komponent: LoginService
│   │   ├── Funkcja: validateCredentials
│   │   └── Funkcja: generateToken
│   ├── Komponent: SessionManager
│   └── Interfejs: AuthAPI (specyfikacja kontraktu)
├── Moduł: Users
│   ├── Komponent: UserRepository
│   └── Interfejs: UserAPI
└── Moduł: Orders
    └── ...
```

Każdy node (obiekt) w grafie:
- Ma **dokumentację** -- opis słowny, diagramy, constrainty, cokolwiek co AI rozumie
- Ma **kontekst z hierarchii wyżej** -- globalne zasady, tech stack, standardy
- Ma **relacje** z innymi node'ami -- zależności, kontrakty interfejsów
- Może mieć **testy** -- wynikające wprost z meta-opisu
- Ma **status implementacji** -- czy kod został zmaterializowany i czy testy przechodzą

Głębokość hierarchii jest **dowolna**. Nadzorca decyduje, jak głęboko chce definiować strukturę. Może mieć dwa poziomy (System -> Moduły) albo dziesięć. System nie narzuca.

### Filar 2: Nadzorca jako Jedyny Aktor Modyfikujący Meta

Metapoziom jest **weryfikowalny i edytowalny przez nadzorcę**. Nadzorca może być:

- **Człowiekiem** -- architekt, senior developer, product owner
- **Agentem AI** -- wyznaczonym przez człowieka lub "wypromptowanym" przez system
- **Hybrydą** -- agent proponuje, człowiek zatwierdza

Nadzorca operuje na meta-grafie przez:
- Konwersacyjne promptowanie (chat z agentem budującym meta-graf)
- Bezpośrednią edycję node'ów i ich dokumentacji
- Wizualny przegląd i manipulację grafem

**Kluczowe:** Różni nadzorcy mogą odpowiadać za różne obszary grafu. Moduł Auth może mieć jednego nadzorcę, moduł Orders -- innego. Obszary są niezależne. Nadzorca nie musi znać całego systemu -- musi znać swój obszar i interfejsy z otoczeniem.

### Filar 3: Obecność Metapoziomu Wymusza Implementację jako Pochodną

To jest serce systemu: **sam fakt istnienia formalnego meta-opisu oznacza, że implementacja MUSI być z niego wyprowadzona**. Nie ma alternatywy.

Konsekwencje:
- Każda zmiana w zachowaniu systemu zaczyna się od zmiany w meta-grafie.
- Agent implementujący dostaje precyzyjny kontekst z meta (opis node'a + hierarchia + relacje).
- Testy wynikają z meta-opisu i weryfikują, czy implementacja jest zgodna z intencją.
- Jeśli agent robi błędy -- nadzorca **nie poprawia kodu**, lecz **precyzuje meta** (dzieli obiekt na mniejsze, doprecyzowuje opis, dodaje constrainty).

---

## Globalne Informacje vs. Niezależne Obszary

System rozróżnia dwa typy wiedzy:

### Wiedza Globalna
- **Tech stack** -- dozwolone języki, frameworki, narzędzia
- **Standardy kodowania** -- konwencje, formatowanie, wzorce
- **Polityki bezpieczeństwa** -- uwierzytelnianie, szyfrowanie, zarządzanie sekretami
- **Wzorce architektoniczne** -- zatwierdzone patterns, anti-patterns
- **Design system** -- jeśli dotyczy UI

Te informacje żyją na najwyższych poziomach grafu (root lub blisko root) i są **dziedziczone** przez wszystkie node'y niżej. Każdy agent generujący kod widzi je jako część kontekstu.

### Wiedza Obszarowa (Per Node / Per Poddrzewo)
- Opis biznesowy danego modułu
- Diagramy integracyjne wewnątrz modułu
- Precyzyjne definicje co robią poszczególne komponenty i dlaczego
- Interfejsy, kontrakty API, modele danych
- Constrainty specyficzne dla danego obszaru

Obszary są **niezależne** i mogą mieć:
- Niezależnych nadzorców
- Różne poziomy granulacji meta-opisu
- Różne tempo zmian
- Różny stopień dojrzałości

---

## Samodostrajanie Granulacji

Kluczowy mechanizm systemu: **jeśli agent AI robi błędy w implementacji danego node'a, to nadzorca ma za zadanie tak ograniczyć kontekst (podzielić obiekt na mniejsze albo zbudować hierarchię wewnątrz niego), żeby AI nie robiło błędów**.

To oznacza, że system sam się kalibruje:
- Duże, proste moduły mogą mieć płytką hierarchię
- Skomplikowane moduły będą rozbite na wiele małych, precyzyjnie opisanych obiektów
- Granulacja wynika z **zdolności AI do poprawnego generowania**, nie z arbitralnych reguł

W praktyce: dany obiekt jest tak dobry, jak pozwala mu wiedza (meta-opis + kontekst). Nadzorca iteruje precyzję meta-opisu, aż jakość generowanego kodu jest akceptowalna.

---

## Format Opisu -- Agnostyczny

Meta-opis node'a może być wyrażony **w dowolny sposób, który AI rozumie**:
- Język naturalny (opis słowny)
- Diagramy (UML, Mermaid, C4 model)
- Pseudokod
- Formalne constrainty
- Kombinacja powyższych

System nie narzuca formatu. Decyzja należy do nadzorcy. Ktoś doświadczony napisze precyzyjne specyfikacje z diagramami sekwencji. Ktoś prototypujący bez wiedzy technicznej opisze "po normalnemu" co chce osiągnąć. Oba podejścia są prawidłowe -- różnią się jakością wynikowego kodu, ale nigdy nie blokują procesu.

**Zasada projektowa: nie blokować, a enable'ować.**
