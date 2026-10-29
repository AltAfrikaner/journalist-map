# Investigation #29 — twelfth-pass historical grantmaker and award-denominator review
**29 October 2026 · homepage #31 / local #29 · OPEN, NOT RELEASE-CERTIFIED**

## Scope and exact baseline
- Latest reviewed `main`: `b36e8c17c35c5b793c36bd88102baca748864da4`. Page: `osf-funded-orgs.html`, old Git blob `4a1b051a96471bb03408e57aa8b9d53d2ae97c33`; new reviewed blob `fe11a0902c453a16748f31d7896b06297d57bba4`.
- Reviewed exactly **two Omidyar-family directory tuple corrections** (rows 1 and 8) and two evidence/provenance paragraphs. The register remains **73 OSF/CF rows and 35 Omidyar-family rows**. Legacy VERIFIED badges are not independent release certification.
- Retained all other row data and order, original JS renderer and filters, JS source logic, SVG/3D data, CSS, media, images, IDs, existing links and public HTML route. New references were added in prose without removing/reordering earlier hyperlinks. The downloadable PDF was NOT changed.

## Correction A — Africa Check row 1, earlier public grant announcement is not proven cash
**Previously shown:** ONFI `$352,500 Jan-2016` and no mention of the earlier 2014 donor announcement, with the original family funder field misattributed to the later Luminate brand.

**Primary dated evidence:** [Omidyar Network's original 8 April 2014 news release](https://www.prnewswire.co.uk/news-releases/omidyar-network-supports-fact-checking-in-africa-with-grant-to-africa-check-254328091.html) announced a **two-year grant of up to US$250,000** for Africa Check's expansion to Kenya and Nigeria. This is an announced ceiling, not proof that exactly US$250,000 reached the recipient. [Omidyar Network Fund's 2017 Form 990-PF (Attachment A, PDF page 37)](https://omidyar.com/wp-content/uploads/2020/09/ONFI-2017-990-PF.pdf) independently records a **US$352,500 grant effective January 2016** to **Africa Check C.I.C., London**, and the same amount reported expended by that return. They are *distinctly dated disclosures*; overlapping terms or later amendments must be determined before calling them separate cash transfers or summing them.

**Independent recipient/entity context:** [Africa Check's own funding history](https://africacheck.org/who-we-are/how-we-are-funded) states that the organisation was founded in London in 2012 as a CIC, and control transferred to a South African trust in early **2019**. Institutional grant vs individual journalist payroll must remain distinct. [OCCRP's contemporary October 2018 Luminate launch account](https://www.occrp.org/en/announcement/the-omidyar-groups-luminate-invests-in-occrp) rules out naming Luminate as the legal 2014 or 2016 donor.

**Correction:** Row 1 explicitly separates the **up-to** 2014 announcement from the **2016 recorded ONFI award**, names the historical grantmakers, and labels a combined recipient cash total **UNVERIFIED**. No claim that these are additive payments.

## Correction B — Livity Africa row 8, wrong grantmaker chronology and unsubstantiated cumulative total
**Previously shown:** “Luminate / US$720,664 total / 2013–2015”, despite Luminate's separate launch occurring only in **October 2018**.

**Primary donor filings, inspected at their original PDF pages:**
- [ONFI 2017 Form 990-PF, Attachment A, PDF page 37](https://omidyar.com/wp-content/uploads/2020/09/ONFI-2017-990-PF.pdf) identifies the South African legal recipient **London Livity NPC**, **US$534,616 grant effective March 2015** for VIP youth engagement, **US$301,998 expended** as of the 2017 filing.
- [ONFI 2018 Form 990-PF, Attachment A page 2 (PDF page 43)](https://omidyar.com/wp-content/uploads/2025/03/ONFI-2018-990-PF_for-website.pdf) repeats the **same March 2015, US$534,616 award** and now records **US$534,616 expended**. The 2017 and 2018 figures reflect cumulative reporting of *one grant*, **not two new awards**.
- Independent contemporaneous [OCCRP announcement, October 2018](https://www.occrp.org/en/announcement/the-omidyar-groups-luminate-invests-in-occrp), separately corroborated by [Global Philanthropy Project's organisational profile](https://globalphilanthropyproject.org/about-us/gpp-members/luminate/), dates the establishment of Luminate to 2018.

**Correction:** Row 8 now identifies **Omidyar Network Fund** as the March 2015 grantmaker and **US$534,616** as the recorded award/expended amount by 2018. The historic **US$720,664 aggregate and putative 2013 funding period are UNVERIFIED** against original recipient accounts or donor grant ledgers; no claim of later Luminate grants is made.

## Adversarial interpretation and what remains open
A genuine grant is documentary evidence of a historical institutional relationship, not evidence of any newsroom instructions or suppression of Afrikaans speech. The 2018 legal reorganisation cannot retroactively change the identity of a 2015 grantmaker, and a 2018 repeat of a 2015 grant is not another disbursement. Equally, absence of corroboration for the former US$720,664 total does not prove the total never existed. A complete 2013–2018 recipient cash schedule and any additional amendments are still **UNVERIFIED**. Case-level editorial conduct, grant conditions, tax/entity boundary, all remaining 106 row claims, original PDF dossier and recipient right of reply remain pending.

## Engineering and release gate
- Exact main-old/new-blob pair pinned in `scripts/check-dossiers.mjs`; the sole permitted in-script changes are two exactly specified directory rows. The test restores those rows before comparing all script text with `origin/main`; it checks two row counts, mapping, source values and unchanged media.
- No edit to `MTNrooivalkIRAN.html`: protected expected complete blob `79c93657371ee799d564c07ed5e400bd90ba2690` (**1,748,071 bytes**).
- The inventory must remain **31 homepage investigation cards / 29 existing nonempty local / two offsite**. On 29 October, both `citizenintel/kalahari` and `citizenintel/AAIT` independently returned `pull:true, push:false`: strictly **external read-only**, unmodified and not certified. Kalahari requires original military/incident provenance; AAIT requires incident source, denominator and bias-classification verification; both need original media and accessibility/release testing.
- Separate gates required: passing exact-head editorial and contrast CI; clean GitHub mergeability; successful Pages deployment of merge SHA; independent CDN article parity; real desktop/mobile, keyboard, screen-reader, filtering and PDF claim reconciliation. **No release sign-off is asserted.**
