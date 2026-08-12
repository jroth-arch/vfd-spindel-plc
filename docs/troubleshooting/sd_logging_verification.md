# Plán: Ověřovací test SD logování (spindle-vfd-control)

## TL;DR
Ověřit end-to-end fungování CSV logování na SD kartu PLC bez fyzického vřetene – pomocí Simulation Mode (SimRPM=12000) a SafetyRelayAuxOverride. Test trvá ~2 minuty, sleduje se Watch Table a výsledný CSV soubor na SD kartě.

## Fáze 1 – Příprava PLC (před testem)

1. **Ověřit, že aktuální `program.scl` je nahraný v PLC**
   - Připojit TIA Portal k PLC (IP: 192.168.3.30, user: admin / Admin@12345)
   - Porovnat verzi (Online vs. offline) – nebo compile + download pokud nesedí

2. **Nastavit Watch Table** (TIA Portal → Watch and Force tables → nová tabulka) s těmito tagy:

   | Tag | Poznámka |
   |-----|---------|
   | `"DB_LogConfig".Enable` | musí být TRUE |
   | `"DB_LogConfig".FlushEveryN` | ověřit = 5 |
   | `"DB_LogRuntime".TestActive` | sledovat start |
   | `"DB_LogRuntime".Elapsed_s` | narůstá po 6s |
   | `"DB_LogRuntime".OB30_CycleTime_ms` | ≈ 1000 |
   | `"DB_LogRuntime".OB30_CycleCounter` | narůstá každou 1s |
   | `"DB_LogRuntime".SampleCounter` | narůstá každých 6s |
   | `"DB_LogRuntime".HeaderWritten` | TRUE po 1. flushu |
   | `"DB_LogRuntime".LastFlushOk` | musí být TRUE |
   | `"DB_LogRuntime".FlushErrorCount` | musí být 0 |
   | `"DB_LogRuntime".FileName` | vygenerovaný název souboru |
   | `"LogManager".FlushPending` | cykluje TRUE→FALSE každých ~30s |
   | `"LogFlushToSd".AckFlush` | pulzuje TRUE po každém flushu |
   | `"LogFlushToSd".RowsFlushed` | narůstá po každém flushu (+5) |
   | `"LogFlushToSd".CurrentStep` | sledovat stavový automat (0=IDLE) |
   | `"LogFlushToSd".FileStatus` | 0x0000 = OK |
   | `"DB_Config".InputSim.EnableRPM_Sim` | nastavit TRUE |
   | `"DB_Config".InputSim.SimRPM` | nastavit 12000.0 |

## Fáze 2 – Spuštění testu (Watch Table write nebo Web API)

3. **Aktivovat Simulation Mode:**
   ```
   DB_Config.InputSim.EnableSafetyRelayAuxOverride = true
   DB_Config.InputSim.SafetyRelayAuxOk = true
   DB_Config.InputSim.EnableEmergencyStopOverride = true
   DB_Config.InputSim.EmergencyStop = false
   DB_Config.InputSim.EnableRPM_Sim = true
   DB_Config.InputSim.SimRPM = 12000.0
   ```
   > ⚠️ Bez `EnableEmergencyStopOverride` čte PLC fyzické DI1 – bez HW vrátí `NOT 0V = TRUE` → okamžitý trip.

4. *(Volitelné)* **Spustit vřeteno** (pokud je k dispozici HW / pro SAT-01):
   ```
   DB_HMI.Spindle.Stop = true → false (reset)
   DB_HMI.Spindle.Speed_RPM = 12000.0
   DB_HMI.Spindle.Start = true
   ```
   > Logování **nevyžaduje běžící vřeteno** – `SimRPM` se zapisuje přímo do `DB_HMI.Sensors.TM_Rotation_A_Channel` (FC_ConvertIO), odkud LogManager čte RPM. FB_Spindel tento tag neovlivňuje.

5. **Spustit logování** (hrana):
   ```
   DB_LogConfig.Enable = true  (pokud ještě ne)
   DB_LogConfig.StartTest = true
   ```
   OB30 auto-resetuje `StartTest` na FALSE po detekci hrany.

## Fáze 3 – Sledování (Watch Table monitoring, ~2 minuty)

6. **Ihned po startu (~0–10s) ověřit:**
   - `DB_LogRuntime.TestActive == TRUE`
   - `DB_LogRuntime.FileName` = neprázdný string (např. `LOG_260812_143022.csv`)
   - `OB30_CycleTime_ms` ≈ 1000 (po 2. cyklu; první cyklus = 0 je normální)

7. **Po 30s – první flush:**
   - `LogManager.FlushPending` přešel TRUE → FALSE
   - `DB_LogRuntime.HeaderWritten == TRUE`
   - `DB_LogRuntime.LastFlushOk == TRUE`
   - `LogFlushToSd.RowsFlushed == 5`
   - `DB_LogRuntime.FlushErrorCount == 0`
   - `LogFlushToSd.CurrentStep == 0` (vrátil se do STEP_IDLE)

