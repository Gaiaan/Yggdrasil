# 11 -- Porównanie z Obecnymi Podejściami

## Krajobraz Obecnych Narzędzi AI do Wytwarzania Oprogramowania

Stan na 2026: mamy kilka dominujących podejść do używania AI w developmencie. Każde ma swoje mocne strony i fundamentalne ograniczenia.

---

## Podejście 1: Agent Operujący na Kodzie (Cursor Agent, Claude Code, Copilot Workspace)

### Jak działa

Agent AI dostaje dostęp do codebase i bezpośrednio edytuje pliki. Rozumie kontekst z otwartych plików, wyników grep/search, i ewentualnie z wygenerowanego planu.

### Mocne strony
- Szybki start -- otwierasz IDE i zaczynasz
- Dobry dla małych, izolowanych zmian
- Naturalny workflow dla programistów

### Fundamentalne ograniczenia

**Problem kontekstu:** Agent widzi fragment codebase. Przy dużym projekcie (100+ plików, wiele modułów) traci orientację. Nie wie, co jest gdzie, jakie są zależności, jakie konwencje obowiązują w innych częściach systemu. Efekt: lokalne poprawki, które psują coś gdzie indziej.

**Brak modelu:** Agent nie ma formalnej "mapy" systemu. Każda sesja zaczyna od zera. Wiedza o architekturze jest rozproszona w kodzie i głowie programisty, nie w żadnym formalnym artefakcie.

**Niekontrolowane mutacje:** Agent może edytować dowolny plik. Nie ma constraintów, nie ma "nie wolno ruszyć tego interfejsu". Programista musi sam pilnować spójność -- a to nie skaluje się.

**Skalowanie:** Im większy projekt, tym gorszy wynik. Związek jest prawie liniowy.

### Yggdrasil vs. Agent na Kodzie

| Aspekt | Agent na Kodzie | Yggdrasil |
|---|---|---|
| **Kontekst** | Fragment codebase, traci orientację | Precyzyjny pakiet: node + hierarchia + relacje |
| **Model systemu** | Nie istnieje formalnie | Meta-graf z constraintami |
| **Kontrola zmian** | Agent edytuje cokolwiek | Agent widzi tylko swój node i interfejsy |
| **Skalowanie** | Degradacja przy dużych projektach | Izolacja modułów -- rozmiar nie wpływa |
| **Weryfikowalność** | Code review przez człowieka | Constrainty i testy wynikające z meta |

---

## Podejście 2: Plan + Ask + Agent (Cursor tryby)

### Jak działa

Trzy tryby współpracują:
- **Plan** -- agent analizuje i proponuje plan zmian
- **Ask** -- agent odpowiada na pytania o codebase
- **Agent** -- agent implementuje plan

### Mocne strony
- Planowanie przed implementacją
- Możliwość iteracji na planie przed ruszeniem kodu
- Ask mode daje odpowiedzi na pytania o architekturze

### Fundamentalne ograniczenia

**Plan jest efemeryczny:** Plan istnieje w kontekście sesji. Nie jest trwałym artefaktem. Następna sesja zaczyna od zera -- plan się gubi.

**Plan nie ma constraintów:** Plan mówi "co zrobić", ale nie mówi "czego nie wolno ruszyć". Agent implementujący plan nadal operuje na kodzie bez formalnych ograniczeń.

**Implementacja wciąż cierpi na problem kontekstu:** Nawet z dobrym planem, agent implementujący mierzy się z tym samym problemem kontekstu co Agent na Kodzie.

### Yggdrasil vs. Plan+Ask+Agent

| Aspekt | Plan+Ask+Agent | Yggdrasil |
|---|---|---|
| **Plan** | Efemeryczny, per sesja | Meta-graf -- trwały, wersjonowany |
| **Ask** | Agent szuka po kodzie | Agent nawiguje po meta-grafie (szybciej, precyzyjniej) |
| **Agent** | Operuje na kodzie z planem | Operuje na izolowanym node z precyzyjnym kontekstem |
| **Trwałość** | Plan ginie po sesji | Meta-graf żyje wiecznie |
| **Współpraca** | Jedna osoba, jedna sesja | Wielu nadzorców, branche, merge requesty |

**Kluczowa obserwacja:** Tryby Plan i Ask byłyby **doskonałe** do operowania na meta-grafie zamiast na kodzie. Plan mógłby proponować zmiany w grafie. Ask mógłby nawigować po grafie. Agent mógłby materializować node'y. To jest naturalne zastosowanie tych trybów -- na wyższym poziomie abstrakcji.

---

## Podejście 3: SpecKit i Podobne (Specyfikacja -> Implementacja)

### Jak działa

Narzędzie pozwala precyzować specyfikację funkcjonalności (user stories, wymagania, acceptance criteria), a następnie przekazuje tę specyfikację agentowi implementującemu.

