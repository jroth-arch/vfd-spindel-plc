# Watch tables pro test AUTO/STOP

Tento dokument připravuje Watch tables pro testování Screen 1 přes PLCSIM a WinCC.
Používej ho pouze pro laboratorní simulaci. Scope je AUTO/STOP, safety základ, LabPSU, vřeteno a logování.

## Pravidla práce

- `Monitor` používej pro hodnoty, které pouze sleduješ.
- `Modify` používej pro nastavení simulace, setpointů a krátkých povelů.
- `Force` nepoužívej pro pulzní tagy. Pulzní tag nesmí zůstat trvale na `TRUE`.
- Neměň stejný tag současně z Watch table a z WinCC.
- Po každém testu vrať simulační override před návratem k reálným vstupům na `FALSE`.
- V aktuálním PLC programu je vzorek logu přibližně každých 6 s (`OB30 = 1 s`, `SampleEveryN_Cycles = 6`).

## WT_00_SETUP_AUTO - počáteční podmínky

Tuto tabulku používej pro nastavení před testem. Po nastavení ji není nutné dál sledovat.

### Safety simulace - Modify

| Tag | Nastavení | Význam |
|---|---:|---|
| `"DB_Config".InputSim.EnableSafetyRelayAuxOverride` | `TRUE` | použít simulované safety relé |
| `"DB_Config".InputSim.SafetyRelayAuxOk` | `TRUE` | safety relé OK |
| `"DB_Config".InputSim.EnableEmergencyStopOverride` | `TRUE` | použít simulovaný E-Stop |
| `"DB_Config".InputSim.EmergencyStop` | `FALSE` | E-Stop uvolněn |

### Simulované vstupy - Modify

| Tag | Nastavení | Význam |
|---|---:|---|
| `"DB_Config".InputSim.EnableRPM_Sim` | `TRUE` | použít simulované RPM |
| `"DB_Config".InputSim.SimRPM` | `12000.0` | simulované měřené RPM |
| `"DB_Config".InputSim.EnableTempLozisko_Sim` | `TRUE` | použít simulovanou teplotu ložiska |
| `"DB_Config".InputSim.SimTempLozisko_C` | `35.0` | teplota ložiska |
| `"DB_Config".InputSim.EnableTempKartace_Sim` | `TRUE` | použít simulovanou teplotu kartáče |
| `"DB_Config".InputSim.SimTempKartace_C` | `40.0` | teplota kartáče |

### Konfigurace logu - Modify

| Tag | Nastavení | Význam |
|---|---:|---|
| `"DB_LogConfig".Enable` | `TRUE` | povolit logování |
| `"DB_LogConfig".TestDuration_s` | `3600` | testovací hodnota; timeout je aktuálně vypnutý |
| `"DB_LogConfig".FlushEveryN` | `5` | testovací flush po 5 vzorcích |
| `"DB_LogConfig".FilePrefix` | `test_auto` | dokumentační prefix |

### Setpointy a pulzy - Modify

| Tag | Nastavení | Poznámka |
|---|---:|---|
| `"DB_HMI".Spindle.Speed_RPM` | `12000.0` | požadovaný setpoint vřetena |
| `"DB_HMI".LabPSU.ConstCurrent_A` | `10.0` | používá se pouze v režimu CONST |
| `"DB_HMI".LabPSU.BaseVoltage_V` | `2.0` | základní napětí |
| `"DB_HMI".LabPSU.DebugAmplitude_A` | `5.0` | maximum celého průběhu `0..A` v SINE_DEBUG |
| `"DB_HMI".LabPSU.DebugPeriod_min` | `1.0` | perioda SINE_DEBUG |
| `"DB_Config".TempHighLoziskoThreshold_C` | `65.0` | limit ložiska |
| `"DB_Config".TempHighKartaceThreshold_C` | `65.0` | limit kartáče |
| `"DB_LogConfig".StartTest` | `FALSE` | před startem musí být FALSE |
| `"DB_LogConfig".StopTest` | `FALSE` | před startem musí být FALSE |
| `"DB_HMI".Spindle.Start` | `FALSE` | před startem musí být FALSE |
| `"DB_HMI".Spindle.Stop` | `FALSE` | před startem musí být FALSE |
| `"DB_HMI".Spindle.ResetFault` | `FALSE` | před startem musí být FALSE |

