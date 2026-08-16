# Screen 7 - NASTAVENI TESTU

TIA checklist pro servisni nastaveni testu. Obrazovka musi byt chranena uzivatelskym opravnenim a obsahuje dva panely se shodnym nazvem `NASTAVENI TESTU`.

## Levý panel - synchronizace casu

### Synchronizovat cas

- Type: Button
- Text: `Synchronizovat cas`
- Akce: Vyvola pozadavek na synchronizaci casu s nakonfigurovanym NTP serverem.
- Poznamka: Konkretni PLC/HMI tag a NTP konfigurace jsou soucasti backlogu BL-14.

### Stav synchronizace

- Type: Output text
- Vychozi text: `V PORADKU`, pokud uz probehla uspesna synchronizace; jinak `NENI K DISPOZICI`.
- Po dokonceni zobraz: `V PORADKU` nebo `NTP SERVER NEDOSTUPNY`.

### Posledni synchronizace

- Type: Output text
- Zobrazuje datum a cas posledni uspesne NTP synchronizace.
- Pri dosud neuspesne synchronizaci zobraz: `NENI K DISPOZICI`.

## Pravý panel - nastaveni testu

Oba panely na obrazovce jsou urceny pouze pro servisni nastaveni; simulacni override vstupu na S7 nejsou soucasti teto obrazovky.

### Prah teploty loziska

- Type: I/O field (Input)
- Tag: `"DB_Config".TempHighLoziskoThreshold_C`
- Format: `0.0 C`
- Input limit: min `0.0`, max `100.0`
- Label: `Max. teplota loziska`

### Prah teploty kartacu

- Type: I/O field (Input)
- Tag: `"DB_Config".TempHighKartaceThreshold_C`
- Format: `0.0 C`
- Input limit: min `0.0`, max `100.0`
- Label: `Max. teplota kartace`

### Prumer sberaciho krouzku

- Type: I/O field (Input)
- Tag: `"DB_Config".PrumerKrouzku_mm`
- Format: `0.0 mm`
- Input limit: min `1.0`, max `500.0`
- Label: `Prumer krouzku`
- Poznamka: Hodnota urcuje efektivni prumer kontaktni drahy uhliku a pouziva se pro vypocet ujeté vzdalenosti.

### Perioda sinusoveho proudu

- Type: I/O field (Input)
- Tag: `"DB_HMI".LabPSU.DebugPeriod_min`
- Format: `0.0 min`
- Input limit: min `1.0`, max `60.0`
- Label: `Perioda sinu`
- Poznamka: Hodnota urcuje periodu sinusoveho proudu v rezimu `SINE_DEBUG`. Nastaveni je servisni a na S1 HOME se nezobrazuje.

Teplotni limity se na S1 HOME nezobrazuji ani nenastavuji. S1 HOME zobrazuje pouze aktualni a maximalni namerene teploty.

## Ostatni konfigurace

- `"DB_Config".VibCriticalThreshold`
- `"DB_HMI".LabPSU.MaxCurrent_A`

## Verze

- PLC program version

## Bezpecnostni pravidla

- Screen 7 nesmi byt dostupny bez servisniho prihlaseni.
- Panel `KONFIGURACE TEPLOT` a jeho vstupy musi byt zamknute bez servisniho opravneni.
- NTP konfigurace a synchronizace musi byt omezena na servisni opravneni.

## FAT

1. Prihlas servisniho uzivatele.
2. Over, ze bez servisniho prihlaseni nelze zmenit parametry ani spustit synchronizaci casu.
3. Zadej do obou poli `NASTAVENI TESTU` hodnotu v rozsahu `0.0..100.0 C` a over zapis na prislusny `DB_Config` tag.
4. Zadej periodu sinu v rozsahu `1.0..60.0 min` a over zapis na `"DB_HMI".LabPSU.DebugPeriod_min`.
5. Stiskni `Synchronizovat cas` a po implementaci BL-14 over vysledek oproti nakonfigurovanemu NTP serveru.
