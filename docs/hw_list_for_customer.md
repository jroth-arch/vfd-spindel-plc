# HW seznam pro zakaznika (draft)

Datum: 2026-05-18
Stav: draft, doplnit vendor PN/SN a pocty

## 1) Ridici a vykonna cast

| Kategorie | Komponenta | Popis | Pocet | Stav |
|---|---|---|---|---|
| PLC | Siemens S7-1500 CPU | Hlavni ridici jednotka | 1 | DOPLNIT PN |
| Storage | SD karta pro PLC | Ukladani CSV logu | 1 | DOPLNIT kapacitu |
| HMI | HMI panel | Ovladani testu (Auto/Stop, parametry, stavy) | 1 | DOPLNIT typ |
| Vreteno | VFD spindle + menic | Pohon testovaneho vretene | 1 | DOPLNIT model |
| Zdroj | Laboratorni zdroj (BK1900B) | Generovani proudu do uhliku | 1 | OVERIT presny model |

## 2) Bezpecnost a signaly

| Kategorie | Komponenta | Popis | Pocet | Stav |
|---|---|---|---|---|
| Safety | Safety rele + tlacitko E-STOP | Bezpecnostni retezec DI0/DI1 | 1 sada | DOPLNIT vyrobce/model |
| DI/DO | Digitalni I/O vazby | MI Run/Stop, fault reset, indikace LED | dle projektu | OVERENO v PLC logice |
| AI/AQ | Analogove I/O vazby | AQ pro rizeni menice a LabPSU, AI pro teplotu | dle projektu | OVERIT terminaly |

## 3) Senzory

| Signal | Zdroj | Stav implementace |
|---|---|---|
| Otacky vretene | TM_Counter / HSC | IMPLEMENTOVANO |
| Teplota loziska | AI1_RTD | IMPLEMENTOVANO |
| Teplota kartacu | AI2_RTD | IMPLEMENTOVANO |
| Teplota uhliku (pro logging) | dedikovany senzor | TODO (zatim 0.0) |
| Vibrace | vibracni senzor | TODO (zatim 0.0) |

## 4) Komunikace a IT

| Kategorie | Pozadavek | Stav |
|---|---|---|
| Ethernet | PLC dostupne z commissioning PC | OVERIT IP plan |
| HTTPS | Web server na PLC aktivni | IMPLEMENTOVANO |
| Certifikaty | TLS certifikat pro PLC web API | DLE html/certifikaty/readme.md |

## 5) Kabelaz a napajeni (checklist)

- 24 VDC napajeni PLC a I/O.
- Propojeni PLC DO -> VFD MI vstupy.
- Spolecna reference GND/DCM mezi PLC a menicem.
- Analog AVI/ACM zapojeni pro rizeni otacek.
- Analogove propojeni pro LabPSU remote control (AQ kanaly).
- Zapojeni RTD/AI vstupu pro teplotu.
- Zapojeni safety retezu (E-STOP + safety relay aux).

## 6) Co doplnit pred predanim

- Presne part numbers (PN) vsech komponent.
- Serova cisla (SN) predavane sady.
- Revize firmware CPU/HMI.
- Seznam nahradnich dilu a doporucenych spotrebnich polozek.
- Fotodokumentace zapojeni svorkovnic.
