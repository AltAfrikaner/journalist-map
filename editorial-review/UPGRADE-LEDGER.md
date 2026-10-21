# Editorial upgrade completion ledger

Checked: 2026-10-21. Repository: AltAfrikaner/journalist-map, current main before branch. This ledger tracks **evidence-led editorial upgrades**, not the earlier premium visual design. **PR open is not deployed.** No articles have been marked complete solely because a note was proposed.

| # | Local investigation | Status | Next requirement |
|---:|---|---|---|
| 1 | `osf.html` | pending | Legacy technical PR #3; no completed evidence upgrade confirmed |
| 2 | `sa_journalists.html` | PR open | #23 claim corrections and legacy #4; await tests |
| 3 | `africacheck.html` | PR open | #28 evidence methodology section |
| 4 | `ifcn.html` | PR open | #26 Meta policy context |
| 5 | `sixstage.html` | PR open | #26 Meta policy context |
| 6 | `metasuppression.html` | PR open | #26 Meta policy context |
| 7 | `iol.html` | pending | Ownership and editorial directions require source-level checks |
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
| 19 | `44afrikaners.html` | pending | Signature roster reconciliation; legacy #4 |
| 20 | `mbalula_network.html` | pending | Cross-page claims reconciliation |
| 21 | `splc.html` | pending | Designation criteria and outcomes |
| 22 | `adl.html` | pending | Evidence for asserted donor effects |
| 23 | `wits.html` | pending | Institution versus affiliates |
| 24 | `constitution.html` | PR open | #25 constitutional process note; await tests |
| 25 | `fwdeklerk_foundation_investigation.html` | pending | Dated policy and leadership comparison |
| 26 | `cws.html` | PR open | #27 Pacito litigation clarification; await tests |
| 27 | `omidyar.html` | pending | Grant recipients, timelines and comparisons |
| 28 | `real411.html` | pending | Complaint to platform outcome pathway |
| 29 | `osf-funded-orgs.html` | pending | Funding percentages and dates |

External investigations in the homepage's 31-entry list: two external destinations are out of scope and are not counted among the 29 local files.

## Completion definition

For each article, record: recovered prior shared evidence consulted; primary supporting and opposing source; red-team treatment of material allegations; methodology/qualification fixes where needed; original script, text, SVG, map, IDs and URL preservation checks (unless a justified correction is logged); tested links and interaction; passing exact-head CI and no conflicts; merged PR and successful Pages deployment, **or** a clearly documented blocked/not-justified disposition. Do not count mere CSS presence or an open PR as completed. Preserve minority and critical viewpoints when evidence supports them.

## Concurrent work and safeguards

Active editorial PRs at initial check: [#23](https://github.com/AltAfrikaner/journalist-map/pull/23), [#24](https://github.com/AltAfrikaner/journalist-map/pull/24) (draft), [#25](https://github.com/AltAfrikaner/journalist-map/pull/25), [#26](https://github.com/AltAfrikaner/journalist-map/pull/26), [#27](https://github.com/AltAfrikaner/journalist-map/pull/27), [#28](https://github.com/AltAfrikaner/journalist-map/pull/28). Legacy technical PRs #3/#4 remain open. Avoid duplicate writes and test competing PRs independently. At every scheduled run, refresh the status from main and the exact PR head before making a new decision.
