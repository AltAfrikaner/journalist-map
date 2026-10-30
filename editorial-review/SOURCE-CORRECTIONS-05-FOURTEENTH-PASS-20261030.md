# Investigation #05 — Fourteenth evidence pass (30 October 2026)

**File:** `sixstage.html`. **Starting main:** `d3b72e94a47edd84e332a4ffc1e91f3cd2da6fed`. **Before blob:** `c2f5a13f0122dcc1f843b489ed87f33637d3c2ad`. **Reviewed revised blob:** `88685fce9953869de489c8b136eb79213fd7a063`.

## Original record and independent check
- **Primary policy record:** [Meta Oversight Board, *Assessing Meta's Plans to Expand Community Notes*, 26 March 2026](https://www.oversightboard.com/decision/pao-007g5zuv/). This states that cross-viewpoint agreement can disadvantage dominant/minority political, ethnic and **linguistic** groups, with country-specific risks in elections, crises and conflict. It treats these as possible harms and calls for evidence and mitigation; it does **not** prove an Afrikaner incident.
- **Independent reporting:** [Nieman Journalism Lab, 26 March 2026](https://www.niemanlab.org/2026/03/metas-oversight-board-warns-that-community-notes-arent-a-proper-substitute-for-fact-checking-globally/) separately assesses the Board's recommendations, reporting note-publication delays and the differing reach consequences of Notes and fact-check labels.
- **Primary subsequent status:** [Oversight Board, 10 September 2026 Latin America pilot statement](https://www.oversightboard.com/news/oversight-board-statement-on-metas-community-notes-testing-in-16-latin-american-countries/). The Board said it had **not yet received its first requested report** on country-specific risk criteria. This does not imply no such report exists after 10 September.

## Text correction and red-team finding
The earlier comparison only described country rollout and historical fact-check labels. Added a source-linked paragraph after the geographical-policy chronology, distinguishing a **documented risk to minority-language participation** from an empirically established pattern of suppressing Afrikaans posts. It uses the Board's explicit ethnic/linguistic warning while rejecting the stronger unsubstantiated inference that a South African rollout occurred or that contributors discriminated. **South Africa-specific outcome: UNVERIFIED.**

**Blue-team test:** the warning is directly pertinent to the investigation's claimed suppression architecture and allows a concrete request for minority-language participation data. **Red-team test:** a policy risk is not a proven adverse decision; the Board is funded by Meta, is advisory, and cites external research; an independent news account is not a second primary technical experiment. No false independence or causal claim was added.

## Integrity and unresolved release gates
- Only one review paragraph and documentary hyperlinks were inserted. Existing JS, SVG, image tags, embedded media counts, element IDs and pre-existing link order were checked unchanged before GitHub writes.
- The current dossier CI now exact-pins the reviewed blob, preserving its original data/media and the separate 1,748,071-byte Rooivalk SHA gate.
- Need a dated South African deployment specification, Afrikaans-language participation and note-publication denominators, moderation notices, comparison groups and any appeals to establish differential treatment. These remain **UNVERIFIED**.
- Static page-source review cannot certify actual mobile render, keyboard navigation, screen-reader flow or the deployed domain's uncached bytes. **Status: OPEN / NOT RELEASE-CERTIFIED.**
