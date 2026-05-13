# Safety Logic Truth Table – DI0 & DI1 stavy

## Definice signálů

- **DI0_SafetyRelay_Aux** (čtení: `"DB_IO".DI.SafetyRelayAuxOk`)
  - `true` = Safety relay je **sepnuté** (bezpečný stav)
  - `false` = Safety relay je **rozpojené** (poruchový/netestovaný stav)

- **DI1_SafetyRelay_State** (fyzické čtení přes negaci: `NOT "DI1_SafetyRelay_State"`)
  - `true` (fyzicky `DI1 = false`) = Safety button je **sepnutý/zatisknutý** → rozpoj rele, emergency stop
  - `false` (fyzicky `DI1 = true`) = Safety button je v **bezpečné poloze** (uvolněný)

## Pravdivostní tabulka – mapování stavů

| DI1 (Button) | DI0 (AuxOK) | Fyzický stav | Logika | Červená LED (DQ2) | Modrá LED (DQ1) | Interpretace |
|---|---|---|---|---|---|---|
| **1** | **1** | Button uvolněný, Rele OK | SafetyOk = 1 | ❌ OFF | ❌ OFF | ✅ **READY** – systém může běžet |
| **1** | **0** | Button uvolněný, Rele rozpojeno | SafetyOk = 0 | ❌ OFF | ✅ ON | 🟡 **WAITING FOR RESET** – button reset nebo diagnostika |
| **0** | **0** | Button stisknutý, Rele rozpojeno | SafetyOk = 0, TripActive = 1 | ✅ ON | ❌ OFF | 🔴 **E-STOP ACTIVE** – potvrzeno dvojitou podmínkou |
| **0** | **1** | Button stisknutý, Rele OK | SafetyOk = 0, TripActive = 1 | ✅ ON | ❌ OFF | 🔴 **E-STOP ACTIVE** – rele rozpojeno, systém trip |

### Výstupní signály pro LED

- **DQ1** → rozsvěcí **Modrou LED** (Reset button indikátor)
  - Aktivní v `WAITING FOR RESET` stavu (DI0=0, DI1=1)
  - Signalizuje obsluze: „Stiskni reset button"

- **DQ2** → rozsvěcí **Červenou LED** (Emergency Stop button indikátor)
  - Aktivní v `E-STOP ACTIVE` stavech (DI1=0)
  - Signalizuje obsluze: „Safety button je stisknutý / Trip aktivní"

## Funkční logika v PLC (`FB_SafetyGate`)

```
SafetyOk := SafetyRelayAuxOk AND NOT EmergencyStop
TripActive := (NOT SafetyOk) OR ExternalFault OR TempAlarm OR VibAlarm OR (NOT Enable)
PermitMotion := NOT TripActive
```

### Stavy a akce

1. **READY (DI0=1, DI1=1)**
   - `SafetyOk = true`
   - `PermitMotion = true`
   - Systém je povolen ke spuštění (pokud jsou ostatní podmínky splněny)

2. **E-STOP ACTIVE (DI0=1, DI1=0) nebo (DI0=0, DI1=0)**
   - `SafetyOk = false`
   - `TripActive = true`
   - `PermitMotion = false`
   - Výstupy se bezpečně vypnou
   - Po uvolnění buttonu → čekání na reset

3. **WAITING FOR RESET (DI0=0, DI1=1)**
   - `SafetyOk = false`
   - Systém je v bezpečném stavu (rele rozpojeno)
   - Musí se provést diagnostika nebo se resetuje rele
   - Zpravidla se resetuje přes reset button a automaticky aktivuje rele znovu

4. **UNKNOWN/FAULT (DI0=0, DI1=0)**
   - Rele je rozpojeno a button je stisknutý
   - Nejbezpečnější stav – nic se neděje
   - Čeká se na reset od obsluhy

## Aplikace v SAT testech (bez HW)

Pro PLC-only SAT bez fyzických tlačítek a rele lze simulovat všechny stavy přes:

```
"DB_Config".InputSim.EnableSafetyRelayAuxOverride = true
"DB_Config".InputSim.SafetyRelayAuxOk = <0 nebo 1>

"DB_Config".InputSim.EnableEmergencyStopOverride = true
"DB_Config".InputSim.EmergencyStop = <0 nebo 1>
```

Pak se v `FC_IO_Map_Read` čte z simulace místo fyzických vstupů a lze testovat všechny 4 kombinace DI0/DI1.

---

## Poznámky pro testování

- **DI1 je negovaný vstup**: `"DB_IO".DI.EmergencyStop := NOT "DI1_SafetyRelay_State"`
  - Fyzicky: `DI1_SafetyRelay_State = true` → `EmergencyStop = false` (button OK, rele sepnuto)
  - Fyzicky: `DI1_SafetyRelay_State = false` → `EmergencyStop = true` (button stisknutý, trip)

- Po e-stopě systém **NEautomaticky** restartuje – musí obsluha udat nový příkaz Start
- Trip priority: E-Stop > Safety Relay > External Fault > Temp/Vib Alarm > Disabled
