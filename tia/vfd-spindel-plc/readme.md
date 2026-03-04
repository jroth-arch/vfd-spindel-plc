# VFD Spindle PLC – Dokumentace projektu

## Verze TIA Portal
Projekt byl vytvořen ve verzi:
`TIAP_9618_21.00.00.00_01.00.0001`

Projekt se aktuálně nachází v adresáři:
`d:\DS\TPE.V21_FC16_RTM.RTM.ERL\10193_21.00.00.00_01.03.0001\`

---

## Struktura projektu

Projekt obsahuje dvě PLC:

### 1. `Test`
- Slouží pouze pro testovací účely.
- Do budoucna může být smazáno.

### 2. `vfd-spindel`
- Hlavní PLC pro řízení vřetene.
- Aktuálně implementované funkce:
  - **DB_IO** – datový blok pro zmrazení vstupních a výstupních dat po dobu jednoho cyklu OB1.
  - **Webserver** – umožňuje čtení a zápis dat z/do DB přes webové rozhraní.
    - HTML soubor pro webserver je umístěn v rootu repozitáře (`d:\spindle-vfd-control`).

---

## Stav testování

| Funkce     | Stav testování         |
|------------|------------------------|
| DB_IO      | Otestováno na PLCSimAdv |
| Webserver  | Otestováno na PLCSimAdv |

> ⚠️ Testování na reálném hardware zatím neproběhlo.
