# IMPL-EVAL — fix-ui-add-data-screen-triad--0.0.7 — cycle 1

| Field | Value |
| --- | --- |
| Evaluator session | Separate native Fable 5 session (opposite-family to the Codex author; not the topic supervisor, not either plan evaluator) |
| Evaluator worktree | `/home/agent/projects/netscript/worktrees/007-eval-1357b`, branch `eval/impl-eval-1357-cycle-1` |
| Evaluated head | `7bc715b68` (Tier-A sign-off; product head `dbb62c065`; S2D evidence `b8846d6b3`) |
| Base | `de57fab0` |
| Remote identity | `origin/fix/ui-add-data-screen-triad` == `7bc715b68` (local == remote) |
| Prior gates | PLAN-EVAL c1 `FAIL_PLAN` `1a1a0d536`; PLAN-EVAL c2 `PASS_PLAN` `886f08607` — both verdict commits verified present |
| Method | Every supervisor claim re-derived with evaluator-run commands; red-befores rerun in detached scratch worktrees at the exact red SHAs; no result copied from author or supervisor reports |

## Verdict

**PASS_IMPL**

Product implementation, tests, and static/fitness/consumer evidence are sound and honestly
reported. The one REQUIRED gate still outstanding — supervisor-coordinated
`scaffold.runtime --cleanup` including the new `scaffold.ui-data-screen` gate — is correctly
recorded as `NOT_RUN`/queued-on-lease everywhere; nothing anywhere claims it passed. It remains a
merge-blocking supervisor handoff, not an implementation defect.

## Commit topology — REPRODUCED

- Product diff `de57fab0..dbb62c065` is **exactly the 12 locked ceiling paths** plus run
  artifacts; `b8846d6b3` and `7bc715b68` change run artifacts only. No path outside the ceiling.
