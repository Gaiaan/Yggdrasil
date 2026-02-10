Zaprojektuj silnik, którego rolą będzie budowanie i utrzymywanie relacji pomiędzy "obiektami" w taki sposób żeby agent AI mógł budować tą strukturę i po niej nawigować. Celem jest zbudowanie silnika, który będzie trzymał constrainty pomiędzy obiektami, obiekty mogą być różnych typów np. komponent, klasa, serwis, system i być hierarchiczne. Ma to na celu stworzenie silnika sterującego generowaniem na 2 poziomach.

1. Generalna architektura - hierarchiczne drzewa obiektów połączonych w różnych miejscach. Da się je wizualnie oglądać ale również promptami edytoać do czego agent ma dostęp poprzez narzędzia.
2. Każdy obiekt może mieć powiązane diagramy, które są "weryfikowane" jeśli da się w kwestii prezentacji relacji. Np. UML sequence diagram dla modułu + kilka innych rzeczy jak opis słowny oraz diagram dodatkowo dla kontekstu.

Mając 1 oraz 2 na podstawie takiego kontekstu można odpalić generatory kodu (Claude Code, Gemini CLI bądź cokolwiek innego, co dostanie na wejściu specyfikację i zaimplementuje elementy. Wizualna prezentacja będzie w stanie pokazać w jakim statusie jest implementacja. Każdy taki obiekt może mieć swoje testy i mogą być odpalane.

Powoduje to że system tworzony jest od ogółu do szczegółu gdzie szczegóły są implementowane na podstawie kontekstu na obiektach oraz na bazie danych z hierarchii wyżej.

Implementacja funkcjonalności pozwala agentowi przechodzić po drzewie i przeglądać kontekst obiektów i dokumentację (diagramy, tekst), żeby prawidłowo proponować ścieżki które trzeba "przetrzeć"/dorobić/zmienić/usunąć, żeby funkcjonalność wdrożyć.

Czyli masz dwa oddzielne światy, meta oraz kod

Meta to są obiekty, drzewa hierarchie i tak dalej, które są opisane dokumentacją tekstową albo diagramową oraz wynik konwersji dokumentacji do kodu.

Oczywiście całe drzewo musi być wersjonowane, do zastanowienia się jak. Pytanie czy takie liniowe podejscie jak GIT tutaj będzie adekwatne do problemu.

@documentation/foundation/idea.md pomyśl głęboko nad tym pomysłem. Generalnie idea jest taka, żeby człowiek na podstawie rozmowy promptował założenia architektury, widział rezultat, z czasem coraz bardziej wchodził w detale i definiował główne ramy, szkielet robiąc to samemu albo promptując i zgadzając się bądź nie na zmiany. Po czasie powstaje graf reprezentujący rozwiązanie które można zlecić do implementacji agentom gdzie każdy moduł ma swój zestaw dokumentacji (hierarchicznie oraz relacyjnie) i na tej podstawie tworzyć dobry kod z dobrymi constraintami oraz testami wynikajacymi w prost z definiowania metapoziomu przez nadzorcę. Docelowo nadzorca może być człowiekiem ale wcale nie musi. Istota jest taka, że na pierwszy rzut MVP to jest tworzenie metapoziomu a potem delegacja do implentacji. Problem? Problem jest taki, że obecne agenty AI nie ogarniają tak potężnego kontekstu jak cała aplikacja a izolowanie modułów oraz informacje dostępne z metapoziomu do budowy kontekstu ograniczają potrzebę znajomości całości projektu jak potężny by on nie był. Tylko nadzorca bądź obszarowi nadzorcy muszą to znać. Metapoziom jest weryfikowalny docelowo constraintami i refułami oraz trzyma "twardy model" niezależnie od implementajcji.
