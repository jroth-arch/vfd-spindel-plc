# Screen 1 (HOME) - TIA implementace krok za krokem

Tento dokument je prakticky checklist pro implementaci obrazovky S1 (HOME) v TIA Portal pro KTP700 Basic PN.
Scope je pouze Screen 1.

## 1. Vstupni podminky

- V projektu existuji PLC tagy podle `../hmi_tag_table.md`.
- V TIA je vytvorena obrazovka `S1_HOME`.
- Pouzivat pouze styl Industrial Classic dle layout standardu.

## 2. Globalni nastaveni obrazovky

- Resolution: 800 x 480 px (KTP700 Basic).
- Grid: 8 px.
- Outer margin: 16 px.
- Gap mezi bloky: 12 px.
- Radius: 0 px.
- Stiny: vypnout.

### 2.1 Barevna paleta

- Background panel: svetle seda
- Card background: velmi svetle seda
- Border: stredne seda
- Primary text: tmave modro-seda
- READY/OK: zelena
- RUNNING: modra
- WARNING: oranzova
- TRIP/ERROR/STOP: cervena
- Disabled: sedo-modra

### 2.2 Typografie

- Font family: Tahoma
- Hlavni stav: 24 px Bold
- Nadpis sekce: 18 px Bold
- Label: 14 px Regular
- Hodnota: 18 px Bold

## 3. Rozmisteni bloku (object-by-object)

Pozice a rozmery nejsou fixni, nastav je podle citu obsluhy a citelnosti na panelu.

## 3.1 Root a hlavicka

### Objekt 1: Screen background
- Type: Screen property
- Style:
  - Background color: svetle seda

### Objekt 2: Header bar
- Type: Rectangle
- Style:
  - Fill: velmi svetle seda
  - Border: 1 px stredne seda

### Objekt 3: Header title `HOME`
- Type: Static text
- Text: `HOME`
- Font: Tahoma, 18, Bold
- Color: tmave modro-seda

### Objekt 4: Main status text
- Type: I/O field (string display)
- Tag: `"DB_Status".HMI_StatusText`
- Font: Tahoma, 24, Bold
- Default text color: tmave modro-seda
- Alignment: center-left

### Objekt 5: Timer label
- Type: Static text
- Text: `Timer:`
- Font: Tahoma, 14, Regular
- Color: tmave modro-seda

### Objekt 6: Timer value
- Type: I/O field (Output)
- Process tag: `"DB_LogRuntime".TimeDisplay_HMI`
- Data type: String[21]
- Format: PLC uz pripravuje text `HHH:MM:SS / HHH:MM:SS` (elapsed / target)
- Font: Tahoma, 18, Bold
- Color: tmave modro-seda

Poznamka: Nepouzivat `TestStartTs` ani `OB30_LastTs` pro zobrazeni timeru. Jsou to casove struktury pro interni PLC logiku. Pokud chces zobrazit pouze uplynuly cas, pouzij misto toho `"DB_LogRuntime".ElapsedTime_HMI` (String[9]).

## 3.2 Leva karta OVLADANI

### Objekt 7: Control card container
- Type: Rectangle
- Style:
  - Fill: velmi svetle seda
  - Border: 1 px stredne seda

### Objekt 8: Card title `OVLADANI`
- Type: Static text
- Font: Tahoma, 18, Bold
- Color: tmave modro-seda

### Objekt 9: Tlacitko `AUTO`
- Type: Button
- Text: `AUTO`
- Font: Tahoma, 18, Bold
- Border: 1 px stredne seda
- Fill normal: velmi svetle seda
- Typ eventu: Press + Release
- Typ signalu: hranovy pulse (TRUE pri stisku, FALSE pri uvolneni)
- Event Press:
  - Nastavit `"DB_LogConfig".StartTest := TRUE`
  - Nastavit `"DB_HMI".Spindle.Start := TRUE`
- Event Release:
  - Nastavit `"DB_LogConfig".StartTest := FALSE`
  - Nastavit `"DB_HMI".Spindle.Start := FALSE`
