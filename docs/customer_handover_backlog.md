# Backlog pro predani zakaznikovi

Datum: 2026-05-18
Stav: draft backlog pro dokonceni pred predanim

---

## 📅 TODO NA ZÍTRA (2026-07-19)

**Kalibrace LabPSU - verifikace**

- [ ] **Nahrát upravený program do PLC** (domácí setup bez periferií)
  - Projekt: `tia/vfd-spindel-plc/vfd-spindel-plc.ap20`
  - User: `admin` / Heslo: `Admin@12345`
  - Změny v: `plc/program.scl` (FB_LabPSU, řádky ~754-762)
  - ⚠️ **ZÁLOHA**: Před nahráním zálohovat aktuální verzi PLC programu!
  
- [ ] **Oživit TIA Portal** na domácím počítači
  - Zkontrolovat funkčnost prostředí
  - Ověřit komunikaci s PLC
  
- [ ] **Spustit SAT-04 test** (pokud možné bez HW)
  - Očekávaná hodnota: `AQ3_CurrentCtrl_V ≈ 2.27V` pro 30A (tolerance ±0.1V)
  - Původní: 2.5V → Nová: 2.27V (kalibrace 2026-07-18)
  
- [ ] **Ověřit výpočet** v online režimu
  - Pozorovat `DB_Status.LabPSU.CurrentSet_A` vs. `DB_IO.AQ.AQ3_CurrentCtrl_V`
  - Kontrola: U [V] = (I [A] / 15.92) + 0.383
  
- [ ] **Poznámky k dalším prioritám** (doplnit dle potřeby):
  - **2026-07-22:** Změna DebugFrequency_Hz → DebugPeriod_min (perioda v minutách)
  - ⚠️ **Breaking change** - po nahrání nastavit LabPSU parametry znovu!
  - Testovat SAT-06 s periodou 10 min (600s cyklus)
  - _____________________________________________
  - _____________________________________________

**Reference:**
- Dokumentace kalibrace: [labpsu_calibration.md](labpsu_calibration.md)
- Shrnutí změn: [../KALIBRACE_SUMMARY.md](../KALIBRACE_SUMMARY.md)
- Test specifikace: [test_specification.md](test_specification.md) - SAT-04

---

## Cile predani
- Zakaznik umi spustit a zastavit test pres HMI.
- Zakaznik vidi prubeh testu (elapsed time, stavy).
- Zakaznik umi nastavit parametry laboratorniho zdroje.
- Zakaznik dostane instalovatelny balicek PLC + HMI bez nutnosti mit TIA Portal.
- Zakaznik dostane HW seznam (BOM-lite) pro montaz a overeni zapojeni.

## Prioritni backlog

| ID | Tema | Co dodelat | Vystup | Priorita | Stav |
|---|---|---|---|---|---|
| HO-01 | HMI Start/Stop | Implementovat tlacitka Auto a Stop s vazbou na PLC tagy (edge/latch dle tabulky) | Funkcni ovladani testu z HMI | P1 | TODO |
| HO-02 | HMI elapsed time | Zobrazit ubehly cas testu z DB_LogRuntime.Elapsed_s + format mm:ss/hh:mm:ss | Live casovac na HMI | P1 | TODO |
| HO-03 | HMI LabPSU screen | Udelat obrazovku pro parametry LabPSU (Enable, Mode, ConstCurrent_A, DebugAmplitude_A, DebugPeriod_min) + validace rozsahu | Nastavovaci obrazovka + save/apply | P1 | TODO |
| HO-04 | Predani PLC bez TIA | Pripravit CPU image/Load memory card postup (nebo commissioning package) + navod krok-za-krokem | Predavaci balicek PLC + navod | P1 | TODO |
| HO-05 | Predani HMI bez TIA | Pripravit deploy balicek web/HMI (staticke soubory + deploy script + login postup) | ZIP/Repo balicek + navod nasazeni | P1 | TODO |
| HO-06 | HW seznam | Sestavit a potvrdit seznam HW komponent, kabelaze a signalu | docs/hw_list_for_customer.md | P1 | IN_PROGRESS |
| HO-07 | CSV zapis merenych hodnot | Implementovat kod pro tvorbu CSV (hlavicka + datove radky), mapovani merenych velicin a formatovani hodnot | Funkcni CSV obsah se skutecnymi daty testu | P1 | TODO |
| HO-08 | Ukladani CSV na SD | Dokoncit FileOpen/FileWrite/FileClose v FB_LogFlushToSd (aktualne TODO) vcetne flush/final flush | Realny zapis CSV na SD | P1 | TODO |
| HO-09 | Export CSV zakaznikovi | Definovat a otestovat finalni proces stazeni CSV (SD karta / WebAPI) | Overeny postup + SAT dukaz | P1 | TODO |
| HO-10 | SAT/FAT evidence | Pripravit test protokoly, screenshoty, PASS/FAIL, datum/cas, verze FW/HMI | Predavaci test report | P2 | TODO |
| HO-11 | User navod | Strucny user guide pro obsluhu: start testu, stop, nastavovani, stazeni logu, reseni chyb | PDF/MD navod | P2 | TODO |
| HO-12 | Spindle.Enable master switch | Pridat DB_HMI.Spindle.Enable (master switch) pro konzistentni API vsech bloku a flexibilni ladeni/testovani (vreteno nezavisle na zdroji) | Upraveny DB_HMI + FB_DriveCtrl + HMI obrazovka | P2 | TODO |

