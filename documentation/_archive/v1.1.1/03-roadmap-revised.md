# 03 -- Roadmapa (Revised): 4 Etapy

## Przegląd

| Etap | Nazwa | Sedno | Co odblokowuje |
|---|---|---|---|
| 1 | **Yggdrasil** | Graf + web + module store + materializacja | Produkt działa, revenue, ekosystem startuje |
| 2 | **Völundr** | Testy z meta + walidacja + wiele generatorów | Produkt jest niezawodny, store rośnie |
| 3 | **Huginn & Muninn** | Brownfield scan + wersjonowanie + zespoły | Serious teams, istniejące projekty |
| 4 | **Valhalla** | Enterprise + AI-nadzorcy + skala | Duże organizacje, pełna wizja |

---

## Etap 1: Yggdrasil (Drzewo Światów)

*Fundament. Drzewo rośnie, sklep się otwiera.*

### Scope

**Meta-graf engine:**
- Node'y z opisem, constraintami, interfejsem
- Relacje Parent-Child i Related
- Nieskończona głębokość hierarchii
- Globalna konfiguracja (tech stack, standardy)

**Context Builder:**
- 3-warstwowy pakiet kontekstowy (hierarchia + node + relacje)
- Dziedziczenie kontekstu z przodków
- Resolving interfejsów z relacji Related

**Materialization:**
- Jeden generator adapter (Claude API)
- Dependency-aware kolejność (dependency-first)
- Output: kod źródłowy + testy do filesystem / download / push to repo

**Module Store:**
- 10-20 seed modułów (Auth, Users, CRUD, Payments, Notifications, itp.)
- Browse, add to project, customize
- Publiczne moduły (community w przyszłości)
- Prywatne moduły (pro tier)

