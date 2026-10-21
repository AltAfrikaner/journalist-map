# Editorial upgrade completion ledger

Status reviewed 2026-10-21 after PR #32. Repository: AltAfrikaner/journalist-map. This ledger tracks **evidence-led editorial upgrades**, not the earlier premium visual design. **A merged contextual note is not a completed evidence audit.** No article is marked substantively complete solely because a correction, design upgrade, or source-link note was merged.

| # | Local investigation | Status | Next requirement |
|---:|---|---|---|
| 1 | `osf.html` | context merged | #31 corrected Constitutionalism Fund launch/total figures and LHR grantee ranking; broader OSF network causal assertions and legacy technical PR #3 still need independent verification |
| 2 | `sa_journalists.html` | correction merged | #23 corrected unsupported payroll and language-census claims; selected nodes and individual funding claims still need source-by-source verification |
| 3 | `africacheck.html` | context merged | #28 methodology/financial context; audit individual examples and funding periods |
| 4 | `ifcn.html` | context merged | #26 policy chronology; check period-specific South African application |
| 5 | `sixstage.html` | context merged | #21 and #26; verify individual examples and source-to-platform causal links |
| 6 | `metasuppression.html` | context merged | #21 and #26; claim-level moderation outcomes remain to be independently documented |
| 7 | `iol.html` | context merged | #32 distinguished IOL digital and Independent Newspapers, documented 2016–2024 Press Council changes and disputed SACTWU rectification; examine other editorial claims individually |
| 8 | `usaid.html` | pending | Historical versus modern causal chain needs red-team |
| 9 | `usaidtonewsroom.html` | pending | Grant-by-grant sourcing |
| 10 | `mtn.html` | pending | Court allegations, findings and denials |
| 11 | `prototypenation.html` | pending | Causal transfer documentation |
| 12 | `motsepe.html` | pending | Institutional and individual associations |
| 13 | `communists.html` | pending | Historical chain and analogous policies |
| 14 | `ancliberation.html` | pending | Quantitative method and psychology |
| 15 | `wef.html` | pending | Authority versus access; chronology |
| 16 | `un.html` | pending | Legal standard comparison |
| 17 | `mbalula.html` | pending | Allegations and dispositions |
| 18 | `MTNrooivalkIRAN.html` | retrieval blocked | Oversized GitHub connector response; inspect separately before disposition |
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
| 29 | `osf-funded-orgs.html` | pending | Funding percentages and dates |

External investigations in the homepage's 31-entry list: two external destinations are out of scope and are not counted among the 29 local files.

## Completion definition

For each article, record: recovered prior shared evidence consulted; primary supporting and opposing source; red-team treatment of material allegations; methodology/qualification fixes where needed; original script, text, SVG, map, IDs and URL preservation checks (unless a justified correction is logged); tested links and interaction; passing exact-head CI and no conflicts; merged PR and successful Pages deployment, **or** a clearly documented blocked/not-justified disposition. Do not count mere CSS presence or an open PR as completed. Preserve minority and critical viewpoints when evidence supports them.

## Concurrent work and safeguards

PRs #23, #25–#28 and #30–#32 have merged after checks; #24 remains a review-only draft. Legacy technical PRs #3/#4 remain open. Avoid duplicate writes and test competing PRs independently. Refresh exact PR status and main deployment before counting an investigation as complete.
