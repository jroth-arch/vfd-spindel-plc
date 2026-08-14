# Postup testu AUTO a STOP přes PLCSIM + WinCC

Tento postup ověřuje Screen 1, pulzy AUTO/STOP, safety podmínky, automatický start LabPSU, stav vřetena a final flush logu.
Test je určen pouze pro PLCSIM/laboratorní simulaci.

## 1. Co test ověřuje

### AUTO

- WinCC vyšle pulz `StartTest`.
- WinCC vyšle samostatný pulz `Spindle.Start`.
- PLC nastaví `TestActive := TRUE`.
- PLC automaticky povolí LabPSU.
- Vřeteno přejde do `RUN_CMD`, pokud je `PermitMotion = TRUE`.
- HMI zobrazí `TEST RUNNING`.

### STOP

- WinCC vyšle pulz `Spindle.Stop`.
- WinCC vyšle pulz `StopTest`.
- PLC ukončí `TestActive` a připraví final flush.
- Po dokončení flush se LabPSU vypne, rychlostní setpoint se vynuluje a logování se deaktivuje.
- HMI zobrazí `READY - LOG SAVED`, pokud byl flush úspěšný.

Důležitá vlastnost aktuálního programu: `StartTest` samo nespouští vřeteno. Pro AUTO test vřetena je nutný také `DB_HMI.Spindle.Start`.

## 2. Příprava PLCSIM a WinCC

1. Spusť PLCSIM a načti aktuální PLC program.
2. Ověř, že jsou OB1 a OB30 aktivní.
3. Spusť WinCC Runtime s obrazovkou S1.
4. Otevři Watch tables podle `watch_tables_auto_stop.md`.
5. Ověř, že online hodnoty nejsou stale a že PLC odpovídá aktuálnímu programu.
6. Pro tento test nepoužívej fyzické safety vstupy.

## 3. Nastavení počátečních podmínek

V `WT_00_SETUP_AUTO` nastav:

```text
"DB_Config".InputSim.EnableSafetyRelayAuxOverride := TRUE
"DB_Config".InputSim.SafetyRelayAuxOk := TRUE
"DB_Config".InputSim.EnableEmergencyStopOverride := TRUE
"DB_Config".InputSim.EmergencyStop := FALSE

"DB_Config".InputSim.EnableRPM_Sim := TRUE
"DB_Config".InputSim.SimRPM := 12000.0
"DB_Config".InputSim.EnableTempLozisko_Sim := TRUE
"DB_Config".InputSim.SimTempLozisko_C := 35.0
"DB_Config".InputSim.EnableTempKartace_Sim := TRUE
"DB_Config".InputSim.SimTempKartace_C := 40.0

"DB_LogConfig".Enable := TRUE
"DB_LogConfig".TestDuration_s := 3600
"DB_LogConfig".FlushEveryN := 5
"DB_LogConfig".FilePrefix := 'test_auto'

"DB_HMI".Spindle.Speed_RPM := 12000.0
"DB_HMI".LabPSU.ConstCurrent_A := 10.0
"DB_HMI".LabPSU.BaseVoltage_V := 2.0
"DB_HMI".LabPSU.DebugAmplitude_A := 5.0
"DB_HMI".LabPSU.DebugPeriod_min := 1.0

"DB_Config".TempHighLoziskoThreshold_C := 65.0
"DB_Config".TempHighKartaceThreshold_C := 65.0
```

Pulzní tagy před startem musí být `FALSE`:

```text
"DB_LogConfig".StartTest := FALSE
"DB_LogConfig".StopTest := FALSE
"DB_HMI".Spindle.Start := FALSE
"DB_HMI".Spindle.Stop := FALSE
"DB_HMI".Spindle.ResetFault := FALSE
```