- Poznamka: pulse 100-300 ms je kriticky. Pokud panel nepodporuje Press/Release spolehlive, pouzit PLC pulse helper bit (HMI zapise pouze TRUE na helper bit, PLC vytvori casovany pulse).

### Objekt 10: Tlacitko `STOP`
- Type: Button
- Text: `STOP`
- Font: Tahoma, 18, Bold
- Typ eventu: Press + Release
- Typ signalu: hranovy pulse (TRUE pri stisku, FALSE pri uvolneni)
- Event Press:
  - `"DB_LogConfig".StopTest := TRUE`
  - `"DB_HMI".Spindle.Stop := TRUE`
- Event Release:
  - `"DB_LogConfig".StopTest := FALSE`
  - `"DB_HMI".Spindle.Stop := FALSE`

### Objekt 11: Label `RPM setpoint`
- Type: Static text
- Font: Tahoma, 14, Regular
- Color: tmave modro-seda

### Objekt 12: IO pole `RPM setpoint`
- Type: I/O field (input)
- Tag: `"DB_HMI".Spindle.Speed_RPM`
- Type/range: Real, 0-18000
- Font: Tahoma, 18, Bold
- Input limit: min 0, max 18000

### Objekt 13: Label `Sinusovy proud`
- Type: Static text
- Font: Tahoma, 14, Regular
- Color: tmave modro-seda

### Objekt 14: IO pole `Sinusovy proud`
- Type: I/O field (input)
- Tag: `"DB_HMI".LabPSU.DebugAmplitude_A`
- Type/range: Real, 0-38 A
- Font: Tahoma, 18, Bold
- Input limit: min 0, max 38
- Pouziva se pro rezim `"DB_HMI".LabPSU.Mode = 2` (`SINE_DEBUG`)
- Hodnota je maximum celeho sinusoveho prubehu `0..A`; `CurrentOffset_A` se v tomto rezimu nepouziva

## 3.3 Prava karta MONITORING

### Objekt 15: Monitoring card container
- Type: Rectangle
- Style:
  - Fill: velmi svetle seda
  - Border: 1 px stredne seda

### Objekt 16: Card title `MONITORING`
- Type: Static text
- Font: Tahoma, 18, Bold
- Color: tmave modro-seda

### Objekt 17: Teplota lozisko (value)
- Type: I/O field (display)
- Tag: `"DB_HMI".Sensors.AI1_Teplota_Lozisko_C`
- Format: 0.0 `C`
- Font: Tahoma, 18, Bold

### Objekt 18: Max. teplota lozisko (value)
- Type: I/O field (display)
- Tag: `"DB_LogRuntime".MaxTempLozisko_C`
- Access: Output
- Format: 0.0 `C`
- Font: Tahoma, 18, Bold
- Label: `Max:`
- Poznamka: PLC hodnotu vynuluje pri startu noveho testu a behem testu uklada nejvyssi namerenou teplotu loziska. Po stopu zustava hodnota viditelna az do dalsiho startu testu.

### Objekt 19: Teplota kartace (Akt/Max)
- Type: I/O field (display) + I/O field (display)
- Aktualni teplota tag: `"DB_HMI".Sensors.AI2_Teplota_Kartace_C`
- Max. namerena teplota tag: `"DB_LogRuntime".MaxTempUhliky_C`
- Aktualni teplota:
  - Access: Output
  - Format: 0.0 `C`
  - Font: Tahoma, 18, Bold
- Max. namerena teplota:
  - Access: Output
  - Format: 0.0 `C`
  - Font: Tahoma, 14-18, Bold
- Labely: `Akt:` a `Max:`
- Barva aktualni hodnoty: tmave modro-seda
- Barva Max pole: tmave modro-seda
- Poznamka: PLC hodnotu vynuluje pri startu noveho testu a behem testu uklada nejvyssi namerenou teplotu kartacu. Po stopu zustava hodnota viditelna az do dalsiho startu testu. Teplotni limity jsou nastavitelne pouze v chranenem panelu S7 SERVICE.

