# Systémové události a Reset stavy - Backlog

**Datum:** 2026-07-24  
**Účel:** Správa stavů systému při očekávaných i neočekávaných událostech  
**Status:** BACKLOG - K implementaci a testování

---

## 🎯 Hlavní systémové události

### 1️⃣ **SAFETY STOP - Červené tlačítko (E-Stop)**

**Trigger:** Stisk červeného safety tlačítka (Emergency Stop)

**Aktuální chování:**
- `EmergencyStop := TRUE`
- `FB_SafetyGate.TripActive := TRUE`
- `PermitMotion := FALSE`
- Všechny výstupy do SAFE stavu

**Co se MÁ stát:**

| Subsystém | Akce | Status |
|-----------|------|--------|
| **Vřeteno** | Zastavit okamžitě (RunForward→FALSE, AQ1→0V) | ✅ Implementováno |
| **LabPSU** | Vypnout zdroj (AQ_OutputOff→5V, AQ2/AQ3→0V) | ✅ Implementováno (přes PermitOutput) |
| **Logging** | Pokračovat v logu (označit TRIP event) | ⚠️ Částečně |
| **HMI** | Zobrazit TRIP status + červený indikátor | ❌ TODO |
| **Stavy k resetu:** | | |
| - LabPSU.phase_rad | → 0.0 (aktuálně) nebo **-π/2** (lepší) | ⚠️ Reset na 0, ne -π/2 |
| - LabPSU.prevMode | → 0 | ❌ CHYBÍ |
| - LabPSU.CurrentSet_A | → 0.0 | ✅ Implementováno |
| - Spindel.RunLatched | → FALSE | ✅ Implementováno |
| - LogManager.TestActive | ??? Pokračovat nebo ukončit? | ❓ K ROZHODNUTÍ |

**Test scénář:**
1. Start testu (vřeteno 5000 RPM, LabPSU SINE 10A)
2. Počkat 30s
3. **Stisknout červené E-Stop tlačítko**
4. **Ověřit:**
   - Vřeteno se zastavilo (0 RPM)
   - LabPSU proud = 0A
   - AQ_OutputOff = 5V
   - HMI zobrazuje TRIP
   - Log obsahuje TRIP event s časem
5. Uvolnit E-Stop, stisknout Reset
6. **Ověřit:**
   - Systém ready
   - LabPSU.phase_rad resetován
   - Možnost znovu startovat test

**Priority:** 🔴 KRITICKÉ

---

### 2️⃣ **TEPLOTNÍ ALARM - Překročení maxima (65°C)**

**Trigger:** `AI1_Teplota_Lozisko_C > 65°C` NEBO `AI2_Teplota_Kartace_C > 65°C`

**Aktuální chování:**
- `TempHighLozisko := TRUE` nebo `TempHighKartace := TRUE`
- `TempAlarm := TRUE`
- `FB_SafetyGate.TripActive := TRUE`
- `PermitMotion := FALSE`

**Co se MÁ stát:**

| Subsystém | Akce | Status |
|-----------|------|--------|
| **Vřeteno** | Zastavit okamžitě | ✅ Implementováno |
| **LabPSU** | Vypnout zdroj | ✅ Implementováno (přes PermitOutput) |
| **Logging** | Pokračovat v logu (označit TEMP TRIP) | ⚠️ Částečně |
| **HMI** | Zobrazit TEMP ALARM + hodnotu teploty | ❌ TODO |
| **HMI** | Které čidlo (Ložisko/Kartáče)? | ❌ TODO |
| **Stavy k resetu:** | | |
| - LabPSU.phase_rad | → -π/2 | ⚠️ Reset na 0, ne -π/2 |
| - LabPSU.prevMode | → 0 | ❌ CHYBÍ |
| - LogManager.TestActive | Ukončit test (FALSE) | ❓ K ROZHODNUTÍ |
| - TempAlarm | Držet dokud neklesne < threshold - hyst | ❌ CHYBÍ hystereze |

**Test scénář:**
1. Start testu (vřeteno běží, LabPSU aktivní)
2. **Simulovat teplotu > 65°C** (DB_Config.InputSim nebo fyzicky)
3. **Ověřit:**
   - Vřeteno se zastavilo
   - LabPSU proud = 0A
   - HMI zobrazuje "TEMP ALARM - Ložisko: 68°C"
   - TripCode = 4 (Temp)
   - Log obsahuje TEMP TRIP event
