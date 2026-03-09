# Signály vstupních a výstupních modulů

| Tag | Adresa | IO modul | Připojené zařízení  | Popis signálu |
|-----|--------|--------------|---------------|---------------|
|     |        | AQ1+, AQ1-  | [Měnič] AVI, ACM               | Nastavení výstupních otáček vřetena. 0-10V -> 0-18k RPM |
|     |        | AQ2+, AQ2-  | [Labor. zdroj]              | Nastavení výstupního napětí na svorkách laboratorního zdroje. Napětí by mělo jít vypočítat proud a odpor na uhlíku. |
|     |        | AQ3+, AQ3-  | [Labor. zdroj]              | Řízení proudové ochrany laboratorního zdroje., neboli ovládání frekvence a amplitudy |
|     |        | AI1          | [Hallova sonda]  | Měření výstupního proudu z laboratorního zdroje. Kontrola, že odpovídá nastavené hodnotě |
|     |        | DQ1          | [Měnič] MI1           | Run forward. Aktivace ovládání otáček |
|     |        | DQ2          | [Měnič] MI2           | Emergency stop |
|     |        | DQ3          | [Měnič] MI3           | Fault reset |
|     |        | DQ4          | [Měnič] MI4           | Multi speed 1 |
|     |        | DQ5          | [Měnič] MI5           | External Fault |
|     |        | DQ6          | [Labor. zdroj] (Output OFF / Enable)          |  na LAbo |
|     |        | DI1+, DI1-  |               | Čtení teploty z DI RTD |
|     |        | DI2          |               | Čtení otáček pomocí modulu DI high speed. |
|     |        | DI3          |               | Senzor vibrací je připojen přes IO Link. |
|     |        | DI4          |               | Výstup ze safety relátka OMRON. |