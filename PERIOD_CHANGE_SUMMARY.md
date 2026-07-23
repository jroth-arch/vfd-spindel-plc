# 🔄 ZMĚNA - Perioda sinusu v minutách (2026-07-22)

## Co se změnilo

**Původní:** Frekvence v Hz (0.1-10 Hz) → perioda 0.1s - 10s  
**Nově:** Perioda v minutách (1-60 min) → perioda 60s - 3600s

---

## ⚡ Rychlý přehled změn

| Položka | Před | Po |
|---------|------|-----|
| **Parametr** | `DebugFrequency_Hz` | `DebugPeriod_min` |
| **Rozsah** | 0.1 - 10 Hz | 1 - 60 min |
| **Default** | 2.0 Hz (0.5s) | 10.0 min (600s) |
| **HMI Label** | "Frekvence [Hz]" | "Perioda [min]" |
| **Výpočet** | `ω = 2π × f` | `ω = 2π / (T × 60)` |

---

## 📝 Upravené soubory

### ✅ PLC:
- [plc/program.scl](plc/program.scl) (5 změn)
  - FB_LabPSU input parametr
  - Výpočet omega s ochranou proti dělení nulou
  - DB_HMI struktura
  - Defaultní hodnota
  - Volání FB

### ✅ Dokumentace:
- [docs/labpsu_period_change.md](docs/labpsu_period_change.md) - **NOVÝ**
- [docs/hmi_tag_table.md](docs/hmi_tag_table.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/test_specification.md](docs/test_specification.md)
- [docs/user_specification.md](docs/user_specification.md)
- [docs/customer_handover_backlog.md](docs/customer_handover_backlog.md)

### ✅ Testy:
- [html/webtestapp/app.js](html/webtestapp/app.js)

---

## ⚠️ BREAKING CHANGE!

**Po nahrání nového programu:**
1. ✅ Záloha starého programu
2. ✅ Nahrát nový program
3. ⚠️ **NASTAVIT ZNOVU** všechny LabPSU parametry v HMI!
4. ✅ Otestovat SAT-06

---

## 🧪 Test checklist

- [ ] Nahrát program do PLC
- [ ] Nastavit Mode = 2 (SINE_DEBUG)
- [ ] Nastavit DebugPeriod_min = 10.0
- [ ] Nastavit DebugAmplitude_A = 5.0
- [ ] Nastavit CurrentOffset_A = 5.0
- [ ] Spustit zdroj
- [ ] Pozorovat proud: 0-10A s periodou 10 minut (600s)
- [ ] Změřit skutečnou periodu (očekáváno: 600s ±2%)

---

## 📚 Dokumentace

Detaily: [docs/labpsu_period_change.md](docs/labpsu_period_change.md)

---

**Implementováno:** 2026-07-22  
**Status:** ⏳ Čeká na test v PLC
