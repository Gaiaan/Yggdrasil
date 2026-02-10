# 09 -- Adopcja: Greenfield, Brownfield, Elastyczność

## Zasada Projektowa: Łatwa Adopcja Niezależnie od Projektu

Adopcja systemu musi być łatwa niezależnie od:
- Czy projekt jest nowy (greenfield) czy istniejący (brownfield)
- Czy używa mono-repo, multi-repo czy hybrydy
- Jaki jest tech stack
- Jaki jest rozmiar zespołu i organizacji
- Jaki jest poziom doświadczenia nadzorcy

**To jest must-have dla MVP.** System, który wymaga migracji całego codebase przed daniem wartości, nie ma szansy na adopcję.

---

## Greenfield: Naturalna Ścieżka

Dla nowego projektu meta-graf jest **naturalnym punktem startu**. Przepływ:

### Krok 1: Konwersacyjne Budowanie Architektury

Nadzorca promptuje agenta, opisując co chce zbudować:

```
Nadzorca: "Chcę zbudować system e-commerce. 
           Powinien mieć rejestrację, katalog produktów, 
           koszyk i płatności. Stack: TypeScript, NestJS, PostgreSQL."

Agent: [Tworzy root node: System E-Commerce]
       [Tworzy dzieci: Auth, Catalog, Cart, Payments]
       [Dodaje globalne konfiguracje: tech stack, standardy]
       [Proponuje relacje: Cart -> Catalog, Payments -> Cart, Auth -> all]
```

### Krok 2: Iteracyjne Precyzowanie

Nadzorca przegląda graf, koryguje, dodaje detale:

```
Nadzorca: "Auth powinien obsługiwać Google OAuth oprócz loginu email/password.
           W katalogu produkty mają warianty (rozmiary, kolory).
           Płatności przez Stripe."

Agent: [Rozbudowuje node'y, dodaje constrainty, aktualizuje relacje]
```

### Krok 3: Wchodzenie w Detale

Z czasem nadzorca definiuje coraz głębszą strukturę:

```
Nadzorca: "W module Auth chcę mieć osobny komponent do zarządzania sesjami.
           Sesje w Redis, TTL 30 minut, refresh automatyczny przy aktywności.
           Dodaj rate limiting na publiczne endpointy."

Agent: [Tworzy SessionManager, definiuje constrainty, dodaje diagramy]
```

### Krok 4: Materializacja

Kiedy nadzorca uznaje, że meta-graf jest wystarczająco precyzyjny:
- Klika "Implementuj"
- System buduje drzewo zależności
- Materializuje kod i testy w kolejności dependencji
- Nadzorca weryfikuje wyniki

### Krok 5: Iteracja

Jeśli wynik nie jest idealny -> powrót do meta, precyzowanie, rematerializacja. Pętla trwa aż do satysfakcji nadzorcy.

**Dla greenfield to jest naturalna, intuicyjna ścieżka.** Od ogółu do szczegółu, z materializacją w dowolnym momencie.

---

## Brownfield: Nałożenie Meta-Grafu na Istniejący Codebase

To jest trudniejszy, ale absolutnie kluczowy scenariusz. Firmy mają istniejące systemy i nie mogą ich przepisać od zera.

### Tryb Eksploracji Kodu

System oferuje **tryb eksploracji**, który analizuje istniejący codebase i buduje meta-graf opisujący to, co już istnieje.

#### Jak to działa:

1. **Wskazanie obszaru** -- nadzorca wskazuje katalog/repozytorium/zestaw plików
2. **Agent eksploracji** skanuje kod i buduje artefakty opisujące node'y:
   - Identyfikuje moduły, klasy, serwisy, interfejsy
   - Rozpoznaje relacje między nimi (importy, wywołania, zależności)
   - Generuje opisy tekstowe co dany fragment robi
   - Identyfikuje interfejsy publiczne
3. **Tworzenie node'ów** w meta-grafie na podstawie eksploracji
4. **Nadzorca weryfikuje i koryguje** -- agent mógł źle zinterpretować intencje

```
Nadzorca: "Zeskanuj katalog src/modules/auth/"

Agent eksploracji:
"Znalazłem:
 - AuthController (obsługuje HTTP requests)
 - AuthService (logika biznesowa: login, register, refresh)
 - JwtStrategy (walidacja tokenów)
 - UserEntity (model danych użytkownika)
 - AuthGuard (middleware do ochrony endpointów)
 
 Proponuję graf:
 Moduł: Auth
 ├── Komponent: AuthController (interfejs HTTP)
 ├── Komponent: AuthService (logika)
 ├── Komponent: JwtStrategy (uwierzytelnianie)
 ├── Model: UserEntity
 └── Komponent: AuthGuard (middleware)
 
 Relacje:
 - AuthController -> AuthService (calls)
 - AuthService -> UserEntity (uses)
 - AuthService -> JwtStrategy (uses)
 - AuthGuard -> JwtStrategy (uses)"

Nadzorca: "OK, ale JwtStrategy i AuthGuard to jeden logiczny komponent.
           Połącz je jako AuthMiddleware. Resztę zostawiam."
```

