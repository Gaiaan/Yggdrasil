# 07 -- Materializacja Kodu: Generatory, Kontekst, Zarządzanie Repozytoriami

## Materializacja -- Nie Generowanie

Świadomie używamy słowa **materializacja** zamiast "generowanie kodu". Kod nie jest "generowany" z szablonów -- jest **materializowany** z bogatego, kontekstowego meta-opisu przez inteligentnego agenta. To różnica jakościowa.

---

## Budowanie Kontekstu dla Agenta

Kiedy agent przystępuje do materializacji node'a, system buduje **pakiet kontekstowy** z trzech warstw:

### Warstwa 1: Kontekst Hierarchiczny (Góra -> Dół)

Informacje dziedziczone od wszystkich przodków w grafie:

```
root (System)
  ├── Globalny tech stack: TypeScript, NestJS, PostgreSQL, Redis
  ├── Standardy kodowania: ESLint config, Prettier, konwencje nazewnictwa
  ├── Wzorce: Clean Architecture, CQRS where applicable
  └── Polityki: JWT auth, bcrypt hashing, rate limiting on public endpoints

  └── Moduł Auth
       ├── Opis biznesowy: System uwierzytelniania i autoryzacji
       ├── Polityka bezpieczeństwa: bcrypt cost=12, JWT TTL=15min, refresh=7d
       └── Diagram integracyjny: [jak komponenty wewnątrz współpracują]
       
       └── Komponent PasswordResetService  ← [MATERIALIZOWANY NODE]
            └── [pakiet kontekstowy zawiera WSZYSTKO z góry]
```

### Warstwa 2: Kontekst Własny

Meta-opis samego node'a:
- Opis tekstowy (co robi, dlaczego, jak)
- Constrainty (max 3 resets/hour, link ważny 24h)
- Reguły biznesowe (obsługuje email i SMS, weryfikuje token)
- Diagramy (diagram sekwencji procesu resetu)
- Specyfikacja interfejsu (jeśli node eksponuje API)

### Warstwa 3: Kontekst Relacyjny (Lateralny)

Interfejsy i kontrakty node'ów powiązanych relacją Related:
- `EmailService.sendEmail(to, template, data) -> Promise<void>` -- kontrakt interfejsu
- `SMSProvider.sendSMS(phone, message) -> Promise<void>` -- kontrakt interfejsu
- `UserRepository.findByEmail(email) -> User | null` -- kontrakt interfejsu

Agent nie musi znać implementacji EmailService -- musi znać tylko **interfejs** (co dostaje na wejściu, co zwraca).

### Wynikowy Pakiet Kontekstowy

```
PAKIET KONTEKSTOWY DLA: PasswordResetService
═══════════════════════════════════════════

GLOBALNE ZASADY:
- Tech stack: TypeScript, NestJS, PostgreSQL
- Wzorce: Clean Architecture
- Standardy: [pełna konfiguracja]

KONTEKST MODUŁU (Auth):
- Polityka bezpieczeństwa: [szczegóły]
- Diagram integracyjny: [jak PasswordResetService wpasowuje się]

OPIS NODE'A:
- [pełny opis tekstowy]
- [constrainty]
- [reguły biznesowe]
- [diagramy sekwencji]

ZALEŻNOŚCI (INTERFEJSY):
- EmailService: [kontrakt]
- SMSProvider: [kontrakt]
- UserRepository: [kontrakt]

OCZEKIWANY WYNIK:
- Implementacja PasswordResetService zgodna z powyższym
- Testy weryfikujące constrainty i reguły biznesowe
```

To jest **wszystko, co agent potrzebuje**. Nie musi widzieć reszty systemu.

---

## Wymienialne Generatory Kodu

### Zasada Wymienialności

Generator kodu (agent materializujący) jest **wymienialnym komponentem**. System nie jest przywiązany do jednego modelu AI ani jednego narzędzia.

Możliwe generatory:
- **Claude Code** -- agent Anthropic
- **Gemini CLI** -- agent Google
- **Cursor Agent** -- agent wbudowany w IDE
- **Custom generator** -- dowolne narzędzie, które przyjmuje specyfikację i produkuje kod
- **Szablon + AI** -- kombinacja szablonów i inteligentnego uzupełniania

### Interfejs Generatora

Każdy generator implementuje ten sam kontrakt:

```
INPUT:
- Pakiet kontekstowy (hierarchia + opis node'a + relacje/interfejsy)
- Konfiguracja generatora (model, temperature, dodatkowe instrukcje)

OUTPUT:
- Kod źródłowy (pliki implementacji)
- Testy (pliki testowe)
- Raport generacji (co zostało stworzone, jakie decyzje podjęte)
```

