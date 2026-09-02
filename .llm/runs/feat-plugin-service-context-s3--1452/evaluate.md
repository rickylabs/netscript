# Evaluation: #1452 Slice 3 — plugin service host context seam (PR #1944)

Formal IMPL-EVAL. Written by a fresh, separate, opposite-family session; no product or source
edits were made by this session.

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-s3--1452` |
| Target | `packages/plugin` public SDK host context (`@netscript/plugin/sdk`) |
| Archetype | `4 — Public DSL / Builder` (doctrine file 10 assignment; not re-split) |
| Scope overlays | none |
| PR | #1944 `feat(plugin): publish reusable PluginServiceContext host factory` → `main` |
| Evaluated commit | `8cd55070d359489303fcfc41696219ad8b1d15ba` (PR head `headRefOid` matches local `HEAD`) |
| Baseline | `origin/main` @ `850cc7757d11d420b9061dbe6a61536357ab77fe` |
| Branch commits | `18ace6ac3` feat(plugin): complete service context host factory · `8cd55070d` chore(harness): record carrier verification |
| Evaluator requested route | `formal_impl_evaluation` → native opposite-family **Claude · Fable 5 · medium** for Codex-authored work (`lane-policy.md` L46) |
| Evaluator observed identity | Claude Code session, model `claude-fable-5-1` (Claude Fable 5.1), Anthropic; fresh session in worktree `/home/agent/projects/netscript/worktrees/007-leaf-1452-s3`, 2026-09-02. Effort is session-configured and not externally attested; reasoning trace and real tool calls were used for every gate below. |
| Generator identity (from `supervisor.md`) | Codex · OpenAI · GPT-5 supervisor, GPT-5.6 Sol implementation session — opposite family to this evaluator; generator ≠ evaluator invariant holds |
| Date | 2026-09-02 |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | `PASS` | `plan.md` opens with a justified `PLAN-EVAL: N/A` (contract fully determined by live issue, owner ruling, doctrine 07/11); recorded before the implementation row in the worklog progress log |
| Design section exists in worklog | `PASS` | `worklog.md` § Design: Public Surface / Domain Vocabulary / Ports / Constants / Commit Slices / Deferred Scope / Contributor Path |
| Commit slices match design plan | `PASS` | Design names one slice; branch has one product commit `18ace6ac3` plus one run-artifact commit `8cd55070d` |
| Each slice has a passing gate | `PASS` | Worklog gate table (all final rows exit 0 except the two inherited baseline-red doc-lint/JSR rows, A/B delta 0); independently re-run below |
| Supervisor slice review before sign-off | `PASS` | Worklog row "supervisor review" precedes "full gates" and the commit; implementer did not self-certify |
| Implementation brief carries `## SKILL` | `PASS` | `implement.md` has a `## SKILL` chapter (harness, doctrine, deno-toolchain) |
| No speculative seams (unused files) | `PASS` | Diff adds one test file and extends two source files; every new symbol (`getAppsettings`, `getEnvironment`, `appsettings`) is consumed by the factory, the factory test, and auth |
| Constants used for finite vocabularies | `PASS` | No new finite-domain string dispatch introduced; the three plugin names in the consumer test are the issue's explicit subjects, not a registry |
| Commit trail on PR | `PASS_WITH_NOTE` | PR #1944 commit list is live (2 commits). No per-slice PR comment exists; the owner's non-draft, open-after-implementation contract is recorded in `drift.md`, so the run dir is the trail. Not blocking. |

## Acceptance-by-acceptance verdict (live issue #1452 rows)