4. Počkat, až teplota klesne < 63°C (hystereze 2°C)
5. **Ověřit:**
   - TempAlarm se automaticky vyresetoval
   - Možnost restartovat systém po Reset tlačítku

**Priority:** 🔴 KRITICKÉ

---

### 3️⃣ **VÝPADEK ELEKTRIKY - Power Loss & Recovery**

**Trigger:** Ztráta napájení PLC → obnovení napájení

**Aktuální chování:**
- PLC restart
- Všechny NON_RETAIN DB se resetují na default
- RETAIN DB (pokud použity) zachovány

**Co se MÁ stát:**

| Subsystém | Akce po restartu PLC | Status |
|-----------|----------------------|--------|
| **Vřeteno** | STOPPED, Enable=FALSE | ✅ Default v DB_HMI |
| **LabPSU** | OFF, Enable=FALSE | ✅ Default v DB_HMI |
| **Logging** | TestActive=FALSE, soubor uzavřen | ⚠️ Soubor může být poškozen |
| **HMI** | Zobrazit "SYSTEM RESTART" | ❌ TODO |
| **Safety** | TripActive=TRUE (dokud ne Reset) | ❓ K OVĚŘENÍ |
| **Stavy po restartu:** | | |
| - DB_LogRuntime.TestActive | → FALSE | ✅ NON_RETAIN |
| - DB_LogRuntime.FileName | → "" (ztraceno) | ⚠️ NON_RETAIN |
| - LabPSU.phase_rad | → 0.0 | ✅ Default |
| - LabPSU.prevMode | → 0 | ✅ Default |
| - LogBuffer data | → ztracena | ⚠️ NON_RETAIN |

**Rizika:**
- ❌ **Otevřený CSV soubor může být poškozen** (nedokončený zápis)
- ❌ **Data v bufferu se ztratí** (nebyla na SD)
- ❌ **Není jasné, že došlo k výpadku** (HMI neví o restartu)

**Možná řešení:**
1. **RETAIN flag pro kritická data** (FileName, LastFlushTimestamp)
2. **Recovery log** - při startu PLC zapsat "POWER LOSS DETECTED"
3. **File recovery** - pokusit se uzavřít posledně otevřený soubor
4. **HMI indikace** - zobrazit čas posledního restartu PLC

**Test scénář:**
1. Start testu (běží 5 minut, data se logují)
2. **Odpojit napájení PLC**
3. Počkat 10s
4. **Zapnout napájení**
5. **Ověřit:**
   - PLC naběhl do SAFE stavu
   - CSV soubor na SD - je čitelný? Kolik řádků?
   - HMI zobrazuje restart warning
   - Možnost znovu startovat test (nový soubor)
6. Otevřít CSV - ověřit integritu dat

**Priority:** 🟡 VYSOKÁ (data integrity)

---

### 4️⃣ **TEST TIMEOUT - Automatické ukončení**

**Trigger:** `LogManager.TestTimeoutReached := TRUE` (TestDuration_s uplynul)

**Aktuální chování:**
```scl
IF LogManager.TestTimeoutReached THEN
    "DB_HMI".Spindle.Stop := TRUE;      // Zastaví vřeteno
    "DB_HMI".LabPSU.Enable := FALSE;    // ✅ Vypne zdroj
    LogManager.TestActive := FALSE;     // Ukončí test
    FlushPending := TRUE;               // Finální flush
END_IF
```

**Co se MÁ stát:**

| Subsystém | Akce | Status |
|-----------|------|--------|
| **Vřeteno** | Zastavit plynule (rampa down) | ✅ Implementováno |
| **LabPSU** | Vypnout zdroj | ✅ Implementováno |
| **Logging** | Finální flush + uzavřít soubor | ⚠️ Flush ANO, uzavření TODO |
| **HMI** | Zobrazit "TEST COMPLETE" | ❌ TODO |
| **HMI** | Zobrazit celkový čas testu | ❌ TODO |
| **Stavy k resetu:** | | |
| - LabPSU.Enable | → FALSE | ✅ Implementováno |
| - LabPSU.phase_rad | → -π/2 (při SAFE OFF) | ⚠️ Reset na 0, ne -π/2 |
| - LabPSU.prevMode | → 0 | ❌ CHYBÍ |
| - LogManager.TestActive | → FALSE | ✅ Implementováno |
| - LogManager.TestTimeoutReached | → FALSE (auto-reset) | ✅ Implementováno |
| - Spindle.RunLatched | → FALSE | ✅ Implementováno |

