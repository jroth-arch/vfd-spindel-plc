# HMI Tagy - Kompletní přehled pro provoz u zákazníka

Tento dokument obsahuje všechny HMI tagy pro řízení a monitoring testovacího standu vřetena.

## 1) Tabulka zápisu z HMI (řízení)

| Oblast | Tag | Typ | Rozsah/Hodnoty | Jak zapisovat | Poznámka |
|---|---|---|---|---|---|
| **LOGGING** | | | | | |
| Logging | `"DB_LogConfig".Enable` | Bool | TRUE/FALSE | Latch | Globální povolení logování |
| Logging | `"DB_LogConfig".StartTest` | Bool | TRUE/FALSE | **Pulse** | Spuštění testu (hrana) |
| Logging | `"DB_LogConfig".StopTest` | Bool | TRUE/FALSE | **Pulse** | Zastavení testu + flush (hrana) |
| Logging | `"DB_LogConfig".TestDuration_s` | DInt | 1-86400 | Setpoint | Automatické ukončení testu [s] |
| Logging | `"DB_LogConfig".FlushEveryN` | Int | 1-1000 | Setpoint | Počet vzorků před flush |
| Logging | `"DB_LogConfig".FilePrefix` | String[16] | text | Text | Prefix názvu log souboru |
| **VŘETENO** | | | | | |
| Spindle | `"DB_HMI".Spindle.Start` | Bool | TRUE/FALSE | **Pulse** | Start příkaz pro drive |
| Spindle | `"DB_HMI".Spindle.Stop` | Bool | TRUE/FALSE | **Pulse** | Stop příkaz |
| Spindle | `"DB_HMI".Spindle.ResetFault` | Bool | TRUE/FALSE | **Pulse** | Reset poruchy |
| Spindle | `"DB_HMI".Spindle.Speed_RPM` | Real | 0-18000 | Setpoint | Cílové otáčky [RPM] |
| **LAB ZDROJ (uhlíky)** | | | | | |
| LabPSU | `"DB_HMI".LabPSU.Enable` | Bool | TRUE/FALSE | Latch | Povolení lab zdroje |
| LabPSU | `"DB_HMI".LabPSU.Mode` | USInt | 0,1,2 | Setpoint | 0=OFF, 1=CONST, 2=SINE_DEBUG |
| LabPSU | `"DB_HMI".LabPSU.ConstCurrent_A` | Real | 0-60 | Setpoint | Konstantní proud [A] (Mode=1) |
| LabPSU | `"DB_HMI".LabPSU.BaseVoltage_V` | Real | 0.8-16 | Setpoint | Základní napětí zdroje [V] |
| LabPSU | `"DB_HMI".LabPSU.CurrentOffset_A` | Real | 0-60 | Setpoint | DC offset proudu [A] |
| LabPSU | `"DB_HMI".LabPSU.DebugAmplitude_A` | Real | 0-60 | Setpoint | Amplituda sinu [A] (Mode=2) |
| LabPSU | `"DB_HMI".LabPSU.DebugFrequency_Hz` | Real | 0.1-10 | Setpoint | Frekvence sinu [Hz] (Mode=2) |
| LabPSU | `"DB_HMI".LabPSU.Cycle_s` | Real | 0.001-1.0 | Setpoint | Časová základna [s] |
| **KONFIGURACE** | | | | | |
| Config | `"DB_Config".TempHighThreshold_C` | Real | 0-100 | Setpoint | Práh vysoké teploty [°C] |
| Config | `"DB_Config".VibCriticalThreshold` | Real | 0-100 | Setpoint | Práh kritických vibrací |
| **VSTUPNÍ SIMULACE** | | | | | |
| Sim | `"DB_Config".InputSim.EnableSafetyRelayAuxOverride` | Bool | TRUE/FALSE | Latch | Povolit override safety relé |
| Sim | `"DB_Config".InputSim.SafetyRelayAuxOk` | Bool | TRUE/FALSE | Latch | Simulovaný stav relé |
| Sim | `"DB_Config".InputSim.EnableEmergencyStopOverride` | Bool | TRUE/FALSE | Latch | Povolit override E-Stop |
| Sim | `"DB_Config".InputSim.EmergencyStop` | Bool | TRUE/FALSE | Latch | Simulovaný E-Stop stav |

| Sim | `"DB_Config".InputSim.EmergencyStop` | Bool | TRUE/FALSE | Latch | Simulovaný E-Stop stav |

---

## 2) Tabulka čtení z HMI (status a monitoring)

