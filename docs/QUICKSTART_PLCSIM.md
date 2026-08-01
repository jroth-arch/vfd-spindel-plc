# QUICK START - PLCSim Advanced + WinCC Runtime

## 🚀 Rychlý start za 5 minut

### 1. Příprava (jednorázově)

**PLCSim Advanced:**
1. Spusť TIA Portal
2. Otevři projekt: `tia/vfd-spindel-plc-plcsim-wincc/vfd-spindel-plc-plcsim-wincc.ap20`
3. Pravý klik na PLC → **Start Simulation**
4. V PLCSim Advanced: **Memory Cards** → **Card 1** → **Insert memory card** (vytvoř novou nebo vyber existující)

**Program je již nakonfigurovaný pro simulaci!** ✅

### 2. Spuštění testu

**Z WinCC Runtime:**

1. Spusť WinCC Runtime (F5 v TIA Portal)
2. V panelu **Logging:**
   - **Test Duration:** 60 (sekund)
   - **Flush Every N:** 5 (vzorků)
3. Klikni **START TEST** ▶️

**Co se stane automaticky:**
- ✅ Vřeteno se rozběhne na 12000 RPM
- ✅ Teploty nastaveny na 45°C a 50°C (bezpečné)
- ✅ Safety je OK (žádný trip)
- ✅ Po **30 sekundách** se zapíše první dávka dat na kartu
- ✅ Po 60 sekundách test automaticky skončí

### 3. Kontrola výsledku

**Během testu sleduj:**
- **Status:** TEST RUNNING (zelená barva)
- **Elapsed Time:** roste (00:00:06, 00:00:12, ...)
- **Sample Counter:** roste (1, 2, 3, ...)

**Po 30 sekundách:**
- **Last Flush OK:** ✅ TRUE
- **Flush Error Count:** 0

**Po skončení:**
1. V PLCSim Advanced: **Memory Cards** → **Card 1** → **Show in Windows Explorer**
2. Otevři složku: `UserFiles\`
3. Soubor: `20260801-143025.csv` (tvůj timestamp)
4. Otevři v Excelu → uvidíš 5 řádků dat

---

## ⚡ Super rychlý test (3 sekundy)

Pokud nechceš čekat 30 sekund:

**V Watch Table nebo online view:**
```
DB_Config.SimMode.TimeAcceleration := 10.0
```

Spusť test → první flush za **3 sekundy** místo 30!

---

## 🛠️ Manuální ovládání (bez auto-startu)

Pokud chceš ovládat vřeteno ručně:

**V Watch Table:**
```
DB_Config.SimMode.AutoStartSpindle := FALSE
```

**Z WinCC:**
1. Spusť test (START TEST)
2. V panelu **Spindle** klikni **START** ▶️
3. Nastav otáčky: **Speed RPM:** 15000

---

## 📊 Co najdeš v CSV souboru

```
t_s,RPM,T_Lozisko,T_Uhliky,Vibrace,ProudUhliky,State,RunLatched,TripActive,TripCode,SafetyText
0.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
6.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
12.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
18.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
24.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
```

---

## 🔧 Nastavení simulace (pokročilé)

Všechna nastavení jsou v `DB_Config.SimMode`:

| Parametr | Výchozí | Změň na | Účel |
|----------|---------|---------|------|
| `Enable` | TRUE | - | Zapnout simulaci |
| `AutoStartSpindle` | TRUE | FALSE | Manuální start vřetena |
| `SpindleSpeed_RPM` | 12000.0 | 15000.0 | Jiné otáčky |
| `TempLozisko_C` | 45.0 | 70.0 | Simulovat přehřátí |
| `TempKartace_C` | 50.0 | 40.0 | Změnit teplotu |
| `TimeAcceleration` | 1.0 | 10.0 | 10× rychlejší test |

---

## ❌ Řešení problémů

### Vřeteno se nerozběhlo
**Kontrola:** `DB_Status.Safety.TripActive = FALSE`?  
**Řešení:** Zkontroluj `DB_Config.SimMode.Enable = TRUE`

### Soubor se nevytvořil
**Kontrola:** `DB_LogRuntime.LastFlushOk = TRUE`?  
**Řešení:** Zkontroluj, že je SD karta připojená v PLCSim Advanced

### Test se hned zastavil
**Kontrola:** `DB_LogConfig.TestDuration_s >= 60`?  
**Řešení:** Nastav delší dobu testu

---

## 📚 Detailní dokumentace

Pro více informací viz [PLCSim Advanced Testing Guide](plcsim_advanced_testing_guide.md)