**Test scénář:**
1. Nastavit TestDuration_s = 120 (2 minuty)
2. Start testu
3. Počkat 2 minuty
4. **Ověřit:**
   - Vřeteno se zastavilo
   - LabPSU proud = 0A
   - HMI zobrazuje "TEST COMPLETE - 00:02:00"
   - CSV soubor uzavřen
   - Log obsahuje poslední řádek dat
5. Zkontrolovat CSV soubor:
   - Obsahuje header?
   - Všechny řádky kompletní?
   - Poslední čas ≈ 120s?
6. Start nového testu
7. **Ověřit:**
   - Vytvoří se NOVÝ CSV soubor
   - LabPSU začne od 0A (SINE režim)

**Priority:** 🟢 NORMÁLNÍ

---

### 5️⃣ **MANUÁLNÍ STOP - Uživatel ukončil test**

**Trigger:** Uživatel stiskne Stop tlačítko na HMI → `DB_LogConfig.StopTest := TRUE`

**Aktuální chování:**
```scl
// FB_LogManager
IF StopTest AND NOT prevStopTest THEN
    TestActive := FALSE;
    FlushPending := TRUE;   // Finální flush
END_IF
```

**⚠️ PROBLÉM:** LabPSU.Enable se NEVYPÍNÁ!

**Co se MÁ stát:**

| Subsystém | Akce | Status |
|-----------|------|--------|
| **Vřeteno** | Zastavit (již implementováno v FB_DriveCtrl) | ✅ Implementováno |
| **LabPSU** | Vypnout zdroj | ❌ **CHYBÍ!** |
| **Logging** | Finální flush + uzavřít soubor | ⚠️ Flush ANO, uzavření TODO |
| **HMI** | Zobrazit "TEST STOPPED" | ❌ TODO |
| **HMI** | Zobrazit čas testu v okamžiku stop | ❌ TODO |
| **Stavy k resetu:** | | |
| - LabPSU.Enable | → FALSE | ❌ **CHYBÍ!** |
| - LabPSU.phase_rad | → -π/2 | ⚠️ CHYBÍ správný reset |
| - LabPSU.prevMode | → 0 | ❌ CHYBÍ |
| - LogManager.TestActive | → FALSE | ✅ Implementováno |
| - Spindle.RunLatched | → FALSE | ✅ Implementováno |

**Test scénář:**
1. Start testu (vřeteno 8000 RPM, LabPSU SINE 20A)
2. Počkat 1 minutu
3. **Stisknout Stop tlačítko na HMI**
4. **Ověřit:**
   - Vřeteno se zastavilo
   - **LabPSU proud = 0A** ← AKTUÁLNĚ CHYBA!
   - HMI zobrazuje "TEST STOPPED - 00:01:15"
   - CSV soubor uzavřen
   - Log obsahuje poslední řádek dat
5. Počkat 10s
6. **Ověřit:**
   - LabPSU stále OFF (nekopíruje poslední hodnoty)
7. Start nového testu
8. **Ověřit:**
   - LabPSU začne od 0A (SINE režim)

**Priority:** 🔴 KRITICKÉ - **BUG!**

---

## 📋 Souhrnná tabulka resetů stavů

