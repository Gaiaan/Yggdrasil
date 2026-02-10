## Diagram 1: Poziom Strategiczny (0-1)

Ten diagram pokazuje, jak system Product Managera odbiera `Pomysł`, komunikuje się ze Stakeholderem wyłącznie za pomocą artefaktów `Pytanie` i `Odpowiedź` (przez dedykowane skrzynki Handoff), a następnie tworzy i deleguje `Strategic Brief`.

```mermaid
graph TD
    %% --- STYLING DEFINITIONS ---
    classDef role fill:#ececff,stroke:#9a9aff,stroke-width:2px,color:#333;
    classDef process fill:#cce5ff,stroke:#004085,stroke-width:2px,color:#004085;
    classDef handoff fill:#fff3cd,stroke:#856404,stroke-width:2px,shape:cylinder;
    classDef artifact fill:#f8d7da,stroke:#721c24,stroke-width:2px,shape:parallelogram;
    classDef decision fill:#d1ecf1,stroke:#0c5460,stroke-width:2px,shape:rhombus;

    %% --- Poziom 0: Stakeholder ---
    subgraph "Poziom 0: Stakeholder"
        P0_1["P0.1: Tworzenie Pomysłu"]:::process
        P0_2["P0.2: Udzielanie Odpowiedzi"]:::process
        P0_1 -- tworzy --> Idea(("Idea")):::artifact
    end

    %% --- Handoffs ---
    Idea -- trafia do --> H0_1[["Handoff L0->L1"]]:::handoff
    H_PM_SH_Q[["Handoff PM->P0"]]:::handoff -- odbierany przez --> P0_2
    H_SH_PM_A[["Handoff P0->PM"]]:::handoff -- odbierany przez --> P1_3

    %% --- Poziom 1: Product Manager ---
    subgraph "Diagram 1: System Product Managera"
        P1_1["P1.1: Monitorowanie<br/>Zleceń L0"]:::process
        P1_2{"P1.2: Triage Pomysłu"}:::decision
        P1_3["P1.3: Zarządzanie<br/>Dyskusją z P0"]:::process
        P1_4["P1.4: Synteza<br/>'Strategic Brief'"]:::process
        P1_5["P1.5: Monitorowanie<br/>Raportów L2"]:::process
        P1_6{"P1.6: Weryfikacja<br/>Raportu L2"}:::decision
        P1_7["P1.7: Tworzenie<br/>Zlecenia Poprawek L2"]:::process
        P1_8["P1.8: Tworzenie<br/>Globalnego Raportu"]:::process

        %% Wewnętrzne Połączenia
        H0_1 -- odbierany przez --> P1_1
        P1_1 --> P1_2
        P1_2 -- "Wymaga doprecyzowania" --> P1_3
        P1_2 -- "Wystarczająco jasne" --> P1_4
        P1_3 -- tworzy --> Question[/"Pytanie do P0"/]:::artifact
        Question -- trafia do --> H_PM_SH_Q
        P0_2 -- tworzy --> Answer[/"Odpowiedź od P0"/]:::artifact
        Answer -- trafia do --> H_SH_PM_A
        P1_3 -- po otrzymaniu odpowiedzi --> P1_4
        P1_4 -- tworzy --> StrategicBrief[/"Strategic Brief"/]:::artifact

        H2_1_Up[["Handoff L2->L1 <Raporty>"]]:::handoff -- odbierany przez --> P1_5
        P1_5 --> P1_6
        P1_6 -- "Wymaga poprawek" --> P1_7
        P1_6 -- "Zatwierdzony" --> P1_8
        P1_7 -- tworzy --> RevisionTask2[/"Zlecenie Poprawek L2"/]:::artifact
        P1_8 -- tworzy --> GlobalStatusReport[/"Globalny Raport Statusu"/]:::artifact
    end

    %% --- Wyjścia z Poziomu 1 ---
    StrategicBrief -- trafia do --> H1_2[["Handoff L1->L2 <Zlecenia>"]]:::handoff
    RevisionTask2 -- trafia do --> H1_2
    GlobalStatusReport -- trafia do --> P0_1
```

-----

