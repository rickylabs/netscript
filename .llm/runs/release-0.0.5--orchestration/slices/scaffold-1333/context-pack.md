# Context Pack: #1333

Branch `feat/default-app-reference-quality` starts at `origin/main@35358886a`. This turn is plan
only. The selected design upgrades the existing generated service example instead of adding a new
parallel exemplar, derives omitted app names as `<project>-web`, preserves the generated-DB-schema
to versioned-contract seam, and adds semantic golden plus browser/runtime coverage.

Rows 1, 4, and 7 are substantially present and need preservation/evidence. Rows 2, 3, 5, 6, 8,
and 9 contain the substantive implementation delta. Row 10 is observational: deterministic tests
cannot prove agent adoption, and #1090 already owns the controlled six-agents-per-arm experiment.
The owner must decide that relocation before implementation/closure. The plan therefore opens a
draft PR with `Refs #1333`, not a closing keyword.

The owner approved option A and authorized implementation on 2026-08-09 after moving row 10 to
#1090. No Aspire/container work or serialized runtime grant exists.

S1 is implemented and locally green: the omitted-name pre-fix run failed with actual `dashboard`,
the explicit-name control stayed green, and the final focused suite passed 14/14. Scoped
check/lint/fmt and the package quality scan exit 0. Package doctrine exits 1 with the exact same
50 failures / 51 warnings / 1 info finding as a detached `origin/main` archive; S1 adds no finding.

S2 replaces init's global `lib/example-service.ts` with resource-owned `(_lib)/service-query.ts`
and `route-contract.ts`; the old-shape golden failed pre-fix and the final focused suite passes.
The service-add command deliberately continues writing the #1373 golden-path
`apps/<app>/lib/<service>.ts` from the same template.

S3 composes typed route/search state, auth and showcase resources, layers, a managed form,
telemetry, partial navigation, QueryIsland hydration, four query states, and optimistic rollback in
the canonical generated service route. Fresh memory and DB workspaces type-check at 108 and 117
selected files respectively. Deliberate rollback, invalid-form, and success-form mutations each
produce focused red evidence.

S4 promotes the typed canonical route and living design references without deleting the independent
CRUD or telemetry examples. Home and navigation links use `appRoutes.design` and
`appRoutes.designComposition`; app guidance discovers the new contract/form/auth/resource seams.

S5 adds deterministic preview states for browser acceptance, a real headless-browser runtime gate
at desktop and mobile viewports, project-derived runtime app identity, and an executable generated
`no-explicit-any` lint rule. The browser gate rejects the old unmarked service page. A fresh memory
consumer checks and lints 108 selected files; a fresh Postgres consumer with locally generated
Prisma/Zod output checks 112 product files. The real AppHost/browser verdict remains token-gated.

S6 non-Aspire evidence is green. The app-template total is 176,362 bytes (197,796 cap), the CLI
embedded barrel is 294,190 bytes (330,000 cap), and the unchanged MCP docs corpus is 253,535 bytes /
12 documents (262,144 cap). Full CLI tests pass 680/680. Assets, published specifiers, CLI doc lint,
package/root publish dry-runs, scoped quality, and aggregate quality gates pass. Package doctrine
retains its pre-existing 50/51/1 debt set; the expanded runtime gate registry is recorded in drift.
The one-pass AppHost/browser verdict and closure keyword remain pending the serialized grant.

The serialized grant was recorded as ledger row 70 at orchestrator commit `78000169a`. The one
authorized execution at feature head `2150421e4` ran once and exited 1: 16 passed / 1 failed / 2
expected `DEFERRED` skips / 19 total steps. `behavior.project-boundary-dev` targeted its stale
default `apps/dashboard` instead of S1's derived `apps/prod-local-test-web`; fail-fast meant
`behavior.app-reference` never executed, so it has no browser/WSL-interoperability verdict. There
were no run-owned leak survivors or manifest/lock changes, and the foreign Redis container owned by
`/home/codex/repos/w6-review-desk` was left untouched. No rerun is authorized. Row 9 and the closing
keyword remain blocked.

The gate-70 repair is implemented without a runtime rerun. Both fail-fast-hidden runtime probes now
require a caller-supplied app name and receive `generatedAppName(context)`. A sweep found and fixed
the same stale identity in the standalone clean-clone README probe, which now derives
`generated-readme-fixture-web`. The recurrence guard rejects both `apps/dashboard` and a bare
`appName = 'dashboard'` default across scaffold gate scripts while excluding unrelated Aspire
dashboard telemetry. Its deliberate-literal mutation exits 1 and clean recovery exits 0; focused
tests pass 20/20, scoped check/lint/fmt and `check:assets-barrel` exit 0. No AppHost/container gate
ran, and `behavior.app-reference` still has no verdict pending a fresh serialized grant.
