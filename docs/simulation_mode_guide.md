# Simulation Mode - Doporučené úpravy pro program_simulation.scl

**Datum:** 2026-07-26  
**Účel:** Simulace negativních scénářů a HMI debug v PLCSIM-WinCC  
**Soubor:** `plc/program_simulation.scl`

---

## 🎯 Cíle simulačního prostředí

1. **Testovat všechny negativní scénáře** bez fyzického HW
2. **Ladit HMI grafiku** a chování UI
3. **Rychlé testování** stavů systému
4. **Reprodukovatelné testy** bez čekání na fyzické procesy

---

## 🔧 Navrhované změny

### 1️⃣ **Rozšíření DB_Config.InputSim**

**Aktuální stav:**
```scl
InputSim : Struct
    EnableSafetyRelayAuxOverride : Bool;
    SafetyRelayAuxOk : Bool;
    EnableEmergencyStopOverride : Bool;
    EmergencyStop : Bool;
END_STRUCT;
```

**Doporučené rozšíření:**
```scl
InputSim : Struct
    // === SAFETY OVERRIDES ===
    EnableSafetyRelayAuxOverride : Bool;
    SafetyRelayAuxOk : Bool;
    EnableEmergencyStopOverride : Bool;
    EmergencyStop : Bool;
    
    // === SENSOR SIMULATORS ===
    EnableTempSimulation : Bool := TRUE;        // Povolit simulaci teplot
    SimulatedTemp_Lozisko_C : Real := 25.0;     // Simulovaná teplota ložiska
    SimulatedTemp_Kartace_C : Real := 25.0;     // Simulovaná teplota kartáčů
    
    EnableRPMSimulation : Bool := TRUE;         // Povolit simulaci otáček
    SimulatedRPM : Real := 0.0;                 // Simulované otáčky
    
    EnableVibraceSimulation : Bool := TRUE;     // Povolit simulaci vibrací
    SimulatedVibrace : Real := 0.0;             // Simulované vibrace
    
    // === ERROR INJECTION ===
    ForceExternalFault : Bool := FALSE;         // Vynutit externí chybu
    
    // === TIME ACCELERATION ===
    TimeAcceleration : Real := 1.0;             // Zrychlení času (1.0 = normální, 10.0 = 10× rychleji)
    
    // === DEBUG MODES ===
    EnableDebugLEDs : Bool := TRUE;             // Debug LED indikace
    DisableFileLogging : Bool := TRUE;          // Vypnout zápis na SD (pro rychlejší simulaci)
    
    // === AUTO-TEST SCENARIOS ===
    AutoTestScenario : USInt := 0;              // 0=OFF, 1=Normal, 2=TempTrip, 3=EStop, 4=Timeout
    AutoTestTrigger : Bool := FALSE;            // Spustit auto-test
END_STRUCT;
```

---

### 2️⃣ **Simulační funkce pro senzory**

**Nová funkce: FC_SimulateSensors**