8. **Po 60s – druhý flush:**
   - `LogFlushToSd.RowsFlushed == 5` (refresh po 2. flushu)
   - `DB_LogRuntime.Elapsed_s ≈ 60.0`

9. **Po 2 min – manuální stop:**
   ```
   DB_LogConfig.StopTest = true
   ```
   Ověřit: `DB_LogRuntime.TestActive == FALSE`, finální flush proběhl (`LastFlushOk == TRUE`)

## Fáze 4 – Ověření CSV souboru na SD kartě

10. **Stáhnout CSV soubor z PLC** přes TIA Portal file browser nebo Python script:
    - Cesta na SD kartě: `UserFiles/LOG_YYMMDD_HHMMSS.csv`
    - Python script: `html/cli_deploy_tool.py`

11. **Ověřit obsah CSV:**
    - 1. řádek = hlavička: `t_s,RPM,T_Lozisko,T_Uhliky,Vibrace,ProudUhliky,State,RunLatched,TripActive,TripCode,SafetyText,TestActive,StopReason`
    - Minimálně 20 datových řádků (2 min / 6s = ~20 vzorků)
    - `RPM` sloupec ≈ 12000 (z SimRPM)
    - `t_s` sloupec narůstá po 6.0 sekundách
    - `TestActive` = 1 v datových řádcích, poslední řádek má `StopReason` = 1

## Verifikační kritéria (pass/fail)

| Kritérium | Očekávaná hodnota | Závažnost |
|-----------|------------------|-----------|
| `DB_LogRuntime.TestActive` po StartTest | TRUE | BLOCKER |
| `DB_LogRuntime.FileName` | neprázdný string | BLOCKER |
| `OB30_CycleTime_ms` | 900–1100 ms | WARNING |
| `LogManager.FlushPending` cyklus | TRUE→FALSE každých ~30s | BLOCKER |
| `DB_LogRuntime.LastFlushOk` | TRUE | BLOCKER |
| `DB_LogRuntime.FlushErrorCount` | 0 | BLOCKER |
| `LogFlushToSd.FileStatus` | 0x0000 | BLOCKER |
| CSV soubor existuje na SD | `UserFiles/*.csv` | BLOCKER |
| CSV počet řádků po 2 min | ≥ 20 datových řádků | BLOCKER |
| CSV RPM hodnota | ≈ 12000 (sim) | VERIFY |

## Relevantní soubory

- [../../plc/program.scl](../../plc/program.scl) – klíčové bloky:
  - `FB_LogManager` (řádky ~56–280) – vzorkování, FlushPending
  - `FB_LogFlushToSd` (řádky ~1367–1695) – stavový automat zápisu na SD
  - `OB30` (řádky ~1704–1800) – volání LogManager + OB30 timing
  - `OB1` (řádky ~1800+) – volání LogFlushToSd
  - `DB_LogConfig` (řádky ~382–400) – konfigurace, FlushEveryN=5
  - `DB_LogRuntime` (řádky ~401–450) – runtime stav + OB30_* pole
- [../logging_diagnostic_guide.md](../logging_diagnostic_guide.md) – diagram toku dat a stavový automat
- [../logging_architecture.md](../logging_architecture.md) – struktura CSV, kódy stavů

## Potenciální problémy

| Příznak | Možná příčina | Řešení |
|---------|--------------|--------|
| `FileStatus ≠ 0x0000`, `FlushErrorCount > 0` | SD karta chybí nebo není FAT32 | Zkontrolovat fyzicky, naformátovat jako FAT32 |
| `CurrentStep` uvízne v CREATE_DIR (krok 3) | Složka `UserFiles` nejde vytvořit | Zkontrolovat oprávnění SD karty; restart PLC |
| `OB30_CycleTime_ms == 0` po startu | První cyklus (OB30_LastTs.NANOSECOND = 0) | Normální, zmizí po 2. cyklu OB30 |
| `FlushPending` zůstane TRUE trvale | AckFlush handshake selhal | Zkontrolovat `LogFlushToSd.Step` – uvízl ve STEP_ERROR? |
| `RowsFlushed` se nezvyšuje | Buffer prázdný (vzorek se nezapisuje) | Ověřit `TestActive`, `SampleCounter`, `SampleEveryN_Cycles=6` |

## Poznámky ke scope

- Test probíhá **bez fyzického vřetene** – Simulation Mode (SimRPM, SafetyRelayAuxOverride)
- `FlushEveryN=5` (30s interval) – vhodné pro testování; pro produkci změnit na 100
- `SampleEveryN_Cycles=6` je hardcoded v OB30 volání `LogManager`