### Mocne strony
- Separacja specyfikacji od implementacji
- Dobre w ramach procesu precyzowania wymagań
- Strukturalne podejście do definiowania "co" przed "jak"

### Fundamentalne ograniczenia

**Wywala się na implementacji skomplikowanego kodu:** SpecKit jest dobry w fazie specyfikacji, ale kiedy agent przystępuje do implementacji na dużym, skomplikowanym codebase -- mierzy się z tym samym problemem kontekstu. Specyfikacja mówi co zrobić, ale agent musi sam znaleźć gdzie i jak w kodzie to zaimplementować.

**Brak modelu architektonicznego:** Specyfikacja jest płaska -- opisuje funkcjonalność, ale nie wie nic o strukturze systemu. Nie wie, że zmiana w module A wpływa na moduł B.

**Jednopoziomowa:** Specyfikacja żyje "obok" kodu, nie jest zintegrowana z modelem systemu. Nie ma hierarchii, nie ma relacji, nie ma constraintów architektonicznych.

### Yggdrasil vs. SpecKit

| Aspekt | SpecKit | Yggdrasil |
|---|---|---|
| **Specyfikacja** | Płaska lista wymagań | Hierarchiczny graf z relacjami |
| **Kontekst dla agenta** | Wymagania + agent szuka w kodzie | Wymagania + hierarchia + interfejsy (gotowy pakiet) |
| **Architektura** | Nie modelowana | Rdzeń systemu |
| **Propagacja zmian** | Brak | Explicite relacje, automatyczne wykrywanie wpływu |
| **Skalowanie** | Degradacja z rozmiarem codebase | Izolacja modułów |

---

## Podejście 4: Tradycyjny Development z AI Assistantem

### Jak działa

Programista pisze kod, AI asystuje (autocomplete, wyjaśnienia, generowanie fragmentów). Człowiek jest w pełni odpowiedzialny za architekturę i spójność.

### Mocne strony
- Pełna kontrola człowieka
- AI jako narzędzie, nie decydent
- Sprawdzone workflow

### Fundamentalne ograniczenia

**Nie skaluje się:** Człowiek jest wąskim gardłem. AI asystuje, ale nie przejmuje odpowiedzialności za spójność, nie generuje kodu z formalnej specyfikacji, nie weryfikuje constraintów.

**Dokumentacja driftuje:** Architektura w głowie programisty, wymagania w Jira, kod w repo. Trzy źródła prawdy, które z czasem się rozjeżdżają.

**Brak formalizmu:** Decyzje architektoniczne nie są formalne -- istnieją w Confluence (nieaktualnym), w Slacku (nie do przeszukania) albo nigdzie.

### Yggdrasil vs. Tradycyjny + AI

| Aspekt | Tradycyjny + AI | Yggdrasil |
|---|---|---|
| **Źródło prawdy** | Kod (i częściowo głowa dewelopera) | Meta-graf (formalny, weryfikowalny) |
| **Rola AI** | Asystent do fragmentów kodu | Wykonawca materializujący z precyzyjnej specyfikacji |
| **Rola człowieka** | Pisze kod, AI pomaga | Definiuje meta, AI materializuje |
| **Dokumentacja** | Obok kodu, driftuje | Jest kodem (meta-graf = specyfikacja = truth) |
| **Skalowanie** | Linearne z rozmiarem zespołu | Linearne z rozmiarem meta-grafu (nie kodu) |

---

## Podsumowanie: Dlaczego Yggdrasil to Skok Jakościowy

### Fundamentalna Różnica

Wszystkie obecne podejścia mają wspólny mianownik: **agent operuje na kodzie** (bezpośrednio lub pośrednio). Yggdrasil przesuwa punkt operacji **o jeden poziom abstrakcji wyżej** -- na meta-graf.

To nie jest inkrementalne ulepszenie. To jest **zmiana paradygmatu**:

```
Obecne:   Człowiek → [opisuje co chce] → Agent → [szuka w kodzie] → [edytuje kod]
                                                    ↑ Tu jest problem (kontekst)

Yggdrasil: Człowiek → [edytuje meta-graf] → System → [buduje pakiet kontekstowy] → Agent → [materializuje kod]
                                                       ↑ Tu jest rozwiązanie (izolowany, precyzyjny kontekst)
```

### Kluczowe Zyski

1. **Problem kontekstu rozwiązany strukturalnie** -- nie przez lepsze modele AI, ale przez lepszą organizację informacji
2. **Trwały model systemu** -- nie efemeryczny plan, ale wersjonowany graf z constraintami
3. **Skalowalność** -- rozmiar systemu nie degraduje jakości generacji (bo kontekst jest izolowany)
4. **Weryfikowalność** -- constrainty na meta-poziomie, testy wynikające z meta, nie ad-hoc code review
5. **Współpraca** -- wielu nadzorców, branche, merge requesty na poziomie architektury
6. **Niezależność od AI** -- wymienialne generatory, brak vendor lock-in