### Inkrementalna Adopcja

Nadzorca **nie musi** od razu objąć całego codebase meta-grafem. Może:

1. **Zacząć od jednego modułu** -- np. Auth. Zbudować meta-graf, zwalidować.
2. **Stopniowo dodawać kolejne moduły** -- każdy w swoim tempie.
3. **Nowe funkcjonalności od razu w meta** -- od pewnego momentu, nowy kod powstaje wyłącznie przez meta-graf.
4. **Stary kod żyje równolegle** -- nie ma przymusu migracji. Meta-graf pokrywa tyle, ile nadzorca zdecyduje.

### Mapowanie na Istniejącą Strukturę Plików

Meta-graf nie wymusza reorganizacji kodu. Node'y mapują się na istniejącą strukturę:

```
Node: AuthService
├── mapped to: src/modules/auth/auth.service.ts
├── existing tests: src/modules/auth/auth.service.spec.ts
└── status: explored (nie zmaterializowany, tylko opisany)
```

W trybie brownfield, kod istniejący **nie jest regenerowany** (chyba że nadzorca explicite tego zażąda). Meta-graf służy jako **mapa i dokumentacja**, a nowe zmiany przechodzą przez meta-flow.

---

## Elastyczność Systemu: Wymienne Komponenty

### Wymienialny Renderer Grafu

System wizualizacji meta-grafu jest **wymienialnym komponentem**:
- Może być webowa aplikacja z interaktywnym grafem
- Może być plugin do IDE (VSCode, IntelliJ)
- Może być CLI z tekstową reprezentacją
- Może być custom UI dla specyficznych potrzeb

Renderer to **widok**, nie logika. Zmiana renderera nie wpływa na meta-graf.

### Wymienialny Generator Kodu

Jak opisano w [07-code-generation.md](07-code-generation.md) -- generator jest wymienialny. Ale w kontekście adopcji to jest kluczowe:

- Firma używająca Claude Code może od razu zacząć
- Firma preferująca Gemini CLI może użyć innego generatora
- Firma z custom toolingiem może napisać adapter
- **Brak vendor lock-in na poziomie generatora**

### Wymienialny Store Kodu

System nie jest przywiązany do jednego hostingu kodu:
- GitHub, GitLab, Bitbucket, Azure DevOps
- Self-hosted Git
- Dowolny system kontroli wersji, do którego da się zrobić adapter

### Konfigurowalny Sposób Pracy

Różne firmy różnie pracują. System to respektuje:
- **Jeden nadzorca na cały system** -- startup, mały projekt
- **Wielu nadzorców per moduł** -- średnia firma
- **Hierarchia nadzorców z zatwierdzeniami** -- enterprise
- **Pełna autonomia agentów** -- eksperymentalny, zaawansowany

---

## Kompatybilność ze Strukturami Repozytoriów

### Mono-repo

```
Meta-graf:
System -> Moduł A, Moduł B, Moduł C

Mapowanie:
├── Moduł A -> repo: monorepo, path: packages/module-a/
├── Moduł B -> repo: monorepo, path: packages/module-b/
└── Moduł C -> repo: monorepo, path: packages/module-c/

Branch strategy:
Jeden branch w mono-repo na changeset.
```

### Multi-repo

```
Meta-graf:
System -> Moduł A, Moduł B, Moduł C

Mapowanie:
├── Moduł A -> repo: github.com/org/module-a
├── Moduł B -> repo: github.com/org/module-b
└── Moduł C -> repo: github.com/org/module-c

Branch strategy:
Osobny branch w każdym dotkniętym repo. Taka sama nazwa brancha.
```

### Hybrid

```
Meta-graf:
System -> Backend (shared), Frontend (osobne)

Mapowanie:
├── Backend Modules (A, B, C) -> repo: backend-monorepo
├── Frontend App -> repo: frontend
└── Shared Types -> repo: shared-types

Branch strategy:
Changeset tworzy branche w dotkniętych repozytoriach.
```

### Testy w Kontekście Multi-Repo

- **Testy modułowe** -- żyją w repo modułu
- **Testy integracyjne** -- mogą żyć w osobnym repo lub w repo wyższego poziomu
- **Testy globalne/firmowe** -- repo testów e2e lub w głównym repo
- **Mapowanie konfigurowane** przez nadzorcę na meta-poziomie

---

## MVP: Minimalna Ścieżka do Wartości

Dla MVP adopcji, najkrótsza ścieżka:

1. **Podłącz repozytorium** (jedno lub wiele)
2. **Wskaż obszar do eksploracji** (lub zacznij od zera)
3. **Zbuduj meta-graf** (konwersacyjnie lub przez eksplorację)
4. **Wprowadź pierwszą zmianę przez meta** (Brief -> Analiza -> Zmiana meta -> Materializacja)
5. **Zobaczysz wynik** (wygenerowany kod + testy w Twoim repo, na Twoim branchu)

Od tego momentu każda kolejna zmiana może przechodzić przez meta-graf. Adopcja jest **inkrementalna i nieblokująca**.
