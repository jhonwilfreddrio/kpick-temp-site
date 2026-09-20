# K-Pick Backlink Strategy

Written 2026-09-20. Owner: K-Pick marketing / sales. Review quarterly.

This is the off-page half of the SEO work. Everything on the site itself —
sitemap, canonicals, schema, Core Web Vitals — is done and verified. Rankings
for the commercial terms ("insulin syringe supplier Philippines", "Korean pen
needle distributor Manila") are now gated by domain authority, and that only
moves with links from other sites.

Ground rule for a YMYL medical site: **no bought links, no PBNs, no comment or
directory spam.** A medical distributor caught in a link scheme loses more than
it gains, and Google applies extra scrutiny to health-adjacent domains. Every
tactic below produces a link a human editor chose to place.

## Current position

- Referring domains: unknown — nobody has measured. **Do step 0 first.**
- `sameAs` is missing from the homepage `MedicalOrganization` schema because
  K-Pick has no confirmed public profile URLs on file. That is the single
  cheapest gap to close (tier 1 below).

## Step 0 — measure before doing anything (week 1)

1. Google Search Console → Links → export "Top linking sites". This is free and
   authoritative for what Google already counts.
2. Run the domain through Ahrefs Webmaster Tools (free for a verified domain) or
   Bing Webmaster Tools' backlink report.
3. Record referring domains and linking pages in a sheet. Re-measure monthly;
   without a baseline you cannot tell which tactic worked.

## Tier 1 — owned and claimable profiles (weeks 1–2, highest certainty)

These are not "link building" so much as making the company findable and
consistent. Every one is free and under K-Pick's control. Use the exact NAP
(name, address, phone) from `llms.txt` on all of them, character for character —
inconsistent NAP is what breaks local SEO.

| Property | Why it matters | Note |
|---|---|---|
| Google Business Profile | Local pack for "medical supplier Manila"; also feeds the knowledge panel | Verify the Malate address |
| LinkedIn company page | The B2B profile procurement officers check before contacting | Post the Sungshim/INSUFiNE distributorship |
| Facebook business page | Still the default trust check in PH B2B | |
| Apple Business Connect | Feeds Apple Maps and Siri | |
| Bing Places | Feeds Bing and, indirectly, ChatGPT search | |

Once these URLs exist, add them to the homepage schema:

```json
"sameAs": [
  "https://www.linkedin.com/company/...",
  "https://www.facebook.com/...",
  "https://www.google.com/maps/place/..."
]
```

and to `about.html`. That is a code change — hand the URLs to whoever maintains
the site.

## Tier 2 — supplier and association links (weeks 2–8, highest value)

These are the links that actually move a distributor's authority, because they
come from domains Google already trusts in the medical space.

1. **Sungshim (ss-medical.co.kr)** — ask for K-Pick to be listed on their
   distributor / partner page with a link to `kpicktradingcorp.com`. K-Pick is
   the *exclusive* PH distributor; this is a reasonable ask and costs the
   manufacturer nothing. Highest-value single link available.
2. **Tae-Chang Industrial (INSUFiNE)** — same ask, same reasoning.
3. **Philippine Medical Device Association / PHAPI-type industry bodies** —
   membership usually includes a member directory listing with a link.
4. **PhilGEPS supplier profile** — include the website URL. Even if the link is
   nofollowed, procurement officers use it and it is a trust signal.
5. **Philippine Chamber of Commerce and Industry (PCCI)** and the Manila local
   chamber — member directory listings.
6. **Korean Chamber of Commerce Philippines (KCCP)** — a natural fit for a
   Korean-brand importer, and an under-used angle.

Template for 1 and 2 (send from `sales@`, not a generic inbox):

> We maintain the Philippine distribution for [brand] and publish full product
> specification pages for the range at kpicktradingcorp.com. Could K-Pick
> Trading Corp be added to your distributor listing, linked to
> https://kpicktradingcorp.com/[brand page]? We are happy to supply a logo and
> a short company description in the format you prefer.

## Tier 3 — expo and event coverage (ongoing, event-driven)

K-Pick already exhibits (PhilMed). Each event is a link opportunity that
expires if nobody asks at the time:

- Exhibitor directory on the organiser's site — always includes a website
  field. Fill it in; check it is a real link, not a redirect.
- Event press releases and "who exhibited" recaps in PH healthcare trade press.
- Partner posts: when a hospital or distributor posts about the booth, ask them
  to link the brand page rather than just tagging the Facebook profile.

Assign one person to chase exhibitor listings within a week of each expo.

## Tier 4 — content that earns links (months 2–6, slowest, compounds)

The Learning Centre (`learn.html`) is the existing asset here. It explains
gauges, needle lengths, low dead space and IV flow paths — genuinely useful
reference material, which is what gets cited. Extend it with material that
procurement and clinical staff have to look up anyway:

- **A gauge / needle-length selection chart** for PH clinical use, as a page
  (not a PDF — PDFs collect fewer links and rank worse).
- **A syringe dead-space comparison** with real figures, since LDS is a K-Pick
  differentiator and there is little PH-specific writing on it.
- **A procurement guide for PhilGEPS medical device tenders** — what documents a
  supplier must produce (CPR, LTO, CE, ISO 13485). Hospital procurement staff
  share this kind of page internally, and it links naturally to the product
  pages.
- **Sharps disposal and safety guidance** aligned to DOH rules.

Then tell people it exists: nursing and medical technology programmes,
professional groups, and the associations from tier 2. A resource page link
from a university or association is worth more than fifty directory entries.

## Tier 5 — digital PR (months 3–12, optional)

Pitch PH business and healthcare press on the angle K-Pick actually owns:
Korean medical device supply into the Philippines — import volumes, lead times,
why Korean manufacturing, what the exclusive distributorships mean for local
supply. Trade press links are strong and topically relevant. This only works
with a real story and real numbers, so it comes after tiers 1–3.

## What not to do

- No paid guest posts, link packages, or "SEO backlink" gigs. On a medical
  domain this is the fastest way to a manual action.
- No mass directory submissions. A handful of relevant PH business directories
  is fine; a thousand generic ones is a spam signal.
- No exact-match anchor stuffing. Natural anchors are the brand name, the URL,
  or the page title — not "buy insulin syringe philippines" fifty times.
- Do not chase volume. Twenty links from PH medical, government and association
  domains beat a thousand from anywhere else.

## Measuring

Monthly, in the same sheet as step 0:

| Metric | Source | Target direction |
|---|---|---|
| Referring domains | GSC / Ahrefs | up, slowly |
| Links from .ph, .gov.ph, .edu.ph | manual tag | the number that matters |
| Organic clicks, commercial queries | GSC | up |
| Local pack impressions | Google Business Profile | up once tier 1 is done |

Expect nothing for the first 6–8 weeks. Tier 1 and tier 2 typically show in
rankings around month 3.
