# Eighth-pass documentary/red-team review — investigation #09: Washington to Newsroom

**Date:** 28 October 2026. **Exact baseline main:** `d6a7521cd5b604035f9d68f7c6526049c4275bb5`. **Status: OPEN / NOT evidence-certified.**

## Source-level correction: 2023 USAID support versus Internews and South Africa

A legacy USAID funding node grouped **6,200 journalists** and **707 media organisations** vaguely as “global Internews/USAID reporting” and marked their attribution and year unspecified. That was incomplete and could mislead a reader into treating them as Internews partners or South African trainees.

The original **3 February 2025 RSF statement (updated 6 February)** attributes the **6,200 journalists**, **707 non-state outlets**, and **279 media-sector civil-society organisations** to **USAID programmes during 2023 across more than 30 countries**. RSF cites an original USAID fact sheet taken offline, rather than presenting primary recipient-level data. The separate **6 February 2025 Anadolu report** repeats RSF's account; it is a second independent *publication*, **not** a second independently audited dataset.

- Primary-origin intermediary: [Reporters Without Borders, published 3 February and updated 6 February 2025](https://rsf.org/en/usa-trump-s-foreign-aid-freeze-throws-journalism-around-world-chaos).
- Cross-report and attribution check: [Anadolu Agency, 6 February 2025](https://aa.com.tr/en/americas/usaid-funded-6-200-journalists-supported-707-media-outlets-globally-report/3474390).
- Funding vocabulary and distinction between obligations/outlays already grounded in [USAspending's federal spending guide](https://www.usaspending.gov/federal-spending-guide); these numbers cannot be substituted for cash-to-person evidence.

**Corrected article node:** assigned numbers to USAID-wide global 2023 programme support, added the 279 third category, and explicitly withheld original fact-sheet line items, the identities of any South African recipient and editorial-direction conclusions as **UNVERIFIED**. Funding can legitimately be scrutinised without making a cross-programme denominator into a payment list.

## Second denominator correction: 4,291 is not the same as 707

The adjacent Internews node presented **4,291 outlets** without specific provenance caveat. It now states that this figure was attributed to *global* Internews relationships in reporting circulating February 2025, while the original partner roster and counting method are **UNVERIFIED**. The **707** figure is USAID-wide 2023 non-state outlets, not an Internews subset and not the number of outlets in South Africa. No data-bearing graphic, existing source or URL was removed.

## Release and integrity

- Exactly two scoped prose replacements to `usaidtonewsroom.html`; no original script, SVG, image tag, ID, media or original hyperlink altered. Two new source links added.
- Original Git blob: `51d004fbe96df0ff71d0d9819861d76c35ada842`; proposed reviewed blob: `cbd0274f4fccedd067187f0236cb99e3d13c0cf6`. Exact reviewed file identity is pinned in dossier CI.
- The prior [27 October 2026 seventh-pass reconciliation](SOURCE-CORRECTIONS-09-SEVENTH-PASS-20261027.md) remains intact (Adamela Trust/All Protocol Observed historic publisher distinction).
- Missing **primary USAID original fact sheet**, award-level programmes and recipients, Internews 4,291 roster, original media contracts, person-level remittances, and newsroom instructions remain **UNVERIFIED**.
- Static source review retained viewport, local contrast stylesheet, original navigation and focus/keyboard stylesheet. The page has no explicit `aa-editorial-skip` skip-link marker; inspect in a real browser and add accessibility remediation separately after testing. Full mobile, keyboard, focus, screen-reader, and uncached visitor-facing publication parity remain outstanding.
- Homepage inventory baseline 31 unique entries / 29 nonempty local / 2 external; external `citizenintel/kalahari` and `citizenintel/AAIT` permissions pull:true,push:false on 28 October, both unchanged and not upgraded. Protected Rooivalk remains 1,748,071 bytes, blob `79c93657371ee799d564c07ed5e400bd90ba2690`.
- PR must pass CI on its **exact head SHA** with clean mergeability before merge; Pages and public CDN parity checked separately. **Do not equate this source pass with release certification.**