```scl
FUNCTION "FC_SimulateSensors" : Void
{ S7_Optimized_Access := 'TRUE' }
VERSION : 0.1

BEGIN
    // === TEPLOTA LOŽISKA ===
    IF "DB_Config".InputSim.EnableTempSimulation THEN
        "DB_HMI".Sensors.AI1_Teplota_Lozisko_C := "DB_Config".InputSim.SimulatedTemp_Lozisko_C;
    ELSE
        // Původní mapování z AI1_RTD
        "DB_HMI".Sensors.AI1_Teplota_Lozisko_C := "DB_IO".AI.AI1_TeplotaLoziska_Ohm / 10.0;
    END_IF;
    
    // === TEPLOTA KARTÁČŮ ===
    IF "DB_Config".InputSim.EnableTempSimulation THEN
        "DB_HMI".Sensors.AI2_Teplota_Kartace_C := "DB_Config".InputSim.SimulatedTemp_Kartace_C;
    ELSE
        // Původní mapování z AI2_RTD
        "DB_HMI".Sensors.AI2_Teplota_Kartace_C := "DB_IO".AI.AI2_TeplotaKartace_Ohm / 10.0;
    END_IF;
    
    // === OTÁČKY VŘETENA ===
    IF "DB_Config".InputSim.EnableRPMSimulation THEN
        "DB_HMI".Sensors.TM_Rotation_A_Channel := "DB_Config".InputSim.SimulatedRPM;
    ELSE
        // Původní mapování z HSC
        "DB_HMI".Sensors.TM_Rotation_A_Channel := ("DB_IO".TM.MeasuredValue * 60) / 2;
    END_IF;
    
    // === VIBRACE ===
    IF "DB_Config".InputSim.EnableVibraceSimulation THEN
        // V budoucnu použít simulovanou hodnotu
        // "DB_HMI".Sensors.Vibrace := "DB_Config".InputSim.SimulatedVibrace;
    END_IF;
    
    // === EXTERNÍ CHYBA ===
    IF "DB_Config".InputSim.ForceExternalFault THEN
        "DB_IO".DI.ExternalFault := TRUE;
    ELSE
        "DB_IO".DI.ExternalFault := FALSE;
    END_IF;
    
END_FUNCTION
```

**Volání v OB Main:**
```scl
// Hned po FC_IO_Map_Read
"FC_IO_Map_Read"();
"FC_SimulateSensors"();  // ← NOVÉ pro simulaci
"FC_ConvertIO"();
```

---

### 3️⃣ **Auto-test scénáře**

**Nová funkce: FC_AutoTestScenarios**

```scl
FUNCTION "FC_AutoTestScenarios" : Void
{ S7_Optimized_Access := 'TRUE' }
VERSION : 0.1
VAR_TEMP
    elapsed_s : Real;
END_VAR

BEGIN
    // Auto-test se spustí jen když je trigger aktivní
    IF NOT "DB_Config".InputSim.AutoTestTrigger THEN
        RETURN;
    END_IF;
    
    elapsed_s := "DB_LogRuntime".Elapsed_s;
    
    CASE "DB_Config".InputSim.AutoTestScenario OF
        0: // OFF
            // Nic nedělat
            
        1: // Normal test - 2 minuty
            IF elapsed_s > 120.0 THEN
                "DB_HMI".Spindle.Stop := TRUE;
                "DB_Config".InputSim.AutoTestTrigger := FALSE;
            END_IF;
            
        2: // Temp Trip - po 30s simulovat přehřátí
            IF elapsed_s > 30.0 THEN
                "DB_Config".InputSim.SimulatedTemp_Lozisko_C := 70.0;  // Nad limit (65°C)
            END_IF;
            
        3: // E-Stop - po 45s simulovat E-Stop
            IF elapsed_s > 45.0 THEN
                "DB_Config".InputSim.EnableEmergencyStopOverride := TRUE;
                "DB_Config".InputSim.EmergencyStop := TRUE;
            END_IF;
            
        4: // Timeout test - 5 minut s TimeAcceleration
            IF elapsed_s > 300.0 THEN
                "DB_Config".InputSim.AutoTestTrigger := FALSE;
            END_IF;
            
        ELSE
            // Neznámý scénář
            "DB_Config".InputSim.AutoTestTrigger := FALSE;
    END_CASE;
    
END_FUNCTION
```

**Volání v OB Main:**
```scl
// Před CALL FB BLOCKS
"FC_AutoTestScenarios"();
```

---

### 4️⃣ **Zrychlení času pro testování**

**Úprava FB_LogManager:**

```scl
// V části vzorkování času:
IF "DB_LogRuntime".TestActive THEN
    // Aplikovat TimeAcceleration pro rychlejší testování
    #Elapsed_s := #Elapsed_s + (#Cycle_s * "DB_Config".InputSim.TimeAcceleration);
    "DB_LogRuntime".Elapsed_s := #Elapsed_s;
    
    // ... zbytek kódu ...
END_IF;
```

**Příklad použití:**
```
TimeAcceleration = 10.0
→ 10 minut testu proběhne za 1 minutu reálného času!
```

