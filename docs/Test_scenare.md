# SAT testovací scénáře (PLC-only) – spindle-vfd-control

Tento SAT dokument je připravený pro situaci:
- není HMI panel
- nejsou fyzické senzory teploty/vibrací
- je k dispozici pouze PLC + Web server + zápis/čtení tagů přes Web API

Používej tagy přes Web API (`PlcProgram.Write` / `PlcProgram.Read`) a výsledek dokumentuj screenshotem hodnot.

## Důležité omezení testu bez centrálních modulů

V `FC_IO_Map_Read` se některé DI/AI hodnoty přepisují z fyzických signálů, proto je nepoužívej jako hlavní SAT vstupy.
Pro PLC-only SAT používej hlavně:
- `"DB_HMI".*` (povely)
- `"DB_Alarms".VibCritical` (simulace tripu)
- ověření v `"DB_Status".*`, `"DB_IO".DQ.*`, `"DB_IO".AQ.*`

## SAT-01 – Rozbeh vretena bez fyzickeho safety rele

Ucel: overit, ze i bez pripojeneho safety buttonu/rele lze pro SAT vynutit SafetyRelayAuxOk a rozbehnout vreteno.

### Zapis (krok 1 - test override safety)
- `"DB_Config".InputSim.EnableSafetyRelayAuxOverride = true`
- `"DB_Config".InputSim.SafetyRelayAuxOk = true`
- `"DB_Alarms".VibCritical = false`

### Zapis (krok 2 - spindle command)
- `"DB_HMI".Spindle.Start = false`
- `"DB_HMI".Spindle.Stop = true`
- kratce pockat (>= 200 ms)
- `"DB_HMI".Spindle.Stop = false`
- `"DB_HMI".Spindle.Speed_RPM = 16000.0`
- `"DB_HMI".Spindle.Start = true`

### Over
- `"DB_IO".DI.SafetyRelayAuxOk == true`
- `"DB_Status".Safety.PermitMotion == true`
- `"DB_Status".Spindel.TripActive == false`
- `"DB_IO".DQ.RunForwardCmd == true`
- `"DB_IO".AQ.SpeedVoltage > 0.0`

### Poznamka
- Pokud zustava `TripActive = true`, zkontroluj jeste fyzicky vstup `DI1_SafetyRelay_State` (ovlivnuje `EmergencyStop`).

## SAT-02 – Safety trip přes VibCritical (simulace senzoru)

Účel: ověřit bezpečné odstavení logikou SafetyGate bez fyzických senzorů.

### Faze A – nejdriv overit stav "bezi bez tripu"

#### Zapis
- `"DB_Config".InputSim.EnableSafetyRelayAuxOverride = true`
- `"DB_Config".InputSim.SafetyRelayAuxOk = true`
- `"DB_Alarms".VibCritical = false`
- `"DB_HMI".Spindle.Start = false`
- `"DB_HMI".Spindle.Stop = true`
- kratce pockat (>= 200 ms)
- `"DB_HMI".Spindle.Stop = false`
- `"DB_HMI".Spindle.Speed_RPM = 16000.0`
- `"DB_HMI".Spindle.Start = true`

#### Over
- `"DB_Status".Safety.PermitMotion == true`
- `"DB_Status".Spindel.TripActive == false`
- `"DB_IO".DQ.RunForwardCmd == true`
- `"DB_IO".AQ.SpeedVoltage > 0.0`

### Faze B – aktivovat alarm a overit trip

#### Zapis
- `"DB_Alarms".VibCritical = true`

#### Over
- `"DB_Status".Safety.TripActive == true`
- `"DB_Status".Safety.PermitMotion == false`
- `"DB_IO".DQ.RunForwardCmd == false`

### Volitelně ověř
- `"DB_Status".Safety.TripCode` (může být 5 nebo vyšší priorita podle aktuálních podmínek)

## SAT-03 – Odeznívání tripu bez auto-restartu

Účel: ověřit, že po odeznění poruchy se stroj sám nerozběhne.

