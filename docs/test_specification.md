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
- `"DB_IO".AQ.AQ3_CurrentCtrl_V ~= 2.27`  **[AKTUALIZOVÁNO: kalibrace 2026-07-18]** (30 A → 2.27 V dle kalibrace)

### Pracovní rozsahy (komentář pro test page)
- `AQ3_OutputOff`: `5.0 V = OFF`, `0.0 V = ON`
- `AQ3_CurrentCtrl_V`: Kalibrované mapování `U [V] = (I [A] / 15.92) + 0.383`
	- Příklady: `10 A → 1.01 V`, `30 A → 2.27 V`, `60 A → 4.15 V`
	- Dead zone: 0.383 V (pod touto hodnotou zdroj nereaguje)
- `AQ2_VoltageCtrl_V`: `0..5 V` odpovídá výkonovému výstupu zdroje `~0.8..16 V`
	- `5.0 V => 16 V`
	- `0.0 V => ~0.8 V` (minimální reálné výstupní napětí BK1900B)

### Poznámka
- Bez reálného BK1900B je to logický test přepočtu a propisování řídicích hodnot.
- **Kalibrace 2026-07-18:** Mapování proudu aktualizováno dle naměřené charakteristiky (viz [labpsu_calibration.md](labpsu_calibration.md))

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
- `"DB_HMI".LabPSU.DebugPeriod_min = 10.0`

### Ověř
- `"DB_HMI".LabPSU.Mode == 2`
- `"DB_HMI".LabPSU.CurrentOffset_A == 5.0`
- `"DB_HMI".LabPSU.DebugAmplitude_A == 5.0`
- `"DB_HMI".LabPSU.DebugPeriod_min == 10.0`

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

Scenare pokryvaji dve faze implementace:
- **Faze 1 (LOG-01..05):** start/stop, plneni bufferu, casovani, timeout – implementovano v PLC.
- **Faze 2 (LOG-06..10):** SD flush, posun ReadIdx, finalni flush, chyby SD – implementovano v PLC.
  LOG-07, LOG-09, LOG-10 vyzaduji fyzicke HW (SD karta v PLC).

Odkazuj se na [logging_architecture.md](logging_architecture.md) pro detaily implementace.

### LOG-01 – Start a stop testu

Ucel: overit, ze `FB_LogManager` reaguje na start/stop prikaz (hrana StartTest).

#### Predpodminka
- Safety override aktivni, vreteno v klidu.

#### Zapis
- `"DB_LogConfig".Enable = true`
- `"DB_LogConfig".StartTest = true`  (hrana – po 150 ms reset na false)

#### Over
- `"DB_LogRuntime".TestActive == true`
- `"DB_LogRuntime".SampleCounter >= 0`

#### Stop
- `"DB_LogConfig".StopTest = true`
- `"DB_LogRuntime".TestActive == false`

> **Status: IMPLEMENTOVANO** – FB_LogManager a DB_LogRuntime existuji a jsou napojeny v OB30.

---

### LOG-02 – Plnění trend bufferu

Ucel: overit, ze se trend buffer plni a TrendWriteIdx se pohybuje dopredu.

#### Predpodminka
- LOG-01 PASS (test je aktivni).

#### Pockat
- min. 15s (pri SampleEveryN=6, OB30=1000ms = vzorky kazdych 6s → 2–3 vzorky)

#### Over
- `"DB_LogBuffer".TrendWriteIdx > 0`

> **Status: IMPLEMENTOVANO** – DB_LogBuffer existuje, kruhovy buffer plnen v OB30.

---

### LOG-03 – Trend buffer zaznamenava Trip event

Ucel: overit, ze pri tripu se zaznamena spravny TripCode.

#### Predpodminka
- LOG-02 PASS, vreteno bezi.

#### Faze A: trigger VibCritical + start logu
- Zapis: safety override ON, StartTest=true, VibCritical=true
- Pockat 400 ms

#### Faze B: Over
- `"DB_LogRuntime".SampleCounter > 0`
- `"DB_LogBuffer".TrendWriteIdx > 0`

> **Status: CASTECNE** – buffer se plni spravne, ale cteni konkretniho pole TrendBuffer[n] pres WebAPI neni podporovano (API neumi indexovat pole). Overeni TripCode v zaznamu nutno provest pres TIA Watch nebo stazenim CSV souboru.

---

### LOG-04 – Elapsed_s roste spravne

Ucel: overit spravnost casovani (SampleEveryN * 100ms per vzorek).

#### Predpodminka
- LOG-01 PASS, test aktivni.

#### Pockat 2200 ms, pak precist

#### Over
- `"DB_LogRuntime".Elapsed_s >= 3.0`
- `"DB_LogRuntime".SampleCounter > 8`