## Diagram 2: Poziom Liderów Taktycznych (2)

Ten diagram pokazuje w pełni sformalizowaną współpracę w Radzie Strategicznej. `Lead Operations` komunikuje się z innymi Liderami wyłącznie przez artefakty `Prośba o Wkład` i `Wkład Ekspercki`, przekazywane przez dedykowane skrzynki Handoff.

```mermaid
graph TD
    %% --- STYLING DEFINITIONS ---
    classDef role fill:#ececff,stroke:#9a9aff,stroke-width:2px,color:#333;
    classDef process fill:#cce5ff,stroke:#004085,stroke-width:2px,color:#004085;
    classDef handoff fill:#fff3cd,stroke:#856404,stroke-width:2px,shape:cylinder;
    classDef artifact fill:#f8d7da,stroke:#721c24,stroke-width:2px,shape:parallelogram;
    classDef decision fill:#d1ecf1,stroke:#0c5460,stroke-width:2px,shape:rhombus;

    %% --- Wejścia do Poziomu 2 ---
    H1_2[["Handoff L1->L2 <Zlecenia>"]]:::handoff -- odbierany przez --> P2_LO_1
    H3_2_Up[["Handoff L3->L2 <Raporty>"]]:::handoff -- odbierany przez --> P2_LO_5
    H_Leads_LO_A[["Handoff Liderzy->LO"]]:::handoff -- odbierany przez --> P2_LO_3

    %% --- Poziom 2: System Liderów ---
    subgraph "Diagram 2: System Liderów Taktycznych"
        subgraph "System Lead Operations"
            P2_LO_1["P2.1: Monitorowanie Zleceń L1"]:::process; P2_LO_2["P2.2: Tworzenie Prośby o Wkład"]:::process; P2_LO_3{"P2.3: Synteza Konsensusu"}:::decision; P2_LO_4["P2.4: Tworzenie Zadań Taktycznych"]:::process; P2_LO_5["P2.5: Monitorowanie Raportów L3"]:::process; P2_LO_6{"P2.6: Weryfikacja Raportu L3"}:::decision; P2_LO_7["P2.7: Tworzenie Zlecenia Poprawek L3"]:::process; P2_LO_8["P2.8: Tworzenie Raportu L2"]:::process
        end
        subgraph "Systemy Liderów Specjalistów (Analityk, Architekt, Designer)"
            P2_S_1["P2.S1: Odbiór Próśb/Zadań"]:::process; P2_S_2["P2.S2: Tworzenie Wkładu Eksperckiego"]:::process; P2_S_3["P2.S3: Tworzenie Zleceń Domenowych"]:::process
        end

        %% Połączenia wewnętrzne L2
        P2_LO_1 --> P2_LO_2
        P2_LO_2 -- tworzy --> Council_Request[/"Prośba o Wkład"/]:::artifact
        Council_Request -- trafia do --> H_LO_Leads_Q[["Handoff LO->Liderzy"]]:::handoff
        H_LO_Leads_Q -- odbierany przez --> P2_S_1
        P2_S_1 -- "otrzymano prośbę" --> P2_S_2
        P2_S_2 -- tworzy --> ExpertInput[/"Wkład Ekspercki"/]:::artifact
        ExpertInput -- trafia do --> H_Leads_LO_A
        P2_LO_3 -- "Brak konsensusu" --> Feedback[/"Raport Eskalacyjny"/]:::artifact
        P2_LO_3 -- "Jest konsensus" --> P2_LO_4
        P2_LO_4 -- tworzy --> L2_Tasks[/"Zadania od Rady"/]:::artifact
        L2_Tasks -- trafia do --> H_LO_Leads_Q
        P2_S_1 -- "otrzymano zadanie" --> P2_S_3
        P2_S_3 -- tworzy --> DomainBrief[/"Zlecenie Domenowe"/]:::artifact

        P2_LO_5 --> P2_LO_6; P2_LO_6 -- "Wymaga poprawek" --> P2_LO_7; P2_LO_6 -- "Zatwierdzony" --> P2_LO_8
        P2_LO_7 -- tworzy --> RevisionTask3[/"Zlecenie Poprawek L3"/]:::artifact
        P2_LO_8 -- tworzy --> Report2[/"Raport z Ukończenia L2"/]:::artifact
    end

    %% --- Wyjścia z Poziomu 2 ---
    Feedback -- trafia do --> H2_1_Up[["Handoff L2->L1 <Raporty>"]]:::handoff
    Report2 -- trafia do --> H2_1_Up
    DomainBrief -- trafia do --> H2_3[["Handoff L2->L3 <Zlecenia>"]]:::handoff
    RevisionTask3 -- trafia do --> H2_3
```

