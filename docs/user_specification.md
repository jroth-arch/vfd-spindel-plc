# Business specifikace – testovaci aplikace pro opotrebeni uhlikovych kartacu

Datum: 2026-05-17
Typ dokumentu: business/uzivatelska specifikace (ne implementacni)
Navazujici dokument: [technical_requirements.md](technical_requirements.md)

## 1) Popis testovaneho procesu
Uzivatel bude testovat opotrebeni uhlikovych kartacu. Opotrebeni se bude merit tak,
ze se uhliky budou tlacit na krouzky, ktere jsou umistene na rotoru vretene.
Do uhliku se bude generovat sinusovy proud z laboratorniho zdroje.
Vreteno a laboratorni zdroj jsou rizeny pres PLC.
Pro uzivatele je rozhranim HMI panel.

## 2) Co bude vysledkem teto prace
Vysledkem bude PLC + HMI + WebAPI aplikace pro automatizovane testovani vretene, ktera:
- umozni uzivateli spustit test z HMI (Start nebo Auto),
- provede ridici sekvenci testu (vreteno + laboratorni zdroj),
- bude prubezne logovat merena data do CSV na SD kartu PLC,
- po ukonceni testu bezpecne uzavre log soubor,
- umozni stazeni vysledku pres webove rozhrani/WebAPI nebo cteni primo ze SD karty,
- podpori opakovane testy, kde kazdy test vytvori novy soubor s vysledky.

## 3) Ucel aplikace
Ucelem aplikace je zajistit opakovatelne, dohledatelne a analyzovatelne testovani
opotrebeni uhlikovych kartacu za realnychprovoznich podminek,
vcetne dlouhodobych endurance scenaru.

## 4) Uzivatelske pozadavky

FR-01 Spusteni testu
- Uzivatel muze spustit test z HMI tlacitkem Start nebo Auto.

FR-02 Beh testovaci sekvence
- Po spusteni testu aplikace aktivuje celou testovaci sekvenci.
- Vreteno se ridi na cilove otacky az 16000 rpm.
- Laboratorni zdroj ridi proud do uhliku podle nastavene logiky.

FR-03 Logovani merenych dat
- Behem testu se loguji merena data minimalne: teplota, vibrace,
  skutecny proud uhliku, skutecne otacky vretene.
- Log se uklada ve formatu CSV.

FR-04 Sprava log souboru
- Pri kazdem startu testu se vytvori novy soubor.
- Soubor je pojmenovan podle data a casu startu testu.
- Pri ukonceni testu se soubor korektne uzavre.

FR-05 Podminky ukonceni testu
- Test je ukoncen pri splneni jedne z podminek:
  - vyprseni casu testu,
  - rucni stop,
  - neocekavana udalost/chyba.

FR-06 Opakovani testu
- Po ukonceni testu se Start/Auto na HMI znovu zpristupni.
- Dalsi test vytvori novy soubor bez prepisu predchozich vysledku.

FR-07 Pristup k vysledkum
- Uzivatel muze po testu stahnout log soubor pres WebAPI/webserver.
- Alternativne je mozne logy cist primo ze SD karty PLC.

## 5) Technicke pozadavky na urovni business

TR-01 Ridici platforma
- Vreteno a laboratorni zdroj jsou rizeny pres Siemens S7-1200/1500 PLC.
- HMI panel slouzi jako jedine uzivatelske rozhrani pro obsluhu.

TR-02 Logovani a uloziste
- Merena data se ukladaji na SD kartu PLC.
- Format vystupu je CSV, stazitelny pres WebAPI nebo ze SD karty.

TR-03 Integrita mereni
- Merena data nesmi byt pri beznem ukonceni testu ani pri chybe ztracena bez diagnostiky.

TR-04 Rozsiritelnost
- Architektura musi umoznit pridani dalsich merene veliciny a ruznych scenaru testu
  bez zasadniho prepracovani systemu.

Podrobne technicke pozadavky (PLC architektura, WebAPI kontrakt, CSV schema, flush strategie)
jsou v navazujicim dokumentu [technical_requirements.md](technical_requirements.md).

## 6) Pozadavky na uzivatelske chovani a UX