Poznámka: `"DB_HMI".LabPSU.Enable` před AUTO nenastavuj jako autoritativní podmínku. Při náběhu `TestActive` ho PLC nastaví na `TRUE` a nastaví `Mode := 2` (`SINE_DEBUG`).

## WT_01_PREFLIGHT_AUTO - kontrola připravenosti

Tuto tabulku otevři před stiskem AUTO. Všechny položky jsou `Monitor`.

### Safety

| Tag | Očekávání |
|---|---|
| `"DB_Status".Safety.SafetyOk` | `TRUE` |
| `"DB_Status".Safety.PermitMotion` | `TRUE` |
| `"DB_Status".Safety.TripActive` | `FALSE` |
| `"DB_Status".Safety.TripCode` | `0` |
| `"DB_Status".Safety.StatusText` | stav bez chyby |
| `"DB_IO".DI.SafetyRelayAuxOk` | `TRUE` |
| `"DB_IO".DI.EmergencyStop` | `FALSE` |
| `"DB_IO".DI.ExternalFault` | `FALSE` |

### Vstupy po konverzi

| Tag | Očekávání |
|---|---:|
| `"DB_HMI".Sensors.TM_Rotation_A_Channel` | přibližně `12000.0` |
| `"DB_HMI".Sensors.AI1_Teplota_Lozisko_C` | `35.0` |
| `"DB_HMI".Sensors.AI2_Teplota_Kartace_C` | `40.0` |
| `"DB_HMI".Spindle.Speed_RPM` | `12000.0` |

### Stav před startem

| Tag | Očekávání |
|---|---|
| `"DB_LogRuntime".TestActive` | `FALSE` |
| `"DB_LogRuntime".StartReqLatched` | `FALSE` |
| `"DB_LogRuntime".StopReqLatched` | `FALSE` |
| `"DB_LogRuntime".StopSequenceActive` | `FALSE` |
| `"DB_HMI".LabPSU.Enable` | `FALSE` po předchozím dokončeném STOP |
| `"DB_Status".LabPSU.State` | `0` |
| `"DB_Status".Spindel.RunLatched` | `FALSE` |
| `"DB_Status".Spindel.State` | `0` |

Pokud `StopSequenceActive` zůstává `TRUE`, před novým testem dokonči předchozí final flush. Nezačínej další AUTO přes rozpracovanou stop sekvenci.

## WT_02_RUN_AUTO_STOP - běh a zastavení

Tuto tabulku sleduj během testu. Pulzní tagy pouze monitoruj; povel vyvolej z WinCC nebo krátkým `Modify`.

### Povely a zpracování hrany

| Tag | Při AUTO | Po zpracování |
|---|---|---|
| `"DB_LogConfig".StartTest` | krátce `TRUE` | PLC vrátí `FALSE` |
| `"DB_HMI".Spindle.Start` | krátce `TRUE` | OB1 vrátí `FALSE` |
| `"DB_LogRuntime".StartReqLatched` | krátce `TRUE` | po hraně `FALSE` |
| `"DB_LogConfig".StopTest` | krátce `TRUE` při STOP | PLC vrátí `FALSE` |
| `"DB_HMI".Spindle.Stop` | krátce `TRUE` při STOP | OB1 vrátí `FALSE` |

### Hlavní stav testu

| Tag | Po úspěšném AUTO |
|---|---|
| `"DB_LogRuntime".TestActive` | `TRUE` |
| `"DB_LogRuntime".FileName` | neprázdný text |
| `"DB_HMI".LabPSU.Enable` | `TRUE` |
| `"DB_HMI".LabPSU.Mode` | `2` |
| `"DB_Status".LabPSU.State` | `2` |
| `"DB_Status".Spindel.RunLatched` | `TRUE` |
| `"DB_Status".Spindel.State` | `1` |
| `"DB_Status".HMI_StatusText` | `TEST RUNNING` |
| `"DB_Status".HMI_StatusColor` | `1` |

### Log a flush

