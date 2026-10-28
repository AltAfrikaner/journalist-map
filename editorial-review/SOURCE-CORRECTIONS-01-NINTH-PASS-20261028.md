# Investigation 01 — ninth evidence/red-team pass (28 October 2026)

Repository: `AltAfrikaner/journalist-map`. Base `main`: `90d17a5db33e9d08747fd1ab8909846907a438eb`.
Reviewed `osf.html` blob: `986f59333f2c3ec232058f2000d753fb8b625f73` → `17439298b99f908153fac50492ef4c0157a21e0b`. **OPEN — NOT RELEASE-CERTIFIED.**

## Three source-driven published corrections

1. **Historical funding shares versus a dated recipient disclosure.** An undated provenance entry called **OSF 12%, Gates 13%, Luminate 8%** "confirmed", despite another published paragraph already labelling their year/denominator unverified. Africa Check itself disclosed in a fact check on **23 June 2025** that **OSF supplied 3% of Africa Check's funding in 2023**. A contemporary AllAfrica syndication carries the same disclosure but is **not an independent audit**. Africa Check's separately dated 2025 funding page lists that year's income breakdown; figures from different years cannot be combined. We replaced the erroneous "confirmed" wording with a dated fact, distinguished self-disclosure from independent verification, and kept the older three percentages **UNVERIFIED** pending archived, common-year original returns.
2. **Lifetime OSF expenditure, reporting period and geographic denominator.** The on-page unqualified **">US$25 billion"** statement was not supported by the latest OSF public financial dashboard, which currently shows **US$24.2 billion expenditures to date** and **approximately US$1.2 billion for 2024**, its most recent displayed year. Independent 2026 Devex reporting quotes those same figures. The story now cites both and says that exceeding US$25 billion in a later unreported period remains **UNVERIFIED**, not false. This is **worldwide cumulative expenditures**, not grants to South Africa, foundation assets or Soros's total contributions.
3. **Inference versus observed platform decisions.** The concluding "structural question" previously made a categorical same-funder-to-fact-checker-to-academic-pipeline claim. It now keeps the defensible pro-Afrikaner inquiry into ideological incentives, source diversity and donor transparency, but does not claim that linked organisations were all funded simultaneously, that academics set all African platform rules or that a specific Meta post was suppressed. Coordination and editorial/platform control remain **UNVERIFIED** without grant instructions, complete year-by-year records and case-specific notices.

## Evidence and independent comparison

- Africa Check, 23 June 2025, first-party disclosure explicitly quantifying OSF's **2023** share at **3%**: https://africacheck.org/fact-checks/meta-programme-fact-checks/no-cnns-fareed-zakaria-did-not-support-tanzanias-crackdown
- AllAfrica, 23 June 2025, republication of that disclosure, **not** independent verification: https://allafrica.com/stories/202506230332.html
- Africa Check, current **2025** funders page: https://africacheck.org/who-we-are/how-we-are-funded
- Open Society Foundations, original global financial dashboard, latest listed **2024**: https://www.opensocietyfoundations.org/who-we-are/financials
- Devex, independent 2026 reporting on original OSF expenditure/2024 grants: https://www.devex.com/news/who-were-open-society-foundations-top-grantees-in-2024-112502
- OECD 2025 development-cooperation profile provides a separate analytical framework for **2023** OSF development finance; its figures are **not a global lifetime-spending or recipient audit**: https://www.oecd.org/en/publications/development-co-operation-profiles_04b376d7-en/open-society-foundations_19516b58-en.html

## Preservation and release limitations

Three visible HTML paragraphs corrected; five source links introduced. **All 51 original hrefs survive in the original order**, as do the precise existing inline/external scripts, 3D nodes/edges, CSS, SVG, image tags, iframes, IDs, existing article URL and network data. This is a prose/source edit, not a silent 3D or data rewrite. Full-file Git blobs are pinned in strict CI, and previously published baseline hashes remain guarded. Protected `MTNrooivalkIRAN.html` remains untouched (known baseline blob `79c93657371ee799d564c07ed5e400bd90ba2690`, 1,748,071 bytes).

This file remains **OPEN**: validate each of the 67 graph nodes and edges; check 2023/2025 Africa Check financial statements and percentage denominators, historic grant contracts and person-level claims, 2025–26 consolidated OSF expenditures if issued, browser/mobile/keyboard/screen-reader interaction, external links and uncached public-CDN parity. No confirmation of a complete 29-article editorial release is implied.

Repository archive baseline independently confirmed this run: **31 unique cards; 29 local nonempty investigations and two external**. `citizenintel/kalahari` and `citizenintel/AAIT` were separately permission-checked **pull:true,push:false**, remain external READ-ONLY, unmodified and not certified. #02 was inspected but intentionally not edited: open PR #4 proposes changes to `sa_journalists.html`; avoid speculative duplicate edits or changing its unreviewed 3D dataset.

## CI release-gate reconciliation (PR #206)

The first PR run failed on two verifiable **test-harness defects**, not a failure to preserve the changed article's media. The newly edited dossier hash guard temporarily used the identifier `published` twice within one block. It has been corrected to `reviewedBlob` without weakening original-main versus reviewed-blob assertions. A separate legacy five-artwork check expected `assets/story-art/sa_journalists-inside.svg`, despite the **already published** `assets/site-branding.js` mapping #02 to `assets/articles/sa-journalists-network-premium.jpg`. The test now checks that actual referenced JPEG, with strict file size **414,557 bytes** and Git blob **`fd12ecdaeb619a0b9242fe0de9f989f000f53484`**. No #02 HTML, image, renderer, drawing, 3D graph or media file was changed. The two subsequently executed workflow checks completed successfully on head `e9ab5550496cc255a3b91d343b76e3d0690d0eea`. Any later documentation-only commit must still be rechecked against its exact final head before merge.
