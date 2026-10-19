# 13 Times 3

A static recreation of [13times3.com](https://www.13times3.com), hosted on GitHub Pages. Cloudflare manages DNS and currently proxies HTTPS to GitHub Pages. Transfer of domain registration from Squarespace is pending.

## Contents

- 39 achievement detail pages, with their original URL paths and previous/next order.
- The achievement grid at `/` and `/achievements` (canonical URL: `/`).
- 25 locally stored card images and locally served Archivo and Ojuju fonts.

The portfolio data is in `src/_data/site.json`; shared templates and styles are in `src/_includes` and `src/assets`. The public Squarespace source snapshot is in `audit/source-manifest.json`. `scripts/import_squarespace.py` can recapture the current public source, but running it will overwrite the data file and downloaded media, so review changes before committing.

## Local commands

```sh
npm ci
python3 -m pip install -r requirements.txt
npm run build
npm run check
npm run dev
```

To build the GitHub project URL before the custom domain is connected:

```sh
SITE_BASE_PATH=/13times3 npm run build
SITE_BASE_PATH=/13times3 npm run check
```

The GitHub Actions workflow uses `/13times3` for staging unless the repository variable `SITE_BASE_PATH` is set to `/` for the custom domain. Staging builds include `noindex` metadata.

See [MIGRATION.md](MIGRATION.md) for the remaining account and domain steps.