| Tag | Účel |
|---|---|
| `"DB_LogRuntime".Elapsed_s` | interní sekundy, roste po vzorcích |
| `"DB_LogRuntime".ElapsedTime_HMI` | HMI text `HHH:MM:SS` |
| `"DB_LogRuntime".TimeDisplay_HMI` | HMI text elapsed/target |
| `"DB_LogRuntime".OB30_AverageCycleTime_ms` | průměr OB30 v ms |
| `"DB_LogRuntime".OB30_CycleTimeOutOfRange` | TRUE mimo 950-1050 ms |
| `"DB_LogRuntime".SampleCounter` | počet vzorků |
| `"DB_LogRuntime".HeaderWritten` | hlavička CSV |
| `"DB_LogRuntime".LastFlushOk` | výsledek posledního flush |
| `"DB_LogRuntime".FlushErrorCount` | počet chyb |
| `"DB_LogRuntime".LastError` | poslední chyba |
| `"LogManager".FlushPending` | žádost o flush |
| `"LogFlushToSd".Busy` | flush probíhá |
| `"LogFlushToSd".CurrentStep` | stavový automat |
| `"LogFlushToSd".RowsFlushed` | počet řádků posledního flush |
| `"LogFlushToSd".FileStatus` | `0` = OK |
| `"DB_LogBuffer".TrendWriteIdx` | index zápisu |
| `"DB_LogBuffer".TrendReadIdx` | index čtení/flush |

### Výstupy

| Tag | Očekávání po AUTO |
|---|---|
| `"DB_IO".DQ.RunForwardCmd` | `TRUE` |
| `"DB_IO".AQ.SpeedVoltage` | `> 0.0` |
| `"DB_IO".AQ.AQ1_CurrentCtrl_V` | dle nastavení LabPSU |
| `"DB_IO".AQ.AQ2_VoltageCtrl_V` | `> 0.0` |
| `"DB_IO".AQ.AQ3_OutputOff` | `0.0` při povoleném výstupu |

### Očekávání po STOP

| Tag | Očekávání po final flush |
|---|---|
| `"DB_LogRuntime".TestActive` | `FALSE` |
| `"DB_LogRuntime".StopSequenceActive` | `FALSE` |
| `"DB_HMI".LabPSU.Enable` | `FALSE` |
| `"DB_Status".LabPSU.State` | `0` |
| `"DB_HMI".Spindle.Speed_RPM` | `0.0` |
| `"DB_LogConfig".Enable` | `TRUE` pro další AUTO |
| `"DB_LogRuntime".LastStopLogSaved` | `TRUE` při úspěšném flush |
| `"DB_LogRuntime".LastFlushOk` | `TRUE` |
| `"DB_Status".HMI_StatusText` | `READY - LOG SAVED` |

## WT_03_DIAGNOSTICS - volitelná tabulka

Použij ji, pokud AUTO nebo STOP neprojde očekávaným řetězcem.

| Oblast | Tagy |
|---|---|
| Safety | `"DB_Status".Safety.SafetyOk`, `"DB_Status".Safety.PermitMotion`, `"DB_Status".Safety.TripActive`, `"DB_Status".Safety.TripCode`, `"DB_Status".Safety.StatusText` |
| Simulace | `"DB_Config".InputSim.EnableSafetyRelayAuxOverride`, `"DB_Config".InputSim.SafetyRelayAuxOk`, `"DB_Config".InputSim.EnableEmergencyStopOverride`, `"DB_Config".InputSim.EmergencyStop`, `"DB_Config".InputSim.EnableRPM_Sim`, `"DB_Config".InputSim.SimRPM` |
| Alarmy | `"DB_Alarms".TempAlarm`, `"DB_Alarms".VibCritical` |
| Spindle | `"DB_Status".Spindel.TripActive`, `"DB_Status".Spindel.StatusText`, `"DB_IO".DQ.RunForwardCmd`, `"DB_IO".AQ.SpeedVoltage` |
| LabPSU | `"DB_Status".LabPSU.State`, `"DB_Status".LabPSU.StatusText`, `"DB_Status".LabPSU.CurrentSet_A`, `"DB_Status".LabPSU.VoltageSet_V`, `"DB_HMI".LabPSU.CurrentLimitExceeded` |

## Rychlý seznam tabulek

| Tabulka | Kdy ji použít |
|---|---|
| `WT_00_SETUP_AUTO` | nastavit předpoklady |
| `WT_01_PREFLIGHT_AUTO` | ověřit připravenost před AUTO |
| `WT_02_RUN_AUTO_STOP` | sledovat AUTO, běh, STOP a final flush |
| `WT_03_DIAGNOSTICS` | hledat příčinu při odchylce |