| Stav / Proměnná | E-Stop | Temp Alarm | Power Loss | Auto Timeout | Manual Stop |
|-----------------|--------|------------|------------|--------------|-------------|
| **Vřeteno** | | | | | |
| Spindle.RunLatched | ✅ FALSE | ✅ FALSE | ✅ FALSE | ✅ FALSE | ✅ FALSE |
| AQ1_Voltage | ✅ 0V | ✅ 0V | ✅ 0V | ✅ 0V | ✅ 0V |
| **LabPSU** | | | | | |
| LabPSU.Enable | (via PermitOutput) | (via PermitOutput) | ✅ FALSE | ✅ FALSE | ❌ **CHYBÍ** |
| LabPSU.phase_rad | ⚠️ 0.0 | ⚠️ 0.0 | ✅ 0.0 | ⚠️ 0.0 | ⚠️ 0.0 |
| *Mělo by být:* | *-π/2* | *-π/2* | *0.0 OK* | *-π/2* | *-π/2* |
| LabPSU.prevMode | ❌ CHYBÍ | ❌ CHYBÍ | ✅ 0 | ❌ CHYBÍ | ❌ CHYBÍ |
| LabPSU.CurrentSet_A | ✅ 0.0 | ✅ 0.0 | ✅ 0.0 | ✅ 0.0 | ✅ 0.0 |
| AQ2/AQ3 | ✅ 0V | ✅ 0V | ✅ 0V | ✅ 0V | ✅ 0V |
| AQ_OutputOff | ✅ 5V | ✅ 5V | ✅ 5V | ✅ 5V | ✅ 5V |
| **Logging** | | | | | |
| TestActive | ❓ TBD | ❓ TBD | ✅ FALSE | ✅ FALSE | ✅ FALSE |
| FlushPending | ❓ TBD | ❓ TBD | ⚠️ Možná ztráta | ✅ TRUE | ✅ TRUE |
| CSV soubor | ❓ TBD | ❓ TBD | ⚠️ Možná korupce | ⚠️ TODO close | ⚠️ TODO close |
| **Safety/Status** | | | | | |
| TripActive | ✅ TRUE | ✅ TRUE | ❓ TBD | ✅ FALSE | ✅ FALSE |
| TripCode | ✅ 1 (E-Stop) | ✅ 4 (Temp) | ❓ TBD | - | - |
| **HMI Feedback** | | | | | |
| Status zobrazení | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO | ❌ TODO |

**Legenda:**
- ✅ = Implementováno správně
- ⚠️ = Implementováno, ale ne ideálně
- ❌ = Chybí, nutno implementovat
- ❓ = K rozhodnutí / diskuzi

---

## 🔧 Implementační úkoly (Priority)

### 🔴 KRITICKÉ (P0)

- [ ] **TASK-01:** Přidat vypnutí LabPSU při manuálním Stop
  - Lokace: OB Main, po detekci `DB_LogConfig.StopTest`
  - Kód: `"DB_HMI".LabPSU.Enable := FALSE;`

- [ ] **TASK-02:** Opravit reset fáze na -π/2 (místo 0.0) v FB_LabPSU
  - Lokace: FB_LabPSU, sekce SAFE OFF
  - Kód: `#phase_rad := -1.5707963;`

- [ ] **TASK-03:** Přidat reset prevMode při vypnutí zdroje
  - Lokace: FB_LabPSU, sekce SAFE OFF
  - Kód: `#prevMode := 0;`

### 🟡 VYSOKÉ (P1)

- [ ] **TASK-04:** Implementovat hysterezi pro teplotní alarm
  - Přidat `TempHighThreshold_Hysteresis_C : Real := 2.0` do DB_Config
  - Alarm ON: teplota > 65°C
  - Alarm OFF: teplota < 63°C

- [ ] **TASK-05:** Zavírání CSV souboru při ukončení testu
  - Implementovat v FB_LogFlushToSd
  - Volat při FlushPending=TRUE a TestActive=FALSE

- [ ] **TASK-06:** Power loss recovery
  - Přidat RETAIN proměnné pro kritická data
  - Detekce restartu PLC (čítač startů?)
  - Recovery log entry

### 🟢 NORMÁLNÍ (P2)

- [ ] **TASK-07:** HMI feedback pro všechny události
  - Obrazovka "Event Log" nebo popup
  - Zobrazení TripCode jako text
  - Historie posledních 10 eventů

- [ ] **TASK-08:** Test duration v hodinách (ne jen sekundách)
  - Přidat `TestDuration_Hours : Int` do HMI
  - Převod na sekundy v logice

- [ ] **TASK-09:** Rozhodnout o chování logu při TRIP
  - Pokračovat v logování? (ano - vidět průběh)
  - Označit TRIP v CSV? (nový sloupec?)

---

## 🧪 Testovací matice

