# Signals

| Tag | Adresa | Logický port | Fyzický port | Popis signálu |
|-----|--------|--------------|--------------|---------------|
|     |        | AQ1          | AQ1+, AQ1-   | Nastavení výstupních otáček vřetena. 0-10V -> 0-18k RPM |
|     |        | DQ1          | DQ1          | Run forward. Aktivace ovládání otáček |
|     |        | DQ2          | DQ2          | Emergency stop |
|     |        | DQ3          | DQ3          | Fault reset |
|     |        | DQ4          | DQ4          | Multi speed 1 |
|     |        | DQ5          | DQ5          | External Fault |
|     |        | AQ2          | AQ2+, AQ2-   | Nastavení výstupního napětí na svorkách laboratorního zdroje. Napětí by mělo jít vypočítat proud a odpor na uhlíku. |
|     |        | AQ3          | AQ3+, AQ3-   | Řízení proudové ochrany, neboli ovládání frekvence a amplitudy |
|     |        | DI1          | DI1+, DI1-   | Čtení teploty z DI RTD |
|     |        | DI2          | DI2          | Čtení otáček pomocí modulu DI high speed. |
|     |        | DI3          | DI3          | Senzor vibrací je připojen přes IO Link |