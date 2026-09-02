# IMPL-EVAL: move the oRPC family to stable 1.15.0 (#1879 / PR #1890)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `deps-orpc-family-1-15--1879` |
| Target | root `deno.json` catalog, 12 member manifests, `deno.lock`, scaffold dependency catalog, two SDK fixture imports |
| Head evaluated | `1914a38c6` (= PR #1890 head, verified via `gh api repos/rickylabs/netscript/pulls/1890`) |
| Base | PR diff measured against `main` @ `43376c506`; slice baseline `82a2527e2` |
| Archetype | N/A — dependency maintenance only |
| Scope overlays | none |
| Evaluator | separate opposite-family IMPL-EVAL session — Claude Code host, `z-ai/glm-5.3-flash` effort max (approved evaluator-lane model), 2026-09-01; generator lane was OpenAI GPT-5.6 Sol per `supervisor.md`, so no self-certification |
| Method | read-only over source; every exit captured as `out=$(cmd 2>&1); rc=$?`; worktree verified clean and lock hash `1796f71d…` unchanged after all gate runs |

## Central question — single-copy `@orpc/shared`: re-derived, CONFIRMED

| Evidence | Result | Exit |
| --- | --- | --- |
| `deno why @orpc/shared` | exactly one resolved copy `@orpc/shared@1.15.0`; all 15 dependency paths route through `^1.15.0` workspace specifiers | `DENO_WHY_REAL_EXIT=0` |
| Lock-derived package-key audit (`grep -oE '"@orpc/[a-z-]+@[0-9.]+' deno.lock \| sort \| uniq -c`) | 17 `@orpc/*` names, **exactly one key each, all `1.15.0`** | 0 |
| Any `1.14.x` key in the committed lock | **zero** (`grep -c '"@orpc/[^"]*@1\.14\.' deno.lock` → 0) | 1 (no match) |

The baseline two-copy claim is corroborated without a probe worktree: the branch-side lock diff
(`git diff 302409f0c9 80aaed97c -- deno.lock`) removes both `@orpc/shared@1.14.6_…` and
`@orpc/shared@1.14.7_…` keys (the latter reached the graph via `@orpc/otel@1.14.7`). The
`instanceof ORPCError` hazard the issue names existed at baseline and is gone at head.

## Verification 1 — no mixed versions: PASS

The 17 names, each with exactly one lock key at `1.15.0`: `client`, `contract`, `interop`,
`json-schema`, `openapi-client`, `openapi`, `otel`, `server`, `shared`,
`standard-server-aws-lambda`, `standard-server-fastify`, `standard-server-fetch`,
`standard-server-node`, `standard-server-peer`, `standard-server`, `tanstack-query`, `zod`.
Derived from the lock, not from a count. Zero mixed names.

## Verification 2 — family completeness: PASS

Independent repo-wide scan (`find … -name deno.json -exec grep -l @orpc`): **13 manifest files =
root catalog + 12 member manifests** — `bench`, `cli/e2e`, `cli/e2e/fixtures/desktop-native`,
`contracts`, `fresh`, `logger`, `plugin-ai-core`, `plugin-auth-core`, `plugin-workers-core`,
`plugin`, `sdk`, `service`. All 32 keys declare 1.15.0, with per-name manifest counts `client` 4,
`contract` 7, `openapi` 3, `otel` 1, `server` 12, `tanstack-query` 2, `zod` 3. The baseline
(`git grep '"@orpc/' 43376c506 -- '**/deno.json'`) has the **identical 32-key set**, so no member
was left behind. `plugins/triggers/deno.json` correctly carries no oRPC key (verified).

The run artifacts say "13 member manifests"; the actual split is 12 members + root = 13 files
(low finding 2). The substance — 32 keys, complete, no member behind — is correct.

## Verification 3 — frozen install: PASS

`deno ci` → `DENO_CI_REAL_EXIT=0`; `sha256sum deno.lock` identical before/after
(`1796f71d6ae62546…`); `git status --porcelain` empty after. The disclosed pre-merge hash
`b52dec2c…` is reconciled: the integration merge added exactly #1876's six streams-core member
entries to `deno.lock` (`git diff 80aaed97c 1914a38c6 -- deno.lock` = six
`jsr:@netscript/plugin-streams-core@0.0.6` lines and nothing else).

## Verification 4 — behavioural boundary held: PASS

`git diff --name-status 43376c506 1914a38c6` = exactly 21 paths, each in an allowed class:

| Class | Paths |
| --- | --- |
| Run artifacts | 7 (`supervisor.md`, `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `codex-thread-ids.md`) |
| Root manifest | `deno.json` (7 catalog keys) |
| Member manifests | 12 (version-only oRPC raises — content diff inspected line by line) |
| Lock | `deno.lock` |
| Scaffold dependency catalog | `packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts` — exactly the six `ORPC_*` constants, `^1.14.6` → `^1.15.0` |
| Fixture imports | `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` — exactly 2 lines |

No behavioral source file was modified. The lock's only non-oRPC delta is transitive upstream
fallout (`@opentelemetry/api-logs` and `@opentelemetry/instrumentation` 0.220.0 → 0.221.0, pulled
by `@orpc/otel@1.15.0`) — expected, disclosed in the worklog's lock lines.

## Verification 5 — the two fixture lines: PASS (judgment)

The fixture is a **type mirror**: it builds upstream query utils from exact-pinned
`@orpc/client` + `@orpc/tanstack-query` and asserts assignability to the SDK's own
`ServiceQueryUtils` port (line 41, `const sdkUtils: ServiceQueryUtils<typeof serviceContract> =
upstreamUtils;` — the load-bearing assertion).

- **History supports the coordinator ruling**: imports were `1.13.5` at creation (`82abaa6a1`),
  `1.14.6` at `6e2f66b95`, now `1.15.0` — the fixture has moved with the family at every bump. It
  tracks current-upstream compatibility; it is not a frozen oracle (an oracle would have stayed at
  `1.13.5` through the 1.14.6 move — it did not).
- **Raising preserves what the fixture tests** — upstream-compatibility of the SDK port at the
  version the workspace actually resolves — and was in fact *required*: exact `1.14.6` pins would
  have kept a second `@orpc/shared` copy in the lock, i.e. the hazard this issue exists to remove.
- **Enforcement path verified**: root `deno task check` covers `packages/**/*.ts` (the fixture is
  in the checked set); targeted `deno check --unstable-kv <fixture>` → `FIXTURE_CHECK_REAL_EXIT=0`.

## Verification 6 — the #1876 seam: PASS

`43376c506` touched six manifests; all six declare
`@netscript/plugin-streams-core: jsr:@netscript/plugin-streams-core@0.0.6`: `packages/cli/e2e`,
`packages/plugin-auth-core`, `packages/plugin-sagas-core`, `packages/plugin-workers-core`,
`packages/sdk`, `plugins/triggers`.

Both convergence-conflicted manifests are **exact key-level unions**, proven by diffing the merge
result against each parent: vs branch parent `80aaed97c` the only change is the added
streams-core line (#1876's intent); vs main parent `43376c506` the only change is the oRPC keys
raised to `^1.15.0` (#1879's intent). Both intents survive in
`packages/cli/e2e/deno.json` and `packages/plugin-auth-core/deno.json`.

## Gates re-derived at head

| Gate | Result | Evidence |
| --- | --- | --- |
| Stable authority `deno task deps:latest --filter '@orpc/*'` | PASS | `DEPS_LATEST_REAL_EXIT=0`; "0 behind / 7 total" — 1.15.0 is current stable |
| `deno why @orpc/shared` | PASS | `DENO_WHY_REAL_EXIT=0`; one copy at `1.15.0` |
| Lock no-mixed audit | PASS | 17 names, one key each (see Verification 1) |
| `deno ci` | PASS | `DENO_CI_REAL_EXIT=0`; lock hash unchanged |
| `deno task check` | PASS | `ROOT_CHECK_REAL_EXIT=0`; 3,006 files, 26 batches, 0 failed (matches worklog) |
| `deno task test` | PASS | `ROOT_TEST_REAL_EXIT=0`; **4,705 passed / 0 failed / 19 ignored**, 4,724 total, 306.9 s (matches the supervisor's disclosure) |
| `deno task publish:dry-run` | PASS | `PUBLISH_DRY_RUN_REAL_EXIT=0`; "Success Dry run complete" |
| `deno task arch:check` | PASS | `ARCH_CHECK_REAL_EXIT=0`; warning-only pre-existing debt (A13, F-5/F-6 `export default`) |
| Targeted fixture check | PASS | `FIXTURE_CHECK_REAL_EXIT=0` |
| Evaluator residue | PASS | `git status --porcelain` empty and lock hash `1796f71d…` after all gate runs |

## Process verification

| Check | Result | Evidence |
| --- | --- | --- |
| PLAN-EVAL before implementation | PASS | justified `PLAN-EVAL: N/A` recorded in `worklog.md` before implementation; the issue fixed target, scope, forbidden surfaces, invariant, and commands |
| Design checkpoint in worklog | PASS | § Design present (surface: none; vocabulary; constants; slice table) |
| Commit trail | PASS | PR #1890: `a0dc7fd44` (family move) + `80aaed97c` (integrated proof) + integration merge `1914a38c6`; implementation-summary comment present |
| Evaluator separation | PASS | generator OpenAI GPT-5.6 Sol (`supervisor.md`); this is a separate opposite-family session |
| Drift honesty | PASS | `drift.md` records the lock-only framing failure (attributed to the brief, confirmed by `deno update --lockfile-only` → "Updated 0 dependencies"), the key-level boundary correction, the fixture ruling, and the stale lock-key residue; investigation rows retained in the gate table |
| Non-scope prohibitions | PASS | no oRPC v2 adoption, no `Symbol.hasInstance` change, no #1351 work, no streams-core key touched by this slice, no test deleted/skipped |

## Findings

| Severity | Finding | Evidence | Disposition |
| --- | --- | --- | --- |
| medium | **Stale caret-pinned oRPC declaration literals remain outside the moved set, and the slice widens the gap between catalog and sibling generators.** `SCAFFOLD_APP_CATALOG` now says `^1.15.0` while these still say `^1.14.6`/`^1.14.7`: `packages/cli/src/kernel/templates/plugins/generate-plugin-deno-json.ts:11` (`ORPC_SERVER_SPECIFIER`), `packages/cli/src/kernel/templates/workspace/contracts/deno-json.ts`, `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts`, `packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts`, `packages/cli/src/kernel/constants/windows.ts`, `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin-copy_test.ts` (assertions), `packages/cli/e2e/fixtures/desktop-native/src/router.ts`, `packages/cli/e2e/src/adapters/native-desktop/fixture-workspace.ts`, `packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`, `packages/sdk/tests/client-contribution-observability_test.ts` (inline import), plus recorded `@orpc/otel` `1.14.7` data in `packages/mcp/tests/fixtures/telemetry/aspire-13.4.6-spans.json`. Before this slice catalog and generators agreed at `^1.14.6`; now they disagree. | repo-wide `@orpc` + `1.14` same-line scan; every occurrence is a caret range (or recorded telemetry data), so all resolve to the single locked `1.15.0` copy — the lock audit proves zero `1.14.x` keys, so **no hazard is reintroduced** | accept — outside the plan's declared scope ("direct stale oRPC dependency-catalog fallout in the scaffold catalog"), not test-forced, no behavioral or lock-graph effect today. Record for the next family move: the fallout enumeration must include generator templates/mutators/constants, e2e fixtures, and inline test imports, not only `SCAFFOLD_APP_CATALOG` + manifests |
| low | Run artifacts claim "13 member manifests"; the actual set is 12 member manifests + the root catalog (13 manifest files). | Verification 2 counts | note — substance (32 keys, complete) is correct; correct the wording on the next touch of `worklog.md`/`context-pack.md` |
| low | Disclosed test counts disagree by one: worklog "4,704 passed" vs supervisor/brief "4,705 passed". | `worklog.md` gate table vs brief disclosure | note — immaterial; independent re-run at this head settles it at **4,705 / 0 / 19** with exit 0 |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Dependency-family fallout enumeration must sweep every declaration-bearing surface: generator templates, mutators, constants windows, e2e fixture sources, inline test imports, and recorded telemetry fixtures — not only the catalog and member manifests. Caret-pinned survivors are invisible to the lock audit but resurface as catalog fallout on the next move. | caret-pinned literal desync between catalog and generators | dependency-maintenance runs (deps:* archetype) | medium |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | PASS |
| Rationale | The load-bearing proof was re-derived independently: `deno why @orpc/shared` shows exactly one resolved copy at `1.15.0`, and a from-the-lock audit of all 17 `@orpc/*` names finds one key each with zero `1.14.x` keys. Family completeness holds — the 32 manifest keys at head are the identical 32-key baseline set, all raised. `deno ci` is frozen (hash unchanged), the behavioural boundary held (21 paths, every one an allowed class; the six-constant catalog raise was the only source touch, and it is the declared dependency-catalog class), the two fixture raises are supported by the fixture's own tracking history and were required by the single-copy invariant, and the #1876 seam survives as an exact key-level union with both intents intact. Every disclosed gate was re-run with real captured exits and matches (test: 4,705/0/19). The one medium finding is a latent caret-literal desync outside the slice's declared scope that reintroduces no hazard and is dispositioned as a recorded follow-up. |

VERDICT: PASS
