# 12 -- Wizja Techniczna: Architektura Silnika

> **Uwaga:** Ten dokument opisuje wizję techniczną na poziomie konceptualnym. Konkretne decyzje implementacyjne będą podejmowane w kolejnych iteracjach.

---

## Model Aktorowy jako Paradygmat Implementacyjny

### Dlaczego Model Aktorowy

System Yggdrasil ma cechy, które naturalnie mapują się na model aktorowy (Actor Model):

1. **Każdy node w grafie jest niezależnym bytem** z własnym stanem (meta-opis, status implementacji, constrainty)
2. **Node'y komunikują się asynchronicznie** -- materializacja jednego node'a może triggerować rematerializację zależnych
3. **Równoległość** -- wielu nadzorców pracuje równolegle na różnych częściach grafu
4. **Izolacja błędów** -- problem z jednym node'em nie powinien blokować reszty systemu
5. **Skalowalność** -- system musi obsługiwać potencjalnie tysiące node'ów

### Mapowanie na Model Aktorowy

```
Node w meta-grafie  ←→  Aktor
Zmiana meta-opisu   ←→  Wiadomość do aktora
Materializacja      ←→  Aktor przetwarza wiadomość, produkuje wynik
Propagacja "dirty"  ←→  Aktor wysyła wiadomości do aktorów zależnych
Sesja/Changeset     ←→  Koordynator (Saga/Orchestrator)
```

### Potencjalne Technologie

- **.NET Orleans** -- Virtual Actor framework, automatyczne zarządzanie cyklem życia aktorów, persistence, dystrybucja. Dobrze pasuje, bo:
  - Virtual actors (grains) odpowiadają konceptowi node'a -- aktywują się gdy potrzebne, deaktywują gdy nie
  - Wbudowany persistence -- stan node'a można persystować automatycznie
  - Dystrybucja -- grains mogą żyć na różnych maszynach (horyzontalna skalowalność)
  - .NET ekosystem -- solidny, enterprise-ready

- **Akka.NET / Akka (JVM)** -- klasyczny actor framework
- **Microsoft Dapr** -- sidecar-based distributed runtime z actor model
- **Elixir/OTP** -- natywny actor model, fault-tolerant by design
- **Custom implementation** -- jeśli żaden framework nie pasuje idealnie

Wybór technologii będzie podyktowany konkretnymi wymaganiami, które wyklarują się przy implementacji.

---

## Baza Grafowa jako Storage Meta-Grafu

### Dlaczego Baza Grafowa, a Nie Git

Git operuje na **płaskich plikach** w drzewie katalogów. Meta-graf to **strukturalny, relacyjny graf** z:
- Node'ami o bogatych właściwościach
- Relacjami z etykietami i kierunkiem
- Artefaktami (dokumenty, diagramy) podpiętymi do node'ów
- Tagami i metadanymi
- Wersjonowaniem na poziomie grafu, nie plików

Spłaszczanie tego do plików w Git traci istotę -- relacje stają się implicitne, nawigacja jest nieefektywna, query po grafie jest niemożliwy.

### Wymagania dla Storage

