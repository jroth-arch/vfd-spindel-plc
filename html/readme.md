Web Application na PLC (Siemens S7-1500)

Tento návod popisuje: - jak ověřit podporu Web Applications - jak
vytvořit web application - jak nahrát HTML stránku (index.html) - jak
použít Web API - jak nasadit web application na nové PLC

------------------------------------------------------------------------

1.  Požadavky

-   CPU s firmware >= V2.9
-   Zapnutý Web server
-   Funkční Web API (/api/jsonrpc)
-   Nastavený uživatel s právy (manage_user_pages)
-   HTTPS přístup na PLC

------------------------------------------------------------------------

2.  Princip

PLC: - hostuje HTML/CSS/JS soubory - poskytuje Web API

Browser: - stáhne stránku z PLC - JavaScript běží na klientovi -
komunikuje přes /api/jsonrpc

------------------------------------------------------------------------

3.  Vytvoření Web Application

Použij Web API metodu:

WebApp.Create

POST /api/jsonrpc

[ { “jsonrpc”: “2.0”, “method”: “WebApp.Create”, “params”: { “name”:
“myapp”, “state”: “disabled” }, “id”: 1 }]

------------------------------------------------------------------------

4.  Nahrání index.html (SPRÁVNÝ POSTUP)

Používá se ticket mechanismus:

1)  WebApp.CreateResource → ticket_id

2)  POST /api/ticket?id=

3)  Api.CloseTicket

------------------------------------------------------------------------

5.  Nastavení default stránky

WebApp.SetDefaultPage

------------------------------------------------------------------------

6.  Aktivace aplikace

WebApp.SetState (enabled)

------------------------------------------------------------------------

7.  Otevření v browseru

https://IP_PLC/~myapp

------------------------------------------------------------------------

8.  JavaScript API

fetch(“/api/jsonrpc”)

------------------------------------------------------------------------

9.  Nasazení na nové PLC

Kroky:

1.  Nahrát PLC projekt (TIA Portal)
2.  Zapnout Web server + Web API
3.  Vytvořit uživatele (manage_user_pages)
4.  Spustit deploy script

python cli_deploy_tool.py –host … –user … –password … –app myapp –file
index.html –insecure

------------------------------------------------------------------------

Shrnutí:

-   Web application běží na PLC
-   JavaScript běží v browseru
-   deploy = TIA + script
