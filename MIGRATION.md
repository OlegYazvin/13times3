# GitHub Pages and Cloudflare cutover

The site source is published at [OlegYazvin/13times3](https://github.com/OlegYazvin/13times3). On October 19, 2026, GitHub Pages deployed the root-path build with `www.13times3.com` configured. Cloudflare DNS is active, and Squarespace now delegates to `ainsley.ns.cloudflare.com` and `damien.ns.cloudflare.com`. Cloudflare's active edge certificate and Full encryption mode provide HTTPS while GitHub issues its own certificate. All 41 routes and 25 images returned HTTP 200 through Cloudflare over HTTPS; the apex redirects to `www`, and Cloudflare redirects HTTP to HTTPS. Some DNS caches may still contain the old Squarespace answer for several hours. Keep the Squarespace website subscription active until the public custom domain works reliably everywhere.

## Current remaining work

1. GitHub's own custom-domain certificate remains pending. The current Cloudflare proxy supplies browser HTTPS and connects to GitHub over TLS in **Full** mode; Cloudflare does not validate the origin certificate in this mode. After GitHub issues its certificate, enable **Enforce HTTPS** in GitHub Pages, switch Cloudflare to **Full (strict)**, and consider returning the website DNS records to **DNS only**. GitHub says HTTPS may take up to an hour after custom-domain setup, and the control can take up to 24 hours to become available. If GitHub cannot issue while Cloudflare is proxying, use a maintenance window to return the records to DNS only and retry certificate issuance.
2. Verify `13times3.com` in GitHub account **Settings → Pages**. The TXT challenge has been added to Cloudflare DNS and is publicly visible, but GitHub's first verification attempt did not yet see it.
3. Finish the Cloudflare Registrar transfer. Squarespace's transfer lock is off and the authorization code has been requested by email. Cloudflare lists the domain as ready and has the transfer form open at the authorization-code step. The displayed transfer charge is $10.46 before tax as of October 19, 2026. Complete checkout and any confirmation email after the code arrives.
4. After transfer and HTTPS are confirmed, keep an offline backup and cancel the Squarespace website subscription. The temporary Cloudflare API token was revoked and its local file removed on October 19, 2026; later DNS changes can be made in the dashboard.

## 1. GitHub staging

1. **Done:** Created the public repository, pushed `main`, and enabled GitHub Pages with GitHub Actions. The workflow builds and checks every captured route before deployment.
2. **Done:** Checked all 41 routes and an image at the staging URL. The staging pages are marked `noindex`.
3. Review the staging grid, detail pages, and mobile layout visually before switching DNS.

## 2. Prepare the custom domain

1. **Done:** Began GitHub account-level verification of `13times3.com` and added its TXT record to Cloudflare DNS.
2. **Done:** Added `13times3.com` to Cloudflare on the Free plan. Squarespace DNS settings contained only its apex A record, `www` CNAME, and `_domainconnect` CNAME; Cloudflare preserved `_domainconnect`.
3. **Done:** Removed the Squarespace website records from Cloudflare and created these GitHub Pages records, initially as **DNS only**:

   | Name | Type | Value |
   | --- | --- | --- |
   | `@` | A | `185.199.108.153` |
   | `@` | A | `185.199.109.153` |
   | `@` | A | `185.199.110.153` |
   | `@` | A | `185.199.111.153` |
   | `www` | CNAME | `olegyazvin.github.io` |

   These five records are **currently proxied** so Cloudflare's certificate can bridge the period before GitHub's certificate is ready. If using an API token for DNS-only preparation, save it locally as `.secrets/cloudflare-token` (never commit it). Run `python3 scripts/prepare_cloudflare_dns.py` to inspect the zone and proposed changes. `python3 scripts/prepare_cloudflare_dns.py --apply` changes the website records to **DNS only**, so do not run it while the HTTPS bridge is needed. The script saves a timestamped snapshot of Cloudflare's current DNS records under `.secrets/`, preserves unrelated records, and stops on unexpected website-record conflicts. It does not change nameservers.

4. **Done:** Set `SITE_BASE_PATH=/`, reran the Pages workflow successfully, and set the custom domain to `www.13times3.com`.
5. **Done:** Replaced Squarespace's nameservers with Cloudflare's assigned pair. Cloudflare marked the zone active at 14:21 UTC on October 19, 2026. Squarespace DNSSEC was off. Both apex and `www` resolve to GitHub Pages through Cloudflare DNS.

The GitHub IP addresses and custom-domain behavior are documented in [GitHub's custom domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Cloudflare recommends reviewing every DNS record before changing nameservers in its [DNS setup guide](https://developers.cloudflare.com/dns/get-started/).

## 3. Transfer the registration

The domain is registered at Squarespace. The Squarespace account currently shows its lock off and renewal in September 2027. The authorization code was requested from Squarespace on October 19, 2026; Squarespace says delivery can take up to 24 hours. Cloudflare Registrar marks the domain ready for transfer and awaits that code. The account owner must complete checkout and any confirmation emails. The transfer can take several days; the website can remain live on GitHub Pages throughout. [Cloudflare transfer guide](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)

After the transfer completes, confirm Cloudflare is the registrar, DNS remains active, HTTPS works, and all 39 detail URLs work. Keep an offline backup of the site source and media, then cancel the Squarespace website subscription.
