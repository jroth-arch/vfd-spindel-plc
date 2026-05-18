# Backlog pro predani zakaznikovi

Datum: 2026-05-18
Stav: draft backlog pro dokonceni pred predanim

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
| HO-03 | HMI LabPSU screen | Udelat obrazovku pro parametry LabPSU (Enable, Mode, ConstCurrent_A, DebugAmplitude_A, DebugFrequency_Hz) + validace rozsahu | Nastavovaci obrazovka + save/apply | P1 | TODO |
| HO-04 | Predani PLC bez TIA | Pripravit CPU image/Load memory card postup (nebo commissioning package) + navod krok-za-krokem | Predavaci balicek PLC + navod | P1 | TODO |
| HO-05 | Predani HMI bez TIA | Pripravit deploy balicek web/HMI (staticke soubory + deploy script + login postup) | ZIP/Repo balicek + navod nasazeni | P1 | TODO |
| HO-06 | HW seznam | Sestavit a potvrdit seznam HW komponent, kabelaze a signalu | docs/hw_list_for_customer.md | P1 | IN_PROGRESS |
| HO-07 | CSV zapis merenych hodnot | Implementovat kod pro tvorbu CSV (hlavicka + datove radky), mapovani merenych velicin a formatovani hodnot | Funkcni CSV obsah se skutecnymi daty testu | P1 | TODO |
| HO-08 | Ukladani CSV na SD | Dokoncit FileOpen/FileWrite/FileClose v FB_LogFlushToSd (aktualne TODO) vcetne flush/final flush | Realny zapis CSV na SD | P1 | TODO |
| HO-09 | Export CSV zakaznikovi | Definovat a otestovat finalni proces stazeni CSV (SD karta / WebAPI) | Overeny postup + SAT dukaz | P1 | TODO |
| HO-10 | SAT/FAT evidence | Pripravit test protokoly, screenshoty, PASS/FAIL, datum/cas, verze FW/HMI | Predavaci test report | P2 | TODO |
| HO-11 | User navod | Strucny user guide pro obsluhu: start testu, stop, nastavovani, stazeni logu, reseni chyb | PDF/MD navod | P2 | TODO |

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
  - DB_HMI.LabPSU.DebugAmplitude_A
  - DB_HMI.LabPSU.DebugFrequency_Hz
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
