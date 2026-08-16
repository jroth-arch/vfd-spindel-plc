# Aktualni backlog projektu

Datum aktualizace: 2026-08-16

Toto je jediny ridici seznam neuzavrenych ukolu projektu. Historicke nebo neoverene backlogy sem nepatri.

## Pravidla prace

- Kazdy ukol je `NOVY`, dokud jeho dokonceni vyslovne nepotvrdi uzivatel.
- Funkcni overeni probiha pouze na produkcnim PLC. Nepouzivej PLCSIM Advanced ani WinCC jako testovaci prostredi.
- Pred kazdym commitem zkontroluj tento backlog a vyzadej si od uzivatele potvrzeni, zda je ukol zahrnuty v commitu splnen.
- Stav ukolu se meni az po zaznamenani overeni nebo rozhodnuti uzivatele.

## P1 - Zakaznik, diagnostika a data

### BL-01 - Zaslat nahledy HMI obrazovek S2-S7 zakaznikovi

- Stav: NOVY
- Cil: Pripravit a odeslat zakaznikovi nahledy obrazovek 2 az 7 k review.
- Vystup: Sada aktualnich nahledu a soupis pripominek zakaznika.
- Overeni: Zakaznik potvrdil prijeti nahledu nebo zaslal review.

### BL-02 - Zapis teplotniho tripu do Last error

- Stav: NOVY
- Cil: Pri prekroceni limitu teploty ulozit citelny duvod do `DB_LogRuntime.LastError`, aby byl viditelny na HMI.
- Rozsah: Rozlisit alespon limit loziska a limit kartacu; definovat dalsi chyby, ktere se budou logovat do `LastError`.
- Vystup: Schvalena tabulka chyb a implementovane zapisovani trvalych diagnostickych textu.
- Overeni: Na produkcnim PLC vyvolat kazdy podporovany trip a overit text na HMI i v zaznamu testu.

### BL-03 - Opravit pristup k PLC webserveru z iPhonu

- Stav: NOVY
- Cil: Zjistit pricinu nefunkcniho pripojeni z iPhonu a obnovit podporovany pristup.
- Rozsah: HTTPS certifikat a duvera certifikatu, URL/DNS nebo IP, sitova dostupnost, autentizace a kompatibilita Safari.
- Vystup: Popsana pricina, oprava a kratky postup pro uzivatele iPhonu.
- Overeni: Uspesne prihlaseni a otevreni webove aplikace z iPhonu v produkcni siti.

### BL-04 - Stahovani ulozenych CSV logu pres webserver

- Stav: NOVY
- Cil: Umoznit prihlasenemu uzivateli zobrazit seznam ulozenych logu na SD karte a stahnout zvoleny CSV soubor.
- Vystup: Webove rozhrani pro seznam a stazeni plus zdokumentovany WebAPI kontrakt.
- Overeni: Na produkcnim PLC vytvorit log, najit ho ve webove aplikaci a uspesne jej stahnout a otevrit.

### BL-05 - Opravit cas v nazvu a metadatech CSV souboru

- Stav: NOVY
- Cil: Odstranit posun casu priblizne o dve hodiny pri spravnem datu.
- Rozsah: Zjistit zdroj casu, casovou zonu, letni cas a prevod mezi PLC a Windows/metadaty souboru.
- Vystup: Jednoznacne pravidlo casove zony a opravene generovani nazvu souboru.
- Overeni: Na produkcnim PLC porovnat cas ve jmenu CSV, cas v zaznamech a zobrazene metadata souboru ve Windows.

### BL-06 - Upravit zakaznicky obsah CSV a pridat citelne duvody

- Stav: NOVY
- Cil: Zredukovat nebo oddelit troubleshooting hodnoty od zakaznickych dat a ukladat citelne texty misto samotnych ciselnych kodu tam, kde to zlepsi srozumitelnost.
- Rozsah: Definovat zakaznicke sloupce, technicke diagnosticke sloupce a textove duvody ukonceni testu/tripu.
- Vystup: Schvalene CSV schema, aktualizovane formatovani a dokumentace vyznamu sloupcu.
- Overeni: Otevrit vzorovy CSV soubor a bez znalosti kodu rozpoznat duvod ukonceni testu.

### BL-07 - Zalogovat vypadek proudu a zobrazit jej obsluze

- Stav: NOVY
- Cil: Detekovat vypadek napajeni nebo proudu, zachovat jeho informaci po restartu a zobrazit ji na HMI a pripadne ve webserveru.
- Rozsah: Definovat zdroj detekce, retencni priznak, format CSV udalosti a chovani zobrazeni na HMI.
- Vystup: Schvalena strategie a implementovane zaznamenani udalosti.
- Overeni: Kontrolovane vyvolat odpovidajici stav na produkcnim PLC a overit CSV, HMI a pripadne webove zobrazeni.

