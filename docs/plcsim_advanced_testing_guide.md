# PLCSim Advanced + WinCC Runtime - Návod na testování

## Účel
Tento návod popisuje, jak otestovat CSV logování na SD kartu v PLCSim Advanced s WinCC Runtime, bez nutnosti fyzického HW.

## Předpoklady
- TIA Portal s PLCSim Advanced
- WinCC Runtime Advanced/Professional
- Projekt `vfd-spindel-plc-plcsim-wincc` otevřený v TIA Portal

## Automatická simulace signálů

Program `program_simulation.scl` obsahuje kompletní simulaci všech potřebných signálů.

### Konfigurace simulace - DB_Config.SimMode

| Parametr | Typ | Výchozí | Popis |
|----------|-----|---------|-------|
| `Enable` | Bool | TRUE | Zapnout/vypnout celou simulaci |
| `AutoStartSpindle` | Bool | TRUE | Automaticky spustit vřeteno při startu testu |
| `SpindleSpeed_RPM` | Real | 12000.0 | Simulované otáčky (konstantní) |
| `TempLozisko_C` | Real | 45.0 | Simulovaná teplota ložiska [°C] |
| `TempKartace_C` | Real | 50.0 | Simulovaná teplota kartáčů [°C] |
| `TimeAcceleration` | Real | 1.0 | Zrychlení času (1.0 = real-time, 10.0 = 10× rychleji) |

### Co se simuluje automaticky?

Když je `DB_Config.SimMode.Enable = TRUE`:

1. **Safety signály** - vše OK, žádný trip
   - `SafetyRelayAuxOk = TRUE`
   - `EmergencyStop = FALSE` (E-Stop není stisknut)
   - `ExternalFault = FALSE`

2. **Teploty** - konstantní bezpečné hodnoty
   - Ložisko: 45°C (pod limitem 65°C)
   - Kartáče: 50°C (pod limitem 65°C)

3. **Otáčky vřetena**
   - Když je vřeteno spuštěné: 12000 RPM
   - Když je zastavené: 0 RPM

4. **Auto-start vřetena**
   - Když spustíš test (StartTest), vřeteno se automaticky rozběhne

## Postup testování v PLCSim Advanced

### Příprava

1. **Načti projekt do PLCSim Advanced:**
   ```
   - Otevři TIA Portal
   - Projekt: vfd-spindel-plc-plcsim-wincc
   - PLC → Start Simulation
   - Počkej, až PLCSim Advanced naběhne
   ```

2. **Připoj SD kartu v PLCSim Advanced:**
   ```
   - V PLCSim Advanced: Memory Cards → Card 1
   - Insert memory card
   - Vyber existující nebo vytvoř novou (min. 16 MB)
   ```

3. **Zkontroluj konfiguraci simulace:**
   ```
   - V online view otevři "DB_Config"
   - Zkontroluj sekci SimMode:
     ✅ Enable = TRUE
     ✅ AutoStartSpindle = TRUE
     ✅ SpindleSpeed_RPM = 12000.0
     ✅ TempLozisko_C = 45.0
     ✅ TempKartace_C = 50.0
     ⚡ TimeAcceleration = 1.0 (pro rychlejší test změň na 10.0)
   ```

### Test 1: Základní zápis na SD kartu (30 sekund)

1. **Nastav parametry logu:**
   ```
   DB_LogConfig.Enable = TRUE
   DB_LogConfig.TestDuration_s = 60
   DB_LogConfig.FlushEveryN = 5   (první flush za 30s)
   ```

2. **Spusť test z WinCC nebo Watch Table:**
   ```
   DB_LogConfig.StartTest = TRUE (puls)
   ```

3. **Co se stane automaticky:**
   - ✅ Vygeneruje se název souboru (např. `20260801-143025.csv`)
   - ✅ Test se označí jako aktivní (`DB_LogRuntime.TestActive = TRUE`)
   - ✅ Vřeteno se automaticky spustí na 12000 RPM
   - ✅ Začne běžet časovač (`Elapsed_s` roste)
   - ✅ Vzorky se ukládají do bufferu každých 6 sekund

4. **Sleduj diagnostiku:**
   ```
   DB_LogRuntime.TestActive = TRUE
   DB_LogRuntime.Elapsed_s → roste (0.0, 6.0, 12.0, 18.0, 24.0, 30.0...)
   DB_LogRuntime.SampleCounter → roste (0, 1, 2, 3, 4, 5...)
   DB_LogBuffer.TrendWriteIdx → roste (0, 1, 2, 3, 4, 5...)
   ```

5. **Po 30 sekundách - první flush:**
   ```
   LogManager.FlushPending = TRUE
   LogFlushToSd.Busy = TRUE
   LogFlushToSd.CurrentStep → postupně: 1 (PREPARE) → 11 (CREATE_DIR) → 2 (OPEN) → 3 (WR_HEADER) → 4 (WR_ROW) → 7 (ACK)
   ```

6. **Kontrola výsledku:**
   ```
   DB_LogRuntime.LastFlushOk = TRUE
   DB_LogRuntime.FlushErrorCount = 0
   DB_LogRuntime.HeaderWritten = TRUE
   LogFlushToSd.RowsFlushed = 5
   ```

7. **Zastav test:**
   ```
   DB_LogConfig.StopTest = TRUE (puls)
   ```

