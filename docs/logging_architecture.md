# Architektura logování testů (PLC)

## Cíl
- Umožnit dlouhodobé logování všech klíčových signálů a událostí během endurance/životnostních testů vřetene.
- Logovat na SD kartu PLC ve formátu CSV (trend + event log).
- Umožnit snadné stažení a analýzu dat bez TIA.

## Typy logů
- **Trend log**: periodický záznam všech měřených hodnot (čas, otáčky, teploty, proud, vibrace, stav, safety...)
- **Event log**: záznam pouze událostí (start, stop, trip, reset, timeout, chyba...) – v bufferech připraven, zápis na SD ve fázi 3

## Trend log – struktura CSV
| t_s | RPM | T_Lozisko | T_Uhliky | Vibrace | ProudUhliky | UjetaVzdalenost_km | State | RunLatched | TripActive | TripCode | SafetyText | TestActive | StopReason |
|-----|-----|-----------|----------|---------|-------------|--------------------|-------|------------|------------|----------|------------|------------|------------|
| 0.00 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | 1 | 0 |

- **t_s**: čas od startu testu v sekundách (Real, akumulovaný)
- **RPM**: skutečné otáčky vřetene (z TM_Counter)
- **T_Lozisko**: teplota ložiska (°C, z AI1_RTD)
- **T_Uhliky**: teplota uhlíků (°C) – zatím 0.0, TODO napojit senzor
- **Vibrace**: aktuální hodnota vibrací – zatím 0.0, TODO napojit senzor
- **ProudUhliky**: skutečný proud do uhlíků (A, přepočítán z AQ1_CurrentCtrl_V)
- **UjetaVzdalenost_km**: akumulovana vzdalenost po sberacim krouzku (km), pocitana z aktualnich RPM a `PrumerKrouzku_mm`
- **State**: stav vřetene (číselně, viz tabulka níže)
- **RunLatched**: 0/1 (vřeteno v chodu)
- **TripActive**: 0/1 (safety trip aktivní)
- **TripCode**: kód tripu (viz tabulka níže)
- **SafetyText**: textová diagnostika safety (String[40])
- **TestActive**: 1 = test běží, 0 = test byl zastaven
- **StopReason**: důvod zastavení (0=běží, 1=manual stop, 2=timeout, 3=trip/fault)

## Event log – struktura CSV
| t_s | EventCode | EventText | State | TripCode | SafetyText |
|-----|-----------|-----------|-------|----------|------------|
| ... | ... | ... | ... | ... | ... |

## Kódy stavů a událostí

### State (stav vřetene)
- 0 = STOPPED
- 1 = RUN_CMD
- 2 = STOPPING
- 3 = TRIP

### TripCode (safety)
- 0 = READY
- 1 = E-STOP ACTIVE
- 2 = SAFETY RELAY NOT OK
- 3 = EXTERNAL FAULT
- 4 = TEMP ALARM
- 5 = VIBRATION ALARM
- 6 = SYSTEM NOT ENABLED

### EventCode
- 100 = TEST_START
- 200 = TEST_STOP
- 300 = TRIP
- 400 = RESET
- 900 = TEST_END_TIMEOUT
- 999 = ERROR/FAULT

---

## Architektura volání (PLC)

```
OB30 (1000 ms) – TimeSensitive
  └── LogManager(...)     ← SampleEveryN_Cycles=6 → vzorkuje každých 6 s
        ├── plní DB_LogBuffer.TrendBuffer[WriteIdx]
        ├── posunuje TrendWriteIdx (kruhový buffer, 1000 prvků)
        ├── setuje FlushPending = TRUE po každých FlushEveryN vzorcích
        ├── resetuje FlushPending při přijetí AckFlush=TRUE
        └── po detekci hrany StartTest/StopTest resetuje DB_LogConfig.StartTest/StopTest

OB1 – Main
  └── IF LogManager.FlushPending
        → LogFlushToSd(...)    ← stavový automat FileWriteC s offset tracking
              ├── zapisuje dávku řádků z TrendBuffer na SD kartu (CSV)
              ├── po úspěchu setuje AckFlush=TRUE → LogManager resetuje FlushPending
              └── po chybě setuje Error, LastFlushOk=FALSE (RetryLimit pokusy)
  └── IF LogManager.EdgeStartDetected → AUTO START LabPSU (Mode=SINE_DEBUG)
```

---

## DB a UDT – skutečná implementace

### UDT_LogRecord (jeden trend vzorek)
```
t_s          : Real
RPM          : Real
T_Lozisko    : Real
T_Uhliky     : Real
Vibrace      : Real
ProudUhliky  : Real
UjetaVzdalenost_km : Real
State        : USInt
RunLatched   : Bool
TripActive   : Bool
TripCode     : USInt
SafetyText   : String[40]
TestActive   : Bool      // 1 = test běží, 0 = zastaven
StopReason   : USInt     // 0=běží, 1=manual stop, 2=timeout, 3=trip
```