## Rozpad podle tvych bodu

### 1) Tlacitka na HMI pro zapis/cteni do PLC
- Vazat na tagy popsane v docs/hmi_tag_table.md.
- Auto:
  - latch: DB_LogConfig.Enable=TRUE, DB_HMI.LabPSU.Enable=TRUE
  - pulse: DB_HMI.Spindle.Start, DB_LogConfig.StartTest
- Stop:
  - pulse: DB_HMI.Spindle.Stop, DB_LogConfig.StopTest
  - latch off: DB_HMI.LabPSU.Enable=FALSE

### 2) Zobrazovani ubehleho casu testu
- Read-only tag: DB_LogRuntime.Elapsed_s.
- UI format: mm:ss pod 1h, jinak hh:mm:ss.
- Pri TestActive=FALSE drzet posledni hodnotu + zobrazit stav "Dokonceno".

### 3) Screen pro parametry laboratorniho zdroje
- Povinne pole:
  - DB_HMI.LabPSU.Enable
  - DB_HMI.LabPSU.Mode (1=CONST, 2=SINE_DEBUG)
  - DB_HMI.LabPSU.ConstCurrent_A

---

## Otázky pro zákazníka (před finalizací)

### 1. Emergency Stop chování během testu
**Otázka:** Co se má stát když obsluha stiskne fyzické E-Stop během probíhającího testu?
- **Varianta A:** Okamžité vypnutí všeho, log se NEUKLÁDÁ (ztráta dat)
- **Varianta B:** Okamžité vypnutí, ale PLC stihne flush log na SD (data zachována)
- **Varianta C:** Soft stop - vřeteno zajede, pak se log uloží, pak vypnutí

**Doporučení:** Varianta B - bezpečnost má přednost, ale zkusit zachránit data

**Zákaznická odpověď:** _____________________________________________

---

### 2. Zobrazení alarmů na HMI
**Otázka:** Když systém detekuje alarm (překročení teploty, kritické vibrace), jak to má obsluha vidět?
- **Varianta A:** Červený popup upozornění (musí potvrdit)
- **Varianta B:** Blikající červený indikátor na obrazovce (nenásilné)
- **Varianta C:** Jen změna barvy Status Panel + záznam do logu (bez přerušení)

**Sub-otázka:** Má se test při alarmu automaticky zastavit, nebo jen varovat a pokračovat?

**Doporučení:** Popup + automatický stop u kritických alarmů (teplota, vibrace)

**Zákaznická odpověď:** _____________________________________________

---

### 3. Změna parametrů za běhu testu
**Otázka:** Může obsluha měnit parametry (otáčky, proud zdroje) během běžícího testu?
- **Varianta A:** ANO - změny se aplikují okamžitě (flexibilní, ale může narušit měření)
- **Varianta B:** NE - změny jsou zamčené, musí se zastavit test (bezpečnější)
- **Varianta C:** ANO, ale s potvrzením "Opravdu chcete změnit za běhu?"

**Doporučení:** Varianta B pro konzistentní výsledky testů

**Zákaznická odpověď:** _____________________________________________

---

### 4. Kontrola parametrů před startem testu
**Otázka:** Co má systém udělat když obsluha stiskne AUTO, ale parametry nejsou nastavené správně?
- Příklad: Otáčky = 0 RPM nebo Proud = 0 A

**Varianta A:** Spustit test i tak (může být záměrné)
**Varianta B:** Zobrazit varování "Otáčky nejsou nastaveny. Pokračovat?" (s možností zrušit)
**Varianta C:** Blokovat start + zobrazit chybu "Nastavte otáčky před startem"

**Doporučení:** Varianta B - varování s možností pokračovat

**Zákaznická odpověď:** _____________________________________________

---

### 5. Historie testů na HMI
**Otázka:** Má HMI zobrazovat seznam předchozích testů?
- Např.: "Poslední 5 testů: Test_001 (1h 23m), Test_002 (45m), ..."

**Varianta A:** ANO - seznam na samostatné obrazovce (History Screen)
**Varianta B:** NE - historii lze prohlížet jen přes WebAPI nebo SD kartu
**Varianta C:** Jen základní info: "Poslední test: LOG_260519_143022.csv (dokončeno)"

**Doporučení:** Varianta C - minimální info, detaily přes WebAPI

**Zákaznická odpověď:** _____________________________________________

---

### 6. PAUSE funkce pro test
**Otázka:** Má být možnost test POZASTAVIT (pause) místo úplného zastavení?
- Příklad použití: Během testu zjistíte špatné měření → PAUSE → oprava senzoru → CONTINUE
- Log by pokračoval ve stejném souboru

**Varianta A:** ANO - přidat tlačítko PAUSE/CONTINUE
**Varianta B:** NE - jen START a STOP (jednodušší, ale méně flexibilní)

