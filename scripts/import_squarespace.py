#!/usr/bin/env python3
"""Capture the public Squarespace portfolio for a self-hosted static build.

This is deliberately a one-time, polite importer. The generated JSON and media
are committed so the published site never needs the Squarespace service.
"""

from __future__ import annotations

import hashlib
import json
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
SOURCE = "https://www.13times3.com"
DATA_PATH = ROOT / "src" / "_data" / "site.json"
MEDIA_DIR = ROOT / "src" / "assets" / "media"
MANIFEST_PATH = ROOT / "audit" / "source-manifest.json"
USER_AGENT = "Mozilla/5.0 (compatible; 13times3-migration/1.0)"
LAST_SITE_REQUEST = 0.0


def fetch(url: str) -> bytes:
    global LAST_SITE_REQUEST
    if urllib.parse.urlsplit(url).hostname == "www.13times3.com":
        elapsed = time.monotonic() - LAST_SITE_REQUEST
        if elapsed < 1.1:
            time.sleep(1.1 - elapsed)
        LAST_SITE_REQUEST = time.monotonic()

    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 502, 503, 504) or attempt == 5:
                raise
            time.sleep(min(3 * (attempt + 1), 15))
    raise RuntimeError(f"Could not fetch {url}")


def clean_content(soup: BeautifulSoup) -> str:
    blocks = soup.select("main article .sqs-html-content")
    if not blocks:
        raise ValueError("No text content blocks found")
    fragments = []
    for block in blocks:
        for tag in block.select("style, script"):
            tag.decompose()
        for tag in block.select("*"):
            tag.attrs = {key: value for key, value in tag.attrs.items() if key == "href" and tag.name == "a"}
        fragments.extend(str(child) for child in block.children if str(child).strip())
    result = "\n".join(fragments).strip()
    if not BeautifulSoup(result, "html.parser").get_text(" ", strip=True):
        raise ValueError("Extracted content is empty")
    return result


def main() -> None:
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)

    homepage = json.loads(fetch(SOURCE + "/?format=json"))
    items = sorted(homepage["items"], key=lambda item: item["displayIndex"])
    if len(items) != 39:
        raise ValueError(f"Expected 39 published portfolio items, found {len(items)}")

    home_soup = BeautifulSoup(fetch(SOURCE + "/"), "html.parser")
    intro = home_soup.select_one("main article .sqs-html-content h3")
    if intro is None:
        raise ValueError("Could not locate homepage introduction")

    source_sitemap = ET.fromstring(fetch(SOURCE + "/sitemap.xml"))
    sitemap_paths = {
        urllib.parse.urlsplit(location.text).path
        for location in source_sitemap.findall(".//{*}loc")
        if location.text
    }
    expected_paths = {"/achievements"} | {item["fullUrl"] for item in items}
    if sitemap_paths != expected_paths:
        raise ValueError(f"Sitemap mismatch: missing={expected_paths - sitemap_paths}; extra={sitemap_paths - expected_paths}")

    media_by_url: dict[str, str] = {}
    achievements = []
    audit = []
    for position, item in enumerate(items, start=1):
        path = item["fullUrl"]
        detail = BeautifulSoup(fetch(SOURCE + path), "html.parser")
        content_html = clean_content(detail)
        source_image = item.get("assetUrl")
        if not source_image:
            raise ValueError(f"Missing card image on {path}")
        if source_image not in media_by_url:
            extension = Path(urllib.parse.urlsplit(source_image).path).suffix.lower() or ".bin"
            media_name = hashlib.sha256(source_image.encode()).hexdigest()[:16] + extension
            destination = MEDIA_DIR / media_name
            if not destination.exists():
                destination.write_bytes(fetch(source_image))
            media_by_url[source_image] = "/assets/media/" + media_name

        achievement = {
            "title": item["title"],
            "path": path,
            "slug": path.rsplit("/", 1)[-1],
            "image": media_by_url[source_image],
            "contentHtml": content_html,
        }
        achievements.append(achievement)
        audit.append({
            "position": position,
            "title": item["title"],
            "path": path,
            "sourceImage": source_image,
            "localImage": achievement["image"],
            "text": BeautifulSoup(content_html, "html.parser").get_text(" ", strip=True),
        })
        print(f"{position:02d}/39 {item['title']} {path}", flush=True)

    for index, achievement in enumerate(achievements):
        if index:
            achievement["previous"] = {
                "title": achievements[index - 1]["title"],
                "path": achievements[index - 1]["path"],
            }
        if index + 1 < len(achievements):
            achievement["next"] = {
                "title": achievements[index + 1]["title"],
                "path": achievements[index + 1]["path"],
            }

    site = {
        "title": "13 Times 3",
        "navTitle": "Jane's Achievements",
        "canonicalOrigin": SOURCE,
        "intro": intro.get_text(" ", strip=True),
        "achievements": achievements,
    }
    DATA_PATH.write_text(json.dumps(site, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "capturedAt": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE,
        "sitemapPaths": sorted(sitemap_paths),
        "homepagePath": "/",
        "entries": audit,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Captured {len(achievements)} pages and {len(media_by_url)} unique card images")


if __name__ == "__main__":
    main()