### UDT_EventRecord
```
t_s          : Real
EventCode    : USInt
EventText    : String[32]
State        : USInt
TripCode     : USInt
SafetyText   : String[40]
```

### DB_LogConfig (NON_RETAIN – konfigurace)
| Pole            | Typ         | Default    | Popis                                          |
|-----------------|-------------|------------|------------------------------------------------|
| Enable          | Bool        | false      | Povolení logování                              |
| StartTest       | Bool        | false      | HMI/WebAPI trigger startu testu (hrana)        |
| StopTest        | Bool        | false      | HMI/WebAPI trigger stopu testu (hrana)         |
| TestDuration_s  | DInt        | 1814400    | Max. délka testu v sekundách (3 týdny = 21 dní)|
| FlushEveryN     | Int         | 5          | Počet vzorků mezi dávkovými zápisy (test: 5, prod: 100) |
| FilePrefix      | String[16]  | 'testlog'  | Rezervováno pro budoucí použití                |

### DB_LogRuntime (NON_RETAIN – stav za běhu)
| Pole              | Typ           | Popis                                              |
|-------------------|---------------|-----------------------------------------------------|
| TestActive        | Bool          | Test právě běží                                    |
| TestStartTs       | Date_And_Time | Čas startu testu                                   |
| Elapsed_s         | Real          | Čas od startu testu v sekundách                    |
| SampleCounter     | DInt          | Celkový počet zapsaných vzorků                     |
| LastFlushOk       | Bool          | Poslední flush proběhl bez chyby                   |
| LastError         | String[40]    | Diagnostický text poslední chyby                   |
| FileName          | String[32]    | Název aktivního log souboru (LOG_YYMMDD_HHMMSS.csv)|
| HeaderWritten     | Bool          | Hlavička CSV již zapsána do aktuálního souboru     |
| FlushErrorCount   | Int           | Celkový počet chyb flushe od startu testu          |
| ElapsedTime_HMI   | String[9]     | Formátovaný uplynulý čas „HHH:MM:SS" pro HMI      |
| TargetTime_HMI    | String[9]     | Formátovaný cílový čas „HHH:MM:SS"                |
| TimeDisplay_HMI   | String[21]    | Kombinovaný „HHH:MM:SS / HHH:MM:SS" (jedno pole)  |
| MaxTempLozisko_C  | Real          | Max. teplota ložiska od startu testu [°C]          |
| MaxTempUhliky_C   | Real          | Max. teplota uhlíků/kartáčů od startu testu [°C]  |

### DB_LogBuffer (NON_RETAIN – kruhové buffery)
| Pole           | Typ                              | Popis                        |
|----------------|----------------------------------|------------------------------|
| TrendBuffer    | Array[0..999] of UDT_LogRecord   | Kruhový trend buffer         |
| TrendWriteIdx  | Int                              | Zapisovací index (LogManager)|
| TrendReadIdx   | Int                              | Čtecí/flush index (FlushToSd)|
| EventBuffer    | Array[0..99] of UDT_EventRecord  | Event log buffer             |
| EventWriteIdx  | Int                              | Zapisovací index eventů      |
| EventReadIdx   | Int                              | Čtecí index eventů           |

---

## FB_LogManager – vzorkování (OB30)

**Instance DB:** `"LogManager"`

Klíčové parametry:
- `SampleEveryN_Cycles` (Int, default 6): počet cyklů OB30 mezi vzorky → 6×1000ms = **6 s**
- `FlushEveryN` (Int, default 5 testovací / 100 produkční): počet vzorků → flush každých 30 s (testovací)
- `TestDuration_s` (DInt, default 1814400 = 3 týdny): maximální délka testu (**timeout vypnut** – test běží do manuálního stopu)

Výstupy:
- `FlushPending` (Bool): setuje se, když flushCounter dosáhne FlushEveryN nebo při manuálním stopu
- `TestTimeoutReached` (Bool): test dosáhl TestDuration_s (logika zakomentována, timeout neaktivní)
- `CyclesProcessed` (DInt): diagnostika – počet zpracovaných cyklů OB30
- `LastFlushTrigger` (USInt): diagnostika – co spustilo flush (1=periodic, 2=manual stop, 3=timeout)
- `EdgeStartDetected` (Bool): diagnostika – detekována hrana StartTest
- `EdgeStopDetected` (Bool): diagnostika – detekována hrana StopTest

Handshake s FB_LogFlushToSd:
- `AckFlush` (Bool INPUT): příjem od LogFlushToSd → resetuje FlushPending na FALSE

---

## FB_LogFlushToSd – dávkový zápis na SD (OB1)