**Doporučení:** Varianta B pro první verzi, PAUSE jako nice-to-have pro budoucnost

**Zákaznická odpověď:** _____________________________________________

---

### 7. Indikace stavu SD karty
**Otázka:** Má HMI zobrazovat stav SD karty (volné místo, chyby)?
- Např.: "SD karta: 1.2 GB free" nebo "SD: ERROR - karta chybí!"

**Varianta A:** ANO - na hlavní obrazovce malý status indikátor
**Varianta B:** ANO - ale jen na konfigurace obrazovce
**Varianta C:** NE - chyby SD se zobrazí jen při problému se zápisem

**Doporučení:** Varianta A - prevence je lepší než řešení problémů

**Zákaznická odpověď:** _____________________________________________

---

### 8. Formát času na displeji
**Otázka:** Jaký formát času preferujete pro zobrazení délky testu?
- **Varianta A:** Pouze MM:SS pro testy do 1h, pak HH:MM:SS
- **Varianta B:** Vždy HH:MM:SS (konzistentní)
- **Varianta C:** Vždy v sekundách (1234 s) - technický přístup

**Doporučení:** Varianta A - lidsky čitelné pro krátké testy

**Zákaznická odpověď:** _____________________________________________

---

### 9. WebAPI nebo jen SD karta?
**Otázka:** Jak bude zákazník primárně stahovat výsledky testů?
- **Cesta A:** Především WebAPI (stažení přes síť) + SD jako backup
- **Cesta B:** Především SD karta (fyzické vyjmutí) + WebAPI jako bonus

**Dopad:** Ovlivňuje priority vývoje WebAPI vs. robustnost SD zápisu

**Zákaznická odpověď:** _____________________________________________

---

**Termín pro odpovědi:** _____________________  
**Kontaktní osoba:** _____________________
  - DB_HMI.LabPSU.DebugAmplitude_A
  - DB_HMI.LabPSU.DebugPeriod_min
- Validace rozsahu + disable nepouzitych poli dle rezimu.

### 4) Jak dorucit PLC projekt bez TIA
- Varianta A (doporucena): predat nahranou Load memory card / image pripraveny k vlozeni do CPU.
- Varianta B: FAT na predkonfigurovanem PLC (zakaznik pouziva hotove zarizeni, ne projekt).
- Soucast balicku:
  - verze CPU FW,
  - postup uvedeni do provozu,
  - IP nastaveni,
  - reset/recovery postup.

### 5) Jak dorucit HMI projekt bez TIA
- Predat webapp balicek (html/webapp nebo html/webtestapp) + deploy script html/cli_deploy_tool.py.
- Pridat runbook:
  - login,
  - upload,
  - aktivace app,
  - smoke test URL.

### 6) Seznam HW do md souboru
- Viz docs/hw_list_for_customer.md.

### 12) Pridani Spindle.Enable jako master switch
**Duvod**: Konzistence API + flexibilni ladeni/testovani
- Soucasne: Spindle se ridi jen Start/Stop pulse (nekonzistentni s LabPSU a Logging, ktere maji Enable)
- Cil: Vsechny bloky maji stejnou strukturu: Enable (master switch) + Start/Stop (operace)
- Implementace:
  - Pridat `DB_HMI.Spindle.Enable : Bool` do struktury
  - Upravit `FB_DriveCtrl` - pokud `NOT Enable`, vratit State=0 (DISABLED), AQ=0, DO=FALSE
  - HMI: Checkbox/switch "Enable" nad tlacitky START/STOP
- Benefit pro zakaznika:
  - Muze testovat pouze vreteno (Enable=TRUE, LabPSU.Enable=FALSE)
  - Muze testovat pouze zdroj (Spindle.Enable=FALSE, LabPSU.Enable=TRUE)
  - Jasna vizualizace, co je aktivni/neaktivni
  - Bezpecnejsi ladeni - nemuzou se omylem spustit oba systemy naraz
- Asynchronni start Enable tagu (rozdil 10-200ms) nema vliv na funkcnost (PermitMotion safety zajisti synchronizaci)

### 7) Implementace kodu pro zapis namerenych hodnot do CSV
- Dopsat FB/FC logiku pro:
  - CSV hlavicku,
  - zapis jednotlivych trend vzorku,
  - jednotny decimal separator a oddelovac,
  - finalni flush pri timeout/stop/chybe.
- Overit, ze CSV obsahuje skutecne hodnoty: t_s, RPM, T_Lozisko, T_Uhliky, Vibrace, ProudUhliky, State, RunLatched, TripActive, TripCode, SafetyText.

## Definition of Done pro predani
- HMI Auto/Stop funkcni na realnem PLC.
- Elapsed time korektne zobrazen po celou dobu testu.
- Parametry LabPSU nastavitelne a projevi se v PLC stavech.
- Zakaznik ma postup nasazeni PLC i HMI bez TIA.
- CSV log je vytvoren na SD a je overene predani souboru zakaznikovi.
- HW seznam je potvrzeny a souhlasi s realnou instalaci.
