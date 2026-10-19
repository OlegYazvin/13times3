# 13 Times 3

A static recreation of [13times3.com](https://www.13times3.com), hosted on GitHub Pages. Cloudflare manages DNS and currently proxies HTTPS to GitHub Pages. Transfer of domain registration from Squarespace is pending.

## Contents

- 39 achievement detail pages, with their original URL paths and previous/next order.
- The achievement grid at `/` and `/achievements` (canonical URL: `/`).
- 25 locally stored card images and locally served Archivo and Ojuju fonts.
- A public first-person gallery at `/explore/` with 41 numbered, solid placeholder frames across five winding sections.

The portfolio data is in `src/_data/site.json`; shared templates and styles are in `src/_includes` and `src/assets`. The public Squarespace source snapshot is in `audit/source-manifest.json`. `scripts/import_squarespace.py` can recapture the current public source, but running it will overwrite the data file and downloaded media, so review changes before committing.

## The gallery

The gallery uses Three.js in the browser and a bundled static script. It needs no service beyond the existing GitHub Pages deployment. On a phone, use the left-thumb movement pad and drag the right side to look; on a desktop, use W A S D or arrow keys and drag to look. The 41 frames are numbered and solid in this release. The old achievement pages are independent of these frames.

Frame IDs, labels, positions, and future room details live in `src/_data/gallery.json`. One scene unit is one meter. To make a frame enterable later, place its painting preview and glTF `.glb` scene under `src/assets/rooms/<id>/`, then set both `previewImage` and `modelUrl` in that frame's room record. `dimensionsM` defines simple walkable bounds (default 3.048 meters on each side); `entryPose` sets the camera after crossing; `previewCamera` sets the near-frame live peek. The painting should be rendered from that same 3D scene and camera so the reveal matches. Only the nearest room is loaded, and its assets are released after leaving. Keep each future room near or below 8 MB downloaded and watch the GitHub Pages 1 GB published-site limit.

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