---

### 5️⃣ **Vypnutí file loggingu pro simulaci**

**Úprava volání FB_LogFlushToSd:**

```scl
// Podmíněné volání flush pouze pokud není simulační režim
IF NOT "DB_Config".InputSim.DisableFileLogging THEN
    "LogFlushToSd"(
        FlushRequest := "LogManager".FlushPending,
        Enable := "DB_LogConfig".Enable,
        // ... další parametry ...
    );
END_IF;
```

---

### 6️⃣ **HMI Debug obrazovka**

**Nový DB pro HMI debug:**

```scl
DATA_BLOCK "DB_HMI_Debug"
{ S7_Optimized_Access := 'TRUE' }
VERSION : 0.1
NON_RETAIN
   VAR 
      // === SIMULATION CONTROL ===
      EnableSimMode : Bool := TRUE;                   // Povolit simulační režim
      
      // === SENSOR OVERRIDES ===
      TempLozisko_Override : Real := 25.0;           // Přepsat teplotu ložiska
      TempKartace_Override : Real := 25.0;           // Přepsat teplotu kartáčů
      RPM_Override : Real := 0.0;                    // Přepsat otáčky
      
      // === QUICK ACTIONS ===
      QuickAction_TempTrip : Bool := FALSE;          // Rychlé tlačítko: Simulovat přehřátí
      QuickAction_EStop : Bool := FALSE;             // Rychlé tlačítko: Simulovat E-Stop
      QuickAction_ResetAll : Bool := FALSE;          // Rychlé tlačítko: Reset všeho
      
      // === DIAGNOSTICS ===
      LastTripReason : String[80] := '';             // Poslední důvod tripu
      CycleTime_ms : Int := 0;                       // Cyklus OB1 [ms]
      
   END_VAR

BEGIN
    EnableSimMode := TRUE;
    TempLozisko_Override := 25.0;
    TempKartace_Override := 25.0;
END_DATA_BLOCK
```

**Logika quick actions:**

```scl
// V OB Main, před CALL FB BLOCKS

// Quick Action: Temp Trip
IF "DB_HMI_Debug".QuickAction_TempTrip THEN
    "DB_Config".InputSim.SimulatedTemp_Lozisko_C := 70.0;
    "DB_HMI_Debug".QuickAction_TempTrip := FALSE;
    "DB_HMI_Debug".LastTripReason := 'Quick Action: Temp Trip activated';
END_IF;

// Quick Action: E-Stop
IF "DB_HMI_Debug".QuickAction_EStop THEN
    "DB_Config".InputSim.EnableEmergencyStopOverride := TRUE;
    "DB_Config".InputSim.EmergencyStop := TRUE;
    "DB_HMI_Debug".QuickAction_EStop := FALSE;
    "DB_HMI_Debug".LastTripReason := 'Quick Action: E-Stop activated';
END_IF;

// Quick Action: Reset All
IF "DB_HMI_Debug".QuickAction_ResetAll THEN
    "DB_Config".InputSim.EnableEmergencyStopOverride := FALSE;
    "DB_Config".InputSim.EmergencyStop := FALSE;
    "DB_Config".InputSim.SimulatedTemp_Lozisko_C := 25.0;
    "DB_Config".InputSim.SimulatedTemp_Kartace_C := 25.0;
    "DB_Config".InputSim.ForceExternalFault := FALSE;
    "DB_HMI_Debug".QuickAction_ResetAll := FALSE;
    "DB_HMI_Debug".LastTripReason := 'System reset via Quick Action';
END_IF;
```

---

### 7️⃣ **Vizuální indikátory pro HMI**

**Nový DB pro HMI indikátory:**

