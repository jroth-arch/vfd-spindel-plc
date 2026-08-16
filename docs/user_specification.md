# Business specifikace – testovaci aplikace pro opotrebeni uhlikovych kartacu

Datum: 2026-05-17
Typ dokumentu: business/uzivatelska specifikace (ne implementacni)
Navazujici dokument: [technical_requirements.md](technical_requirements.md)

## 1) Popis testovaneho procesu
Uzivatel bude testovat opotrebeni uhlikovych kartacu. Opotrebeni se bude merit tak,
ze se uhliky budou tlacit na krouzky, ktere jsou umistene na rotoru vretene.
Do uhliku se bude generovat sinusovy proud z laboratorniho zdroje.
Vreteno a laboratorni zdroj jsou rizeny pres PLC.
Pro uzivatele je rozhranim HMI panel.

## 2) Co bude vysledkem teto prace
Vysledkem bude PLC + HMI + WebAPI aplikace pro automatizovane testovani vretene, ktera:
- umozni uzivateli spustit test z HMI (Start nebo Auto),
- provede ridici sekvenci testu (vreteno + laboratorni zdroj),
- bude prubezne logovat merena data do CSV na SD kartu PLC,
- po ukonceni testu bezpecne uzavre log soubor,
- umozni stazeni vysledku pres webove rozhrani/WebAPI nebo cteni primo ze SD karty,
- podpori opakovane testy, kde kazdy test vytvori novy soubor s vysledky.

## 3) Ucel aplikace
Ucelem aplikace je zajistit opakovatelne, dohledatelne a analyzovatelne testovani
opotrebeni uhlikovych kartacu za realnychprovoznich podminek,
vcetne dlouhodobych endurance scenaru.

## 4) Uzivatelske pozadavky

FR-01 Spusteni testu
- Uzivatel muze spustit test z HMI tlacitkem Start nebo Auto.

FR-02 Beh testovaci sekvence
- Po spusteni testu aplikace aktivuje celou testovaci sekvenci.
- Vreteno se ridi na cilove otacky az 16000 rpm.
- Laboratorni zdroj ridi proud do uhliku podle nastavene logiky.

FR-03 Logovani merenych dat
- Behem testu se loguji merena data minimalne: teplota, vibrace,
  skutecny proud uhliku, skutecne otacky vretene.
- Log se uklada ve formatu CSV.

FR-04 Sprava log souboru
- Pri kazdem startu testu se vytvori novy soubor.
- Soubor je pojmenovan podle data a casu startu testu.
- Pri ukonceni testu se soubor korektne uzavre.

FR-05 Podminky ukonceni testu
- Test je ukoncen pri splneni jedne z podminek:
  - vyprseni casu testu,
  - rucni stop,
  - neocekavana udalost/chyba.

FR-06 Opakovani testu
- Po ukonceni testu se Start/Auto na HMI znovu zpristupni.
- Dalsi test vytvori novy soubor bez prepisu predchozich vysledku.

FR-07 Pristup k vysledkum
- Uzivatel muze po testu stahnout log soubor pres WebAPI/webserver.
- Alternativne je mozne logy cist primo ze SD karty PLC.

## 5) Technicke pozadavky na urovni business

TR-01 Ridici platforma
- Vreteno a laboratorni zdroj jsou rizeny pres Siemens S7-1200/1500 PLC.
- HMI panel slouzi jako jedine uzivatelske rozhrani pro obsluhu.

TR-02 Logovani a uloziste
- Merena data se ukladaji na SD kartu PLC.
- Format vystupu je CSV, stazitelny pres WebAPI nebo ze SD karty.

TR-03 Integrita mereni
- Merena data nesmi byt pri beznem ukonceni testu ani pri chybe ztracena bez diagnostiky.

TR-04 Rozsiritelnost
- Architektura musi umoznit pridani dalsich merene veliciny a ruznych scenaru testu
  bez zasadniho prepracovani systemu.

Podrobne technicke pozadavky (PLC architektura, WebAPI kontrakt, CSV schema, flush strategie)
jsou v navazujicim dokumentu [technical_requirements.md](technical_requirements.md).

## 6) Pozadavky na uzivatelske chovani a UX

UX-01 Jednoduche ovladani
- Uzivatel nepotrebuje TIA; test spousti a ukoncuje pres HMI.

UX-02 Jasny stav testu
- HMI zretelne indikuje stavy: pripraveno, test bezi, test ukoncen, chyba.

UX-03 Predvidatelny vystup
- Kazdy test ma vlastni vysledny soubor, ktery lze jednoduse identifikovat podle casu.

## 7) Provozni a servisni pozadavky

OP-01 Dlouhodoby provoz
- Reseni musi byt pouzitelne pro opakovane a dlouhodobe testy.

OP-02 Dostupnost dat
- Logy musi byt dostupne pro predani, archivaci a analyzu po skonceni testu.

OP-03 Rozsiritelnost
- Architektura ma umoznit pridani dalsich logovanych velicin a udalosti bez zasadni prestavby.

## 8) Akceptacni kriterium vysledne aplikace
- Test lze spustit z HMI (Start/Auto).
- Behem testu se na SD vytvari a plni CSV soubor s merenymi hodnotami.
- Po timeoutu/stop/chybe je soubor korektne uzavren.
- Po ukonceni je mozne test znovu spustit a vznikne novy soubor.
- Vysledky lze stahnout pres WebAPI nebo cist primo ze SD karty.

## 9) Otevrene body k finalnimu rozhodnuti
- Jak presne se bude merit opotrebeni (vizialni, vahove, odpor kontaktu...).
- Cilova delka jednoho testu (endurance vs. kратky cyklicky test).
- Kdo je prijemce vysledku (interni inzenyr, zakaznik, certifikacni organ).
- Ocekavany format reportu – raw CSV, nebo zpracovany report/graf.

---
