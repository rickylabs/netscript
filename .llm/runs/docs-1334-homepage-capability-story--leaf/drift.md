# Drift Log: homepage capability story

This log is append-only.

## 2026-08-10 — Existing light-theme accent contrast belongs to #1277

- **What:** Browser validation measured the existing global light-theme accent link at about
  3.41:1 and optional card eyebrows at about 3.56:1 for normal-size text.
- **Source:** Playwright WCAG contrast probe at 390px/light before the final markup adjustment.
- **Expected:** The leaf brief asked for contrast validation without taking on #1277 or editing CSS.
- **Actual:** The existing global token has a #1277-owned contrast shortfall. This leaf omitted
  optional eyebrows and used the existing `ns-md-link` treatment for its new adjacent task links;
  its owned text now measures at least 6.80:1 light and 7.48:1 dark. L1/global links were not edited.
- **Severity:** minor (pre-existing site-system debt; no new component/CSS debt introduced).
- **Action:** defer the global token correction to #1277; preserve this leaf's passing owned surface.
- **Evidence:** six Playwright matrix rows and screenshots under `.llm/tmp/docs1334-*.png`;
  `docs/site/styles/docs.css:47`; PR #1442 slice 2.5 comment.