### Faze A – aktivovat simulaci safety a roztočit vreteno

#### Zapis
- `"DB_Config".InputSim.EnableSafetyRelayAuxOverride = true`
- `"DB_Config".InputSim.SafetyRelayAuxOk = true`
- `"DB_Alarms".VibCritical = false`
- `"DB_HMI".Spindle.Start = false`
- `"DB_HMI".Spindle.Stop = true`
- kratce pockat (>= 200 ms)
- `"DB_HMI".Spindle.Stop = false`
- `"DB_HMI".Spindle.Speed_RPM = 16000.0`
- `"DB_HMI".Spindle.Start = true`

#### Over
- `"DB_Status".Spindel.TripActive == false`
- `"DB_IO".DQ.RunForwardCmd == true`
- `"DB_IO".AQ.SpeedVoltage > 0.0`

### Faze B – vyvolat trip

#### Zapis
- `"DB_Alarms".VibCritical = true`

#### Over
- `"DB_Status".Safety.TripActive == true`
- `"DB_IO".DQ.RunForwardCmd == false`

### Faze C – zrusit alarm, ale nedat novy start

#### Zapis
- `"DB_Alarms".VibCritical = false`
- `"DB_HMI".Spindle.Start = false`
- `"DB_HMI".Spindle.Stop = false`

#### Over
- `"DB_Status".Safety.TripActive == false`
- `"DB_IO".DQ.RunForwardCmd == false`
- `"DB_Status".Spindel.RunLatched == false`

## SAT-04 – LabPSU povely přes DB (bez HW zdroje)

Účel: ověřit, že web umí nastavovat parametry zdroje a že řídicí analogové výstupy odpovídají přepočtu.

### Zapiš
- `"DB_Config".InputSim.EnableSafetyRelayAuxOverride = true`
- `"DB_Config".InputSim.SafetyRelayAuxOk = true`
- `"DB_Alarms".VibCritical = false`
- `"DB_HMI".LabPSU.Enable = true`
- `"DB_HMI".LabPSU.Mode = 1` (CONST)
- `"DB_HMI".LabPSU.BaseVoltage_V = 16.0`
- `"DB_HMI".LabPSU.ConstCurrent_A = 30.0`
- počkej alespoň 900 ms (rampa proudu)

### Ověř
- `"DB_Status".Safety.PermitMotion == true`
- `"DB_IO".AQ.AQ3_OutputOff == 0.0`  (zdroj povolen)
- `"DB_IO".AQ.AQ2_VoltageCtrl_V ~= 5.0`  (16 V odpovídá 5 V řídicího signálu)
- `"DB_IO".AQ.AQ1_CurrentCtrl_V ~= 2.5`  (30 A odpovídá 2.5 V řídicího signálu)

### Pracovní rozsahy (komentář pro test page)
- `AQ3_OutputOff`: `5.0 V = OFF`, `0.0 V = ON`
- `AQ1_CurrentCtrl_V`: `0..5 V` odpovídá `0..60 A` (např. `30 A => 2.5 V`)
- `AQ2_VoltageCtrl_V`: `0..5 V` odpovídá výkonovému výstupu zdroje `~0.8..16 V`
	- `5.0 V => 16 V`
	- `0.0 V => ~0.8 V` (minimální reálné výstupní napětí BK1900B)

### Poznámka
- Bez reálného BK1900B je to logický test přepočtu a propisování řídicích hodnot.

## SAT-05 – LabPSU SAFE OFF

Účel: ověřit bezpečný vypnutý stav zdroje.

### Zapiš
- `"DB_HMI".LabPSU.Enable = false`

### Ověř
- `"DB_IO".AQ.AQ3_OutputOff == 5.0`
- `"DB_Status".LabPSU.State == 0`
- `"DB_Status".LabPSU.CurrentSet_A == 0.0`

## SAT-06 – SINE_DEBUG zápis a odečet

Účel: ověřit režim a parametrizaci sinusového proudu z pohledu PLC logiky.

