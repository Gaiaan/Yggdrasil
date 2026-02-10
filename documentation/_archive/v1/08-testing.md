# 08 -- Strategia Testów: Wynikanie z Meta, Poziomy, Zależności

## Zasada Naczelna: Testy Wynikają z Meta-Opisu

Testy nie są pisane osobno. **Testy są materializowane z meta-opisu** tak samo jak kod implementacji. Constrainty, reguły biznesowe i specyfikacje interfejsów zdefiniowane na meta-poziomie są źródłem, z którego generowane są testy weryfikujące implementację.

Innymi słowy: o ile to możliwe, metapoziom **ZAWSZE** materializuje się do kodu **oraz** testów. Testy sprawdzają implementację.

---

## Źródła Testów w Meta-Opisie

### Constrainty -> Testy Jednostkowe

```
Meta-constraint: "Hasło minimum 8 znaków, musi zawierać cyfrę"

Generowany test:
- validatePassword("short") -> fail
- validatePassword("longenough") -> fail (brak cyfry)
- validatePassword("valid1password") -> pass
```

### Reguły Biznesowe -> Testy Behawioralne

```
Meta-reguła: "Po 5 nieudanych logowaniach konto jest blokowane na 15 minut"

Generowany test:
- 4 nieudane logowania -> konto nadal aktywne
- 5. nieudane logowanie -> konto zablokowane
- Próba logowania z poprawnym hasłem po blokadzie -> odmowa
- Próba po 15 minutach -> odblokowane
```

### Specyfikacje Interfejsów -> Testy Kontraktowe

```
Meta-interfejs: "POST /auth/login -> 200 { token, refreshToken } | 401 { error }"

Generowany test:
- POST /auth/login z poprawnymi credentials -> 200, body zawiera token i refreshToken
- POST /auth/login z błędnymi credentials -> 401, body zawiera error
- POST /auth/login bez body -> 400 (validation error)
```

### Diagramy Sekwencji -> Testy Przepływu

```
Meta-diagram: LoginService -> UserRepo -> PasswordHasher -> TokenGenerator

Generowany test:
- Pełny przepływ logowania: findUser -> verifyPassword -> generateToken
- Przepływ z nieistniejącym użytkownikiem: findUser returns null -> error
```

---

## Poziomy Testowania

### Poziom 1: Testy na Node'dzie (Unit / Component)

Każdy node ma **własne testy**, wynikające z jego meta-opisu. Testują implementację w izolacji.

```
Node: PasswordResetService
├── Test: max 3 resets per hour (z constraintu)
├── Test: link ważny 24h (z constraintu)
├── Test: obsługuje email i SMS (z reguły biznesowej)
├── Test: weryfikacja tokena (z opisu)
└── Test: nieistniejący user -> error (z edge case)
```

Te testy są **powiązane z node'em** w meta-grafie. Zmiana meta-opisu node'a -> regeneracja testów node'a.

### Poziom 2: Testy na Rodzicu (Integration)

Node-rodzic może mieć testy sprawdzające, jak jego dzieci współpracują. Te testy wynikają z **diagramów integracyjnych** na poziomie rodzica.

```
Node: Moduł Auth (rodzic)
├── Dziecko: LoginService
├── Dziecko: PasswordResetService
├── Dziecko: SessionManager
│
└── Testy integracyjne (na poziomie rodzica):
    ├── Test: Login -> Session created (LoginService + SessionManager)
    ├── Test: Password reset -> Can login with new password (PasswordResetService + LoginService)
    └── Test: Session expired -> Re-login required (SessionManager + LoginService)
```

### Poziom 3: Testy Między Node'ami (Cross-Node / Contract)

Testy weryfikujące integrację między node'ami, które są połączone relacją Related. Mogą być definiowane jako **child node wyższego poziomu** z zależnościami do kilku node'ów.

```
Przykład:
├── Moduł: Auth
│   └── Interfejs: AuthAPI (specyfikacja)
├── Moduł: Orders
│   └── Interfejs: OrderAPI (specyfikacja)
│
└── Test Node: Auth-Orders Integration
    ├── Related to: AuthAPI (dependency)
    ├── Related to: OrderAPI (dependency)
    ├── Test: Tworzenie zamówienia wymaga ważnego tokenu auth
    ├── Test: Wygasły token -> 401 przy tworzeniu zamówienia
    └── Test: Token z rolą USER nie może zobaczyć cudzych zamówień
```

