# Architektura logování testů (PLC)

## Cíl
- Umožnit dlouhodobé logování všech klíčových signálů a událostí během endurance/životnostních testů vřetene.
- Logovat na SD kartu PLC ve formátu CSV (trend + event log).
- Umožnit snadné stažení a analýzu dat bez TIA.

## Typy logů
- **Trend log**: periodický záznam všech měřených hodnot (čas, otáčky, teploty, proud, vibrace, stav, safety...)
- **Event log**: záznam pouze událostí (start, stop, trip, reset, timeout, chyba...)

## Trend log – struktura CSV
| t_s | RPM | T_Lozisko | T_Uhliky | Vibrace | ProudUhliky | State | RunLatched | TripActive | TripCode | SafetyText |
|-----|-----|-----------|----------|---------|-------------|-------|------------|------------|----------|------------|
| 0.00 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

- **t_s**: čas od startu testu v sekundách (float, 0.00 ...)
- **RPM**: skutečné otáčky vřetene
- **T_Lozisko**: teplota ložiska (°C)
- **T_Uhliky**: teplota uhlíků (°C)
- **Vibrace**: aktuální hodnota vibrací (engineering units)
- **ProudUhliky**: skutečný proud do uhlíků (A)
- **State**: stav vřetene (číselně, viz tabulka níže)
- **RunLatched**: 0/1 (běží/ne)
- **TripActive**: 0/1 (safety trip aktivní)
- **TripCode**: kód tripu (viz tabulka níže)
- **SafetyText**: textová diagnostika safety

## Event log – struktura CSV
| t_s | EventCode | EventText | State | TripCode | SafetyText |
|-----|-----------|-----------|-------|----------|------------|
| ... | ... | ... | ... | ... | ... |

- **EventCode**: číselný kód události (viz tabulka níže)
- **EventText**: popis události (start, stop, trip, reset, timeout, ...)

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

## DB a UDT návrh

- `UDT_LogRecord` (trend):
  - t_s: Real
  - RPM: Real
  - T_Lozisko: Real
  - T_Uhliky: Real
  - Vibrace: Real
  - ProudUhliky: Real
  - State: USInt
  - RunLatched: Bool
  - TripActive: Bool
  - TripCode: USInt
  - SafetyText: String[40]

- `UDT_EventRecord`:
  - t_s: Real
  - EventCode: USInt
  - EventText: String[32]
  - State: USInt
  - TripCode: USInt
  - SafetyText: String[40]

- `DB_LogConfig`:
  - Enable: Bool
  - SampleTime_ms: Int
  - TestDuration_s: DInt
  - FlushEveryN: Int
  - FilePrefix: String[16]

- `DB_LogRuntime`:
  - TestActive: Bool
  - TestStartTs: Date_And_Time
  - Elapsed_s: Real
  - SampleCounter: DInt
  - LastFlushOk: Bool
  - LastError: String[40]

- `DB_LogBuffer`:
  - TrendBuffer: Array[0..999] of UDT_LogRecord
  - EventBuffer: Array[0..99] of UDT_EventRecord
  - WriteIdx, ReadIdx, ...

## Implementační poznámky
- Vzorkovat v OB35 (nebo vlastním cyklickém FB)
- Zápis na SD dávkově (FileOpen, FileWrite, FileClose)
- Po testu nebo při timeoutu vygenerovat event TEST_END_TIMEOUT
- Po naplnění bufferu flush do souboru, rotace souborů podle času/velikosti
- CSV hlavička vždy na začátku souboru
- LogVersion v prvním řádku (pro budoucí kompatibilitu)

## Další rozšíření
- Možnost logovat i další signály (napětí, proudy, teploty, ...)
- Možnost logovat i ručně zadané poznámky/eventy
- Automatické stažení logu přes web rozhraní

---

Tento dokument je referenční pro údržbu a rozšiřování logování endurance testů na PLC.