# 04 -- Specyfikacja Yggdrasil (Etap 1)

## Cel Etapu

Zbudować **działający produkt** z module store, który pozwala składać system z architektonicznych modułów i materializować go w wybranym tech stacku. Revenue od dnia 1.

---

## Krok 0: Ręczna Walidacja (Przed Budowaniem)

Zanim zostanie napisana choćby linia kodu silnika:

1. Weź 3-5 modułów (Auth, Users, Orders, Payments, Notifications)
2. Ręcznie przygotuj pakiety kontekstowe takie, jakie budowałby Context Builder:
   - Globalne zasady (tech stack, standardy)
   - Opis modułu (constrainty, reguły biznesowe)
   - Interfejsy zależności (co inne moduły eksponują)
3. Wrzuć każdy pakiet do Claude API
4. Oceń wynik: czy kod jest spójny z kontekstem? Czy respektuje interfejsy? Czy constrainty są zaimplementowane?
5. Zrób to dla 2-3 różnych tech stacków

**Jeśli wynik jest konsekwentnie dobry** → buduj silnik.
**Jeśli wynik jest niestabilny** → iteruj format pakietu kontekstowego zanim zbudujesz cokolwiek.

Czas: 1 weekend.

---

## Scope Yggdrasil: IN / OUT

### IN

| Feature | Szczegóły |
|---|---|
| **Meta-graf engine** | Node'y, relacje (Parent-Child, Related), artefakty tekstowe, constrainty, interfejsy |
| **Context Builder** | 3-warstwowy pakiet: hierarchia + node + relacje. Dziedziczenie z przodków. |
| **Materialization** | 1 generator (Claude API). Dependency-first kolejność. Output: kod + testy. |
| **Module Store (seed)** | 10-20 gotowych modułów. Browse, add to project, customize. |
| **Web UI** | Graf visualization, edycja node'ów, store browser, materialize button, status view |
| **Output** | Download ZIP / push to GitHub repo |
| **Accounts** | Rejestracja, login, moje projekty, moje moduły |
| **Revenue** | Free tier (ograniczony) + Pro tier (płatny) |

### OUT (Later Stages)

| Feature | Etap |
|---|---|
| Testy z meta (pełna pętla walidacyjna) | Völundr |
| Pending Changes z kodu | Völundr |
| Tagi i aspekty | Völundr |
| Community module publishing | Völundr |
| Wiele generatorów | Völundr |
| Brownfield scan | Huginn & Muninn |
| Branchowanie meta-grafu | Huginn & Muninn |
| Multi-repo | Huginn & Muninn |
| Team features | Huginn & Muninn |
| AI-nadzorcy | Valhalla |
| On-premise | Valhalla |

---

## Format Node'a w Meta-Grafie

```yaml
id: order-service
name: OrderService
type: service
parent: orders-module

description: |
  Serwis zarządzający zamówieniami.
  Zamówienia przechodzą statusy: Draft → Submitted → Processing → Completed.
  Tworzenie wymaga uwierzytelnionego użytkownika i ważnych produktów.

constraints:
  - "Minimalna wartość zamówienia: 10 PLN"
  - "Maksymalnie 50 pozycji w jednym zamówieniu"
  - "Zamówienie Completed nie może być anulowane"

interface:
  exports:
    - "createOrder(userId, cartId) → Order"
    - "getOrder(orderId) → Order"  
    - "cancelOrder(orderId) → void"
    - "listOrders(userId, filters) → Order[]"
  events:
    - "OrderCreated { orderId, userId, total }"
    - "OrderStatusChanged { orderId, oldStatus, newStatus }"

relations:
  - target: auth-service
    type: uses
    what: "Weryfikacja tokenu użytkownika"
  - target: payment-service
    type: calls  
    what: "Inicjuje płatność po Submitted"
  - target: product-catalog
    type: reads
    what: "Pobiera dane produktów, sprawdza dostępność"
```

### Format Modułu w Store

