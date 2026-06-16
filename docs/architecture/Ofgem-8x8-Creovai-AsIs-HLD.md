# 8x8 Telephony Solution with Creovai — AS-IS (HLD)

**Notation:** ArchiMate 3.x · three layers only — Business (yellow), Application (blue), Technology (green).
**Status:** Draft for TDA review · **Date:** 2026-06-16

---

## Diagram

![As-Is HLD](diagrams/as-is-hld.png)

> Source: [`diagrams/as-is-hld.puml`](diagrams/as-is-hld.puml)

## The 5 boxes

| Box | Layer | Notes |
|-----|-------|-------|
| **Users (c.208)** | Business | Delivery & Schemes / IT Service Desk. |
| **Microsoft Teams** | Application | Telephony, presence, click-to-dial *within* Teams (enabled users). |
| **8x8** | Application | **System of record** — telephony, recordings, metadata. |
| **Creovai** | Application | Downstream analytics: conversation intelligence, agent guidance, dashboards. |
| **Microsoft Entra ID** | Technology | SSO authentication. |

## How it links (the only flows that matter)

- **Entra ID → 8x8 and Teams (SSO).** Azure governs **access only**.
- **Teams → 8x8 (integration).** Telephony surfaced inside Teams.
- **8x8 → Users (telephony).** Calls, voicemail, recordings.
- **8x8 ⟷ Creovai (HTTPS / JSON, in / out).** A **single** integration path.

## Correctness (key points)

- **Creovai integrates only with 8x8 — not Azure.** Only 8x8 connects to Azure.
- **8x8 is the single system of record**; all downstream data originates from 8x8.
- **Entra ID governs identity/access for 8x8 and Teams only** and does not touch Creovai.

---

*Detail-level views (layered, data-flow) were removed to keep the HLD to a single,
simple picture. To regenerate the PNG: `java -jar plantuml.jar -tpng diagrams/as-is-hld.puml`.*
