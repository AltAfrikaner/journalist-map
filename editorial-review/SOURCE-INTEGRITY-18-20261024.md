# Investigation 18 — Rooivalk: concurrent cover correction and integrity reconciliation

**24 October 2026 (11:xx BST review).** This entry records **a user/concurrent main-branch visual edit**, not an evidence upgrade to the Rooivalk investigation. No modification to `MTNrooivalkIRAN.html` was made by this editorial branch.

- Latest `main` before editorial branch: `829c76f92055bbc63472472b71c282bdb4edc6f1`.
- Current protected Rooivalk HTML blob: **`303d26d3687f4e004f929559b86b30eb8b0e1947`**, **1,746,182 bytes**; earlier already-reviewed remote-cover version: `78ed6a7b7af2461465ca3e19f50f9b0a3af0249b`, 1,746,110 bytes. The original restored 2MB dossier also remains separately allowlisted.
- Direct content comparison of both blobs: the new version changes **only one cover-specific CSS style block, a feature-cover aspect-ratio rule and one cover image tag's presentation attributes**. The remote PNG `src` URL is unchanged. There are **2 original scripts, 3 SVGs and 14 image tags**, unchanged narrative paragraph arrays and unchanged element-ID arrays; scripts, SVGs and all embedded image payloads match. No research claims, graph data or publication URLs changed.
- `scripts/check-dossiers.mjs` adds **only the exact reviewed new Git blob** to the existing hash allowlist and extends its separate `>1,740,000`-byte minimum to the new version. Every other unexpected or zero/truncated update still fails CI. The previous large restored variants retain their `>2,090,000`-byte threshold.
- **UNVERIFIED external dependency:** the longevity, caching and accessibility of the current third-party CloudFront cover image. The archive no longer embeds that one image as originally restored; this is a durability concern, not evidence of missing narrative research.

**Status:** visual-only concurrent change safely reconciled for CI, **full Rooivalk claim-level editorial audit still OPEN**. Do not count the page as substantive completion. Device-level cover rendering and CDN fallback remain outstanding. The next claim-level editor must start from the exact current main blob and preserve the user's cover work.