| Test ID | Událost | Subsystém | Co testovat | Expected | Status |
|---------|---------|-----------|-------------|----------|--------|
| **T-ES-01** | E-Stop | Vřeteno | Zastaví se okamžitě | AQ1=0V, RPM→0 | ⬜ |
| **T-ES-02** | E-Stop | LabPSU | Vypne se zdroj | AQ_OutputOff=5V | ⬜ |
| **T-ES-03** | E-Stop | LabPSU | Reset fáze | phase_rad=-π/2 | ⬜ |
| **T-ES-04** | E-Stop | HMI | Zobrazí TRIP | StatusText="E-STOP" | ⬜ |
| **T-ES-05** | E-Stop | Log | Zaznamená event | CSV obsahuje TRIP | ⬜ |
| **T-TA-01** | Temp Alarm | SafetyGate | Aktivuje TRIP | TripActive=TRUE | ⬜ |
| **T-TA-02** | Temp Alarm | Vřeteno | Zastaví se | AQ1=0V | ⬜ |
| **T-TA-03** | Temp Alarm | LabPSU | Vypne se | AQ_OutputOff=5V | ⬜ |
| **T-TA-04** | Temp Alarm | HMI | Zobrazí teplotu | "TEMP: 68°C" | ⬜ |
| **T-TA-05** | Temp Alarm | Hystereze | Reset při poklesu | Alarm OFF < 63°C | ⬜ |
| **T-PL-01** | Power Loss | PLC | Restart OK | Systém naběhne | ⬜ |
| **T-PL-02** | Power Loss | CSV | Soubor čitelný | Otevřít bez chyby | ⬜ |
| **T-PL-03** | Power Loss | CSV | Počet řádků | Ztráta max 10 vzorků | ⬜ |
| **T-PL-04** | Power Loss | HMI | Indikace restartu | "RESTART DETECTED" | ⬜ |
| **T-TO-01** | Timeout | Test | Ukončí se | TestActive=FALSE | ⬜ |
| **T-TO-02** | Timeout | LabPSU | Vypne se | Enable=FALSE | ⬜ |
| **T-TO-03** | Timeout | CSV | Uzavře se | Soubor zavřený | ⬜ |
| **T-TO-04** | Timeout | HMI | Zobrazí čas | "COMPLETE: 02:00:00" | ⬜ |
| **T-MS-01** | Manual Stop | Vřeteno | Zastaví se | AQ1=0V | ⬜ |
| **T-MS-02** | Manual Stop | LabPSU | Vypne se | Enable=FALSE | ⬜ |
| **T-MS-03** | Manual Stop | CSV | Uzavře se | Soubor zavřený | ⬜ |
| **T-MS-04** | Manual Stop | Restart | SINE začne 0A | I(t=0)=0A | ⬜ |

**Legenda:** ⬜ TODO | ✅ PASS | ❌ FAIL | ⏸️ BLOCKED

---

## 📝 Poznámky k rozhodnutí

### ❓ Otázka 1: Co s logem při TRIP?
**Možnosti:**
- A) Ukončit log okamžitě (TestActive=FALSE)
- B) Pokračovat v logu dokud uživatel nepotvrdí Reset
- C) Zalogovat TRIP event a pak ukončit

**Doporučení:** **C** - zalogovat TRIP event (vidíme co se stalo) a pak ukončit

### ❓ Otázka 2: Hystereze pro teplotu?
**Aktuálně:** Alarm ON i OFF na 65°C (může blikat)
**Návrh:** 
- Alarm ON: > 65°C
- Alarm OFF: < 63°C (hystereze 2°C)

**Doporučení:** Implementovat hysterezi

### ❓ Otázka 3: Test duration v hodinách?
**Aktuálně:** `TestDuration_s : DInt` (sekundy)
**Návrh:** Přidat HMI pole pro hodiny, převést na sekundy

**Doporučení:** ANO - uživatelsky přívětivější

---

## 🔄 Status tracking

| Verze | Datum | Změna | Autor |
|-------|-------|-------|-------|
| 1.0 | 2026-07-24 | Vytvoření backlogu | System analysis |

---

**Next Steps:**
1. Review s týmem
2. Prioritizace P0 úkolů
3. Implementace TASK-01 až TASK-03
4. Testování podle matice
5. Update dokumentace
