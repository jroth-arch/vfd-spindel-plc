# HMI Layout - KTP700 Basic PN (Industrial Classic)

Tento dokument popisuje rozložení HMI obrazovek pro provoz testovacího standu.

## 1) Cíl dokumentu

Tento návrh je určen pro Siemens KTP700 Basic PN a slouží jako implementační podklad pro HMI.
Rozhraní je rozdělené do 7 obrazovek přepínaných HW tlačítky.

## 2) Vizuální standard (fixní)

Použit je pouze styl Industrial Classic.

### Barvy
- Pozadí panelu: #D7DCE1
- Karty/pole: #EEF1F4
- Rámečky: #7F8A93
- Text primární: #1F2A33
- READY/OK: #2E7D32
- RUNNING: #1565C0
- WARNING: #F9A825
- TRIP/ERROR/STOP: #C62828
- Disabled: #9AA5AF

### Typografie
- Font: Tahoma
- Hlavní stav: 24 px Bold
- Nadpis sekce: 18 px Bold
- Label: 14 px Regular
- Hodnota: 18 px Bold

### Layout pravidla
- Grid: 8 px
- Vnější okraj: 16 px
- Vnitřní padding karet: 12 px
- Mezery mezi kartami: 12 px
- Radius rohů: 0 px
- Stíny: nepoužívat

## 3) Obrazovka 1 - HOME (řízení testu)

Tato obrazovka je hlavní operátorský pohled.

### ASCII návrh
+--------------------------------------------------------------+
| HOME | Stav: READY/RUNNING/TRIP | Timer: D:HH:MM:SS         |
+-------------------------------+------------------------------+
| OVLADANI                      | MONITORING                   |
| [AUTO] [STOP]                 | Teplota lozisko: xx.x C      |
| RPM setpoint:     [ 16000 ]   | Prah lozisko:    xx.x C      |
| Cyklicky proud:   [ 10.0  ]   | Teplota kartace: xx.x C      |
|                               | Prah kartace:    xx.x C      |
|                               | Max teplota:     xx.x C      |
|                               | Aktualni RPM:    xxxxx       |
|                               | LOG SAVED: YES/NO            |
|                               | Duvod blokace: text          |
|                               | Last error: text             |
+-------------------------------+------------------------------+
| NAV: S1 | S2 | S3 | S4 | S5 | S6 | S7                        |
+--------------------------------------------------------------+

### Povinné tagy
- `"DB_LogConfig".StartTest` (AUTO pulse, 200 ms)
- `"DB_LogConfig".StopTest` (STOP pulse, 200 ms)
- `"DB_HMI".Spindle.Speed_RPM`
- `"DB_HMI".LabPSU.ConstCurrent_A`
- `"DB_HMI".Sensors.AI1_Teplota_Lozisko_C`
- `"DB_Config".TempHighThreshold_C`
- `"DB_HMI".Sensors.TM_Rotation_A_Channel`
- `"DB_Status".HMI_StatusText`
- `"DB_Status".HMI_StatusColor`
- `"DB_LogRuntime".LastStopLogSaved`
- `"DB_LogRuntime".LastError`

## 4) Obrazovka 2 - LAB PSU

Tato obrazovka je určená pro zdroj a proudový profil.

### ASCII návrh
+--------------------------------------------------------------+
| LAB PSU                                                      |
+--------------------------------------------------------------+
| Enable standalone: [ON/OFF]                                 |
| Rezim: [CONST] [SINUS]  (default SINUS)                     |
| Max proud rozsah: [ xx.x A ]                                |
| Pozn.: sinus xx.x A = +/- xx.x/2 na pulvlnu                 |
| Perioda: [ xx.x min ]                                        |
| Base voltage: [ xx.x V ]                                     |
| Offset: [ xx.x A ]                                           |
| Amplituda: [ xx.x A ]                                        |
| Diagnosticky text: text                                      |
| Aktualni proud: xx.x A   Aktualni napeti: xx.x V             |
| Current limit exceeded: YES/NO                               |
+--------------------------------------------------------------+

### Povinné tagy
- `"DB_HMI".LabPSU.Enable`
- `"DB_HMI".LabPSU.Mode`
- `"DB_HMI".LabPSU.ConstCurrent_A`
- `"DB_HMI".LabPSU.DebugAmplitude_A`
- `"DB_HMI".LabPSU.DebugPeriod_min`
- `"DB_HMI".LabPSU.BaseVoltage_V`
- `"DB_HMI".LabPSU.CurrentOffset_A`
- `"DB_Status".LabPSU.StatusText`
- `"DB_Status".LabPSU.CurrentSet_A`
- `"DB_Status".LabPSU.VoltageSet_V`

## 5) Obrazovka 3 - VRETENO

Tato obrazovka je určená pro detail řízení vřetena.

### ASCII návrh
+--------------------------------------------------------------+
| VRETENO                                                      |
+--------------------------------------------------------------+
| Enable: [ON/OFF]                                             |
| RPM setpoint: [ xxxxx ]                                      |
| Aktualni RPM: xxxxx                                          |
| State: STOPPED/RUN_CMD/STOPPING/TRIP                         |
| RunLatched: TRUE/FALSE                                       |
| TripActive: TRUE/FALSE                                       |
| TripCode: n                                                  |
| Diagnosticky text: text                                      |
| [RESET FAULT]                                                |
+--------------------------------------------------------------+

### Povinné tagy
- `"DB_HMI".Spindle.Speed_RPM`
- `"DB_HMI".Sensors.TM_Rotation_A_Channel`
- `"DB_Status".Spindel.State`
- `"DB_Status".Spindel.StatusText`
- `"DB_Status".Spindel.RunLatched`
- `"DB_Status".Spindel.TripActive`
- `"DB_Status".Safety.TripCode`
- `"DB_HMI".Spindle.ResetFault` (pulse 200 ms)

## 6) Obrazovky 4-7 (placeholder)

- S4: Safety a alarmy
- S5: Logování a soubory
- S6: I/O diagnostika
- S7: Servis/simulace/verze

## 7) Operátorský tok

### AUTO
1. Nastavit RPM a cyklický proud.
2. Ověřit Safety OK.
3. Stisk AUTO.
4. Ověřit RUNNING + timer + feedback.

### STOP
1. Stisk STOP.
2. Ověřit pokles RPM na 0.
3. Ověřit READY/STOPPED.
4. Ověřit LOG SAVED.

## 8) Otevřené body pro finalizaci grafiky

1. Citelnost na realnem KTP700 v hale.
2. Rozlisitelnost WARNING vs RUNNING.
3. Blikani TRIP textu 1 Hz a jeho vliv na citelnost.
4. Finalni umisteni navigace S1-S7.
5. Sirka pole timeru D:HH:MM:SS pro vice denni testy.
6. Dotykove plochy pro obsluhu v rukavicich.
7. Zkracovani dlouhych textu LastError.
8. Konzistence ikon Safety/Log/Spindle/LabPSU.
