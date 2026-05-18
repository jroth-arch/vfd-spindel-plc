# HMI zapisovane promenne (edge vs latch)

Tento prehled rika, do jakych tagu ma HMI zapisovat pro spusteni a zastaveni testu.

## 1) Tabulka zapisu z HMI

| Oblast | Tag | Typ promenne | Jak zapisovat z HMI | Poznamka |
|---|---|---|---|---|
| Logovani | "DB_LogConfig".Enable | Latch (uroven) | TRUE pri aktivnim testu, FALSE kdyz nechces logovat | Globalni povoleni FB_LogManager |
| Logovani | "DB_LogConfig".StartTest | Hranova (pulse) | Kratky pulse TRUE, pak vratit na FALSE | Spousti start testu na hrane |
| Logovani | "DB_LogConfig".StopTest | Hranova (pulse) | Kratky pulse TRUE, pak vratit na FALSE | Spousti stop testu na hrane + final flush request |
| Logovani | "DB_LogConfig".TestDuration_s | Parametr (uroven) | Nastavit pred startem testu | Doba automatickeho ukonceni testu |
| Logovani | "DB_LogConfig".FlushEveryN | Parametr (uroven) | Nastavit pred startem testu | Po kolika vzorcich se triggeruje flush |
| Vreteno | "DB_HMI".Spindle.Start | Hranova (pulse) | Kratky pulse TRUE, pak FALSE | Start command pro FB_DriveCtrl |
| Vreteno | "DB_HMI".Spindle.Stop | Hranova (pulse) | Kratky pulse TRUE, pak FALSE | Stop command pro FB_DriveCtrl |
| Vreteno | "DB_HMI".Spindle.Speed_RPM | Setpoint (uroven) | Nastavit na cil, napr. 16000 | Setpoint otacek |
| Lab zdroj | "DB_HMI".LabPSU.Enable | Latch (uroven) | TRUE behem testu, FALSE po stopu | Povoleni FB_LabPSU |
| Lab zdroj | "DB_HMI".LabPSU.Mode | Setpoint (uroven) | 1=CONST nebo 2=SINE_DEBUG | Rezim proudu do uhliku |
| Lab zdroj | "DB_HMI".LabPSU.ConstCurrent_A | Setpoint (uroven) | Pro CONST rezim | Pouziva se pri Mode=1 |
| Lab zdroj | "DB_HMI".LabPSU.DebugAmplitude_A | Setpoint (uroven) | Pro SINE_DEBUG rezim | Pouziva se pri Mode=2 |
| Lab zdroj | "DB_HMI".LabPSU.DebugFrequency_Hz | Setpoint (uroven) | Pro SINE_DEBUG rezim | Pouziva se pri Mode=2 |

## 2) Doporuce na pulse (hranove promenne)

- Pro hranove promenne (`StartTest`, `StopTest`, `Spindle.Start`, `Spindle.Stop`) posli pulse TRUE a hned vrat na FALSE.
- Prakticky: 1 PLC cyklus az cca 100-300 ms je bezne dostacujici.
- Nenechavej hranove tagy trvale na TRUE.

## 3) Doporucena sekvence tlacitka AUTO (start celeho testu)

1. Nastav parametry testu:
- "DB_HMI".Spindle.Speed_RPM (napr. 16000)
- "DB_LogConfig".TestDuration_s
- "DB_LogConfig".FlushEveryN
- LabPSU parametry dle zvoleneho rezimu

2. Aktivuj latch tagy:
- "DB_LogConfig".Enable := TRUE
- "DB_HMI".LabPSU.Enable := TRUE

3. Posli hranove start povely:
- "DB_HMI".Spindle.Start pulse
- "DB_LogConfig".StartTest pulse

## 4) Doporucena sekvence tlacitka STOP

1. Posli hranove stop povely:
- "DB_HMI".Spindle.Stop pulse
- "DB_LogConfig".StopTest pulse

2. Vypni latch tagy:
- "DB_HMI".LabPSU.Enable := FALSE
- (volitelne) "DB_LogConfig".Enable := FALSE

## 5) Uzitecne read-only tagy pro stav na HMI

| Tag | Vyznam |
|---|---|
| "DB_LogRuntime".TestActive | TRUE = test bezi |
| "DB_LogRuntime".Elapsed_s | Cas od startu testu |
| "DB_LogRuntime".FileName | Nazev generovaneho log souboru |
| "DB_Status".Spindel.State | Stav vretene |
| "DB_Status".LabPSU.State | Stav lab zdroje |
| "DB_Status".Safety.TripActive | Bezpecnostni trip |
