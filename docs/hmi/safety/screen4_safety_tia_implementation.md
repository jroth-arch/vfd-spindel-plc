# Screen 4 - BEZPECNOST a ALARMY

TIA checklist pro zobrazeni bezpecnostniho stavu, poruch a teplotnich alarmu.

## Objekty

### 1. Signalka bezpecnosti
- Type: Circle/Lamp
- Tag: `"DB_Status".Safety.TripActive`
- FALSE + PermitMotion TRUE -> zelena, `BEZPECNOST V PORADKU`
- FALSE + PermitMotion FALSE -> oranzova, `POHON BLOKOVAN`
- TRUE -> cervena, `PORUCHA AKTIVNI`

### 2. Safety text
- Type: I/O field Output
- Tag: `"DB_Status".Safety.StatusText`
- Pro obsluhu zobraz ceske texty: `PRIPRAVENO`, `Nouzové tlačítko stisknuto`, `BEZPECNOSTNI RELE NENI PRIPRAVENO`, `PORUCHA EXTERNIHO ZARIZENI`, `PREKROCENA TEPLOTA`, `KRITICKE VIBRACE`.

### 3. Bezpecnostni okruh v poradku
- Type: I/O field Output nebo lamp
- Tag: `"DB_Status".Safety.SafetyOk`
- TRUE -> `ANO`, zelena
- FALSE -> `NE`, cervena

### 4. Pohon povolen
- Type: I/O field Output
- Tag: `"DB_Status".Safety.PermitMotion`
- TRUE -> `ANO`, zelena
- FALSE -> `NE`, oranzova/cervena

### 5. Kod poruchy
- Type: I/O field Output nebo symbolic list
- Tag: `"DB_Status".Safety.TripCode`
- Mapping: `0=BEZ PORUCHY`, `1=Nouzové tlačítko stisknuto`, `2=BEZPECNOSTNI RELE`, `3=PORUCHA EXTERNIHO ZARIZENI`, `4=PREKROCENA TEPLOTA`, `5=KRITICKE VIBRACE`, `6=SYSTEM NEPOVOLEN`

### 6. Alarmy teplot
- Type: Circle/Lamp + text
- Tags: `"DB_Alarms".TempHighLozisko`, `"DB_Alarms".TempHighKartace`, `"DB_Alarms".TempAlarm`
- Jednotlive alarmy zobraz cervene pri TRUE.

### 7. Fyzicke safety vstupy
- Type: I/O field Output
- Tags: `"DB_IO".DI.SafetyRelayAuxOk`, `"DB_IO".DI.EmergencyStop`, `"DB_IO".DI.ExternalFault`

## FAT

1. Zaklad: SafetyOk TRUE, PermitMotion TRUE, TripActive FALSE.
2. Nastav simulovany E-Stop TRUE.
3. Over TripActive TRUE, TripCode 1, PermitMotion FALSE a cervenou signalizaci.
4. Vrat E-Stop FALSE a over, ze nedojde k automatickemu restartu.
5. Nastav `SimTempLozisko_C` nad `TempHighLoziskoThreshold_C`.
6. Over `TempHighLozisko` a `TempAlarm` TRUE.
7. Opakuj test pro kartac s `TempHighKartaceThreshold_C`.
8. Vycisti alarm a proveď RESET podle procesu.
