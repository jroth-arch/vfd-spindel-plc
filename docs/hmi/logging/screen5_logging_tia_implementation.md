# Screen 5 - LOGOVANI a SOUBORY

TIA checklist pro stav testu, timer, CSV soubor a flush na SD.

## Objekty

### 1. Test active
- Type: I/O field Output nebo lamp
- Tag: `"DB_LogRuntime".TestActive`
- FALSE -> `READY`, seda/zelena
- TRUE -> `RUNNING`, modra

### 2. Timer
- Type: I/O field Output
- Tag: `"DB_LogRuntime".TimeDisplay_HMI`
- Type: String[21]
- Aktualizace: kazdou sekundu

### 3. Elapsed time
- Type: I/O field Output
- Tag: `"DB_LogRuntime".ElapsedTime_HMI`
- Format: `HHH:MM:SS`

### 4. File name
- Type: I/O field Output
- Tag: `"DB_LogRuntime".FileName`
- Access: Output

### 5. Sample counter
- Type: I/O field Output
- Tag: `"DB_LogRuntime".SampleCounter`

### 6. Flush status
- Type: I/O fields Output
- Tags: `"DB_LogRuntime".LastFlushOk`, `FlushErrorCount`, `LastStopLogSaved`, `LastError`
- `LastFlushOk=TRUE` -> zelena
- chyba -> cervena
- Pri ukonceni testu safety poruchou je `LastStopLogSaved=TRUE` pouze po uspesnem finalnim flushi.
- `LastError` zobrazuje citelny duvod poruchy, napr. `PREKROCENA TEPLOTA LOZISKA`; chyba zapisu na SD muze tento text nahradit diagnostikou `FILEWRITEC STATUS ...`.

### 7. OB30 diagnostika
- Tags: `"DB_LogRuntime".OB30_AverageCycleTime_ms`, `OB30_CycleTimeOutOfRange`
- Zobraz pouze pri `OB30_CycleTimeOutOfRange=TRUE`.

## FAT

1. Spust test AUTO.
2. Over neprázdný `FileName` a `TestActive=TRUE`.
3. Sleduj timer po sekundach.
4. Po priblizne 6 s over rust `SampleCounter`.
5. Po flush over `LastFlushOk=TRUE` a `FlushErrorCount=0`.
6. Proveď STOP a over `LastStopLogSaved=TRUE` po final flush.
7. Ověř cestu `UserFiles/<FileName>.csv`.
8. Pouze na produkcnim PLC vyvolej prekroceni teploty loziska behem aktivniho testu.
9. Over `TestActive=FALSE`, `LastError=PREKROCENA TEPLOTA LOZISKA` a po finalnim flushi `LastStopLogSaved=TRUE`.
10. Pro tento test nepouzivej PLCSIM Advanced ani WinCC.