### Objekt 20: Aktualni RPM (value)
- Type: I/O field (display)
- Tag: `"DB_HMI".Sensors.TM_Rotation_A_Channel`
- Font: Tahoma, 18, Bold

### Objekt 20a: Ujeta vzdalenost
- Type: I/O field (Output)
- Tag: `"DB_LogRuntime".UjetaVzdalenost_km`
- Format: `0.0000`
- Label: `Ujeta vzdalenost [km]`
- Font: Tahoma, 18, Bold
- Poznamka: PLC hodnotu vynuluje pri startu noveho testu. Behem aktivniho testu ji pocita z aktualnich RPM a nakonfigurovaneho prumeru sberaciho krouzku; po STOP nebo poruse zustava viditelna az do dalsiho startu.

### Objekt 21: LOG SAVED (value)
- Type: Symbolic text or IO bool display
- Tag: `"DB_LogRuntime".LastStopLogSaved`
- Mapping:
  - FALSE -> `NO`
  - TRUE -> `YES`
- Font: Tahoma, 18, Bold

### Objekt 22: Last error (value)
- Type: I/O field (string display)
- Tag: `"DB_LogRuntime".LastError`
- Font: Tahoma, 14, Regular
- Word wrap: ON
- Max chars visible: 40

### Objekt 23: Signalizacni objekt `VRETENO`
- Type: Circle nebo lamp object + I/O field pro textovy stav
- Bool Appearance tag lampy: `"DB_Status".Spindel.RunLatched`
- Druhy Appearance tag pro poruchu: `"DB_Status".Spindel.TripActive`
- Textovy stavovy tag: `"DB_Status".Spindel.StatusText`
- Text u lampy: `VRETENO`
- Barva lampy:
  - `RunLatched = FALSE` a `TripActive = FALSE` -> seda
  - `RunLatched = TRUE` a `TripActive = FALSE` -> modra
  - `TripActive = TRUE` -> cervena
- Textovy stav z PLC zobraz jako Output I/O field, ne jako zapisovatelne pole.
- Ocekavane texty: `STOPPED`, `RUN CMD (no feedback)`, `STOPPING (ramp down)`, `TRIP (E-Stop/Interlock)`.

### Objekt 24: Signalizacni objekt `ZDROJ`
- Type: Circle nebo lamp object + I/O field pro textovy stav
- Bool Appearance tag lampy: `"DB_HMI".LabPSU.Enable`
- Chybovy Appearance tag: `"DB_HMI".LabPSU.CurrentLimitExceeded`
- Textovy stavovy tag: `"DB_Status".LabPSU.StatusText`
- Text u lampy: `ZDROJ`
- Barva lampy:
  - `Enable = FALSE` -> seda
  - `Enable = TRUE` a `CurrentLimitExceeded = FALSE` -> modra
  - `CurrentLimitExceeded = TRUE` -> cervena
- Textovy stav z PLC zobraz jako Output I/O field.
- Ocekavane texty: `OFF`, `CONST`, `SINE DEBUG 0..A`, `SAFE OFF`.

### Objekt 25: Signalizacni objekt `SAFETY`
- Type: Circle nebo lamp object + I/O field pro textovy stav
- Bool Appearance tag lampy: `"DB_Status".Safety.TripActive`
- Doplňkovy tag pro rozliseni povoleni: `"DB_Status".Safety.PermitMotion`
- Textovy stavovy tag: `"DB_Status".Safety.StatusText`
- Text u lampy: `SAFETY`
- Barva lampy:
  - `TripActive = FALSE` a `PermitMotion = TRUE` -> zelena
  - `TripActive = FALSE` a `PermitMotion = FALSE` -> oranzova
  - `TripActive = TRUE` -> cervena
