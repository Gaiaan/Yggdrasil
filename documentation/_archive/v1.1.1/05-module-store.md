# 05 -- Module Store: Ekosystem Architektonicznych Modułów

## Czym Jest Module Store

Module Store to **repozytorium architektonicznych modułów**, z których użytkownik składa system. Każdy moduł to nie kod -- to **meta-opis** (node lub poddrzewo node'ów) z pełną specyfikacją: interfejsy, constrainty, reguły biznesowe, zależności.

Moduł ze store materializuje się w **tech stacku użytkownika**. Ten sam moduł `auth-jwt` wygeneruje inny kod dla NestJS niż dla FastAPI -- ale logika biznesowa, constrainty i interfejsy pozostają te same.

---

## Analogia: Terraform Module Registry dla Aplikacji

| Terraform Registry | Yggdrasil Module Store |
|---|---|
| Moduły infrastrukturalne (VPC, ECS, RDS) | Moduły aplikacyjne (Auth, Orders, Payments) |
| Deklaratywny HCL → infrastruktura | Deklaratywny meta-opis → kod |
| Parametryzowalne (variables) | Customizowalne (constrainty, opis) |
| Composable (moduły łączą się) | Composable (interfejsy łączą moduły) |
| Publiczne + prywatne | Publiczne + prywatne + płatne |

---

## Składak: Jak Użytkownik Składa System

### Krok 1: Browse & Pick

Użytkownik przegląda store po kategoriach lub szuka:
```
Kategorie:
├── Authentication & Authorization
├── User Management
├── Data & Content
├── Commerce
├── Communication & Notifications
├── Infrastructure
└── Utilities
```

### Krok 2: Add to Project

Klika "Add to Project" na module `auth-jwt`. Node (lub poddrzewo) ląduje w grafie projektu z domyślnymi wartościami.

### Krok 3: Auto-Connect

System widzi, że `auth-jwt` eksponuje interfejs `auth-service`, a istniejący node `orders` ma relację `uses: auth-service`. System **proponuje połączenie**. Użytkownik potwierdza.

### Krok 4: Customize

Użytkownik modyfikuje domyślne constrainty:
- Zmienia "session TTL: 30 min" na "session TTL: 60 min"
- Dodaje constraint: "require MFA for admin users"
- Zmienia opis by pasował do kontekstu projektu

### Krok 5: Compose & Materialize

Po dodaniu wszystkich potrzebnych modułów i połączeniu interfejsami -- materializacja. System wie, w jakiej kolejności generować (dependency tree) i jaki kontekst dać każdemu modułowi.

---

## Anatomy of a Store Module

### Metadata (Widoczne w Store)

```yaml
store:
  name: "JWT Authentication"
  slug: auth-jwt
  version: "1.2.0"
  author: "yggdrasil"          # lub community author
  license: "MIT"                   # lub "premium"
  
  description: |
    Complete JWT authentication module with access/refresh tokens,
    rate limiting, session management, and password hashing.
  
  tags: ["auth", "jwt", "security", "session"]
  category: "Authentication & Authorization"
  
  supported_stacks:
    - typescript-nestjs
    - typescript-express
    - python-fastapi
    - python-django
  
  stats:
    installations: 1247
    rating: 4.8
    materializations: 3891
```

### Interface Declaration (Kontrakt)

```yaml
  provides:
    interfaces:
      auth-service:
        exports:
          - "login(email, password) → { accessToken, refreshToken }"
          - "register(email, password, name) → User"
          - "refreshToken(refreshToken) → { accessToken }"
          - "validateToken(accessToken) → User"
          - "logout(accessToken) → void"
        events:
          - "UserRegistered { userId, email }"
          - "LoginSucceeded { userId }"
          - "LoginFailed { email, reason }"
  
  requires:
    interfaces:
      - user-repository   # needs a way to store/retrieve users
    infrastructure:
      - "Database (PostgreSQL or compatible)"
      - "Redis (for session/rate-limiting)"
```

### Meta-Graph Content (Node'y)

```yaml
nodes:
  - id: auth-module
    name: AuthModule
    type: module
    description: |
      JWT authentication with refresh tokens and rate limiting.
    constraints:
      - "Access token TTL: 15 minutes (configurable)"
      - "Refresh token TTL: 7 days (configurable)"
      - "Max 5 failed logins per IP per 15 minutes"
      - "Password: min 8 chars, must contain digit and uppercase"
      - "Bcrypt cost factor: 12"
    
    children:
      - id: auth-controller
        type: component
        description: "HTTP endpoints for auth operations"
        interface:
          exports: [login, register, refresh, logout]
      
      - id: auth-service
        type: service
        description: "Business logic for authentication"
        relations:
          - target: token-manager
          - target: password-hasher
          - target: rate-limiter
      
      - id: token-manager
        type: component
        description: "JWT token creation and validation"
        constraints:
          - "Uses RS256 algorithm"
          - "Stores refresh tokens in Redis"
      
      - id: password-hasher
        type: component
        description: "Password hashing with bcrypt"
      
      - id: rate-limiter
        type: component
        description: "IP-based rate limiting for auth endpoints"
        constraints:
          - "Sliding window algorithm"
          - "Redis-backed counter"
```

---

## Typy Modułów w Store

### By Scope

| Typ | Opis | Przykłady |
|---|---|---|
| **Atomic Module** | Jeden node z kilkoma children | `password-hasher`, `rate-limiter` |
| **Composite Module** | Poddrzewo z wieloma komponentami | `auth-jwt`, `orders-basic` |
| **System Template** | Cały graf root + moduły + relacje | `saas-starter`, `e-commerce-mvp` |

### By Availability

| Typ | Opis | Revenue |
|---|---|---|
| **Public (Free)** | Dostępne dla wszystkich, open-source meta | Darmowe, budują ekosystem |
| **Private** | Widoczne tylko dla autora/organizacji | Wymagają Pro tier |
| **Premium** | Płatne moduły od community lub Yggdrasil | Prowizja (np. 70/30 autor/platforma) |

---

## Revenue Model

### Tier Free
- Publiczne moduły bez limitu
- 3 materializacje / dzień
- 1 aktywny projekt
- Output: download ZIP only

### Tier Pro ($XX/miesiąc)
- Wszystko z Free
- Nielimitowane materializacje
- Nielimitowane projekty
- Prywatne moduły (max N)
- Push to GitHub/GitLab
- Premium generatory (lepsze modele AI)

### Tier Team ($XX/miesiąc per seat)
- Wszystko z Pro
- Shared projects
- Team module library (prywatne moduły zespołu)
- Collaborative editing (przyszłość: Völundr+)

### Module Marketplace Revenue
- Twórcy publikują premium moduły
- Użytkownicy płacą per moduł lub subskrypcja
- Podział: 70% autor / 30% platforma (do ustalenia)

### Token Margin
- Każda materializacja = API call do Claude/Gemini
- Koszt tokenu AI + margin (np. 30-50%)
- Pro tier ma lepszy pricing na tokenach

---

## Wersjonowanie Modułów

### Semver

Moduły w store mają wersje (semver):
- `1.0.0` → `1.0.1` -- bugfix w meta-opisie
- `1.0.0` → `1.1.0` -- nowy constraint, nowy child node
- `1.0.0` → `2.0.0` -- zmiana interfejsu (breaking change)

### Pinning w Projekcie

Projekt "pinuje" wersję modułu:
```yaml
# project dependencies
modules:
  - store: auth-jwt@1.2.0
    customizations:
      constraints:
        - override: "session TTL: 60 min"
  - store: orders-basic@2.0.0
```

Upgrade modułu w store → użytkownik widzi "update available" → może zaktualizować i rematerializować.

---

## Composability: Interfejsy jako Kontrakty

Klucz do składania modułów: **interfejsy są kontraktami**.

Moduł `auth-jwt` **provides** interfejs `auth-service` z exportem `validateToken(token) → User`.
Moduł `orders-basic` **requires** interfejs `auth-service` z użyciem `validateToken`.

Kiedy oba są w projekcie, system:
1. Widzi match (provides ↔ requires)
2. Proponuje relację Related
3. Użytkownik potwierdza
4. Przy materializacji orders-basic, Context Builder dołącza interfejs auth-service

To jest **architektoniczny dependency injection.** Moduły są loose-coupled przez interfejsy, nie przez kod.

### Co Gdy Interfejs Nie Pasuje?

Jeśli orders wymaga `auth-service.validateToken(token) → User`, a w projekcie jest moduł auth, który eksponuje `auth-service.checkAuth(token) → boolean` -- system flaguje **interface mismatch**. Użytkownik musi:
- Zmienić moduł auth (customizować interfejs)
- Zmienić moduł orders (dostosować wymagania)
- Lub: dodać adapter node między nimi
