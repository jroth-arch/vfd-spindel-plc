# Změna generování sinusového proudu - perioda v minutách

**Datum:** 2026-07-22  
**Typ:** Změna požadavků - úprava parametrů LabPSU

---

## Důvod změny

Původní implementace používala frekvenci v Hz (0.1-10 Hz) pro generování sinusového proudu, což odpovídalo periodám 0.1s - 10s. 

**Nový požadavek:** Perioda sinusy má být v **minutách** pro dlouhodobé testování opotřebení uhlíkových kartáčů.

---

## Provedené změny

### 1. PLC Program (program.scl)

#### FB_LabPSU - Input parametr
**PŘED:**
```scl
DebugFrequency_Hz : Real := 2.0;   // frekvence sinu pro debug
```

**PO:**
```scl
DebugPeriod_min : Real := 10.0;   // perioda sinu v minutách (default 10 min)
```

#### Výpočet omega (úhlová rychlost)
**PŘED:**
```scl
#omega := 6.2831853 * #DebugFrequency_Hz; // 2*pi*f
```

**PO:**
```scl
// Vypocet omega z periody v minutach: omega = 2*pi / (T_min * 60)
IF #DebugPeriod_min > 0.0 THEN
    #omega := 6.2831853 / (#DebugPeriod_min * 60.0); // 2*pi / (T_min * 60s)
ELSE
    #omega := 0.0; // ochrana proti dělení nulou
END_IF;
```

#### DB_HMI struktura
```scl
LabPSU : Struct
   ...
   DebugPeriod_min : Real;  // změněno z DebugFrequency_Hz
   ...
END_STRUCT;
```

#### Defaultní hodnota
```scl
LabPSU.DebugPeriod_min := 10.0;  // 10 minut
```

---

## Parametry

| Parametr | Starý | Nový |
|----------|-------|------|
| **Název** | `DebugFrequency_Hz` | `DebugPeriod_min` |
| **Typ** | Real | Real |
| **Rozsah** | 0.1 - 10 Hz | 1 - 60 min |
| **Default** | 2.0 Hz (perioda 0.5s) | 10.0 min (perioda 600s) |
| **Jednotka** | Hz (cykly za sekundu) | min (minuty) |
| **HMI Label** | "Frekvence [Hz]" | "Perioda [min]" |

---

## Matematika

### Vztah perioda ↔ frekvence:
```
T [s] = 1 / f [Hz]
f [Hz] = 1 / T [s]
```

### Převod periody v minutách na úhlovou rychlost:
```
T [min] → T [s] = T_min × 60
f [Hz] = 1 / (T_min × 60)
ω [rad/s] = 2π × f = 2π / (T_min × 60)
```

### Příklady:
| Perioda [min] | Perioda [s] | Frekvence [Hz] | Úhlová rychlost ω [rad/s] |
|---------------|-------------|----------------|---------------------------|
| 1 min         | 60 s        | 0.0167 Hz      | 0.1047 rad/s              |
| 10 min        | 600 s       | 0.00167 Hz     | 0.01047 rad/s             |
| 30 min        | 1800 s      | 0.000556 Hz    | 0.00349 rad/s             |
| 60 min        | 3600 s      | 0.000278 Hz    | 0.00175 rad/s             |

---

## Aktualizované soubory

### PLC:
- ✅ [plc/program.scl](../plc/program.scl) - FB_LabPSU, DB_HMI, volání FB

### Dokumentace:
- ✅ [docs/hmi_tag_table.md](hmi_tag_table.md) - HMI tagy
- ✅ [docs/architecture.md](architecture.md) - architektura
- ✅ [docs/test_specification.md](test_specification.md) - SAT-06 test
- ✅ [docs/user_specification.md](user_specification.md) - HMI-106
- ✅ [docs/customer_handover_backlog.md](customer_handover_backlog.md) - HO-03

### Testy:
- ✅ [html/webtestapp/app.js](../html/webtestapp/app.js) - SAT-06 test

---

## HMI Požadavky

### Zobrazení na obrazovce Lab PSU:

**Input pole:**
- Tag: `"DB_HMI".LabPSU.DebugPeriod_min`
- Rozsah: **1 - 60 minut**
- Label: **"Perioda [min]"**
- Viditelnost: Pouze když Mode = 2 (SINE_DEBUG)
- Validace: 
  - Min: 1.0 min
  - Max: 60.0 min
  - Step: 0.1 nebo 1.0 (dle preference)

**Display formát:**
- Zobrazit jako: "10.0 min" nebo "10 minut"
- Případně i vypočítanou periodu v sekundách (pro kontrolu)

---

## Testování

### SAT-06 - SINE_DEBUG test
**Aktualizované hodnoty:**
```
Writes:
- "DB_HMI".LabPSU.DebugPeriod_min = 10.0

Checks:
- "DB_HMI".LabPSU.DebugPeriod_min == 10.0
```

### Ruční test:
1. Nastavit Mode = 2 (SINE_DEBUG)
2. Nastavit DebugPeriod_min = 10.0 (10 minut)
3. DebugAmplitude_A = 5.0 A
4. CurrentOffset_A = 5.0 A
5. Spustit zdroj
6. **Pozorovat:** Proud by měl cyklovat 0-10A s periodou 10 minut
   - Min: 0A (po 5 min)
   - Max: 10A (po 0 a 10 min)
7. Změřit čas jednoho cyklu multimetrem/osciloskopem (očekáváno: 600s ±2%)

---

## Kompatibilita

### ⚠️ Breaking Change
Toto je **breaking change** - stará konfigurace nebude fungovat!

**Migrace:**
- Starý program s `DebugFrequency_Hz` **musí být aktualizován**
- Po nahrání nového programu ztratí původní hodnoty v DB_HMI
- **Doporučení:** Po nahrání nastavit všechny LabPSU parametry znovu

### Rollback plán:
Pokud by bylo potřeba vrátit starou funkcionalitu:
1. Změnit parametr zpět na `DebugFrequency_Hz`
2. Změnit výpočet omega na: `#omega := 6.2831853 * #DebugFrequency_Hz;`
3. Aktualizovat DB_HMI strukturu a inicializaci
4. Aktualizovat dokumentaci

---

## Poznámky pro údržbu

1. **Rozsah 1-60 min** je rozumný kompromis:
   - Min 1 min: Umožňuje rychlejší testování
   - Max 60 min: Dostatečně pomalý cyklus pro dlouhodobé testy
   - Lze rozšířit na 120 min pokud potřeba

2. **Ochrana proti dělení nulou:**
   ```scl
   IF #DebugPeriod_min > 0.0 THEN
       #omega := 6.2831853 / (#DebugPeriod_min * 60.0);
   ELSE
       #omega := 0.0;  // bezpečný stav
   END_IF;
   ```

3. **Fáze sinusu se resetuje** při změně Mode nebo Disable
   - Každý start začíná od fáze 0 (maximum proudu)

4. **StatusText** zůstává stejný:
   - "SINE DEBUG" nebo "SINE DEBUG (AUTO OFFSET)"

---

## Reference

- Původní kalibrace: [labpsu_calibration.md](labpsu_calibration.md)
- Architektura: [architecture.md](architecture.md)
- HMI tagy: [hmi_tag_table.md](hmi_tag_table.md)

---

**Změnu provedl:** GitHub Copilot (Claude Sonnet 4.5)  
**Datum implementace:** 2026-07-22  
**Ověřeno:** ⚠️ Čeká na test
