# SCL Snippet: CSV Logging to SD Card (S7-1500, FB_LogFlushToSd)

## Instance Declarations (in FB_LogFlushToSd)
```
VAR
    FileOpen_1 : SFB52;
    FileWrite_1 : SFB54;
    FileClose_1 : SFB56;
    FileHandle : DWord := 0;
    FileStatus : Word := 0;
    CsvBuffer : String[256]; // Buffer for header/data row
END_VAR
```

## STEP_OPEN: Open or create file (append mode)
```
FileOpen_1(
    EN := TRUE,
    FileName := "DB_LogRuntime".FileName,
    Mode := 16#10, // APPEND
    pDevice := 'SD',
    FileHandle => FileHandle,
    Status => FileStatus
);
IF FileOpen_1.DONE THEN
    IF "DB_LogRuntime".HeaderWritten THEN
        Step := STEP_WR_ROW;
    ELSE
        Step := STEP_WR_HEADER;
    END_IF;
ELSIF FileOpen_1.ERROR THEN
    Step := STEP_ERROR;
END_IF;
```

## STEP_WR_HEADER: Write CSV header
```
CsvBuffer := 't_s,RPM,T_Lozisko,T_Uhliky,Vibrace,ProudUhliky,State,RunLatched,TripActive,TripCode,SafetyText\r\n';
FileWrite_1(
    EN := TRUE,
    FileHandle := FileHandle,
    pBuffer := ADR(CsvBuffer),
    Length := LEN(CsvBuffer),
    Status => FileStatus
);
IF FileWrite_1.DONE THEN
    "DB_LogRuntime".HeaderWritten := TRUE;
    Step := STEP_WR_ROW;
ELSIF FileWrite_1.ERROR THEN
    Step := STEP_ERROR;
END_IF;
```

## STEP_WR_ROW: Write one data row from TrendBuffer[RowIdx]
```
// Format CSV row (example, adjust for your UDT_LogRecord fields)
CsvBuffer := CONCAT(REAL_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].t_s), ',');
CsvBuffer := CONCAT(CsvBuffer, REAL_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].RPM));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, REAL_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].T_Lozisko));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, REAL_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].T_Uhliky));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, REAL_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].Vibrace));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, REAL_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].ProudUhliky));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, INT_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].State));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, BOOL_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].RunLatched));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, BOOL_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].TripActive));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, INT_TO_STRING("DB_LogBuffer".TrendBuffer[RowIdx].TripCode));
CsvBuffer := CONCAT(CsvBuffer, ',');
CsvBuffer := CONCAT(CsvBuffer, "DB_LogBuffer".TrendBuffer[RowIdx].SafetyText);
CsvBuffer := CONCAT(CsvBuffer, '\r\n');
FileWrite_1(
    EN := TRUE,
    FileHandle := FileHandle,
    pBuffer := ADR(CsvBuffer),
    Length := LEN(CsvBuffer),
    Status => FileStatus
);
IF FileWrite_1.DONE THEN
    Step := STEP_NEXT_ROW;
ELSIF FileWrite_1.ERROR THEN
    Step := STEP_ERROR;
END_IF;
```

## STEP_CLOSE: Close file
```
FileClose_1(
    EN := TRUE,
    FileHandle := FileHandle,
    Status => FileStatus
);
IF FileClose_1.DONE THEN
    Step := STEP_ACK;
ELSIF FileClose_1.ERROR THEN
    Step := STEP_ERROR;
END_IF;
```

## Notes
- Always check .DONE and .ERROR for each SFB call.
- FileHandle must be valid for FileWrite and FileClose.
- Use REAL_TO_STRING, INT_TO_STRING, BOOL_TO_STRING for formatting.
- Adjust CsvBuffer size if needed for long rows.
- All string concatenation uses dot as decimal separator.
- Use '\r\n' for line endings.