UX-01 Jednoduche ovladani
- Uzivatel nepotrebuje TIA; test spousti a ukoncuje pres HMI.

UX-02 Jasny stav testu
- HMI zretelne indikuje stavy: pripraveno, test bezi, test ukoncen, chyba.

UX-03 Predvidatelny vystup
- Kazdy test ma vlastni vysledny soubor, ktery lze jednoduse identifikovat podle casu.

## 7) Provozni a servisni pozadavky

OP-01 Dlouhodoby provoz
- Reseni musi byt pouzitelne pro opakovane a dlouhodobe testy.

OP-02 Dostupnost dat
- Logy musi byt dostupne pro predani, archivaci a analyzu po skonceni testu.

OP-03 Rozsiritelnost
- Architektura ma umoznit pridani dalsich logovanych velicin a udalosti bez zasadni prestavby.

## 8) Akceptacni kriterium vysledne aplikace
- Test lze spustit z HMI (Start/Auto).
- Behem testu se na SD vytvari a plni CSV soubor s merenymi hodnotami.
- Po timeoutu/stop/chybe je soubor korektne uzavren.
- Po ukonceni je mozne test znovu spustit a vznikne novy soubor.
- Vysledky lze stahnout pres WebAPI nebo cist primo ze SD karty.

## 9) Otevrene body k finalnimu rozhodnuti
- Jak presne se bude merit opotrebeni (vizialni, vahove, odpor kontaktu...).
- Cilova delka jednoho testu (endurance vs. kратky cyklicky test).
- Kdo je prijemce vysledku (interni inzenyr, zakaznik, certifikacni organ).
- Ocekavany format reportu – raw CSV, nebo zpracovany report/graf.

---

## 10) HMI Panel Backlog – Implementační požadavky

### 10.1) Hlavní obrazovka (Main Screen)

**Účel:** Ovládání testu a monitoring běžícího stavu

**Layout:** Obrazovka rozdělena **horizontálně na dvě poloviny** (50/50 split)

#### 🎨 Layout struktura:

```
┌─────────────────────────────────────────────────────────────────┐
│                    HLAVNÍ OBRAZOVKA (800×480)                    │
├─────────────────────────────┬───────────────────────────────────┤
│  LEVÁ STRANA (400×480)      │  PRAVÁ STRANA (400×480)          │
│  Ovládání + Nastavení       │  Monitoring + Diagnostika        │
├─────────────────────────────┼───────────────────────────────────┤
│                             │                                   │
│  ┌──────────┐ ┌──────────┐ │  ╔═════════════════════════════╗ │
│  │   AUTO   │ │   STOP   │ │  ║ TEST STATUS PANEL           ║ │
│  └──────────┘ └──────────┘ │  ║ [ZELENÁ/ŠEDÁ/ČERVENÁ]       ║ │
│                             │  ║ "TEST RUNNING"              ║ │
│  ┌─────────────────────────┐│  ║ Elapsed: 00:15:42 / 01:00  ║ │
│  │ Otáčky [RPM]: [16000  ]││  ╚═════════════════════════════╝ │
│  └─────────────────────────┘│                                   │
│  ┌─────────────────────────┐│  ┌───────────────────────────┐   │
│  │ Proud [A]:    [10.0   ]││  │ IKONY STAVŮ BLOKŮ         │   │
│  └─────────────────────────┘│  │ 🟢 V  🟢 Z  🟢 L  🔴 S   │   │
│                             │  └───────────────────────────┘   │
│  ┌─────────────────────────┐│                                   │
│  │ Test duration [s]: 3600││  ┌───────────────────────────┐   │
│  └─────────────────────────┘│  │ AKTUÁLNÍ SENZORY          │   │
│                             │  │ Otáčky:     15987 RPM     │   │
│  ┌─────────────────────────┐│  │ Teplota:    45.2 °C       │   │
│  │ Log prefix: [test_001 ]││  │ Proud:      10.1 A        │   │
│  └─────────────────────────┘│  │ Vibrace:    2.3           │   │
│                             │  └───────────────────────────┘   │
│                             │                                   │
│  [Config >] [Lab PSU >]     │  ┌───────────────────────────┐   │
│                             │  │ DIAGNOSTIKA               │   │
│                             │  │ SD Karta: OK (1.2 GB)     │   │
│                             │  │ Safety: All OK            │   │
│                             │  │ Samples: 265              │   │
│                             │  └───────────────────────────┘   │
│                             │                                   │
└─────────────────────────────┴───────────────────────────────────┘
```

