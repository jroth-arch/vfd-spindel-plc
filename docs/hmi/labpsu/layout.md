# S2 - LAB PSU layout

Industrial Classic obrazovka pro nastaveni a diagnostiku zdroje.

## Bloky

- Hlavicka: `LAB PSU`, stavovy text a navigace.
- Ovládání: ciselny Enable `0/1`, ciselny Mode `0/1/2` a odpovidajici text rezimu, sinusovy proud maximum a perioda.
- Monitoring: stavovy text zdroje, aktualni proud a Current limit.
- Diagnostika: `StatusText`, `CurrentLimitExceeded`, signalizace zdroje.
- Navigace: S1 HOME, S2 aktivni, S3-S7.

## Tagy

- Vstupy: `DB_HMI.LabPSU.Enable` jako `0/1`, `Mode` jako `0/1/2`, `DebugAmplitude_A`, `DebugPeriod_min`.
- Stav: `DB_Status.LabPSU.State`, `StatusText`, `CurrentSet_A`.
- Alarm: `DB_HMI.LabPSU.CurrentLimitExceeded`.

## Vzhled

- Pozadi svetle seda, pole velmi svetle seda, ramecky stredne seda.
- SINE aktivni modre nebo zelene, OFF seda, limit cervene.
- Input pole pouze pro servisni nebo autorizovane nastaveni.
