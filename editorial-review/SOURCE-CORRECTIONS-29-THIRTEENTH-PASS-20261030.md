# Investigation #29 — thirteenth evidence pass (30 October 2026)

**File:** `osf-funded-orgs.html` · **Homepage position:** #31 of 31 cards / #29 of 29 local investigation files · **Status:** OPEN; not editorially release-certified.

## Evidence question: who actually received the duplicated 2016 child-law grant amounts?

The published atlas formerly assigned the **same 2016 Constitutionalism Fund R700,000 and Open Society Foundation R750,000 amounts to two distinct institutions**: row 44, University of Cape Town Children's Institute, and row 69, University of Pretoria Centre for Child Law. Both rows showed inherited verification labels despite no previously reconciled recipient accounts.

**Primary record A — University of Pretoria Centre for Child Law (CCL), 2016 annual report, printed p. 25 (PDF page 29/32).** Its table headed *Total income for the year 2016 from the donors* explicitly lists **R700,000 received from the Constitutionalism Fund** and **R750,000 received from the Open Society Foundation**. It identifies the reporting organisation as the Centre for Child Law, Faculty of Law, University of Pretoria; not UCT's Children’s Institute. [CCL 2016 original report](https://www.centreforchildlaw.co.za/dev/wp-content/uploads/2024/06/CCL-Annua-Report-2016.pdf).

**Primary record B — University of Cape Town Children's Institute, 2016 annual report, printed p. 29 (PDF page 31/39).** Its 31 December 2016 income statement reports **R4,034,804 grant income** and names six grant-source lines (Wits Centre of Excellence, DG Murray Trust, Mary Oppenheimer & Daughters, NRF/Thuthuka, ELMA Foundation, UNICEF SA). It does **not** list either disputed named 2016 donor. This is affirmative evidence about the Institute's **published grant-income schedule**, not proof that no intermediary, another UCT unit or another financial period ever benefited from either funder. [UCT Institute 2016 original report](https://ci.uct.ac.za/media/101466).

**Primary record C — UP CCL 2019 annual report, printed p. 41 (PDF page 41/44).** The separate 2019 donor-income table reports **R1,500,000 received from the Constitutionalism Fund** and **R850,000 received from the Open Society Foundation**. That is **not** a repeat of the 2016 receipts or evidence of a UCT payment. [CCL 2019 original report](https://centreforchildlaw.co.za/wordpress21/wp-content/uploads/2020/07/2020.07.21-WEB_CFCL-Annual-2019.pdf).

**Independent organisational context:** The [Devex Centre for Child Law profile](https://www.devex.com/organizations/centre-for-child-law-115581) identifies the historic Pretoria centre and names CF and OSF SA among its 2018 supporters. It corroborates the institutional distinction but does *not* independently validate the 2016 amounts. The two independently published **recipient-side primary accounts** resolve the material attribution dispute without inflating the funding tally.

## Exact editorial changes

1. Replaced the stale 26 October ambiguity summary with dated 30 October primary-record findings and direct PDF source links.
2. Rewrote the child-institute identity comparison so the verified **UP CCL 2016 receipts** and **2019 receipts** are separated from the **UCT 2016 reporting gap**. Refrained from alleging an intentionally falsified historical record.
3. Corrected the visibly rendered funding-summary text: CCL confirmed for both separately dated years; UCT 2016 duplicated pair **UNVERIFIED**.
4. Corrected **only two inline source-data tuples**: OSF row **44** becomes **UNVERIFIED** for the duplicated 2016 amounts; row **69** states the two original annual-report donor-income series and retains its verified label as to those historical figures. All **other 71 OSF rows, all 35 Omidyar rows, row counts, existing labels and source-data structures remain unchanged.**
5. Extended `scripts/check-dossiers.mjs` with a **strict pair-specific entire-file Git blob guard**. It reverts precisely the two reviewed inline tuples to compare scripts with the last `main` version, rejects other JS/SVG/image/ID changes, and runs the 73-row/35-row renderer assertions. The historical Africa Check / Livity checks remain active on the already published baseline.

### Verifiability limits / red-team position

- **Directly documented:** two separately dated CCL donor-income statements, UCT's own 2016 grant-income schedule, the institutional distinction.
- **Inference constrained by records:** the duplicated legacy 2016 pair was likely misattributed to UCT; documentary evidence proves where the pair is explicitly recorded, not how the legacy compiler copied it.
- **UNVERIFIED:** the precise 2016 UCT CF/OSF award claim, any concealed UCT pass-through, donor contract restrictions, continuous 2017–2026 grant streams, and any claim that those grants directed litigation, scholarship, media content or political decisions.
- **No automatic grand-total:** 2016 and 2019 income are not treated as one fiscal-year total; row 44 and row 69 must not be counted as two independently confirmed copies of the identical 2016 amounts.
- **Further review:** original agreements/bank or audited account schedules, every remaining 106 historical entry classifications, downloadable PDF's outdated claims, desktop/mobile and keyboard/screen-reader tests, and public-CDN parity.

### Scope and integrity

Starting `main` SHA `a05cde585e5b647070477f64bbc6f7f6e460e974`; original atlas Git blob `fe11a0902c453a16748f31d7896b06297d57bba4`; reviewed new atlas Git blob `9b080e46ffaf6e70490ae2e6b994a860493c28e0`. No unrelated CSS, SVG, images, video, element IDs, page destinations, data filtering or display scripts were changed. All original hrefs retain order; five first-party PDF citations were added in visible prose. The historical Rooivalk dossier is **not edited** and remains guarded at blob `79c93657371ee799d564c07ed5e400bd90ba2690`.

Inventory remains **31 homepage investigation cards / 29 local nonempty articles / 2 external**. Access freshly checked: `citizenintel/kalahari` and `citizenintel/AAIT` each `pull:true,push:false`; both are **external READ-ONLY**, unchanged, unreviewed for release. Kalahari original military and incident records, AAIT incident provenance, statistical denominators/classification methods, plus both projects' media, accessibility and hosting checks remain outstanding.

**Release rule:** exact-head editorial CI and contrast tests must pass, GitHub must report the PR clean, then merge and confirm Pages separately. GitHub Pages success cannot independently establish public-CDN content parity; [publication issue #234](https://github.com/AltAfrikaner/journalist-map/issues/234) remains open.