Moduł w store to **node (lub poddrzewo node'ów)** z dodatkowym metadanem:

```yaml
# Module Store metadata
store:
  name: "JWT Authentication"
  slug: auth-jwt
  version: "1.0.0"
  author: "yggdrasil"
  description: "Complete JWT auth with refresh tokens, rate limiting, session management"
  tags: ["auth", "jwt", "security"]
  supported_stacks: ["typescript-nestjs", "typescript-express", "python-fastapi"]
  
  requires: []  # no dependencies on other store modules
  provides:
    - interface: auth-service
      exports:
        - "login(email, password) → { token, refreshToken }"
        - "register(email, password, name) → User"
        - "refreshToken(refreshToken) → { token }"
        - "validateToken(token) → User"
        - "logout(token) → void"

# Meta-graph content (the actual nodes)
nodes:
  - id: auth-module
    name: AuthModule
    type: module
    description: |
      Moduł uwierzytelniania JWT z refresh tokenami.
      Rate limiting: max 5 nieudanych logowań / 15 min per IP.
      Tokeny JWT: access TTL 15min, refresh TTL 7 dni.
    constraints:
      - "Access token TTL: 15 minut"
      - "Refresh token TTL: 7 dni"
      - "Max 5 nieudanych logowań per IP per 15 minut"
      - "Hasło: min 8 znaków, musi zawierać cyfrę"
    children:
      - id: login-service
        # ...
      - id: token-manager
        # ...
      - id: rate-limiter
        # ...
```

---

## Context Builder -- Jak Buduje Pakiet

Dla node'a `order-service`:

```
KROK 1: Zbierz hierarchię (góra → dół)
├── root: { tech_stack: "TypeScript, NestJS, PostgreSQL", standards: "..." }
└── orders-module: { description: "Domena zamówień", ... }

KROK 2: Zbierz własny kontekst  
└── order-service: { description, constraints, interface, ... }

KROK 3: Zbierz interfejsy z relacji
├── auth-service.interface: { exports: ["validateToken(token) → User", ...] }
├── payment-service.interface: { exports: ["createPayment(orderId, amount) → Payment", ...] }
└── product-catalog.interface: { exports: ["getProduct(id) → Product", ...] }

KROK 4: Złóż pakiet kontekstowy
└── Jeden spójny dokument z 3 warstw → do generatora
```

**Wynikowy pakiet to jedyne, co generator widzi.** Nie widzi reszty grafu, nie widzi kodu innych modułów. Widzi precyzyjny kontekst: globalne zasady + opis tego co ma zrobić + interfejsy zależności.

---

## Web UI -- Kluczowe Ekrany

### 1. Dashboard (Moje Projekty)
- Lista projektów użytkownika
- Nowy projekt (nazwa + tech stack)
- Otwórz projekt

### 2. Project View (Graf + Edycja)
- **Lewa strona:** wizualizacja grafu (node'y jako boxy, relacje jako linie)
- **Prawa strona:** panel edycji wybranego node'a (opis, constrainty, interfejsy)
- **Górna belka:** "Add Module" (otwiera store), "Materialize", "Download/Push"
- **Status bar:** ile node'ów zmaterializowanych, ile dirty

### 3. Module Store
- Browse: kategorie, search, popularne, nowe
- Module detail: opis, interfejsy, constrainty, obsługiwane tech stacki, rating
- "Add to Project" → node (lub poddrzewo) ląduje w grafie projektu
- Po dodaniu: system sugeruje połączenia z istniejącymi node'ami

### 4. Materialize View
- Kolejność materializacji (dependency tree)
- Progress: który node jest materializowany
- Wynik: kod per node, testy per node
- Podgląd plików (read-only code viewer)
- Download / Push to repo

### 5. Node Editor
- Opis (markdown/plain text)
- Constrainty (lista)
- Interfejs (exports, events)
- Relacje (do jakich node'ów, jaki typ, co)
- Artefakty dodatkowe (diagramy, notatki, referencje)

---

## Seed Modules (10-20 na start)

Minimalna kolekcja modułów, która pozwala złożyć typowe systemy:

### Authentication & Users
1. `auth-jwt` -- JWT auth z refresh tokenami i rate limiting
2. `auth-oauth` -- OAuth2 (Google, GitHub, etc.)
3. `users-crud` -- Zarządzanie użytkownikami (profile, role)

### Data & Content
4. `crud-generic` -- Generyczny CRUD z filtrowaniem i paginacją
5. `file-storage` -- Upload/download plików (S3-compatible)
6. `search-basic` -- Wyszukiwanie pełnotekstowe

### Commerce
7. `product-catalog` -- Katalog produktów z kategoriami
8. `shopping-cart` -- Koszyk (Redis-backed)
9. `orders-basic` -- Zamówienia z workflow statusów
10. `payments-stripe` -- Płatności Stripe

### Communication
11. `notifications-email` -- Powiadomienia email (szablony)
12. `notifications-push` -- Push notifications
13. `webhooks-outgoing` -- Wysyłanie webhooków

### Infrastructure
14. `api-gateway` -- Gateway z rate limiting i routing
15. `health-check` -- Health endpoints i monitoring
16. `logging-structured` -- Structured logging

### Utilities
17. `config-management` -- Zarządzanie konfiguracją (env, secrets)
18. `scheduler-cron` -- Scheduled tasks / cron jobs

Każdy moduł ma zdefiniowane interfejsy i zależności. Można je łączyć jak klocki.

---

## Metryki Sukcesu Yggdrasil

| Metryka | Target |
|---|---|
| Time to first materialization | < 10 minut od rejestracji |
| Module store additions per project | avg 3+ modułów ze store |
| Materialization success rate | > 80% (kod kompiluje i przechodzi basic testy) |
| User retention (week 1) | > 30% wraca po 7 dniach |
| Pro conversion | > 5% free → pro w pierwszym miesiącu |