| Row | Verdict | Evidence |
| --- | --- | --- |
| 1. Generic factory covers lazy DB/KV, contracts, logger, env, appsettings | `PASS` | `packages/plugin/src/sdk/runtime/plugin-service-context-factory.ts:108` `createPluginServiceContext` assembles `db.getClient` (memoized via `memoizeAsyncResolver`), `kv: new LazyPluginServiceKv(...)` (resolver memoized inside the class constructor), `contracts.base = baseContract`, `logger = createPluginLogger(pluginName)`, `env`, `appsettings`. `plugin-service-context.ts:21` adds `readonly appsettings?: unknown`. `deno doc --filter createPluginServiceContext packages/plugin/src/sdk/mod.ts` shows the published async signature with all four resolvers documented. Test `createPluginServiceContext resolves assembly values once and adapters lazily` asserts db/kv resolutions are 0 before and after `await`, become exactly 1 after two concurrent uses, and appsettings/env resolutions are exactly 1 before the context promise settles. |
| 2. DB adapter and environment override points | `PASS` | Required `getDatabaseClient` seam unchanged; new optional `getEnvironment?: () => Promise<Readonly<Record<string,string>>>` with default `Deno.env.toObject()` only when the resolver is absent (`?? Promise.resolve(Deno.env.toObject())`). Tests: injected env is returned by identity (`assertStrictEquals(context.env, environment)`); separate test `captures Deno.env by default` proves the compatibility default and `appsettings === undefined`. Consumers merge `{ ...Deno.env.toObject(), ...ctx.env }` (auth `init.ts:28`, sagas `main.ts:55`), so an injected environment overrides process env end-to-end. |
| 3. Genuine generated-consumer workers/auth/sagas boot-to-ready proof | `PASS` | `plugin-service-context-generated-consumer_test.ts`: copies the **unchanged** CLI template `packages/cli/src/kernel/assets/plugins/service-context.ts.template` verbatim to a generated `services/_shared/plugin-service-context.ts` path under a temp dir inside `plugins/auth/`, writes a stub `database/mod.ts`, opens in-memory Deno KV, dynamically imports the generated module, then for each of workers/auth/sagas calls the real default-export service factory (`plugins/*/services/src/main.ts`, which go through `createPluginService(...).serve()` → `Deno.serve` in `packages/service/src/builder/service-listener.ts:115`), asserts `addr.transport === 'tcp'`, `addr.port > 0` (a real bound ephemeral listener), `/health` → 200 `{status:'healthy'}`, then `stop()`s all three in `finally`, closes KV, restores the four env keys, removes the fixture. This is a real start/ready/stop lifecycle, not an object-shape check. Independent run: 3 passed, 0 failed (command below). |
| 4. CLI scaffold delegates to the public seam | `PASS` | `service-context.ts.template` imports `createPluginServiceContext as createHostPluginServiceContext` from `@netscript/plugin/sdk` and delegates with `{ getDatabaseClient, getKv }`; no `LazyPluginKv` body. `git diff origin/main...HEAD --stat -- packages/cli` is empty (CLI untouched, as row 4 was already shipped in #1842). Row 3's test consumes this exact template, so delegation is proven at runtime as well as by the existing CLI generator string test. |

### Specific challenge checks requested by the brief

| Check | Result | Evidence |
| --- | --- | --- |
| DB/KV remain lazy and memoized | `PASS` | Factory source (`memoizeAsyncResolver`, `LazyPluginServiceKv`) unchanged in semantics; factory test counts 0→1 under concurrent access |
| appsettings/environment resolve once during assembly | `PASS` | `Promise.all([getAppsettings?.(), getEnvironment?.() ?? Deno.env])` runs exactly once inside the async factory; test asserts count 1 before the context promise is awaited and still 1 after |
| No concrete plugin dependency on KV/config/Aspire | `PASS` | Factory imports only `@netscript/contracts`, `../../../loader.ts`, and the local type; the only `@netscript/kv` mention is inside the JSDoc example. `packages/plugin/deno.json` unchanged. |
| `packages/plugin/deno.json` and `deno.lock` unchanged | `PASS` | `git diff origin/main...HEAD -- packages/plugin/deno.json deno.lock` = 0 lines; SHA-256 `defff7d1…549c` and `e52c167e…c46d` match the pre-work hashes recorded in `research.md` |
| Auth narrows opaque settings safely | `PASS_WITH_NOTE` | `plugins/auth/services/src/init.ts` now accepts the generic `PluginServiceContext` and narrows `appsettings` through `isAuthServiceAppsettings` (structural checks on both `auth`/`Auth` groups, optional string backend, audit salt, string-record environment) with no cast. **Note M1:** the sibling `hasAuthAppsettings` guard in `plugins/auth/services/src/main.ts:102` (`'appsettings' in ctx`) is pre-existing and remains unsound now that the base declares `appsettings?: unknown`; see Findings. |
| Consumer test starts real services | `PASS` | See row 3; `RunningService.addr` comes from `Deno.serve`'s `onListen` |
| Test file not published | `PASS` | `deno publish --dry-run` listing includes `plugin-service-context-factory.ts` and `plugin-service-context.ts` and no `src/sdk/**/*_test.ts`; the cross-package relative imports in the test therefore create no published dependency edge |

## Static Gates (independent re-run, this session)

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| Focused tests (factory + generated consumer) | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin/src/sdk/runtime/plugin-service-context-factory_test.ts packages/plugin/src/sdk/runtime/plugin-service-context-generated-consumer_test.ts` | 0 | 3 passed, 0 failed, 0 ignored, 3 total (833 ms) |
| Full package tests | `run-deno-test.ts -- --allow-all packages/plugin` | 0 | 97 passed, 0 failed, 0 ignored, 97 total |
| Type-check `packages/plugin` | `run-deno-check.ts --root packages/plugin --ext ts,tsx` | 0 | 158 files, 2 batches, 0 diagnostics |
| Type-check `plugins/auth` | `run-deno-check.ts --root plugins/auth --ext ts,tsx` | 0 | 39 files, 0 diagnostics |
| Type-check `plugins/sagas` (not in worklog; added to challenge base-type change) | `run-deno-check.ts --root plugins/sagas --ext ts,tsx` | 0 | 87 files, 0 diagnostics |
| Type-check `plugins/workers` (not in worklog; added) | `run-deno-check.ts --root plugins/workers --ext ts,tsx` | 0 | 103 files, 0 diagnostics |
| Lint `packages/plugin` / `plugins/auth` | `run-deno-lint.ts --root <r> --ext ts,tsx` | 0 / 0 | 158 / 39 processed, 0 findings each |
| Format `packages/plugin` / `plugins/auth` | `run-deno-fmt.ts --root <r> --ext ts,tsx` | 0 / 0 | 158 / 39 processed, 0 findings each |
| Doc lint (publish bar) | `run-deno-doc-lint.ts --root packages/plugin --pretty` | 1 | combinedTotal 15, all `privateTypeRef`, 0 missing-JSDoc, 0 other; `./src/sdk/mod.ts` entrypoint exit 0. Matches the worklog's `origin/main` count of 15 → delta 0; the changed SDK entrypoint contributes no diagnostic |
| Publish dry-run | `deno publish --dry-run --allow-dirty` (cwd `packages/plugin`) | 0 | `Success Dry run complete`; no `_test.ts` under `src/sdk` in the file listing |
| Quality gate | `deno task quality:gate` (scan + nested `arch:check`) | 0 | Passed; only pre-existing WARN/INFO doctrine-readiness rows on unrelated files |
| MCP export corpus carrier | `deno task check:mcp-export-corpus` | 0 | 35 packages, 273 subpaths, 7816 symbols, SHA `628133…5d7c` — matches committed corpus and worklog |
| Whitespace | `git diff --check origin/main...HEAD` | 2 | Four "new blank line at EOF" hits, all in `.llm/runs/.../{implement,plan,research,supervisor}.md`; zero in product files (see L5) |
| Any / cast scan on changed files | `grep -n "as unknown as\|: any\|as any\|deno-lint-ignore"` over the 4 changed TS files | 1 (no match) | No new suppressions or casts introduced |
| Working tree | `git status --short` after all runs | — | clean; no leftover `plugins/auth/.generated-service-context-*` fixture |
| PR CI at evaluation time | `gh pr checks 1944` | — | `code-quality` pass, `quality` pass (2m53s), `close-gate` pass, `build` pass, classify jobs pass; **`check-test` still pending**; scaffold/e2e lanes skipped by path filter |

Not run by this session, per the brief: Aspire, Docker, browser, `e2e:cli`; no dependency or lock mutation.

## Fitness Gates (Archetype 4 applicable set)

| Gate | Function | Result | Evidence |
| --- | --- | --- | --- |
| F-1 | File-size lint | `PASS` | Factory 170 lines; new test 107 lines; `arch:check` no new F-1 row for touched files |
| F-2 | Helper-reinvention scan | `PASS` | Uses `Promise.all`, `Deno.env`, `@std/path` `toFileUrl`, `Deno.makeTempDir`; no local reimplementation |
| F-3 | Layering | `PASS` | `sdk/runtime` imports `@netscript/contracts`, package `loader.ts`, local type only |
| F-4 | Inheritance audit | `PASS` | No new class hierarchy; `LazyPluginServiceKv` unchanged |
| F-5 | Public surface audit | `PASS` | Two documented public symbols moved; `deno doc` renders full JSDoc + example; corpus symbol count unchanged (7816) |
| F-6 | JSR publishability | `PASS_WITH_BASELINE` | Dry-run exit 0; 15 inherited private-type diagnostics unchanged (sanctioned `--allow-slow-types` carve-out package) |
| F-7 | Doc-score | `PASS` | Worklog: `docs:readme-fences` exit 0 at baseline 7; `docs:jsdoc-examples` exit 0, deferred `unboundName=116` unchanged (not re-run; corpus carrier check re-run green) |
| F-10 | Test-shape audit | `PASS` | Exact counts 3/3 focused and 97/97 package; consumer test is lifecycle-shaped (start → ready → stop) |
| F-14 | Console-log lint | `PASS` | No new console usage in diff |
| F-15 | Re-export-of-upstream | `PASS` | No new re-export |
| F-19 | Scoped source gate runners | `PASS` | All check/lint/fmt evidence above from the structured wrappers |
| F-8/F-9/F-11/F-12/F-13/F-16/F-17/F-18 | — | `N/A` | Not affected by this diff; `arch:check` exit 0 |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Hosted runtime / Aspire / `e2e:cli` | owner-prohibited for this slice | `N/A` | Plan § Fitness Gates; brief |
| Real listener boot | generated-consumer test | `PASS` | Three `Deno.serve` listeners bound on ephemeral TCP ports, `/health` 200 healthy, stopped |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| CLI template (`service-context.ts.template`) | consumed verbatim at generated path | `PASS` | Row 3 test |
| `plugins/workers` | boot via generic context | `PASS` | Row 3 test; scoped type-check 0 diagnostics |
| `plugins/auth` | boot + structural appsettings narrowing | `PASS_WITH_NOTE` | Row 3 test; `init.ts` guard; note M1 |
| `plugins/sagas` | boot via generic context | `PASS` | Row 3 test (`NETSCRIPT_SAGA_STORE=kv`); scoped type-check 0 diagnostics |
| MCP export corpus | carrier regenerated | `PASS` | `check:mcp-export-corpus` exit 0 |

## Anti-Pattern Check

| AP | Status | Evidence |
| --- | --- | --- |
| AP-7 (positional/option sprawl) | `CLEAR` | Single `resolvers` options object extended with two optional readonly fields |
| AP-8 (container) | `CLEAR` | Plain factory; no registry/container |
| AP-11 (hidden global read) | `CLEAR` | `Deno.env.toObject()` remains only as the documented compatibility default when no resolver is injected |
| AP-14 (upstream re-export / concrete dep) | `CLEAR` | No config/KV/Aspire import; manifest unchanged |
| AP-23 (composition outside named root) | `CLEAR` | Assembly stays in `createPluginServiceContext` |
| AP-25 (module-load side effect) | `CLEAR` | All resolution inside the factory call / test lifecycle |
| others | `N/A` | Outside the touched surface |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | `arch-debt.md` not in diff; `arch:check` exit 0 |
| Resolved entries | 0 | — |
| Deepened violations | 0 | Builder-size / AST-extractor entries untouched |
| Unrecorded violations | 0 | None found; M1 below is a soundness gap in pre-existing consumer code, not a doctrine AP |

## Findings (ordered by severity)

| # | Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- | --- |
| M1 | medium (non-blocking) | The auth audit-salt path still narrows opaque appsettings with an unsound presence guard. `hasAuthAppsettings` (`plugins/auth/services/src/main.ts:102`) asserts `ctx is AuthPluginServiceContext` from `'appsettings' in ctx`; now that the base contract declares `appsettings?: unknown`, any host value with that key is treated as the typed auth shape and `serviceAuditSalt` reads `.auth.audit.salt` from it unvalidated. The PR's new structural guard in `init.ts` does not cover this path, so the same plugin narrows the same value two different ways. Impact is limited to a malformed appsettings document yielding a non-string salt; the env var `NETSCRIPT_AUTH_AUDIT_SALT` takes precedence and backend selection uses the safe guard. | `main.ts:95-104`; `init.ts:35-38`; PR drift entry claims auth "validates/narrows structurally" | Follow-up (not this PR): reuse the `init.ts` narrowing for `serviceAuditSalt`, or export `serviceAppsettings` from `init.ts` and delete `hasAuthAppsettings`. Track as a small issue on `area:auth`. |
| L1 | low | Sagas performs the same class of unsound narrowing via a pre-existing intersection cast (`ctx as PluginServiceContext & { appsettings?: SagaServiceContextSettings ... }`, `plugins/sagas/services/src/main.ts:128-133`). Unchanged by this PR and out of its scope; compiles clean. | scoped check 0 diagnostics | Same follow-up as M1 if a plugin-side hardening pass is opened. |
| L2 | low | The readiness probe uses in-process `running.app.request('/health')` rather than an HTTP fetch to `running.addr`. Bind is nonetheless proven by `addr.port > 0` from `Deno.serve`'s `onListen`, so "boot-to-ready" is satisfied; a socket-level fetch would be marginally stronger. | consumer test lines 65-71 | Optional hardening; no action required. |
| L3 | low | The test fixture is created inside `plugins/auth/` (`.generated-service-context-*`) and is not gitignored; cleanup relies on `finally`. A hard-killed test run would leave `.ts` files that scoped wrappers and `deno check` would select. Clean in all runs this session. | `git status` clean; `.gitignore` has no pattern | Optional: add the prefix to `.gitignore` in a later hygiene PR. |
| L4 | low (process) | PR #1944 body omits the netscript-pr template's `## Scope`/`## Slices`/`## Harness`/`## Definition of Done` sections; it uses `## Summary` / `## Acceptance audit` / `## Validation`. Close-gate passes because there are no unchecked boxes, and the owner's non-draft PR contract override is recorded in `drift.md`, but there is no checkable DoD for the ready-merge bar (skill rule 2). | PR body; `check-close-gate.ts` `isAuthoritativePrSection` | Coordinator may add a short checked DoD before `status:ready-merge`; not required for this verdict. |
| L5 | low | `git diff --check` reports trailing blank lines at EOF in four run-artifact Markdown files; worklog records `git diff --check` exit 0 (scope was evidently product files only). | command exit 2, four `.llm/runs/...` hits | Cosmetic; fix opportunistically. |
| I1 | info | CI `check-test` job was still pending at evaluation time; `quality`, `code-quality`, `close-gate`, `build` were green. Local equivalents (scoped check/lint/fmt, 97/97 tests, quality gate) all passed in this session. | `gh pr checks 1944` | Confirm `check-test` green before `status:ready-merge`. |
| I2 | info | Worklog type-checked only `plugins/auth` among consumers after the base contract change; this session additionally checked `plugins/sagas` and `plugins/workers` (0 diagnostics each). Evidence gap closed, no defect. | Static gates table | none |

No blocking finding. No `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` condition is met.

## `Closes #1452` and the plain-bullet / no-mirror-block decision

- **All four live acceptance rows are satisfied with file/symbol/test evidence above**, so the PR
  body's `Closes #1452` is justified. The issue is not an epic/umbrella (`type:feat`, no
  `type:umbrella`), so a closing keyword is the correct form.
