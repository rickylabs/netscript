# Plan — db-init reliability

## Archetype And Scope

- Primary archetype: Archetype 6 — CLI/tooling, because the failing public surface is `netscript db init` inside the scaffold runtime E2E flow.
- Secondary package concern: Archetype 2 — integration, because the durable fix likely lives in `@netscript/database`'s Prisma migration script exported through `./scripts`.
- Scope overlays: none.
- Public surface impact: no command vocabulary change and no new exported package entrypoint planned. The existing `@netscript/database/scripts` exported functions/types may receive behavior/doc updates only.
- JSR planned-surface scan: applied in `research.md`. No export-map, README, or file-list changes are planned; all changed exported functions/types must retain explicit annotations and JSDoc.

## Locked Decisions

1. Keep `db init` command shape stable: `db init --name init` remains supported and E2E continues to exercise it.
2. Fix in `packages/database/scripts/migrate.ts`; generated database wrappers already call the exported script surface and do not need changes.
3. Do not mask real schema/database errors. Only retry evidenced transient schema-engine/process lifecycle signatures: `ERR_STREAM_PREMATURE_CLOSE`, `Premature close`, and `Schema engine exited` from `schema-engine-windows.exe cli can-connect-to-database`, plus the script's own non-interactive child-timeout diagnostic after it kills a hung Prisma child.
4. Keep retries bounded with per-attempt diagnostics, capped exponential backoff, per-attempt timeout, and non-zero final exit when attempts are exhausted.
5. Prefer improving the existing migration-runner retry policy over introducing a new process framework.
6. Do not add a separate Postgres readiness gate in this slice. Current evidence shows Aspire waits for Postgres/database resources to become healthy and ready before Prisma starts.

## Open-Decision Sweep

- Exact residual transient signatures: resolved for this slice; see Locked Decision 3. Any new signature observed during reproduction is drift and requires plan update before it becomes retriable.
- Stdout capture: resolved; keep stderr classification for the approved error signatures and use Aspire resource logs/worklog for raw evidence.
- Generated `db:init` idempotent mode: deferred. Evidence shows the wrapper delegates to `@netscript/database/scripts`; no generated task change is required for the approved fix.
- CLI/generated wiring: deferred/out of scope for implementation unless a future PLAN-EVAL revision approves concrete files.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Retrying real schema errors hides defects | Unit tests for known non-transient Prisma errors; classifier is explicit and evidence-backed. |
| Retry budget still too low on cold Windows Prisma engine | Use observed run data; bounded attempt timeout and retry budget fit under the existing outer db-init operation timeout while surfacing final failure clearly. |
| Readiness gate duplicates Aspire behavior without value | Add only if raw error proves database accept/connectivity failure rather than schema-engine lifecycle failure. |
| Full `scaffold.runtime` loop is expensive | Use focused db-init loop for diagnosis, then prove with at least 5 full requested E2E passes when environment allows. |
| Pre-existing line-ending drift gets staged | Stage explicit paths only; never `git add -A`. |

## Gate Set

- Static package gates:
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/database --ext ts,tsx`.
  - `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/database --ext ts,tsx`.
  - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/database --ext ts,tsx`.
- Focused behavior gate:
  - `deno test --allow-all packages/database/tests/migrate-retry_test.ts`.
  - `deno test --allow-all --repeats=100 --fail-fast packages/database/tests/migrate-retry_test.ts` as a focused Deno 2.9 repeat/proof loop. Do not use `--retry` or `Deno.test({ retry })`; test-layer retry is forbidden because it masks the flake instead of fixing the application path.
- Public/JSR surface gates:
  - `deno doc packages/database/scripts/mod.ts` to verify the changed script surface.
  - `deno doc --lint packages/database/scripts/mod.ts` for F-7 script-surface doc lint.
  - `deno publish --dry-run --allow-dirty` from `packages/database` for F-6 package publishability and file-list evidence.
