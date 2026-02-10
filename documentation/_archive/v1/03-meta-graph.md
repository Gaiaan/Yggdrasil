# 03 -- Meta-Graf: Struktura, Node'y, Relacje, Artefakty

## Czym Jest Meta-Graf

Meta-graf jest **formalną reprezentacją systemu software'owego** w postaci hierarchicznego grafu obiektów. Nie jest to diagram architektury -- jest to **wykonywalna specyfikacja**, z której materializuje się kod i testy.

Można o nim myśleć jak o "Domain Model jako wykonywalna specyfikacja" albo "architektura jako kod" -- ale głębiej i bardziej formalnie niż jakiekolwiek istniejące podejście.

---

## Anatomia Node'a (Obiektu w Grafie)

Każdy element w meta-grafie jest **node'em** (obiektem). Node jest fundamentalną jednostką systemu.

### Właściwości Node'a

| Właściwość | Opis |
|---|---|
| **Identyfikator** | Unikalny, globalny ID |
| **Nazwa** | Czytelna nazwa (np. "AuthModule", "validateCredentials") |
| **Typ** | Semantyczny typ obiektu (System, Moduł, Komponent, Serwis, Funkcja, Interfejs, itp.) -- otwarty zbiór |
| **Dokumentacja** | Zbiór artefaktów opisujących node (patrz niżej) |
| **Relacje** | Połączenia z innymi node'ami (Parent-Child, Related) |
| **Tagi** | Zbiór tagów umożliwiających klasyfikację i filtrowanie |
| **Status implementacji** | Czy kod został zmaterializowany, czy testy przechodzą |
| **Nadzorca** | Kto jest odpowiedzialny za ten node (człowiek / agent AI) |

### Typy Node'ów

System nie narzuca zamkniętego zbioru typów. Typy są **semantyczne i otwarte** -- nadzorca może zdefiniować dowolne typy, które mają sens w kontekście jego systemu. Przykłady:

- **System** -- root, najwyższy poziom
- **Moduł** -- logiczna grupa funkcjonalności
- **Komponent** -- element modułu
- **Serwis** -- mikroserwis, usługa
- **Interfejs** -- specyfikacja kontraktu API/protokołu
- **Funkcja** -- pojedyncza funkcja lub operacja
- **Model** -- model danych, encja
- **Konfiguracja** -- element konfiguracyjny

**Kluczowe:** Node nie musi być mapowany 1:1 na konstrukcje kodu. Może reprezentować cokolwiek, co nadzorca uzna za istotne na meta-poziomie. Node "Moduł Auth" może zmaterializować się jako mikroserwis z REST API, a może jako klasa w monolicie. To zależy od kontekstu i generatora kodu.

---

## Artefakty Dokumentacyjne

Każdy node ma powiązany **zbiór artefaktów** opisujących go. Artefakty to serce meta-opisu -- to one dostarczają kontekst agentowi generującemu kod.

### Typy Artefaktów

#### Opis Tekstowy
Opis w języku naturalnym: co node robi, dlaczego istnieje, jakie ma odpowiedzialności, jakie są edge case'y. Może być napisany "po normalnemu" albo z techniczną precyzją -- zależy od nadzorcy.

```
Przykład: Moduł Auth

Moduł odpowiadający za uwierzytelnianie i autoryzację użytkowników.
Obsługuje login/logout, zarządzanie sesjami, refresh tokenów JWT.
Każdy request do systemu musi przejść przez warstwę autoryzacji tego modułu.
Sesje wygasają po 30 minutach nieaktywności.
Nieudane logowania blokują konto po 5 próbach na 15 minut.
```

#### Diagramy
Wizualne reprezentacje: diagramy sekwencji, diagramy komponentów, diagramy przepływu, C4 model, ERD, cokolwiek. Format jest otwarty (Mermaid, PlantUML, lub cokolwiek co system potrafi renderować i AI potrafi interpretować).

Na poziomie modułu -- diagramy integracyjne pokazujące jak obiekty wewnątrz współpracują.
Na poziomie komponentu -- diagramy sekwencji pokazujące przepływ logiki.

#### Constrainty
Formalne ograniczenia i reguły, które implementacja musi spełniać:
- "Czas odpowiedzi < 200ms"
- "Musi obsługiwać 1000 równoczesnych sesji"
- "Token JWT wygasa po 15 minutach"
- "Hasło minimum 8 znaków, musi zawierać cyfrę"

Constrainty mogą być dziedziczone z node'ów wyżej (np. globalna polityka bezpieczeństwa).

#### Specyfikacja Interfejsu
Dla node'ów typu Interfejs -- precyzyjny opis kontraktu:
- Endpointy, metody, parametry, typy odpowiedzi
- Protokół komunikacji
- Wersjonowanie
- Error handling

Interfejs jest **first-class node** -- nie jest oddzielnym typem, ale normalnym node'em z dokumentacją opisującą kontrakt. Kiedy inny node w swoim opisie odnosi się do np. "AuthModule", ma dostęp do interfejsu tego modułu.

