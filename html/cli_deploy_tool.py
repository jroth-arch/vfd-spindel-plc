#!/usr/bin/env python3
"""
Mini CI / deploy tool pro Siemens S7-1500 WebApp API.

Funkce:
- login
- vytvoření appky, pokud neexistuje
- upload jednoho souboru nebo celé složky
- nastavení default page
- aktivace appky
- ověření výsledku přes Browse / BrowseResources

Příklady:

Single file:
    python .\cli_deploy_tool.py ^
      --host 192.168.3.30 ^
      --user json ^
      --password Qwertyuiop1 ^
      --app myapp ^
      --file .\index.html ^
      --insecure

      
Celá složka: 
Testovaci stranky: python .\cli_deploy_tool.py --host 192.168.3.30 --user json --password Qwertyuiop1 --app testapp --dir .\webtestapp --insecure
Produkcni stranky: python .\cli_deploy_tool.py --host 192.168.3.30 --user json --password Qwertyuiop1 --app myapp --dir .\webapp --insecure  
    python .\cli_deploy_tool.py ^
      --host 192.168.3.30 ^
      --user json ^
      --password Qwertyuiop1 ^
      --app myapp ^
      --dir .\webapp ^
      --insecure

Poznámka:
- PLC musí mít zapnutý Web server a uživatel musí mít právo manage_user_pages.
- Výchozí připojení je HTTPS.
- Pro self-signed certifikát lze použít --insecure.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import requests
import urllib3
from requests import Response, Session
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class PlcApiError(Exception):
    """Chyba vrácená Web API nebo HTTP vrstvou."""


@dataclass
class RpcResult:
    result: Any
    raw: Any


class SiemensWebApiClient:
    def __init__(
        self,
        host: str,
        *,
        user: str,
        password: str,
        verify_tls: bool = True,
        timeout: float = 15.0,
    ) -> None:
        self.host = host
        self.base_url = f"https://{host}"
        self.user = user
        self.password = password
        self.verify_tls = verify_tls
        self.timeout = timeout
        self.token: Optional[str] = None

        self.session = Session()
        retry = Retry(
            total=3,
            connect=3,
            read=3,
            backoff_factor=0.7,
            status_forcelist=(429, 500, 502, 503, 504),
            allowed_methods=frozenset({"GET", "POST"}),
        )
        adapter = HTTPAdapter(max_retries=retry)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    @property
    def jsonrpc_url(self) -> str:
        return f"{self.base_url}/api/jsonrpc"

    def _headers(self, *, content_type: str = "application/json") -> dict[str, str]:
        headers = {"Content-Type": content_type}
        if self.token:
            headers["X-Auth-Token"] = self.token
        return headers

    @staticmethod
    def _raise_for_bad_http(resp: Response, *, context: str) -> None:
        try:
            resp.raise_for_status()
        except requests.HTTPError as e:
            text = resp.text[:1000] if resp.text else ""
            raise PlcApiError(
                f"HTTP {resp.status_code} při {context}. Odpověď: {text}"
            ) from e

    def _rpc(
        self,
        method: str,
        params: Optional[dict[str, Any]] = None,
        *,
        require_token: bool = False,
    ) -> RpcResult:
        if require_token and not self.token:
            raise PlcApiError(f"RPC method {method} vyžaduje login/token.")

        req: dict[str, Any] = {
            "jsonrpc": "2.0",
            "method": method,
            "id": 1,
        }
        if params is not None:
            req["params"] = params

        payload = [req]

        try:
            resp = self.session.post(
                self.jsonrpc_url,
                headers=self._headers(),
                data=json.dumps(payload),
                timeout=self.timeout,
                verify=self.verify_tls,
            )
        except requests.RequestException as e:
            raise PlcApiError(f"HTTP chyba při volání {method}: {e}") from e

        self._raise_for_bad_http(resp, context=method)

        try:
            data = resp.json()
        except ValueError as e:
            raise PlcApiError(
                f"Neplatná JSON odpověď pro {method}: {resp.text[:500]}"
            ) from e

        if not isinstance(data, list) or not data:
            raise PlcApiError(f"Neočekávaná JSON-RPC odpověď pro {method}: {data!r}")

        item = data[0]

        if "error" in item:
            err = item["error"]
            code = err.get("code")
            message = err.get("message", "Unknown error")
            raise PlcApiError(f"RPC chyba {method}: code={code}, message={message}")

        if "result" not in item:
            raise PlcApiError(f"Chybí result v odpovědi pro {method}: {item!r}")

        return RpcResult(result=item["result"], raw=item)

    def login(self) -> None:
        result = self._rpc(
            "Api.Login",
            {
                "user": self.user,
                "password": self.password,
            },
        ).result

        token = result.get("token")
        if not token:
            raise PlcApiError("Login proběhl bez tokenu, to je neočekávané.")
        self.token = token

    def logout(self) -> None:
        if not self.token:
            return
        try:
            try:
                self._rpc("Api.Logout", require_token=True)
            except Exception as e:
                print(f"Varování: logout selhal: {e}", file=sys.stderr)
        finally:
            self.token = None

    def browse_app(self, app_name: str) -> Optional[dict[str, Any]]:
        result = self._rpc("WebApp.Browse", require_token=True).result
        apps = result.get("applications", [])
        for app in apps:
            if app.get("name") == app_name:
                return app
        return None

    def create_app_if_missing(self, app_name: str) -> bool:
        if self.browse_app(app_name):
            return False

        self._rpc(
            "WebApp.Create",
            {
                "name": app_name,
                "state": "disabled",
            },
            require_token=True,
        )
        return True

    def browse_resource(self, app_name: str, resource_name: str) -> Optional[dict[str, Any]]:
        try:
            result = self._rpc(
                "WebApp.BrowseResources",
                {
                    "app_name": app_name,
                    "name": resource_name,
                },
                require_token=True,
            ).result
        except PlcApiError as e:
            msg = str(e)
            if "code=506" in msg or "Resource does not exist" in msg:
                return None
            raise

        resources = result.get("resources", [])
        return resources[0] if resources else None

    def delete_resource_if_exists(self, app_name: str, resource_name: str) -> bool:
        existing = self.browse_resource(app_name, resource_name)
        if not existing:
            return False

        self._rpc(
            "WebApp.DeleteResource",
            {
                "app_name": app_name,
                "name": resource_name,
            },
            require_token=True,
        )
        return True

    def create_resource_ticket(
        self,
        *,
        app_name: str,
        resource_name: str,
        media_type: str,
        visibility: str = "public",
        etag: str = "",
        last_modified: Optional[str] = None,
    ) -> str:
        if last_modified is None:
            last_modified = (
                datetime.now(timezone.utc)
                .replace(microsecond=0)
                .isoformat()
                .replace("+00:00", "Z")
            )

        ticket_id = self._rpc(
            "WebApp.CreateResource",
            {
                "app_name": app_name,
                "name": resource_name,
                "media_type": media_type,
                "visibility": visibility,
                "etag": etag,
                "last_modified": last_modified,
            },
            require_token=True,
        ).result

        if not isinstance(ticket_id, str) or not ticket_id:
            raise PlcApiError("WebApp.CreateResource nevrátil validní ticket ID.")

        return ticket_id

    def upload_ticket_content(self, ticket_id: str, content: bytes) -> None:
        url = f"{self.base_url}/api/ticket?id={ticket_id}"

        try:
            resp = self.session.post(
                url,
                headers=self._headers(content_type="application/octet-stream"),
                data=content,
                timeout=max(self.timeout, 60.0),
                verify=self.verify_tls,
            )
        except requests.RequestException as e:
            raise PlcApiError(f"Upload přes ticket endpoint selhal: {e}") from e

        if resp.status_code not in (200, 204):
            text = resp.text[:1000] if resp.text else ""
            raise PlcApiError(
                f"Upload ticket endpoint vrátil HTTP {resp.status_code}. Odpověď: {text}"
            )

    def close_ticket(self, ticket_id: str) -> None:
        self._rpc(
            "Api.CloseTicket",
            {"id": ticket_id},
            require_token=True,
        )

    def set_default_page(self, app_name: str, resource_name: str) -> None:
        self._rpc(
            "WebApp.SetDefaultPage",
            {
                "name": app_name,
                "resource_name": resource_name,
            },
            require_token=True,
        )

    def set_state(self, app_name: str, state: str) -> None:
        self._rpc(
            "WebApp.SetState",
            {
                "name": app_name,
                "state": state,
            },
            require_token=True,
        )


def guess_media_type(path: Path) -> str:
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


def upload_one_resource(
    client: SiemensWebApiClient,
    *,
    app_name: str,
    local_file: Path,
    resource_name: str,
    media_type: Optional[str],
    delete_existing_resource: bool,
) -> None:
    if not local_file.is_file():
        raise PlcApiError(f"Soubor neexistuje: {local_file}")

    raw = local_file.read_bytes()
    actual_media_type = media_type or guess_media_type(local_file)

    if delete_existing_resource:
        deleted = client.delete_resource_if_exists(app_name, resource_name)
        print(f"      resource {resource_name}: {'smazána' if deleted else 'nebyla nalezena'}")

    ticket_id = client.create_resource_ticket(
        app_name=app_name,
        resource_name=resource_name,
        media_type=actual_media_type,
        visibility="public",
    )

    try:
        print(f"      upload {resource_name} ({len(raw)} B, media_type={actual_media_type})")
        client.upload_ticket_content(ticket_id, raw)
    finally:
        try:
            client.close_ticket(ticket_id)
        except Exception as e:
            print(f"      varování: nepodařilo se zavřít ticket pro {resource_name}: {e}", file=sys.stderr)


def deploy_single_file(
    client: SiemensWebApiClient,
    *,
    app_name: str,
    local_file: Path,
    resource_name: str,
    media_type: Optional[str],
    set_default: bool,
    enable_app: bool,
    delete_existing_resource: bool,
) -> None:
    print(f"[1/7] Login na PLC {client.host}")
    client.login()

    try:
        print(f"[2/7] Kontrola / vytvoření appky '{app_name}'")
        created = client.create_app_if_missing(app_name)
        print("      vytvořena" if created else "      už existuje")

        print(f"[3/7] Dočasné vypnutí appky '{app_name}' během deploye")
        client.set_state(app_name, "disabled")

        print(f"[4/7] Upload resource '{resource_name}'")
        upload_one_resource(
            client,
            app_name=app_name,
            local_file=local_file,
            resource_name=resource_name,
            media_type=media_type,
            delete_existing_resource=delete_existing_resource,
        )

        if set_default:
            print(f"[5/7] Nastavení default page na '{resource_name}'")
            client.set_default_page(app_name, resource_name)

        if enable_app:
            print(f"[6/7] Aktivace appky '{app_name}'")
            client.set_state(app_name, "enabled")

        app = client.browse_app(app_name)
        res = client.browse_resource(app_name, resource_name)

        print("\nDeploy hotov.")
        print(f"App state     : {app.get('state') if app else 'unknown'}")
        print(f"Default page  : {app.get('default_page') if app else 'unknown'}")
        print(f"Resource      : {res.get('name') if res else 'missing'}")
        print(f"Media type    : {res.get('media_type') if res else 'unknown'}")
        print(f"Size          : {res.get('size') if res else 'unknown'}")
        print(f"URL           : https://{client.host}/~{app_name}")

    finally:
        client.logout()


def deploy_directory(
    client: SiemensWebApiClient,
    *,
    app_name: str,
    local_dir: Path,
    set_default: bool,
    enable_app: bool,
    delete_existing_resource: bool,
    default_page: str,
) -> None:
    if not local_dir.is_dir():
        raise PlcApiError(f"Složka neexistuje: {local_dir}")

    files = sorted([p for p in local_dir.iterdir() if p.is_file()])
    if not files:
        raise PlcApiError(f"Ve složce nejsou žádné soubory: {local_dir}")

    print(f"[1/7] Login na PLC {client.host}")
    client.login()

    try:
        print(f"[2/7] Kontrola / vytvoření appky '{app_name}'")
        created = client.create_app_if_missing(app_name)
        print("      vytvořena" if created else "      už existuje")

        print(f"[3/7] Dočasné vypnutí appky '{app_name}' během deploye")
        client.set_state(app_name, "disabled")

        print(f"[4/7] Upload souborů ze složky '{local_dir}'")
        for file_path in files:
            upload_one_resource(
                client,
                app_name=app_name,
                local_file=file_path,
                resource_name=file_path.name,
                media_type=None,
                delete_existing_resource=delete_existing_resource,
            )

        if set_default:
            print(f"[5/7] Nastavení default page na '{default_page}'")
            client.set_default_page(app_name, default_page)

        if enable_app:
            print(f"[6/7] Aktivace appky '{app_name}'")
            client.set_state(app_name, "enabled")

        app = client.browse_app(app_name)

        print("\nDeploy hotov.")
        print(f"App state     : {app.get('state') if app else 'unknown'}")
        print(f"Default page  : {app.get('default_page') if app else 'unknown'}")
        print("Resources     :")
        for file_path in files:
            res = client.browse_resource(app_name, file_path.name)
            print(
                f"  - {file_path.name}: "
                f"{res.get('size') if res else 'missing'} B, "
                f"{res.get('media_type') if res else 'unknown'}"
            )

        print(f"URL           : https://{client.host}/~{app_name}")

    finally:
        client.logout()


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Deploy statické web appky na Siemens S7-1500 přes WebApp API."
    )
    p.add_argument("--host", required=True, help="IP nebo hostname PLC")
    p.add_argument("--user", required=True, help="Web API uživatel")
    p.add_argument("--password", required=True, help="Web API heslo")
    p.add_argument("--app", required=True, help="Jméno web application")

    group = p.add_mutually_exclusive_group(required=True)
    group.add_argument("--file", type=Path, help="Lokální soubor k uploadu, např. index.html")
    group.add_argument("--dir", type=Path, help="Lokální složka s více soubory, např. ./webapp")

    p.add_argument("--resource-name", default=None, help="Jméno resource v PLC, default = název souboru; jen pro --file")
    p.add_argument("--media-type", default=None, help="Např. text/html; jen pro --file")
    p.add_argument("--default-page", default="index.html", help="Default page pro appku, při --dir typicky index.html")
    p.add_argument("--no-default", action="store_true", help="Nenastavovat default page")
    p.add_argument("--disable-after-upload", action="store_true", help="Po uploadu appku neaktivovat")
    p.add_argument("--keep-existing-resource", action="store_true", help="Nemazat existující resource před deployem")
    p.add_argument("--insecure", action="store_true", help="Nevynucovat ověření TLS certifikátu")
    p.add_argument("--timeout", type=float, default=15.0, help="HTTP timeout v sekundách")
    return p


def main() -> int:
    args = build_arg_parser().parse_args()

    client = SiemensWebApiClient(
        args.host,
        user=args.user,
        password=args.password,
        verify_tls=not args.insecure,
        timeout=args.timeout,
    )

    try:
        if args.file is not None:
            resource_name = args.resource_name or args.file.name
            deploy_single_file(
                client,
                app_name=args.app,
                local_file=args.file,
                resource_name=resource_name,
                media_type=args.media_type,
                set_default=not args.no_default,
                enable_app=not args.disable_after_upload,
                delete_existing_resource=not args.keep_existing_resource,
            )
        else:
            deploy_directory(
                client,
                app_name=args.app,
                local_dir=args.dir,
                set_default=not args.no_default,
                enable_app=not args.disable_after_upload,
                delete_existing_resource=not args.keep_existing_resource,
                default_page=args.default_page,
            )

        return 0
    except PlcApiError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("Přerušeno uživatelem.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())