### BL-14 - Synchronizace casu pres NTP

- Stav: NOVY
- Cil: Nastavit PLC a HMI pro prijem NTP paketů a synchronizovat cas, aby nazvy CSV souboru a jejich metadata pouzivaly spravny lokalni cas.
- Rozsah: Konfigurace NTP serveru, sitove dostupnosti, casove zony a letniho casu pro PLC i HMI. Tlacitko `Synchronizovat cas` na S7 vyvola okamzity pozadavek na NTP synchronizaci.
- Vystup: Zdokumentovana konfigurace NTP, funkcni synchronizace casu ze S7, zobrazeni `Posledni synchronizace` a stav `V PORADKU` nebo `NTP SERVER NEDOSTUPNY`.
- Overeni: Porovnat cas PLC, HMI a vytvoreneho CSV souboru s referencnim NTP casem ve stejne siti.

## P2 - Vysledky testu a reportovani

### BL-08 - Vypocet celkove ujeté vzdalenosti

- Stav: IMPLEMENTOVANO - NEOVERENO
- Cil: Vypocitat vzdalenost, kterou uhliky ujely po sberacim krouzku, z doby a skutecnych otacek vretene.
- Rozsah: Potvrdit efektivni prumer nebo obvod sberaciho krouzku, jednotku kilometru, reset a zobrazeni hodnoty.
- Vystup: Vypocet v PLC, hodnota v CSV a zobrazeni na HMI.
- Overeni: Provest TIA Portal compile, test v PLCSIM Advanced s WinCC a finalni FAT na produkcnim PLC; porovnat vypocet s rucnim referencnim vypoctem z RPM, casu a schvaleneho obvodu.

### BL-09 - Generovat zakaznicky report ve webserveru

- Stav: NOVY
- Cil: Z vybraneho ulozeneho logu vygenerovat report urceny pro koncoveho zakaznika.
- Rozsah: Definovat format vystupu, vstupni CSV data, chybove stavy a zpusob stazeni.
- Vystup: Funkce webserveru, ktera vytvori a poskytne report z vybraneho testu.
- Overeni: Vybrat produkcni CSV, vygenerovat report a overit shodu souhrnnych hodnot s CSV.

### BL-10 - Pripravit sablonu zakaznickeho reportu

- Stav: NOVY
- Cil: Vytvorit schvalitelnou sablonu reportu pro jeden test.
- Rozsah: Identifikace testu, casovy rozsah, nastaveni, maximalni teploty, ujetá vzdalenost, duvod ukonceni, vysledek a prilohy nebo grafy podle potvrzenych dat.
- Vystup: Verzionovana sablona reportu pouzitelna pro BL-09.
- Overeni: Zakaznik nebo odpovedna osoba schvali obsah a podobu sablony.

## P3 - Nizka priorita: mereni proudu a vibraci

### BL-11 - Hallova sonda pro skutecny proud do kartacu

- Stav: NOVY
- Priorita: Velmi nizka
- Cil: Zprovoznit Hallovu sondu a merit skutecny proud do kartacu.
- Vystup: Zapojeny a skalibrovany signal, PLC tag, zobrazeni a pripadne logovani.
- Overeni: Porovnat hodnotu Hallovy sondy s referencnim meridlem v definovanych bodech.

### BL-12 - Senzor vibraci a mereni v aplikaci

- Stav: NOVY
- Priorita: Velmi nizka
- Cil: Pridat snimac vibraci a zapojit jeho hodnotu do aplikace.
- Vystup: Specifikace senzoru, PLC mapovani, zobrazeni, logovani a pripadne alarmove prahy.
- Overeni: Na produkcnim PLC overit reakci merene hodnoty na referencni vibracni podnet.

## P4 - Nejnizsi priorita: akusticka diagnostika

### BL-13 - Mereni a porovnavani hluku vretene

- Stav: NOVY
- Cil: Merit hluk vretene a upozornit na odchylku od historickeho mereni pri stejnych otackach, zejmena jako pomocnou diagnostiku lozisek.
- Rozsah: Vybrat metodu snimani, referencni podminky, metriky, ukladani baseline a prah vyznamne odchylky.
- Vystup: Navrh diagnostiky a rozhodnuti, zda je implementace technicky a provozne prinosna.
- Overeni: Opakovane srovnavaci mereni za definovanych podminek.