#### 📍 LEVÁ STRANA - Ovládání + Parametry:
- Tlačítka AUTO / STOP (velká, viditelná)
- Input pole pro rychlé nastavení:
  - Otáčky vřetena [RPM]
  - Proud zdroje [A]
  - Doba testu [s]
  - Prefix log souboru
- Navigační tlačítka na další obrazovky (Config, Lab PSU)

#### 📊 PRAVÁ STRANA - Monitoring + Stav:
- **Hlavní status panel** (Test Status + Timer)
- **Ikonky stavů bloků** (Vřeteno/Zdroj/Log/Safety)
- **Live hodnoty senzorů** (otáčky, teplota, proud, vibrace)
- **Diagnostika** (SD karta, počet vzorků, safety stav)

**Cíl layoutu:** Uživatel na první pohled vidí **CO nastavit (vlevo)** a **JAK TO BĚŽÍ (vpravo)**

---

#### ✅ IMPLEMENTOVÁNO:
- [ ] HMI-001: Tlačítko **AUTO** (dříve Start)
  - Spustí kompletní testovací sekvenci: vřeteno + lab zdroj + logování
  - Interní akce:
    - `"DB_HMI".Spindle.Start` := puls (press+release)
    - `"DB_HMI".LabPSU.Enable` := TRUE
    - `"DB_LogConfig".StartTest` := puls
    - `"DB_LogConfig".Enable` := TRUE
  - Status: **✅ TLAČÍTKO FUNGUJE** (hranové ovládání)

- [ ] HMI-002: Tlačítko **STOP**
  - Zastaví celý test a uloží log na SD kartu
  - Interní akce:
    - `"DB_HMI".Spindle.Stop` := puls
    - `"DB_LogConfig".StopTest` := puls (flush + uzavření souboru)
    - `"DB_HMI".LabPSU.Enable` := FALSE
  - Status: **✅ TLAČÍTKO FUNGUJE**

#### ❌ CHYBÍ IMPLEMENTACE:

- [ ] HMI-003: **Indikátor stavu testu (Test Status Panel)**
  - Požadavek: Vizuální indikace běžícího testu
  - Návrh: Panel s barevným pozadím (šedá/zelená/červená)
    - ŠEDÁ = Test připraven (READY)
    - ZELENÁ = Test běží (RUNNING)
    - ČERVENÁ = Chyba/Trip (ERROR)
  - Zobrazovaný text: "TEST READY" / "TEST RUNNING" / "TEST STOPPED" / "ERROR"
  - Datový zdroj: `"DB_LogRuntime".TestActive` (Bool)

- [ ] HMI-004: **Časovač testu (Test Timer) - ELAPSED + TARGET**
  - Požadavek: Zobrazení doby běhu testu v reálném čase + cílové délky testu
  - Návrh: Velký číselný displej s formátem: **"ELAPSED / TARGET"**
    - Příklad: **"00:15:42 / 01:00:00"** (uběhlo 15min 42s z 1 hodiny)
  - Chování: **Elapsed se INKREMENTUJE** (počítá nahoru), NE odpočítává!
  - Datové zdroje:
    - Elapsed: `"DB_LogRuntime".Elapsed_s` (Real) → převod na HH:MM:SS
    - Target: `"DB_LogConfig".TestDuration_s` (DInt) → převod na HH:MM:SS
  - Umístění: Vedle nebo uvnitř Test Status Panel
  - Formát času: HH:MM:SS (vždy konzistentní)

