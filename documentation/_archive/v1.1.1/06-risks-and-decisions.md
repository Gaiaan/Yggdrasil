# 06 -- Ryzyka i Rozstrzygnięcia

Dokument zbiera wszystkie ryzyka zidentyfikowane podczas dyskusji koncepcyjnej wraz z podjętymi decyzjami i escape hatchami.

---

## Rozstrzygnięte Decyzje

### D1: Kod nigdy nie jest edytowany bezpośrednio

**Zasada:** Meta-graf jest jedynym źródłem prawdy. Kod jest pochodną.

**Escape hatch:** Edycja kodu jest technicznie możliwa, ale:
- System wykrywa diff i tworzy **Pending Change** na odpowiednim node'dzie
- Node dostaje status "desynchronized"
- **Blokada materializacji** tego node'a dopóki Pending Change nie jest rozwiązane
- Nadzorca musi: zaktualizować meta (żeby odzwierciedlało zmianę) ALBO odrzucić zmianę w kodzie

**Rationale:** Absolutny zakaz edycji kodu jest niepraktyczny (hotfixy, workaroundy). Ale drift meta-kodu musi być kontrolowany i wymuszony do rozwiązania.

**Etap implementacji:** Völundr (etap 2)

### D2: Precision Tool, nie Playground-for-fun

**Decyzja:** Yggdrasil to narzędzie dla ludzi myślących architektonicznie (architekci, senior devs, tech leads). Nie jest "vibe coding" dla każdego.

**Konsekwencje:**
- UX zakłada, że użytkownik rozumie co to moduł, interfejs, constraint
- Module store to architektoniczne klocki, nie "wygeneruj mi apkę"
- Messaging: "AI, które nie gubi się w Twoim kodzie" (kontrola, precyzja)

### D3: Web app od dnia 1

**Decyzja:** Yggdrasil to web app, nie CLI.

**Rationale:**
- Module store wymaga browsera
- Composability (składanie modułów, łączenie interfejsami) wymaga wizualizacji
- Revenue (SaaS) wymaga accounts i płatności
- CLI nie daje "aha moment" w 5 minut

### D4: 4 etapy zamiast 6

**Decyzja:** Kolaps z 6 do 4 etapów:
- Yggdrasil (graf + store + materializacja)
- Völundr (testy + walidacja + ekosystem)
- Huginn & Muninn (brownfield + wersjonowanie + zespoły)
- Valhalla (enterprise + AI + skala)

**Rationale:** Bifrost (multi-repo, tagi) i Norns (AI-nadzorcy) nie są odrębnymi etapami wartości. Multi-repo i tagi wchodzą do Huginn & Muninn. AI-nadzorcy wchodzą do Valhalla.

### D5: Greenfield first, brownfield jako upgrade

**Decyzja:** MVP (Yggdrasil) obsługuje tylko greenfield. Brownfield scan to feature etapu 3.

**Rationale:** Brownfield exploration (agent skanujący kod) to trudny problem. Opóźniałby time-to-market o miesiące. Playground z module store daje wartość i revenue bez niego.

### D6: Module store w etapie 1, nie później

**Decyzja:** Store jest częścią Yggdrasil, nie Völundr.

**Rationale:** Bez store, Yggdrasil to SpecKit v2 (napisz spec, dostań kod). Store daje composability i differentiator od dnia 1. Plus: revenue od dnia 1 i fundament ekosystemu.

---

## Zidentyfikowane Ryzyka

### R1: Jakość generacji -- zależność zewnętrzna

**Ryzyko:** Cały produkt zależy od tego, czy generator (Claude/Gemini) produkuje dobry kod z pakietu kontekstowego.

**Mitigation:**
- **Krok 0:** Ręczna walidacja przed budowaniem czegokolwiek (weekend test)
- **Testy z meta (Völundr):** Automatyczna walidacja -- kod musi przejść testy z constraintów
- **Retry + fallback:** Jeśli generator A failuje, próbuj generator B
- **Cache:** Udane materializacje są cachowane, nie regenerowane bez potrzeby
- **Long-term:** Dane (meta, zwalidowany-kod) jako training data do fine-tuned modelu

**Severity:** Wysoka. Jeśli generatory nie dają dobrych wyników -- produkt nie ma sensu.
**Krok 0 jest obligatoryjny.**

### R2: Meta staje się pseudokodem

**Ryzyko:** Żeby generator dawał dobre wyniki, nadzorca musi opisać meta tak szczegółowo, że de facto pisze pseudokod. Wtedy: "po co mi dodatkowa warstwa?"