> **Status: IMPLEMENTOVANO** – casovani ridi SampleEveryN_Cycles * 0.1s per vzorek.

---

### LOG-05 – Konec testu po timeoutu

Ucel: overit, ze po ubehnuti `TestDuration_s` se test sam zastavi a FlushPending se setuje.

#### Predpodminka
- LOG-01 PASS.

#### Zapis
- `"DB_LogConfig".TestDuration_s = 3`  (kratky test)

#### Pockat >= 4 sekundy

#### Over
- `"DB_LogRuntime".TestActive == false`
- `"DB_LogRuntime".Elapsed_s >= 3.0`

> **Status: IMPLEMENTOVANO** – po ubehnuti casu TestActive=FALSE a FlushPending=TRUE (finalni flush).

---

### LOG-06 – FlushPending se setuje po dosazeni FlushEveryN

Ucel: overit, ze po FlushEveryN vzorcich FB_LogManager setuje FlushPending=TRUE.

#### Predpodminka
- Safety override ON.

#### Zapis
- `"DB_LogConfig".Enable = true`
- `"DB_LogConfig".FlushEveryN = 5`
- `"DB_LogConfig".StartTest = true` → po 150 ms reset

#### Pockat 1200 ms (>= 6 vzorku pri 200ms/vzorku)

#### Over
- `"DB_LogRuntime".SampleCounter >= 5`
- `"DB_LogRuntime".TestActive == true`

> **Status: IMPLEMENTOVANO** – nevyzaduje SD kartu; overi spravne pocitani vzorku a trigger podminku.

---

### LOG-07 – TrendReadIdx se posune po uspesnem flushu

Ucel: overit, ze po flushu se TrendReadIdx posune o zapsane radky.

#### Predpodminka
- LOG-06 PASS (FlushPending setovan).

#### Pockat 2000 ms (cas pro dokonceni flushe na SD)

#### Over
- `"DB_LogBuffer".TrendReadIdx > 0`
- `"DB_LogRuntime".LastFlushOk == true`

> **Status: HW_ONLY** – vyzaduje SD kartu v PLC. Bez SD karty Error=TRUE a ReadIdx se neposune.

---

### LOG-08 – Finalni flush pri manuálním stopu

Ucel: overit, ze pri StopTest se nastavi FlushPending=TRUE a flush probehne pred uzavrenim.

#### Predpodminka
- LOG-01 PASS, test aktivni.

#### Zapis
- `"DB_LogConfig".StartTest = true` → reset po 150 ms
- pockat 1000 ms (nasberat vzorky)
- `"DB_LogConfig".StopTest = true` → reset po 150 ms

#### Pockat 800 ms (finalni flush)

#### Over
- `"DB_LogRuntime".TestActive == false`
- `"DB_LogRuntime".SampleCounter > 0`

> **Status: IMPLEMENTOVANO (trigger)** – FlushPending=TRUE pri stopu overi logika v FB_LogManager. Fyzicke overeni zapsanych dat vyzaduje SD kartu (viz LOG-07).

---

### LOG-09 – Chyba zapisu na SD karte

Ucel: overit, ze pri chybe SD se diagnostika ulozi a data se neztrati (ReadIdx se neposune).

#### Predpodminka
- PLC s fyzickou SD kartou (nebo kartu vyhodit pri testu).

#### Postup
1. Spustit test, pockat na FlushPending.
2. Odstranit SD kartu (nebo blokovat zapis).
3. Pockat 2000 ms.

#### Over
- `"DB_LogRuntime".LastFlushOk == false`
- `"DB_LogRuntime".FlushErrorCount > 0`
- `"DB_LogBuffer".TrendReadIdx == 0`  (data nezaztracena)
- `"LogFlushToSd".Error == true`

> **Status: HW_ONLY** – vyzaduje fyzickou SD kartu a moznost simulace chyby.

---

### LOG-10 – Validace obsahu CSV souboru

Ucel: overit, ze soubor na SD karte obsahuje spravnou hlavicku a datove radky.

#### Postup
1. Provest uplny test (LOG-01 az LOG-07 PASS).
2. Stahnout soubor ze SD pres WebAPI nebo primo ze karty.
3. Otevrit v Excelu nebo textovem editoru.

#### Over
- Prvni radek je hlavicka: `t_s,RPM,T_Lozisko,T_Uhliky,Vibrace,ProudUhliky,State,RunLatched,TripActive,TripCode,SafetyText`
- Datove radky odpovidaji poctu SampleCounter
- Nazev souboru je ve formatu `YYYYMMDD-HHMMSS.csv`

> **Status: HW_ONLY** – vyzaduje SD kartu a WebAPI endpoint pro stazeni souboru (faze 3).

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
- fyzický logging na SD kartu (LOG-07, LOG-09, LOG-10)