| Wymaganie | Opis |
|---|---|
| **Grafowa struktura** | Natywne node'y, krawędzie, properties |
| **Wersjonowanie** | Pełna historia zmian grafu z możliwością odtworzenia dowolnego stanu |
| **Branchowanie** | Gałęzie grafu (jak w Git, ale na grafie) |
| **Replikacja** | Replika na wiele instancji (jak GitHub -- hostowane, ale replikowalne) |
| **Horyzontalna skalowalność** | Duże grafy (tysiące node'ów) bez degradacji wydajności |
| **Artefakty binarne** | Przechowywanie dokumentów, diagramów (lub referencje do blob store) |
| **Query** | Efektywne przeszukiwanie grafu (np. "znajdź wszystkie node'y z tagiem X") |

### Podejście do Wersjonowania Grafu

**Event sourcing** na grafie:
- Każda zmiana to zdarzenie (NodeCreated, RelationAdded, ArtifactModified, ...)
- Aktualny stan = replay wszystkich zdarzeń
- Branch = sekwencja zdarzeń od punktu rozgałęzienia
- Merge = aplikacja sekwencji zdarzeń z brancha na main

**Artefakty (dokumenty, diagramy)** mogą żyć w osobnym store (blob storage, S3-compatible) z referencjami w grafie. To rozdziela "strukturę" od "treści" i pozwala skalować niezależnie.

### Potencjalne Technologie Storage

- **Neo4j** -- najpopularniejsza baza grafowa, ma temporal features (wersjonowanie node'ów)
- **Amazon Neptune** -- managed graph database (AWS)
- **ArangoDB** -- multi-model (graf + dokument + klucz-wartość)
- **Custom event store + graf** -- event sourcing na eventach + projekcja do bazy grafowej
- **TerminusDB** -- baza grafowa z natywnym Git-like versioningiem (do zbadania)

Wybór będzie zależał od:
- Jakie operacje są najczęstsze (query, write, branch/merge)
- Wymagania replikacji i dystrybucji
- Kompatybilność z modelem aktorowym
- Koszty w scenariuszach SaaS i on-premise

---

## Model Deploymentu

### SaaS (Cloud-Hosted)

Standardowy model dla większości użytkowników:
- Meta-graf hostowany w chmurze
- Użytkownik loguje się, pracuje z meta-grafem przez UI
- Generatory kodu działają w chmurze
- Kod jest pushowany do repozytoriów użytkownika (GitHub, GitLab, etc.)
- Skalowanie automatyczne

```
Użytkownik → [UI/API] → Yggdrasil Cloud → [Generator] → GitHub/GitLab użytkownika
```

### On-Premise (Self-Hosted)

Dla firm, które chcą trzymać wiedzę wewnętrznie:
- Pełna instalacja na infrastrukturze klienta
- Meta-graf, artefakty, generacja -- wszystko wewnątrz firmy
- Brak danych wychodzących na zewnątrz
- Wymaga administracji, ale daje pełną kontrolę

```
Użytkownik → [Firmowy UI] → Yggdrasil on-prem → [Generator on-prem] → Firmowy GitLab
```

### Hybrid

- Meta-graf on-premise (wrażliwe dane architektoniczne w firmie)
- Generacja w chmurze (bo wymaga GPU/API do modeli AI)
- Kod pushowany do firmowego repozytorium

---

## Architektura Wysokopoziomowa (Konceptualna)

```
┌─────────────────────────────────────────────────────────────────┐
│                        WARSTWA PREZENTACJI                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Web UI  │  │ IDE Plugin│  │   CLI    │  │   API    │       │
│  │ (graf    │  │ (VSCode, │  │(terminal)│  │(integracje│       │
│  │ wizualny)│  │ IntelliJ)│  │          │  │ CI/CD)   │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       └──────────────┴─────────────┴─────────────┘              │
│                              │                                   │
├──────────────────────────────┼───────────────────────────────────┤
│                     WARSTWA SILNIKA                              │
│                              │                                   │
│  ┌───────────────────────────┼──────────────────────────┐       │
│  │              CORE ENGINE  │                          │       │
│  │  ┌──────────────────┐  ┌─┴──────────────┐          │       │
│  │  │  Graph Manager   │  │  Session/Branch │          │       │
│  │  │  (CRUD, query,   │  │  Manager        │          │       │
│  │  │   navigation)    │  │  (branch, merge,│          │       │
│  │  │                  │  │   conflict)     │          │       │
│  │  └──────────────────┘  └────────────────┘          │       │
│  │                                                     │       │
│  │  ┌──────────────────┐  ┌────────────────┐          │       │
│  │  │  Context Builder │  │  Dependency    │          │       │
│  │  │  (buduje pakiet  │  │  Resolver      │          │       │
│  │  │   kontekstowy)   │  │  (kolejność    │          │       │
│  │  │                  │  │   materializacji│          │       │
│  │  └──────────────────┘  └────────────────┘          │       │
│  │                                                     │       │
│  │  ┌──────────────────┐  ┌────────────────┐          │       │
│  │  │  Tag & Aspect    │  │  Exploration   │          │       │
│  │  │  Engine          │  │  Agent         │          │       │
│  │  │  (tagi, aspekty, │  │  (brownfield   │          │       │
│  │  │   filtrowanie)   │  │   scanning)    │          │       │
│  │  └──────────────────┘  └────────────────┘          │       │
│  └─────────────────────────────────────────────────────┘       │
│                              │                                   │
├──────────────────────────────┼───────────────────────────────────┤
│                   WARSTWA INTEGRACJI                             │
│                              │                                   │
│  ┌──────────────┐  ┌────────┴───────┐  ┌──────────────┐       │
│  │  Generator   │  │  Repo Manager  │  │  Test Runner │       │
│  │  Adapter     │  │  (git branch,  │  │  Adapter     │       │
│  │  (Claude,    │  │   merge, push) │  │  (uruchamia  │       │
│  │   Gemini,    │  │                │  │   testy)     │       │
│  │   custom)    │  │                │  │              │       │
│  └──────────────┘  └────────────────┘  └──────────────┘       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                    WARSTWA PERSISTENCE                           │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────┐        │
│  │  Graph Store          │  │  Artifact Store           │        │
│  │  (baza grafowa +      │  │  (blob storage dla        │        │
│  │   event sourcing)     │  │   dokumentów, diagramów)  │        │
│  └──────────────────────┘  └──────────────────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Skalowalność

### Horyzontalna Skalowalność Silnika

Model aktorowy naturalnie skaluje się horyzontalnie:
- Dodanie maszyn = więcej aktorów może być aktywnych jednocześnie
- Grain (Orleans) / Actor migruje automatycznie między maszynami
- Sesje różnych nadzorców mogą żyć na różnych maszynach

### Horyzontalna Skalowalność Storage

- Graf może być partycjonowany (poddrzewa na różnych partycjach)
- Artefakty w blob storage skalują się niezależnie
- Event store skaluje się przez sharding

### Potencjał Skalowalności

Idealizowany cel: **system powinien obsługiwać dowolnie duży meta-graf** (tysiące node'ów, setki nadzorców, dziesiątki równoległych sesji) bez degradacji doświadczenia.

W praktyce ograniczenia będą wynikać z:
- Kosztu generacji (wywołania modeli AI)
- Złożoności merge'owania dużych changesetów
- Czasu budowania kontekstu dla głębokich hierarchii

Te ograniczenia są **liniowe**, nie wykładnicze -- co jest kluczową różnicą względem degradacji obecnych narzędzi przy rosnącym codebase.

---

## Bezpieczeństwo i Izolacja

### Izolacja Danych między Tenantami (SaaS)

- Każdy tenant ma **izolowany graf** -- nie ma współdzielenia meta-grafów między organizacjami
- Generatory kodu działają w izolowanych środowiskach
- Credentials do repozytoriów klienta nigdy nie są współdzielone

### Bezpieczeństwo Meta-Grafu

- Meta-graf zawiera wiedzę architektoniczną -- to jest IP (Intellectual Property) firmy
- Szyfrowanie at rest i in transit
- Kontrola dostępu na poziomie node'ów (nadzorca widzi swój obszar)
- Audit log wszystkich operacji

### On-Premise jako Opcja Bezpieczeństwa

Dla firm, dla których chmura nie wchodzi w grę -- pełna instalacja on-premise eliminuje ryzyko wycieku danych architektonicznych.

---

## Otwarte Pytania Techniczne (Do Przyszłych Iteracji)

1. **Konkretny model danych** -- jak dokładnie wygląda schemat node'a, relacji, artefaktu w bazie grafowej?
2. **Protokół komunikacji z generatorami** -- jak dokładnie wygląda interfejs adaptera generatora?
3. **Format artefaktów** -- czy diagramy są Mermaid, PlantUML, custom? Jak są walidowane?
4. **UI/UX** -- jak wygląda interfejs nadzorcy? Jaki framework, jaka architektura frontendowa?
5. **Event sourcing schema** -- jak wyglądają konkretne eventy? Jaka jest strategia snapshotów?
6. **Replikacja** -- jak meta-graf jest replikowany między instancjami? Jaki protokół?
7. **Generator adapter protocol** -- standardowe API dla wymienialnych generatorów?
8. **Exploration agent** -- jak dokładnie agent skanuje istniejący codebase? Jakie heurystyki?
9. **Monitoring i observability** -- jak monitorować zdrowie systemu w produkcji?
10. **Pricing model** -- jak licencjonować system (per node, per nadzorca, per generacja)?

Te pytania będą adresowane w kolejnych wersjach dokumentacji, w miarę dojrzewania koncepcji i rozpoczęcia implementacji.