`DB_HMI.LabPSU.Enable` před AUTO nemusíš nastavovat. Při náběhu `TestActive` ho nastavuje PLC a současně přepne `LabPSU.Mode` na `2` (`SINE_DEBUG`). Hodnota `DebugAmplitude_A` zadaná na HMI zůstává zachována a použije se pro sinusový proud.
V režimu `SINE_DEBUG` je `DebugAmplitude_A` maximum celého průběhu `0..A`; `CurrentOffset_A` se v tomto režimu nepoužívá.

Timer HMI se aktualizuje kazdou sekundu. Logovaci vzorek se nadale uklada priblizne kazdych 6 sekund, ale to uz neovlivnuje zobrazeny cas.

## 4. Preflight před AUTO

V `WT_01_PREFLIGHT_AUTO` musí platit:

```text
"DB_Status".Safety.SafetyOk = TRUE
"DB_Status".Safety.PermitMotion = TRUE
"DB_Status".Safety.TripActive = FALSE
"DB_Status".Safety.TripCode = 0

"DB_HMI".Sensors.TM_Rotation_A_Channel = přibližně 12000.0
"DB_HMI".Sensors.AI1_Teplota_Lozisko_C = 35.0
"DB_HMI".Sensors.AI2_Teplota_Kartace_C = 40.0
"DB_HMI".Spindle.Speed_RPM = 12000.0

"DB_LogRuntime".TestActive = FALSE
"DB_LogRuntime".StopSequenceActive = FALSE
"DB_LogRuntime".StartReqLatched = FALSE
"DB_LogRuntime".StopReqLatched = FALSE
```

Pokud není `PermitMotion = TRUE`, AUTO netestuj. Nejprve oprav safety simulaci.

## 5. Test AUTO z WinCC

### 5.1 Ověř eventy tlačítka

Tlačítko AUTO má mít v WinCC tyto eventy:

**Press:**

```text
"DB_LogConfig".StartTest := TRUE
"DB_HMI".Spindle.Start := TRUE
```

**Release:**

```text
"DB_LogConfig".StartTest := FALSE
"DB_HMI".Spindle.Start := FALSE
```

Stiskni AUTO krátce, přibližně 100 až 300 ms. Nedrž tlačítko ani pulzní tag trvale.

### 5.2 Ověř pulzy

V `WT_02_RUN_AUTO_STOP` sleduj:

```text
"DB_LogConfig".StartTest: FALSE -> TRUE -> FALSE
"DB_HMI".Spindle.Start: FALSE -> TRUE -> FALSE
```

PLC může hodnoty resetovat velmi rychle. Pokud krátký pulz v Watch table nevidíš, ověř výsledek v následujících stavech.

### 5.3 Ověř náběh testu

Po AUTO očekávej:

```text
"DB_LogRuntime".TestActive = TRUE
"DB_LogRuntime".FileName <> ''
"DB_HMI".LabPSU.Enable = TRUE
"DB_HMI".LabPSU.Mode = 2
"DB_Status".LabPSU.State = 2
"DB_Status".Spindel.RunLatched = TRUE
"DB_Status".Spindel.State = 1
"DB_Status".HMI_StatusText = 'TEST RUNNING'
"DB_Status".HMI_StatusColor = 1
```

### 5.4 Ověř výstupy a hodnoty

```text
"DB_IO".DQ.RunForwardCmd = TRUE
"DB_IO".AQ.SpeedVoltage > 0.0
"DB_IO".AQ.AQ2_VoltageCtrl_V > 0.0
"DB_IO".AQ.AQ3_OutputOff = 0.0
"DB_HMI".Sensors.TM_Rotation_A_Channel = přibližně 12000.0
```

U LabPSU může `CurrentSet_A` začínat od nuly, protože PLC při AUTO nastavuje amplitudu na nulu. Sleduj především `State`, `StatusText`, `Enable` a safety permit.

### 5.5 Ověř logování

Nech test běžet alespoň 35 sekund. Při `FlushEveryN = 5` a vzorku každých přibližně 6 sekund by měl proběhnout periodický flush.

Sleduj:

