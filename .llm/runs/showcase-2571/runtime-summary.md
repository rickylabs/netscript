# Northwind foundation runtime evidence

Native isolated Aspire + SQLite, local-source maintainer scaffold: PASS. Generated
project is `.llm/tmp/showcase-2571/northwind`, app shop-web, orders/Order. No fixed host
ports or source patches. Materialized generated dependencies, restored Aspire, started
the AppHost before database generation, then ran maintainer db init/generate/seed.
The generated service refreshed automatically and became healthy after generation.

Real Prisma/Zod generation and structured generated-workspace typecheck: SQLite182
files PASS; Postgres183 files PASS. Postgres generation used a non-live fixture URL;
no Postgres runtime claim. Public published-package verification remains release E2E.

Seed proof (`seed-proof.json`): initial six references, repeat seed, change NW-10248
status to held, seed again, still six rows and held preserved. Restored pending after
that assertion so screenshots show the untouched representative dataset.

`probe-northwind.ts` discovers shop-web through Aspire and asserts seeded fields in
SSR table/detail cells, excluding scripts. Real ready probe PASS on /records, / and
/records/6. Stopped the exact owned orders resource: unavailable probe PASS, normal
ready probe exit1 as required. Restarted orders, waited healthy, ready probe PASS.
`runtime-controls.json` records all six outcomes. Tests reject empty/unavailable HTTP200
shells, hydration-only rows, missing fields and stale rows in the service-down state.
The capability projection test verifies passed live-read states ready/empty/unavailable;
the actual Overview also changes from populated records to unavailable and back.

Browser matrix (`browser.json`):12 cases, Overview/Records/detail, light/dark and
1440x1000/390x844. Every case HTTP200, actual visible order/customer/country/status/amount,
no page errors, no horizontal overflow. Final screenshots are screens/round2/. Initial
visual failure retained in visual-eval-round1.md and screens/round1/. Revised table uses
the shipped ResponsiveTable with Northwind-only column/CSS composition; no shared CSS
or default-init output change. Shared CSS/publish budgets PASS (`css-budgets.json`);
preset CSS size/delta recorded in css-size.json. Final visual verdict is visual-eval.md.

Full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`: attempted,
exit1 at preflight.aspire; cleanup cannot enumerate Docker because no Docker daemon is
available. No suite AppHost was started. Full runtime remains UNPROVEN. This native
focused proof does not replace it and does not complete parent #2571's Docker, plugin,
auth, AI/MCP or full-showcase acceptance. No external-provider evidence is claimed.
