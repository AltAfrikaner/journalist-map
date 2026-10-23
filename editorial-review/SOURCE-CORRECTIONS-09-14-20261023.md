# Source and correction record — investigations 09 and 14
**Research date:** 23 October 2026. **Scope:** `usaidtonewsroom.html` (homepage card 9) and `ancliberation.html` (card 14). **Working base:** current main commit `839007d086c25bf8e27a793bee5032719f82c677`, after the sitewide shell PR #54 merged. These are substantive, source-specific changes; neither page has received a full claim-by-claim release audit.

## 09 — USAID-to-Newsroom: actual newspaper ownership dates

**Before (verbatim page-level claim):** “OSF Acquires M&G via MDIF”; “OSF/Soros majority acquisition of Mail & Guardian through MDIF”; newsroom summary “OSF/MDIF majority shareholder.”

**Verified fact:** The Media Development Investment Fund acquired a majority stake in the Mail & Guardian in December **2017**. MDIF publicly announced on **30 October 2024** that it had sold the majority to Hoosain Karjieker and Thembisa Fakude. The newspaper's independently maintained ownership history agrees. Its December 2017 transaction was independently reported contemporaneously.

**Primary/independent sources:** [MDIF exit notice, 30 Oct 2024](https://www.mdif.org/news/mdif-exits-south-africas-mail-guardian/); [Mail & Guardian ownership history](https://mg.co.za/about-us/); [Media Update's 14 Dec 2017 report](https://www.mediaupdate.co.za/media/143182/mdif-acquires-majority-stake-in-mail--guardian).

**Correction:** Diagram ownership node now identifies **MDIF majority 2017–October 2024**, rather than an unqualified OSF acquisition. The convergence/Newsroom node now dates MDIF's holding. A prominent on-page source note gives the sale recipients and links both direct parties' records. **No evidence retrieved that OSF or George Soros personally controlled the M&G majority equity stake during or after that transaction.** A claimed continuing or direct OSF controlling stake is therefore **UNVERIFIED**, not assumed true or absolutely disproved. Historical philanthropy to MDIF and potential indirect influence should be investigated separately from legal share ownership.

**Adversarial check:** The fund's own press release and its investee's history are interested parties' statements; agreement alone does not prove editorial independence. On the other hand, a donor-investor association alone does not prove direction of a particular article. We retain the legitimate investigative funding question, but require beneficial-ownership records and editorial communications before ascribing corporate control or dictated content. The chart's other claims about award amounts, editorial decisions, Adamela Trust and individual affiliations are **not newly certified** by this fix; acquire signed award records and right-of-reply from each affected institution.

## 14 — The Psychological Effects of Liberation: Q1 2025 numerators and historical method

**Before (four rendered locations including an SVG text element):** Q1 2025 youth unemployment for ages 15–24 repeatedly listed as **62.2%**; ages 15–34 given as **46.1%**. The page also called a 1986–2026 cross-period comparison “identical” in method and displayed “1.7M Stunted children (2025)” as if a 2025 observation.

**Verified fact:** Statistics South Africa's official QLFS Q1 2025 presentation (released **13 May 2025**, pages 22–24) gives **62.4%**, ages 15–24, and **46.1%**, ages 15–34. Both figures measure official unemployment within distinct age-group labour-force denominators; they are not percentages of all youths. Independently, Ecofin Agency reported the same figures on 15 May 2025. [Stats SA official PDF](https://www.statssa.gov.za/publications/P0211/Presentation%2520QLFS%2520Q1%25202025.pdf); [Ecofin Agency, 15 May 2025](https://www.ecofinagency.com/news/1505-46818-south-africa-s-youth-unemployment-hits-62-4-in-q12025).

**Numerical correction:** Exactly **four** `62.2%` text instances → `62.4%`, comprising dashboard explanatory text, **one inline SVG label**, timeline, and evidence card. The corrected infographic text remains in its original SVG geometry, with no path, icon, node, coordinate or script changes. The unchanged 46.1% is verified for ages 15–34. This is a disclosed accuracy correction to displayed SVG copy; not a redesign.

**UNICEF provenance:** The original 1.7-million figure was presented in UNICEF's **2020 nutrition brief as a trajectory projection for 2025**, also explained in [UNICEF's 30 March 2021 statement](https://www.unicef.org/southafrica/press-releases/slow-violence-malnutrition-south-africa) and the [underlying 2020 brief](https://www.unicef.org/southafrica/sites/unicef.org.southafrica/files/2020-07/ZAF-Nutrition-brief-2020.pdf). The card now explicitly labels this figure as a 2025 **projection**. A subsequently observed 2025 population count has **not** been independently established from these two older documents; treating the forecast as a census is **UNVERIFIED**. The two UNICEF records have common institutional provenance, so are not two independent field studies.

**Method correction:** Replaced the categorical “method is identical” assertion with an explicit limitation: Dommisse's 1986 analysis and modern administrative and household survey indicators have different protocols, denominators, period coverage and causal interpretation. Their topics are comparable grounds for political accountability; their statistical methods are not interchangeable. This preserves criticism of ANC governance but guards against an unsupportable strict historical equivalence.

**Adversarial check:** Some indicators rose, some definitions changed; inherited infrastructure, economic shifts and population changes are plausible competing explanations. A high unemployment figure or stunting projection alone cannot establish an official intent to damage citizens psychologically. The separate claim that fact-checkers suppressed inconvenient performance data needs individual moderation notices and controls. **UNVERIFIED** pending a reproducible quantitative study: historical murder-rate comparability, Zondo aggregate totals, water backlog denominators, suicide estimates, 2024–2026 deaths, and causal attributions. Government and international datasets can expose policy failure, but must not be misrepresented as proof of psychological intent.

## Preservation and release protocol

- Fetched and compared both complete branch HTML files with their post-PR-54 `main` originals.
- **All prior IDs, script blocks, embedded images and image attributes preserved verbatim.** All original `href` references preserved; only cited source links added.
- **09:** SVG markup unchanged; only three specific existing visible claims corrected, plus one clearly labelled source note. No graph datasets or link destinations changed.
- **14:** All SVG blocks identical after normalising precisely the intended `62.2%`→`62.4%` copy correction; graphic geometry, IDs, paths and JS unchanged. Other text edits limited to projection label and the “identical methods” sentence, plus a sourced note.
- Both pages retained navigation and substantial non-empty text. Existing sitewide shell assets untouched. Large `MTNrooivalkIRAN.html` was **not written**; its expected restored blob `cf9a1477877ecd556eec468be5372e8aeea63e3c` must remain guarded.
- CI, an exact-head mergeability check and post-merge Pages verification are mandatory before reporting a deployed correction. Static checks are not equivalent to a browser-based responsive screen-reader audit.

## Inventory / limitations

The main homepage has **31 `a.card` anchors: 29 local and two external**, at absolute card positions **26** (Kalahari) and **27** (AAIT). Rechecked permissions on 23 October: `citizenintel/kalahari` and `citizenintel/AAIT` both have `pull:true`, `push:false`. The external pages are therefore read-only and outside this PR; neither is marked edited. Editorial ledger tracks all 29 local source-audit statuses, none of which is newly certified complete by these limited corrections. Remaining local investigations and the full audit of 09/14 remain open.
