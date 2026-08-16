# HOME Peak Temperature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display retained peak temperatures on S1 HOME and relocate editable temperature thresholds to a protected S7 SERVICE panel.

**Architecture:** `FB_LogManager` already resets and tracks `DB_LogRuntime` peak-temperature values, so PLC logic remains unchanged. S1 reads current and peak values only. S7 SERVICE owns the two writable `DB_Config` threshold fields.

**Tech Stack:** S7 PLC tags, TIA Portal HMI implementation guides, standalone HTML mockups, production-PLC FAT.

---

### Task 1: Update S1 HOME Documentation and Mockup

**Files:**
- Modify: `docs/hmi/home/screen1_tia_implementation.md`
- Modify: `docs/hmi/home/screen1_mock.html`

- [ ] **Step 1: Establish the expected HOME bindings**

S1 must expose the following output-only fields:

```text
Bearing current: DB_HMI.Sensors.AI1_Teplota_Lozisko_C
Bearing maximum: DB_LogRuntime.MaxTempLozisko_C
Brush current: DB_HMI.Sensors.AI2_Teplota_Kartace_C
Brush maximum: DB_LogRuntime.MaxTempUhliky_C
```

- [ ] **Step 2: Replace the two HOME threshold fields**

Replace `DB_Config.TempHighLoziskoThreshold_C` and `DB_Config.TempHighKartaceThreshold_C` in S1 with the two `DB_LogRuntime` maximum tags. Mark each field Output/read-only and remove all threshold-input validation from the mockup.

- [ ] **Step 3: Implement mock peak tracking**

Reset the simulated peak values on AUTO, update them only when the corresponding current simulated temperature rises, and retain them after STOP or TRIP. Keep mock temperature-trip limits as internal constants because editable limits belong to S7.

- [ ] **Step 4: Validate the S1 artifacts**

Confirm both former input IDs are absent, both peak IDs are output-only spans, and the TIA guide contains the two peak tag bindings.

### Task 2: Define S7 Temperature Configuration

**Files:**
- Modify: `docs/hmi/service/screen7_service_tia_implementation.md`
- Modify: `docs/hmi/service/screen7_service_mock.html`

- [ ] **Step 1: Specify the protected panel**

Define `Konfigurace teplot` as a service-login-protected panel with one 0.0-100.0 C input for each existing `DB_Config` threshold tag.

- [ ] **Step 2: Update the S7 mockup**

Render the two threshold inputs in their named panel with `min="0"`, `max="100"`, and `step="0.1"`; leave all other configuration values unchanged.

- [ ] **Step 3: Validate the S7 artifacts**

Confirm the S7 guide identifies both tags, the permitted range, and service authorization; confirm the mock contains the same two editable inputs.

### Task 3: Align Tag and Acceptance Documentation

**Files:**
- Modify: `docs/hmi/hmi_tag_table.md`
- Modify: `docs/user_specification.md`
- Modify: `docs/hmi/home/screen1_tia_implementation.md`

- [ ] **Step 1: Update ownership and requirements**

Document S1 as the read-only location for the two `DB_LogRuntime` peak values and S7 SERVICE as the editable location for the two `DB_Config` temperature thresholds.

- [ ] **Step 2: Replace the S1 monitoring FAT procedure**

Use this production-PLC procedure:

```text
1. Record both S1 maximum values before AUTO.
2. Start a test using AUTO on the production PLC.
3. Confirm both maxima reset to 0.0 and then follow or exceed their current temperatures.
4. Stop the test and confirm both maxima remain visible.
5. Start a new test and confirm both maxima reset again.
6. As a service user, change each S7 limit within 0.0-100.0 C and confirm the associated DB_Config tag updates.
7. Confirm S1 contains no editable temperature limit.
```

- [ ] **Step 3: Validate the documentation**

Search the HOME documentation and mockup for the two threshold tags. They must not remain as S1 input bindings. Verify that the FAT explicitly prohibits PLCSIM Advanced and WinCC for this change.