### Zapiš
- `"DB_HMI".LabPSU.Enable = true`
- `"DB_HMI".LabPSU.Mode = 2`
- `"DB_HMI".LabPSU.CurrentOffset_A = 5.0`
- `"DB_HMI".LabPSU.DebugAmplitude_A = 5.0`
- `"DB_HMI".LabPSU.DebugFrequency_Hz = 2.0`

### Ověř
- `"DB_HMI".LabPSU.Mode == 2`
- `"DB_HMI".LabPSU.CurrentOffset_A == 5.0`
- `"DB_HMI".LabPSU.DebugAmplitude_A == 5.0`
- `"DB_HMI".LabPSU.DebugFrequency_Hz == 2.0`

### Volitelně ověř (pokud Safety dovolí výstup)
- `"DB_Status".LabPSU.State == 2`
- `"DB_IO".AQ.AQ1_CurrentCtrl_V` se v čase mění

## SAT-07 – Truth table safety DI0/DI1 (simulace vsech kombinaci)

Ucel: overit, ze vsechny 4 kombinace DI0/DI1 generuji spravny stav SafetyGate, PermitMotion a LED vystupy.
Odkaz: viz [Safety_Logic_Table.md](Safety_Logic_Table.md)

### Faze 1 – READY (DI1=1, DI0=1)

#### Zapis
- `"DB_Config".InputSim.EnableSafetyRelayAuxOverride = true`
- `"DB_Config".InputSim.SafetyRelayAuxOk = true`
- `"DB_Config".InputSim.EnableEmergencyStopOverride = true`
- `"DB_Config".InputSim.EmergencyStop = false`

#### Over
- `"DB_Status".Safety.SafetyOk == true`
- `"DB_Status".Safety.PermitMotion == true`
- `"DB_Status".Safety.TripActive == false`
- `"DB_Status".Safety.TripCode == 0`
- `"DB_IO".DQ.EmergencyStopButtonLed == false`
- `"DB_IO".DQ.ResetButtonLed == false`

### Faze 2 – WAITING FOR RESET (DI1=1, DI0=0)

#### Zapis
- `"DB_Config".InputSim.SafetyRelayAuxOk = false`
- `"DB_Config".InputSim.EmergencyStop = false`

#### Over
- `"DB_Status".Safety.SafetyOk == false`
- `"DB_Status".Safety.TripActive == true`
- `"DB_Status".Safety.TripCode == 2`
- `"DB_IO".DQ.EmergencyStopButtonLed == false`
- `"DB_IO".DQ.ResetButtonLed == true`

### Faze 3 – E-STOP ACTIVE (DI1=0, DI0=0)

#### Zapis
- `"DB_Config".InputSim.SafetyRelayAuxOk = false`
- `"DB_Config".InputSim.EmergencyStop = true`

#### Over
- `"DB_Status".Safety.SafetyOk == false`
- `"DB_Status".Safety.TripActive == true`
- `"DB_Status".Safety.TripCode == 1`
- `"DB_IO".DQ.EmergencyStopButtonLed == true`
- `"DB_IO".DQ.ResetButtonLed == false`

### Faze 4 – E-STOP ACTIVE fault stav (DI1=0, DI0=1)

#### Zapis
- `"DB_Config".InputSim.SafetyRelayAuxOk = true`
- `"DB_Config".InputSim.EmergencyStop = true`

#### Over
- `"DB_Status".Safety.SafetyOk == false`
- `"DB_Status".Safety.TripActive == true`
- `"DB_Status".Safety.TripCode == 1`
- `"DB_IO".DQ.EmergencyStopButtonLed == true`
- `"DB_IO".DQ.ResetButtonLed == false`

---

## Logovaci scénáře (LOG) – TDD

Tyto scénáře jsou připraveny metodou Test Driven Development. Testy jsou dokumentovány a
připraveny ve webtestapp, ale **budou selhávat dokud nebude implementována logika logování** v PLC.
Odkazuj se na [logging_architecture.md](logging_architecture.md) pro detaily implementace.

