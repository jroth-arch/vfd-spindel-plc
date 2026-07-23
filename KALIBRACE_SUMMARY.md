# 🎯 SHRNUTÍ - Kalibrace laboratorního zdroje

**Datum:** 2026-07-18  
**Status:** ✅ Implementováno, čeká na test

---

## Co bylo provedeno

### 1️⃣ Analýza naměřených dat
- ✅ Lineární regrese 46 naměřených bodů
- ✅ R² = 0.9999 (excelentní kvalita fitu)
- ✅ Zjištěn dead zone: **0.383 V**
- ✅ Odvozena kalibrace: `U [V] = (I [A] / 15.92) + 0.383`

### 2️⃣ Implementace do PLC
- ✅ Upraven [plc/program.scl](plc/program.scl) - FB_LabPSU
- ✅ Nahrazeno ideální mapování (0-60A → 0-5V) za kalibrované
- ✅ Dead zone automaticky kompenzována
- ✅ Sinusový režim nyní přesně reaguje i na nízké amplitudy

### 3️⃣ Aktualizace dokumentace
- ✅ [docs/labpsu_calibration.md](docs/labpsu_calibration.md) - kompletní dokumentace
- ✅ [docs/test_specification.md](docs/test_specification.md) - SAT-04 aktualizován
- ✅ [html/webtestapp/app.js](html/webtestapp/app.js) - testovací aplikace aktualizována

### 4️⃣ Grafy a analýza
- ✅ [docs/labpsu_analyza.png](docs/labpsu_analyza.png) - vizualizace
- ✅ [docs/labpsu_residuals.png](docs/labpsu_residuals.png) - kontrola kvality
- ✅ [analyze_psu_characteristic.py](analyze_psu_characteristic.py) - Python skript

---

## 📊 Klíčové změny v mapování

| Cílový proud | PŘED (ideální) | PO (kalibrované) | Rozdíl |
|--------------|----------------|------------------|--------|
| 0 A          | 0.00 V         | 0.00 V           | —      |
| 10 A         | 0.83 V         | **1.01 V** ✅    | +0.18 V |
| 30 A         | 2.50 V         | **2.27 V** ✅    | -0.23 V |
| 60 A         | 5.00 V         | **4.15 V** ✅    | -0.85 V |

**Výhoda:** Přesnější odezva zdroje v celém rozsahu, zejména v nižších proudech.

---

## 🧪 Další kroky

### Před nahráním do PLC:
1. ⚠️ **Záloha aktuálního programu** (TIA Portal → Export projektu)
   - Projekt: `tia/vfd-spindel-plc/vfd-spindel-plc.ap20`
   - User: `admin` / Heslo: `Admin@12345`
2. ⚠️ **Příprava rollback plánu** (v případě problémů)
3. ⚠️ **Upload změn z:** `plc/program.scl` (řádky ~754-762)

### Po nahrání do PLC:
1. ✅ Spustit **SAT-04** test (webtestapp)
   - Očekáváno: AQ3_CurrentCtrl_V ≈ 2.27V (tolerance ±0.1V)
2. ✅ Otestovat **režim CONST** s různými proudy:
   - 10A, 20A, 30A, 40A, 50A, 60A
3. ✅ Otestovat **režim SINE_DEBUG**:
   - Offset 0A, amplituda 5A → ověřit, že zdroj správně reaguje
4. ✅ Ověřit **reálný výstupní proud** multimetrem

### Pokud test projde:
- ✅ Označit kalibraci jako **ověřenou** v [labpsu_calibration.md](docs/labpsu_calibration.md)
- ✅ Aktualizovat FAT/SAT protokol

### Pokud test selže:
- ⚠️ Vrátit původní kód pomocí zálohy
- 📝 Zaznamenat odchylky
- 🔍 Opakovat měření charakteristiky

---

## 📌 Co zůstalo nezměněno

- **AQ2_VoltageCtrl_V** (napěťové mapování) - beze změny
- **AQ3_OutputOff** (enable/disable signál) - beze změny
- **Sinusový algoritmus** - pouze změněno mapování I→U
- **Konstanta rampa** - beze změny (RampUp/RampDown)

---

## 💡 Tip pro budoucnost

Pokud vyměníte zdroj za jiný model:
1. **Opakujte měření charakteristiky** (CSV s body)
2. **Spusťte Python analýzu:** `python analyze_psu_characteristic.py`
3. **Zkopírujte nové konstanty** do program.scl (řádek ~757-762)
4. **Aktualizujte dokumentaci**

---

## 📞 Otázky?

Přečtěte si detailní dokumentaci:
- [docs/labpsu_calibration.md](docs/labpsu_calibration.md)

Nebo se podívejte na grafy:
- [docs/labpsu_analyza.png](docs/labpsu_analyza.png)

---

**Implementoval:** GitHub Copilot (Claude Sonnet 4.5)  
**Ověření:** ⏳ Čeká na FAT/SAT test
