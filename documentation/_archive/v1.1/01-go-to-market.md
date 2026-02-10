# 01 -- Strategia Go-To-Market: Target, Pozycjonowanie, Sprzedaż

## Największa Karta Przetargowa

**"AI, które działa na dużych, skomplikowanych projektach -- tam, gdzie obecne narzędzia się wywalają."**

Nie sprzedajemy "AI generuje kod" -- to już mają wszyscy. Sprzedajemy rozwiązanie konkretnego, powszechnego bólu:

1. **Ból jest powszechny i rosnący.** Prawie każdy zespół 10+ devów próbował Cursor/Copilot/Claude na swoim codebase i trafił w ścianę. Proste zmiany -- ok. Cokolwiek dotykające wielu modułów -- katastrofa. Ten ból rośnie z każdym miesiącem, bo codebase'y rosną, a narzędzia AI nie nadążają.

2. **Nikt tego nie rozwiązał.** Cursor, Copilot, Claude Code -- wszystkie operują na kodzie. Lepsze modele, dłuższe okno kontekstowe -- to próba rozwiązania problemu siłą, nie strukturą. Yggdrasil rozwiązuje go **architektonicznie**.

3. **Ludzie już zapłacili za AI w developmencie.** Nie trzeba ich przekonywać, że AI w kodowaniu ma sens. Trzeba im pokazać: "To, co macie, nie skaluje się. To, co dajemy, skaluje się."

**Brownfield jest kartą przetargową, nie greenfield.** Greenfield to miły bonus. Brownfield to ból, za który ludzie płacą.

---

## Analiza Segmentów: Kto Zapłaci i Za Co

### Segment A: Zespoły 10-50 devów z rosnącym codebase (PRIMARY TARGET)

**Profil:**
- Mają system, który rośnie od 1-3 lat
- 50-500k linii kodu, kilka-kilkanaście modułów
- Próbowali AI -- działa na małych taskach, wywala się na dużych
- Mają architektów/seniorów, którzy wiedzą jak system wygląda, ale nie mają tego sformalizowanego
- Boli ich: czas wdrażania nowych ludzi, czas implementacji cross-module features, regresje

**Dlaczego zapłacą:**
- Obietnica: "Twój architekt definiuje meta-model systemu, a AI wreszcie robi to, co powinno -- implementuje zmiany poprawnie, w kontekście."
- ROI jest bezpośredni: szybsza implementacja feature'ów = mniej sprintów = pieniądze

**Ryzyko:** Adopcja wymaga wysiłku (ktoś musi zbudować meta-graf). Jeśli to jest za dużo roboty na starcie, odpuszczą.

### Segment B: Software house'y / agencje

**Profil:**
- Budują wiele projektów dla klientów
- Każdy projekt to w dużej mierze powtarzalny wzorzec (e-commerce, SaaS, CRM)
- Mierzą zysk w: czas * stawka. Szybciej = więcej projektów = więcej pieniędzy
- Mają architektów, którzy mogą zdefiniować meta-model

**Dlaczego zapłacą:**
- Obietnica: "Zdefiniuj szablon meta-grafu dla typu projektu (np. SaaS boilerplate). Każdy nowy projekt to customizacja meta, nie pisanie od zera."
- ROI: czas projektu z 3 miesięcy do 3 tygodni na powtarzalnych wzorcach

**Ryzyko:** Każdy software house ma swój proces i tooling. Muszą chcieć zmienić workflow.

### Segment C: Architekci i Tech Leads indywidualnie

**Profil:**
- Frustracja z tym, że AI nie rozumie architektury ich systemu
- Chcą mieć "żywą dokumentację architektury", która jest jednocześnie executable
- Power users -- sami sobie radzą

**Dlaczego zapłacą:**
- Obietnica: "Twoja architektura nie jest już rysunkiem w Miro, który nikt nie aktualizuje. Jest żywym grafem, z którego materializuje się kod."
- Cena nie jest barierą (indywidualna licencja)

