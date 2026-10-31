# Local investigation #26, homepage entry #28 — thirteenth-pass Afrikaner census-denominator review (31 October 2026)

**Status: OPEN / NOT RELEASE-CERTIFIED.** Article: `cws.html`. Source main Git blob `a22fc5d45a13bac1ac3bbb0ff392574c5e899290`; revised reviewed Git blob `d749dd1fc669c06f659405cb87a39054c5d967e2`.

## Claim-level correction and red-team test

1. **Ethnic identity is not home-language response.** The article described Afrikaners as **roughly two million people** without a stated population-method denominator, followed by universal religious and cultural traits. The 2022 census's P08_LANGUAGE question records the language used most often at home by respondents aged one and over. It does not ask whether a respondent self-identifies as Afrikaner. The original numerical claim is now explicitly **UNVERIFIED**, with a non-essentialising cultural description rather than a fabricated replacement count.
2. **Primary data and two independent accounts.** Statistics South Africa's 2022 person-level census dataset, archived by the University of Cape Town's DataFirst portal, names the actual question. The Herald's **10 October 2023** census account and BusinessTech's 2023 presentation independently report a **10.6% Afrikaans-most-often-spoken-at-home share**, BusinessTech estimating about **6.57 million** respondents. That is a language count across communities, not an Afrikaner ethnicity count. One BusinessTech narrative sentence contains a 10.06% typo; its own table reports 10.6%; compare with The Herald and the original census variable before citing.
3. **Perspective preserved with a verifiable threshold.** The article may still make a pro-Afrikaner case for fair refugee adjudication and scrutiny of a contractor; language statistics do not decide the validity of individual discrimination complaints or prove CWS interference. Refugee case notices, contractual decision-rights and a defensible Afrikaner self-identification survey are separately needed. Those outcomes remain **UNVERIFIED**.

## Sources

- Primary census-variable metadata, producer Statistics South Africa, archived by UCT DataFirst: https://www.datafirst.uct.ac.za/dataportal/index.php/catalog/982/variable/V48
- Independent The Herald census report, 10 October 2023: https://www.theherald.co.za/news/2023-10-10-the-census-fascinating-facts-and-figures/
- Independent BusinessTech language count/percentage table, 2023: https://businesstech.co.za/news/lifestyle/724160/these-are-the-most-spoken-languages-in-south-africa/

**Scope/preservation:** One existing prose segment corrected and one dated source-method note inserted; original scripts, SVG/3D, charts/data, CSS, images/media, element IDs and prior href ordering preserved. Three source citations newly added. An exact old/new full-blob check is added without weakening other media guards. No claim that all CWS operational allegations were resolved.

**Still OPEN:** Census-based cultural identification methodology, RSC case-level records, donor/institutional chain evidence, graph and image-text assertions, missing semantic `<main>`, real desktop/mobile/keyboard/screen-reader tests and independent live-site parity (issue #234). `citizenintel/kalahari` and `citizenintel/AAIT` remain external read-only and unedited.
