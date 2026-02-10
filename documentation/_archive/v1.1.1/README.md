# Yggdrasil -- Pivot: Architectural Playground + Module Store (v1.1.1)

## Kontekst Pivotu

Dokumentacja [v1](../v1/README.md) definiowała koncept meta-sterowanego wytwarzania oprogramowania.
Dokumentacja [v1.1](../v1.1/README.md) definiowała strategię go-to-market i roadmapę z 6 etapami.

**v1.1.1 redefiniuje podejście** na podstawie analizy ryzyk, szans i napięć zidentyfikowanych podczas dyskusji koncepcyjnej:

- **Precision Tool** zamiast Playground-for-fun -- narzędzie dla ludzi myślących architektonicznie
- **Module Store** zamiast Template Store -- składak z architektonicznych modułów, nie kopiowanie projektów
- **Web app od dnia 1** -- bo module store i composability wymagają UI
- **4 etapy zamiast 6** -- czystszy podział, mniej overheadu
- **Greenfield + store jako entry point** -- brownfield (scan) jako naturalny upgrade path, nie priorytet MVP

## Dokumenty

| Dokument | Opis |
|---|---|
| [01 - Uzasadnienie Pivotu](01-pivot-rationale.md) | Dlaczego playground + module store, dlaczego nie CLI, dlaczego nie SpecKit v2 |
| [02 - Definicja Produktu](02-product-definition.md) | Co to jest, dla kogo, jak działa, user flow |
| [03 - Roadmapa (Revised)](03-roadmap-revised.md) | 4 etapy: Yggdrasil, Völundr, Huginn & Muninn, Valhalla |
| [04 - Specyfikacja Yggdrasil](04-yggdrasil-spec.md) | Szczegółowa specyfikacja etapu 1: scope, features, UI, aha moment |
| [05 - Module Store](05-module-store.md) | Jak działa store, format modułu, composability, revenue model |
| [06 - Ryzyka i Rozstrzygnięcia](06-risks-and-decisions.md) | Zidentyfikowane ryzyka, escape hatche, podjęte decyzje |

## Kluczowe Hasło

> **"AI, które nie gubi się w Twoim kodzie."**

## Pozycjonowanie

Nie "vibe coding" (v0, bolt). Nie "flat spec to code" (SpecKit). 
**Architektoniczny składak z modułów, z precyzyjnym kontekstem, materializowany do kodu.**

Jak Terraform Module Registry, ale dla architektury aplikacyjnej.

---

**Wersja:** 1.1.1 -- Pivot Playground  
**Data:** 8 lutego 2026  
**Faza:** Redefiniowanie produktu przed implementacją
