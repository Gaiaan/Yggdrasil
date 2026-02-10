# Yggdrasil -- System Meta-Sterowanego Wytwarzania Oprogramowania

## Dokumentacja Koncepcyjna v1

Niniejsza dokumentacja opisuje kompletną koncepcję systemu, w którym **oprogramowanie nie jest pisane, lecz materializowane z formalnego meta-opisu**. Metapoziom -- edytowalny przez człowieka lub nadzorcę AI -- stanowi jedyne źródło prawdy. Kod jest pochodną i nigdy nie jest edytowany bezpośrednio.

---

## Struktura Dokumentacji

Dokumenty ułożone są od ogółu do szczegółu. Każdy kolejny rozszerza i precyzuje koncepcje wprowadzone w poprzednich.

### Poziom 1: Fundament

| Dokument | Opis |
|---|---|
| [01 - Wizja i Motywacja](01-vision.md) | Dlaczego ten system istnieje. Jaki problem rozwiązuje. Propozycja wartości. |
| [02 - Koncept Fundamentalny](02-core-concept.md) | Dwa światy: Meta i Kod. Zasada niemutowalności kodu. Rola nadzorcy. |

### Poziom 2: Model

| Dokument | Opis |
|---|---|
| [03 - Meta-Graf](03-meta-graph.md) | Struktura grafu: node'y, relacje, hierarchia, artefakty dokumentacyjne. |
| [04 - Nadzorcy i Role](04-supervisors.md) | Kto operuje na meta-grafie. Ludzie, agenty AI, samoorganizacja. |
| [05 - Cykl Życia Zmiany](05-change-lifecycle.md) | Od Briefu klienta przez analizę, modyfikację meta, implementację, do wdrożenia. |

### Poziom 3: Mechanizmy

| Dokument | Opis |
|---|---|
| [06 - Wersjonowanie i Branchowanie](06-versioning.md) | Jak graf jest wersjonowany. Gałęzie, merge requesty, stany, konflikty. |
| [07 - Materializacja Kodu](07-code-generation.md) | Jak meta staje się kodem. Generatory, kontekst, zarządzanie repozytoriami. |
| [08 - Strategia Testów](08-testing.md) | Jak testy wynikają z meta-opisu. Poziomy testowania, zależności. |

### Poziom 4: Adopcja i Kontekst

| Dokument | Opis |
|---|---|
| [09 - Adopcja: Greenfield i Brownfield](09-adoption.md) | Jak wejść z systemem w nowy projekt i w istniejący codebase. |
| [10 - Tagi i Aspekty](10-tags-and-aspects.md) | System tagów, cross-cutting concerns, aspekty per obszar. |
| [11 - Porównanie z Obecnymi Podejściami](11-comparison.md) | Dlaczego to lepsze niż Agent+Plan+Ask, SpecKit, tradycyjne podejście. |
| [12 - Wizja Techniczna](12-technical-vision.md) | Model aktorowy, baza grafowa, skalowalność, deployment SaaS/on-prem. |

---

## Status

**Wersja:** 1.0 -- Koncepcja robocza  
**Data:** 8 lutego 2026  
**Faza:** Eksploracja i krystalizacja pomysłu  

Ta dokumentacja jest żywym dokumentem. Kolejne iteracje będą pogłębiać poszczególne obszary w kierunku specyfikacji implementacyjnej.
