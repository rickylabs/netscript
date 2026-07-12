**[dashboard-rescope v2] Tightening addendum (owner-ratified 2026-07-06, run `dashboard-rescope--seed`):** append to non-goals —

**Non-goals.** This is a correlation/export API, not a display surface. It MUST NOT ship any UI, and its dashboard consumer (#413) uses it only to resolve a `traceId` for out-linking to Aspire — never to ingest OTLP for in-dashboard rendering. Do not invent parallel span/attribute names outside the #402 TC-1..14 vocabulary.
