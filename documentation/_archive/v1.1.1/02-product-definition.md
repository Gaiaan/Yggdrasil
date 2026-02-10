# 02 -- Definicja Produktu

## Jedno Zdanie

Yggdrasil to **architektoniczny składak z module store**, w którym projektujesz system z gotowych i własnych modułów połączonych interfejsami, a silnik materializuje kod z precyzyjnym kontekstem w Twoim tech stacku.

## Dwa Zdania (Pitch)

Obecne AI narzędzia gubią się w dużych projektach, bo nie rozumieją architektury. Yggdrasil daje AI **mapę systemu** -- graf modułów z interfejsami i constraintami -- dzięki czemu każdy moduł jest materializowany z pełnym kontekstem: wie co jest nad nim, obok niego i czego od niego oczekują.

---

## Dla Kogo

### Primary: Architekci i Senior Developers

Ludzie, którzy:
- Myślą w modułach, interfejsach, constraintach
- Są sfrustrowani jakością AI na złożonych projektach
- Chcą kontroli nad architekturą, ale nie chcą pisać boilerplate'u
- Rozumieją wartość formalnej specyfikacji

Jak z tego korzystają:
- Składają system z modułów ze store (Auth, Payments, Notifications...)
- Customizują: dodają constrainty, zmieniają interfejsy, dodają własne moduły
- Klikają "Materialize" -- dostają kod w swoim tech stacku z testami

### Secondary: Experienced Developers budujący nowe projekty

Ludzie, którzy:
- Zaczynają nowy projekt i chcą solidny fundament
- Znają się na technologii, ale nie chcą tracić tygodni na boilerplate
- Cenią jakość kodu i testy

### Tertiary (przyszłość): Zespoły z istniejącym codebase

- Brownfield scan jako upgrade path (etap Huginn & Muninn)
- Nie priorytet MVP

---

## Jak Działa -- User Flow

### Scenariusz: Buduję system e-commerce

**Krok 1: Zaczynam projekt**

Wchodzę na Yggdrasil (web). Tworzę nowy projekt. Ustawiam:
- Nazwa: "My E-Commerce"
- Tech stack: TypeScript, NestJS, PostgreSQL, Redis

**Krok 2: Składam z modułów**

Przeglądam Module Store. Dodaję do projektu:
- `auth-jwt` -- uwierzytelnianie JWT z refresh tokenami
- `users-crud` -- zarządzanie użytkownikami
- `product-catalog` -- katalog produktów z kategoriami
- `shopping-cart` -- koszyk (Redis-backed)
- `orders-basic` -- zamówienia z statusami
- `payments-stripe` -- płatności przez Stripe

Każdy moduł ma zdefiniowane **interfejsy** (co eksponuje) i **wymagane zależności** (czego potrzebuje).

**Krok 3: Łączę interfejsami**

System automatycznie proponuje połączenia (orders potrzebuje auth, cart potrzebuje product-catalog). Przeglądam, potwierdzam, koryguje co trzeba.

Widzę graf:
```
                    auth-jwt
                   /    |    \
          users-crud    |    shopping-cart
                        |      /
               product-catalog
                        |
                  orders-basic
                        |
                 payments-stripe
```

**Krok 4: Customizuję**

- Zmieniam constraint w auth: "sesja wygasa po 60 min" (zamiast domyślnych 30)
- Dodaję do orders: "rabat 10% dla zamówień > 500 PLN"
- Dodaję nowy moduł `notifications-email` i łączę z orders (powiadomienie po złożeniu zamówienia)
- Piszę opis modułu notifications po swojemu

**Krok 5: Materializuję**

Klikam "Materialize All". System:
1. Ustala kolejność: auth → users → product-catalog → cart → orders → payments → notifications
2. Dla każdego modułu buduje pakiet kontekstowy (globalne zasady + opis modułu + interfejsy zależności)
3. Wysyła do generatora (Claude)
4. Zapisuje kod + testy
5. Pokazuje wynik: pliki, strukturę, status testów

**Krok 6: Pobieram / pushuję**

- Download ZIP z kodem
- Albo: push do mojego repo na GitHubie
- Uruchamiam testy lokalnie, weryfikuję

**Krok 7: Iteruję**

Coś nie gra? Wracam do meta-grafu, precyzuję opis, zmieniam constrainty, rematerializuję.

---

## Kluczowe Elementy Produktu

### 1. Meta-Graf (Rdzeń)

Hierarchiczny graf obiektów z relacjami. Każdy node ma:
- Opis (co robi, dlaczego)
- Constrainty (reguły, ograniczenia)
- Interfejs (co eksponuje na zewnątrz)
- Relacje (od czego zależy, z czym się łączy)

Szczegóły: [../v1/03-meta-graph.md](../v1/03-meta-graph.md)

### 2. Context Builder (Silnik)

Buduje pakiet kontekstowy dla agenta materializującego:
- Warstwa 1: Kontekst globalny (tech stack, standardy) z hierarchii
- Warstwa 2: Kontekst własny node'a (opis, constrainty, reguły)
- Warstwa 3: Kontekst relacyjny (interfejsy zależności)

To jest serce wartości -- precyzyjny kontekst zamiast "wrzuć wszystko do okna."

### 3. Module Store (Ekosystem)

Repozytorium gotowych modułów architektonicznych:
- Każdy moduł to node (lub poddrzewo node'ów) z pełnym meta-opisem
- Zdefiniowane interfejsy i wymagane zależności
- Materializowalny w dowolnym wspieranym tech stacku
- Publiczne, prywatne, płatne

### 4. Materialization Engine (Output)

Generator kodu z pakietu kontekstowego:
- Na start: adapter Claude API
- Output: kod źródłowy + testy
- Dependency-aware: materializacja w kolejności zależności
- Do repo, ZIP, lub bezpośrednio do filesystem

### 5. Web UI (Interfejs)

- Wizualizacja grafu (node'y, relacje)
- Edycja node'ów (opis, constrainty, interfejsy)
- Przeglądanie Module Store
- Składanie projektu z modułów (drag & drop lub add)
- Przycisk "Materialize" i przegląd wyników
- Status: które node'y zmaterializowane, testy pass/fail

---

## Czym To NIE Jest (Przypomnienie)

- **Nie jest IDE** -- nie edytujesz kodu w Yggdrasil. Definiujesz architekturę, dostajesz kod.
- **Nie jest Low-Code** -- output to prawdziwy kod w prawdziwym tech stacku, nie zamknięta platforma.
- **Nie jest "AI pisze apkę z opisu"** -- to precision tool z grafem, nie vibe coding.
- **Nie jest diagram tool** -- meta-graf to wykonywalna specyfikacja, nie rysunek do prezentacji.
