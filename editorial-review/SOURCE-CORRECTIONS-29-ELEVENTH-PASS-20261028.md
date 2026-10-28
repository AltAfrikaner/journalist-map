# Local investigation #29 — Eleventh-pass donor-date and syndicate attribution audit
**28 October 2026 — editorial evidence review; not a release sign-off.**

## Scope and baseline
- Investigation: `osf-funded-orgs.html` (#29, last local investigation in homepage order).
- Original main Git blob: `f00799bcb79ebf6b250040d0c1324b16a5e9a1f0`; corrected article Git blob: `4a1b051a96471bb03408e57aa8b9d53d2ae97c33`. Preserved original page path.
- Only two old source-data tuple values and two explanatory paragraphs changed. Count remains **73 OSF rows / 35 Omidyar-family rows**, not 108 unique certified recipients; all other data tuples, original JS table renderer, SVGs, media, images, IDs, and existing links are preserved. The exact old-to-new pair is pinned in `scripts/check-dossiers.mjs` alongside the separate intact Rooivalk guard.
- Claims of recipient control, individual editorial instructions, platform removals, donor ticket size, or an unbroken grant stream are not established by the cited sources.

## Correction 1 — Africa Check: original grantmaker, legal grantee and dates
**Previous row #1:** “Luminate (formerly Omidyar Network)”, “$500K joint 2017 + ongoing”, “2012–present.” Taken together, these columns implied a Luminate grant stream dating back to the year Africa Check was founded.

**Direct primary evidence:** [Omidyar Network Fund Inc., 2017 Form 990-PF, Attachment A, PDF page 37 (page index 36)](https://omidyar.com/wp-content/uploads/2020/09/ONFI-2017-990-PF.pdf) reports a **US$352,500 award dated January 2016** to **Africa Check C.I.C. in London**, recording **US$352,500 expended**. The report year is 2017 but its explicitly dated grant is January 2016. Recipient is the UK legal entity; it is not an award individually to a South African employee. These fields were inspected in the reproduced filing page.

**Independent chronology checks:** [Africa Check's ten-year historical timeline](https://africacheck.org/index.php/fact-checks/blog/ten-years-africa-check-brief-history) documents its **2012 founding**, while [Luminate's account of its own organisational history](https://luminategroup.com/posts/news/listening-and-learning-for-better-partnership-luminates-gpr-findings/es) dates its establishment as **Luminate to October 2018** after the Omidyar Network spin-out. Founded-in-2012 is not funded-since-2012.

**Correction:** The table now displays the **2016 Omidyar Network Fund amount** and expressly flags later totals and grant years **UNVERIFIED**. It preserves the legacy organisational-family label to avoid silently rewriting lineage. The old $500K joint/2017 plus continuing stream cannot be confirmed from these records and remains a research question; its absence from the reviewed source is not proof that another grant never occurred.

## Correction 2 — littlefish: $9.5m is a consortium amount
**Previous row #35:** A Flourish Ventures entry showed “$9.5M Series A (2026)” in a **Confirmed Amount** column, potentially presenting the full transaction as Flourish's individual allocation or a donation.

**Investor primary:** [Proparco's 24 March 2026 transaction announcement](https://www.proparco.fr/en/news/littlefish-raises-95m-series-round-led-partech-power-merchant-infrastructure-banks-across) confirms the **US$9.5m company-level Series A led by Partech**, with **TLcom, Flourish Ventures and Proparco** participating.

**Independent corroboration:** [Disrupt Africa, 25 March 2026](https://disruptafrica.com/2026/03/25/sa-fintech-startup-littlefish-raises-9-5m-series-a-funding-to-power-merchant-infrastructure-for-african-banks/) independently describes the financing participants and identifies it as an equity round.

**Correction:** Row #35 now explicitly says **$9.5m syndicate Series A**, not a one-investor grant. **Flourish's precise invested capital, resulting equity stake, company valuation and payout/disbursement dates remain UNVERIFIED** from the cited records. An investor's participation does not establish editorial, government or electoral direction.

## Red-team and release holds
- A legacy table badge `VERIFIED` records the source dataset's historical coding; it does **not** meet the current two-independent-source certification standard for all rows. These two corrected cases have cited cross-checks, but 106 other rows still require award-level reconciliation.
- No original SVG/3D data, image/media, table renderer, IDs, navigation route or existing href is removed. Two funding row tuples are deliberately changed with exact-review guards and no silent script changes.
- The founding date of an NGO and formation of a newer funder brand must not be used as evidence of uninterrupted payments.
- Pending: every recipient's primary grant contract, award vs income vs cash classification, investor-specific ticket amounts, legacy PDF data reconciliation, full mobile-browser/keyboard/screen-reader visual checks, independent visitor-facing CDN parity. **#29 remains OPEN, NOT release-certified.**
- Repository inventory at branch baseline: **31 homepage cards / 29 local investigations / 2 external**. Permissions independently rechecked on **28 October 2026**: `citizenintel/kalahari` and `citizenintel/AAIT` both **pull:true, push:false**. **External read-only; neither altered nor upgraded**, and both still need source, media, accessibility and publication assessments.
- Protected `MTNrooivalkIRAN.html` remains **untouched**, expected Git blob `79c93657371ee799d564c07ed5e400bd90ba2690` (1,748,071 bytes). The strict dossier integrity guard remains enabled.
- PR merge, exact-head CI success, clean mergeability, postmerge smoke, Pages deployment and public CDN freshness must each be independently demonstrated rather than presumed from this memo.