```text
"DB_LogRuntime".Elapsed_s
"DB_LogRuntime".ElapsedTime_HMI
"DB_LogRuntime".TimeDisplay_HMI
"DB_LogRuntime".SampleCounter
"DB_LogRuntime".HeaderWritten
"DB_LogRuntime".LastFlushOk
"DB_LogRuntime".FlushErrorCount
"DB_LogRuntime".LastError
"LogManager".FlushPending
"LogFlushToSd".Busy
"LogFlushToSd".CurrentStep
"LogFlushToSd".RowsFlushed
"LogFlushToSd".FileStatus
```

Očekávání:

- `SampleCounter` roste po přibližně 6 sekundách.
- `ElapsedTime_HMI` a `TimeDisplay_HMI` se mění každou sekundu.
- `HeaderWritten` po prvním úspěšném flush přejde na `TRUE`.
- `LastFlushOk` je `TRUE`.
- `FlushErrorCount` zůstává `0`.
- `LastError` neobsahuje novou chybu.
- `FileStatus` je `0` nebo úspěšný stav definovaný FileWriteC.
- při `DebugAmplitude_A = 5.0` se `DB_Status.LabPSU.CurrentSet_A` během periody pohybuje v rozsahu přibližně `0..5.0 A`;
- maximum ověř ve Watch table na `CurrentSet_A`, ne z hodnoty `AQ1_CurrentCtrl_V`, která je kalibrovaný napěťový řídicí signál.

## 6. Test STOP z WinCC

STOP testuj až po úspěšném AUTO.

### 6.1 Ověř eventy tlačítka

Tlačítko STOP má mít:

**Press:**

```text
"DB_HMI".Spindle.Stop := TRUE
"DB_LogConfig".StopTest := TRUE
```

**Release:**

```text
"DB_HMI".Spindle.Stop := FALSE
"DB_LogConfig".StopTest := FALSE
```

Stiskni STOP krátce, přibližně 100 až 300 ms.

### 6.2 Ověř začátek stop sekvence

Bezprostředně po pulzu očekávej:

```text
"DB_LogRuntime".StopSequenceActive = TRUE
"DB_LogRuntime".TestActive = FALSE
"DB_Status".Spindel.RunLatched = FALSE
"DB_IO".DQ.RunForwardCmd = FALSE
```

Některé hodnoty se mohou měnit v různých PLC cyklech. Rozhodující je, že stop sekvence pokračuje až do dokončení final flush.

### 6.3 Ověř dokončení final flush

Počkej, až se flush automat vrátí do klidového stavu. Potom očekávej:

```text
"DB_LogRuntime".StopSequenceActive = FALSE
"DB_HMI".LabPSU.Enable = FALSE
"DB_Status".LabPSU.State = 0
"DB_HMI".Spindle.Speed_RPM = 0.0
"DB_LogConfig".Enable = TRUE
"DB_LogRuntime".LastFlushOk = TRUE
"DB_LogRuntime".LastStopLogSaved = TRUE
"DB_Status".HMI_StatusText = 'READY - LOG SAVED'
```

Pokud flush selže:

```text
"DB_LogRuntime".LastFlushOk = FALSE
"DB_LogRuntime".LastStopLogSaved = FALSE
"DB_LogRuntime".FlushErrorCount > 0
"DB_LogRuntime".LastError <> ''
```

V takovém případě výsledek STOP není PASS, i když se vřeteno a LabPSU vypnuly.

## 7. Vyhodnocení AUTO

AUTO je `PASS`, pokud platí:

- oba pulzy byly vyslány a po zpracování se vrátily na `FALSE`;
- `TestActive = TRUE`;
- `Safety.PermitMotion = TRUE` a `TripActive = FALSE`;
- `LabPSU.Enable = TRUE` a `LabPSU.State = 2`;
- `Spindel.RunLatched = TRUE` a `Spindel.State = 1`;
- `FileName` není prázdný;
- HMI stav je `TEST RUNNING`;
- začnou růst `SampleCounter` a `Elapsed_s`.

## 8. Vyhodnocení STOP

STOP je `PASS`, pokud platí:

