# Alt Afrikaner article publishing categories

Use the existing premium article layout and the exact original cover provided for each new publication. Do not substitute generated or stock imagery without explicit permission.

## Categories

Each article may have multiple topic tags:
- `opinion` — editorials and commentary
- `politics` — government, regulation and policy
- `technology` — networks, communications and digital infrastructure
- `international` — foreign relations, global networks and diaspora coverage
- `history` — Afrikaner and Southern African history and heritage

The article archive's `data-tags` attribute lists relevant tags separated by spaces, and the left drawer links to `articles/index.html?category=<tag>`. When creating or revising an article, update its archive card's tags and its own metadata together. Do not categorise by a person's ethnicity or presumed views.

## Publishing checklist

1. Preserve supplied text and apply only requested editorial revisions.
2. Place the approved original cover under `assets/articles/` and reference that asset on the article, homepage card and listing.
3. Add `og:image`, descriptive alt text and a canonical URL; run `node scripts/check-article-covers.mjs`.
4. Put new article cards in `articles/index.html` with relevant `data-tags`. Only feature a story on the homepage if intended.
5. Maintain the shared editorial masthead and responsive drawer; do not duplicate the navigation or use the reference publication's branding.
6. Run automated checks and verify contrast, mobile layout, links and 3D interactions before merging.
7. MailerLite newsletter signup is not connected; do not present a fake collection form or promise automatic email delivery until the external service is configured.
