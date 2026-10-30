# 30 October 2026 — Source corrections #15 WEF / #16 UN (twelfth-pass reconciliation)

## Scope and baseline

Based on `main` 60ee1d47e5d1b1750ab49e741c542922a7f8640f. Editorial text only in `wef.html` and `un.html`. The original CSS, JavaScript, SVG/3D source, imagery, media, IDs and existing link ordering were compared and preserved; no data asset or public route rewritten. Rooivalk was not opened for writing.

## #15 World Economic Forum

- **Corrected:** 1993 Global Leaders for Tomorrow membership was inaccurately presented as a programme renamed Young Global Leaders in 2003. The WEF's own 2024 history dates the original GLT group to 1992, the separate YGL formation to 2004, and the first YGL cohort to 2005. Distinguished GLT's under-43 threshold from YGL's age-40-and-under selection rule.
- **Independent check:** Swissinfo's on-the-scene 27 June 2005 report describes the inaugural YGL summit; a 23 January 2005 Die Welt account independently reports the first cohort. Neither establishes that WEF alumni were commanded to take particular national policy decisions.
- **UNVERIFIED:** Any specific policy decision allegedly instructed by a leadership course, compulsory ideological training or uninterrupted mentoring of Ramaphosa across a 25-year interval.
- Primary: https://www.weforum.org/agenda/2024/01/young-global-leaders-ygl-20/ ; contemporaneous WEF release https://csrwire.com/press-release/world-economic-forum-founder-to-create-forum-of-new-global-leaders-with-prestigious-prize-award/ (18 May 2004). Independent: https://www.swissinfo.ch/eng/archive-science/young-global-leaders-focus-on-the-future/4584916 (27 June 2005).

## #16 United Nations

- **Corrected:** The on-page statistical cards asserted 39% Black, 7.8% white and 59.6% youth unemployment without one comparable reference period or a youth age bracket. Replaced with **Q2 2024 official rates: 37.6% Black African, 7.9% white, 46.6% aged 15–34**. These are descriptive statistics, not evidence that a named post-apartheid law caused the gap.
- **Different reference quarter protected:** The separate **8.0 million Q4 2024** unemployed count was retained with explicit warning that it is from a different survey quarter. The earlier combined trio remains **UNVERIFIED** as a single matched-quarter comparison.
- Primary: South African Parliamentary Budget Office's September 2024 Q2 survey briefing using Stats SA QLFS https://www.parliament.gov.za/storage/app/media/PBO/Quarterly_Economic_Briefs/2024/4-september/16-09-2024/PBO_QEB_September_2024.pdf . Independent: Reuters 23 September 2024 https://www.reuters.com/world/africa/racial-divide-south-africas-economy-2024-09-23/ . Q4 2024 overall count: https://www.sanews.gov.za/south-africa/sas-unemployment-rate-declines-319 .

## Release status and safeguards

- Reviewed complete Git blobs: `wef.html` `5a03f4cecf6112fa62959e11fdcbc0b4e76a66d1`, `un.html` `ba29c060309c865582b2be2b7bc11cb4ac4c8779`. The dossier test pins these precise text revisions while retaining previous-main hash allowlists and immutable media/data checks.
- Both dossiers **OPEN / NOT RELEASE-CERTIFIED**; remaining individual network/financial claims, full primary-record checks and independent browser/mobile/keyboard/screen-reader tests still required. Visitor-facing content parity remains tracked in issue #234.
- Archive baseline 31 cards / 29 local / two external. `citizenintel/kalahari` and `citizenintel/AAIT` both verified `pull:true,push:false` for this run; neither modified. Kalahari: incident and military records; AAIT: denominator, classification and incident provenance; both need accessibility/media/publication verification.
- Protected `MTNrooivalkIRAN.html` must remain exact blob `79c93657371ee799d564c07ed5e400bd90ba2690` and nonzero.