8. **Zkontroluj soubor na SD kartě:**
   ```
   - V PLCSim Advanced: Memory Cards → Card 1 → Show in Windows Explorer
   - Otevři složku: UserFiles\
   - Najdi soubor: 20260801-143025.csv (tvůj timestamp)
   - Otevři v Excelu nebo textovém editoru
   ```

### Test 2: Rychlý test s akcelerací času

Pro rychlejší testování bez čekání:

1. **Změň akceleraci času:**
   ```
   DB_Config.SimMode.TimeAcceleration = 10.0   (10× rychleji)
   ```

2. **Spusť test:**
   ```
   DB_LogConfig.StartTest = TRUE
   ```

3. **Co se změní:**
   - Elapsed_s roste 10× rychleji
   - První flush za 3 sekundy místo 30 sekund
   - Test délky 60s doběhne za 6 sekund

**POZOR:** TimeAcceleration ovlivňuje pouze logování, ne skutečné chování vřetena!

### Test 3: Manuální ovládání vřetena

Pokud chceš testovat manuální ovládání bez auto-startu:

1. **Vypni auto-start:**
   ```
   DB_Config.SimMode.AutoStartSpindle = FALSE
   ```

2. **Spusť test:**
   ```
   DB_LogConfig.StartTest = TRUE
   ```

3. **Vřeteno spusť ručně z WinCC:**
   ```
   DB_HMI.Spindle.Start = TRUE (puls)
   DB_HMI.Spindle.Speed_RPM = 15000.0
   ```

4. **Zastavení:**
   ```
   DB_HMI.Spindle.Stop = TRUE (puls)
   ```

## Kontrola HMI v WinCC Runtime

Po spuštění WinCC Runtime uvidíš:

### Status panel
- **Barva:** ZELENÁ když běží test, ŠEDÁ když je ready, ČERVENÁ při tripu
- **Text:** "TEST RUNNING" / "TEST READY" / "ERROR - TRIP ACTIVE"

### Logging panel
- **Test Active:** TRUE/FALSE
- **Elapsed Time:** čas od startu ve formátu HH:MM:SS
- **Sample Counter:** počet vzorků
- **Last Flush OK:** TRUE/FALSE
- **Flush Error Count:** 0 (pokud vše OK)

### Spindle panel
- **Run Latched:** TRUE když vřeteno běží
- **Speed:** aktuální rychlost (RPM)
- **State:** STOPPED / RUN_CMD / STOPPING / TRIP

## Struktura CSV souboru

Soubor obsahuje:

**Hlavička:**
```
t_s,RPM,T_Lozisko,T_Uhliky,Vibrace,ProudUhliky,State,RunLatched,TripActive,TripCode,SafetyText
```

**Příklad dat:**
```
0.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
6.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
12.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
18.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
24.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
30.00,12000.0,45.0,0.0,0.0,5.0,1,1,0,0,READY
```

## Řešení problémů

### Soubor se nevytvořil

**Kontrola:**
```
DB_LogConfig.Enable = TRUE?
DB_LogRuntime.TestActive = TRUE?
DB_LogRuntime.LastFlushOk = TRUE?
DB_LogRuntime.FlushErrorCount = 0?
```

**Řešení:**
- Zkontroluj, že je SD karta připojená v PLCSim Advanced
- Zkontroluj `LogFlushToSd.ErrorCode` pro diagnostiku
- Pokud chyba 0x7001: složka se měla vytvořit automaticky, zkontroluj `LogFlushToSd.CurrentStep`

### Vřeteno se nerozběhlo

**Kontrola:**
```
DB_Config.SimMode.Enable = TRUE?
DB_Config.SimMode.AutoStartSpindle = TRUE?
DB_Status.Safety.TripActive = FALSE?
```

**Řešení:**
- Zkontroluj safety status v `DB_Status.Safety.StatusText`
- Pokud trip, zkontroluj `DB_Config.InputSim` hodnoty

### Teploty v alarmu

**Kontrola:**
```
DB_HMI.Sensors.AI1_Teplota_Lozisko_C < 65.0?
DB_Alarms.TempAlarm = FALSE?
```

**Řešení:**
```
DB_Config.SimMode.TempLozisko_C := 45.0
DB_Config.SimMode.TempKartace_C := 50.0
```

## Příprava pro ladění HMI

Pro budoucí práce na HMI doporučuji:

1. **Nastavit krátký test:**
   ```
   DB_LogConfig.TestDuration_s := 60  (1 minuta)
   DB_LogConfig.FlushEveryN := 3      (flush každých 18s)
   DB_Config.SimMode.TimeAcceleration := 1.0  (real-time pro vizualizaci)
   ```

2. **Povolit manuální ovládání:**
   ```
   DB_Config.SimMode.AutoStartSpindle := FALSE
   ```

3. **Testovat různé scénáře:**
   - Normální běh
   - E-Stop (nastav `DB_Config.InputSim.EmergencyStop := TRUE`)
   - Teplotní alarm (nastav `DB_Config.SimMode.TempLozisko_C := 70.0`)
   - Reset po chybě

## Reference

- [logging_diagnostic_guide.md](logging_diagnostic_guide.md) - Podrobná diagnostika logování
- [webtestapp_logging_test_script.md](webtestapp_logging_test_script.md) - Test scénáře
- [simulation_mode_guide.md](simulation_mode_guide.md) - Původní simulační režim
