# S3 - VRETENO layout

Detailni obrazovka rizeni spindle drive.

## Bloky

- Hlavicka: `VRETENO`, hlavni stav a stav poruchy.
- Ovládání: pozadovane otacky, SPUSTIT, ZASTAVIT, RESET PORUCHY.
- Monitoring: aktualni otacky, stav vretene, vreteno v chodu, porucha aktivni a kod poruchy.
- Diagnostika vystupu: RunForwardCmd, SpeedVoltage, FaultResetCmd.
- Navigace S1-S7.

## Barvy

- ZASTAVENO seda, POVEL K BEHU modra, ZASTAVOVANI oranzova, PORUCHA cervena.
- RESET pouze pulse; diagnosticke hodnoty pouze Output.
