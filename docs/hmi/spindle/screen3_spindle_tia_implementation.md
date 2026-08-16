# Screen 3 - VRETENO

TIA checklist pro detailni ovladani a diagnostiku spindle drive.

## Objekty

### 1. RPM setpoint
- Type: I/O field Input
- Tag: `"DB_HMI".Spindle.Speed_RPM`
- Range: 0-18000 RPM
- Font: Tahoma 18 Bold

### 2. Aktualni RPM
- Type: I/O field Output
- Tag: `"DB_HMI".Sensors.TM_Rotation_A_Channel`
- Format: `0 RPM`

### 3. Stav vřetena
- Type: I/O field Output
- Tag: `"DB_Status".Spindel.StatusText`
- Pro obsluhu zobraz ceske texty: `ZASTAVENO`, `POVEL K BEHU`, `ZASTAVOVANI`, `PORUCHA - BLOKOVANO BEZPECNOSTI`.

### 4. Stav vretene
- Type: I/O field Output nebo symbolic list
- Tag: `"DB_Status".Spindel.State`
- Mapping: `0=ZASTAVENO`, `1=POVEL K BEHU`, `2=ZASTAVOVANI`, `3=PORUCHA`

### 5. Run lamp
- Type: Circle/Lamp
- Tag: `"DB_Status".Spindel.RunLatched`
- FALSE -> seda; TRUE -> modra

### 6. Signalka poruchy
- Type: Circle/Lamp
- Tag: `"DB_Status".Spindel.TripActive`
- FALSE -> zelena/seda; TRUE -> cervena

### 7. RESET PORUCHY
- Type: Button
- Text: `RESET PORUCHY`
- Press: `"DB_HMI".Spindle.ResetFault := TRUE`
- Release: `"DB_HMI".Spindle.ResetFault := FALSE`
- Signal: pulse 100-300 ms

### 8. Diagnostika výstupu
- Tags Output: `"DB_IO".DQ.RunForwardCmd`, `"DB_IO".AQ.SpeedVoltage`, `"DB_IO".DQ.FaultResetCmd`
- `RunForwardCmd=TRUE` -> běhový povel
- `SpeedVoltage` zobraď jako `0.0 V`

## Appearance

- `State=0` -> seda
- `State=1` -> modra
- `State=2` -> oranzova
- `State=3` -> cervena
- Pri `TripActive=TRUE` muze lamp/StatusText blikat 1 Hz.

## FAT

1. Nastav `Speed_RPM=12000`.
2. Over `PermitMotion=TRUE`, `TripActive=FALSE`.
3. Stiskni AUTO nebo samostatne Start pulse.
4. Over `RunLatched=TRUE`, `State=1`, `RunForwardCmd=TRUE`.
5. Stiskni RESET FAULT v bezporuchovem stavu; nesmi spustit běh.
6. Vyvolej STOP a over `State=0`, `RunLatched=FALSE`, `SpeedVoltage=0`.
7. Vyvolej safety trip a over `State=3`, `TripActive=TRUE`, `RunForwardCmd=FALSE`.
