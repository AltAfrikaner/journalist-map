# Claim-level source and correction record — investigations 03–04
**Date:** 24 October 2026  
**Repository:** `AltAfrikaner/journalist-map`  
**Base:** current `main` at `4a5beb6c46c25905059c59a27e492cd7c1585f3c`  
**Branch:** `editorial/claim-reconciliation-03-04-20261024b`  
**Disposition:** **targeted corrections only; neither article is claim-level release-certified.**

## Selection and conflict exclusions
The 31 homepage cards contain 29 local investigations and two external ones. Local #01 `osf.html` and #02 `sa_journalists.html` are **deferred, NOT COMPLETE**, because open legacy technical PRs #3 and #4 respectively modify those files. Current draft PR #24 changes only an audit document. This batch took the next two incomplete local pages without open-PR overlap: #03 `africacheck.html`, #04 `ifcn.html`. No external repository was written; `citizenintel/kalahari` and `citizenintel/AAIT` both report `pull:true, push:false`.

## #03 — `africacheck.html`: findings and corrections
**Baseline Git blob:** `be0c8363bcf2b6803807ef807c30997fd0c9e116`. **Reviewed result:** `db523415b8297a7316369ea94d72f57ae840bb39`.

1. **Date/source integrity.** The former text and source [13] labelled the Chinese Embassy statement **14 November 2018**, but pointed to a **2024** diplomatic website item. The actual contemporaneous statement by the embassy spokesperson on the Chinese consulate's archival site is timestamped **16 November 2018, 15:00**. Corrected the narrative, citation and link. It postdates Africa Check's **13 November 2018** article, so the diplomatic statement cannot be listed as evidence Africa Check relied upon.
2. **Numerical and jurisdiction methodology.** The original 2022 narrative blurred the September `110 Overseas` report and December `Patrol and Persuade` follow-up. The latter reported **102 alleged overseas police-service locations in 53 countries**. Those globally aggregated allegations are **not 102 findings about the 13 publicly acknowledged South African community-police liaison centres**. The corrected text links the December primary report.
3. **Independent counterevidence / right-of-reply.** Added an independent Africa-China Reporting Project assessment distinguishing South African community-police cooperation centres from reportedly clandestine stations overseas, while preserving scrutiny of governmental and institutional ties. Africa Check's own interview record, SAPS explanation and the Chinese diplomat's denial are attributed to their actual speakers rather than adopted as dispositive findings. Centre-specific illegal police activity remains **UNVERIFIED**, not excluded by assumption.
4. **No false exoneration.** The 2023 Manhattan US charges are serious allegations about New York, not a finding about Port Elizabeth. The dossier's existing distinction was preserved.

## #04 — `ifcn.html`: findings and corrections
**Baseline Git blob:** `2656f48ba810a5fe3901a8afd60d5624b639848f`. **Reviewed result:** `d511b4c07fcf9da4be7f43480c3fa4b2dc0f23b9`.

1. **False exclusive certification claim.** The introduction and standalone `1 Certifying Body` statistic portrayed IFCN as Meta's only global certification route. Meta's UK election statement and the EFCSN's **14 May 2024** notice independently establish Meta's acceptance of **IFCN OR EFCSN** accreditation for Europe-based fact-checkers. Updated prose and **text-only statistic** to `2+ Standards Routes`; no graphic data or SVG edited. The article's critical viewpoint about private industry gatekeeping remains.
2. **Dated jurisdictions and denominator.** Poynter's **12 June 2025** report supplies **182 verified organisations / 57 countries** as a *2025 historical snapshot*, not an October 2026 live count. Meta's **7 April 2025 US-only** third-party-label sunset cannot be universalised to South Africa. A blanket `80%+` reach reduction and an inevitable funding-feedback loop are **UNVERIFIED** absent a platform-specific dataset and method. Meta, rather than IFCN, ultimately imposes platform distribution decisions.
3. **Complaints versions reconciled by an adversarial second look.** The current canonical IFCN `/complaints` page instructs readers to **email** documented complaints. A mirrored `mail.` subdomain displayed a form in earlier indexed material. Neither visible version proves the presence/absence of internal ticket tracking or a response SLA. A June 2025 Poynter **applications/certification annual report** exists; it does **not by itself answer** whether annual *complaint-by-complaint* reporting was complete. Corrected the initial mistaken proposed claim that the active official form disproved the email-based process. The final article links the **canonical current policy** and marks the complaints-series completeness **UNVERIFIED**.
4. **Chronology and allegation versus finding.** Africa Check's **13 November 2018** report relied on SAPS, the centre's official and an independent researcher, **not** the Chinese embassy statement dated 16 November. The September and December 2022 Safeguard Defenders publications are separately identified; a 2023 federal complaint about Manhattan was a **charged allegation at filing**, not independent proof that 2018 Port Elizabeth activities were illegal.
5. **Claims of platform sanctions challenged.** The blanket allegation that all relevant Facebook posts were suppressed for four years was replaced with the actual evidence threshold: original post URLs, dated fact-check ratings, Meta notices, reach and appeal records. Likewise, universal claim-selection bias, named advisory-board decisions, 2026 funding shares and the Irish case's alleged single-gatekeeper pathway remain **UNVERIFIED**. The article retains an explicit critical call for better transparency.
6. **Source and contrary-evidence box.** Linked official Meta criteria, dated Meta US policy, original Africa Check publication, canonical IFCN complaints policy, independent South Africa analysis and Poynter's verified assessment activity. No outreach or private response was invented.

