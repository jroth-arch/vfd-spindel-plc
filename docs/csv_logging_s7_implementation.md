# CSV Logging to SD Card on S7-1500 (Implementation Guide)

## Overview
This document describes the implementation of CSV logging to the SD card on Siemens S7-1500 PLC using standard Siemens file handling blocks. Each test run creates a new CSV file with a unique name (timestamp-based). Data is written in append mode, with a header written once at the start, followed by data rows for each sample.

## File Handling Blocks Used
- **SFB52 ("FileOpen")**: Opens or creates a file on the SD card.
- **SFB53 ("FileRead")**: Not used for logging, but available for reading files.
- **SFB54 ("FileWrite")**: Writes data to an open file.
- **SFB56 ("FileClose")**: Closes an open file.
- **SFB58 ("FileDelete")**: (Optional) Deletes files if needed.

## File Naming
- The file name is generated in the PLC as `DB_LogRuntime.FileName`, e.g. `20260518-153012.csv`.
- Each test run generates a new file name before logging starts.
- Files are stored in the `UserFiles/` subfolder on the SD card.
- **IMPORTANT**: The `UserFiles/` folder is automatically created by the PLC on the first flush if it does not exist.

## Logging Sequence (State Machine)
1. **STEP_OPEN**
   - Call SFB52 (FileOpen) with mode `APPEND` (mode 16#10) and the generated file name.
   - If the file does not exist, it is created.
   - On first open, proceed to write header; otherwise, skip to writing data rows.
2. **STEP_WR_HEADER**
   - Prepare the CSV header string (e.g. `t_s,RPM,T_Lozisko,T_Uhliky,Vibrace,ProudUhliky,State,RunLatched,TripActive,TripCode,SafetyText\r\n`).
   - Call SFB54 (FileWrite) to write the header.
   - Set `DB_LogRuntime.HeaderWritten := TRUE` after successful write.
3. **STEP_WR_ROW**
   - For each row in the buffer to be flushed, format the data as a CSV string (decimal separator = dot, comma-separated, end with `\r\n`).
   - Call SFB54 (FileWrite) for each row.
4. **STEP_CLOSE**
   - Call SFB56 (FileClose) to close the file.
   - On success, acknowledge flush and update buffer indices.

## Example SCL Code Snippets

### FileOpen (SFB52)
```
FileOpen_1(
  EN := TRUE,
  FileName := DB_LogRuntime.FileName,
  Mode := 16#10, // APPEND
  pDevice := 'SD',
  FileHandle => FileHandle,
  Status => FileStatus
);
```

### FileWrite (SFB54)
```
FileWrite_1(
  EN := TRUE,
  FileHandle := FileHandle,
  pBuffer := ADR(Buffer),
  Length := LEN(Buffer),
  Status => FileStatus
);
```
- `Buffer` is a STRING or CHAR array containing the CSV line.

### FileClose (SFB56)
```
FileClose_1(
  EN := TRUE,
  FileHandle := FileHandle,
  Status => FileStatus
);
```

## Notes
- All file operations must check the `Status` output for errors.
- FileHandle must be managed carefully (open/close per flush cycle).
- The header is written only if `DB_LogRuntime.HeaderWritten = FALSE`.
- Data rows are written in a loop for each buffer entry to be flushed.
- After flush, update `TrendReadIdx` and acknowledge flush to LogManager.
- Use `\r\n` as line ending for compatibility.
- All numbers should be formatted with a dot as decimal separator.

## Troubleshooting
- If the SD card is missing or full, file operations will return an error in `Status`.
- Always close the file after writing to avoid data loss.
- If a flush fails, increment `FlushErrorCount` and set `LastFlushOk := FALSE`.
- The `UserFiles/` folder is automatically created on first flush - no manual setup required.

## References
- Siemens S7-1500 System Manual: File Operations
- TIA Portal Help: SFB52, SFB54, SFB56