- Textovy stav z PLC zobraz jako Output I/O field.
- Ocekavane texty: `READY`, `E-STOP ACTIVE`, `SAFETY RELAY NOT OK`, `EXTERNAL FAULT`, `TEMP ALARM`, `VIBRATION ALARM`.

#### Prakticke vytvoreni lampy a textu v TIA

Pro kazdy celek vytvor dva objekty:

1. `Circle` nebo `Lamp` pro barvu.
2. `I/O field` v rezimu `Output` pro textovy stav.

U lampy:

1. Otevri `Properties -> Animations -> Appearance`.
2. Vloz Bool tag podle tabulky objektu.
3. Nastav `FALSE` a `TRUE` na vychozi barvy.
4. Pokud je k dispozici druha Appearance animace, pridej chybovy Bool tag s cervenou prioritou.
5. Pokud TIA dovoluje pouze jednu Bool Appearance animaci, pouzij jako barvu lampy chybovy tag (`TripActive` nebo `CurrentLimitExceeded`) a stav behu zobraz pouze textem.

U textoveho I/O fieldu:

1. Nastav objekt jako `I/O field` v rezimu `Output`.
2. Do process tagu vloz stavovy String tag z tabulky.
3. Nepridavej Input/Output pristup, aby obsluha stavovy text nemohla prepisovat.
4. Nastav stejny font jako u ostatnich diagnostickych textu, Tahoma 14 nebo 18 podle prostoru.
5. Text muze zustat cerne/tmave modro-sedy; stav je primarne signalizovan lampou a samotnym PLC textem.

U vsech tri lamp nastav `Animations -> Appearance` a u textu pouzij stavovy String tag. Barva tedy signalizuje kategorii stavu, zatimco text vysvetluje konkretni pricinu.

### Objekt 26: Prumer OB30 cycle time
- Type: I/O field (Output)
- Process tag: `"DB_LogRuntime".OB30_AverageCycleTime_ms`
- Data type: Real
- Format: `0.0 ms`
- Text/label: `OB30 avg:`
- Access: Output, bez moznosti zapisu
- Visibility tag: `"DB_LogRuntime".OB30_CycleTimeOutOfRange`
- Visibility:
  - `FALSE` -> objekt skryty
  - `TRUE` -> objekt zobrazen
- Text color: cervena, pokud je objekt zobrazen
- Poznamka: Prumer se pocita z platnych mereni OB30. Hranice jsou mimo rozsah `950..1050 ms`.

### Objekt 27: Varovani `OB30 CYCLE TIME`
- Type: Static text nebo I/O field pro text
- Text: `OB30 CYCLE TIME OUT OF RANGE`
- Visibility tag: `"DB_LogRuntime".OB30_CycleTimeOutOfRange`
- Visibility:
  - `FALSE` -> skryto
  - `TRUE` -> zobrazeno
- Text color: cervena
- Font: Tahoma, 14, Bold
- Umisteni: ve stejne diagnosticke oblasti jako Objekt 26
- V TIA nastav `Animations -> Visibility` nebo `Dynamization -> Visibility` podle verze.

## 3.4 Spodni navigace

### Objekt 28: Navigation bar
- Type: Rectangle
- Fill: velmi svetle seda
- Border: 1 px stredne seda

### Objekt 29-35: Tlacitka S1-S7
- Type: Button x7
- Rozmery a mezery: dle citu, ale konzistentni mezi S1-S7
- Font: Tahoma, 14, Bold
- Active screen (S1): Disabled state = ON, barva sedo-modra
- Ostatni: navigation event na prislusne obrazovky

## 4. Animace a dynamika stavu

## 4.1 Barva hlavniho status textu

Aplikovat color animation na Objekt 4 podle `"DB_Status".HMI_StatusColor`:

- 0 -> text color zelena (READY)
- 1 -> text color modra (RUNNING)
- 2 -> text color cervena (TRIP)
- 3 -> text color oranzova (WARNING)
- Else -> tmave modro-seda

## 4.2 Zvyseni viditelnosti TRIP

