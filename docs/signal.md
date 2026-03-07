# Signály vstupních a výstupních modulů

| Tag | Adresa | Logický port | Fyzický port | Svorky měniče | Popis signálu |
|-----|--------|--------------|--------------|---------------|---------------|
|     |        | AQ1          | AQ1+, AQ1-  | AVI, ACM               | Nastavení výstupních otáček vřetena. 0-10V -> 0-18k RPM |
|     |        | AQ2          | AQ2+, AQ2-  |               | Nastavení výstupního napětí na svorkách laboratorního zdroje. Napětí by mělo jít vypočítat proud a odpor na uhlíku. |
|     |        | AQ3          | AQ3+, AQ3-  |               | Řízení proudové ochrany laboratorního zdroje., neboli ovládání frekvence a amplitudy |
|     |        | DQ1          | DQ1          | MI1           | Run forward. Aktivace ovládání otáček |
|     |        | DQ2          | DQ2          | MI2           | Emergency stop |
|     |        | DQ3          | DQ3          | MI3           | Fault reset |
|     |        | DQ4          | DQ4          | MI4           | Multi speed 1 |
|     |        | DQ5          | DQ5          | MI5           | External Fault |
|     |        | DI1          | DI1+, DI1-  |               | Čtení teploty z DI RTD |
|     |        | DI2          | DI2          |               | Čtení otáček pomocí modulu DI high speed. |
|     |        | DI3          | DI3          |               | Senzor vibrací je připojen přes IO Link. |
|     |        | DI4          | DI4          |               | Výstup ze safety relátka OMRON. |