Taki test node jest **normalnym node'em w grafie** -- ma swój meta-opis i zależności. Zależy od interfejsów obu modułów. Jeśli zmieni się interfejs jednego z nich -- test wymaga regeneracji.

### Poziom 4: Testy Globalne / Ogólnofirmowe

Na najwyższym poziomie hierarchii mogą istnieć node'y testowe weryfikujące globalne zachowania:
- End-to-end testy głównych przepływów biznesowych
- Testy wydajnościowe (load testing)
- Testy bezpieczeństwa (penetration testing specs)
- Testy zgodności regulacyjnej

```
System (root)
├── Moduł: Auth
├── Moduł: Orders
├── Moduł: Payments
│
├── Test Node: E2E - Purchase Flow
│   ├── Related to: Auth, Orders, Payments
│   └── Test: Pełny przepływ zakupu od logowania do płatności
│
└── Test Node: Security Compliance
    ├── Related to: Auth
    └── Test: OWASP Top 10 verification points
```

---

## Zależności Testowe

### Testy jako Node'y z Dependencjami

Kluczowa decyzja: testy **są node'ami w grafie** (lub child node'ami). Mogą mieć relacje Related do node'ów, które testują. To daje:

- **Explicite zależności** -- wiadomo co test testuje
- **Automatyczna regeneracja** -- zmiana interfejsu -> regeneracja testu
- **Kolejność wykonania** -- system wie, że test integracyjny wymaga gotowych obu modułów
- **Wizualizacja** -- widać w grafie co jest testowane i co nie

### Przykład Struktury Testowej

```
Moduł: Auth
├── Komponent: LoginService
│   ├── [implementacja]
│   └── Test: LoginService Unit Tests (child node, related to: LoginService)
│       ├── Dep: LoginService
│       └── Testy: [wynikające z constraintów LoginService]
│
├── Test: Auth Integration Tests (child node modułu Auth)
│   ├── Dep: LoginService, SessionManager, PasswordResetService
│   └── Testy: [wynikające z diagramu integracyjnego Auth]
│
└── Interfejs: AuthAPI
    └── Test: AuthAPI Contract Tests (child node)
        ├── Dep: AuthAPI
        └── Testy: [wynikające ze specyfikacji API]
```

---

## Co Się Dzieje Gdy Zmieni Się Interfejs

Scenariusz: nadzorca zmienia interfejs `AuthAPI` -- dodaje nowy parametr do endpointu.

1. **Meta-graf się zmienia** -- node AuthAPI ma zaktualizowaną specyfikację
2. **System propaguje "dirty"** -- wszystkie node'y z relacją Related do AuthAPI są oznaczone
3. **Testy kontraktowe AuthAPI** -> regeneracja (bo interfejs się zmienił)
4. **Testy integracyjne Auth-Orders** -> regeneracja (bo zależy od AuthAPI)
5. **Moduły zależne** -> mogą wymagać rematerializacji implementacji (jeśli korzystały z zmienionego endpointu)

Jeśli zmiana jest wstecznie kompatybilna (dodanie opcjonalnego parametru) -- zależne moduły mogą nie wymagać zmian. Jeśli jest niekompatybilna (zmiana sygnatury) -- nadzorca musi zaktualizować zależne node'y.

To jest normalne i nieuniknione -- **zmiany w interfejsach propagują się**. Ale meta-graf sprawia, że ta propagacja jest **jawna i kontrolowana**, zamiast ukryta w kodzie.

---

## Elastyczność Ramy Testowej

Nadzorca decyduje o:
- **Głębokości testowania** -- ile testów na jakim poziomie
- **Typie testów** -- unit, integration, e2e, performance, security
- **Frameworku** -- Jest, Mocha, PyTest, cokolwiek (zależy od tech stacku w meta)
- **Strategii** -- test-first (meta opisuje testy explicite) vs. test-generated (testy wynikają z constraintów automatycznie)

**Zasada: dowolna rama, w dowolnej hierarchii, o dowolnej głębokości, o dowolnej precyzji. Decyzja należy do nadzorcy.**

Jak zmieni się układ kodu w implementacji (np. refaktoring wewnętrznej struktury) -- testy się **dopasowują do przepływu biznesowego**, nie do struktury kodu. Bo testy wynikają z meta-opisu (reguły biznesowe, constrainty), nie z kodu.