- [ ] HMI-005: **Přehled stavů funkčních bloků (Status Icons)**
  - Požadavek: Vizuální ikonky se statusem místo textu
  - Návrh: **Ikonový přehled s barvami:**
    ```
    🟢 ✓ Vřeteno      (RunLatched = TRUE, State = RUN_CMD)
    🟢 ✓ Zdroj        (Enable = TRUE, State != OFF)
    🟢 ✓ Log          (TestActive = TRUE)
    🔴 ✗ Safety       (TripActive = TRUE) ← ČERVENÝ při tripu!
    ```
  - Alternativa pro Basic Panel: Barevné kruhy + písmeno:
    - [●] V  (zelená = vřeteno OK)
    - [●] Z  (zelená = zdroj OK)  
    - [●] L  (zelená = log OK)
    - [●] S  (červená = safety trip!)
  - Datové zdroje:
    - Vřeteno: `"DB_Status".Spindel.RunLatched`, `State`
    - Zdroj: `"DB_Status".LabPSU.State`
    - Log: `"DB_LogRuntime".TestActive`
    - Safety: `"DB_Status".Safety.TripActive`
  - Poznámka: **Ikony místo dlouhého textu** - kompaktnější a přehlednější

- [ ] HMI-006: **Numerický displej aktuálních otáček**
  - Zobrazení: `"DB_HMI".Sensors.TM_Rotation_A_Channel` [RPM]
  - Velký číselný displej, např. "15987 RPM"

- [ ] HMI-007: **Rychlý přístup k hlavním senzorům**
  - Mini-displeje na hlavní obrazovce:
    - Teplota ložiska: `"DB_HMI".Sensors.AI1_Teplota_Lozisko_C` [°C]
    - Proud uhlíků: zobrazit z lab zdroje
    - Vibrace (pokud dostupné)

- [ ] HMI-008: **Input pole pro rychlé nastavení na hlavní obrazovce (LEVÁ STRANA)**
  - Požadavek: Uživatel může nastavit klíčové parametry přímo na hlavní obrazovce před stiskem AUTO
  - Návrh: Čtyři input fieldy v levé části obrazovky:
    - **Otáčky [RPM]:** Input box → `"DB_HMI".Spindle.Speed_RPM` (0–18000)
    - **Proud [A]:** Input box → `"DB_HMI".LabPSU.ConstCurrent_A` (0–60)
    - **Test duration [s]:** Input box → `"DB_LogConfig".TestDuration_s` (1–86400)
    - **Log prefix:** Input box → `"DB_LogConfig".FilePrefix` (String[16])
  - Umístění: **LEVÁ STRANA obrazovky** (sekce Ovládání + Nastavení)
  - Pořadí: Pod tlačítky AUTO/STOP, nad navigačními tlačítky
  - Chování: **Tlačítko AUTO spustí test s aktuálně nastavenými hodnotami** (nenastavuje samo)
  - Poznámka: Detailní nastavení zdroje (Mode, BaseVoltage, atd.) zůstává na samostatné obrazovce Lab PSU

- [ ] HMI-009: **Live hodnoty senzorů (PRAVÁ STRANA)**
  - Požadavek: Zobrazení aktuálních hodnot v reálném čase pro rychlou diagnostiku
  - Návrh: Panel s číselními displeji (read-only):
    ```
    AKTUÁLNÍ SENZORY
    ─────────────────────
    Otáčky:     15987 RPM
    Teplota:    45.2 °C
    Proud:      10.1 A
    Vibrace:    2.3
    ```
  - Datové zdroje:
    - `"DB_HMI".Sensors.TM_Rotation_A_Channel` [RPM]
    - `"DB_HMI".Sensors.AI1_Teplota_Lozisko_C` [°C]
    - `"DB_Status".LabPSU.CurrentSet_A` [A]
    - Vibrace: (pokud dostupné)
  - Umístění: **PRAVÁ STRANA** pod ikonami stavů bloků
  - Formátování: Čísla zarovnané vpravo, jednotky vlevo

- [ ] HMI-010: **Diagnostický panel (PRAVÁ STRANA - dole)**
  - Požadavek: Rychlý přehled o stavu systému pro prevenci problémů
  - Návrh: Malý textový panel s klíčovými info:
    ```
    DIAGNOSTIKA
    ─────────────────────
    SD Karta: OK (1.2 GB free)
    Safety: All OK
    Samples: 265
    Log: test_001_260519_143022.csv
    ```
  - Datové zdroje:
    - SD karta: (pokud dostupné z PLC)
    - Safety: `"DB_Status".Safety.StatusText`
    - Samples: `"DB_LogRuntime".SampleCounter`
    - Log: `"DB_LogRuntime".FileName`
  - Umístění: **PRAVÁ STRANA - spodní část**
  - Barva: Normální bílá/černá, ČERVENÁ při chybě

