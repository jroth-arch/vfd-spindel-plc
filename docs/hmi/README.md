# HMI dokumentace

Implementacni podklady pro Siemens KTP700 Basic PN ve stylu Industrial Classic.

## Obrazovky

| Obrazovka | Slozka | Obsah |
|---|---|---|
| S1 HOME | [home](home) | Layout, TIA checklist a HTML mock |
| S2 LAB PSU | [labpsu](labpsu) | Nastaveni a diagnostika sinusoveho proudu |
| S3 VRETENO | [spindle](spindle) | Otacky, start/stop, reset a stav menice |
| S4 SAFETY | [safety](safety) | Safety, trip kody a teplotni alarmy |
| S5 LOGOVANI | [logging](logging) | Timer, CSV soubor, flush a OB30 diagnostika |
| S7 SERVIS | [service](service) | Simulace, konfigurace, servisni pristup a verze |

## Spolecne podklady

- [hmi_tag_table.md](hmi_tag_table.md) - centralni seznam zapisovanych a ctenych tagu
- [troubleshooting](troubleshooting) - postupy Watch tables a testy AUTO/STOP

## Pravidlo implementace

Postupuj po jedne obrazovce. Pro kazdou obrazovku nejprve vytvor objekty, potom nastav tagy, nasledne Appearance/Visibility a nakonec proved FAT kroky uvedene v prislusnem checklistu.
