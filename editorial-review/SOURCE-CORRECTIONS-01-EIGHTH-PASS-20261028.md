# Investigation 01 — eighth source/red-team pass (28 October 2026)

Repository: `AltAfrikaner/journalist-map`; initial `main` commit `623a64626fc65f7937a3207e1e7ff5a546d04cdf`.
File: `osf.html`. Reviewed baseline Git blob `35780cc9eae3c2c138c56f1593ec242763088b30`; new exact reviewed Git blob `986f59333f2c3ec232058f2000d753fb8b625f73`. **OPEN — NOT release-certified.**

## Specific documented correction
**Zille finding: fix logical reversal and overstated independence of sources.** The original visible paragraph claimed Helen Zille's OSF-SA board membership was corroborated by six "independent" sources and then asserted the claim was "contradicted" by a Moneyweb interview in which Zille herself acknowledged serving on the board. A corroborating firsthand admission cannot contradict the fact of membership. The interview also disproves any suggestion that the relationship was kept secret from the public by 2007.

The corrected paragraph distinguishes **(a)** membership in a foundation; **(b)** the public disclosure of board service; **(c)** the still-unproved inference that this established OSF direction of Democratic Alliance policy or individual votes. It stops treating six non-independent-looking profiles as six independently sourced confirmations. The exact dates of appointment, departure and particular trustee decisions are **UNVERIFIED** without board minutes or dated trustee registers. Other portions of the large page and its network dataset still contain legacy allegations and need verification.

## Independently published evidence
- **Firsthand contemporary interview**: Moneyweb, 1 June 2007, *Helen Zille: Leader, DA and Cape Town mayor*, which transcribes Zille's acknowledgement of board service: https://www.moneyweb.co.za/archive/helen-zille-leader-da-and-cape-town-mayor/
- **Government institutional biographical record**: South African Government, *Helen Zille, Ms*, which separately records Open Society Foundation membership; a government biography corroborates the affiliation but does not supply trustee transaction records: https://www.gov.za/about-government/contact-directory/helen-zille-ms
- **Historical foundation record**, already identified in the investigation: OSF-SA September 1997 newsletter, archived at Stellenbosch University. Its historical board roster should be reconciled with exact appointment and departure dates before stronger person-level conclusions.

The interview and official biography originate from distinct actors and support the affiliation; neither provides a basis for assigning motive or a donor-controlled policy chain.

## Preservation and release gates
Exactly one visible source paragraph was edited. All pre-existing links retained in the same order; additional government URL was inserted. Inline and external JavaScript, three-dimensional node/edge data, styles, SVGs, imagery, embedded media and element IDs were compared before writing and were unchanged. Source-only correction is pinned to exact old/new blobs in dossier CI. Rooivalk and the two CitizenIntel repositories are untouched.

Still **OPEN**: verify every graph edge, grant disbursement and recipient, board minutes/terms, historical articles cited by the page, and full desktop/mobile, hover/focus, keyboard/screen-reader and uncached live-content parity. Do not infer full release certification from a passing source-edit CI run.