| Oblast | Tag | Typ | Význam |
|---|---|---|---|
| **LOG STATUS** | | | |
| Log | `"DB_LogRuntime".TestActive` | Bool | TRUE = test právě běží |
| Log | `"DB_LogRuntime".Elapsed_s` | Real | Uplynulý čas testu [s] |
| Log | `"DB_LogRuntime".SampleCounter` | DInt | Počet nahraných vzorků |
| Log | `"DB_LogRuntime".FileName` | String[32] | Název souboru logu |
| Log | `"DB_LogRuntime".HeaderWritten` | Bool | CSV hlavička zapsána |
| Log | `"DB_LogRuntime".LastFlushOk` | Bool | Poslední flush OK |
| Log | `"DB_LogRuntime".FlushErrorCount` | Int | Počet chyb flush |
| Log | `"DB_LogRuntime".LastError` | String[40] | Text poslední chyby |
| **VŘETENO STATUS** | | | |
| Spindle | `"DB_Status".Spindel.RunLatched` | Bool | Příkaz k běhu aktivní |
| Spindle | `"DB_Status".Spindel.TripActive` | Bool | Interlock aktivní |
| Spindle | `"DB_Status".Spindel.State` | USInt | 0=STOPPED, 1=RUN_CMD, 2=STOPPING, 3=TRIP |
| Spindle | `"DB_Status".Spindel.StatusText` | String[40] | Stavový text |
| **LAB ZDROJ STATUS** | | | |
| LabPSU | `"DB_Status".LabPSU.VoltageSet_V` | Real | Nastavené napětí [V] |
| LabPSU | `"DB_Status".LabPSU.CurrentSet_A` | Real | Nastavený proud [A] |
| LabPSU | `"DB_Status".LabPSU.State` | USInt | 0=OFF, 1=CONST, 2=SINE |
| LabPSU | `"DB_Status".LabPSU.StatusText` | String[40] | Stavový text |
| **SAFETY STATUS** | | | |
| Safety | `"DB_Status".Safety.SafetyOk` | Bool | Všechny safety OK |
| Safety | `"DB_Status".Safety.PermitMotion` | Bool | Povolení pohybu |
| Safety | `"DB_Status".Safety.TripActive` | Bool | Bezpečnostní trip aktivní |
| Safety | `"DB_Status".Safety.TripCode` | USInt | Kód tripu (viz dokumentace) |
| Safety | `"DB_Status".Safety.StatusText` | String[40] | Stavový text |
| **SENZORY** | | | |
| Sensors | `"DB_HMI".Sensors.AI1_Teplota_Lozisko_C` | Real | Teplota ložiska [°C] |
| Sensors | `"DB_HMI".Sensors.TM_Rotation_A_Channel` | Real | Otáčky [RPM] |
| **ALARMY** | | | |
| Alarms | `"DB_Alarms".TempHigh` | Bool | Vysoká teplota |
| Alarms | `"DB_Alarms".VibCritical` | Bool | Kritické vibrace |
| **FYZICKÉ VSTUPY** | | | |
| DI | `"DB_IO".DI.SafetyRelayAuxOk` | Bool | Safety relé AUX OK |
| DI | `"DB_IO".DI.EmergencyStop` | Bool | Emergency stop aktivní |
| DI | `"DB_IO".DI.ExternalFault` | Bool | Externí porucha |
| **FYZICKÉ VÝSTUPY** | | | |
| DQ | `"DB_IO".DQ.RunForwardCmd` | Bool | Příkaz běhu vpřed |
| DQ | `"DB_IO".DQ.FaultResetCmd` | Bool | Příkaz reset poruchy |
| DQ | `"DB_IO".DQ.EmergencyStopButtonLed` | Bool | Červená LED E-Stop |
| DQ | `"DB_IO".DQ.ResetButtonLed` | Bool | Modrá LED Reset |
| **ANALOGOVÉ VÝSTUPY** | | | |
| AQ | `"DB_IO".AQ.SpeedVoltage` | Real | Napětí otáček [V] |
| AQ | `"DB_IO".AQ.AQ1_CurrentCtrl_V` | Real | Řízení proudu uhlíků [V] |
| AQ | `"DB_IO".AQ.AQ2_VoltageCtrl_V` | Real | Řízení napětí zdroje [V] |
| AQ | `"DB_IO".AQ.AQ3_OutputOff` | Real | Output off zdroje [V] |

---

| AQ | `"DB_IO".AQ.AQ3_OutputOff` | Real | Output off zdroje [V] |

---

## 3) Doporučení pro pulse (hranové proměnné)

⚠️ **DŮLEŽITÉ**: Pro hranové proměnné je nutné poslat krátký pulse!

| Tag | Typ | Jak použít |
|---|---|---|
| `StartTest`, `StopTest` | Pulse | Poslat TRUE na 100-300 ms, pak FALSE |
| `Spindle.Start`, `Stop`, `ResetFault` | Pulse | Poslat TRUE na 100-300 ms, pak FALSE |

