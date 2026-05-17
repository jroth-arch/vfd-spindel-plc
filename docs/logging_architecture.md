# Architektura logování testů (PLC)

## Cíl
- Umožnit dlouhodobé logování všech klíčových signálů a událostí během endurance/životnostních testů vřetene.
- Logovat na SD kartu PLC ve formátu CSV (trend + event log).
- Umožnit snadné stažení a analýzu dat bez TIA.

## Typy logů
- **Trend log**: periodický záznam všech měřených hodnot (čas, otáčky, teploty, proud, vibrace, stav, safety...)
- **Event log**: záznam pouze událostí (start, stop, trip, reset, timeout, chyba...) – v bufferech připraven, zápis na SD ve fázi 3

## Trend log – struktura CSV
| t_s | RPM | T_Lozisko | T_Uhliky | Vibrace | ProudUhliky | State | RunLatched | TripActive | TripCode | SafetyText |
|-----|-----|-----------|----------|---------|-------------|-------|------------|------------|----------|------------|
| 0.00 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

- **t_s**: čas od startu testu v sekundách (Real, akumulovaný)
- **RPM**: skutečné otáčky vřetene (z TM_Counter)
- **T_Lozisko**: teplota ložiska (°C, z AI1_RTD)
- **T_Uhliky**: teplota uhlíků (°C) – zatím 0.0, TODO napojit senzor
- **Vibrace**: aktuální hodnota vibrací – zatím 0.0, TODO napojit senzor
- **ProudUhliky**: skutečný proud do uhlíků (A, přepočítán z AQ1_CurrentCtrl_V)
- **State**: stav vřetene (číselně, viz tabulka níže)
- **RunLatched**: 0/1 (vřeteno v chodu)
- **TripActive**: 0/1 (safety trip aktivní)
- **TripCode**: kód tripu (viz tabulka níže)
- **SafetyText**: textová diagnostika safety (String[40])

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
OB30 (100 ms) – TimeSensitive
  └── LogManager(...)     ← SampleEveryN_Cycles=2 → vzorkuje každých 200 ms
        ├── plní DB_LogBuffer.TrendBuffer[WriteIdx]
        ├── posunuje TrendWriteIdx (kruhový buffer, 1000 prvků)
        ├── setuje FlushPending = TRUE po každých FlushEveryN vzorcích
        └── resetuje FlushPending při přijetí AckFlush=TRUE

OB1 – Main
  └── IF LogManager.FlushPending OR LogManager.FinalFlush
        → LogFlushToSd(...)    ← stavový automat open/write/close
              ├── zapisuje dávku řádků z TrendBuffer na SD kartu (CSV)
              ├── po úspěchu setuje AckFlush=TRUE → LogManager resetuje FlushPending
              └── po chybě setuje Error, LastFlushOk=FALSE (RetryLimit pokusy)
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
State        : USInt
RunLatched   : Bool
TripActive   : Bool
TripCode     : USInt
SafetyText   : String[40]
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
| SampleTime_ms   | Int         | 200        | Informativní (nepoužívá FB; řídí SampleEveryN) |
| TestDuration_s  | DInt        | 86400      | Max. délka testu v sekundách                   |
| FlushEveryN     | Int         | 100        | Počet vzorků mezi dávkovými zápisy             |
| FilePrefix      | String[16]  | 'testlog'  | Rezervováno pro budoucí použití                |

### DB_LogRuntime (NON_RETAIN – stav za běhu)
| Pole              | Typ         | Popis                                          |
|-------------------|-------------|------------------------------------------------|
| TestActive        | Bool        | Test právě běží                                |
| TestStartTs       | Date_And_Time | Čas startu testu                             |
| Elapsed_s         | Real        | Čas od startu testu v sekundách                |
| SampleCounter     | DInt        | Celkový počet zapsaných vzorků                 |
| LastFlushOk       | Bool        | Poslední flush proběhl bez chyby               |
| LastError         | String[40]  | Diagnostický text poslední chyby               |
| FileName          | String[32]  | Název aktivního log souboru (YYYYMMDD-HHMMSS.csv) |
| HeaderWritten     | Bool        | Hlavička CSV již zapsána do aktuálního souboru |
| FlushErrorCount   | Int         | Celkový počet chyb flushe od startu testu      |

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
- `SampleEveryN_Cycles` (Int, default 2): počet cyklů OB30 mezi vzorky → 2×100ms = 200ms
- `FlushEveryN` (Int, default 100): každých 100 vzorků → trigger flushe každých 20 s
- `TestDuration_s` (DInt, default 86400 = 24 hod): maximální délka testu

