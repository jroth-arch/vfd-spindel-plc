# Kalibrace laboratorního zdroje BK1900B

**Datum:** 2026-07-18  
**Typ:** Technická dokumentace - kalibrace analogového výstupu

---

## Problém

Laboratorní zdroj BK1900B nemá lineární odezvu v celém rozsahu 0-5V řídicího napětí:
- **Dead zone:** 0-0,4V → zdroj nereaguje, proud = 0A
- **Aktivní oblast:** 0,4-5V → lineární závislost I = f(U)

Původní implementace FB_LabPSU předpokládala ideální lineární mapování 0-60A → 0-5V, což vedlo k:
- Nepřesnosti v nižších proudech
- "Ztracenému" prvnímu ampéru kvůli dead zone

---

## Řešení

### Měření charakteristiky

Naměřeno **46 bodů** v rozsahu 0,35-2,6V (pokrývá 0-35A):
- Soubor: [labpsu_charakteristika.csv](labpsu_charakteristika.csv)
- Metoda: Manuální měření multimetrem

### Analýza dat

Provedena lineární regrese:
```
I [A] = 15.92 × U [V] - 6.09
R² = 0.9999  (excelentní linearita!)
```

**Inverzní vztah (pro PLC):**
```
U_ctrl [V] = (I [A] / 15.92) + 0.383
```

### Klíčové parametry:

| Parametr | Hodnota | Poznámka |
|----------|---------|----------|
| Dead zone | **0.383 V** | Pod touto hodnotou zdroj nereaguje |
| Slope | **15.92 A/V** | Strmost charakteristiky |
| Max proud při 5V | **73.5 A** | Teoreticky (zdroj omezen na 60A HW) |
| Napětí pro 60A | **4.15 V** | Bezpečně v rozsahu 0-5V |

---

## Implementace v PLC

### FB_LabPSU - upravený výpočet

**Původní kód:**
```scl
// Idealní lineární mapování (nesprávné)
#AQ3_CurrentCtrl_V := (#CurrentSet_A / #PSU_MaxCurrent_A) * #RemoteMaxCtrl_V;
// Pro 30A: U = (30 / 60) * 5 = 2.5V
```

**Nový kód (kalibrovaný):**
```scl
// Kalibrovany prepocet na zaklade mereni
// I [A] = 15.92 * U [V] - 6.09  ->  U [V] = (I [A] / 15.92) + 0.383
// Dead zone: 0.383 V
IF #CurrentSet_A > 0.0 THEN
    #AQ3_CurrentCtrl_V := (#CurrentSet_A / 15.92) + 0.383;
ELSE
    #AQ3_CurrentCtrl_V := 0.0;
END_IF;
// Pro 30A: U = (30 / 15.92) + 0.383 = 2.27V
```

### Rozdíl:

| Cílový proud | Původní U_ctrl | Kalibrovaný U_ctrl | Rozdíl |
|--------------|----------------|---------------------|--------|
| 0 A | 0.00 V | 0.00 V | — |
| 10 A | 0.83 V | **1.01 V** | +0.18 V |
| 30 A | 2.50 V | **2.27 V** | -0.23 V |
| 60 A | 5.00 V | **4.15 V** | -0.85 V |

---

## Ověření

### Testovací postup:

1. Nahrát upravený program do PLC
2. Nastavit režim **CONST** (Mode=1)
3. Postupně testovat proudy: 0A, 10A, 30A, 60A
4. Změřit skutečný výstupní proud zdroje
5. Porovnat s požadovaným proudem

### Očekávaný výsledek:

- **Přesnost:** ±0.5A v celém rozsahu 0-60A
- **Dead zone:** Automaticky kompenzována
- **Sinus:** Správný offset i pro nízké amplitudy

---

## Soubory

| Soubor | Popis |
|--------|-------|
| [labpsu_charakteristika.csv](labpsu_charakteristika.csv) | Surová naměřená data |
| [labpsu_analyza.png](labpsu_analyza.png) | Grafy: charakteristika + inverzní vztah |
| [labpsu_residuals.png](labpsu_residuals.png) | Reziduály (kontrola kvality fitu) |
| [../plc/program.scl](../plc/program.scl) | Upravený PLC kód (FB_LabPSU, ř. 754-762) |
| [../analyze_psu_characteristic.py](../analyze_psu_characteristic.py) | Python skript pro analýzu |

---

## Poznámky pro údržbu

1. **Konstanta 15.92** je specifická pro tento konkrétní zdroj BK1900B
   - Při výměně zdroje: **opakovat měření!**
   
2. **Dead zone 0.383V** může být mírně odlišná pro jiný kus
   - Symptom: zdroj reaguje "později" nebo "dříve"
   - Řešení: Změnit konstantu v řádku 759

3. **Sinus režim** nyní správně kompenzuje dead zone
   - Amplituda 5A + offset 0A → výstup 0-10A (dříve ztráta kvůli dead zone)

4. **Napěťové mapování** (AQ2_VoltageCtrl_V) zůstává **beze změny**
   - Charakteristika napětí nebyla měřena

5. **⚠️ LIMIT PROUDU - Požadavek zákazníka (2026-07-23)**
   - Hardwarový limit zdroje BK1900B: 60A (fyzická kapacita)
   - **Konfigurovaný limit pro zadání v PLC: 38A** (DB_HMI.LabPSU.MaxCurrent_A)
   - Důvod: Požadavek zákazníka na omezení maximálního proudu
   - Změna limitu: Upravit hodnotu v DB_HMI nebo přímo na HMI panelu
   - **⚠️ DŮLEŽITÉ:** Kalibrovaný přepočet `U = (I/15.92) + 0.383` **není ovlivněn** změnou limitu!
     - Přepočet platí pro celý rozsah 0-60A
     - Limit 38A ovlivňuje pouze clamping zadané hodnoty před přepočtem
     - Průběh: Zadání → Clamp na 38A → Kalibrovaný přepočet → AQ3 (0-5V)
   - Předpokládá se lineární 0-16V → 0-5V

---

## Reference

- User specification: [user_specification.md](user_specification.md)
- Technical requirements: [technical_requirements.md](technical_requirements.md)
- Architecture: [architecture.md](architecture.md)
- Test specification: [test_specification.md](test_specification.md) - **aktualizovat SAT-04!**

---

**Změnu provedl:** GitHub Copilot (Claude Sonnet 4.5)  
**Ověřeno:** ⚠️ Čeká na FAT test
