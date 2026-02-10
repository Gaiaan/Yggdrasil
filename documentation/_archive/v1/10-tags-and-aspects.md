# 10 -- Tagi i Aspekty: Cross-Cutting Concerns

## Problem: Zagadnienia Przecinające Hierarchię

Nie wszystko w systemie software'owym mapuje się czysto na hierarchię. Istnieją **cross-cutting concerns** -- zagadnienia, które przecinają wiele modułów:

- **Logowanie** -- każdy moduł powinien logować operacje
- **Uwierzytelnianie** -- wiele modułów wymaga ochrony
- **Monitoring** -- metryki z wielu modułów
- **Audyt** -- śledzenie zmian w wielu miejscach
- **Walidacja** -- wzorce walidacji stosowane w wielu modułach

W tradycyjnym kodzie takie aspekty rozwiązuje się przez AOP (Aspect-Oriented Programming), middleware, decoratory. Na meta-poziomie potrzebujemy analogicznego mechanizmu.

---

## System Tagów

### Czym Są Tagi

Tagi to **etykiety przypisane do node'ów**, umożliwiające klasyfikację i filtrowanie **niezależnie od hierarchii**. Są lekkim, elastycznym mechanizmem organizacji.

### Zasięg Tagów

Tagi mogą być definiowane na dwóch poziomach:

#### Tagi Globalne (Organizacyjne)

Definiowane na poziomie root lub globalnej konfiguracji. Dostępne w całym grafie.

```
Globalne tagi:
- #requires-auth -- node wymaga uwierzytelniania
- #requires-audit -- operacje muszą być logowane w audit trail
- #pii-data -- node operuje na danych osobowych (RODO)
- #public-api -- node eksponuje publiczne API
- #internal-only -- node jest wewnętrzny
```

#### Tagi Obszarowe (Per Poddrzewo)

Definiowane w kontekście danego obszaru. Widoczne tylko wewnątrz tego poddrzewa.

```
Moduł: E-Commerce
├── Tagi obszarowe:
│   - #requires-pricing -- node operuje na cenach (wymaga precyzji decimal)
│   - #inventory-aware -- node musi sprawdzać dostępność
│   
├── Komponent: ProductService #requires-pricing
├── Komponent: CartService #requires-pricing #inventory-aware
└── Komponent: OrderService #requires-pricing #inventory-aware #requires-auth
```

---

## Aspekty: Zachowania Podpinane pod Tagi

### Koncept Aspektu

Aspekt to **definicja zachowania lub wymagania, które automatycznie stosuje się do wszystkich node'ów z danym tagiem**. Aspekt "wie" gdzie się ma wstrzyknąć dzięki tagom.

### Jak to Działa

1. **Nadzorca definiuje aspekt** -- np. "Aspekt: Audit Logging"
2. **Aspekt jest powiązany z tagiem** -- np. tag `#requires-audit`
3. **Wszystkie node'y z tagiem `#requires-audit`** automatycznie otrzymują kontekst z aspektu
4. **Podczas materializacji** agent widzi w pakiecie kontekstowym: "ten node wymaga audit logging, oto specyfikacja jak to zrobić"

```
Aspekt: Audit Logging
├── Tag: #requires-audit
├── Opis: "Każda operacja modyfikująca dane musi być zalogowana 
│          w tabeli audit_log z informacją: kto, kiedy, co, stary/nowy stan"
├── Constraint: "Audit log musi być transakcyjny z operacją"
└── Interfejs: AuditService.log(userId, action, entityType, entityId, oldState, newState)

Kiedy node "OrderService" ma tag #requires-audit:
- Agent materializujący OrderService widzi w kontekście:
  "Ten komponent musi logować operacje przez AuditService"
- Generowany kod zawiera wywołania AuditService
```

### Aspekty per Obszar

W brownfield aspekty mogą być specyficzne dla danego "zespołu" lub "obszaru":

