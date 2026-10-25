# Investigation #01 — OSF South Africa: fourth-pass factual corrections
Date: 25 October 2026. Base main: `7a53859e7785aab8fe6640bc9a8e78a6822b5faf`. Scope: `osf.html` prose and factual presentation; the published editorial stance is preserved.

## Verified corrections and adversarial checks
- **Count:** SEO description said 65 nodes versus the rendered 67; aligned metadata to 67. The contents of all 67 nodes remain unverified.
- **1979 versus 1993:** The original narrative confused Soros's first *philanthropic activity* at UCT with the establishment of OSF-SA and the later global network. OSF's own 2018 release confirms scholarships for 80 Black UCT students and 1993 foundation opening. **Counterevidence:** another OSF 2021 retrospective describes work starting 1994; exact incorporation/commencement remains open.
- **1987 Dakar:** OSF confirms Soros's support for the dialogue with the banned ANC; the stronger claims that every participant's actions were legally illegal and that all 61 delegates were white could not be verified from that record. Individual offences **UNVERIFIED**.
- **1990–91 ISS:** ISS's own historical record states IDASA's Lusaka meeting inspired Jakkie Cilliers and PB Mertz to found the Institute for Defence Policy in 1991; renamed ISS in 1996. Founder Cilliers's 2010 remembrance explicitly identifies Slabbert fundraising through **Anglo American, De Beers and Friedrich Naumann**, not a sole Soros funder. Original $5.1m 'largest grantee' ranking **UNVERIFIED**.
- **1988 Vrye Weekblad:** The independent 2019 historical account credits a Dakar suggestion from Beyers Naudé; Stellenbosch ESAT confirms a collectively owned Afrikaner journalism endeavour. A meeting influence does not prove Soros financed its newspaper or controlled its editorial policy; the alleged single-funder chain is **UNVERIFIED**.
- **Helen Zille:** The page both cited her Moneyweb interview and claimed her board connection was *never reported*. Moneyweb actually published her explicit acknowledgment. Corrected narrative and finding.
- **Tax entity:** The claim that the *South African foundation itself* was a US 501(c)(3) with a confirmed Swiss spending route is **UNVERIFIED**; distinct US, South African and Swiss entities must not be conflated. Claimed $15m first-year budget also unverified without annual accounts.
- **Meta / Africa Check / IFCN:** Funding/association alone does not demonstrate an automatic global platform removal. Meta's primary 7 Apr 2025 policy update ended third-party labels in the US, while the programme persisted elsewhere pending rollout. Historical donor percentages 12/13/8 require dated financial denominators. The unmodified legacy SVG's 'Farm posts removed' box explicitly marked **UNVERIFIED** by adjacent evidence notice.
- **Wasserman/IDRC:** Stellenbosch originally announced the CINIA **over R20m, three-year** research award in Aug 2025; work scheduled for Jan 2026. 2026 should not be represented as the new award date. A study, journal editorship or grant is not by itself a platform moderation order; specific cases **UNVERIFIED**. Separate R4.5m award number remains unverified.

## Primary records
1. OSF 2018 anniversary: https://www.opensocietyfoundations.org/newsroom/open-society-foundations-celebrate-25-years-south-africa
2. OSF institutional timeline: https://www.opensocietyfoundations.org/who-we-are/our-history
3. OSF Africa regional restructuring: https://www.opensocietyfoundations.org/what-we-do/regions/africa/
4. ISS origins / co-founders: https://issafrica.org/about-us/how-we-work
5. ISS co-founder 4 May 2010 testimony: https://issafrica.org/about-us/press-releases/in-remembrance-of-frederick-van-zyl-slabbert
6. Meta dated US policy: https://about.fb.com/news/2025/03/testing-begins-community-notes-facebook-instagram-threads/
7. Africa Check donor/partner disclosures: https://africacheck.org/get-involved/partner-with-us
8. Stellenbosch 27 Aug 2025 grant: https://arts.sun.ac.za/2025/08/27/major-grant-awarded-to-the-centre-for-information-integrity-in-africa-cinia-to-convene-partnerships-in-global-south
9. National Research Foundation Wasserman bio: https://www.nrf.ac.za/about-us/nrf-awards/2024-2/2024-a-rated-researchers-a-rated-for-the-1st-time/professor-herman-wasserman/

## Independent and contrary sources
- Zille's 2007 public disclosure to Moneyweb: https://www.moneyweb.co.za/archive/helen-zille-leader-da-and-cape-town-mayor/
- Vrye newsroom historical reconstruction: https://www.bizcommunity.com/Article/196/90/188001.html
- Stellenbosch ESAT press history: https://esat.sun.ac.za/index.php/Vrye_Weekblad
- Outside report on CINIA grant: https://www.suidkaapforum.com/News/Article/National-News/maties-gets-major-grant-for-research-to-promote-online-truth-202509010244

### Final internal consistency sweep
A final review of the *current* article removed the additional contradictory board-card claim of 'never reported', the leftover Dakar-produced-three-institutions finding, an overreaching academic pipeline claim and the implication that journal editorship conferred content-moderation authority. It re-labelled the historical flowchart header as a hypothesis; SVG graphics themselves remain unchanged.

## CI guard reconciliation — 25 October 2026
The original `scripts/check-story-pairs.mjs` check rejected the *unchanged* 1,747,532-byte Rooivalk dossier because it still allowed only earlier exact Git hashes. Added only the previously reviewed intact blob `652dab0ceab3eafdb48b603ccc0aa8f832b1d3b6` to the approved **remote-cover** set; did not modify the Rooivalk page. Retained the explicit minimum-size guard (>1,740,000 bytes), 14 inline evidence-image count, checked remote-cover URL and strict hash rejection of other variants. This corrects outdated CI expectations without widening acceptance to arbitrary content.

## Integrity/release status
The original five scripts, three SVGs, three image elements, every ID and original href have been compared byte-for-byte and retained; the story URL, user viewpoints, 3D dataset, interactive labels, original historic map and artwork are not modified. New inline documentary links and a legible warning near the dated SVG were added. Text-only HTML change leaves section count intact. This does **not** certify the source reliability of any original map edge or visual label. Static GitHub CI, mobile/browser contrast, original donor-year ledger checks, and Pages CDN freshness remain separately required.

**Outstanding evidence:** all 67 node relationships, actual grants/recipients and amount denominators, alleged Meta farm-post removal notices, Swiss and SA legal filings, individual funding transactions, participant legal claims, historic press/academic claims, and contentious inference in unedited interactive tooltips. Prior PR #3 is unrelated and left open. External `citizenintel/kalahari` and `citizenintel/AAIT` remain outside editable scope.
