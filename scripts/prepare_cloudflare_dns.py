#!/usr/bin/env python3
"""Prepare the Cloudflare zone and GitHub Pages DNS records safely.

Dry run by default. Credentials stay in .secrets/cloudflare-token, which is ignored
by Git. This script never changes nameservers or registrar settings.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOKEN_PATH = ROOT / ".secrets" / "cloudflare-token"
DOMAIN = "13times3.com"
GITHUB_IPS = (
    "185.199.108.153",
    "185.199.109.153",
    "185.199.110.153",
    "185.199.111.153",
)
SQUARESPACE_IPS = {
    "198.185.159.144",
    "198.185.159.145",
    "198.49.23.144",
    "198.49.23.145",
}


class Cloudflare:
    def __init__(self, token: str) -> None:
        self.token = token

    def request(self, method: str, path: str, body: dict | None = None) -> dict:
        data = json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(
            "https://api.cloudflare.com/client/v4" + path,
            data=data,
            method=method,
            headers={
                "Authorization": "Bearer " + self.token,
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "13times3-github-pages-migration",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")
            raise RuntimeError(f"Cloudflare HTTP {exc.code}: {detail}") from exc
        if not payload.get("success"):
            raise RuntimeError(f"Cloudflare API error: {payload.get('errors')}")
        return payload

    def list_all(self, path: str) -> list[dict]:
        items: list[dict] = []
        page = 1
        while True:
            separator = "&" if "?" in path else "?"
            response = self.request("GET", f"{path}{separator}page={page}&per_page=100")
            items.extend(response["result"])
            info = response.get("result_info") or {}
            if page >= info.get("total_pages", 1):
                return items
            page += 1


def key(record: dict) -> tuple[str, str, str]:
    return record["type"], record["name"].rstrip(".").lower(), record["content"].rstrip(".").lower()


def desired_records() -> list[dict]:
    return [
        *[
            {"type": "A", "name": DOMAIN, "content": ip, "proxied": False, "ttl": 1}
            for ip in GITHUB_IPS
        ],
        {
            "type": "CNAME",
            "name": "www." + DOMAIN,
            "content": "olegyazvin.github.io",
            "proxied": False,
            "ttl": 1,
        },
    ]


def classify(records: list[dict]) -> tuple[list[dict], list[dict], list[dict], list[dict]]:
    wanted = desired_records()
    wanted_keys = {key(record) for record in wanted}
    existing = {key(record): record for record in records}
    remove: list[dict] = []
    conflicts: list[dict] = []
    for record in records:
        record_key = key(record)
        if record_key in wanted_keys:
            continue
        typ, name, content = record_key
        if name == DOMAIN and typ == "A" and content in SQUARESPACE_IPS:
            remove.append(record)
        elif name == "www." + DOMAIN and (
            (typ == "CNAME" and content == "ext-sq.squarespace.com")
            or (typ == "A" and content in SQUARESPACE_IPS)
        ):
            remove.append(record)
        elif (name == DOMAIN and typ in {"A", "AAAA", "CNAME"}) or (
            name == "www." + DOMAIN
            and typ in {"A", "AAAA", "CNAME", "TXT", "MX", "NS"}
        ):
            conflicts.append(record)
    add = [record for record in wanted if key(record) not in existing]
    unproxy = [existing[key(record)] for record in wanted if key(record) in existing and existing[key(record)].get("proxied")]
    return remove, add, unproxy, conflicts


def describe(record: dict) -> str:
    return f"{record['name']} {record['type']} {record['content']}" + (
        " (proxied)" if record.get("proxied") else ""
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Make the displayed changes")
    parser.add_argument("--account-id", help="Cloudflare account ID if multiple accounts are accessible")
    args = parser.parse_args()

    if not TOKEN_PATH.is_file():
        sys.exit(f"Save a Cloudflare API token at {TOKEN_PATH} first")
    TOKEN_PATH.chmod(0o600)
    token = TOKEN_PATH.read_text().strip()
    if not token or "\n" in token:
        sys.exit("The token file must contain one token on one line")
    cloudflare = Cloudflare(token)
    zones = cloudflare.list_all("/zones?name=" + urllib.parse.quote(DOMAIN))
    if len(zones) > 1:
        sys.exit("More than one matching Cloudflare zone exists; inspect the account before continuing")
    if not zones:
        accounts = cloudflare.list_all("/accounts")
        choices = [account for account in accounts if not args.account_id or account["id"] == args.account_id]
        if len(choices) != 1:
            print("Accessible Cloudflare accounts:")
            for account in accounts:
                print(" ", account["id"], account["name"])
            sys.exit("Specify exactly one account with --account-id")
        account = choices[0]
        print(f"Zone {DOMAIN} does not exist in Cloudflare account {account['name']} ({account['id']}).")
        if not args.apply:
            print("Run with --apply to create the pending zone. Re-run afterward to review DNS records.")
            return
        try:
            created = cloudflare.request(
                "POST", "/zones", {"name": DOMAIN, "type": "full", "account": {"id": account["id"]}}
            )["result"]
        except RuntimeError as exc:
            if "com.cloudflare.api.account.zone.create" in str(exc):
                sys.exit(
                    "This token cannot create a new zone. Add 13times3.com to Cloudflare "
                    "on the Free plan in the dashboard, then re-run this script to prepare DNS."
                )
            raise
        print("Created pending zone", created["id"])
        print("Assigned nameservers:", ", ".join(created.get("name_servers") or []))
        print("Re-run this script to review imported DNS records before any DNS changes.")
        return

    zone = zones[0]
    zone_id = zone["id"]
    print(f"Zone: {DOMAIN} ({zone_id}), status: {zone['status']}")
    print("Assigned nameservers:", ", ".join(zone.get("name_servers") or []))
    records = cloudflare.list_all(f"/zones/{zone_id}/dns_records")
    backup_path = ROOT / ".secrets" / "cloudflare-dns-backup.json"
    backup_path.parent.mkdir(mode=0o700, exist_ok=True)
    fd = os.open(backup_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as stream:
        json.dump(records, stream, indent=2)
    print(f"Saved all {len(records)} current Cloudflare DNS records to {backup_path}")
    remove, add, unproxy, conflicts = classify(records)
    for title, group in (("Remove Squarespace web records", remove), ("Add GitHub Pages records", add), ("Set DNS only", unproxy), ("Unexpected web-record conflicts", conflicts)):
        print(title + ":")
        for record in group:
            print(" ", describe(record))
        if not group:
            print("  (none)")
    if conflicts:
        sys.exit("No changes made: resolve unexpected website record conflicts first")
    if not args.apply:
        print("Dry run only. Run with --apply to make these DNS changes.")
        return
    for record in remove:
        cloudflare.request("DELETE", f"/zones/{zone_id}/dns_records/{record['id']}")
    for record in add:
        cloudflare.request("POST", f"/zones/{zone_id}/dns_records", record)
    for record in unproxy:
        cloudflare.request("PATCH", f"/zones/{zone_id}/dns_records/{record['id']}", {"proxied": False})
    print("GitHub Pages records prepared. Check every DNS record against Squarespace before changing nameservers.")


if __name__ == "__main__":
    main()
