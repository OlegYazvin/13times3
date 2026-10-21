# 13 Times 3

A static recreation of [13times3.com](https://www.13times3.com), hosted on GitHub Pages. Cloudflare manages DNS and currently proxies HTTPS to GitHub Pages. Transfer of domain registration from Squarespace is pending.

## Contents

- 39 achievement detail pages, with their original URL paths and previous/next order.
- The achievement grid at `/` and `/achievements` (canonical URL: `/`).
- 39 locally stored card images and locally served Archivo and Ojuju fonts.
- A public first-person gallery at `/explore/` with 41 stable frames across five winding sections. Frames 01–11 open into story worlds; frames 12–41 remain blank.

The portfolio data is in `src/_data/site.json`; shared templates and styles are in `src/_includes` and `src/assets`. The public Squarespace source snapshot is in `audit/source-manifest.json`. `scripts/import_squarespace.py` can recapture the current public source, but running it will overwrite the data file and downloaded media, so review changes before committing.

## The gallery

The gallery uses Three.js in a bundled static script; GitHub Pages serves the files without a backend. The hallway is 6.4 meters wide and 4.8 meters high, with painted plaster, woodwork, warm lamps, a runner, and watercolor placeholders. A completed frame displays its short painting caption. On phones, the left thumb pad moves and a drag begun anywhere else looks around; holding the finger to either side turns continuously. On desktop, use W A S D or arrow keys and drag to look. Walk through a completed painting to enter and walk through its return opening to leave. The old achievement pages are independent of these frames.

Frame IDs, positions, captions, and room data live in `src/_data/gallery.json`. One scene unit is one meter. Each authored room exports one GLB and a portrait preview from the same scene. The preview stays visible in the hall; approaching the frame reveals the live 3D room through a stencil aperture. One camera keeps its position, heading, and field of view while crossing in either direction. Each room is an independent render and collision space, so adjacent portal worlds may overlap geometrically without appearing through one another. Only the nearby room is loaded, and it is released after the visitor walks away. GLB `solidFootprint` markers define collisions; manifest `colliders` are a fallback. `dimensionsM` defines walkable bounds, `previewCamera` defines the authored painting view, and `backgroundColor` fills the isolated world. `entryPose` remains metadata and does not teleport the camera. The original reference photos and their metadata are not published. To add a room, export its GLB and preview into `src/assets/explore/roomXX/`, set its paths in the manifest, and update the scene registry. Keep each room near or below 8 MB downloaded and monitor GitHub Pages site size.

The client source is in `client/explore/`. `npm run build:client` generates `src/assets/explore/app.js` before Eleventy copies it into the site. Run `npm run build:roomXX` (for example, `npm run build:room11`) after editing a room author or its source art. The room builder saves a matching preview and a Meshopt-compressed GLB; the gallery loader decodes that format. A browser without WebGL receives a text fallback listing all 41 frames.

Before making another room, check the [scene registry](docs/scene-registry.md) for overlap and follow the [scene guide](docs/scene-guide.md). The registry records what each frame depicts; update it when reserving or publishing a scene.

## Local commands

```sh
npm ci
python3 -m pip install -r requirements.txt
npm run build
npm run check
npm run dev
```

Run `npm run build && npm run check` after changing the gallery manifest or client. The checker preserves the 39 original detail routes and validates the new gallery route and frame slots.

To build the GitHub project URL before the custom domain is connected:

```sh
SITE_BASE_PATH=/13times3 npm run build
SITE_BASE_PATH=/13times3 npm run check
```

The GitHub Actions workflow uses `/13times3` for staging unless the repository variable `SITE_BASE_PATH` is set to `/` for the custom domain. Staging builds include `noindex` metadata.

See [MIGRATION.md](MIGRATION.md) for the remaining account and domain steps.
