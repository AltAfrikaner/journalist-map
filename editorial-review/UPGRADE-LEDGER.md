# Editorial upgrade completion ledger

Status reconciled 23 October 2026 against main after the sitewide editorial-shell merge, the published page text, and the 31-card homepage inventory. Release criteria still apply: a targeted correction or passing visual audit is not full evidence certification. Repository: AltAfrikaner/journalist-map. This ledger tracks **evidence-led editorial upgrades**, not the earlier premium visual design. **A merged contextual note is not a completed evidence audit.** No article is marked substantively complete solely because a correction, design upgrade, or source-link note was merged.

| # | Local investigation | Status | Next requirement |
|---:|---|---|---|
| 1 | `osf.html` | context merged | #31 corrected Constitutionalism Fund launch/total figures and LHR grantee ranking; broader OSF network causal assertions and legacy technical PR #3 still need independent verification |
| 2 | `sa_journalists.html` | correction merged | #23 corrected unsupported payroll and language-census claims; selected nodes and individual funding claims still need source-by-source verification |
| 3 | `africacheck.html` | context merged | #28 methodology/financial context; audit individual examples and funding periods |
| 4 | `ifcn.html` | context merged | #26 policy chronology; check period-specific South African application |
| 5 | `sixstage.html` | context merged | #21 and #26; verify individual examples and source-to-platform causal links |
| 6 | `metasuppression.html` | context merged | #21 and #26; claim-level moderation outcomes remain to be independently documented |
| 7 | `iol.html` | context merged | #32 distinguished IOL digital and Independent Newspapers, documented 2016–2024 Press Council changes and disputed SACTWU rectification; examine other editorial claims individually |
| 8 | `usaid.html` | source correction proposed | Dated 2025 suspension and 2026 OIG records; NED institutional distinction; correct USAID primer definition and Meta policy. Check individual awards and newsroom influence before full evidence sign-off |
| 9 | `usaidtonewsroom.html` | dated ownership correction (23 Oct 2026); full audit open | MDIF/M&G majority ownership reconciled to 2017–Oct 2024; unsupported OSF/Soros majority/control allegation flagged UNVERIFIED; verify individual USAID/NED grants, intermediaries and editorial instruction claims |
| 10 | `mtn.html` | source correction proposed | #37 September 2026 procedural rulings and MTN response; telecom-to-missile hypothesis marked UNVERIFIED. Review original historic claims and named relationships individually |
| 11 | `prototypenation.html` | source correction proposed | #38 chronology/UN/EEOC/ICTJ cross-check; distinguish policy borrowing from analogy and unverified central direction; individual comparisons and figures still need case-level audit |
| 12 | `motsepe.html` | context merged | #39 ARM executive-to-non-executive transition, WEF trustee responsibilities and Breakthrough Energy investor relationship corrected; remaining political, financial and legal allegations require source-level verification |
| 13 | `communists.html` | historical context present; full audit open | Published SACP policy-source note distinguishes documented party strategy from unverified cross-country transfer; review timeline, Crenshaw 1989 chronology and individual international causal claims |
| 14 | `ancliberation.html` | statistical correction (23 Oct 2026); full audit open | Q1 2025 ages 15–24 unemployment corrected 62.2→62.4% in prose and labelled SVG; UNICEF 1.7M identified as 2020 projection for 2025, not a 2025 survey; reconcile remaining crime, water, mortality and causation metrics |
| 15 | `wef.html` | pending | Authority versus access; chronology |
| 16 | `un.html` | pending | Legal standard comparison |
| 17 | `mbalula.html` | pending | Allegations and dispositions |
| 18 | `MTNrooivalkIRAN.html` | large-source audit blocked; content guarded | Following PR #50 restoration, intact recorded blob cf9a1477877ecd556eec468be5372e8aeea63e3c rechecked on main (expected 2,093,468 bytes). Limited line fetch returns no text; no write permitted without an independent full-blob preservation check |
| 19 | `44afrikaners.html` | correction merged | #21 corrected five-university label and flagged 45 versus 43 sector tally; full roster reconciliation still outstanding |
| 20 | `mbalula_network.html` | pending | Cross-page claims reconciliation |
| 21 | `splc.html` | context merged | #22 superseding-indictment chronology; independently examine South Africa-specific relationship evidence |
| 22 | `adl.html` | pending | Evidence for asserted donor effects |
| 23 | `wits.html` | pending | Institution versus affiliates |
| 24 | `constitution.html` | context merged | #25 official constitutional-procedure note; review contested interpretations against primary records |
| 25 | `fwdeklerk_foundation_investigation.html` | pending | Dated policy and leadership comparison |
| 26 | `cws.html` | context merged | #27 litigation clarification; retain distinction between allegation and finding |
| 27 | `omidyar.html` | context merged | #30 legal-entity provenance; verify recipient totals, grant dates, Reset post-2024 relationships |
| 28 | `real411.html` | context merged | #22 dated IEC agreement update; individual platform-action evidence remains unverified |
| 29 | `osf-funded-orgs.html` | source correction proposed | Distinguishes donor grants, IFCN status, Meta policy, individual payroll and unsupported zero-language claims; complete grant-level validation and percentages/dates remain outstanding |

**31 homepage cards confirmed on 23 October 2026:** 29 local investigations plus 2 external cards, in that order. The table above tracks all 29 local articles in their relative homepage order; the external entries occur between local #25 and local #26:

| Homepage card | External investigation | Access (23 Oct) | Editorial disposition |
|---:|---|---|---|
| 26 | [Operation Silver Diamond / Kalahari](https://citizenintel.github.io/kalahari/) (`citizenintel/kalahari`) | `pull:true`, `push:false` | External read-only; not counted as upgraded or completed; source site accessible for reading; no authorised write |
| 27 | [AAIT incident tracker](https://citizenintel.github.io/AAIT/) (`citizenintel/AAIT`) | `pull:true`, `push:false` | External read-only; not counted as upgraded or completed; no authorised write |

**Status interpretation:** `context merged`, `correction merged`, `source correction proposed`, `targeted correction`, and `pending` do not mean final editorial release. Full source-by-source certification remains outstanding for the local investigations unless individually documented otherwise.

## Completion definition

For each article, record: recovered prior shared evidence consulted; primary supporting and opposing source; red-team treatment of material allegations; methodology/qualification fixes where needed; original script, text, SVG, map, IDs and URL preservation checks (unless a justified correction is logged); tested links and interaction; passing exact-head CI and no conflicts; merged PR and successful Pages deployment, **or** a clearly documented blocked/not-justified disposition. Do not count mere CSS presence or an open PR as completed. Preserve minority and critical viewpoints when evidence supports them.

## Concurrent work and safeguards

PRs #23, #25–#28 and #30–#32 have merged after checks; #24 remains a review-only draft. Legacy technical PRs #3/#4 remain open. Avoid duplicate writes and test competing PRs independently. Refresh exact PR status and main deployment before counting an investigation as complete.

## 23 October 2026 source/correction entry

Two local pages received primary-evidence corrections under `editorial/source-verified-newsroom-liberation-20261023`. Details, before/after claims, counterevidence and preservation checks: [SOURCE-CORRECTIONS-09-14-20261023.md](SOURCE-CORRECTIONS-09-14-20261023.md). The resulting PR, its exact-head CI and Pages deployment must be verified before a merged/deployed status is claimed. Legacy draft PRs #3, #4 and #24 remain excluded. The two external repositories remain read-only.