- Each red-before (`0d620b619`, `22e737fc3`, `7ed5b94c6`) is a separate test-only commit.
- `deno.lock` byte-identical to base; SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` matches the claim. Tree clean.

## Gate re-derivation at head — all REPRODUCED

| Gate | Claim | Evaluator result |
| --- | --- | --- |
| Whole `packages/cli` test | 1386/0 | exit 0; **845 passed (541 steps), 0 failed** = 1386/0 |
| Whole `packages/cli/e2e` test | 170/0 | exit 0; **170 passed, 0 failed** |
| `arch:check` | exit 0 | exit 0 |
| `check:agent-docs-prose` | exit 0 | exit 0 |
| `check:publish-assets` | exit 0 | exit 0 |
| `check:mcp-export-corpus` | exit 0 | exit 0 |
| `check:emitted-samples` | exit 0 | exit 0; 47 samples from 37 artifact paths (matches claim) |
| CLI JSR audit | exit 0 | exit 0 |
| `docs/site` verify + test:source-format | S1 baseline only | evaluator ran both anyway at head: exit 0 / exit 0 |
| `check:assets-barrel` | deliberately NOT_RUN (writes before diffing) | confirmed not run by anyone; three read-only cascade checks green in its place |
| `scaffold.runtime` | REQUIRED / NOT_RUN / queued on lease | confirmed: no artifact, PR comment, or worklog row claims it ran or passed |

Lint/fmt **N/A by configuration — REPRODUCED and judged honest**: root `deno.json` excludes
`packages/cli/` from both `lint.exclude` and `fmt.exclude`; `packages/cli/deno.json` and
`packages/cli/e2e/deno.json` declare neither. There is no sanctioned command that yields a valid
scoped verdict; the plan measured the base-red wrappers, no config was edited to manufacture a
green, and the tooling defect is recorded as pre-existing debt. Recording N/A is the truthful
outcome; a hand-rolled config-override run would itself have been an unsanctioned verdict source.

## Red-before validity (judged item 4) — REPRODUCED, no weakening

Rerun by the evaluator in detached scratch worktrees at the exact red SHAs:

| Slice | Claim | Evaluator rerun | Red→green test diff |
| --- | --- | --- | --- |
| S2A `0d620b619` | exit 1, 1/7 | **exit 1; 1 passed, 7 failed** — failing test names match the supervisor's list | test file **byte-identical** between red and green |
| S2B `22e737fc3` | exit 1, 17/4 | **exit 1; 17 passed, 4 failed** at `src/public/features/ui/` directory scope (single-file scope is 2/4 — the claimed figure is the focused ui-feature directory, consistent with the 21/0 green) | only additive: `dryRun` assertion added to the input-completeness test |
| S2C `7ed5b94c6` | e2e exit 1, 167/3 | **exit 1; 167 passed, 3 failed** — exactly the gate-registration, gate-command, and runtime-selection tests | only the local `'scaffold.ui-data-screen' as GateId` cast replaced by `GATE.SCAFFOLD_UI_DATA_SCREEN`; constant value verified identical at `cli-surface.ts:78` |

Every green is therefore product-caused; no assertion was weakened or deleted.

## Ceiling completeness (judged item 1 — the standard that caught two misses) — NO MISS FOUND

Sweep for behavioural consumers the 12 paths cannot reach, beyond the suites the author ran:

- **In-package consumers** (help/surface/command-tree/registry/count assertions in
  `public-command-tree_test.ts`, `local-contributor-command-tree_test.ts`, `init-agent_test.ts`,
  suite-registry and gate tests): all inside `packages/cli`/`e2e`, all covered by the green
  1386/0 + 170/0 whole-package runs.
- **`Data-screen roles` help string**: consumed only by `add-ui-command.ts` and its own test — no
  external help snapshot exists. No `*.snap` snapshot files exist in the repo.
- **Generated-file-count / emitted-sample consumers**: `check:emitted-samples` green at head
  (47/37). The three read-only generated-carrier checks green; no corpus member is in the diff.
- **`packages/mcp` command policy**: allowlists `ui:add` by bare command name
  (`command-policy.ts:38`); it does not enumerate flags, so `--force`/`--dry-run` cannot break it.
- **`packages/fresh-ui` markdown-renderer test**: the `'ui:add'` hit is an inline-code fixture
  token, not a CLI-behavior assertion.
- **Generated-app `AGENTS.md` template** (`agent-conventions.ts:155-157`): its three `ui:add`
  promises are now *true* of the shipped behavior and it names no island directory, so the
  convention change introduces no new falsehood there.
- **`docs/site` behavioural checks**: evaluator ran `verify` and `test:source-format` at head —
  both exit 0; the four known-stale prose passages are data, not tests, and are recorded/deferred.
- **Runtime-suite listing surfaces**: `SCAFFOLD.RUNTIME` and `RUNTIME_SQLITE` both inherit the new
  gate through the same selector; the selection test covers the resolver path used by
  `e2e:cli suites`/`gates` listings.

Nothing was found that asserts a stale file count, help text, surface snapshot, suite registry,
emitted sample, or golden fixture outside the locked paths.

## Gate reality (judged item 2) — REPRODUCED

- `SCAFFOLD_UI_DATA_SCREEN: 'scaffold.ui-data-screen'` defined at
  `packages/cli/e2e/src/domain/cli-surface.ts:78`.
- Registered: `createUiDataScreenGates()` spread inside `createScaffoldCapabilityGates()`
  (`scaffold-capability-gates.ts:45`), which feeds the suite builder
  (`scaffold-suite-builder.ts:30`).
- **Selected**: `GATE.SCAFFOLD_UI_DATA_SCREEN` at `capability-suites.ts:54` inside
  `RUNTIME_GATES`, after `SCAFFOLD_INIT` and before `GENERATED_DENO_CHECK` (so the emitted screen
  is inside the generated-workspace type-check). `runtime-sqlite` inherits it too.
- The selector is load-bearing: `createScaffoldCapabilitySuite` **throws** on a selected-but-
  unregistered id, and `suite-registry_test.ts` resolves the real `SCAFFOLD.RUNTIME` suite and
  asserts both membership and ordering — the S2C red-before proves deleting any leg (definition,
  registration, or selection) fails deterministically (167/3).
- The gate command `ui:add page data-screen --island --app <generated-app>` is statically coherent
  with what `init --service` emits: the embedded
  `app/routes/examples/service/(_lib)/service-query.ts.template` exports match both binder
  regexes (`<svc>Name` first, `<svc>Queries = createQueryFactories(`), and the binder's
  `../../contracts/versions/v1/<svc>.contract.ts` path matches the generated layout with the CRUD
  dialect present. Live proof of that chain is precisely what the queued `scaffold.runtime` run
  will deliver — correctly still REQUIRED.

## Help↔role coupling (judged item 3) — GENUINE, not theatre

`add-ui-command_test.ts` renders **real Cliffy help** via `testCommand(fs).getHelp()`, parses the
advertised list out of `Data-screen roles: …`, and compares it against the role set observed on an
**actual dry-run plan** produced by `scaffoldUiPage` in a seeded in-memory app. The emission side
carries its roles as literals attached by the planner (`web-scaffold.ts`), not the help constant,
so description and emission are independently observable and either drifting breaks the test. The
negative case rejects the stale three-role advertisement. Help→plan, not constant→constant.

## No-bindable-contract path (judged item 5) — REAL PRECONDITION

Verified in source and test: `scaffoldUiPage` orders path/route validation → `findBinding` (throws
the exact `Prerequisite: netscript service add --name <service> --with-client` diagnostic on
zero/ambiguous/unsupported candidates, with candidate list) → in-memory render of all four files →
`routeRegistration` anchor/duplicate validation → `applyPlan` collision preflight → dry-run early
return → only then `createDir`/`writeFile`. No cleanup path exists because no validation error can
cross into the write loop. The test asserts the rejection **and** full fs-map equality
(zero writes); the collision test does the same. Reproduced in the S2A red/green cycle.

Minor observations, none blocking: (a) under `--force`, a *conflicting* foreign route id still
errors — matching D6's "recognized owned registration only" — while an exact existing owned entry
is reused idempotently; (b) the binder's first-match `\w+Name` regex relies on canonical template
export order and fails closed on custom modules, per D3.

## Acceptance honesty (judged item 6) — HONEST

- All eleven issue #1357 acceptance boxes remain **unticked** (mirrored, not hand-edited).
- Box 6's "documented" is claimed only through the command's own `--help`;
  `docs/site/cli-reference.md` (the `ui:init`/`ui:add` dry-run column, the line-104 region) is
  verified still stale, and the S2B, S2C, and S2D PR comments each *repeat* that limitation and
  disclaim full documentation coverage. The four stale doc passages are enumerated in `drift.md`
  with explicit deferral under D17. No overclaim found anywhere on the PR, worklog, or
  context-pack; the runtime gate is uniformly REQUIRED/NOT_RUN.

## Outstanding before merge (supervisor-owned, not IMPL defects)

1. `deno task e2e:cli run scaffold.runtime --cleanup` (includes `scaffold.ui-data-screen`) once the
   singleton host lease frees — REQUIRED; queued, not topology-blocked (D-42/D-43 resolved).
2. Deferred docs/carrier corrections (cli-reference, quickstart, fresh-ui how-to/behavior
   passages) in their owning docs work.

## Findings table

| # | Brief item | Result |
| --- | --- | --- |
| 1 | Ceiling completeness at the two-miss standard | REPRODUCED — no unreachable behavioural consumer found |
| 2 | Gate defined *and* selected, would execute in `scaffold.runtime` | REPRODUCED — selection at `capability-suites.ts:54`, throw-on-unregistered, membership+order tested |
| 3 | Help↔role coupling genuine | REPRODUCED — rendered help vs independently planned roles, with negative case |
| 4 | Red-befores prove product causation | REPRODUCED — 1/7, 17/4, 167/3 rerun at exact SHAs; no assertion weakened |
| 5 | No-binding path: non-zero, names verb, zero writes | REPRODUCED — precondition ordering in source; fs-map-equality tests |
| 6 | Acceptance honesty | REPRODUCED — boxes unticked; box-6 limitation disclaimed on every surface; runtime never claimed |

Cycle 1 verdict: **PASS_IMPL** at evaluated head `7bc715b68`.
