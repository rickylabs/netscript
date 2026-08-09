# Drift: #1373

## 2026-08-09 — live issue has 12 acceptance rows

The dispatch summarizes eight rows, while the live issue contains four additional close-gated
rows: zero unresolved aliases in code samples, a focused non-default CLI test, and two negative
docs gates. This is minor scope clarification, not product rescope; all 12 remain required for the
closing PR.

## 2026-08-09 — published source count refined from 208 to 192

The initial shell count excluded selected private directories by name. The durable gate correctly
excludes every underscore-prefixed directory and reports 192 actual publishable `.md`/`.vto`
sources. The plan and evidence use 192; no content scope changed.
