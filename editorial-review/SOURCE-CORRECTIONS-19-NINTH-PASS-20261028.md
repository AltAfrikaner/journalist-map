# Local investigation #19 — ninth-pass dated-source red team
**Date:** 28 October 2026. **Article:** `44afrikaners.html`. **Status:** OPEN — not editorially release-certified.

## Correction made

1. The visible canonical-source paragraph had stated that the ANC **endorsed the News24 publication on 25 October 2025**, the same day that Presidency spokesperson Vincent Magwenya amplified it. The ANC's **primary institutional press statement is dated 26 October 2025**. The revised paragraph separates the ANC party statement (**26 October**) from Magwenya's reported public amplification (**25 October**), and adds a direct link to the primary statement. An ANC party response is not proof of Presidency or DIRCO authorship.
2. The page now explicitly cautions that **unchanged interactive-map data/tooltips** still include a purported 25 October ANC party statement, unproved attribution of final letter authorship to Karen Burger, and claims implying state sponsorship. Those map annotations remain **UNVERIFIED**, not certified facts. This pass deliberately does **not** rewrite graph JavaScript, 3D data, node IDs or media without an individual edge-by-edge source audit.

## Source triangulation

- **Primary source — ANC, 26 October 2025:** https://www.anc1912.org.za/anc-welcomes-the-not-in-our-name-declaration-by-freedom-loving-afrikaans-speaking-south-africans/ — the party's own explicitly dated statement welcoming the *25 October* News24 article.
- **Primary publication — signatories' statement, News24, 25 October 2025:** https://www.news24.com/opinions/columnists/guestcolumn/not-in-our-name-afrikaners-respond-to-the-misuse-of-their-story-in-us-politics-20251025-0450 — original text and signatory roster, including duplicated entry for Louise du Plessis.
- **Independent contemporaneous reporting — Smile 90.4FM, 27 October 2025:** https://smilefm.co.za/anc-welcomes-not-in-our-name-stance-by-group-of-afrikaners/ — separately reports ANC reaction and reproduces the list.

## Red-team and preservation

- Counter-hypothesis: a rapid ANC endorsement can reflect political agreement without state commissioning; a named diplomat's reported involvement does not itself establish funded or directed drafting.
- **UNVERIFIED:** any government instruction, funding/payment for the letter, precise authorship of its final form, individual graph relationships, the 43-person affiliation/sector assignment ledger, the category total of 45 versus 43 distinct people, PAIA service and outcomes, and contemporary Washington transmission of a specific signed text.
- Original HTML script blocks, stylesheets, SVG blocks, media elements, existing hyperlinks and routes were preserved; only visible explanatory prose and added external source link were changed.
- Full mobile, keyboard, screen-reader and uncached visitor-facing URL checks remain required. This research pass is not a licence to certify the legacy graph.

**Full-file Git blob:** `4fb5361bc30e1360c13bace647d17969e1f80a4b` → `c4543b52137205a207a807c96e5716e61f9cc52e`.

**CI reconciliation:** `scripts/check-dossiers.mjs` retains full-file, scripts, SVG, image, media and ID preservation assertions. Its two stale eighth-pass exact baseline/output hashes were updated to match the documented ninth-pass original and revised Git blobs; no check was removed or bypassed.
