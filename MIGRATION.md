# GitHub Pages and Cloudflare cutover

The site source is published at [OlegYazvin/13times3](https://github.com/OlegYazvin/13times3). GitHub Pages has deployed it at [the staging URL](https://olegyazvin.github.io/13times3/). All 41 public routes and a sample image returned successfully on October 19, 2026. Keep the Squarespace website subscription active until the custom domain and all media work on the new host.

## 1. GitHub staging

1. **Done:** Created the public repository, pushed `main`, and enabled GitHub Pages with GitHub Actions. The workflow builds and checks every captured route before deployment.
2. **Done:** Checked all 41 routes and an image at the staging URL. The staging pages are marked `noindex`.
3. Review the staging grid, detail pages, and mobile layout visually before switching DNS.

## 2. Prepare the custom domain

1. In GitHub account **Settings → Pages**, begin verification of `13times3.com` and add its requested TXT record at the current authoritative DNS provider. Wait for GitHub to show the domain as verified.
2. Add `13times3.com` to Cloudflare on the Free plan. Before changing nameservers, compare Cloudflare's imported DNS records with the full list in Squarespace Domains, including any MX, TXT, CAA, and service records. Preserve any records not related to the Squarespace website.
3. In Cloudflare DNS, remove the Squarespace website `A` records and `www` CNAME. Create these **DNS only** records for GitHub Pages:

   | Name | Type | Value |
   | --- | --- | --- |
   | `@` | A | `185.199.108.153` |
   | `@` | A | `185.199.109.153` |
   | `@` | A | `185.199.110.153` |
   | `@` | A | `185.199.111.153` |
   | `www` | CNAME | `olegyazvin.github.io` |

4. Set the GitHub repository variable `SITE_BASE_PATH` to `/` under **Settings → Secrets and variables → Actions → Variables**. Trigger the Pages workflow and confirm it passes. In **Settings → Pages**, set the custom domain to `www.13times3.com`.
5. At Squarespace Domains, replace the current nameservers with the exact nameservers assigned to this zone by Cloudflare. Wait for Cloudflare to mark the zone active, then verify both `www.13times3.com` and the apex resolve to GitHub Pages. Enable **Enforce HTTPS** in GitHub Pages after the certificate is available. The apex should redirect to `www`.

The GitHub IP addresses and custom-domain behavior are documented in [GitHub's custom domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Cloudflare recommends reviewing every DNS record before changing nameservers in its [DNS setup guide](https://developers.cloudflare.com/dns/get-started/).

## 3. Transfer the registration

The domain is registered at Squarespace through October 10, 2027. Public registration data currently lists `client transfer prohibited`, so unlock the domain in Squarespace Domains and request its authorization code when the transfer is eligible. Start the transfer in Cloudflare Registrar after Cloudflare DNS is active. The account owner must complete checkout and any confirmation emails. The transfer can take several days; the website can remain live on GitHub Pages throughout. [Cloudflare transfer guide](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/)

After the transfer completes, confirm Cloudflare is the registrar, DNS remains active, HTTPS works, and all 39 detail URLs work. Keep an offline backup of the site source and media, then cancel the Squarespace website subscription.
