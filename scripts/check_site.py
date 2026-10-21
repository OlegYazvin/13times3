#!/usr/bin/env python3
"""Check that the generated site preserves the captured public source."""

from __future__ import annotations

import json
import hashlib
import os
import re
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
    headings = {
        item["path"]: BeautifulSoup(item["contentHtml"], "html.parser").find("h4").get_text(strip=True)
        for item in entries
    }
    assert len({item["image"] for item in entries}) == 39, "Each achievement needs its own illustration"
    assert [item["path"] for item in entries] == [item["path"] for item in audit]
    assert set(MANIFEST["sitemapPaths"]) == {"/achievements"} | {item["path"] for item in entries}

    for route in ("/", "/achievements"):
        page = parse(source_path(route))
        assert page.select_one("a.explore-entry").get("href") == expected_href("/explore/")
        assert page.select_one('nav[aria-label="Main navigation"] a[href="' + expected_href("/credits/") + '"]') is not None
        cards = page.select("a.grid-item")
        assert len(cards) == 39, f"{route}: wrong card count"
        assert [card.get("href") for card in cards] == [expected_href(item["path"]) for item in entries]
        assert [card.get("aria-label") for card in cards] == [headings[item["path"]] for item in entries]
        assert not page.select(".grid-overlay"), "Image tiles should not show code labels"
        assert all(not card.get_text(strip=True) for card in cards)
        assert page.select_one("link[rel=canonical]").get("href") == DATA["canonicalOrigin"]
        assert DATA["intro"] in page.get_text(" ", strip=True)
        for card, item in zip(cards, entries):
            assert card.select_one("img").get("src") == expected_href(item["image"])

    for item, record in zip(entries, audit):
        page = parse(source_path(item["path"]))
        content = page.select_one(".detail-content")
        assert content is not None, f"No content: {item['path']}"
        assert content.get_text(" ", strip=True) == record["text"], f"Text mismatch: {item['path']}"
        assert page.title.get_text(strip=True) == headings[item["path"]] + " — " + DATA["title"]
        assert page.select_one("link[rel=canonical]").get("href") == DATA["canonicalOrigin"] + item["path"]
        if item.get("previous"):
            assert page.select_one("a.previous").get("href") == expected_href(item["previous"]["path"])
            assert page.select_one("a.previous strong").get_text(strip=True) == headings[item["previous"]["path"]]
        else:
            assert page.select_one("a.previous") is None
        if item.get("next"):
            assert page.select_one("a.next").get("href") == expected_href(item["next"]["path"])
            assert page.select_one("a.next strong").get_text(strip=True) == headings[item["next"]["path"]]
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
    registry = (ROOT / "docs" / "scene-registry.md").read_text(encoding="utf-8")
    registry_rows = re.findall(r"^\| `([0-9]{2})` \| (Planned|Published|Retired) \|([^\n]+)$", registry, re.MULTILINE)
    registry_ids = [frame_id for frame_id, _, _ in registry_rows]
    assert len(registry_ids) == len(set(registry_ids)), "The scene registry repeats a frame ID"
    assert set(registry_ids) <= {frame["id"] for frame in frames}, "The scene registry has an unknown frame ID"
    live_ids = {frame["id"] for frame in frames if frame["room"]["modelUrl"]}
    published_ids = {frame_id for frame_id, status, _ in registry_rows if status == "Published"}
    assert published_ids == live_ids, "Published scenes in the registry must match live room models"
    for frame_id, status, details in registry_rows:
        if status == "Published":
            title = frames[int(frame_id) - 1]["room"]["title"]
            assert title in details, f"Registry title differs from frame {frame_id}"
    first_room = frames[0]["room"]
    assert first_room["title"] == "You signed Zephrine up for dance and acting classes!"
    assert first_room["dimensionsM"] == [5.4, 3.6, 5.4]
    assert first_room["previewImage"] == "/assets/explore/room01/preview.webp"
    assert first_room["modelUrl"] == "/assets/explore/room01/room.glb"
    assert len(first_room["colliders"]) == 4
    assert sum(collider.get("shape") == "circle" for collider in first_room["colliders"]) == 2
    assert all(not frame["room"]["previewImage"] and not frame["room"]["modelUrl"]
               for index, frame in enumerate(frames) if index not in (0, 1, 8))
    preview = OUTPUT / first_room["previewImage"].lstrip("/")
    model = OUTPUT / first_room["modelUrl"].lstrip("/")
    assert preview.read_bytes()[:4] == b"RIFF"
    assert model.read_bytes()[:4] == b"glTF"
    glb = model.read_bytes()
    glb_json_length = int.from_bytes(glb[12:16], "little")
    glb_json = json.loads(glb[20:20 + glb_json_length])
    solid_nodes = [node for node in glb_json["nodes"] if node.get("extras", {}).get("solidFootprint")]
    assert len(solid_nodes) == 4, "Room 01 must carry four model-authored solid footprints"
    assert not any("dance card" in node.get("name", "").lower() or "acting card" in node.get("name", "").lower()
                   for node in glb_json["nodes"]), "Stage labels should not cover the scene"
    assert preview.stat().st_size + model.stat().st_size < 8_000_000
    job_room = frames[1]["room"]
    assert job_room["title"] == "Jane helped me (Oleg) get a job"
    assert job_room["caption"] == "Jane kept me going"
    assert job_room["dimensionsM"] == [12.4, 6.4, 17.2]
    job_preview = OUTPUT / job_room["previewImage"].lstrip("/")
    job_model = OUTPUT / job_room["modelUrl"].lstrip("/")
    assert job_preview.read_bytes()[:4] == b"RIFF"
    assert job_model.read_bytes()[:4] == b"glTF"
    assert job_preview.stat().st_size + job_model.stat().st_size < 8_000_000
    job_glb = job_model.read_bytes()
    job_json_length = int.from_bytes(job_glb[12:16], "little")
    job_json = json.loads(job_glb[20:20 + job_json_length])
    assert sum(bool(node.get("extras", {}).get("solidFootprint")) for node in job_json["nodes"]) >= 20, "Room 02 needs solid desk, figures, and props"
    assert not any("company" in node.get("name", "").lower() for node in job_json["nodes"]), "Do not name a company in room 02"
    orchard_room = frames[8]["room"]
    assert orchard_room["title"] == "We FINALLY visited our friends in Ithaca for the first time where Zephrine got to try apple picking for the first time."
    assert orchard_room["caption"] == "First apples with friends"
    assert orchard_room["dimensionsM"] == [11.6, 5.8, 14.2]
    orchard_preview = OUTPUT / orchard_room["previewImage"].lstrip("/")
    orchard_model = OUTPUT / orchard_room["modelUrl"].lstrip("/")
    assert orchard_preview.read_bytes()[:4] == b"RIFF"
    assert orchard_model.read_bytes()[:4] == b"glTF"
    assert orchard_preview.stat().st_size + orchard_model.stat().st_size < 8_000_000
    orchard_glb = orchard_model.read_bytes()
    orchard_json_length = int.from_bytes(orchard_glb[12:16], "little")
    orchard_json = json.loads(orchard_glb[20:20 + orchard_json_length])
    assert sum(bool(node.get("extras", {}).get("solidFootprint")) for node in orchard_json["nodes"]) >= 16, "Room 09 needs solid figures, trees, and props"
    assert not (OUTPUT / "room_assets").exists(), "Reference artwork should not be published separately"
    explore = parse(source_path("/explore"))
    assert explore.select_one("#welcome-title") is not None
    assert explore.select_one("#joystick") is not None
    assert explore.select_one("#fallback") is not None
    assert explore.select_one("#room-title") is not None
    music_button = explore.select_one("#music-button")
    assert music_button is not None and music_button.get("aria-pressed") == "false"
    music_version = hashlib.sha256((OUTPUT / "assets/explore/resolutions-scott-buckley.mp3").read_bytes()).hexdigest()[:12]
    assert explore.select_one("#experience").get("data-music-url") == expected_href("/assets/explore/resolutions-scott-buckley.mp3") + f"?v={music_version}"
    assert explore.select_one(".music-credit") is None, "Attribution belongs on the credits page"
    credits = parse(source_path("/credits"))
    assert credits.title.get_text(strip=True) == "Credits — " + DATA["title"]
    assert credits.select_one("link[rel=canonical]").get("href") == DATA["canonicalOrigin"] + "/credits/"
    assert credits.select_one('nav[aria-label="Main navigation"] a[aria-current="page"]').get("href") == expected_href("/credits/")
    credit = credits.select_one(".credit-card")
    assert credit is not None and "Resolutions" in credit.get_text(" ", strip=True)
    assert "Scott Buckley" in credit.get_text(" ", strip=True)
    assert "128 kbps" in credit.get_text(" ", strip=True)
    assert {link.get("href") for link in credit.select("a")} == {
        "https://www.scottbuckley.com.au/library/resolutions/",
        "https://creativecommons.org/licenses/by/4.0/",
    }
    assert explore.select_one("script#gallery-data") is not None
    assert len(explore.select_one("#experience").get("data-room-version")) == 12
    assert explore.select_one(".fallback-preview").get("src").endswith("?v=" + explore.select_one("#experience").get("data-room-version"))
    assert len(explore.select(".frame-list li")) == 41
    script_version = hashlib.sha256((OUTPUT / "assets/explore/app.js").read_bytes()).hexdigest()[:12]
    assert explore.select_one("script[src]").get("src") == expected_href("/assets/explore/app.js") + f"?v={script_version}"
    assert explore.select_one('link[rel="stylesheet"]').get("href") == expected_href("/assets/explore.css")
    assert explore.select_one("link[rel=canonical]").get("href") == DATA["canonicalOrigin"] + "/explore/"
    for asset in ("assets/explore/app.js", "assets/explore.css"):
        assert (OUTPUT / asset).is_file() and (OUTPUT / asset).stat().st_size > 0
    music = OUTPUT / "assets/explore/resolutions-scott-buckley.mp3"
    assert music.is_file() and music.stat().st_size < 8_000_000, "Gallery music missing or too large"
    assert music.read_bytes()[:3] == b"ID3", "Gallery music is not an MP3"
    for font_name in ("archivo-latin-400-normal.woff2", "archivo-latin-700-normal.woff2", "ojuju-latin-600-normal.woff2"):
        assert (OUTPUT / "assets" / "fonts" / font_name).is_file(), f"Missing font: {font_name}"

    sitemap = ET.parse(OUTPUT / "sitemap.xml").getroot()
    published_urls = {node.text for node in sitemap.findall(".//{*}loc")}
    expected_urls = {DATA["canonicalOrigin"] + path for path in ("/", "/explore/", "/credits/")} | {DATA["canonicalOrigin"] + item["path"] for item in entries}
    assert published_urls == expected_urls, "Generated sitemap is incomplete"
    assert (OUTPUT / "404.html").is_file()
    assert (OUTPUT / "robots.txt").is_file()

    total_bytes = sum(path.stat().st_size for path in OUTPUT.rglob("*") if path.is_file())
    assert total_bytes < 1_000_000_000, "GitHub Pages published-site limit exceeded"
    print(f"Verified 39 detail pages, 2 grid routes, credits, 41 gallery frames (rooms 01, 02, and 09 live), 39 unique card images, sitemap, and local fonts ({total_bytes / 1_000_000:.1f} MB).")


if __name__ == "__main__":
    main()
