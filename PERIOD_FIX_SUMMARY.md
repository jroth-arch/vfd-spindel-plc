# Oprava periody sinusového proudu laboratorního zdroje

**Datum:** 2026-07-23  
**Typ:** Bug fix - oprava výpočtu periody

---

## Problém

Když uživatel zadal periodu **1 minuta** na HMI, skutečná perioda výstupního sinusového proudu byla **10 minut** (10× delší než zadaná hodnota).

---

## Příčina

FB_LabPSU se volá v **OB30 "TimeSensitive"** s periodou **100 ms**, ale parametr `Cycle_s` byl chybně inicializován na **0.01s (10ms)** místo **0.1s (100ms)**.

### Výpočet fáze v FB_LabPSU:

```scl
omega := 2*π / (T_min * 60s)
phase_rad := phase_rad + (omega * Cycle_s)
```

Když je `Cycle_s = 0.01` (10ms), ale skutečný cyklus OB30 je 100ms:
- Fáze roste 10× pomaleji než by měla
- **Výsledek:** Perioda je 10× delší

### Příklad:

| Zadaná perioda | Očekáváno | Skutečnost (BUG) | Chyba |
|----------------|-----------|------------------|-------|
| 1 min | 1 min | **10 min** | 10× |
| 5 min | 5 min | **50 min** | 10× |
| 10 min | 10 min | **100 min** | 10× |

---

## Řešení

Opravena inicializační hodnota `Cycle_s` v DB_HMI:

### Před opravou:

```scl
BEGIN
    LabPSU.Enable := false;
    LabPSU.Cycle_s := 0.01;  // ❌ ŠPATNĚ - neodpovídá OB30 (100ms)
    ...
```

### Po opravě:

```scl
BEGIN
    LabPSU.Enable := false;
    LabPSU.Cycle_s := 0.1;   // ✅ SPRÁVNĚ - OB30 = 100ms = 0.1s
    ...
```

---

## Ověření

Po opravě by měla perioda odpovídat zadané hodnotě:

| Zadaná perioda | Očekávaná skutečnost | Jak ověřit |
|----------------|----------------------|------------|
| 1 min | 1 minuta ±1s | Sledovat ampermetr: čas od maxima k maximu = 60s |
| 5 min | 5 minut ±2s | Měřit časovačem od maxima k maximu = 300s |
| 10 min | 10 minut ±5s | Měřit časovačem od maxima k maximu = 600s |

### Testovací postup:

1. Nahrát opravený program do PLC
2. Nastavit Mode = 2 (SINE_DEBUG)
3. Nastavit DebugPeriod_min = 1.0 (1 minuta)
4. Nastavit DebugAmplitude_A = 10.0
5. Nastavit CurrentOffset_A = 20.0
6. Enable = TRUE
7. Sledovat ampermetr - proud by měl oscilovat **10-30A s periodou 60 sekund**
8. Změřit čas mezi dvěma maximy (30A) → **očekáváno: 60s ±1s**

---

## Dopad na stávající testy

⚠️ **POZOR:** Pokud byly provedeny testy před touto opravou:

- **Všechny zaznamenané periody byly 10× delší než zamýšleno**
- Příklad: Test s periodou "10 min" ve skutečnosti běžel s periodou **100 min**
- **Doporučení:** Přehodnotit/opakovat testy s korigovanou periodou

---

## Změněné soubory

| Soubor | Změna |
|--------|-------|
| plc/program.scl | `LabPSU.Cycle_s := 0.1` (řádek 462) |
| docs/architecture.md | Upřesněn popis Cycle_s - musí odpovídat periodě OB |

---

## Technické poznámky

1. **Cycle_s je kritický parametr:**
   - Musí **přesně odpovídat** periodě OB, ve kterém se FB_LabPSU volá
   - OB30 "TimeSensitive" = 100ms → Cycle_s = 0.1s
   - Pokud by byl FB přesunut do jiného OB, Cycle_s musí být aktualizován!

2. **HMI editovatelnost:**
   - Cycle_s je v DB_HMI, takže technicky lze změnit z HMI
   - **NEDOPORUČENO měnit z HMI** - může vést k chybám
   - Pro servisní přístup: pole lze zobrazit jako read-only

3. **Validace na HMI:**
   - Pokud má uživatel možnost editovat Cycle_s z HMI:
     - Rozsah: 0.001–1.0s
     - **Doporučená hodnota: 0.1s (OB30)**
     - Zobrazit varování při změně

4. **Alternativní řešení (budoucí):**
   - Cycle_s by mohl být automaticky detekován z periody OB
   - Vyžaduje použití `RUNTIME` nebo podobné funkce

---

## Autor

Bug identifikován a opraven: 2026-07-23  
Nahlásil: Uživatel (sledování ampermetru)  
Opravil: PLC program + dokumentace
