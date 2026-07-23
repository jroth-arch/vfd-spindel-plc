# Změna limitu proudu laboratorního zdroje - Souhrn

**Datum:** 2026-07-23  
**Typ:** Implementační dokument - změna podle požadavku zákazníka  
**Požadavek:** Omezit maximální výstupní proud laboratorního zdroje z 60A na 38A

---

## Požadavek zákazníka

Zákazník požaduje omezení maximálního proudu laboratorního zdroje BK1900B na **38A** (původní limit 60A).
Proud vyšší než 38A nesmí být možné nastavit. Zároveň je požadován feedback na HMI, když uživatel zkusí zadat vyšší proud než je povolený limit.

---

## Implementované změny

### 1. PLC Program (program.scl)

#### 1.1 DB_HMI - Rozšíření struktury LabPSU

**Přidány nové položky:**
```scl
LabPSU : Struct
   ...
   MaxCurrent_A : Real;              // Konfigurovatelný max. limit proudu
   CurrentLimitExceeded : Bool;      // Flag - uživatel překročil limit
END_STRUCT;
```

**Inicializace:**
```scl
LabPSU.MaxCurrent_A := 38.0;           // Nastaveno na požadavek zákazníka
LabPSU.CurrentLimitExceeded := false;
```

#### 1.2 FB_LabPSU - Přidání výstupu a logiky

**Nový output:**
```scl
VAR_OUTPUT
   ...
   CurrentLimitExceeded : Bool := false;  // Indikátor překročení limitu
END_VAR
```

**Detekční logika v mode 1 (CONST):**
```scl
// Před clampingem - kontrola, jestli uživatel zkusil zadat více než limit
IF #targetCurrent_A > #PSU_MaxCurrent_A THEN
    #CurrentLimitExceeded := true;
END_IF;
```

**Detekční logika v mode 2 (SINE_DEBUG):**
```scl
// Před clampingem - kontrola výsledného proudu (offset + amplituda)
IF #targetCurrent_A > #PSU_MaxCurrent_A THEN
    #CurrentLimitExceeded := true;
END_IF;
```

**Reset flagu:**
- Flag se resetuje na začátku každého cyklu
- Flag se nastaví na false při SAFE OFF

#### 1.3 Volání FB_LabPSU - Použití konfigurovatelného limitu

**Změna:**
```scl
// PŘED:
PSU_MaxCurrent_A := 60.0,

// PO:
PSU_MaxCurrent_A := "DB_HMI".LabPSU.MaxCurrent_A,
```

**Propagace flagu:**
```scl
CurrentLimitExceeded => "DB_HMI".LabPSU.CurrentLimitExceeded
```

---

### 2. Dokumentace

#### 2.1 user_specification.md

**Změněny rozsahy:**
- HMI-102 (Konstantní proud): 0–**38 A** (dříve 0–60 A)
- HMI-104 (DC offset): 0–**38 A** (dříve 0–60 A)
- HMI-105 (Amplituda sinu): 0–**38 A** (dříve 0–60 A)

**Přidány nové HMI požadavky:**
- **HMI-108b:** Zobrazení max. limitu (`DB_HMI.LabPSU.MaxCurrent_A`)
- **HMI-108c:** ⚠️ Varovný indikátor při překročení limitu (červené pole, viditelné pouze když `CurrentLimitExceeded = TRUE`)

#### 2.2 architecture.md

**Změněn parametr:**
```
PSU_MaxCurrent_A    real    38.0    — Max. proud (limit zákazníka)
```

**Aktualizována poznámka:**
```
Výstup je vždy clampován na 0–38 A (limit zákazníka).
```

#### 2.3 labpsu_calibration.md

**Přidána poznámka:**
```
5. ⚠️ LIMIT PROUDU - Požadavek zákazníka (2026-07-23)
   - Hardwarový limit zdroje BK1900B: 60A
   - Konfigurovaný limit v PLC: 38A (DB_HMI.LabPSU.MaxCurrent_A)
   - Důvod: Požadavek zákazníka na omezení maximálního proudu
   - Změna limitu: Upravit hodnotu v DB_HMI nebo přímo na HMI panelu
```

---

## Chování systému

### Scénář 1: Konstantní proud (Mode=1)

1. Uživatel zadá `ConstCurrent_A = 45.0` (překračuje limit 38A)
2. PLC nastaví `CurrentLimitExceeded = TRUE`
3. Proud je clampnut na 38A (skutečný výstup = 38A)
4. HMI zobrazí červené varovné pole: "⚠️ VAROVÁNÍ: Zadaný proud překračuje max. limit!"

### Scénář 2: Sinusový režim (Mode=2)

1. Uživatel zadá `DebugAmplitude_A = 20.0` a `CurrentOffset_A = 25.0`
2. Výsledný proud: 25 + 20×sin(t) = 5–45A (maximum 45A překračuje limit 38A)
3. PLC nastaví `CurrentLimitExceeded = TRUE` v momentě, kdy sin(t) způsobí překročení
4. Proud je clampnut na 38A
5. HMI zobrazí varovné pole

### Scénář 3: Proud v limitu