---

### 10.2) Lab zdroj obrazovka (Lab PSU Screen)

**Účel:** Nastavení a ladění parametrů laboratorního zdroje

#### ❌ CELÁ OBRAZOVKA CHYBÍ:

- [ ] HMI-101: **Výběr režimu zdroje (Mode Selection)**
  - Požadavek: Přepínání mezi režimy zdroje
  - Návrh: Radio buttons nebo Dropdown
    - 0 = OFF
    - 1 = CONST (konstantní proud)
    - 2 = SINE_DEBUG (sinusový proud pro ladění)
  - Datový zápis: `"DB_HMI".LabPSU.Mode` (USInt)

- [ ] HMI-102: **Konstantní proud (Mode=1)**
  - Input pole: `"DB_HMI".LabPSU.ConstCurrent_A` [A]
  - Rozsah: 0–60 A
  - Label: "Konstantní proud [A]"

- [ ] HMI-103: **Základní napětí zdroje**
  - Input pole: `"DB_HMI".LabPSU.BaseVoltage_V` [V]
  - Rozsah: 0.8–16 V
  - Label: "Základní napětí [V]"

- [ ] HMI-104: **DC offset proudu**
  - Input pole: `"DB_HMI".LabPSU.CurrentOffset_A` [A]
  - Rozsah: 0–60 A
  - Label: "DC offset [A]"

- [ ] HMI-105: **Amplituda sinu (Mode=2)**
  - Input pole: `"DB_HMI".LabPSU.DebugAmplitude_A` [A]
  - Rozsah: 0–60 A
  - Label: "Amplituda sinu [A]"
  - Viditelnost: Pouze když Mode=2

- [ ] HMI-106: **Frekvence sinu (Mode=2)**
  - Input pole: `"DB_HMI".LabPSU.DebugFrequency_Hz` [Hz]
  - Rozsah: 0.1–10 Hz
  - Label: "Frekvence [Hz]"
  - Viditelnost: Pouze když Mode=2

- [ ] HMI-107: **Enable/Disable zdroje**
  - Toggle button nebo Checkbox
  - Datový zápis: `"DB_HMI".LabPSU.Enable` (Bool)
  - Label: "Povolit zdroj"

- [ ] HMI-108: **Zobrazení aktuálního stavu zdroje**
  - Read-only text:
    - `"DB_Status".LabPSU.VoltageSet_V` → "Napětí: 2.5 V"
    - `"DB_Status".LabPSU.CurrentSet_A` → "Proud: 10.2 A"
    - `"DB_Status".LabPSU.StatusText` → "CONST MODE"

- [ ] HMI-109: **Navigační tlačítko zpět na Main**
  - Button "< Zpět na hlavní obrazovku"

---

### 10.3) Konfigurace obrazovka (Configuration Screen)

**Účel:** Nastavení prahových hodnot a parametrů logování

#### ❌ CELÁ OBRAZOVKA CHYBÍ:

- [ ] HMI-201: **Prahová teplota (Temperature Threshold)**
  - Input pole: `"DB_Config".TempHighThreshold_C` [°C]
  - Rozsah: 0–100 °C
  - Label: "Max. teplota [°C]"
  - Popis: "Při překročení se aktivuje alarm TempHigh"

- [ ] HMI-202: **Prahové vibrace (Vibration Threshold)**
  - Input pole: `"DB_Config".VibCriticalThreshold`
  - Rozsah: 0–100 (jednotky TBD)
  - Label: "Max. vibrace"
  - Popis: "Při překročení se aktivuje alarm VibCritical"

- [ ] HMI-203: **Jméno souboru logu (Log File Prefix)**
  - Input pole: `"DB_LogConfig".FilePrefix` (String[16])
  - Label: "Prefix log souboru"
  - Placeholder: "test_001"
  - Poznámka: Finální jméno bude PREFIX_YYMMDD_HHMMSS.csv