**Instance DB:** `"LogFlushToSd"`

Stavový automat (Step):
```
0  IDLE       → čekání na hranu FlushRequest
1  PREPARE    → výpočet dostupných řádků, snapshot ReadIdx
11 CREATE_DIR → FileWriteC 'UserFiles/.keepdir' (1 byte) – vytvoří složku; jen jednou (dirCreated=FALSE)
2  OPEN       → kontrola filePath, určení writeOffset; pokud !HeaderWritten → 3, jinak → 4
3  WR_HEADER  → FileWriteC: CSV hlavička + CRLF na aktuální offset; HeaderWritten := TRUE
4  WR_ROW     → FileWriteC: jeden CSV řádek + CRLF na aktuální offset (čeká DONE)
5  NEXT_ROW   → RowsDone++, RowIdx++; pokud RowsDone < RowsToFlush → 4, jinak → 6
6  CLOSE      → přechod do 7 (FileWriteC nepotřebuje explicitní close)
7  ACK        → posun TrendReadIdx, AckFlush=TRUE, LastFlushOk=TRUE, → IDLE
10 ERROR      → při 0x7001 a !dirCreated zkusí CREATE_DIR; jinak retry (max RetryLimit), pak Error=TRUE
```

> **Implementační poznámka:** Místo FileOpen/FileWrite/FileClose se používá `FileWriteC` s akumulovaným `fileOffset_Bytes`. Offset narůstá přes celý test – každý flush appenduje za předchozí data.

Vstup `FinalFlush = TRUE` (při manuálním stopu): zapisuje VŠECHNY dostupné řádky bez omezení MaxRowsPerFlush.

---

## FC_LogRecordToCsv – formátování CSV řádku

Pomocná funkce volaná z FB_LogFlushToSd.
Vstupy: `Rec : UDT_LogRecord`
Výstup: `String[254]` – jeden CSV řádek (CRLF přidává volající FB_LogFlushToSd)

## FC_SecondsToTimeString – formátování času pro HMI

Pomocná funkce pro zobrazení uplynulého/cílového času na HMI.
Vstupy: `seconds : Real`
Výstup: `String[9]` – formát `HHH:MM:SS` (max. 999:59:59)

---

## Souborová konvence na SD kartě

- **Cesta:** `UserFiles/<FileName>` (složka UserFiles na paměťové kartě)
- **Formát jména:** `LOG_YYMMDD_HHMMSS.csv` (generováno z `RD_SYS_T` při StartTest hraně)
- **Zápis:** `FileWriteC` s akumulovaným offsetem – bez FileOpen/FileClose
- **Strategie:** per každý flush: (header při prvním flushu?) → write batch; offset se akumuluje přes celý test
- **Automatické vytvoření složky:** Složka `UserFiles/` se vytvoří automaticky při prvním flushu pomocí pomocného souboru `.keepdir`

---

## Implementační stav

| Komponenta              | Stav            | Poznámka                                       |
|-------------------------|-----------------|------------------------------------------------|
| FB_LogManager              | ✅ hotovo  | SampleEveryN=6 (6s), FlushEveryN=5 (30s), HMI časy, MaxTemp, diagnostické výstupy |
| UDT_LogRecord/EventRecord  | ✅ hotovo  |                                                                                    |
| DB_LogConfig/Runtime/Buffer| ✅ hotovo  | DB_LogRuntime rozšířen o HMI časy (Elapsed/Target/TimeDisplay) a MaxTemp           |
| FC_SecondsToTimeString     | ✅ hotovo  | Formátování HHH:MM:SS pro HMI                                                      |
| FC_LogRecordToCsv          | ✅ hotovo  | (dříve FC_BuildCsvRow) – výstup String[254], CRLF přidává FlushToSd               |
| FB_LogFlushToSd            | ✅ hotovo  | FileWriteC + offset tracking, CREATE_DIR, retry                                    |
| Volání v OB30              | ✅ hotovo  | SampleEveryN=6, auto-reset StartTest/StopTest pulsů                                |
| Volání v OB1               | ✅ hotovo  | FlushToSd + AUTO START LabPSU při EdgeStartDetected                                |
| TestDuration timeout       | ⛔ vypnuto | Logika zakomentována – test běží do manuálního stopu                               |
| T_Uhliky senzor            | ⚠️ TODO   | Zatím 0.0 – napojit na skutečný senzor                                             |
| Vibrace senzor             | ⚠️ TODO   | Zatím 0.0 – napojit na skutečný senzor                                             |
| Event log zápis na SD      | 📋 fáze 3 | Buffer připraven, zápis zatím neimplementován                                      |
| WebAPI download logu       | 📋 fáze 3 | Viz technical_requirements.md TR-API-02/03                                         |

---

Tento dokument je referenční pro údržbu a rozšiřování logování endurance testů na PLC.