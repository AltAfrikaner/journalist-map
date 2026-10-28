# Investigation #23 — Wits: eighth-pass ARUA membership/source audit

Date: 28 October 2026. Base `main` at branch creation: `f86164792ffa93803ffc591f872cf9ffe237f602`.
Full-file Git blob `wits.html`: `b250251661c8dc3fc48726313c35603401ac76e9` → `d0be0f12f5bfe5a20051f54363ac4009dad05227`.
**Status: OPEN; not claim-by-claim evidence-certified.**

## Exact substantive correction

**Claim:** the Wits dashboard displayed **16 “Partner universities (ARUA)”** without a date, implying sixteen current bilateral Wits partnerships.

**Finding:** ARUA reports **23 universities in its current network**; Wits's own network-history page says **sixteen universities when ARUA launched in Dakar in March 2015**. These are not the same time period. Neither number proves that Wits has that many direct bilateral contracts, nor that other universities adopt a Wits-directed political/editorial programme.

**Correction:** the dashboard now says **23 “ARUA network institutions (2026)”**. A source-linked paragraph in the executive summary distinguishes the current network count from the original 2015 cohort, bilateral relationships, and claims of a collective editorial command structure. No network nodes or original diagrams were altered.

## Independent source check

1. **Primary current network owner:** African Research Universities Alliance, website with “23 Member universities” and current member profiles, including Wits: https://arua.org/ and https://arua.org/member-universities/ (accessed 28 October 2026). The current ARUA site itself is the primary record for its reported count.
2. **Independent institutional historical record:** University of the Witwatersrand, “Our Network Memberships”, explicitly dating ARUA's formation to March 2015 with sixteen universities: https://www.wits.ac.za/research/strategic-partnerships-office/our-network-memberships/ (accessed 28 October 2026). It is a founding-membership history, not a current member roll.
3. **Context/red-team:** Some secondary descriptions distinguish full members from associates. The dashboard now refers to **network institutions**, not a certified count of full-member legal status or 23 separately signed Wits agreements. Individual institutional contracts and any alleged shared strategy remain **UNVERIFIED**.

## Guardrails / outstanding work

Existing pro-Afrikaner scrutiny of funder relationships and institutional networks is retained. The original scripts, SVGs, 3D data, images, media, IDs, article paths, and existing links were preserved byte-for-byte; only two narrative/dashboard fragments changed. The exact old/new HTML blobs are pinned in `scripts/check-dossiers.mjs` and media/code guards remain enabled.

**Release still OPEN:** grants/disbursements, per-edge network claims, dated donor/governance instructions, 350m moderation reach, citation exports, accessibility (desktop/mobile/keyboard/screen-reader), source-link health, and independently verified CDN publication. A corrected count is not certification of the dossier.