- oba stop pulzy byly zpracovány;
- `TestActive = FALSE`;
- `Spindel.RunLatched = FALSE`;
- `LabPSU.Enable = FALSE` a `LabPSU.State = 0`;
- `Speed_RPM = 0.0`;
- final flush dokončil bez chyby;
- `LastStopLogSaved = TRUE`;
- HMI stav je `READY - LOG SAVED`.

## 9. Diagnostika podle výsledku

### AUTO pulz se neobjeví

- Zkontroluj WinCC Press/Release eventy.
- Zkontroluj komunikaci WinCC-PLC.
- Zkontroluj, že tag není trvale `TRUE` z předchozího testu.

### Pulz proběhne, ale `TestActive` zůstane `FALSE`

- `DB_LogConfig.Enable` musí být `TRUE`.
- Ověř, že je nahraná aktuální verze `program.scl`.
- Ověř `StartReqLatched` a volání `LogManager` v OB30.

### `TestActive = TRUE`, ale LabPSU je OFF

- Ověř `DB_HMI.LabPSU.Enable`.
- Ověř `DB_Status.Safety.PermitMotion`.
- Ověř `DB_Status.LabPSU.StatusText`.
- LabPSU je aktivní pouze při `Enable AND TestActive AND PermitMotion`.

### `TestActive = TRUE`, ale vřeteno stojí

- `StartTest` sám vřeteno nespouští.
- Ověř samostatný pulz `DB_HMI.Spindle.Start`.
- Ověř `Speed_RPM > 0`.
- Ověř `PermitMotion`, `Spindel.TripActive` a `ExternalFault`.

### STOP skončí bez `LastStopLogSaved = TRUE`

- Ověř `LogFlushToSd.CurrentStep`, `Busy`, `FileStatus` a `LastError`.
- Ověř dostupnost SD/file systému v PLCSIM/WinCC simulaci.
- Počkej na dokončení final flush; neprováděj hned nový AUTO.

## 10. Volitelný safety trip test

Tento test dělej až po úspěšném AUTO a pouze v simulaci.

1. Během `TestActive = TRUE` nastav:
   ```text
   "DB_Config".InputSim.EmergencyStop := TRUE
   ```
2. Očekávej:
   ```text
   "DB_Status".Safety.PermitMotion = FALSE
   "DB_Status".Safety.TripActive = TRUE
   "DB_Status".Safety.TripCode = 1
   "DB_IO".DQ.RunForwardCmd = FALSE
   "DB_Status".HMI_StatusColor = 2
   ```
3. Vrať:
   ```text
   "DB_Config".InputSim.EmergencyStop := FALSE
   ```
4. Ověř, že nedošlo k automatickému restartu vřetena.
5. Pro další test nejdříve proveď standardní STOP a ověř final flush.

## 11. Opakovaný start

Po úspěšném STOP můžeš ověřit opakovatelnost:

1. `StopSequenceActive = FALSE`.
2. `LabPSU.State = 0`.
3. `LastStopLogSaved = TRUE`.
4. Znovu nastav potřebné setpointy.
5. Zopakuj preflight.
6. Pošli nový AUTO.
7. Ověř nový `FileName` a nový běh `SampleCounter`.

Timeout není v tomto postupu testován. Aktuální timeoutová část PLC programu je zakomentovaná a test se ukončuje manuálním STOP.

## 12. Záznam výsledku

| Test | Výsledek | Poznámka |
|---|---|---|
| Safety preflight | PASS / FAIL | |
| AUTO pulzy | PASS / FAIL | |
| `TestActive` | PASS / FAIL | |
| LabPSU po AUTO | PASS / FAIL | |
| Vřeteno po AUTO | PASS / FAIL | |
| Periodický flush | PASS / FAIL / N/A | |
| STOP pulzy | PASS / FAIL | |
| Final flush | PASS / FAIL | |
| LabPSU po STOP | PASS / FAIL | |
| `LastStopLogSaved` | PASS / FAIL | |
| Opakovaný start | PASS / FAIL / N/A | |