- Fitness gates:
  - Archetype 2 database package:
    - F-1 file-size lint: touched files remain under doctrine thresholds; record `wc -l` evidence.
    - F-2 helper-reinvention scan: retry helper encodes NetScript policy and test seam; no platform-primitive rename.
    - F-3 layering check: touched `scripts/` public utility surface remains isolated from adapters/application layering.
    - F-4 inheritance audit: no classes/extends in touched files; N/A by evidence.
    - F-5 public surface audit: `deno doc packages/database/scripts/mod.ts`.
    - F-6 JSR publishability: `deno publish --dry-run --allow-dirty` from `packages/database`.
    - F-7 doc-score/doc-lint: `deno doc --lint packages/database/scripts/mod.ts`.
    - F-8 workspace lib check: `packages/database/deno.json` retains `"deno.unstable"` in compiler lib and scoped check passes.
    - F-9 permission declaration check: touched script surface still requires subprocess/env/stderr permissions already exercised by package scripts; `Deno.Command.spawn()`/child kill are covered by the existing `--allow-run` script execution.
    - F-10 test-shape audit: focused retry tests cover transient/non-transient/idempotency policy.
    - F-11 forbidden-folder lint: no folder changes; existing `ports/`, `scripts/`, `tests/` names remain allowed.
    - F-12 naming-convention lint: no new files; touched file names already kebab/Deno test convention.
    - F-14 console-log lint: existing `runMigration()` uses caller-controlled `log` with `console.log` as the default CLI reporter. This is an existing script/CLI edge behavior; no new `console.*` calls are planned. Record grep evidence and do not add package-internal logging.
    - F-15 re-export-upstream lint: no upstream package re-export introduced.
    - F-16 folder-cardinality lint: no folder changes; touched folders stay within existing cardinality.
    - F-17 abstract-derived co-location: no abstract classes or derived classes in touched files; N/A by evidence.
    - F-18 sub-barrel lint: no new barrels; existing root `scripts/mod.ts` is a declared `./scripts` subpath export.
  - Archetype 6 CLI/tooling posture:
    - No product CLI files are planned for implementation, so A6/F-CLI structural gates are not rerun as product-code gates for this slice.
    - CLI command path is still proven through consumer/runtime validation: `scaffold.runtime` `database.init` runs `netscript-dev db init`, generated AppHost DB CLI mode, and generated database wrapper into `@netscript/database/scripts`.
    - If any `packages/cli/**` product file becomes necessary, the plan must be revised and PLAN-EVAL rerun with concrete A6/F-CLI gates.
- Consumer/runtime gates:
  - Current branch baseline: one local full `scaffold.runtime` run passed `database.init`, `database.generate`, and `database.seed`, then failed later at `runtime.aspire-start` with Aspire exit 2.
  - Final requested proof: `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, five consecutive passes if the local Aspire runtime environment allows it.
  - `scaffold.runtime` uses the custom E2E runner, not `deno test`, so Deno `--repeats` applies only to focused Deno tests; the full suite proof remains a shell loop.
  - If full-suite passes are blocked by non-db-init runtime environment failure, record exact drift and additionally run the db-init path in a tight loop against generated projects.
- Debt handling:
  - `.llm/harness/debt/arch-debt.md` `cli e2e — DEBT-2 db-init e2e flake` may be closed only after deterministic local + CI-ready evidence is recorded.

## Commit Slices

1. Research and plan artifacts.
   - Files: `.llm/tmp/run/fix-db-init-reliability/research.md`, `.llm/tmp/run/fix-db-init-reliability/plan.md`, `.llm/tmp/run/fix-db-init-reliability/worklog.md`, `.llm/tmp/run/fix-db-init-reliability/drift.md`, `.llm/tmp/run/fix-db-init-reliability/context-pack.md`, `.llm/tmp/run/fix-db-init-reliability/commits.md`, `.llm/tmp/run/fix-db-init-reliability/plan-eval.md`.
   - Gate: PLAN-EVAL PASS before product implementation.
2. Migration retry/readiness fix.
   - Files: `packages/database/scripts/migrate.ts`, `packages/database/tests/migrate-retry_test.ts`.
   - Gate: focused database test + scoped check/lint/fmt.
3. Runtime proof and closure artifacts.
   - Files: `.llm/tmp/run/fix-db-init-reliability/worklog.md`, `.llm/tmp/run/fix-db-init-reliability/drift.md`, `.llm/tmp/run/fix-db-init-reliability/context-pack.md`, `.llm/tmp/run/fix-db-init-reliability/commits.md`, and `.llm/harness/debt/arch-debt.md` only if DEBT-2 closure is earned.
   - Gate: five consecutive db-init/scaffold runtime passes or documented environment drift.

## Deferred Scope

- CLI prod-scaffold fixes (`@netscript/config` import map, exit codes, Windows path-sep).
- Broad Archetype 6 CLI restructuring.
- Database `ports`/composition-root doctrine debt unrelated to migration reliability.
- Dependency/version bumps unless required by direct evidence and approved by toolchain gates.
