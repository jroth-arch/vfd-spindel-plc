V tomhle vlakne najdu navod na vytvoreni certifikatu pro plc
https://chatgpt.com/g/g-p-6900bbf6748c81918af97feb0439ae8a/c/699afe5e-bbac-838b-a82d-37d4e5354165

TLS certifikaty pro PLC (Siemens S7-1500)

Tento navod popisuje:
- vytvoreni vlastni Certificate Authority (CA)
- instalaci CA do Windows
- generovani certifikatu pro PLC
- pripravu certifikatu pro nahrani do PLC

--------------------------------------------------

1. Vytvoreni vlastni CA

1.1 Vygenerovani privatniho klice CA

openssl genrsa -out myCA.key 2048

1.2 Vytvoreni CA certifikatu

openssl req -x509 -new -nodes -key myCA.key -sha256 -days 3650 -out myCA.pem

Vysledek:
- myCA.key (soukromy klic – chranit!)
- myCA.pem (verejny certifikat CA)

--------------------------------------------------

2. Instalace CA do Windows

2.1 Volitelne prejmenovani

myCA.pem -> myCA.crt

2.2 Instalace

1. Dvojklik na soubor
2. Klikni "Install Certificate"
3. Vyber:
   Local Machine
4. Vyber:
   Trusted Root Certification Authorities
5. Dokonci instalaci

Vysledek:
Windows duveruje teto CA

--------------------------------------------------

3. Vytvoreni certifikatu pro PLC

3.1 Vytvor konfiguracni soubor

Soubor: plc_192.168.3.30.cnf

Obsah:

[req]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[dn]
CN = 192.168.3.30

[req_ext]
subjectAltName = @alt_names

[alt_names]
IP.1 = 192.168.3.30

DULEZITE:
IP musi odpovidat adrese PLC

--------------------------------------------------

3.2 Vygeneruj klic pro PLC

openssl genrsa -out plc.key 2048

--------------------------------------------------

3.3 Vytvor CSR (zadost o certifikat)

openssl req -new -key plc.key -out plc.csr -config plc_192.168.3.30.cnf

--------------------------------------------------

3.4 Podepis certifikat pomoci CA

openssl x509 -req -in plc.csr -CA myCA.pem -CAkey myCA.key -CAcreateserial -out plc.crt -days 825 -sha256 -extensions req_ext -extfile plc_192.168.3.30.cnf

Vysledek:
- plc.key
- plc.crt

--------------------------------------------------

4. Export do P12 (pro PLC)

openssl pkcs12 -export -out plc.p12 -inkey plc.key -in plc.crt -certfile myCA.pem

Zadas heslo (bude potreba v TIA)

--------------------------------------------------

5. Nahrani do PLC (TIA Portal)

1. CPU -> Properties
2. Web server / Security / Certificates
3. Import:
   plc.p12

--------------------------------------------------

6. Overeni

Otevri v browseru:

https://192.168.3.30

Ocekavany vysledek:
- zadne varovani
- zadne cervene HTTPS

--------------------------------------------------

7. Vice PLC

Pro kazde PLC:
- zmen IP v .cnf
- vytvor novy certifikat
- pouzij stejnou CA

--------------------------------------------------

Bezpecnost

- myCA.key nikdy nesdilej
- uloz ho bezpecne

--------------------------------------------------

Shrnuti

CA = duvera
PLC certifikat = identita zarizeni
Browser veri CA -> veri PLC

--------------------------------------------------

Vysledek

- zadne HTTPS varovani
- funkcni Web API
- pripravene pro vice PLC

--------------------------------------------------
Aktualni CA certifikat pro web a hmi je 
 - vfd-spindel-plcWebserver-12_X509_Certificate_ID_12.der
 - heslo pro certifikat je nazev projektu. V dobe, kdy jsem certifikat vytvarel byl nazev projektu vfd-spindel-plc-certificate_dodelat_webserver_spojeni 