```
Obszar: Domena Payments
├── Aspekt: PCI Compliance
│   ├── Tag: #handles-payment-data
│   └── Opis: "Node musi spełniać wymogi PCI DSS: 
│              nie logować numerów kart, szyfrować w transit i at rest..."
│
└── Ten aspekt dotyczy tylko node'ów w domenie Payments z tagiem #handles-payment-data
```

---

## Tagi jako Mechanizm Organizacyjny

### Filtrowanie i Widoki

Tagi umożliwiają **widoki meta-grafu** filtrowane po kryteriach:

- "Pokaż wszystkie node'y z tagiem `#public-api`" -- przegląd wszystkich publicznych interfejsów
- "Pokaż wszystkie node'y z tagiem `#pii-data`" -- przegląd wszystkich miejsc z danymi osobowymi
- "Pokaż node'y bez tagu `#has-tests`" -- identyfikacja luk w testowaniu

### Grupowanie Node'ów

Tagi pozwalają grupować node'y niezależnie od hierarchii:

```
Tag: #team-payments
├── Moduł: Payments (cały)
├── Komponent: BillingService (w module Orders)
└── Komponent: InvoiceGenerator (w module Reports)

-- Zespół Payments odpowiada za te node'y niezależnie od ich pozycji w hierarchii
```

### Automatyczne Dziedziczenie Tagów

Tagi mogą się propagować:
- **W dół** -- tag na rodzicu automatycznie dotyczy dzieci
  ```
  Moduł: Auth #requires-auth
  └── Komponent: LoginService -- automatycznie ma #requires-auth? 
      (konfigurowane per tag -- czy propaguje się w dół)
  ```
- **Explicite** -- tagi przypisywane ręcznie do konkretnych node'ów

---

## Przykłady Użycia Tagów i Aspektów

### Przykład 1: Wielojęzyczność (i18n)

```
Tag globalny: #user-facing
Aspekt: Internationalization
├── Tag: #user-facing
├── Opis: "Wszystkie stringi widoczne dla użytkownika muszą 
│          przechodzić przez system i18n. Nie hardcodować tekstów."
└── Constraint: "Użyj t('key') zamiast literałów stringowych"

Node'y z tagiem #user-facing:
├── Komponent: UserDashboard #user-facing
├── Komponent: ErrorHandler #user-facing
└── Komponent: EmailTemplates #user-facing

Efekt: Agent generujący te komponenty wie, że musi użyć i18n.
```

### Przykład 2: Rate Limiting

```
Tag globalny: #public-api
Aspekt: Rate Limiting
├── Tag: #public-api
├── Opis: "Publiczne endpointy muszą mieć rate limiting: 
│          100 req/min per IP, 1000 req/min per API key"
└── Constraint: "Użyj RateLimitGuard z konfiguracją"

Wszystkie node'y eksponujące publiczne API automatycznie 
dostaną w kontekście wymaganie rate limitingu.
```

### Przykład 3: Tagi per Team (Brownfield)

```
Domena: Legacy System
├── Tag obszarowy: #team-alpha
│   ├── Moduł: UserManagement
│   └── Moduł: Auth
│
├── Tag obszarowy: #team-beta
│   ├── Moduł: Billing
│   └── Moduł: Invoicing
│
└── Aspekt: Team-specific CI Pipeline
    ├── Tag: #team-alpha
    └── Opis: "Testy uruchamiane na runner-pool-alpha"
```

---

## Relacja Tagów do Kolejności Implementacji

Tagi **nie wpływają** bezpośrednio na kolejność implementacji -- to jest domena relacji (Parent-Child, Related). Ale tagi mogą wpływać na:

- **Kontekst generacji** -- aspekty podpięte pod tagi wzbogacają kontekst
- **Walidację** -- tag `#pii-data` może wymuszać dodatkowe testy bezpieczeństwa
- **Raportowanie** -- "ile % node'ów z tagiem X jest zmaterializowanych?"
- **Widoki** -- filtrowanie grafu dla konkretnego zespołu lub aspektu