**Mitigation:**
- Samodostrajanie granulacji: jeśli AI robi błędy, dziel node na mniejsze
- Moduły ze store mają **gotowe, przetestowane meta-opisy** -- użytkownik customizuje, nie pisze od zera
- Granulacja jest decyzją nadzorcy: prosty moduł = krótki opis, złożony = dokładniejszy
- Constrainty i interfejsy to nie pseudokod -- to formalne wymagania

**Severity:** Średnia. Moduły ze store łagodzą ten problem znacząco.

### R3: Adopcja -- friction budowania meta-grafu

**Ryzyko:** Użytkownik wchodzi, widzi pusty graf, nie wie od czego zacząć. Odpuszcza.

**Mitigation:**
- **Module store eliminuje problem "pustej kartki"** -- zaczynasz od gotowych modułów
- **System templates** w store ("SaaS Starter", "E-Commerce MVP") dają cały graf do customizacji
- **Time to first materialization < 10 minut** -- weź 3 moduły, kliknij materialize
- **Onboarding flow** prowadzący krok po kroku

**Severity:** Średnia. Module store to główna obrona.

### R4: Playground przyciąga niewłaściwych ludzi

**Ryzyko:** Playground przyciąga ludzi, którzy chcą "szybko wygenerować apkę" (target v0/bolt). Są rozczarowani, bo Yggdrasil wymaga myślenia architektonicznego.

**Mitigation:**
- Messaging: jasno komunikuj "precision tool for architects"
- Onboarding: pokaż graf, moduły, interfejsy -- kto się boi, odpada wcześnie
- Target marketing: konferencje architektoniczne, community senior devów, nie "learn to code"

**Severity:** Niska. Lepiej mieć mniejszą, zaangażowaną bazę niż masę bounce'ów.

### R5: Okno kontekstowe AI rośnie -- problem znika?

**Ryzyko:** Za 2 lata modele mają 10M tokenów i świetnie je wykorzystują. Problem "kontekst jest za duży" znika.

**Odpowiedź:** Nie. Z dwóch powodów:
1. **Precyzyjny kontekst zawsze bije ogromny.** Stosunek sygnału do szumu. 2000 tokenów dokładnie tego, co trzeba > 2M tokenów "wszystkiego."
2. **Meta-graf ma wartość niezależnie od generacji.** Żywa dokumentacja architektury, impact analysis, composability ze store -- to ma sens nawet bez materializacji.

**Severity:** Niska. Ale trzeba mieć odpowiedź na to pytanie, bo klienci je zadadzą.

### R6: Konkurencja -- Cursor/GitHub implementują podobne podejście

**Ryzyko:** Duzi gracze widzą, że meta-level działa, i implementują to w swoich produktach.

**Moat:**
- **Module store / ekosystem** -- efekt sieciowy, trudny do skopiowania
- **Paradygmat** -- Cursor/GitHub musieliby zmienić fundamentalne podejście z "AI edytuje kod" na "AI materializuje z meta". To jest pivot, nie feature.
- **Dane treningowe** -- pary (meta, zwalidowany-kod) to unikalne dane
- **Community** -- twórcy modułów, adopcja w firmach

**Severity:** Średnia long-term. Na start nie istnieje (nikt tego nie robi).

### R7: Reużywalność modułów ze store

**Ryzyko:** Moduły ze store dają 30% projektu (boilerplate). 70% to unikalna logika domeny. Czy ludzie zapłacą za 30%?

**Mitigation:**
- 30% boilerplate to tydzień-dwa pracy dewelopera. Oszczędność jest realna.
- Moduły dają nie tylko kod, ale **architekturę** -- interfejsy, constrainty, wzorce. To kieruje całą resztę projektu.
- Z czasem: branżowe moduły (e-commerce specyficzne, fintech specyficzne) pokrywają więcej niż 30%

**Severity:** Średnia. Do zwalidowania na realnych użytkownikach.

---

## Otwarte Pytania (Do Przyszłych Iteracji)

1. **Tech stack silnika** -- jaki framework/język dla backendu i frontendu Yggdrasil?
2. **Hosting materializacji** -- czy generator działa server-side czy client-side (API key użytkownika)?
3. **Pricing konkrety** -- ile kosztuje Pro? Ile materialization credits w free tier?
4. **Module quality control** -- jak zapewnić jakość community modułów? Review process?
5. **Supported tech stacks** -- które tech stacki w Yggdrasil? Ile to wysiłku per stack?
6. **Graph visualization library** -- jaka biblioteka do renderowania grafu w web UI?
7. **Persistence** -- pliki/git na start vs. baza od razu? Dla web app raczej baza.
8. **Multi-tenancy** -- jak izolować projekty/dane użytkowników od dnia 1?
