# Investigation 23–24: evidence-led corrections, 24 October 2026

Status: reviewed and proposed in PR #68, branch `editorial/wits-constitution-primary-20261024-current-main` (replaces stale PR #67). **NOT a complete article certification**. Publication, CI and Pages deployment must be verified independently. All dates are Gregorian, South African case numbers refer to South African jurisdictions.

## #23 `wits.html` — institutional boundaries and Meta distribution authority

**Original assertions addressed:** all entities operating at Wits were under one Council; the University exercised content-moderation authority over 350 million people; “zero oversight”. These are stronger than the demonstrated ownership/governance chain.

**Corrections on the page:** executive summary now distinguishes co-location and collaboration from common legal governance and editorial direction; governance section describes the university Council's role versus Africa Check's separate trust and the separate board of the wholly owned Wits Health Consortium; the dashboard's “350M+ Users content-moderated” is retained only as “350M? Claimed reach — UNVERIFIED”; the executive section labels the 350m effect explicitly UNVERIFIED; “zero oversight” was replaced by a governance-boundaries heading. A prominent evidence-audit section links primary and contrary records. The underlying claims about donors, personnel and intellectual influence remain intact for future scrutiny, not adopted as established inference.

**Primary and independent sources:**
1. Wits Council [governance and statutory responsibilities](https://www.wits.ac.za/about-wits/governance/council/): university oversight is not automatically ownership/control of independent entities operating on campus.
2. [Africa Check's own legal and location description](https://africacheck.org/who-we-are): Africa Check Trust is a separately constituted nonprofit with a head office in Wits Journalism. This establishes proximity and cooperation, not proof of university control of judgments.
3. [Wits Health Consortium's governance statement](https://www.witshealth.co.za/About-WHC/Governance), read alongside its [ownership statement](https://www.witshealth.co.za/About-WHC/Who-we-are): wholly owned by university, but has a separate board. This is important **contrary evidence**: not every Wits link is merely tenancy.
4. [Meta's 7 January 2025 policy announcement](https://about.fb.com/news/2025/01/meta-more-speech-fewer-mistakes/) explicitly limits the fact-checking transition to the United States at announcement.
5. [PolitiFact's independent account](https://politifact.com/article/2025/jan/07/meta-ending-third-party-fact-checking-partnership/) says enforcement tools were controlled by Meta; it also records the US scope of the 2025 policy change.

**Adversarial challenge / right of reply:** these records do not rule out coordinated influence, undisclosed funding conditions or biased moderation. To prove central direction, obtain board minutes, formal contractual rights, relevant grants, editorial instructions, platform enforcement logs and case-level outcomes. A 350m-user audience estimate is not a count of people whose content was demoted or prevented from circulating. An independent organisation's self-description is relevant contrary evidence but not proof of impeccable independence. **UNVERIFIED:** exact affected audience, contested grant totals/periods, all claimed newsroom-wide effects and individual instruction paths.

## #24 `constitution.html` — procurement chronology and arithmetic

**Primary factual error corrected:** it said procurement rules did not exist in the 1993 Constitution and that section 217 in 1996 created the system. The [1993 interim Constitution, section 187](https://www.justice.gov.za/legislation/constitution/history/INTERIM/INTERIM.PDF) already required independent tender boards and a fair, public and competitive tender process. The [1996 Constitution, section 217](https://www.gov.za/documents/constitution/constitution-republic-south-africa-1996-chapter-13-finance-07-feb-1997) changed this framework, including express allowance for remedial preferences. The Constitutional Court in [*Steenkamp NO v Provincial Tender Board of the Eastern Cape* (2006)](https://www3.saflii.org/za/cases/ZACC/2006/16.html) compares these two sections in an independent judicial source.

**Further corrections:** the blanket statement that every part of the 1993 interim Constitution was repealed is qualified by provisions continued via Schedule 6. The executive summary now treats R250bn as a contested estimate rather than an established judicial finding. The body distinguishes a total annual procurement estimate from preference-related procurement, which is a different denominator; it no longer claims the Zondo Commission specifically found R250bn without pinpoint evidence. The money-trail narrative no longer asserts a direct documented chain from one constitutional provision to Ramaphosa's business valuation. A new prominent box explains the figures and flags lack of year/denominator, plus 75% change score, 14/14 party wins and the 145-laws series, as **UNVERIFIED pending reproducible datasets**. The infographic values remain for documented later audit, but the two headline captions now identify procurement and Zondo attribution as unverified.

**Further primary/independent records:**
- [First certification judgment (6 September 1996)](https://www.saflii.org/za/cases/ZACC/1996/26.html): Court refused certification as initially proposed in particular respects; the Court described the Principles as the interim “solemn pact” and foundational certification requirements.
- [Second certification judgment (4 December 1996)](https://www3.saflii.org/za/cases/ZACC/1996/24.html): the amended text was certified. Legal certification must not be confused with direct popular referendum approval.
- [Government overview of the 1996 Constitution](https://www.gov.za/documents/constitution/constitution-republic-south-africa-04-feb-1997): commenced 4 February 1997.
- [Office of the Chief Justice historical overview](https://www.ocj.gov.za/constitution/amendments.html): confirms parts of the interim Constitution continued by Schedule 6.

**Adversarial challenge / right of reply:** the institutional changes can legitimately be criticised for reducing tender-board independence, language protections or power-sharing, but neither numerical correlation nor constitutional sequence proves a particular individual's intent or that all state capture is caused by section 217. The strongest contrary position is that section 217(1) imposes five express procurement standards, section 217(2) permits preference policies rather than automatically allocating money, and the Constitutional Court did not simply waive the interim Principles. Future evidence should compare enacted implementing laws, Treasury contracts, the Zondo report's cited passages, and alternative explanations for corruption. No denial of the article's normative political argument is inferred from these legal limits.

## Preservation and publication control

| Control | #23 Wits | #24 Constitution |
|---|---|---|
| Original → reviewed blob | `d0eef8697552825f151f27e26883cf266e2e1ebf` → `4b374453baf71351598967cf7b714ab29cd105b4` | `b16a634da4f8ce3f67fda82ed329fa227b6972a3` → `1c0f41362891be1947e5effa6d5dba476d152d81` |
| Script blocks | 3 preserved byte-identically | 4 preserved byte-identically |
| SVG blocks | 39 preserved byte-identically | 1 preserved byte-identically |
| Original image elements | 2 preserved | 2 preserved |
| Original IDs | 11 preserved | 10 preserved |
| Original HTML paragraphs | all 20 preserved | 64 preserved as count; 6 deliberately corrected; original and reviewed whole-file Git blob hashes allowlisted in dossier test |
| Deliberate visible claim edits | executive and governance prose, dashboard, heading, one evidence box | executive and financial prose, two financial captions, one methodology box |
| Original JS/map edges, original hrefs, media payloads | no removals | no removals |
| Source changelog and ledger | updated, full claim audit remains OPEN | updated, full scorecard and finance audit remains OPEN |

Automated checks are not a substitute for live mobile, contrast and keyboard interaction inspection. The exception in `scripts/check-dossiers.mjs` accepts **only** the exact reviewed full `constitution.html` Git blob paired with the reviewed prior main blob and still requires all existing scripts, SVG, images, element IDs and asset counts to match the main baseline. Should the article or main change concurrently, the safe behaviour is to fail and re-review.

The 31-card homepage inventory continues to include **29 local pages plus two external investigations** (external cards 26/27): `citizenintel/kalahari` and `citizenintel/AAIT` were both rechecked with `pull:true, push:false` on 24 October 2026, are read-only, have not been edited and are not certified. The 2.09 MB `MTNrooivalkIRAN.html` document itself was not rewritten. This branch narrowly expands the dossier test's exact-hash allowlist after independently verifying a new cover-only Git blob; CI continues to reject zero-sized and unreviewed material.

## Newly published Rooivalk cover regression and safe CI repair, 24 October 2026

Main now carries `MTNrooivalkIRAN.html` blob `4fd4f4dad223e8977f704be50bd3ed48399793aa`. Git's tree reports **2,093,657 bytes**; GitHub's Contents API returned an empty *content field* for this >1MB file, but the separate Git Blob API recovered its **2,093,489-character** full source. **This is not a zero-byte dossier.** Direct full-blob comparison with previously reviewed `36f032ff4f0028743f3747c548acf5f9e4418e10` (2,093,487 characters) revealed exactly one cover image inline style change: `object-fit:contain;background:#d5d9d8` → `object-fit:cover;object-position:center`. All 14 base64 embedded images and 14 hrefs, two original script blocks, three SVG blocks and 18 IDs were identical. The updated `scripts/check-dossiers.mjs` accepts this **specific full Git blob hash**, alongside earlier reviewed cover variants, while retaining its >2.09MB guard. No original article data, map, diagram or media payload changed and no Rooivalk source file was written. Full Rooivalk editorial claim review remains BLOCKED / OPEN.
