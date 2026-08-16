# Safety Trip Final Flush Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On every safety trip during an active test, store the final measurement, preserve a readable error reason, and complete the existing SD final flush.

**Architecture:** `FB_LogManager` already owns manual-stop record creation and `FlushPending`; it will receive the two temperature-alarm booleans, detect a `TripActive` rising edge, and execute the same final-record flow with `StopReason = 3`. Safety shutdown remains in `FB_SafetyGate`, `FB_DriveCtrl`, and `FB_LabPSU`; no safety timing is changed.

**Tech Stack:** Siemens SCL in `plc/program.scl`, FileWriteC final flush, production PLC FAT.

---

### Task 1: Add Trip Finalization to FB_LogManager

**Files:**
- Modify: `plc/program.scl`

- [ ] **Step 1: Add required inputs and edge memory**

Add `TempHighLozisko` and `TempHighKartace` as `Bool` inputs next to existing trip inputs. Add `prevTripActive : Bool := FALSE;` to the instance state.

- [ ] **Step 2: Implement the trip-edge final record**

Before the manual-stop block, add an `IF Enable AND TestActive AND TripActive AND NOT prevTripActive` block that:

```scl
"DB_LogRuntime".StopSequenceActive := TRUE;
"DB_LogRuntime".LastStopLogSaved := FALSE;
StopReason := 3;
```

Populate the final `TrendBuffer` record with the current inputs, `TestActive := FALSE`, and `StopReason := 3`; then advance `TrendWriteIdx`, set `TestActive := FALSE`, `FlushPending := TRUE`, and `LastFlushTrigger := 3`.

- [ ] **Step 3: Map LastError text on the trip edge**

Use this exact SCL precedence:

```scl
IF TempHighLozisko AND TempHighKartace THEN
    "DB_LogRuntime".LastError := 'PREKROCENA TEPLOTA LOZISKA A KARTACU';
ELSIF TempHighLozisko THEN
    "DB_LogRuntime".LastError := 'PREKROCENA TEPLOTA LOZISKA';
ELSIF TempHighKartace THEN
    "DB_LogRuntime".LastError := 'PREKROCENA TEPLOTA KARTACU';
ELSE
    CASE TripCode OF
        1: "DB_LogRuntime".LastError := 'Nouzové tlačítko stisknuto';
        2: "DB_LogRuntime".LastError := 'ZKONTROLUJ BEZPECNOSTNI RELE';
        3: "DB_LogRuntime".LastError := 'PORUCHA EXTERNIHO ZARIZENI';
        5: "DB_LogRuntime".LastError := 'KRITICKE VIBRACE';
        ELSE "DB_LogRuntime".LastError := SafetyText;
    END_CASE;
END_IF;
```

- [ ] **Step 4: Update trip-edge state**

After the stop and trip detection blocks, assign:

```scl
prevTripActive := TripActive;
```

- [ ] **Step 5: Wire the two alarm booleans in OB30**

At the existing `LogManager` call, add:

```scl
TempHighLozisko := "DB_Alarms".TempHighLozisko,
TempHighKartace := "DB_Alarms".TempHighKartace,
```

### Task 2: Verify and Document FAT

**Files:**
- Modify: `docs/test_specification.md`
- Modify: `docs/hmi/logging/screen5_logging_tia_implementation.md`

- [ ] **Step 1: Add FAT procedure**

Document a bearing-temperature trip test which confirms:

```text
1. Start a production PLC test and wait for at least one recorded sample.
2. Cause the bearing temperature to exceed its approved limit.
3. Confirm immediate safety shutdown.
4. Confirm TestActive=FALSE, StopReason=3, FlushPending rises, and LastError is PREKROCENA TEPLOTA LOZISKA.
5. Wait for final flush and confirm LastStopLogSaved=TRUE.
6. Retrieve the CSV and confirm its final record has StopReason=3 and the trip data.
```

- [ ] **Step 2: Validate in deployment order**

Use this sequence before production deployment:

```text
1. Compile the project in TIA Portal.
2. Verify the trip and final-flush scenario in PLCSIM Advanced with WinCC.
3. Repeat the complete FAT scenario on the production PLC and physical SD card.
```