```scl
DATA_BLOCK "DB_HMI_Indicators"
{ S7_Optimized_Access := 'TRUE' }
VERSION : 0.1
NON_RETAIN
   VAR 
      // === STATUS COLORS ===
      Color_System : DInt := 16#FF00FF00;        // Zelená = OK
      Color_Spindle : DInt := 16#FF808080;       // Šedá = Stopped
      Color_LabPSU : DInt := 16#FF808080;        // Šedá = OFF
      Color_Safety : DInt := 16#FF00FF00;        // Zelená = OK
      
      // === BLINK FLAGS ===
      Blink_TempAlarm : Bool := FALSE;
      Blink_TripActive : Bool := FALSE;
      
      // === TEXT MESSAGES ===
      StatusMessage : String[120] := 'System Ready';
      
   END_VAR

BEGIN
    Color_System := 16#FF00FF00;  // Default green
END_DATA_BLOCK
```

**Aktualizace barev v OB Main:**

```scl
// Aktualizace HMI indikátorů
IF "DB_Status".Safety.TripActive THEN
    "DB_HMI_Indicators".Color_System := 16#FFFF0000;      // Červená
    "DB_HMI_Indicators".Color_Safety := 16#FFFF0000;      // Červená
    "DB_HMI_Indicators".Blink_TripActive := TRUE;
    "DB_HMI_Indicators".StatusMessage := CONCAT('TRIP ACTIVE - Code: ', INT_TO_STRING("DB_Status".Safety.TripCode));
ELSE
    "DB_HMI_Indicators".Color_System := 16#FF00FF00;      // Zelená
    "DB_HMI_Indicators".Color_Safety := 16#FF00FF00;      // Zelená
    "DB_HMI_Indicators".Blink_TripActive := FALSE;
    "DB_HMI_Indicators".StatusMessage := 'System Ready';
END_IF;

// Spindle status color
IF "DB_Status".Spindel.RunLatched THEN
    "DB_HMI_Indicators".Color_Spindle := 16#FF00FF00;     // Zelená = běží
ELSIF "DB_Status".Spindel.TripActive THEN
    "DB_HMI_Indicators".Color_Spindle := 16#FFFF0000;     // Červená = trip
ELSE
    "DB_HMI_Indicators".Color_Spindle := 16#FF808080;     // Šedá = stopped
END_IF;

// LabPSU status color
IF "DB_HMI".LabPSU.Enable THEN
    "DB_HMI_Indicators".Color_LabPSU := 16#FF00FF00;      // Zelená = enabled
ELSE
    "DB_HMI_Indicators".Color_LabPSU := 16#FF808080;      // Šedá = disabled
END_IF;
```

---

## 📋 HMI Debug Screen Layout

### Návrh obrazovky "Simulation & Debug"

