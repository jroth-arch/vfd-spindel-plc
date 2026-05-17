# Technicke pozadavky – testovaci aplikace pro opotrebeni uhlikovych kartacu

Datum: 2026-05-17
Typ dokumentu: technicka specifikace (implementacni)
Nadrazeny dokument: [user_specification.md](user_specification.md)

## 1) PLC architektura

TR-PLC-01 Ridici smycky
- OB30 (100 ms, TimeSensitive): casove citlive operace – LabPSU, vzorkovani dat (LogManager).
- OB1 (Main): necasovekriticky zpracovani – flush bufferu na SD, mapovani IO, logika HMI.

TR-PLC-02 Oddeleni vzorkovani a zapisu
- LogManager vzorkuje kazdych SampleEveryN_Cycles cyklu OB30 (default 2 = 200 ms).
- Zapis na SD probiha pouze v OB1, nikdy v OB30, aby neblokoval casove citlivou logiku.

TR-PLC-03 Kruhovy buffer
- Vzorky se ukladaji do DB_LogBuffer.TrendBuffer (pole 1000 prvku, typ UDT_LogRecord).
- WriteIdx a ReadIdx sleduje naplnenost kruhoveho bufferu.

TR-PLC-04 Flush podminka
- Flush se spusti, kdyz flushCounter dosahne FlushEveryN (konfigurovatelne, default 100).
- Flush se spusti vzdy pri ukonceni testu (timeout, stop, chyba) – finalni flush.

TR-PLC-05 HMI mapovani
- DB_LogConfig.StartTest je nastaven pri stisku Start/Auto na HMI.
- DB_LogConfig.StopTest je nastaven pri stisku Stop na HMI nebo pri detekci chyby.
- Po skonceni testu (TestActive = false) je Start/Auto opet zpristupneno.

## 2) Souborovy system na SD karte

TR-SD-01 Pojmenovani souboru
- Format: YYYYMMDD-HHMMSS.csv, napr. 20260517-143022.csv.
- Pri kolizi (shoda do sekundy) doplnit suffix _01, _02 atd.

TR-SD-02 Obsah CSV souboru
Soubor vzdy zacina hlavickou:
```
t_s,RPM,T_Lozisko,T_Uhliky,Vibrace,ProudUhliky,State,RunLatched,TripActive,TripCode,SafetyText
```
Nasleduji radky trend dat. Separatorem je carka, desetinnou tecka.

TR-SD-03 Otevreni a zavreni
- Soubor se otevre pri prvnim flush (nebo pri startu testu).
- Soubor se vzdy uzavre po finalnim flushu (close pred dalsim otevrim).
- Aplikace neopousti soubor trvale otevreny mezi flushy (open-write-close per flush).

TR-SD-04 Retence a kapacita
- Maximalni pocet log souboru nebo maximalni obsazeni SD karty je otevreny bod.
- Doporuceni: implementovat upozorneni pri prekroceni 80 % kapacity.

## 3) Logovaci FB a DB

TR-FB-01 FB_LogManager
- Parametry viz implementace v program.scl.
- Vystup FlushPending = TRUE signalizuje OB1, ze je cas zapsat na SD.
- Po dokonceni flushu musi OB1 potvrdit flush (reset FlushPending / handshake).

TR-FB-02 FB_LogFlushToSd (novy, faze 2)
- Vstup: FlushRequest (z FlushPending), FilePrefix, Enable.
- Implementovano jako stavovy automat: IDLE -> OPEN -> WRITE -> CLOSE -> DONE/ERROR.
- Maximalni pocet radku per flush je konfigurovatelny (default 100).
- Pri chybe: retry s limitem, po vyprseni retry: nastavit LastFlushOk=false, LastError.
- Vystup AckFlush: potvrzeni pro FB_LogManager pro reset FlushPending.

TR-FB-03 Instance DB
- LogManager: instance FB_LogManager.
- LogFlushToSd (nove): instance FB_LogFlushToSd.

TR-DB-01 DB_LogConfig (konfiguracia, NON_RETAIN)
| Pole            | Typ          | Default   | Popis                                   |
|-----------------|--------------|-----------|-----------------------------------------|
| Enable          | Bool         | false     | Povoleni logovani                       |
| StartTest       | Bool         | false     | HMI trigger startu (hrana)              |
| StopTest        | Bool         | false     | HMI trigger stopu (hrana)               |
| SampleEveryN    | Int          | 2         | Pocet cyklu OB30 mezi vzorky            |
| TestDuration_s  | DInt         | 86400     | Max. delka testu v sekundach            |
| FlushEveryN     | Int          | 100       | Pocet vzorku mezi flushy                |
| FilePrefix      | String[16]   | 'testlog' | Prefix nazvu souboru (pro budouci pouziti) |