❌ **NENECHÁVEJTE** hranové tagy trvale na TRUE - způsobí to nechtěné chování!

---

## 4) Doporučená sekvence START testu (AUTO tlačítko)

### Krok 1: Nastavit parametry testu
```
"DB_HMI".Spindle.Speed_RPM := 16000.0           // Cílové otáčky
"DB_LogConfig".TestDuration_s := 3600           // 1 hodina
"DB_LogConfig".FlushEveryN := 100               // Flush každých 100 vzorků
"DB_LogConfig".FilePrefix := 'test_001'         // Prefix souboru

// LabPSU parametry podle zvoleného režimu
"DB_HMI".LabPSU.Mode := 1                       // 1=CONST
"DB_HMI".LabPSU.ConstCurrent_A := 10.0          // 10 A konstantní
"DB_HMI".LabPSU.BaseVoltage_V := 2.0            // 2 V základní
```

### Krok 2: Aktivovat latch tagy
```
"DB_LogConfig".Enable := TRUE                   // Povolit logování
"DB_HMI".LabPSU.Enable := TRUE                  // Povolit lab zdroj
```

### Krok 3: Poslat hranové start povely (pulse)
```
"DB_HMI".Spindle.Start := TRUE                  // Pulse 200 ms
čekat 200 ms
"DB_HMI".Spindle.Start := FALSE

"DB_LogConfig".StartTest := TRUE                // Pulse 200 ms
čekat 200 ms
"DB_LogConfig".StartTest := FALSE
```

### Krok 4: Monitorovat status
```
Kontrolovat: "DB_LogRuntime".TestActive == TRUE
Kontrolovat: "DB_Status".Spindel.State != 0
Kontrolovat: "DB_Status".Safety.PermitMotion == TRUE
```

---

## 5) Doporučená sekvence STOP (STOP tlačítko)

### Krok 1: Poslat hranové stop povely (pulse)
```
"DB_HMI".Spindle.Stop := TRUE                   // Pulse 200 ms
čekat 200 ms
"DB_HMI".Spindle.Stop := FALSE

"DB_LogConfig".StopTest := TRUE                 // Pulse 200 ms
čekat 200 ms
"DB_LogConfig".StopTest := FALSE
```

### Krok 2: Vypnout latch tagy
```
"DB_HMI".LabPSU.Enable := FALSE                 // Vypnout lab zdroj
"DB_LogConfig".Enable := FALSE                  // (volitelně) Vypnout logování
```

### Krok 3: Ověřit zastavení
```
Kontrolovat: "DB_LogRuntime".TestActive == FALSE
Kontrolovat: "DB_Status".Spindel.State == 0
Kontrolovat: "DB_Status".LabPSU.State == 0
```

---

## 6) RESET po poruše

### Sekvence RESET
```
// Ověřit, že porucha již není aktivní
Kontrolovat: "DB_Status".Safety.TripActive == FALSE

// Poslat reset pulse
"DB_HMI".Spindle.ResetFault := TRUE             // Pulse 200 ms
čekat 200 ms
"DB_HMI".Spindle.ResetFault := FALSE

// Ověřit reset
Kontrolovat: "DB_Status".Spindel.State == 0 (STOPPED)
```

---

## 7) Stavové kódy

### Spindel State (`"DB_Status".Spindel.State`)
| Hodnota | Stav | Význam |
|---|---|---|
| 0 | STOPPED | Zastaveno |
| 1 | RUN_CMD | Běh aktivní |
| 2 | STOPPING | Zastavování |
| 3 | TRIP | Interlock/Porucha |

### LabPSU State (`"DB_Status".LabPSU.State`)
| Hodnota | Stav | Význam |
|---|---|---|
| 0 | OFF | Vypnuto |
| 1 | CONST | Konstantní proud |
| 2 | SINE | Debug sinusový režim |

### LabPSU Mode (vstup `"DB_HMI".LabPSU.Mode`)
| Hodnota | Režim | Parametry |
|---|---|---|
| 0 | OFF | - |
| 1 | CONST | `ConstCurrent_A` |
| 2 | SINE_DEBUG | `DebugAmplitude_A`, `DebugFrequency_Hz`, `CurrentOffset_A` |

### Safety Trip Codes (`"DB_Status".Safety.TripCode`)
| Kód | Význam |
|---|---|
| 0 | Bez tripu |
| 1 | Emergency stop |
| 2 | Safety relay AUX fault |
| 3 | External fault |
| 4 | Temperature alarm |
| 5 | Vibration alarm |

---

## 8) Simulace vstupů pro testování (POUZE V LABO!)