-----

## Diagram 3: Poziom Zarządzania Domeną (3)

Ten diagram eliminuje abstrakcyjne "angażowanie" w `Workspace`. `Operations Manager` tworzy konkretne `Zadania Domenowe` dla specjalistów, a ci odsyłają `Raporty Ukończenia Zadań`, zanim `OM` stworzy zbiorcze zadania dla L4.

```mermaid
graph TD
    %% --- STYLING DEFINITIONS ---
    classDef role fill:#ececff,stroke:#9a9aff,stroke-width:2px,color:#333;
    classDef process fill:#cce5ff,stroke:#004085,stroke-width:2px,color:#004085;
    classDef handoff fill:#fff3cd,stroke:#856404,stroke-width:2px,shape:cylinder;
    classDef artifact fill:#f8d7da,stroke:#721c24,stroke-width:2px,shape:parallelogram;
    classDef decision fill:#d1ecf1,stroke:#0c5460,stroke-width:2px,shape:rhombus;

    %% --- Wejścia do Poziomu 3 ---
    H2_3[["Handoff L2->L3 <Zlecenia>"]]:::handoff -- odbierany przez --> P3_OM_1
    H4_3_Up[["Handoff L4->L3 <Raporty>"]]:::handoff -- odbierany przez --> P3_OM_4
    H_Team_OM_A[["Handoff ZespółDomeny->OM"]]:::handoff -- odbierany przez --> P3_OM_2

    %% --- Poziom 3: System Zarządzania Domeną ---
    subgraph "Diagram 3: System Zarządzania Domeną"
        subgraph "System Operations Manager"
            P3_OM_1["P3.1: Odbiór Zleceń z L2"]:::process; P3_OM_2["P3.2: Monitorowanie Pracy Domeny"]:::process; P3_OM_3["P3.3: Tworzenie Zadań Implementacyjnych"]:::process; P3_OM_4["P3.4: Monitorowanie Raportów L4"]:::process; P3_OM_5{"P3.5: Weryfikacja Raportu L4"}:::decision; P3_OM_6["P3.6: Tworzenie Zlecenia Poprawek L4"]:::process; P3_OM_7["P3.7: Tworzenie Raportu L3"]:::process
        end
        subgraph "Systemy Specjalistów Domenowych (PO, BA, Arch)"
             P3_S_1["P3.S1: Odbiór Zadania Domenowego"]:::process; P3_S_2["P3.S2: Praca nad Artefaktem Domenowym"]:::process
        end

        %% Połączenia wewnętrzne L3
        P3_OM_1 -- tworzy --> DomainTask[/"Zadanie Domenowe"/]:::artifact
        DomainTask -- trafia do --> H_OM_Team_Q[["Handoff OM->ZespółDomeny"]]:::handoff
        H_OM_Team_Q -- odbierane przez --> P3_S_1
        P3_S_1 --> P3_S_2
        P3_S_2 -- tworzy --> DomainTaskReport[/"Raport Ukończenia Zadania"/]:::artifact
        DomainTaskReport -- trafia do --> H_Team_OM_A
        P3_OM_2 -- "Wszystkie zadania ukończone" --> P3_OM_3
        P3_OM_3 -- tworzy --> ImplTasks[/"Zadania Implementacyjne"/]:::artifact

        P3_OM_4 --> P3_OM_5; P3_OM_5 -- "Wymaga poprawek" --> P3_OM_6; P3_OM_5 -- "Zatwierdzony" --> P3_OM_7
        P3_OM_6 -- tworzy --> RevisionTask4[/"Zlecenie Poprawek L4"/]:::artifact
        P3_OM_7 -- tworzy --> Report3[/"Raport z Ukończenia L3"/]:::artifact
    end

    %% --- Wyjścia z Poziomu 3 ---
    ImplTasks -- trafia do --> H3_4[["Handoff L3->L4 <Zlecenia>"]]:::handoff
    RevisionTask4 -- trafia do --> H3_4
    Report3 -- trafia do --> H3_2_Up[["Handoff L3->L2 <Raporty>"]]:::handoff
```

