# Editorial evidence audit and adversarial review — 21 October 2026

**Status:** Review notes, not adjudicated findings. **Scope:** Research integrity and source validation; no alteration of allegations, maps, datasets, scripts or page text in this pull request. Reviewed against current `main` on 21 October 2026. Open PR #23 already addresses selected journalist and OSF-payroll claims; avoid duplicate changes.

## Method and red-team rule

For every major disputed claim, record: (1) exact published quotation and location; (2) strongest direct supporting source; (3) source against or narrower than that reading; (4) time and jurisdiction limits; (5) alternative explanation; (6) outcome: retain, qualify, correct, or pending. A connected institution is not automatically a commanded institution, a complaint is not a legal finding, and a programme's existence at one date does not prove its existence worldwide at another date. A **RED TEAM HOLD** prohibits substantive rewrite until the claimed contradiction and competing interpretation have both been checked. Preserve the original wording in version history and quote it in the evidence register.

## Finding C-01 — Constitution: legal adoption and certification (high priority)

**Location:** `constitution.html`; headline *75% Replaced. 0% Consent.*, opening assertions including that “the party that wrote the replacement achieved 100% of its objectives. Every other party achieved zero.”

**Primary records:** Constitutional Court first certification judgment [1996] ZACC 26, especially paragraphs 1, 14, 20–21, https://www.saflii.org/za/cases/ZACC/1996/26.html ; amended-text certification judgment [1996] ZACC 24, introductory paragraph, https://www.saflii.org/za/cases/ZACC/1996/24.html .

**Established from primary records:** Negotiated 1993 interim Constitution envisaged a final text, adopted by a two-thirds majority of a Constitutional Assembly elected through the transitional legislature and subsequently certified for compliance with the Constitutional Principles. The initial text was adopted on 8 May 1996 by around 86% of Assembly members; the Court reviewed its compliance and the amended text was certified on 4 December 1996. Thus the public vote was not a direct referendum on the final text, but describing the adoption as having “0% consent” without explaining elected representation, negotiated Constitutional Principles, public submissions, and court certification is materially incomplete.

**Red-team challenge:** “0% consent” might mean **no direct referendum specifically on the final Constitution**, not absence of political or legal authorisation. Retain that narrower critique if substantiated and expressly defined. Do not assume the Constitutional Court certification establishes popular satisfaction with every provision. Count-based “75% / 100% / 0%” claims remain **unverified** pending reproducible denominators, baseline textual comparisons, and party-position coding. **Decision: RED TEAM HOLD** on changing article; prepare bounded clarification and methodology appendix after independent calculation.

## Finding M-01 — Meta moderation timeline and geographic scope (high priority)

**Location:** `ifcn.html`, `sixstage.html`, `metasuppression.html`, `africacheck.html`, `real411.html` and related hub summaries.

**Primary records:** Meta, *More Speech and Fewer Mistakes* (7 January 2025; later updated), https://about.fb.com/news/2025/01/meta-more-speech-fewer-mistakes/ ; Meta, *Testing Begins for Community Notes* (13 March 2025; update 7 April 2025), https://about.fb.com/news/2025/03/testing-begins-community-notes-facebook-instagram-threads/amp/ .

**Established from primary records:** Meta ended its US third-party fact-checking programme on **7 April 2025** and began Community Notes there, while expressly stating third-party fact-checking would remain outside the US until launched elsewhere. Meta says earlier third-party fact checks could impose labels and reduce distribution; Community Notes do not carry the same distribution penalties. A claim that the **same worldwide fact-check-to-demotion pipeline** was operating uniformly across all Meta users after April 2025 is therefore too broad. The policy documents do **not** by themselves disprove continuing fact-check effects in South Africa or identify how a specific South African complaint was handled.

**Red-team challenge:** The articles may focus on South African rather than US content; a broad US-only correction would itself be misleading. Verify exact article tense, policy version, platform and country before changing text. Claims of “six automated stages without human review” require independent technical implementation evidence; an illustrative mechanism is not proof of an unbroken automatic route. **Decision: RED TEAM HOLD** on site text; create dated platform/jurisdiction qualification and distinguish labelled, demoted, removed and account-sanctioned content.

## Finding R-01 — CWS litigation description (high priority)

**Location:** `cws.html`: introductory claim that CWS is “simultaneously suing to shut the [Afrikaner refugee] programme down.”

**Source:** CWS public explanation of *Pacito v Trump*, 25 March 2025, https://cwsglobal.org/press-releases/trump-administration-blocked-from-terminating-agreements-with-refugee-serving-agencies/ .

**Established from cited document:** CWS says it was among plaintiffs challenging suspension/termination of broad refugee-resettlement operations and contracts. The March 2025 account does not, on its face, demonstrate litigation *to shut down the Afrikaner programme*. Yet it is a party's own public summary, not an exhaustive docket search, and other litigation could exist. **Red-team challenge:** Identify case numbers, complaints, amended pleadings, prayer for relief, and whether other named actions specifically concern the Afrikaner programme. The conclusion “sued to shut it down” is **not corroborated by this source**. **Decision: RED TEAM HOLD** until complete docket-level search; do not replace a contested assertion merely with CWS's public-relations framing.

## Finding J-01 — Journalist language/payroll assertions (already in PR #23)

**Location:** `sa_journalists.html` and hub. Sample of 28 journalists and 23 houses does not itself establish a population-wide zero of Afrikaans speakers or personal OSF salaries. Review PR #23 for necessary edits and do not duplicate or independently merge competing edits.

## Review queue and evidence requirements

1. **P0:** Constitution; CWS; IFCN/Meta pipeline; Prototype Nation's claim of causal institutional transfer; MTN/Rooivalk alleged conduct; Mbalula legal claims.
2. **P0:** WEF governing power; OSF Funding Atlas amounts, denominators and recipient dates; ADL/SPLC donor influence; ownership and confidential instruction claims at IOL.
3. **P1:** Omidyar/USAID grant tables; Motsepe networks; Africa Check case decisions; UN legal treatment; remaining timeline, language and quantitative claims.
4. **Technical:** confirm actual canonical destinations, navigation sequence, browser JS/WebGL performance, mobile accessibility, archives and broken references. Do not infer functionality merely from preserved HTML or passing static tests.
5. **Large-file exception:** `MTNrooivalkIRAN.html` could not be retrieved as full text in the previous connector pass; no merits conclusion until complete source can be inspected.

## Publication quality gates

- Two independent source passes before materially changing high-risk allegation; record the strongest counterargument as well as corroboration.
- Court pleadings are allegations until adjudication; separate government policy from rhetoric, individual affiliation from institutional endorsement, funding from editorial control, and temporal correlation from causality.
- For numbers: primary source, time period, denominator, calculation and last checked date.
- For named subjects: accurately represent material denials and offer right-of-reply channels; preserve source citations, original narrative and changes in a dated log.
- For code: full preservation diff for JS, SVG, IDs, images, map data, paragraphs unless explicitly approved as a sourced editorial correction; run CI and browser smoke tests before merge.