TR-DB-02 DB_LogRuntime (stavove hodnoty za behu, NON_RETAIN)
| Pole                   | Typ         | Popis                                      |
|------------------------|-------------|--------------------------------------------|
| TestActive             | Bool        | Test prave bezi                            |
| TestStartTs            | Date_And_Time | Cas startu testu                         |
| Elapsed_s              | Real        | Cas od startu testu v sekundach            |
| SampleCounter          | DInt        | Pocet zapsanych vzorku                     |
| LastFlushOk            | Bool        | Posledni flush probehl bez chyby           |
| LastError              | String[40]  | Diagnosticky text posledni chyby           |

TR-DB-03 DB_LogBuffer (kruhovy buffer dat, NON_RETAIN)
| Pole           | Typ                          | Popis                  |
|----------------|------------------------------|------------------------|
| TrendBuffer    | Array[0..999] of UDT_LogRecord | Kruhovy trend buffer |
| TrendWriteIdx  | Int                          | Index pro zapis        |
| TrendReadIdx   | Int                          | Index pro cteni/flush  |
| EventBuffer    | Array[0..99] of UDT_EventRecord | Event log buffer    |
| EventWriteIdx  | Int                          | Index pro zapis eventu |
| EventReadIdx   | Int                          | Index pro cteni eventu |

TR-UDT-01 UDT_LogRecord (jeden trend vzorek)
| Pole        | Typ        | Popis                                      |
|-------------|------------|--------------------------------------------|
| t_s         | Real       | Cas od startu testu [s]                    |
| RPM         | Real       | Skutecne otacky vretene                    |
| T_Lozisko   | Real       | Teplota loziska [°C]                       |
| T_Uhliky    | Real       | Teplota uhliku [°C]                        |
| Vibrace     | Real       | Vibrace [engineering units]                |
| ProudUhliky | Real       | Proud do uhliku [A]                        |
| State       | USInt      | Stav vretene (0=STOPPED,1=RUN,2=STOP,3=TRIP) |
| RunLatched  | Bool       | Vreteno latchovane v chodu                 |
| TripActive  | Bool       | Safety trip aktivni                        |
| TripCode    | USInt      | Kod tripu (viz tabulka)                    |
| SafetyText  | String[40] | Textova diagnostika safety                 |

TR-UDT-02 UDT_EventRecord (jedna udalost)
| Pole       | Typ        | Popis                                       |
|------------|------------|---------------------------------------------|
| t_s        | Real       | Cas udalosti [s]                            |
| EventCode  | USInt      | Kod udalosti (100=START, 200=STOP, 300=TRIP, 900=TIMEOUT) |
| EventText  | String[32] | Popis udalosti                              |
| State      | USInt      | Stav vretene v okamziku udalosti            |
| TripCode   | USInt      | Kod tripu v okamziku udalosti               |
| SafetyText | String[40] | Safety text v okamziku udalosti             |

## 4) WebAPI pro stazeni logu

TR-API-01 Autentizace
- Pouzivat stavajici Api.Login / Api.Logout mechanismus PLC Web Serveru.

TR-API-02 Vypis dostupnych souboru
- Endpoint: cist seznam souboru z SD karty (napr. pres Files.Browse nebo ekvivalent).
- Vystup: seznam nazvu souboru s metadaty (velikost, datum).

TR-API-03 Stazeni souboru
- Uzivatel vybere soubor ze seznamu a stahne ho pres HTTP/WebAPI.
- Format: primo CSV soubor ke stazeni.

TR-API-04 Datovy kontrakt (otevreny bod)
- Presny API endpoint a parametry jsou k finalizaci pri implementaci WebAPI casti.

## 5) Chybove stavy a diagnostika

TR-ERR-01 Chyba SD zapisu
- Ukladat do DB_LogRuntime.LastFlushOk a LastError.
- Zobrazit chybu na HMI.

TR-ERR-02 Ztrata dat
- Data se nesmi tiche ztratit – pokud flush selze, TrendReadIdx se neposouvame.
- Po obnove pokusu o flush se pokusi zapsat znovu (retry s limitem).

TR-ERR-03 Maximalni retry
- Po vyerpani retry limitu nastavit permanentni chybovy flag pro servis.

## 6) Testovaci pozadavky

Testy pro fazi 1 (start/stop/buffer/timeout) jsou pripraveny ve webtestapp (LOG-01 az LOG-05).

Pro fazi 2 (SD flush) je potreba pridat:
- LOG-06: trigger flushe v OB1 po dosazeni FlushEveryN.
- LOG-07: TrendReadIdx se po uspesnem flushu posune o spravny pocet.
- LOG-08: finalni flush pri ukonceni testu (stop nebo timeout).
- LOG-09: chybova cesta – flush selze, LastFlushOk=false, data nejsou ztracena.
- LOG-10: validace obsahu CSV (hlavicka + spravne hodnoty v prvnim radku).

## 7) Otevrene implementacni body
- Finalni format nazvu souboru (casova zona, kolize, suffix).
- Presny datovy kontrakt WebAPI (viz TR-API-04).
- Politika retence na SD karte (limit velikosti/pocet souboru/rotace).
- Handshake FlushPending reset mezi FB_LogManager a FB_LogFlushToSd.
- Napojeni realnch senzoru na T_Uhliky a Vibrace (zatim 0.0 / TODO).
