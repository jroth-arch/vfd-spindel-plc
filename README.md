# spindle-vfd-control

Project deals with control of vfd spindle. Aim of the work is to adopt practical skills to work with spindle and sensors.

---

## Ovládání měniče

### Nastavení parametrů
- Zapojit měnič do sítě.
- Klávesou **Enter** se dostaneme do zadávání P parametrů. Opakovaným mačkáním lze nastavit skupinu `P01.xx` nebo konkrétní parametr `P01.0x`. Šipkami nahoru/dolů se nastaví hodnota a Enter potvrdí.
- Měnič je nastaven pro řízení motoru do 18 000 otáček. Parametry jsou uloženy v permanentní paměti.

---

### Parametry P01 – Provozní parametry

| Parametr | Hodnota | Popis |
|----------|---------|-------|
| P01-00 | 300 Hz | Fmax – dle štítku motoru (18k rpm). Pro 24k rpm → 400 Hz |
| P01-01 | 300 Hz | FBase – od 0 Hz do FBase roste krouťák lineárně. Nad FBase krouťák klesá |
| P01-02 | 220 V  | Vmax – dle štítku motoru. Používá se pro výpočet U/f poměru |
| P07-00 | 8,6 A  | Motor rated current – dle štítku motoru |

<img src="images/stitek_menice.png" alt="Štítek měniče" width="400">

---

### Parametry P02 – Nastavení ovládání

| Parametr | Hodnota | Popis |
|----------|---------|-------|
| P02.00 | 1 | Source of First Master Frequency Command – zdroj frekvence → analog vstup AVI (P04.07 = 0 → AVI = 0–10 V) |
| P02.01 | 1 | Source of First Operation Command – External Terminals, Keypad STOP/RESET enabled |

---

### Parametry P04 – Multifunkční vstupy MIx

| Parametr | Hodnota | Vstup | Funkce |
|----------|---------|-------|--------|
| P4-00 | 1 | MI1 | Run Forward – Start/Stop vřetena |
| P4-01 | 3 | MI2 | Emergency Stop – okamžité vypnutí |
| P4-02 | 6 | MI3 | Fault Reset – reset po chybě |
| P4-03 | 8 | MI4 | Multi-speed 1 – druhá pevná rychlost |
| P4-04 | 7 | MI5 | External Fault – aktivuje externí chybový stav |
| P4-05 | 0 | MI6 | Not used – volný vstup |
| P4-07 | 0 | AVI | AVI input select – 0 = 0–10 V, 1 = 4–20 mA |

---

### PLC tagy pro ovládání MI vstupů

V PLC jsou vytvořeny tagy, které přes DQ aktivují signály MI vstupů. Na tagy šahá web/HMI:

- **Run Forward** – aktivuje ovládání otáček motoru přes AVI signál (alias AO_Ch2)
- **Emergency Stop**
- **Fault Reset**
- **Multi-speed 1**
- **External Fault**

---

### Zapojení fyzického propojení (PLC DQ → MI)

#### Digitální signály
- PLC DQ (digitální výstup 24 V) → MIx (např. MI1) na měniči.
- PLC 0 V (GND) → DCM (digital common) měniče – společná reference je nutná!
- Na měniči lze použít interní +24 V jako zdroj, nebo nech PLC dodávat 24 V.
- Pokud jsou PLC výstupy PNP (sourcing): PLC DO → MI, GND → DCM.
- Ujisti se, zda je měnič nastaven pro NPN/PNP (COM polarity) – někdy parametrem nebo propojkou.

#### Analogové řídící signály
- Analogový výstup se zapojí na vstupy: **AVI** (PLC AO Ux+), **ACM** (PLC AO Ux–).
- Přepínače **SW1** (PNP/NPN), **SW2** (AVI/ACI) jsou přepnuty směrem **nahoru**.

<table>
  <tr>
    <td align="center"><img src="images/rizeni_otacek_analog_1.png" width="400"><br><em>Zapojení AVI</em></td>
    <td align="center"><img src="images/rizeni_otacek_analog_2.png" width="400"><br><em>Přepínače SW1/SW2</em></td>
  </tr>
</table>

#### Zapojení motoru
- Zapojení do **trojúhelníku**.

---

## TIA Project

Rozpracovaný projekt na laptopu:
`GenerateAQSignal_TIAP_9618_21.00.00.00_01.00.0001`

### Kde pokračovat
- **ProjectKarel** – nástroje pro kreslení zapojení

---

## Appendix 1 – Sequence diagram (Mermaid)