### LOG-01 – Start a stop testu

Ucel: overit, ze `FB_LogManager` reaguje na start/stop prikaz.

#### Predpodminka
- Safety override aktivni, vreteno v klidu.

#### Zapis
- `"DB_LogConfig".Enable = true`
- `"DB_HMI".Spindle.Start_Log = true`  *(HMI start testu – bude pridano)*

#### Over
- `"DB_LogRuntime".TestActive == true`
- `"DB_LogRuntime".Elapsed_s == 0.0` (nebo velmi mala hodnota)
- `"DB_LogRuntime".SampleCounter == 0` (nebo 1 po prvnim cyklu)

#### Stop
- `"DB_HMI".Spindle.Stop_Log = true`
- `"DB_LogRuntime".TestActive == false`

> **Status: EXPECTED FAIL** – DB_LogRuntime zatim neexistuje v PLC projektu, `FB_LogManager` neni napojen.

---

### LOG-02 – Plnění trend bufferu

Ucel: overit, ze se trend buffer plni a TrendWriteIdx se pohybuje dopredu.

#### Predpodminka
- LOG-01 PASS (test je aktivni).

#### Pockat
- min. 500 ms (pri SampleTime_ms=200 = cca 2-3 vzorky)

#### Over
- `"DB_LogBuffer".TrendWriteIdx > 0`
- `"DB_LogBuffer".TrendBuffer[0].t_s ~= 0.2`  (prvni vzorek = 200 ms)
- `"DB_LogBuffer".TrendBuffer[0].State` je platna hodnota (0-3)

> **Status: EXPECTED FAIL** – DB_LogBuffer zatim neexistuje v PLC projektu.

---

### LOG-03 – Trend buffer zaznamenava Trip event

Ucel: overit, ze v okamziku tripu se zaznamena spravny TripCode.

#### Predpodminka
- LOG-02 PASS, vreteno bezi.

#### Zapis
- `"DB_Alarms".VibCritical = true`
- pockat >= 300 ms

#### Over
- Nektery nedavny zaznam v `TrendBuffer` ma `TripActive == true`
- Stejny zaznam ma `TripCode == 5` (VIBRATION ALARM)

> **Status: EXPECTED FAIL** – DB_LogBuffer zatim neexistuje v PLC projektu.

---

### LOG-04 – Elapsed_s roste spravne

Ucel: overit spravnost casovani.

#### Predpodminka
- LOG-01 PASS, test aktivni.

#### Pockat 2 sekundy, pak precist

#### Over
- `"DB_LogRuntime".Elapsed_s >= 2.0`
- `"DB_LogRuntime".Elapsed_s <= 3.0`  (tolerance 1 s)
- `"DB_LogRuntime".SampleCounter >= 9`  (pri 200 ms = 10 vzorku/2s)

> **Status: EXPECTED FAIL** – DB_LogRuntime zatim neexistuje v PLC projektu.

---

### LOG-05 – Konec testu po timeoutu

Ucel: overit, ze po ubehnuti `TestDuration_s` se test sam zastavi.

#### Predpodminka
- LOG-01 PASS.

#### Zapis
- `"DB_LogConfig".TestDuration_s = 3`  (kratky test = 3 sekundy)

#### Pockat >= 4 sekundy

#### Over
- `"DB_LogRuntime".TestActive == false`
- `"DB_LogRuntime".Elapsed_s >= 3.0`

> **Status: EXPECTED FAIL** – DB_LogRuntime zatim neexistuje v PLC projektu.

---

## Evidence pro předání zákazníkovi

Pro každý SAT scénář ulož:
- datum/čas
- zapsané tagy a hodnoty
- přečtené kontrolní tagy
- PASS/FAIL
- screenshot z webtestapp

## Co tento SAT bez HW neprokazuje

- reálné roztočení motoru na 16k rpm
- reálný proud do uhlíku
- reálné teploty/vibrace
- fyzický logging na SD kartu (pokud není ještě implementován)
