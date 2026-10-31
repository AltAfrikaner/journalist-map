# #23 Wits — thirteenth evidence-led pass (31 October 2026)

**Status: OPEN — NOT RELEASE-CERTIFIED.** Baseline main commit `6a43316e2e61a1ecc5453876c5daa5723b4266f2`; `wits.html` baseline blob `449d7c32250b903b463f8c3b620112f5f6a6145e`. No scripts, SVG, photographs, element IDs, CSS, existing paragraphs or pre-existing href order changed. Only four inaccurate textual labels/descriptions and corroborating source links were edited.

## Claim 1 — journalism programme versus 2023 Centre

**Before:** “Founded by Anton Harber (2001)” described the present Centre. **After:** Wits launched its journalism programme in 2001 but formally inaugurated the **Wits Centre for Journalism in August 2023**. Harber led the earlier programme; the first WCJ director in 2023 was Dr Dinesh Balliah. This is not proof that the centre's modern governance existed as such in 2001.

- Primary: Wits University, 17 August 2023, [Wits Centre for Journalism marks a new era](https://www.wits.ac.za/news/latest-news/general-news/2023/2023-08/wits-centre-for-journalism-marks-a-new-era-in-media-research.html).
- Independent contemporary: *Mail & Guardian*, 1 August 2002, [The making of a good journalist](https://mg.co.za/news/south-africa/2002-08-01-the-making-of-a-good-journalist/), reporting Harber directing the Wits journalism **programme** in 2002.
- Local campus account, August 2023, [Wits Vuvuzela](https://witsvuvuzela.com/2023/08/15/wits-to-revolutionize-journalism-through-research-centre/), explicitly describes the rebranding.

## Claim 2 — Taco Kuiper judging and alleged 'credentialisation loop'

**Before:** Three still-visible article descriptors attributed the award's judging to Harber in the present tense or treated judging as controlled by the institution that trains the recipients. **After:** Harber's previous role and April 2023 retirement from running the competition are dated; 2026 competition names **Beauregard Tromp, Sarah Carter, Tom Cloete and Khadija Sharife** as judges. Wits hosts/manages the award, the Valley Trust funds it, and a changing panel chooses winners. This establishes a professional training-and-award ecosystem, but not an exclusive Wits editorial command chain.

- Primary: [Wits Centre for Journalism Taco Kuiper Awards rules](https://wits.journalism.co.za/taco-kuiper-awards/): winners chosen by judges, funding and institutional roles described.
- Independent dated local report: [Wits Vuvuzela, 21 April 2023](https://witsvuvuzela.com/2023/04/21/news24-and-groundup-share-the-spoils-at-the-taco-kuiper-award/): Harber announces retirement from running award after 17 years.
- Independent 2026 report: [Journalism.co.za, 30 March 2026](https://journalism.co.za/celebrating-the-very-best-of-south-african-investigative-journalism-at-the-2026-taco-kuiper-awards/): identifies the current judging panel; does not establish donor-directed editorial selection.

**UNVERIFIED:** exhaustive alumni placement claims; 2026 award-judge voting and conflicts beyond public accounts; identical donor pools across Wits, fact-checkers and award panels; instructions linking personnel to Meta enforcement. Neither professional proximity nor the award proves coordination.

## Release and red-team

Static inspection: page has a skip link but no semantic `<main>` landmark. True mobile, keyboard, screen-reader and graphical card overflow/hover testing remains outstanding. Data nodes, 3D graphics and links inside old visualisations require separate audit; only the four corrected visible descriptors were touched. Recheck exact-head CI and clean merge state before merging. The 31-card archive remains 29 local + 2 offsite; no changes to CitizenIntel repos, which remain pull:true, push:false on this run.