- [ ] HMI-204: **Doba trvání testu (Test Duration)**
  - Input pole: `"DB_LogConfig".TestDuration_s` [s]
  - Rozsah: 1–86400 s (1 s až 24 hodin)
  - Label: "Doba testu [s]"
  - Nice-to-have: Převod na HH:MM:SS pro pohodlí uživatele

- [ ] HMI-205: **Frekvence flush (Flush Interval)**
  - Input pole: `"DB_LogConfig".FlushEveryN`
  - Rozsah: 1–1000 vzorků
  - Label: "Flush každých N vzorků"
  - Popis: "Jak často se data zapisují na SD kartu"

- [ ] HMI-206: **Max. otáčky vřetena (Max RPM)**
  - Input pole: Zadání do HMI nebo přímo v kódu?
  - Rozsah: 0–18000 RPM
  - Label: "Max. otáčky [RPM]"
  - Poznámka: Možná pouze read-only pro bezpečnost

- [ ] HMI-207: **Navigační tlačítko zpět na Main**
  - Button "< Zpět na hlavní obrazovku"

---

### 10.4) Quick Presets (nejnižší priorita - nice-to-have)

- [ ] HMI-301: **Přednastavené testovací profily**
  - Požadavek: Rychlé spuštění častých testů jedním kliknutím
  - Návrh: Tlačítka s přednastavenými profily:
    ```
    [Test 1h @ 16k RPM]  [Test 4h @ 12k RPM]  [Test 8h @ 18k RPM]  [Vlastní]
    ```
  - Každé tlačítko automaticky nastaví:
    - `Speed_RPM`
    - `ConstCurrent_A`
    - `TestDuration_s`
    - `FilePrefix` (např. "T1H16K", "T4H12K")
  - Po stisku profilu stačí jen zmáčknout AUTO
  - Implementace: Může být jako popup dialog nebo samostatná obrazovka
  - Priorita: **NEJNIŽŠÍ** - implementovat až po všech ostatních funkcích
  - Poznámka: Profily lze uložit do `DB_Config` nebo hardcode v HMI scriptu

---

### 10.5) Prioritizace implementace (doporučení)
6) Potvrzené rozhodnutí

#### ✅ Odpovědi na klíčové otázky:

**Q1: Tlačítko AUTO**
- ✅ **Potvrzeno:** Jedno tlačítko AUTO spustí všechno najednou (vřeteno + zdroj + log)
- Tlačítko AUTO **NENASTAVUJE parametry**, pouze **SPOUŠTÍ** již nastavené hodnoty
- Uživatel nastaví otáčky a proud v input polích na hlavní obrazovce (HMI-008) před stiskem AUTO

**Q2: Formát času**
- ✅ **Potvrzeno:** Zobrazit **ELAPSED / TARGET** (např. "00:15:42 / 01:00:00")
- Elapsed čas se **INKREMENTUJE** (počítá nahoru), ne odpočítává
- Formát: HH:MM:SS konzistentně pro obě hodnoty

**Q3: Stavy bloků**
- ✅ **Potvrzeno:** Použít **ikonky/barevné kruhy místo textu** (HMI-005 upraveno)
- Kompaktnější a přehlednější zobrazení

**Q4: Priorita implementace**
- ✅ **Potvrzeno:** První implementovat **časovač + status indikátor** (P1)
- Quick presets = **nejnižší priorita** (nice-to-have)

**Q5: HMI Panel**
- ✅ **Potvrzeno:** **Siemens KTP700 Basic PN**
- Bez simulace na PC (implementace přímo na reálném panelu)

---

### 10.7) Poznámky pro implementaci