```
┌─────────────────────────────────────────────────────────┐
│ SIMULATION & DEBUG MODE                        [X Close]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌─ Sensor Simulation ─────────────────────────────────┐ │
│ │                                                      │ │
│ │ [✓] Enable Temp Simulation                          │ │
│ │     Ložisko:  [___25.0___] °C  [▲] [▼]             │ │
│ │     Kartáče:  [___25.0___] °C  [▲] [▼]             │ │
│ │                                                      │ │
│ │ [✓] Enable RPM Simulation                           │ │
│ │     RPM:      [___0.0____] rpm [▲] [▼]             │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Quick Test Actions ─────────────────────────────────┐│
│ │                                                      ││
│ │ [Simulovat Přehřátí]  → Teplota na 70°C           ││
│ │ [Simulovat E-Stop]     → Emergency Stop ON          ││
│ │ [Simulovat Ext.Fault]  → External Fault ON          ││
│ │ [RESET ALL]            → Vše na default             ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Auto-Test Scenarios ────────────────────────────────┐│
│ │                                                      ││
│ │ Scenario: [Normal Test ▼]                           ││
│ │                                                      ││
│ │ [ ] 1: Normal (2 min)                                ││
│ │ [ ] 2: Temp Trip (30s → přehřátí)                   ││
│ │ [ ] 3: E-Stop (45s → E-Stop)                        ││
│ │ [ ] 4: Timeout (5 min s akcelerací)                 ││
│ │                                                      ││
│ │ Time Acceleration: [__1.0__] × (1=norm, 10=10× rych)││
│ │                                                      ││
│ │ [▶ START AUTO-TEST]  [⏹ STOP]                       ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Diagnostics ────────────────────────────────────────┐│
│ │                                                      ││
│ │ Last Trip: [Quick Action: Temp Trip activated]      ││
│ │ Cycle Time: 15 ms                                    ││
│ │ Test Active: [✓]  Elapsed: 00:01:23                 ││
│ │                                                      ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ [✓] Disable File Logging (faster simulation)            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testovací scénáře

### Scénář 1: Quick Temp Trip Test
1. Otevřít Simulation & Debug screen
2. Start testu (vřeteno + LabPSU)
3. Kliknout "Simulovat Přehřátí"
4. **Očekáváno:**
   - Teplota ložiska → 70°C
   - TempHighLozisko = TRUE
   - TripActive = TRUE
   - System se zastaví
   - HMI zobrazí červený alarm

### Scénář 2: Auto-Test Temp Trip
1. Vybrat Scenario: "2: Temp Trip"
2. TimeAcceleration: 10.0
3. Kliknout START AUTO-TEST
4. **Očekáváno:**
   - Test běží 3s (30s / 10)
   - Po 3s se aktivuje přehřátí
   - System tripne
   - Auto-test se ukončí

### Scénář 3: HMI Graf Ladění
1. Enable Temp Simulation
2. Ručně měnit teplotu pomocí ▲▼ tlačítek
3. Sledovat graf teploty na HMI
4. **Ověřit:**
   - Správné škálování grafu
   - Správné barvy (zelená/žlutá/červená)
   - Update rate

---

## 📝 Implementační checklist

### Program changes (program_simulation.scl):
- [ ] Rozšířit DB_Config.InputSim (senzory, debug, auto-test)
- [ ] Přidat FC_SimulateSensors
- [ ] Přidat FC_AutoTestScenarios
- [ ] Upravit FB_LogManager (TimeAcceleration)
- [ ] Podmíněné vypnutí file loggingu
- [ ] Vytvořit DB_HMI_Debug
- [ ] Vytvořit DB_HMI_Indicators
- [ ] Přidat quick actions logiku
- [ ] Aktualizovat color indikátory

### HMI changes (WinCC):
- [ ] Vytvořit "Simulation & Debug" screen
- [ ] Sensor override controls (sliders/input fields)
- [ ] Quick action buttons
- [ ] Auto-test scenario selector
- [ ] Diagnostics display
- [ ] Color-coded status indicators
- [ ] Přidat tab/button pro přístup k debug screen

### Documentation:
- [ ] User guide pro simulation mode
- [ ] Debug screen návod
- [ ] Auto-test scenarios popis

---

## ⚠️ Důležité poznámky

1. **VŽDY označit simulační režim na HMI**
   - Velký banner "SIMULATION MODE" na každé obrazovce
   - Jiná barva pozadí (např. světle modrá)

2. **Nepřenášet simulation kód do produkce**
   - program_simulation.scl je POUZE pro testování
   - program.scl zůstává čistý

3. **TimeAcceleration pouze pro LogManager**
   - NEAPLIKOVAT na FB_LabPSU (jinak se změní frekvence sinu!)
   - NEAPLIKOVAT na FB_DriveCtrl (jinak se změní rampy!)

4. **File logging v simulaci**
   - Doporučeno vypnout (rychlejší)
   - Pokud zapnuto, logy skončí v PLCSIM složce (ne SD karta)

---

## 🚀 Next Steps

1. **Implementovat P0 úkoly z backlogu**
   - Manual Stop vypíná LabPSU
   - Reset fáze na -π/2
   - Reset prevMode

2. **Přidat simulation features**
   - Podle tohoto dokumentu

3. **Vytvořit HMI debug screen**
   - V WinCC projektu

4. **Testovat všechny scénáře**
   - Podle testovací matice

---

**Autor:** System Design  
**Verze:** 1.0  
**Status:** READY FOR IMPLEMENTATION