-----

## Diagram 4: Poziom Zespołu Projektowego (4)

Ostatni diagram pokazuje w pełni sformalizowaną pętlę sprintu. Komunikacja między Developerem a QA odbywa się wyłącznie za pomocą artefaktów `Pull Request` i `Bug Report` przekazywanych przez dedykowane skrzynki Handoff.

```mermaid
graph TD
    %% --- STYLING DEFINITIONS ---
    classDef role fill:#ececff,stroke:#9a9aff,stroke-width:2px,color:#333;
    classDef process fill:#cce5ff,stroke:#004085,stroke-width:2px,color:#004085;
    classDef handoff fill:#fff3cd,stroke:#856404,stroke-width:2px,shape:cylinder;
    classDef artifact fill:#f8d7da,stroke:#721c24,stroke-width:2px,shape:parallelogram;
    classDef decision fill:#d1ecf1,stroke:#0c5460,stroke-width:2px,shape:rhombus;

    %% --- Wejścia do Poziomu 4 ---
    H3_4[["Handoff L3->L4 <Zlecenia>"]]:::handoff -- odbierany przez --> P4_TL_1
    H_QA_Dev[["Handoff QA->Dev"]]:::handoff -- odbierany przez --> P4_Dev_1

    %% --- Poziom 4: System Zespołu Projektowego ---
    subgraph "Diagram 4: System Zespołu Projektowego"
        subgraph "System Team Lead"
            P4_TL_1["P4.1: Odbiór Zadań L3"]:::process; P4_TL_2["P4.2: Planowanie Sprintu"]:::process; P4_TL_3["P4.3: Monitorowanie Sprintu"]:::process; P4_TL_4["P4.4: Tworzenie Raportu L4"]:::process
        end
        subgraph "Systemy Ról Wykonawczych"
            P4_Dev_1["P4.D1: Realizacja Zadania / Poprawka Bugu"]:::process
            P4_CR_1["P4.CR1: Code Review"]:::process
            P4_QA_1["P4.Q1: Testowanie Funkcji"]:::process
        end

        %% Połączenia wewnętrzne L4
        P4_TL_1 --> P4_TL_2
        P4_TL_2 -- tworzy --> SprintBacklog[/"Sprint Backlog"/]:::artifact
        SprintBacklog -- odbierany przez --> P4_Dev_1
        P4_Dev_1 -- tworzy --> PullRequest[/"Pull Request"/]:::artifact
        PullRequest -- trafia do --> H_Dev_CR[["Handoff Dev->CR"]]:::handoff
        H_Dev_CR -- odbierany przez --> P4_CR_1
        P4_CR_1 -- tworzy --> ApprovedCode[/"Zatwierdzony Kod"/]:::artifact
        ApprovedCode -- trafia do --> H_CR_QA[["Handoff CR->QA"]]:::handoff
        H_CR_QA -- odbierany przez --> P4_QA_1
        P4_QA_1 -- "Znaleziono błąd" --> BugReport[/"Raport o Błędzie"/]:::artifact
        BugReport -- trafia do --> H_QA_Dev
        P4_QA_1 -- "Jakość OK" --> FeatureDone[/"Ukończona Funkcja"/]:::artifact
        FeatureDone -- monitorowany przez --> P4_TL_3
        P4_TL_3 -- po zakończeniu sprintu, na podstawie funkcji --> P4_TL_4
        P4_TL_4 -- tworzy --> Report4[/"Raport z Ukończenia L4"/]:::artifact
    end

    %% --- Wyjścia z Poziomu 4 ---
    Report4 -- trafia do --> H4_3_Up[["Handoff L4->L3 <Raporty>"]]:::handoff
```
