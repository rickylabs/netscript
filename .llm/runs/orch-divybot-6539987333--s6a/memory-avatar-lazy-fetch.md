# Avatar native lazy loading — 2026-10-31

Do not infer download behavior from CSS visibility alone. Chromium fetches a display:none eager
img but defers that same img with loading=lazy. A visible NS One lazy image still loads. The
previous proposal to add SSR theme context was unnecessary; the owner supplied the measurement.

The Playwright regression SSR-renders the actual registry Avatar through Deno, then serves its
markup and real stylesheet together on initial navigation. Mocked network routes count requests
rather than checking just the loading attribute. A visible control image proves network activity;
layout frames plus networkidle establish an observation window. Utility must request0photos,
NS One1; changing the same hidden Utility avatar to NS One must trigger its deferred request once.
Original source:4Utility failures(expected0/actual1),4legacy passes. With lazy:8passes0skips.

The SSR helper uses the existing preact-render-to-string range already in the locked test graph.
No new dependency/lock changes or theme API. Test is runnable standalone with external-server mode;
full matrix now60cases. Native lazy loading remains in normal SSR markup, not a test-only override.