Różne node'y mogą używać **różnych generatorów**. Moduł backendowy może być materializowany przez Claude Code, a moduł frontendowy przez innego agenta specjalizującego się w React.

---

## Zarządzanie Repozytoriami Kodu

### Problem: Meta-Graf vs. Repozytoria

Meta-graf jest jedną spójną strukturą. Kod żyje w repozytoriach. Te dwa światy muszą być zsynchronizowane.

### Mapowanie Node'ów na Repozytoria

System musi wiedzieć, **gdzie żyje kod** zmaterializowany z danego node'a. To mapowanie jest konfigurowalne:

| Struktura | Mapowanie |
|---|---|
| **Mono-repo** | Wszystkie node'y -> jedno repo, różne katalogi |
| **Multi-repo** | Jeden moduł = jedno repo |
| **Hybrid** | Niektóre moduły w shared repo, inne osobno |

Mapowanie jest definiowane przez nadzorcę i żyje w meta-grafie (jako konfiguracja na odpowiednim poziomie hierarchii).

```
Przykład mapowania:
System (root)
├── config: repos = { backend: "github.com/org/backend", frontend: "github.com/org/frontend" }
├── Moduł Auth -> repo: backend, path: src/modules/auth/
├── Moduł Users -> repo: backend, path: src/modules/users/
├── Moduł Frontend -> repo: frontend, path: src/
└── Moduł API Specs -> repo: api-specs, path: specs/
```

### Automatyczne Zarządzanie Branchami

Kiedy tworzona jest gałąź w meta-grafie, system **automatycznie tworzy odpowiednie gałęzie w repozytoriach kodu**, które są dotknięte zmianami.

```
Meta-graf: branch "feature/password-reset"
├── Dotyka: Auth, EmailService (oba w repo: backend)
├── Dotyka: AuthAPI spec (repo: api-specs)
└── Nie dotyka: Frontend

Automatycznie tworzone:
├── repo: backend -> branch: feature/password-reset
├── repo: api-specs -> branch: feature/password-reset
└── repo: frontend -> [brak brancha, nie dotyczy]
```

Jedna sesja na meta-grafie -> jeden branch o tej samej nazwie w dotkniętych repozytoriach. **Spójność nazewnictwa** jest automatyczna.

### Merge Meta = Merge Kodu

Kiedy changeset w meta-grafie jest mergowany do main:
1. Kod w dotkniętych repozytoriach jest mergowany do main
2. Opcjonalnie: automatyczne tworzenie Pull Requestów w repozytoriach
3. Opcjonalnie: automatyczny deploy po merge

---

## Kolejność Materializacji

System analizuje **drzewo zależności** node'ów do zmaterializowania i ustala kolejność:

### Reguła: Dependency-First

Node, od którego inny node zależy (Related), musi być zmaterializowany **wcześniej** (lub przynajmniej jego interfejs musi być zdefiniowany).

```
Kolejność materializacji:

Etap 1 (brak zależności):
├── EmailService
└── SMSProvider

Etap 2 (zależy od etapu 1):
└── PasswordResetService (zależy od EmailService, SMSProvider)

Etap 3 (zależy od etapu 2):
└── AuthAPI aktualizacja (zależy od PasswordResetService)

Etap 4 (testy integracyjne):
└── Testy end-to-end (zależy od wszystkich powyższych)
```

### Kto Klika "Implementuj"

Nadzorca decyduje kiedy materializować. Może:
- **Zmaterializować cały changeset** -- system liczy drzewo zależności i implementuje w kolejności
- **Zmaterializować wybrany node** -- np. tylko EmailService, żeby zobaczyć wynik
- **Zmaterializować inkrementalnie** -- node po node, weryfikując po drodze

---

## Rematerializacja (Regeneracja)

Kiedy zmienia się meta-opis node'a, jego kod musi być zregenerowany. System obsługuje to automatycznie:

1. **Zmiana meta** -> oznaczenie node'a jako "dirty" (wymagający rematerializacji)
2. **Propagacja** -> node'y zależne od zmienionego node'a mogą też być "dirty" (jeśli zmienił się interfejs)
3. **Rematerializacja** -> generator otrzymuje zaktualizowany kontekst i generuje nowy kod
4. **Testy** -> weryfikacja, że nowy kod jest poprawny

**Ważne:** Rematerializacja nie musi być globalna. Jeśli zmienił się tylko opis wewnętrzny node'a (nie interfejs), to tylko ten node wymaga regeneracji. Node'y zależne nie są dotknięte.
