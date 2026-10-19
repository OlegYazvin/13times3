# 13 Times 3

A static recreation of [13times3.com](https://www.13times3.com), hosted on GitHub Pages. Cloudflare manages DNS and currently proxies HTTPS to GitHub Pages. Transfer of domain registration from Squarespace is pending.

## Contents

- 39 achievement detail pages, with their original URL paths and previous/next order.
- The achievement grid at `/` and `/achievements` (canonical URL: `/`).
- 25 locally stored card images and locally served Archivo and Ojuju fonts.
- A public first-person gallery at `/explore/` with 41 numbered frames across five winding sections. Frame 01 opens into Zephrine's first stage; frames 02–41 are blank.

The portfolio data is in `src/_data/site.json`; shared templates and styles are in `src/_includes` and `src/assets`. The public Squarespace source snapshot is in `audit/source-manifest.json`. `scripts/import_squarespace.py` can recapture the current public source, but running it will overwrite the data file and downloaded media, so review changes before committing.

## The gallery

The gallery uses Three.js in the browser and a bundled static script. It needs no service beyond the existing GitHub Pages deployment. The hallway is 5.8 meters wide and 4.8 meters high, with painted plaster, woodwork, warm lamps, a runner, and solid watercolor placeholders. Its 3.35 × 4.1 meter frames are visible across the corridor; frame 01 loads its live room view within twelve meters and shows it fully before the viewer reaches the frame. Room 01 is a frozen undersea cave with a vaulted stone shell, kelp, coral, shell fossils, Jane's signup desk, and Zephrine's small stage. On a phone, use the left-thumb movement pad; hold a thumb on the left or right side of the screen’s right half to turn continuously, slide up or down to look, and lift to stop. On a desktop, use W A S D or arrow keys and drag to look. Walk through frame 01 to enter, then walk back through its gold-edged doorway to return. The old achievement pages are independent of these frames.

Frame IDs, labels, positions, and room details live in `src/_data/gallery.json`. One scene unit is one meter. Room 01's source is `scripts/room01_author.mjs`; Jane and Zephrine are sculpted entirely from 3D meshes. Run `npm run build:room01` to export its GLB and portrait preview from the same scene and camera. The preview is always visible in the hallway. The room loads as Jane approaches, and the live portal camera moves through the 3D scene. About a meter from the frame, the view opens to a full-screen render of the loaded room; crossing then uses a brief glow and keeps the same camera view. The room is released after leaving. Solid objects in the GLB carry `solidFootprint` markers so walking collision follows the authored furniture and figures. The original reference photos and their EXIF metadata are not in the repository or published site. To make another frame enterable, place its preview and glTF `.glb` scene under `src/assets/explore/roomXX/`, then set both `previewImage` and `modelUrl` in that frame's room record. `dimensionsM` defines walkable bounds; `colliders` are a fallback when a model has no solid footprints; `entryPose` sets the camera after crossing; `previewCamera` sets the live frame view. Room asset requests use a build-time content hash to refresh cached files. Keep each future room near or below 8 MB downloaded and watch the GitHub Pages 1 GB published-site limit.

The client source is in `client/explore/`. `npm run build:client` generates `src/assets/explore/app.js` before Eleventy copies it into the site. That generated file is ignored by Git. A browser without WebGL receives a text fallback listing all 41 frames.

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