Výstupy:
- `FlushPending` (Bool): setuje se, když flushCounter dosáhne FlushEveryN nebo při ukončení testu
- `TestTimeoutReached` (Bool): test dosáhl TestDuration_s

Handshake s FB_LogFlushToSd:
- `AckFlush` (Bool INPUT): příjem od LogFlushToSd → resetuje FlushPending na FALSE

---

## FB_LogFlushToSd – dávkový zápis na SD (OB1)

**Instance DB:** `"LogFlushToSd"`

Stavový automat (Step):
```
0 IDLE      → čekání na hranu FlushRequest
1 PREPARE   → výpočet dostupných řádků, snapshot ReadIdx
2 OPEN      → FileOpen (APP mode – vytvoří nebo appenduje)
3 WR_HEADER → zapsat CSV hlavičku (jen pokud HeaderWritten = FALSE)
4 WR_ROW    → FileWrite jednoho řádku (čeká DONE)
5 NEXT_ROW  → posun indexu; pokud RowsDone < RowsToFlush → zpět na 4, jinak → 6
6 CLOSE     → FileClose
7 ACK       → posun TrendReadIdx, AckFlush=TRUE na jeden cyklus, → IDLE
10 ERROR    → retry (max RetryLimit), pak Error=TRUE
```

Vstup `FinalFlush = TRUE` (při stopu/timeoutu): zapisuje VŠECHNY dostupné řádky bez omezení MaxRowsPerFlush.

---

## FC_BuildCsvRow – formátování CSV řádku

Pomocná funkce volaná z FB_LogFlushToSd.
Vstupy: UDT_LogRecord
Výstup: String[250] – jeden CSV řádek zakončený CRLF

---

## Souborová konvence na SD kartě

- **Cesta:** `/<FileName>` (root paměťové karty)
- **Formát jména:** `YYYYMMDD-HHMMSS.csv` (z doby startu testu, RD_SYS_T při StartTest hraně)
- **Otevírání:** `APP` mode – jeden soubor per test, každý flush appenduje
- **Strategie:** open → (header?) → write batch → close – per každý flush

---

## Implementační stav

| Komponenta              | Stav            | Poznámka                                       |
|-------------------------|-----------------|------------------------------------------------|
| FB_LogManager           | ✅ hotovo       | Vzorkování, FlushPending, AckFlush handshake   |
| UDT_LogRecord/EventRecord | ✅ hotovo     |                                                |
| DB_LogConfig/Runtime/Buffer | ✅ hotovo   |                                                |
| Volání v OB30           | ✅ hotovo       | SampleEveryN=2, signály napojeny               |
| FC_BuildCsvRow          | ✅ hotovo       | CRLF na konci každého řádku                    |
| FB_LogFlushToSd         | ✅ hotovo       | Stavový automat, retry, AckFlush               |
| Volání v OB1            | ✅ hotovo       | Nahradilo TODO blok z fáze 1                   |
| T_Uhliky senzor         | ⚠️ TODO        | Zatím 0.0 – napojit na skutečný senzor         |
| Vibrace senzor          | ⚠️ TODO        | Zatím 0.0 – napojit na skutečný senzor         |
| Event log zápis na SD   | 📋 fáze 3      | Buffer připraven, zápis zatím neimplementován  |
| WebAPI download logu    | 📋 fáze 3      | Viz technical_requirements.md TR-API-02/03     |

---

Tento dokument je referenční pro údržbu a rozšiřování logování endurance testů na PLC.