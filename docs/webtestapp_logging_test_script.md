# Webtestapp script: overeni CSV logovani na SD karte

Datum: 2026-05-18
Cil: overit, ze PLC vytvori CSV soubor v UserFiles a zapisuje trend data.

## 1) Pred testem (jednorazova priprava)

- PLC je v RUN.
- SD karta je vlozena a neni write-protected.
- Webtestapp je nasazena a otevrena na PLC.
- Prihlaseni do webtestapp je uspesne.
- **POZNAMKA**: Slozka `UserFiles` se vytvori automaticky pri prvnim flushu, neni treba ji vytvorit rucne.

Doporucene zakladni hodnoty (zapis pred testem):
- "DB_LogConfig".Enable = true
- "DB_LogConfig".TestDuration_s = 15
- "DB_LogConfig".FlushEveryN = 5
- "DB_HMI".Spindle.Speed_RPM = 12000
- "DB_HMI".LabPSU.Enable = true
- "DB_HMI".LabPSU.Mode = 1
- "DB_HMI".LabPSU.ConstCurrent_A = 5.0

## 2) Odklikavaci sekvence ve webtestapp

Spust poradi testu:
1. LOG-01 (Start a stop testu)
2. LOG-02 (Plneni trend bufferu)
3. LOG-04 (Elapsed_s roste)
4. LOG-06 (Flush trigger po FlushEveryN)
5. LOG-08 (Final flush pri stopu)

Poznamka:
- LOG-07/LOG-09/LOG-10 jsou HW-dependent. Pro fyzicky zapis na SD je klicovy LOG-07.

## 3) Rucni mini-script (kdyz chces bez scenaru)

Krok A: start testu
- Zapis:
  - "DB_LogConfig".Enable = true
  - "DB_LogConfig".StartTest = true
- Pockej 150 ms
- Zapis:
  - "DB_LogConfig".StartTest = false

Krok B: nechat bezet logovani
- Pockej 3000 ms
- Cteni (musí rust):
  - "DB_LogRuntime".TestActive == true
  - "DB_LogRuntime".Elapsed_s > 2.0
  - "DB_LogRuntime".SampleCounter > 0
  - "DB_LogBuffer".TrendWriteIdx > 0

Krok C: stop testu + final flush
- Zapis:
  - "DB_LogConfig".StopTest = true
- Pockej 150 ms
- Zapis:
  - "DB_LogConfig".StopTest = false
- Pockej 1000-2000 ms

Krok D: kontrola flush vysledku
- Cteni:
  - "DB_LogRuntime".TestActive == false
  - "DB_LogRuntime".LastFlushOk == true
  - "DB_LogRuntime".FlushErrorCount == 0
  - "DB_LogRuntime".FileName != ''

## 4) Kde najdes soubor

Cesta zapisu je:
- UserFiles/<DB_LogRuntime.FileName>

**POZNAMKA**: Slozka `UserFiles` se vytvori automaticky pri prvnim flushu.

Postup:
1. Zapis si hodnotu "DB_LogRuntime".FileName.
2. Vyjmi SD kartu z PLC.
3. Otevri kartu v PC.
4. Otevri slozku UserFiles.
5. Najdi soubor podle FileName.

## 5) PASS kriterium

Test ber jako PASS, pokud plati vse:
- TestActive prejde true -> false podle start/stop.
- Elapsed_s a SampleCounter rostou behem behu testu.
- LastFlushOk je true po stopu/timeoutu.
- FlushErrorCount je 0.
- Na SD karte je soubor UserFiles/<FileName> a obsahuje CSV data.

## 6) Kdyz to selze

- Pokud LastFlushOk = false nebo FlushErrorCount > 0:
  - zkontroluj SD write-protect,
  - over, ze karta ma misto,
  - over, ze karta je kompatibilni a spravne vlozena.
- Pokud soubor nevznikne:
  - zkontroluj, ze "DB_LogConfig".Enable = true,
  - over, ze probehl StartTest pulse,
  - over, ze po stopu byl cas na final flush (alespon 1-2 s).