**Ryzyko:** Mały revenue per user. Ale: evangeliści, którzy potem wprowadzą do firm (bottom-up adoption).

### Segment D: Enterprise (500+ devów)

**Profil:**
- Ogromne systemy, setki modułów, wiele zespołów
- Ból kontekstu AI jest ekstremalny -- nikt nie ogarnia całości
- Mają budżet, ale wolno podejmują decyzje

**Dlaczego zapłacą:**
- Obietnica: "Każdy zespół pracuje na swoim obszarze meta-grafu. Interfejsy między zespołami są sformalizowane. AI wreszcie działa w skali."
- On-premise deployment (muszą to mieć)

**Ryzyko:** Długi cykl sprzedaży. Nie dla MVP.

---

## Rekomendacja: Target dla MVP

**Segment A (zespoły 10-50 devów) z naciskiem na brownfield.**

Dlaczego:

1. **Ból jest największy i najbardziej namacalny.** Mają konkretny system, na którym AI nie działa dobrze. Można im powiedzieć: "Daj mi swój repo, pokażę Ci jak wygląda meta-graf Twojego systemu i co się zmieni."

2. **Mają ludzi, którzy potrafią obsługiwać meta-graf.** Mają architektów i seniorów. Nie trzeba ich uczyć co to moduł i interfejs. Trzeba im dać narzędzie.

3. **Decyzja zakupowa jest szybka.** Tech lead/CTO w firmie 10-50 devów podejmuje decyzję sam lub z jednym spotkaniem. Nie ma 6-miesięcznego procurement.

4. **ROI jest mierzalny.** "Ile czasu zajmuje wam feature dotykający 3 modułów? Tydzień? Z meta-grafem to 2 godziny pracy nadzorcy + materializacja."

5. **Brownfield to bariera wejścia dla konkurencji.** Każdy potrafi zrobić "opisz projekt i wygeneruj kod". Nikt nie potrafi zrobić "nałóż inteligentną warstwę meta na istniejący, skomplikowany system".

---

## Pozycjonowanie: Komunikacja z Klientem

### Nie mów

"AI generuje kod z opisu" -- to brzmi jak każde inne narzędzie.

### Mów

> **"Twój codebase jest za duży na obecne AI. Yggdrasil tworzy architektoniczną mapę Twojego systemu, dzięki której AI wreszcie rozumie kontekst i implementuje zmiany poprawnie -- nawet w systemie z 200 tysiącami linii kodu."**

### Hasło

> **"AI, które nie gubi się w Twoim kodzie."**

### Kluczowe słowa w komunikacji
- **Istniejący system** (brownfield, nie "zbuduj od zera")
- **Kontrola** (nadzorca definiuje, AI wykonuje)
- **Skaluje się** (rozmiar codebase to nie problem)
- **Architektura** (nie random generowanie, ale świadome, kontekstowe)

---

## Implikacje dla MVP

Jeśli target to "zespoły 10-50 devów z istniejącym codebase", to MVP musi:

1. **Szybko zbudować meta-graf z istniejącego kodu** -- tryb eksploracji to killer feature, nie nice-to-have. Jeśli ktoś musi ręcznie budować meta-graf dla 200 plików, odpuści.

2. **Pokazać wartość na pierwszej zmianie** -- nie po miesiącu adopcji, ale po pierwszym Briefie. "Opisz zmianę -> zobacz analizę wpływu -> zatwierdź -> dostań kod."

3. **Działać z ich istniejącym repo** -- GitHub/GitLab, ich branche, ich CI. Nie może wymagać zmiany infrastruktury.

4. **Nie wymagać pełnego pokrycia meta-grafem** -- MVP musi działać nawet jeśli tylko 20% codebase jest opisane w meta-grafie. Inkrementalna adopcja.

### Testowanie Wewnętrzne

Przed klientami -- testowanie na własnych projektach:
- **Greenfield** potwierdza, że silnik działa (łatwiejszy punkt startu, nie wymaga agenta eksploracji)
- **Brownfield** w realnym projekcie potwierdza, że problem jest rozwiązany