#### Technické detaily pro KTP700 Basic PN:
- **Rozlišení:** 800 × 480 px (7" dotykový)
- **Omezení Basic Panelu:**
  - Bez grafů/trendů (jen Basic objets)
  - Bez pokročilých scriptů (jen jednoduché funkce)
  - Omezená paměť pro grafiku
- **Doporučení:**
  - Ikonky nahradit barevnými kruhy + písmena (●V, ●Z, ●L, ●S)
  - Místo složitých trendů použít číselné displeje s barevným pozadím
  - Formátování času dělat v PLC, ne v HMI (jednodušší)

#### Datové toky pro AUTO tlačítko:
```
┌─────────────────────────────────────────────────────────────────┐
│ LEVÁ STRANA - Uživatel nastaví → HMI Input fieldy:             │
├─────────────────────────────────────────────────────────────────┤
│  - Otáčky: 16000 RPM → "DB_HMI".Spindle.Speed_RPM              │
│  - Proud: 10 A → "DB_HMI".LabPSU.ConstCurrent_A                │
│  - Duration: 3600 s → "DB_LogConfig".TestDuration_s            │
│  - Prefix: "test_001" → "DB_LogConfig".FilePrefix              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Uživatel stiskne AUTO → HMI Events (Press+Release):            │
├─────────────────────────────────────────────────────────────────┤
│  1. "DB_HMI".Spindle.Start = PULSE (TRUE→FALSE)                │
│  2. "DB_LogConfig".StartTest = PULSE                            │
│  3. "DB_LogConfig".Enable = TRUE (latch)                        │
│  4. "DB_HMI".LabPSU.Enable = TRUE (latch)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PLC zpracuje:                                                   │
├─────────────────────────────────────────────────────────────────┤
│  - Detekuje hranu na Start → spustí vřeteno (16000 RPM)        │
│  - Detekuje hranu na StartTest → začne logování (3600s)        │
│  - LabPSU Enable → aktivuje zdroj (10 A)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PRAVÁ STRANA - Zobrazí se změny:                                │
├─────────────────────────────────────────────────────────────────┤
│  - Status Panel: ŠEDÁ → ZELENÁ "TEST RUNNING"                  │
│  - Timer: "00:00:00 / 01:00:00" → začne inkrementovat          │
│  - Ikony: 🟢V 🟢Z 🟢L (všechny zelené)                          │
│  - Senzory: Otáčky začnou stoupat 0 → 16000 RPM                │
│  - Diagnostika: Samples: 0 → 1 → 2 → ...                       │
└─────────────────────────────────────────────────────────────────┘
```

#### UX flow při používání:
1. **Příprava testu (LEVÁ):** Uživatel vyplní parametry
2. **Start (LEVÁ):** Klikne AUTO
3. **Monitoring (PRAVÁ):** Sleduje průběh na pravé straně
4. **Kontrola (PRAVÁ):** Občas zkontroluje hodnoty senzorů
5. **Stop (LEVÁ):** Klikne STOP když je potřeba

---

### 10.8) Otázky pro zákazníka

**Podrobné otázky k E-Stop, alarmům, změnám za běhu atd. jsou v samostatném dokumentu:**

👉 **[customer_handover_backlog.md](customer_handover_backlog.md#otázky-pro-zákazníka-před-finalizací)**

Tyto otázky je nutné zodpovědět před finalizací HMI implementace.

---

**Další krok:** Začít implementaci v TIA Portal dle priority P1 (časovač + indikátor stavu)
### ⚠️ Co bych zvážil/změnil:
- **Přehled stavů bloků (HMI-005)** – super nápad, ale může to být moc informací. Co takhle jen **ikony se statusem**?
  - ✅🟢 Vřeteno OK
  - ✅🟢 Zdroj OK  
  - ✅🟢 Log OK
  - ❌🔴 Safety TRIP
  
- **Zobrazení otáček** – určitě chci vidět, jestli vřeteno běží na správných otáčkách. Doporučuji i **bargraf** nebo **trend** (poslední minuta).

- **Jméno souboru** – pokud generujete automaticky timestamp, možná **stačí jen krátký prefix** nebo číslo testu? "Test_001", "Test_002"...

### ❓ Otázky od uživatele:
1. **Co se stane když stisknu STOP během testu?** Je to okamžité vypnutí nebo "soft stop" s dojezdem?
2. **Vidím někde ALARMY?** Když teplota překročí práh, kde se to zobrazí? Červený popup?
3. **Můžu změnit parametry během běžícího testu?** (např. snížit otáčky) Nebo musím zastavit a znovu spustit?
4. **Historie testů** – vidím seznam předchozích testů někde na HMI, nebo jen na WebAPI?

---

**Další krok:** Potvrďte priority a zodpovězte otevřené otázky, pak můžeme začít s implementací HMI obrazovek v TIA Portal.
