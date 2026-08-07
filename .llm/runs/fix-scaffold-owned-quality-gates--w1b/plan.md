# Plan: Canary.15 W1-B

## Decision

Repair the generated quality contract without coupling ordinary scaffolds to optional agent
initialization:

1. Generate one dependency-free `.netscript` quality runner on every scaffold, following the repo
   runners' explicit-root/extension/exclusion, non-empty-selection, batching, and structured-result
   conventions.
2. Route generated `check`, `lint`, `fmt:check`, and `fmt` tasks through that runner. Select owned
   `.ts`, `.tsx`, and executable `.mts` source; keep dependency/cache/offline-agent surfaces out.
3. Prove the task with a per-surface negative matrix and final green full-scaffold gates.
4. Fix the discovered templates/resource generators so the selected scaffold is inherently clean.
5. Preserve #1092's exact eight-tool `agent init` bundle and close #1024 with a real installed
   full-smoke run from a consumer directory that has no framework checkout.

## Generated contract

The runner contract is intentionally narrow:

- modes: `check`, `lint`, `fmt-check`, `fmt-write`;
- stable explicit surface list and mode-specific exclusions;
- recursive deterministic discovery for `.ts`, `.tsx`, and `.mts`;
- a structured report containing mode, selected paths/count, batches, command exits, and overall
  status;
- exit 2 when selection is unexpectedly empty; propagate a tool failure non-zero;
- no shell expansion, no network, no repo-relative runtime file reads, and no dependence on
  `.llm/tools`;
- format-check is the non-mutating gate; `fmt` retains the expected mutating developer task.

Synthetic unit fixtures prove discovery, exclusion, TSX/MTS inclusion, empty selection, and child
exit propagation before the runner is wired into scaffold output.

## Negative-probe matrix

After DB clients and plugin registries exist, the E2E quality gate will create one owned fixture at
a time, run `deno task check`, require a non-zero exit and evidence that the fixture was selected,
then remove it before continuing:

| Probe           | Extension/surface       |
| --------------- | ----------------------- |
| app module      | `apps/.../*.ts`         |
| app component   | `apps/.../*.tsx`        |
| service         | `services/.../*.ts`     |
| contract        | `contracts/.../*.ts`    |
| plugin          | `plugins/.../*.ts`      |
| worker runtime  | `workers/.../*.ts`      |
| saga runtime    | `sagas/.../*.ts`        |
| trigger runtime | `triggers/.../*.ts`     |
| stream runtime  | `streams/.../*.ts`      |
| AppHost/helper  | `aspire/.helpers/*.mts` |

The gate finally runs check again after cleanup. Separate positive gates require generated lint and
format-check to be green. The fixture utility owns only its exact paths and restores any preexisting
content defensively.

## Slices

### Slice 1 — quality contract and proving tests

Define the generated runner and task contract first, with semantic tests and the E2E negative gate.

Expected files (bounded to the contract seam):

- `packages/cli/src/kernel/templates/workspace/quality-runner.ts` and focused test;
- `packages/cli/src/kernel/constants/scaffold/scaffold-files.ts`;
- `packages/cli/src/kernel/application/scaffold/plan-init.ts` and focused scaffold test;
- `packages/cli/src/kernel/templates/workspace/deno-json.ts` and `generators_test.ts`;
- `packages/cli/e2e/src/domain/cli-surface.ts`;
- a focused generated-quality gate/fixture plus its test, registered in the scaffold capability
  composition.

Proving gate: focused Deno tests over the runner/task/scaffold/E2E gate; scoped repo check/lint/fmt
for the touched CLI roots. The negative test must fail if TSX, plugin/background, or `.mts` coverage
is removed.

### Slice 2 — clean generator output

Fix source generators rather than weakening selection:

- app layout and telemetry templates (boolean shorthand and stable JSX keys);
- service health and plugin-service-context templates (`require-await`-clean contract shape);
- sagas/triggers source literal rendering and workers task layout;
- focused generator/resource tests and regenerated checked-in CLI embedded assets where required.

Proving gate: focused CLI and plugin generator tests, asset freshness, then a new full scaffold with
DB codegen/plugin registries followed by generated check, lint, and format-check. The only direct
lint/fmt exclusions are documented non-product/generated outputs.

