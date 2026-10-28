# Local investigation #19 — tenth-pass electoral denominator and graph-context review
**Date:** 28 October 2026 · **File:** `44afrikaners.html` · **Status:** OPEN, not release-certified.

## Exact corrections
1. Reconciled a 2024 Freedom Front Plus election-data mismatch without silently choosing a contested denominator. IFES reports **218,850 national-ballot votes and six National Assembly seats**, whereas Election.org's separately published IEC-derived transcript reports **219,052 national-ballot votes** and the same six seats. The 202-vote difference remains **UNVERIFIED** against the underlying Electoral Commission PDF because that official document could not be directly inspected in this pass. The article now says **approximately 219,000 votes** and separates this national-ballot vote count from the combination of national-list and regional seat allocations. Neither figure establishes representative authority over all Afrikaners.
2. Corrected the 3D-board introductory sentence that implied its entire graph was identical to the published **43-person roster**. The unchanged graph contains additional funder, institution and state nodes and research-hypothesis edges. Graph edges are not individual payment receipts or government instructions; each edge remains **UNVERIFIED** until audited.

## Sources and independent countercheck
- Original primary **25 October 2025** signed statement and roster: https://www.news24.com/opinions/columnists/guestcolumn/not-in-our-name-afrikaners-respond-to-the-misuse-of-their-story-in-us-politics-20251025-0450
- Primary ANC response **26 October 2025**: https://www.anc1912.org.za/anc-welcomes-the-not-in-our-name-declaration-by-freedom-loving-afrikaans-speaking-south-africans/
- IFES independent 2024 results compilation: https://www.electionguide.org/elections/id/4318/ — FF Plus 218,850 votes, six seats.
- Election.org independent IEC-result transcription: https://election.org/country/south-africa/elections/2024/national-assembly/party/vryheidsfront-plus — FF Plus 219,052 votes, six seats, states seats 4 national + 2 regional. Its official IEC PDF link could not be read from this environment. The two secondary numeric reproductions therefore **do not independently resolve** the primary denominator.

## Red-team release conditions
The 44-item/43-unique-name claim remains anchored to the original signatory statement and independent contemporaneous reproduction, but whether duplicate listing was deliberate is UNVERIFIED. The 45 chart-category tallies versus 43 names, 14-person university assertion, alleged donor/state links, individual employment classifications, PAIA proof, and 3D graph edges remain OPEN. Nothing here adjudicates coordinated authorship of the letter. Browser, mobile, keyboard, screen-reader and public CDN checks remain required.

**Preservation:** existing scripts, 3D node/edge datasets, SVGs, stylesheets, images, media, IDs and original href sequence remain unchanged; only two visible prose passages were edited and two supporting source links were added.

**Exact Git blobs:** `c4543b52137205a207a807c96e5716e61f9cc52e` → `159e7fd15165275acb56df3b040006e2439d48c9`. CI keeps the exact file-hash gate and separate scripts/SVG/images/IDs/embedded-asset comparisons.
