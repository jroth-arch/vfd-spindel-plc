# HOME Peak Temperature Display Design

**Goal:** Show the maximum bearing and brush temperatures observed during a test on the HOME screen, while moving editable temperature limits to a protected configuration panel on S7 SERVICE.

## Scope

- HOME S1 shows the current and maximum observed temperature for the bearing and brushes.
- The maximum values are output-only fields bound to existing PLC values:
  - `"DB_LogRuntime".MaxTempLozisko_C`
  - `"DB_LogRuntime".MaxTempUhliky_C`
- The existing temperature-limit fields are removed from HOME S1.
- S7 SERVICE receives a distinct protected `Konfigurace teplot` panel with input fields for:
  - `"DB_Config".TempHighLoziskoThreshold_C`
  - `"DB_Config".TempHighKartaceThreshold_C`
- Both configuration fields accept values from 0.0 to 100.0 C.

## Data Flow

`FB_LogManager` resets both maximum-temperature tags when a test starts. During an active test, it retains the greater sampled temperature for each sensor. The retained values remain available after the test stops and are reset at the next test start.

HOME S1 reads the current sensor tags and the two retained maximum tags. It does not write temperature thresholds. S7 SERVICE is the only HMI location in this scope that writes the threshold tags, and it remains available only to a service user.

## Out of Scope

- No change to PLC maximum-temperature collection logic.
- No new HMI screen or navigation entry.
- No change to temperature trip behavior, LastError handling, LabPSU stop behavior, or other SERVICE configuration fields.
- No PLCSIM Advanced or WinCC validation.

## Files and Documentation

- Update the S1 HOME mock to replace the two editable threshold inputs with output-only maximum values and simulated peak tracking.
- Update the S1 TIA implementation guide with the two maximum-temperature tag bindings.
- Update the S7 SERVICE mock and TIA guide to define the protected temperature-configuration panel and bounds.
- Update the HMI tag table and user specification to reflect the new locations and two independent temperature thresholds.
- Add a production-PLC FAT procedure that verifies peak retention/reset and protected limit editing.

## Acceptance Criteria

1. During a test, S1 shows current bearing and brush temperatures and non-decreasing maxima for each.
2. A new test resets both maxima to 0.0 before subsequent measurements update them.
3. Stopping a test does not clear either maximum.
4. S1 contains no writable temperature-limit field.
5. S7 SERVICE contains two service-protected temperature-limit inputs, each limited to 0.0 through 100.0 C.
6. The change is checked on the production PLC only; PLCSIM Advanced and WinCC are not used as test environments.