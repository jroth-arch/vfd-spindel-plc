# Finalni flush pri bezpecnostni poruse

**Cil:** Pri kazde bezpecnostni poruse bezpecne ukoncit aktivni test, zachovat posledni namerene hodnoty v CSV a zobrazit srozumitelny duvod v `DB_LogRuntime.LastError`.

## Chovani

Pokud se `DB_Status.Safety.TripActive` behem aktivniho testu zmeni z `FALSE` na `TRUE`, musi `FB_LogManager` provest stejnou ukoncovaci sekvenci logovani jako pri rucnim STOP:

1. Ulozit jeden finalni trendovy zaznam s aktualnimi hodnotami.
2. Nastavit `TestActive := FALSE`.
3. Nastavit `StopSequenceActive := TRUE`.
4. Nastavit `FlushPending := TRUE` a spustit finalni flush.
5. Ulozit `StopReason := 3` pro poruchu.

Stavajici bezpecnostni logika zustava odpovedna za okamzite zablokovani pohybu a vystupu LabPSU. Zmena logovani nesmi zpozdit ani oslabit bezpecnostni odstaveni.

## Mapovani LastError

`LastError` se nastavi jednou pri detekovane hrane poruchy a zustane zachovany po dobu finalniho flushe. Vybrany text odpovida nasledujici priorite:

| Podminka | Text LastError |
|---|---|
| Prekrocena teplota loziska i kartacu | `PREKROCENA TEPLOTA LOZISKA A KARTACU` |
| Prekrocena teplota loziska | `PREKROCENA TEPLOTA LOZISKA` |
| Prekrocena teplota kartacu | `PREKROCENA TEPLOTA KARTACU` |
| Nouzove tlacitko | `Nouzové tlačítko stisknuto` |
| Bezpecnostni rele neni pripraveno | `ZKONTROLUJ BEZPECNOSTNI RELE` |
| Porucha externiho zarizeni | `PORUCHA EXTERNIHO ZARIZENI` |
| Kriticke vibrace | `KRITICKE VIBRACE` |

Teplotni pripady maji prednost pred obecnym bezpecnostnim textem, aby bylo zrejme, ktery senzor poruchu zpusobil. Pro neteplotni poruchy mapovani odpovida stavajici bezpecnostni priorite: nouzove tlacitko, bezpecnostni rele, externi porucha a vibrace. Stav `SYSTEM NENI POVOLEN` se do obsluzneho mapovani nezarazuje, protoze vstup `Safety_1.Enable` je v aktualnim OB1 natvrdo `TRUE` a stav neni v beznem provozu dosazitelny.

## Rozsah

- Upravit `plc/program.scl`:
  - Predat `TripActive` do `FB_LogManager`.
  - Detekovat hranu `TripActive` uvnitr funkcniho bloku.
  - Pri hrane poruchy pridat finalni trendovy zaznam a spusteni finalniho flushe.
  - Naplnit `LastError` podle schvaleneho mapovani.
- Aktualizovat testovaci postupy pouze pro produkcni PLC a pruvodce/mockup S5 LOGOVANI, aby zobrazovaly vysledek ulozeni a citelny duvod poruchy.

## Mimo rozsah

- Bez zmeny zpracovani fyzickych bezpecnostnich vstupu a priority odstavened pohybu.
- Bez testovani v PLCSIM Advanced nebo WinCC; ani jedno neni povolene jako testovaci prostredi.
- Bez prace na exportu pres WebAPI nebo generovani reportu.

## Akceptacni kriteria

1. Porucha teploty loziska ukonci aktivni test, ulozi `StopReason = 3`, zobrazi `PREKROCENA TEPLOTA LOZISKA` a dokonci finalni flush na SD kartu.
2. Porucha teploty kartacu vytvori odpovidajici text; soucasne prekroceni obou teplot vytvori kombinovany text.
3. Kazdy podporovany safety trip ukonci aktivni test jednim finalnim zaznamem a finalnim flushem bez nutnosti HMI pulzu STOP.
4. `LastStopLogSaved` je po uspesnem finalnim flush `TRUE` a po neuspesnem `FALSE`.
5. Dukaz o testu je zaznamenan pouze z produkcniho PLC.