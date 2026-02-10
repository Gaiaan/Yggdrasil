# 01 -- Uzasadnienie Pivotu

## Od Enterprise Brownfield do Architectural Playground

### Co się zmieniło

Pierwotna strategia (v1.1) zakładała:
- Target: zespoły 10-50 devów z istniejącym codebase (brownfield)
- Entry point: brownfield exploration (scan kodu -> meta-graf)
- Sprzedawalny od etapu 3 (Huginn & Muninn)

**Problemy z tym podejściem:**
1. Brownfield exploration (agent skanujący kod) to trudny problem techniczny -- opóźnia time-to-market
2. Adopcja wymaga dużego upfront cost (skan, korekta meta-grafu) zanim pojawia się wartość
3. Brak revenue do etapu 3 -- kilka miesięcy budowania bez przychodów
4. Brak efektu sieciowego -- każda firma to izolowany deployment

### Nowe podejście

- Target: architekci, senior devs, tech leads -- ludzie myślący architektonicznie
- Entry point: **web app z module store** -- składasz system z architektonicznych modułów
- Sprzedawalny od etapu 1 (Yggdrasil)
- Brownfield scan to naturalny upgrade path, nie priorytet MVP

---

## Trzy Powody Pivotu

### 1. Module Store to differentiator, nie nice-to-have

Bez module store, Yggdrasil to "napisz specyfikację, dostań kod" -- czyli SpecKit v2. Z module store, to "składak architektoniczny z precyzyjnym kontekstem" -- nic takiego nie istnieje.

| Bez store | Z store |
|---|---|
| Piszesz wszystko od zera | Bierzesz gotowe moduły i łączysz |
| SpecKit v2 | Terraform Module Registry dla aplikacji |
| Brak efektu sieciowego | Ekosystem rośnie z każdym modułem |
| Brak revenue na start | Revenue od dnia 1 (tokeny + premium) |

### 2. Composability wymaga web UI

Składanie modułów, łączenie interfejsami, wizualizacja grafu relacji -- to naturalnie żyje w webie. CLI nie daje tego doświadczenia. Precision Tool nie musi być CLI -- Terraform Cloud jest precision tool i jest web.

### 3. Greenfield playground nie zabija brownfield

Brownfield to scan istniejącego kodu -> meta-graf. To jest **feature**, nie **produkt**. Jak będzie gotowy, dokładamy go do istniejącego systemu. Ale system musi istnieć wcześniej -- i playground z module store jest tym systemem.

Ścieżka: Playground (greenfield) → Sukces → "Chcę to na moim istniejącym projekcie" → Scan feature → Brownfield.

---

## Czym To NIE Jest

### Nie jest v0 / bolt / Lovable
Tamte: "opisz co chcesz, dostań kod." Jeden prompt, zero architektury, zero kontroli nad strukturą.
Yggdrasil: **graf architektoniczny** z modułami, interfejsami, constraintami. Precyzja, nie magia.

### Nie jest SpecKit v2
SpecKit: płaska specyfikacja → agent szuka w kodzie → implementuje.
Yggdrasil: **hierarchiczny graf z relacjami** → context builder składa precyzyjny pakiet → materializacja z pełnym kontekstem. Plus: composability z module store.

### Nie jest Low-Code (OutSystems, Mendix)
Low-code: drag & drop UI, zamknięty ekosystem, nie da się wyeksportować.
Yggdrasil: **otwarty output** -- kod trafia do Twojego repo, w Twoim tech stacku, bez vendor lock-in.

### Nie jest Architecture-as-Diagram (Structurizr, IcePanel)
Tamte: rysuj diagramy architektury. Piękne, ale nieexecutable.
Yggdrasil: meta-graf to **wykonywalna specyfikacja** -- z niej materializuje się kod i testy.
