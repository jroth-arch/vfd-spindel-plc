# Import SCL programu do TIA Portal

## ⚠️ DŮLEŽITÉ - Nastavení cycle time OB30

Po importu SCL souborů (`program.scl` nebo `program_simulation.scl`) do TIA Portal **MUSÍTE ručně nastavit cycle time organizačního bloku OB30!**

### Postup:

1. **Import SCL souboru:**
   - V TIA Portal: Project tree → PLC → **Program blocks**
   - Pravý klik → **External source** → **Add new external file**
   - Vyber soubor: `plc/program.scl` (produkce) nebo `plc/program_simulation.scl` (simulace)
   - Klikni **Generate blocks from source** (ikona blesku ⚡)

2. **⚠️ KRITICKÉ: Nastavení OB30 cycle time:**
   - V Project tree najdi **Program blocks → Organization blocks → OB30**
   - Pravý klik na **OB30** → **Properties**
   - Záložka **Cyclic interrupt**
   - Nastav **Cycle time: 1000 ms** (1 sekunda)
   - Klikni **OK**

   ![Příklad nastavení OB30](../images/ob30_cycle_time_setup.png) *(screenshot TODO)*

3. **Ověření:**
   - Dvojklik na **OB30** → v horní liště by mělo být: `"Cyclic Interrupt - 1000ms"`
   - V komentářích kódu zkontroluj, že `Cycle_s := 1.0` odpovídá cycle time OB30

---

## Proč je to nutné?

**SCL kód NEOBSAHUJE nastavení cycle time organizačního bloku!**

- V SCL můžeš definovat TITLE (např. `"Cyclic Interrupt - 1000ms"`), ale to je pouze **informativní text**
- Skutečný cycle time se nastavuje v **properties OB** v TIA Portal
- Pokud OB30 běží jinak než s 1000 ms, logika bude **nesprávná**:
  - `Cycle_s := 1.0` v kódu předpokládá OB30 = 1000 ms
  - Vzorkování (LogManager) počítá s 1s cyklem
  - LabPSU regulace proudu má rampy v A/s → závisí na správném cycle time

---

## Kontrolní checklist

Po importu zkontroluj:

| ✅ | Položka | Kde zkontrolovat |
|----|---------|------------------|
| ☐ | OB1 (Main) existuje | Program blocks → OB1 |
| ☐ | OB30 existuje | Program blocks → OB30 |
| ☐ | **OB30 cycle time = 1000 ms** | OB30 → Properties → Cyclic interrupt |
| ☐ | Datablocks vytvořeny (DB_HMI, DB_Status, ...) | Program blocks → Data blocks |
| ☐ | Function blocks vytvořeny (FB_LabPSU, FB_LogManager, ...) | Program blocks → Function blocks |
| ☐ | Program se zkompiluje bez chyb | Compile → All (Ctrl+Shift+B) |

---

## Reference

- Cycle time nastavení je dokumentováno v:
  - [architecture.md](architecture.md) - popis `Cycle_s` parametru
  - [technical_requirements.md](technical_requirements.md) - OB30 (1000 ms, TimeSensitive)
  - [logging_architecture.md](logging_architecture.md) - FB_LogManager vzorkování