Implementation refinement recorded in `drift.md`: AppHost-owned MTS uses the restored native
`tsc -p aspire/tsconfig.apphost.json` project, with `.helpers/**/*.mts` included. The Deno-executed
`run-tool.mts` stays in the same quality selection but is checked by Deno. Aspire's generated SDK
bundle remains a compiler input, not a scaffold-owned lint/fmt surface.

### Slice 3 — consumer/runtime closure and evidence

- Run `netscript agent init` in a published scaffold outside this checkout and execute the installed
  `.llm/tools/e2e/scaffold-e2e-test.ts` to completion. Record the exact released CLI specifier,
  consumer root, absence of framework source/marker, raw exit, and step summary.
- Run scoped static/fitness/package gates at current head.
- Confirm no run-owned leaks, then run the single one-pass `scaffold.runtime` merge-readiness suite
  with cleanup and record its raw exit and suite/test names.
- Update run artifacts and structured PR phase comments. Stop for independent IMPL-EVAL; do not mark
  ready or merge.

Proving gate: installed clone-independent smoke plus the canonical one-pass runtime command. The
published smoke is evidence for #1024; it is not a publication or a substitute for local-source
`scaffold.runtime`.

## Validation order

| Order | Gate                                                               | Evidence bar                                                      |
| ----- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 1     | focused runner/template/plugin/E2E tests                           | raw exit and test counts/names                                    |
| 2     | deliberate per-surface generated check probes                      | each fixture selected; each expected non-zero; cleanup then green |
| 3     | fresh full-scaffold `check`, `lint`, `fmt:check`                   | structured selection counts and raw exits; zero inherent findings |
| 4     | scoped repo check/lint/fmt wrappers, `.ts,.tsx`                    | wrapper JSON at current head; zero failures/findings              |
| 5     | `deno task quality:gate`                                           | raw exit; quality and architecture sub-gates green                |
| 6     | CLI doc-lint and generated-asset freshness                         | zero doc diagnostics; no generated diff                           |
| 7     | CLI/package publish dry-run                                        | raw exit, no slow types, intended file list; no publish           |
| 8     | installed consumer full smoke outside checkout                     | raw exit 0 and full step summary; no framework clone/path         |
| 9     | leak-check                                                         | no unknown/foreign mutation; run-owned resources clean            |
| 10    | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | one-pass raw exit and failing suite/test names if any             |
| 11    | independent IMPL-EVAL                                              | separate-session verdict only                                     |

Lock hygiene applies to every command: no cache reload and no staging, restoring, deleting, or
regenerating `deno.lock`. Final gate evidence comes from raw verdict sources; `rtk` remains limited
to exploratory reads.

## Doctrine and JSR plan gate

- Archetype 6 gates: generated/public CLI contract, permission review, semantic tests, F-19 scoped
  gates, doctrine/quality fitness, package doc/publish static checks, and runtime consumer proof.
- The generated runner is an internal scaffold asset, not a new exported package API. No barrel or
  public symbol is added.
- Asset source must be embedded/generated for JSR consumption; never add a runtime filesystem read
  relative to `import.meta.url`.
- Generated public functions/types, if any are required internally, receive explicit annotations;
  CLI doc-lint and dry-run guard slow types and file shape.
- No architecture debt is accepted. If a compliant runner would require expanding #1092's bundle,
  publishing, or taking #1335, stop and rescope rather than hide the divergence.

## PLAN-EVAL gate

Implementation is blocked until a separate evaluator records PASS. The exact canonical
`formal_plan_evaluation` route is:

- provider/runtime: Claude Code through OpenRouter;
- profile transition: `claude-openrouter` to `claude-print`;
- preset: `claude-evaluator-minimax-m3`;
- model: `minimax/minimax-m3`;
- effort: `high`.

Only a provider-limit fallback may use a fresh separate Antigravity/Google session with
`gemini-3.6-flash-high`, high effort. OpenHands is paused and must not be triggered.

The evaluator should scrutinize: whether the owned-source matrix really covers every default
AppHost-executed file; whether generated-machine-code exclusions are honest; whether the negative
matrix is sufficient without overgrowing runtime cost; whether the always-generated runner remains
independent of #1092's optional bundle; and whether the installed smoke is durable closure evidence
for #1024 without requiring publication.