```mermaid
sequenceDiagram
    autonumber

    participant OB1 as OB1 (Main cycle)
    participant IO as FC_IO_Map
    participant SG as FB_SafetyGate
    participant DRV as FB_DriveCtrl
    participant LPSU as FB_LabPSU
    participant TEMP as FB_Temp_PT1000
    participant RPM as FB_RPM_Meas
    participant VIB as FB_Vibration
    participant ALM as FB_AlarmMgr
    participant DB_IO as DB_IO
    participant DB_DRV as DB_Drive
    participant DB_LPSU as DB_LabPSU
    participant DB_MEAS as DB_Meas
    participant DB_SAF as DB_Safety
    participant DB_ALM as DB_Alarms

    Note over OB1: === OB1 cyklus start ===

    OB1->>IO: ReadInputs()
    IO->>DB_IO: Snapshot DI/AI

    OB1->>SG: Execute()
    SG->>DB_IO: Read DI states
    SG->>DB_SAF: Update safety state

    OB1->>DRV: Execute()
    DRV->>DB_IO: Read commands
    DRV->>DB_SAF: Check permits
    DRV->>DB_DRV: Update state machine

    OB1->>LPSU: Execute()
    LPSU->>DB_LPSU: Update waveform state
    LPSU->>DB_IO: Prepare AQ2/AQ3 values

    OB1->>TEMP: Execute()
    TEMP->>DB_IO: Read PT1000 raw
    TEMP->>DB_MEAS: Filter + scale temp

    OB1->>RPM: Execute()
    RPM->>DB_IO: Read pulse info
    RPM->>DB_MEAS: Calculate RPM

    OB1->>VIB: Execute()
    VIB->>DB_IO: Read vibration data
    VIB->>DB_MEAS: Store processed values

    OB1->>ALM: Evaluate()
    ALM->>DB_SAF: Check trips
    ALM->>DB_DRV: Check drive faults
    ALM->>DB_MEAS: Check limits
    ALM->>DB_ALM: Update alarm list

    OB1->>IO: WriteOutputs()
    IO->>DB_IO: Read DO/AQ commands
    IO-->>OB1: Physical Q / AQ updated

    Note over OB1: === OB1 cyklus end ===

    participant OB35 as OB35 (10 ms interrupt)
    Note over OB35: Běží paralelně každých 10 ms

    OB35->>LPSU: UpdateSine(dt)
    LPSU->>DB_LPSU: Advance phase accumulator
    LPSU->>DB_IO: Update AQ3 sine output

    OB35->>RPM: UpdatePeriod()
    RPM->>DB_MEAS: High precision RPM calc
```

---

## Appendix 2 – Blok diagram (Mermaid)
<!-- filepath: README.md -->
<!-- ...existing code... -->

```mermaid
%%{init: {'flowchart': {'curve': 'step'}}}%%
flowchart LR

  subgraph OBs[Organizační bloky]
    OB1[OB1 - Main Cycle]
    OB35[OB35 - 10ms Interrupt]
  end

  subgraph IO_Layer[IO vrstva]
    FC_IOR[FC_IO_Map_Read]
    FC_IOW[FC_IO_Map_Write]
    DB_IO[(DB_IO)]
  end

  subgraph Control_Layer[Řízení]
    FB_SG[FB_SafetyGate]
    DB_SAF[(DB_Safety)]

    FB_DRV[FB_DriveCtrl]
    DB_DRV[(DB_Drive)]
  end

  subgraph Measurement_Layer[Měření]
    FB_TEMP[FB_Temp_PT1000]
    FB_RPM[FB_RPM_Meas]
    FB_VIB[FB_Vibration]
    DB_MEAS[(DB_Meas)]
  end

  subgraph Status_Layer[Status / HMI]
    DB_STATUS[(DB_Status)]
    HMI[HMI / Web page]
  end

  subgraph Diagnostics[Diagnostika]
    FB_ALM[FB_AlarmMgr]
    DB_ALM[(DB_Alarms)]
  end

  %% OB1 flow
  OB1 --> FC_IOR --> DB_IO

  OB1 --> FB_SG
  FB_SG --> DB_SAF
  FB_SG --> DB_IO

  OB1 --> FB_DRV
  FB_DRV --> DB_DRV
  FB_DRV --> DB_IO
  FB_DRV --> DB_SAF
  FB_DRV --> DB_STATUS

  OB1 --> FB_TEMP --> DB_MEAS
  OB1 --> FB_RPM  --> DB_MEAS
  OB1 --> FB_VIB  --> DB_MEAS

  OB1 --> FB_ALM
  FB_ALM --> DB_ALM
  FB_ALM --> DB_SAF
  FB_ALM --> DB_DRV
  FB_ALM --> DB_MEAS

  OB1 --> FC_IOW --> DB_IO

  %% HMI reads status
  DB_STATUS --> HMI
  DB_MEAS --> HMI
  DB_ALM --> HMI

  %% OB35 (time critical)
  OB35 --> FB_RPM
```