⚠️ **VAROVÁNÍ**: Tyto tagy používat pouze pro testování v laboratoři!

### Simulace safety signálů
```
// Povolit override safety relé
"DB_Config".InputSim.EnableSafetyRelayAuxOverride := TRUE
"DB_Config".InputSim.SafetyRelayAuxOk := TRUE        // Simulovat OK stav

// Povolit override E-Stop
"DB_Config".InputSim.EnableEmergencyStopOverride := TRUE
"DB_Config".InputSim.EmergencyStop := FALSE          // Simulovat nouzový stop vypnutý
```

### ❌ V produkci musí být:
```
"DB_Config".InputSim.EnableSafetyRelayAuxOverride := FALSE
"DB_Config".InputSim.EnableEmergencyStopOverride := FALSE
```

---

## 9) Diagnostika a řešení problémů

### Test neběží po START
1. Kontrola: `"DB_Status".Safety.PermitMotion` == TRUE
2. Kontrola: `"DB_Status".Safety.TripActive` == FALSE  
3. Kontrola: `"DB_LogConfig".Enable` == TRUE
4. Kontrola: `"DB_HMI".LabPSU.Enable` == TRUE

### Vřeteno se neroztočí
1. Kontrola: `"DB_Status".Spindel.State` - pokud 3 (TRIP), resetovat
2. Kontrola: `"DB_Status".Safety.PermitMotion` == TRUE
3. Kontrola: `"DB_HMI".Spindle.Speed_RPM` > 0
4. Kontrola: `"DB_IO".DQ.RunForwardCmd` == TRUE (fyzický výstup)

### LED diody nefungují
1. Kontrola: `"DB_IO".DQ.EmergencyStopButtonLed` (červená)
2. Kontrola: `"DB_IO".DQ.ResetButtonLed` (modrá)
3. Ověřit, že `FC_IO_Map_Write` je voláno v Main

### Log se nezapisuje
1. Kontrola: `"DB_LogRuntime".TestActive` == TRUE
2. Kontrola: `"DB_LogRuntime".LastFlushOk` == TRUE
3. Kontrola: `"DB_LogRuntime".FlushErrorCount` - pokud >0, zkontrolovat SD kartu
4. Kontrola: `"DB_LogRuntime".LastError` - text chyby

---

## 10) Příklad typické HMI obrazovky

### Panel ŘÍZENÍ
- **START** tlačítko → sekvence START (sekce 4)
- **STOP** tlačítko → sekvence STOP (sekce 5)
- **RESET** tlačítko → sekvence RESET (sekce 6)
- **E-STOP** status → `"DB_IO".DI.EmergencyStop`
- **Safety OK** status → `"DB_Status".Safety.SafetyOk`

### Panel PARAMETRY
- Otáčky setpoint → `"DB_HMI".Spindle.Speed_RPM`
- LabPSU Mode → `"DB_HMI".LabPSU.Mode`
- LabPSU proud → `"DB_HMI".LabPSU.ConstCurrent_A`
- Test doba → `"DB_LogConfig".TestDuration_s`

### Panel MONITORING
- Otáčky měřené → `"DB_HMI".Sensors.TM_Rotation_A_Channel`
- Teplota → `"DB_HMI".Sensors.AI1_Teplota_Lozisko_C`
- Stav vřetena → `"DB_Status".Spindel.StatusText`
- Stav zdroje → `"DB_Status".LabPSU.StatusText`
- Safety text → `"DB_Status".Safety.StatusText`

### Panel LOG
- Test aktivní → `"DB_LogRuntime".TestActive`
- Uplynulý čas → `"DB_LogRuntime".Elapsed_s`
- Vzorky → `"DB_LogRuntime".SampleCounter`
- Soubor → `"DB_LogRuntime".FileName`
- Chyby flush → `"DB_LogRuntime".FlushErrorCount`

---

## 11) Poznámky pro nasazení u zákazníka

✅ **Před nasazením ověřit:**
1. Všechny safety vstupy připojeny a funkční
2. Input simulace VYPNUTY (`EnableSafetyRelayAuxOverride` = FALSE)
3. E-Stop tlačítka funkční
4. LED diody funkční (červená/modrá)
5. SD karta vložena a funkční
6. Teplotní čidlo připojeno
7. Tachometr funkční

✅ **Test průběh:**
1. Stisknout E-Stop → kontrola safety reakce
2. Uvolnit E-Stop → kontrola reset funkce
3. Spustit test na 60s → kontrola logování
4. Zkontrolovat vytvoření log souboru na SD kartě
5. Kontrola všech měřených hodnot

---

**Datum vytvoření**: 2026-05-19  
**Verze PLC programu**: 0.1  
**Autor**: Automaticky generováno z PLC kódu