1. Uživatel zadá `ConstCurrent_A = 30.0` (v rámci limitu 38A)
2. `CurrentLimitExceeded = FALSE`
3. Proud = 30A (bez omezení)
4. HMI varovné pole není viditelné

---

## Implementace na HMI

### Doporučený layout (Lab PSU Screen)

```
┌─────────────────────────────────────────┐
│ Lab PSU - Nastavení                     │
├─────────────────────────────────────────┤
│ Režim: [●CONST] [ ]SINE  [ ]OFF        │
│                                          │
│ Konstantní proud [A]: [_30.0_]          │
│ Max limit: 38.0 A (read-only)           │
│                                          │
│ ⚠️ VAROVÁNÍ: Zadaný proud překračuje   │
│    max. limit! (pouze pokud překročeno) │
│                                          │
│ Aktuální stav:                          │
│ - Napětí: 2.5 V                         │
│ - Proud: 30.0 A                         │
│ - Status: CONST MODE                    │
│                                          │
│ [< Zpět]                  [Povolit PSU] │
└─────────────────────────────────────────┘
```

### Implementační detaily HMI

**Varovné pole (HMI-108c):**
- Typ: Text Label nebo Rectangle s textem
- Viditelnost: `"DB_HMI".LabPSU.CurrentLimitExceeded`
- Barva pozadí: Červená (#FF0000)
- Barva textu: Bílá (#FFFFFF)
- Font: Bold
- Animace (volitelně): Blikání při aktivaci

---

## Testování

### Test 1: Základní clamping

1. Nastavit Mode=1 (CONST)
2. Zadat ConstCurrent_A = 45.0
3. **Očekávaný výsledek:**
   - CurrentSet_A = 38.0 (clampnuto)
   - CurrentLimitExceeded = TRUE
   - HMI zobrazí varování

### Test 2: Proud v limitu

1. Nastavit Mode=1 (CONST)
2. Zadat ConstCurrent_A = 30.0
3. **Očekávaný výsledek:**
   - CurrentSet_A = 30.0 (bez omezení)
   - CurrentLimitExceeded = FALSE
   - HMI varování skryto

### Test 3: Sinus s překročením

1. Nastavit Mode=2 (SINE_DEBUG)
2. Zadat DebugAmplitude_A = 20.0, CurrentOffset_A = 25.0
3. **Očekávaný výsledek:**
   - V maximu sinu (sin=1): CurrentSet_A = 38.0 (clampnuto z 45.0)
   - CurrentLimitExceeded = TRUE
   - HMI zobrazí varování

---

## Změna limitu v budoucnu

Pokud bude potřeba změnit limit:

### Varianta A: Přímá změna v DB_HMI
```scl
BEGIN
   LabPSU.MaxCurrent_A := 50.0;  // Nový limit
   ...
END_DATA_BLOCK
```

### Varianta B: HMI konfigurace
- Vytvořit editovatelné pole na Configuration Screen
- Uložit hodnotu do RETAIN DB pro zachování po restartu
- Doporučeno přidat heslo pro přístup (servisní úroveň)

---

## Poznámky

1. **Kalibrace zachována a nezávislá:** 
   - Změna limitu 60A→38A ovlivňuje POUZE clamping zadané hodnoty
   - Kalibrovaný přepočet `U = (I / 15.92) + 0.383` zůstává NEZMĚNĚN
   - Přepočet platí pro celý rozsah 0-60A (hardwarový limit zdroje)
   - **Průběh signálu:** Zadaná hodnota → Clamp na 38A → Kalibrovaný přepočet → 0-5V výstup

2. **Hardwarový vs. softwarový limit:**
   - **Hardwarový limit zdroje BK1900B:** 60A (fyzická kapacita)
   - **Softwarový limit pro zadání (PSU_MaxCurrent_A):** 38A (požadavek zákazníka)
   - **Kalibrační rozsah:** 0-60A (přepočet funguje korektně v celém hardwarovém rozsahu)
   - Pokud by byl limit změněn např. na 50A, kalibrace by fungovala stejně správně

3. **Feedback je real-time:** Flag `CurrentLimitExceeded` se vyhodnocuje každý cyklus (10ms), takže HMI dostane okamžitou odezvu.

4. **Bezpečnost:** Při aktivaci SAFE OFF (emergency stop, safety gate) je flag resetován a proud nastaven na 0.

---

## Soubory změněné v této aktualizaci

| Soubor | Změna |
|--------|-------|
| plc/program.scl | Přidán MaxCurrent_A a CurrentLimitExceeded do DB_HMI, upravena logika FB_LabPSU |
| docs/user_specification.md | Aktualizovány rozsahy 60A→38A, přidány HMI-108b a HMI-108c |
| docs/architecture.md | Aktualizován PSU_MaxCurrent_A na 38.0, poznámka o clampingu |
| docs/labpsu_calibration.md | Přidána poznámka o změně limitu podle požadavku zákazníka |
| docs/current_limit_change_summary.md | Tento dokument (nový) |

---

## Autor

Dokumentace vytvořena: 2026-07-23  
Implementace v PLC: program.scl, FB_LabPSU, DB_HMI
