# Homepage #31 / local investigation #29 — Fifteenth source-correction pass (31 October 2026)

**File:** `osf-funded-orgs.html` · **Status:** OPEN / NOT RELEASE-CERTIFIED. Start main: `2e9e79bf362bc59177425c2e5b7a50d6b8c7596c`. Prior reviewed article blob `6d68a023f85faf30649a7db18535a88ebf95f5c2`; exact revised blob `e499ef1ec384fd76b7f87eca0055ea8951b8ec57`.

## Documentary question

The OSF-funded organisations atlas labels Africa Check (#2 of 73 OSF rows) “OSF 12% income” and “VERIFIED” with no fiscal year, while other visible contextual text already warns that the percentage is not current. A reader of the sortable directory could reasonably mistake the number for the present institutional funding share. Donor-share percentages require **both grant source and reporting-period denominator**.

### Sources, verification strength and adversarial comparison

1. **Direct primary disclosure:** In Africa Check's article dated **23 June 2025**, its transparency parenthetical explicitly states that OSF contributed **3% of Africa Check's 2023 funding**. This is Africa Check's own statement, **not an independently audited 2023 grant ledger**: https://africacheck.org/fact-checks/meta-programme-fact-checks/no-cnns-fareed-zakaria-did-not-support-tanzanias-crackdown . Africa Check's official general funder page reports separately dated 2025 breakdowns and explains that pre-2019 accounts were filed through its UK community-interest company: https://africacheck.org/who-we-are/how-we-are-funded .
2. **Historical secondary comparison:** The Wikipedia funding summary explicitly assigns the **12%** share to **2016**, not an unspecified current year, and cites older corporate-account context. This summary is not a substitute for the original filed 2016 statement, which remains **UNVERIFIED in this review**: https://en.wikipedia.org/wiki/Africa_Check .
3. **Separate publication; not independent audit:** *The Observer* (Uganda), **4 June 2025**, repeated the 12% figure without a clearly matched fiscal year. Its wider claims and editorial framing have not been substantiated here and are NOT adopted. The article illustrates how an old reported share can spread as if timeless: https://observer.ug/news/untold-story-of-how-usaid-weaved-web-of-influence-in-africa/ .

**Documented:** Africa Check itself disclosed 3% for 2023; secondary histories associate 12% with 2016; separate 2025 commentary repeated 12% without adequate time context. **UNVERIFIED:** original 2016 audited percentage, 2025/2026 current exact OSF share, any donor authority over a particular fact-check, and alleged Meta reach outcomes. These measures cannot be added or taken as cumulative funding percentages.

## Exact scoped correction and preservation

- Changed only OSF atlas **row 2** from `OSF 12% income / VERIFIED` to `2016 12% (secondary); 2023 3% (Africa Check disclosure); current share UNVERIFIED / UNVERIFIED`.
- Added a visible, dated contextual paragraph with links directly above the existing table, preserving old rows, search/filter behaviour and row count.
- Strict CI explicitly permits this one whole-file blob pair, restores the one edited row and compares original inline scripts for identical renderer and **all other 107 tuple** content. The test still checks 73 OSF and 35 Omidyar rows.
- No other 72 OSF rows or 35 Omidyar rows, JS renderer, SVGs, 3D, media, imagery, CSS, IDs or previously published href order changed. Static preservation validation performed before commit.

**Remaining:** primary 2016 original filed accounts and a comparable 2026 disclosure; verify 107 other row amounts and dates (including awards vs cash), legacy PDF with unreconciled contents, desktop/mobile/keyboard/screen-reader, user-facing fresh-CDN content. Passing CI alone is not proof of correctness of every atlas row.

**Inventory:** 31 cards /29 local/2 externally hosted. `citizenintel/kalahari` and `citizenintel/AAIT` fresh rights pull:true/push:false; both **EXTERNAL READ-ONLY / NOT CERTIFIED**. Kalahari military and incident primary records remain unverified; AAIT incident provenance, denominators and classification remain unverified. Protected Rooivalk original blob `79c93657371ee799d564c07ed5e400bd90ba2690`, 1,748,071 bytes, untouched. GitHub Actions, mergeability, Pages and external publication parity require independent post-commit checks.