**Web UI:**
- Wizualizacja grafu (node'y + relacje)
- Edycja node'ów (opis, constrainty, interfejsy)
- Module Store browser
- Przycisk "Materialize" + podgląd wyniku
- Status node'ów (zmaterializowany / dirty / bez testów)

**Greenfield only.** Brak brownfield scan, brak wersjonowania poza git, brak multi-repo.

### Aha Moment

> "Wziąłem 5 modułów ze store, dodałem swój szósty, połączyłem interfejsami, kliknąłem Materialize -- w 20 minut mam działający backend z testami w moim tech stacku. I kod naprawdę rozumie jak moduły ze sobą gadają."

### Revenue (od dnia 1)

- Free: publiczne moduły, 3 materializacje/dzień
- Pro ($X/msc): prywatne grafy, nielimitowane materializacje, premium generatory
- Token margin: każda materializacja = API call, margin na tokenach

### Definicja Sukcesu

- [ ] Można stworzyć meta-graf z node'ami i relacjami w web UI
- [ ] Można przeglądać Module Store i dodawać moduły do projektu
- [ ] Moduły ze store mają zdefiniowane interfejsy i łączą się z innymi modułami
- [ ] Context Builder poprawnie składa 3-warstwowy pakiet
- [ ] Materializacja produkuje kod spójny z meta-opisem i interfejsami zależności
- [ ] Output zawiera testy wynikające z constraintów
- [ ] Można pobrać kod (ZIP) lub push do GitHub

---

## Etap 2: Völundr (Kowal Bogów)

*Kucie staje się precyzyjne. Ekosystem rośnie.*

### Scope

**Niezawodność materializacji:**
- Pełna pętla walidacyjna: materializacja → testy → fail → refine meta → regeneracja
- Rematerializacja przy zmianach meta (dirty propagation)
- Retry + fallback strategy (Claude fail → Gemini)
- Wiele adapterów generatorów (Claude, Gemini, custom)

**Testy z meta:**
- Constrainty → testy jednostkowe
- Reguły biznesowe → testy behawioralne
- Interfejsy → testy kontraktowe
- Testy na node (unit) + testy na rodzicu (integration)

**Pending Changes:**
- Edycja kodu propaguje "Pending Change" na meta
- Blokada materializacji dopóki pending nie jest rozwiązane
- Nadzorca zatwierdza lub aktualizuje meta

**Tagi i aspekty:**
- Tagi globalne i per obszar
- Aspekty podpinane pod tagi (cross-cutting concerns)
- Aspekty wstrzykują się do pakietu kontekstowego

**Ekosystem store:**
- Community contributions (publish your module)
- Quality scoring modułów (rating, test coverage, materializations count)
- Paid modules (twórcy zarabiają, Yggdrasil bierze prowizję)
- Wersjonowanie modułów w store

### Aha Moment

> "Zmieniłem constraint 'max 5 login attempts' na 'max 3'. Testy się przebudowały automatycznie, złapały regresję w kodzie, po rematerializacji -- wszystko zielone. A moduł auth, który opublikowałem, ma już 200 instalacji."

### Definicja Sukcesu

- [ ] Pętla walidacyjna działa end-to-end (meta → kod → test → fail → refine → regen)
- [ ] Testy wynikające z constraintów faktycznie łapią regresje
- [ ] Pending Changes blokują materializację dopóki nierozwiązane
- [ ] Tagi + aspekty wstrzykują kontekst do pakietów
- [ ] Community może publikować moduły w store
- [ ] Co najmniej 2 generatory (Claude + Gemini)

---

## Etap 3: Huginn & Muninn (Myśl i Pamięć)

*Kruki przynoszą wiedzę o istniejącym świecie. System wchodzi w brownfield.*

### Scope

**Brownfield exploration:**
- Agent skanujący istniejący codebase → buduje meta-graf
- Nadzorca koryguje wynik eksploracji
- Inkrementalna adopcja (20% codebase pokryte meta-grafem wystarczy do startu)

**Wersjonowanie grafu:**
- Migracja z plików/git do bazy grafowej (lub event store)
- Branchowanie meta-grafu
- Changesety z 4 stanami (Draft → Review → Approved → Materialized)
- Merge z detekcją konfliktów + AI-assisted conflict resolution

**Multi-repo orchestration:**
- Jedna sesja zmienia N repozytoriów
- Automatyczne branche per feature w dotkniętych repo
- Kompatybilność: mono-repo, multi-repo, hybrid

**Team features:**
- Wielu nadzorców per projekt
- Uprawnienia per obszar grafu
- Widoki per rola (graf, dokument, dashboard)

### Aha Moment

> "Zeskanowałem nasz backend. W 30 minut miałem meta-graf 5 modułów. Dodałem nową funkcjonalność przez meta -- agent wiedział o wszystkich interfejsach, wygenerował poprawny kod, testy przeszły. Zespół adoptował w tydzień."

### Definicja Sukcesu

- [ ] Agent eksploracji buduje sensowny meta-graf z istniejącego kodu
- [ ] Branche meta-grafu działają izolowanie
- [ ] Merge wykrywa konflikty, agent proponuje rozwiązania
- [ ] Multi-repo: changeset tworzy spójne branche w dotkniętych repo
- [ ] Team: wielu nadzorców, uprawnienia, widoki

---

## Etap 4: Valhalla (Siedziba Bogów)

*Pełna moc. Enterprise. Intelligence. Skala.*

### Scope

**AI Intelligence:**
- Nadzorcy AI per obszar (wyznaczani przez człowieka)
- "Wypromptowani" nadzorcy (system proponuje)
- Agent analizy wpływu (Brief → automatyczna analiza)
- Proaktywne sugestie i wykrywanie problemów
- Pełny flow: Brief → Analiza → Propozycja → Zatwierdzenie → Materializacja

**Enterprise:**
- On-premise deployment
- Multi-tenant SaaS z izolacją
- Horizontal scaling (model aktorowy)
- Bezpieczeństwo, compliance, audit log
- Governance: zaawansowane uprawnienia, role, approval workflows

**Zaawansowane:**
- Wiele widoków (graf, dokument, chat, dashboard)
- PO-friendly document view (Confluence-like backed by graph)
- API publiczne do integracji z CI/CD
- Advanced analytics (coverage, quality trends, team performance)

### Definicja Sukcesu

- [ ] AI-nadzorca potrafi autonomicznie zarządzać obszarem w ramach constraintów
- [ ] Brief triggeruje automatyczną analizę wpływu z konkretnymi propozycjami
- [ ] System działa on-premise i w SaaS
- [ ] Horizontal scaling bez degradacji
- [ ] Pełny audit trail wszystkich operacji

---

## Timeline (Orientacyjny)

| Etap | Szacowany czas | Kamień milowy |
|---|---|---|
| **Krok 0** | 1 weekend | Ręczna walidacja: pakiety kontekstowe → Claude → wynik |
| **Yggdrasil** | 6-8 tygodni | Web app live, module store, pierwsza materializacja |
| **Völundr** | 6-8 tygodni | Testy z meta, pętla walidacyjna, community store |
| **Huginn & Muninn** | 8-10 tygodni | Brownfield, wersjonowanie, zespoły |
| **Valhalla** | 10-14 tygodni | Enterprise, AI-nadzorcy, skala |

Pierwszy revenue: Yggdrasil (6-8 tygodni). Brownfield: Huginn & Muninn (20-26 tygodni).