- Pokud `"DB_Status".HMI_StatusColor == 2`, zapnout blink 1 Hz pro Objekt 4.
- Pokud blink nebude citelny na panelu, fallback je trvala cervena bez blikani.

## 4.3 Barva LOG SAVED

Aplikovat color animation na Objekt 20 podle `"DB_LogRuntime".LastStopLogSaved`:

- TRUE -> zelena
- FALSE -> cervena

## 4.4 Jak nastavit zmenu barvy podle stavu v TIA (prakticky postup)

Pouzij tento postup pro kazdy prvek, ktery ma menit barvu podle tagu:

1. Otevri vlastnosti objektu (napr. text `HMI_StatusText`, indikator `LOG SAVED` nebo Max pole teploty kartace).
2. Najdi sekci `Animations` nebo `Dynamization` (podle verze TIA).
3. Zvol vlastnost, kterou chces menit:
  - pro stavovy text obvykle `Text color`
  - pro blok/pozadi obvykle `Fill color`
4. Vyber `Discrete` (stavove mapovani hodnot), ne linearni interpolaci.
5. Pripoj ridici tag:
  - `"DB_Status".HMI_StatusColor` pro RUN/STOP/TRIP/WARNING
  - `"DB_LogRuntime".LastStopLogSaved` pro YES/NO
6. Vytvor mapu hodnot -> barva:
  - 0 -> zelena (READY)
  - 1 -> modra (RUNNING)
  - 2 -> cervena (TRIP)
  - 3 -> oranzova (WARNING)
  - default -> tmave modro-seda
7. Pro TRIP volitelne pridej blink:
  - pod `Animations` zapni `Blink` jen pri hodnote 2
  - frekvence 1 Hz
8. Otestuj online zmenou tagu 0/1/2/3 a over, ze barva i text reaguji okamzite.

Poznamka: pokud TIA verze neumi podminenou animaci blikani primo na objektu, pouzij pomocny bool tag z PLC (napr. `HMI_TripBlinkEnable`) a tim blink spinat.

## 5. Vazby na tagy (kontrolni seznam)

- `"DB_LogConfig".StartTest` - AUTO pulse
- `"DB_LogConfig".StopTest` - STOP pulse
- `"DB_HMI".Spindle.Start` - AUTO pulse
- `"DB_HMI".Spindle.Stop` - STOP pulse
- `"DB_HMI".Spindle.Speed_RPM` - setpoint input
- `"DB_HMI".LabPSU.DebugAmplitude_A` - sinus amplitude setpoint input
- `"DB_HMI".Sensors.AI1_Teplota_Lozisko_C` - monitoring
- `"DB_HMI".Sensors.AI2_Teplota_Kartace_C` - monitoring
- `"DB_LogRuntime".MaxTempLozisko_C` - maximalni namerena teplota loziska
- `"DB_LogRuntime".MaxTempUhliky_C` - maximalni namerena teplota kartacu
- `"DB_LogRuntime".UjetaVzdalenost_km` - ujetá vzdalenost po sberacim krouzku
- `"DB_HMI".Sensors.TM_Rotation_A_Channel` - monitoring
- `"DB_Status".HMI_StatusText` - status text
- `"DB_Status".HMI_StatusColor` - status color animation
- `"DB_LogRuntime".TimeDisplay_HMI` - timer text
- `"DB_LogRuntime".OB30_AverageCycleTime_ms` - prumer OB30 pro diagnostiku
- `"DB_LogRuntime".OB30_CycleTimeOutOfRange` - visibility a cervene varovani
- `"DB_LogRuntime".LastStopLogSaved` - log ulozeno
- `"DB_LogRuntime".LastError` - posledni chyba

## 6. FAT test kroky pro Screen 1

## 6.1 Tlacitko AUTO

