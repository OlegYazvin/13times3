# GitHub Pages and Cloudflare cutover

## Resumed migration — October 19, 2026, 18:54 UTC

The owner supplied the Squarespace transfer authorization code in `.secrets/domain authorization code`. It was entered into Cloudflare's transfer form successfully without adding it to the repository. The owner approved the **$10.46** checkout charge, and Cloudflare submitted the transfer at about 18:56 UTC. Cloudflare now shows **Pending Transfer**, with unlocking and authorization-code entry complete and the domain awaiting release by Squarespace. The code file is gitignored and has mode `600`.

Both providers sent transfer emails. Squarespace Domains LLC says no response is needed to proceed; unless canceled, the transfer will proceed by **October 24, 2026**. Cloudflare says the registrar may take up to five days to release it. Squarespace's `Review Request` link is for cancellation, not approval, for this registrar, as described in [Squarespace's outgoing-transfer guide](https://support.squarespace.com/hc/en-us/articles/205812338-Transferring-a-domain-away-from-Squarespace). Do not cancel the transfer or the Squarespace website subscription while registration remains pending.

The live site returned HTTP 200 for all 42 checked paths (homepage, `/explore/`, and 40 paths from the Squarespace manifest). GitHub account domain verification was retried and still reported that it could not find the TXT challenge, despite matching answers from Cloudflare's authoritative nameserver and the `1.1.1.1`, `8.8.8.8`, and `9.9.9.9` resolvers. GitHub's Pages API still reports no origin HTTPS certificate. Keep Cloudflare's proxied DNS and Full TLS mode so public HTTPS continues to work; retry GitHub verification after DNS propagation.

## Earlier pause checkpoint — October 19, 2026, 16:22 UTC

The migration is paused at the owner's request. The live site is already deployed from the public GitHub repository through Cloudflare, with all 41 captured routes and 25 local images verified over HTTPS at the last check. The working tree was clean before this checkpoint was written. Leave the current Cloudflare proxy and Full TLS mode in place while GitHub's origin certificate is pending, and keep the Squarespace website subscription active.

The Squarespace domain transfer is waiting for the authorization-code email requested on October 19 at about 14:22 UTC. A targeted Gmail search at about 14:41 UTC found no code email. The transfer lock is off; Cloudflare showed the domain as ready, with its transfer form at the authorization-code step and a quote of $10.46 before tax. No checkout or payment has occurred. When resuming, search the signed-in Gmail for the Squarespace transfer email, enter the code in Cloudflare if it has arrived, review the final checkout total, then complete any required email confirmation. Do not paste the code into chat or commit it to the repository.

Separately, retry GitHub account **Settings → Pages** verification for `13times3.com`; its Cloudflare TXT challenge was published but GitHub had not recognized it at the last check. Check whether GitHub has issued the custom-domain certificate. If it has, enable **Enforce HTTPS** in GitHub Pages and upgrade Cloudflare from **Full** to **Full (strict)** after verifying origin TLS. The current proxy supplies valid public HTTPS, so preserve it until a replacement has been tested.

Firefox access is available through the existing signed-in X11 session (`DISPLAY=:99.0`, `XAUTHORITY=/run/flatpak/Xauthority`). The browser has Cloudflare, Squarespace, Gmail, and GitHub tabs. Local Xlib automation was installed under `/tmp/xlib-13times3`; it may need to be recreated after a restart. The temporary Cloudflare API token has been revoked and deleted; use the dashboard for DNS changes. This checkpoint contains no transfer code or API token.

The site source is published at [OlegYazvin/13times3](https://github.com/OlegYazvin/13times3). On October 19, 2026, GitHub Pages deployed the root-path build with `www.13times3.com` configured. Cloudflare DNS is active, and Squarespace now delegates to `ainsley.ns.cloudflare.com` and `damien.ns.cloudflare.com`. Cloudflare's active edge certificate and Full encryption mode provide HTTPS while GitHub issues its own certificate. All 41 routes and 25 images returned HTTP 200 through Cloudflare over HTTPS; the apex redirects to `www`, and Cloudflare redirects HTTP to HTTPS. Some DNS caches may still contain the old Squarespace answer for several hours. Keep the Squarespace website subscription active until the public custom domain works reliably everywhere.

## Current remaining work

1. GitHub's own custom-domain certificate remains pending. The current Cloudflare proxy supplies browser HTTPS and connects to GitHub over TLS in **Full** mode; Cloudflare does not validate the origin certificate in this mode. After GitHub issues its certificate, enable **Enforce HTTPS** in GitHub Pages, switch Cloudflare to **Full (strict)**, and consider returning the website DNS records to **DNS only**. GitHub says HTTPS may take up to an hour after custom-domain setup, and the control can take up to 24 hours to become available. If GitHub cannot issue while Cloudflare is proxying, use a maintenance window to return the records to DNS only and retry certificate issuance.
2. Verify `13times3.com` in GitHub account **Settings → Pages**. The TXT challenge has been added to Cloudflare DNS and is publicly visible, but GitHub's first verification attempt did not yet see it.
3. Monitor the Cloudflare Registrar transfer. Checkout was submitted and the transfer is pending release by Squarespace; no email confirmation action is required. Recheck Cloudflare Registrations after October 24 if it has not completed sooner.
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

The domain is registered at Squarespace. The Squarespace account currently shows its lock off and renewal in September 2027. The authorization code was requested from Squarespace on October 19, 2026 and supplied later that day. Cloudflare accepted it, checkout was submitted, and the transfer is pending Squarespace's release. The website can remain live on GitHub Pages throughout. [Cloudflare transfer guide](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)

After the transfer completes, confirm Cloudflare is the registrar, DNS remains active, HTTPS works, and all 39 detail URLs work. Keep an offline backup of the site source and media, then cancel the Squarespace website subscription.