## Key primary and independent records
- Africa Check, **13 Nov 2018**: https://africacheck.org/fact-checks/spotchecks/no-chinese-people-arent-opening-their-own-police-stations-south-africa
- Chinese consular archive, **16 Nov 2018** (interested-party primary statement): https://capetown.china-consulate.gov.cn/eng/xwdt/201811/t20181116_6968483.htm
- Safeguard Defenders, initial **12 Sep 2022**: https://safeguarddefenders.com/en/publications/110-overseas
- Safeguard Defenders, expanded **4 Dec 2022**: https://safeguarddefenders.com/en/publications/patrol-and-persuade
- Africa-China Reporting Project, independent centre distinction: https://africachinareporting.com/not-a-police-station-the-chinese-community-and-police-cooperation-centre-in-south-africa/
- AFP, independent interviews, **23 Nov 2018**: https://factcheck.afp.com/no-chinese-are-not-opening-police-stations-south-africa
- US Department of Justice, charging statement, **17 Apr 2023**: https://www.justice.gov/usao-edny/pr/two-individuals-arrested-operating-undeclared-police-station-chinese-government
- EFCSN accreditation announcement, **14 May 2024**: https://efcsn.com/association/efcsn-meta-third-party-fact-checking-programme/
- Meta, UK election procedures, **2024**: https://about.fb.com/news/2024/06/how-meta-is-preparing-for-the-2024-uk-general-election/
- Meta, US Community Notes rollout, **7 Apr 2025 update**: https://about.fb.com/news/2025/03/testing-begins-community-notes-facebook-instagram-threads/
- Poynter, IFCN certification figures and report, **12 Jun 2025**: https://www.poynter.org/ifcn/2025/as-threats-grow-fact-checkers-double-down-on-standards-ifcn-report-finds/
- IFCN canonical complaints policy (current): https://ifcncodeofprinciples.poynter.org/complaints

## Red-team challenge before merging
- **Strongest alternative to the editorial thesis:** publicly disclosed grants do not show a funder's instruction to an IFCN assessor or Meta's moderation team; EFCSN is a documented alternative standards route; the South African centres' overt SAPS liaison role is inconsistent with inferring illegal activity from the New York prosecution alone.
- **Strongest residual critical case:** grants, accreditation incentives, rating selection and platform distribution deserve transparent scrutiny, especially where individual appeal outcomes cannot be independently reconstructed. Do not erase this scrutiny merely because the most sweeping claims fail.
- **Methodological separations:** primary records vs independent analysis; global counts vs South Africa-specific centre identities; complaint emails vs internal case management; applications report vs complaints report; allegations/charges vs adjudicated findings; platform policy country and date vs actual individual enforcement.

## Preservation and release gate
- Programmatic before/after extraction verified **identical original scripts, full SVG blocks, image tags and element IDs** in both pages; #04's visible numeric HTML statistic was explicitly documented. Existing map nodes/edges, JS, media, article filenames and canonical URLs were not changed. #03's erroneous 2024 source citation URL was **deliberately corrected and logged**.
- Both source files remained nonempty and retained article navigation and core interactive anchors. Remaining gate: GitHub PR exact-head required CI, clean mergeability, post-merge 31-card/29-local/2-external count and Pages run must be independently verified before publication is claimed.
- **Protected exception:** `MTNrooivalkIRAN.html` remains untouched, baseline main blob `12a93cb7b98c8318ae530c93bb8b3d76bb740f29`, **2,094,214 bytes**. Substantive full-source review **BLOCKED/OPEN**.
- **Unresolved for #03:** year-specific financial reports, individual fact-check selections and the farm-rate numerator/denominator, donor constraints and Meta enforcement traces.
- **Unresolved for #04:** every illustrated flow-chart edge, board voting and grant allocations, actual per-item Meta demotion dataset, Irish case source chain, complaints outcomes and any conflicting pre-existing 3D/SVG shorthand. **Not fully certified.**

**Neither page is counted as complete until all material claims pass the per-claim editorial release checklist.**