#### Reguły Biznesowe
Sformalizowane reguły logiki biznesowej:
- "Użytkownik z rolą ADMIN ma dostęp do wszystkich zasobów"
- "Zamówienie przechodzi przez statusy: Draft -> Submitted -> Processing -> Completed"
- "Rabat 10% dla zamówień > 500 PLN"

---

## Relacje między Node'ami

### Parent-Child (Hierarchia)

Fundamentalna relacja strukturalna. Definiuje "co jest wewnątrz czego":

```
System (root)
├── [parent-child] Moduł: Auth
│   ├── [parent-child] Komponent: LoginService
│   ├── [parent-child] Komponent: SessionManager
│   └── [parent-child] Interfejs: AuthAPI
├── [parent-child] Moduł: Users
└── [parent-child] Moduł: Orders
```

Właściwości:
- Głębokość hierarchii jest **nieskończona** -- tyle poziomów, ile nadzorca uzna za potrzebne
- Node dziecko **dziedziczy kontekst** z rodzica (globalne zasady, tech stack, constrainty)
- Rodzic ma **diagramy integracyjne** pokazujące jak jego dzieci współpracują
- Dzieci mają **precyzyjne definicje** co robią i dlaczego

### Related (Zależności)

Relacja łącząca node'y, które nie są w relacji rodzic-dziecko, ale są od siebie zależne:

```
Moduł: Auth ──[related: "uses"]──> Moduł: Users
Moduł: Orders ──[related: "requires auth"]──> Moduł: Auth
Komponent: OrderService ──[related: "calls"]──> Interfejs: UserAPI
```

Relacje Related są **explicite** -- nadzorca definiuje je jawnie. Mogą mieć etykiety opisujące naturę zależności.

Relacje Related pełnią kluczową rolę:
- **Budowanie kontekstu dla agenta** -- agent generujący OrderService wie, że musi użyć UserAPI i zna jego kontrakt
- **Definiowanie kolejności implementacji** -- system wie, że UserAPI musi być zaimplementowany przed OrderService
- **Wykrywanie propagacji zmian** -- zmiana w AuthAPI oznacza, że wszystkie node'y z relacją Related do Auth mogą wymagać aktualizacji

---

## Kontekst: Jak Node "Widzi" Swoje Otoczenie

Kiedy agent przystępuje do implementacji node'a, buduje **kontekst** z trzech źródeł:

### 1. Kontekst z hierarchii (góra -> dół)

Node dziedziczy informacje od wszystkich przodków:
```
root (System) -> tech stack: TypeScript, NestJS, PostgreSQL
  └── Moduł Auth -> polityka bezpieczeństwa: JWT, bcrypt, rate limiting
       └── Komponent LoginService -> [ma dostęp do obu powyższych]
```

### 2. Kontekst własny

Dokumentacja, diagramy, constrainty, reguły biznesowe samego node'a.

### 3. Kontekst z relacji (lateralny)

Interfejsy i kontrakty node'ów powiązanych relacjami Related:
```
LoginService ──[related]──> UserRepository
Agent wie: "LoginService musi użyć UserRepository, którego interfejs wygląda tak: ..."
```

Ten trójwarstwowy kontekst oznacza, że agent **nigdy nie operuje w próżni** i **nigdy nie musi znać całego systemu**. Zna swoją gałąź + swoje zależności. To jest rozwiązanie problemu kontekstu.

---

## Nieskończona Głębokość -- Praktyczne Implikacje

Graf nie ma z góry ograniczonej głębokości. W praktyce oznacza to:

### Płytki graf (prototyp, prosty system)
```
System
├── Frontend (opis + constrainty)
├── Backend (opis + constrainty)
└── Database (schemat)
```
3 node'y, 2 poziomy. Wystarczające dla prostego systemu.

### Głęboki graf (enterprise system)
```
System
├── Domena: E-Commerce
│   ├── Moduł: Catalog
│   │   ├── Serwis: ProductService
│   │   │   ├── Handler: CreateProduct
│   │   │   │   ├── Validator: ProductValidator
│   │   │   │   └── Mapper: ProductMapper
│   │   │   └── Handler: SearchProducts
│   │   │       └── Query: ElasticSearchQuery
│   │   ├── Serwis: CategoryService
│   │   └── Model: Product
│   │       ├── Field: price (constraints: > 0, max 2 decimals)
│   │       └── Field: sku (constraints: unique, format: XX-NNNN)
│   ├── Moduł: Orders
│   │   └── ...
│   └── Moduł: Payments
│       └── ...
├── Domena: Admin Panel
│   └── ...
└── Infrastruktura
    ├── API Gateway
    ├── Message Broker
    └── Monitoring
```
Dziesiątki node'ów, 6+ poziomów. Każdy z precyzyjnym opisem.

**Nadzorca decyduje o głębokości.** System nie zmusza do dogłębnej dekompozycji tam, gdzie nie jest potrzebna, ani nie ogranicza tam, gdzie jest.
