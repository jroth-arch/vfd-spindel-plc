# Screen 2 - LAB PSU

TIA checklist pro KTP700 Basic PN. Obrazovka slouží k nastavení a diagnostice laboratorního zdroje v režimu SINE_DEBUG.

## Objekty

### 1. Nadpis
- Type: Static text
- Text: `LAB PSU`
- Font: Tahoma 18 Bold
- Barva: tmave modro-seda

### 2. Enable
- Type: I/O field Input
- Tag: `"DB_HMI".LabPSU.Enable`
- Type/range: Bool zobrazeny ciselne, pouze `0` nebo `1`
- Mapovani: `0=FALSE`, `1=TRUE`
- Poznamka: AUTO muze hodnotu nastavit automaticky pri startu testu.

### 3. Rezim zdroje
- Vytvor dva objekty vedle sebe:
	- I/O field Input, tag: `"DB_HMI".LabPSU.Mode`, typ/range: cele cislo `0..2`
	- I/O field Output nebo symbolic text, stejne cteni tagu `"DB_HMI".LabPSU.Mode`
- Mapovani vystupniho textu: `0=OFF`, `1=CONST`, `2=SINE_DEBUG`
- AUTO muze rezim nastavit na `2` (`SINE_DEBUG`).

### 4. Sinusovy proud - maximum
- Type: I/O field Input
- Tag: `"DB_HMI".LabPSU.DebugAmplitude_A`
- Range: 0-38 A
- Význam: maximum celeho proudu `0..A`
- Font: Tahoma 18 Bold

### 5. Perioda sinu
- Type: I/O field Input
- Tag: `"DB_HMI".LabPSU.DebugPeriod_min`
- Range: 1-60 min
- Font: Tahoma 18 Bold

### 6. Konstantni proud - okrajovy rezim
- Type: I/O field Input
- Tag: `"DB_HMI".LabPSU.ConstCurrent_A`
- Range: 0-60 A
- Pouziti pouze pri `Mode=1`.

### 7. Stavovy text zdroje
- Type: I/O field Output
- Tag: `"DB_Status".LabPSU.StatusText`
- Ocekavane texty: `OFF`, `CONST`, `SINE DEBUG 0..A`, `SAFE OFF`.
- Umisteni: karta `MONITORING`, label `Stavovy text`.

### 8. Aktualni proud
- Type: I/O field Output
- Tag: `"DB_Status".LabPSU.CurrentSet_A`
- Format: `0.0 A`

### 9. Current limit alarm
- Type: Circle/Lamp + Static text
- Tag: `"DB_HMI".LabPSU.CurrentLimitExceeded`
- FALSE -> skryto nebo zelena
- TRUE -> viditelne, cervena, text `CURRENT LIMIT`

## FAT

1. Nastav `Enable=1`; over zapis `TRUE` na `"DB_HMI".LabPSU.Enable`.
2. Nastav postupne `Mode=0`, `1` a `2`; over vystupni text `OFF`, `CONST` a `SINE_DEBUG`.
3. Over, ze HMI odmita nebo omezi `Enable` mimo `0..1` a `Mode` mimo `0..2`.
4. Nastav `Mode=2`, `DebugAmplitude_A=5.0`, `DebugPeriod_min=1.0`.
5. Spust AUTO a over `Enable=TRUE`, `State=2` a stavovy text `SINE DEBUG 0..A`.
6. Sleduj `CurrentSet_A`: musi byt priblizne `0..5 A`.
7. Zkontroluj, ze zmena `CurrentOffset_A` nema v SINE_DEBUG vliv.
8. Nastav `DebugAmplitude_A=38.0` a over limit.
9. Po STOP over `State=0`, `Enable=FALSE`, stavovy text `SAFE OFF` a `AQ3_OutputOff=5.0 V`.