- **No `acceptance-evidence` block is correct.** Issue #1452's `## Acceptance` section is four plain
  bullets, not Markdown checkboxes (verified live via `gh issue view 1452`). Per `netscript-pr` §
  Merge close-gate, only Markdown checkboxes are close-gated and mirrorable; a plain-bullet
  Acceptance section "has no mirrorable targets and therefore takes no `acceptance-evidence`
  block". Inventing `box-index` entries would fail the mirror's mapping validation. The CI
  `close-gate` job on this head passes for the same reason. The alternative (convert the issue
  bullets to checkboxes and add a block) is a valid owner choice but not required; the PR body's
  numbered "Acceptance audit" plus this verdict serve as the linked evidence the coordinator checks
  before closing.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Widening a base context field to `unknown` invalidates every downstream presence-based type guard (`'key' in ctx`) — audit all consumers' guards, not only the ones that fail to compile | Consumer soundness after base-contract widening | Archetype 4/5 base seams | high |
| Materializing an unchanged CLI template at its real generated path inside a workspace package gives a cheap, honest consumer boot proof without a scaffolded project | Generated-consumer proof | Archetype 5/6 | medium |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **`PASS_WITH_NOTES`** (harness vocabulary: `PASS`) |
| Rationale | Approved scope is complete: all four #1452 rows are shipped with independent evidence; DB/KV are lazy and memoized while env/appsettings resolve exactly once; the base package took no concrete KV/config/Aspire dependency; `packages/plugin/deno.json` and `deno.lock` are byte-identical to baseline; the consumer test starts, readies, and stops the real workers/auth/sagas listeners through the unchanged CLI template; every static, fitness, quality, and carrier gate re-run green or at an unchanged inherited baseline; no debt introduced or deepened. Notes M1/L1–L5 are non-blocking follow-ups, chiefly the pre-existing unsound `hasAuthAppsettings` guard in auth `main.ts` that this widening makes reachable. |
| Merge readiness | Supports `Closes #1452`. Before `status:ready-merge`: confirm CI `check-test` is green (I1); optionally add a checked DoD to the PR body (L4). |
