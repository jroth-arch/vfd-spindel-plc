# Ujeta vzdalenost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculate travelled ring distance in PLC, display it on S1 HOME, configure ring diameter on S7, and include it in CSV.

**Architecture:** `FB_LogManager` owns the test lifecycle and OB30 sampling, so it will accumulate distance from actual RPM and a configured ring diameter. `UDT_LogRecord` snapshots the accumulated value for CSV; S1 and S7 bind directly to the runtime and configuration DB fields.

**Tech Stack:** Siemens SCL, TIA HMI specifications and standalone HTML mockups, TIA Portal, PLCSIM Advanced, WinCC, production PLC.

---

### Task 1: PLC distance data and calculation

**Files:**
- Modify: `plc/program.scl`

- [ ] Add `PrumerKrouzku_mm` to `DB_Config` with default `0.0` and `UjetaVzdalenost_km` to `DB_LogRuntime` with default `0.0`.
- [ ] Extend `UDT_LogRecord` and `FC_LogRecordToCsv` with `UjetaVzdalenost_km`.
- [ ] Pass `PrumerKrouzku_mm` into `FB_LogManager`, reset distance at test start, accumulate it on every active OB30 cycle when the diameter is greater than zero, and copy it into periodic and final records.
- [ ] Add the diameter to the existing `LogManager` call in OB30 and extend the CSV header.

### Task 2: HMI mockups and implementation guides

**Files:**
- Modify: `docs/hmi/home/screen1_mock.html`
- Modify: `docs/hmi/home/screen1_tia_implementation.md`
- Modify: `docs/hmi/home/hmi_layout.md`
- Modify: `docs/hmi/service/screen7_service_mock.html`
- Modify: `docs/hmi/service/screen7_service_tia_implementation.md`
- Modify: `docs/hmi/service/layout.md`

- [ ] Add read-only `Ujeta vzdalenost` below current RPM on S1 and simulate reset/growth/retention.
- [ ] Add `Prumer krouzku [mm]` as an S7 service input with range `1.0..500.0`.
- [ ] Document exact tags, formats, reset behavior, and read/write access.

### Task 3: CSV and FAT documentation

**Files:**
- Modify: `docs/logging_architecture.md`
- Modify: `docs/technical_requirements.md`
- Modify: `docs/test_specification.md`

- [ ] Add the travelled-distance field to CSV schemas and runtime descriptions.
- [ ] Add FAT procedure for reset, accumulation, stop/trip retention, CSV value, and reference calculation.
- [ ] State the validation order: TIA compile, PLCSIM Advanced plus WinCC, then production PLC with physical SD card.