1. Predpodminka: `Safety.PermitMotion=TRUE`, `DB_LogConfig.Enable=TRUE` (LabPSU.Enable nastaví PLC při TestActive).
2. Akce: stisk AUTO.
3. Ocekavano:
   - Vznikne pulse na `StartTest` a `Spindle.Start`.
   - `DB_LogRuntime.TestActive` prejde na TRUE.
   - `HMI_StatusText` prejde na RUNNING.

## 6.2 Tlacitko STOP

1. Predpodminka: test bezi (`TestActive=TRUE`).
2. Akce: stisk STOP.
3. Ocekavano:
   - Vznikne pulse na `StopTest` a `Spindle.Stop`.
   - `TestActive` prejde na FALSE.
   - `LastStopLogSaved` po flush = TRUE.
   - Stav prejde na READY/STOPPED.

## 6.3 Pole RPM setpoint

1. Zadani hodnoty 16000.
2. Ocekavano: zapis na `Spindle.Speed_RPM`, bez alarmu.
3. Zadani hodnoty mimo rozsah (napr. 25000).
4. Ocekavano: HMI odmita nebo oreze dle limitu.

## 6.4 Pole Sinusovy proud

1. Zadani hodnoty 10.0 A.
2. Ocekavano: zapis na `LabPSU.DebugAmplitude_A`.
3. Zadani 100.0 A.
4. Ocekavano: HMI odmita nebo oreze na limit 60.

## 6.5 Status panel

1. Simulovat `HMI_StatusColor = 0/1/2/3`.
2. Ocekavano:
   - Text je READY/RUNNING/TRIP/WARNING.
   - Barva odpovida mape.
   - Pri TRIP blikani 1 Hz (pokud aktivni).

## 6.6 Monitoring hodnot

1. Test proved pouze na produkcnim PLC; nepouzivej PLCSIM Advanced ani WinCC.
2. Pred startem testu zapis aktualni hodnoty `MaxTempLozisko_C` a `MaxTempUhliky_C`.
3. Spust test tlacitkem AUTO.
4. Ocekavano: obe hodnoty `Max` se pri startu vynuluji na `0.0 C` a behem testu se rovnaji nebo jsou vyssi nez odpovidajici hodnota `Akt`.
5. Zastav test tlacitkem STOP.
6. Ocekavano: obe hodnoty `Max` zustanou zobrazene beze zmeny po ukonceni testu.
7. Spust novy test.
8. Ocekavano: obe hodnoty `Max` se opet vynuluji na `0.0 C`.
9. Over, ze HOME neobsahuje zapisovatelne pole teplotniho limitu.
10. Over, ze `UjetaVzdalenost_km` se pri AUTO vynuluje, behem testu roste a po STOP nebo poruse zustane zachovana.

## 6.7 LOG SAVED indikator

1. Po STOP s uspesnym flush: `LastStopLogSaved=TRUE`.
2. Ocekavano: text `YES`, zelena.
3. Vynutit chybu flush.
4. Ocekavano: text `NO`, cervena.

## 6.8 OB30 cycle-time indikator

1. Pri prumeru `950..1050 ms` overit:
  - `OB30_CycleTimeOutOfRange = FALSE`.
  - pole `OB30 avg` a varovani nejsou viditelne.
2. Nasimulovat nebo vyvolat prumer mimo rozsah, napr. `<950 ms` nebo `>1050 ms`.
3. Ocekavano:
  - `OB30_CycleTimeOutOfRange = TRUE`.
  - zobrazi se prumerna hodnota `OB30_AverageCycleTime_ms`.
  - hodnota i text `OB30 CYCLE TIME OUT OF RANGE` jsou cervene.

## 7. Done kriterium pro Screen 1

- Vsechny objekty 1-35 jsou vytvorene a vizualne sedi na layout.
- Vsechny tag vazby jsou funkcni.
- Pulse tlacitka funguji spolehlive.
- Status barvy odpovidaji mape.
- FAT kroky 6.1-6.8 jsou splnene a zaznamenane.
- HOME zobrazuje pouze aktualni a maximalni namerene teploty; teplotni limity nejsou na HOME zapisovatelne.
