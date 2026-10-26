# Investigation 03 — Africa Check: sixth-pass source and red-team corrections
**Date:** 26 October 2026  
**Compared against:** `main` commit `6a662429fdbcdc9460b89c12c27dd3bc9d2ba85c`  
**Old HTML blob:** `541ef67f8e76a8b65291df4b4c51c7b58fc46611`  
**New HTML blob:** `efb608a6fc4873235b76714973d4ccee25767f2f`  
**Editorial certification:** OPEN (partial evidence correction, not a full audit).

## Exact corrections

1. **133 / 97 rate provenance (2017).** Replaced an un-attributed mathematical shorthand with the original 8 May 2017 parliamentary-claim provenance. Pieter Groenewald quoted 133 per 100,000 and Steve Swart quoted 97 per 100,000; both attributed their numbers to ISS researcher Johan Burger. Burger described the rates as indicative rather than scientific. Numerator and denominator populations were inconsistent. Neither number establishes the actual comparative risk faced by farmers or white farmers. The contemporary October 2017 reporting independently discusses this and the 156 per 100,000 AfriForum revision. We did not import or recalculate the latter into the article because its year and population definitions require separate reconciliation.
2. **Ramaphosa 2018 reply.** Kept the Police's 2017/18 count of 62 victims, 46 white and 52 owners/occupiers as distinct overlapping categories, and added the president's spokesperson's contemporaneous clarification: the remarks were reportedly directed at an assertion of large-scale killing. That reply does not nullify the 62 documented murders. The article now gives readers both the original remark and the response.
3. **Google grant financial denominator.** Documented the May 2019 Google.org **US$2m over three years** as a grant shared among Full Fact, Africa Check, Chequeado and the Open Data Institute, **not a $2m disbursement to Africa Check**. The consortium recipient split, actual payments, restrictions and impact on particular editorial judgements remain **UNVERIFIED**. This is distinct from the Google News Initiative-supported South African election coalition announced in February 2024. Existing undated 2025/26 donor percentages remain unverified, not reconstructed.
4. Updated the page's visible source-update date to 26 October; preserved the original publication URLs and case evidence.

## Primary and independent/contrary sources

- Africa Check, **8 May 2017**, original farm-murder-rate analysis: https://africacheck.org/fact-checks/blog/analysis-why-calculating-farm-murder-rate-south-africa-near-impossible
- **Independent** Mail & Guardian / Daily Vox, **30 October 2017**, contemporaneous scrutiny of the 97/133 methodology: https://mg.co.za/news/south-africa/2017-10-30-south-africa-s-farm-murder-statistics-are-more-political-than-accurate/
- Africa Check, **27 September 2018**, original Ramaphosa fact-check and 62/46/52 police-category breakdown: https://africacheck.org/fact-checks/spotchecks/check-stats-ramaphosa-62-people-murdered-sa-farms-smallholdings-last-year
- **Independent** The Citizen, September 2018, reported Khusela Diko's contextual response: https://www.citizen.co.za/news/south-africa/cyril-defends-on-air-statement-of-no-killing-of-farmers/
- Africa Check, **7 May 2019**, its own consortium-grant account: https://africacheck.org/fact-checks/blog/africa-check-part-international-group-wins-google-ai-impact-challenge
- **Independent consortium counterparty** Full Fact, **7 May 2019**: https://fullfact.org/blog/2019/may/full-fact-and-international-partners-win-google-ai-impact-challenge/
- **Independent South African press** MyBroadband, **9 May 2019**, reports the grant was shared: https://mybroadband.co.za/news/internet/305502-google-funding-africa-check-to-fight-fake-news-in-south-africa.html
- Africa Check, **2 February 2024**, explicitly named coalition and Google News Initiative: https://www.africacheck.org/fact-checks/blog/press-release-africa-check-south-african-media-google-create-coalition-fact

## Red-team / release boundary

The strongest critical inference is that grant-financed technical tools and platform relationships could influence which claims reach gatekeepers; the strongest competing account is that financial and tooling partnerships are disclosed and an individual's editorial judgement requires separate proof of improper instructions. A grant cannot resolve either hypothesis. **UNVERIFIED:** donor instructions, consortium subgrant/receipt ledger, specific Meta moderation notices and appeals, institutional graph edges, proportion of fact-checks on Afrikaner claims, actual time-matched 2025 donor chart figures, and comparative farm-victim denominator. No new finding of political collusion or demographic targeting is asserted.

## Technical controls and status

Only article narrative and date were changed. Before writing, code compared **every original script block, SVG, style block, image tag, media tag, element ID and original hyperlink in order** with the revised file; all were preserved; **seven documentary links were added**. No article route, JS, image, research dataset, stylesheet, SVG, or material viewpoint was edited. Static CI and viewport/browser certification remain to be checked; public website previously served pre-25 October cached prose. Full release status stays **OPEN**.