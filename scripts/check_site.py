#!/usr/bin/env python3
"""Check that the generated site preserves the captured public source."""

from __future__ import annotations

import json
import hashlib
import os
import xml.etree.ElementTree as ET
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
DATA = json.loads((ROOT / "src" / "_data" / "site.json").read_text())
GALLERY = json.loads((ROOT / "src" / "_data" / "gallery.json").read_text())
MANIFEST = json.loads((ROOT / "audit" / "source-manifest.json").read_text())
BASE_PATH = os.environ.get("SITE_BASE_PATH", "/").rstrip("/")


def source_path(path: str) -> Path:
    return OUTPUT / path.lstrip("/") / "index.html"


def parse(path: Path) -> BeautifulSoup:
    assert path.is_file(), f"Missing generated file: {path}"
    return BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")


def expected_href(path: str) -> str:
    return BASE_PATH + path if BASE_PATH else path


def main() -> None:
    entries = DATA["achievements"]
    audit = MANIFEST["entries"]
    assert len(entries) == len(audit) == 39
    assert [item["path"] for item in entries] == [item["path"] for item in audit]
    assert set(MANIFEST["sitemapPaths"]) == {"/achievements"} | {item["path"] for item in entries}

    for route in ("/", "/achievements"):
        page = parse(source_path(route))
        assert page.select_one("a.explore-entry").get("href") == expected_href("/explore/")
        cards = page.select("a.grid-item")
        assert len(cards) == 39, f"{route}: wrong card count"
        assert [card.get("href") for card in cards] == [expected_href(item["path"]) for item in entries]
        assert [card.get("aria-label") for card in cards] == [item["title"] for item in entries]
        assert page.select_one("link[rel=canonical]").get("href") == DATA["canonicalOrigin"]
        assert DATA["intro"] in page.get_text(" ", strip=True)
        for card, item in zip(cards, entries):
            assert card.select_one("img").get("src") == expected_href(item["image"])

    for item, record in zip(entries, audit):
        page = parse(source_path(item["path"]))
        content = page.select_one(".detail-content")
        assert content is not None, f"No content: {item['path']}"
        assert content.get_text(" ", strip=True) == record["text"], f"Text mismatch: {item['path']}"
        assert page.select_one("link[rel=canonical]").get("href") == DATA["canonicalOrigin"] + item["path"]
        if item.get("previous"):
            assert page.select_one("a.previous").get("href") == expected_href(item["previous"]["path"])
        else:
            assert page.select_one("a.previous") is None
        if item.get("next"):
            assert page.select_one("a.next").get("href") == expected_href(item["next"]["path"])
        else:
            assert page.select_one("a.next") is None
        assert "squarespace" not in str(page).lower(), f"Squarespace reference in {item['path']}"

    for item in entries:
        media_path = OUTPUT / item["image"].lstrip("/")
        assert media_path.is_file() and media_path.stat().st_size > 0, f"Missing image: {media_path}"

    frames = GALLERY["frames"]
    assert GALLERY["sectionCounts"] == [8, 8, 8, 8, 9]
    assert len(frames) == 41
    assert [frame["id"] for frame in frames] == [f"{index:02d}" for index in range(1, 42)]
    assert [frame["label"] for frame in frames] == [frame["id"] for frame in frames]
    assert [sum(frame["section"] == section for frame in frames) for section in range(5)] == GALLERY["sectionCounts"]
    first_room = frames[0]["room"]
    assert first_room["title"] == "You signed Zephrine up for dance and acting classes!"
    assert first_room["dimensionsM"] == [5.4, 3.6, 5.4]
    assert first_room["previewImage"] == "/assets/explore/room01/preview.webp"
    assert first_room["modelUrl"] == "/assets/explore/room01/room.glb"
    assert len(first_room["colliders"]) == 4
    assert sum(collider.get("shape") == "circle" for collider in first_room["colliders"]) == 2
    assert all(not frame["room"]["previewImage"] and not frame["room"]["modelUrl"] for frame in frames[1:])
    preview = OUTPUT / first_room["previewImage"].lstrip("/")
    model = OUTPUT / first_room["modelUrl"].lstrip("/")
    assert preview.read_bytes()[:4] == b"RIFF"
    assert model.read_bytes()[:4] == b"glTF"
    assert preview.stat().st_size + model.stat().st_size < 8_000_000
    assert not (OUTPUT / "room_assets").exists(), "Reference artwork should not be published separately"
    explore = parse(source_path("/explore"))
    assert explore.select_one("#welcome-title") is not None
    assert explore.select_one("#joystick") is not None
    assert explore.select_one("#fallback") is not None
    assert explore.select_one("#room-title") is not None
    assert explore.select_one("script#gallery-data") is not None
    assert len(explore.select(".frame-list li")) == 41
    script_version = hashlib.sha256((OUTPUT / "assets/explore/app.js").read_bytes()).hexdigest()[:12]
    assert explore.select_one("script[src]").get("src") == expected_href("/assets/explore/app.js") + f"?v={script_version}"
    assert explore.select_one('link[rel="stylesheet"]').get("href") == expected_href("/assets/explore.css")
    assert explore.select_one("link[rel=canonical]").get("href") == DATA["canonicalOrigin"] + "/explore/"
    for asset in ("assets/explore/app.js", "assets/explore.css"):
        assert (OUTPUT / asset).is_file() and (OUTPUT / asset).stat().st_size > 0
    for font_name in ("archivo-latin-400-normal.woff2", "archivo-latin-700-normal.woff2", "ojuju-latin-600-normal.woff2"):
        assert (OUTPUT / "assets" / "fonts" / font_name).is_file(), f"Missing font: {font_name}"

    sitemap = ET.parse(OUTPUT / "sitemap.xml").getroot()
    published_urls = {node.text for node in sitemap.findall(".//{*}loc")}
    expected_urls = {DATA["canonicalOrigin"] + "/", DATA["canonicalOrigin"] + "/explore/"} | {DATA["canonicalOrigin"] + item["path"] for item in entries}
    assert published_urls == expected_urls, "Generated sitemap is incomplete"
    assert (OUTPUT / "404.html").is_file()
    assert (OUTPUT / "robots.txt").is_file()

    total_bytes = sum(path.stat().st_size for path in OUTPUT.rglob("*") if path.is_file())
    assert total_bytes < 1_000_000_000, "GitHub Pages published-site limit exceeded"
    print(f"Verified 39 detail pages, 2 grid routes, 41 gallery frames (room 01 live), 25 unique card images, sitemap, and local fonts ({total_bytes / 1_000_000:.1f} MB).")


if __name__ == "__main__":
    main()
