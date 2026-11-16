# Evaluation: fix/garnet-persistence — issue #2636, PR #2643

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Run ID         | `fix-garnet-persistence--issue-2636`                                      |
| Target         | PR #2643 / issue #2636 — managed Garnet persistence from `DataPath`       |
| Archetype      | 6 — CLI/Tooling (CLI scaffold generator + generated Aspire runtime)       |
| Scope overlays | docs (CLI README + data-persistence guide)                                |
| Evaluator      | Independent IMPL-EVAL session; route `glm_5_3_flash/provider_default` (primary row of the straightforward implementation-evaluation matrix; no fallback needed); generator `Codex gpt-6.1-sol/xhigh` (OpenAI family) — separate session, different vendor family |
| Evaluated head | `1e16cc31d6ca06335e8cd5636e5c10d5675e37de` (branch `fix/garnet-persistence`, base `origin/main` `b0eb079575968e843b781579673c9fe2ae250e07`) |

## Route / Identity Record

- Live matrix row (straightforward, implementation-evaluation): primary `glm_5_3_flash/provider_default`, fallback `deepseek_v4_pro/provider_default`; policy maxRounds 5, notify after 3.
- Requested and observed identity: `glm_5_3_flash/provider_default` via OpenCode Go provider default options. No substitution, no fallback used, no paid-route expense.
- Generator vendor family (OpenAI/Codex) ≠ evaluator vendor family (GLM); separate sessions.

## Process Verification

| Check                                  | Result | Evidence                                                                                             |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `PLAN-EVAL: N/A` justified and recorded in `supervisor.md`/`worklog.md` before commit `c39a436ab`: exact pinned-binary flags verified, locked durable/no-path policy, bounded native configuration passthrough per run-loop §4 skip criteria |
| Design section exists in worklog       | PASS   | `## Design` in `worklog.md` (public contract stays `CacheEntry.DataPath`, per-arm flag composition, docs modes) |
| Commit slices match design plan        | PASS   | 5 commits: `c39a436ab` plan → `70ab17fb9` red test → `1d44cd2d2` fix+docs → `3ab21381d` generated consumers → `1e16cc31d` evidence-only; every commit touches the run dir |
| Each slice has a passing gate          | PASS   | Red→green static oracle (below), combined suite, quality/JSR/doc gates, supported-runner full smoke      |
| No speculative seams (unused files)    | PASS   | Diff adds one test file; generator change edits existing launch edges only; no new product files        |
| Constants used for finite vocabularies | PASS   | `GARNET_PERSISTENCE_ARGS` const array composes flags; test loops finite mode/flag lists                 |

## Static Gates

| Gate             | Command or check                                                              | Result | Evidence |
| ---------------- | ----------------------------------------------------------------------------- | ------ | -------- |
| Slice typecheck  | `.llm/tools/run-deno-check.ts --root packages/cli/src/kernel/templates/aspire/helpers --ext ts` | PASS | exit 0, 47 files, 0 failures |
| Lint             | Repo lint policy excludes `packages/cli/` (pre-existing `deno.json` lint exclude); evaluator's direct wrapper invocation on this root correctly refused all-excluded — not a PR finding; root policy unchanged by this run | N/A (policy-excluded) | `deno.json` lint exclude list |
| Format (test)    | `.llm/tools/run-deno-fmt.ts` on the new test under canonical CLI quality config (`lineWidth:100, indentWidth:2, semiColons:true, singleQuote:true`) | PASS | exit 0, 1 file, 0 findings |
| Format (generator) | Temporary per-file config identical to CLI quality except `semiColons:false`, per `drift.md`: PR-touched `generate-register-infrastructure.ts` has no findings; 9 findings in the register root are all in sibling files untouched by this PR (pre-existing style drift, excluded) | PASS (changed files) | evaluator-replicated run |
| Doc lint         | `deno task doc:lint --root packages/cli --pretty`                              | PASS | exit 0, entrypoints `mod.ts`/`scaffolding.ts`/`testing.ts` all 0 |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` in `packages/cli`                       | PASS | exit 0, `Success Dry run complete` |
| JSR audit        | `.llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text`           | PASS | exit 0, exactly 25 pre-existing WARN entries, none in changed files |
| Quality gate     | `deno task quality:gate` (quality:scan + arch:check)                           | PASS | exit 0; listed warnings are pre-existing and in files untouched by this diff |
| Release preflight| `deno task release:preflight`                                                  | PASS | exit 0, four PASS lines |
| Docs accuracy    | `deno task docs:accuracy`                                                      | PASS | exit 0, `docs accuracy: PASS` (216 published source pages, 111/111 public commands) |
| Link/path check  | Docs diff reviewed: relative guide section, absolute docs-site URL only in README | PASS | `packages/cli/README.md`, `docs/site/data-persistence/kv-queues-cron.md` |

## Pinned-Binary Flag Verification (independent)

`ghcr.io/microsoft/garnet:2.2.1 --help` executed in an evaluator-owned auto-removed container confirms
every emitted flag exists in the pinned binary: `--aof`, `--recover` (`-r`), `--aof-commit-freq`
(default 0), `--aof-commit-wait`, `--storage-tier`, `--device-type`, `--logdir` (`-l`),
`--checkpointdir` (`-c`). No checkpoint-frequency scheduling option exists in the pinned help —
consistent with the no-unsupported-timer decision and upstream #2239 alignment workaround
(FileStream + storage-tier + shared log/checkpoint directory).

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Combined generator + persistence suite | Evaluator's own run of the exact test command with `NETSCRIPT_TEST_GARNET_DOCKER=1` and the remote Docker daemon: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/cli/src/kernel/templates/aspire/helpers/tests/garnet-persistence_test.ts packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-infrastructure_test.ts` | PASS | exit 0, `passed:33 failed:0 ignored:0` — both real hard-restart oracles executed (AOF-only and checkpoint+AOF-tail: two ready jobs delivered and acked after `KILL`/start of an owned container fed the exact emitted argv) |
| Full scaffold runtime (supported runner) | Workflow 43940698080 at source head `3ab21381d4b475e3dbd9377415b9ef51fb0586e8` | PASS | run SUCCESS; scaffold-runtime (postgres) job success, scaffold-runtime-sqlite (sqlite+garnet) job success, scaffold-static success, desktop-native-linux job succeeded (one non-blocking step error annotation; job conclusion `succeeded`) |
| Local one-pass smoke | Generator-run local attempt stopped at Postgres health timeout (no local Docker); cleanup gate passed | PARTIAL (honestly recorded) | `worklog.md`; not claimed as a pass anywhere |
| Test resource hygiene | Post-run scan: zero containers/volumes bearing the test ownership label | PASS | evaluator's own post-run Docker scan |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| Generated prose / MCP corpus / publish assets | Refreshed in `3ab21381d`; only prose and MCP publish carriers changed | PASS | `docs/agent-docs-prose.generated.ts`, `packages/mcp/src/publish-assets.generated.ts`; `docs:accuracy` PASS (independently re-run) |
| Source-head invariance | `git diff --exit-code` between `3ab21381d…` (evidence-green source head) and evaluated head `1e16cc31d…` | PASS | delta is only two `.llm/runs/…` run-artifact files |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| -- | ------ | -------- | ----- |
| `any` / manual casting / blanket lint-ignores | CLEAR | Product diff scanned; zero hits; `quality:scan` inside `quality:gate` exit 0 | New test uses zod parse, typed adapters |
| New folder / template-shaped files | CLEAR | No new product folders or files | One test file under the existing tests folder |
| Public-surface change without contract | CLEAR | No public API change; `CacheEntry.DataPath` contract reused | `deno publish --dry-run` success |
| Unsupported upstream options invented | CLEAR | All emitted flags verified against the pinned binary help | No checkpoint timer added |
| Lock/dependency churn | CLEAR | `deno.lock` unchanged; no dependency additions | 12-file diff reviewed |
| Forbidden transport coupling | CLEAR | `packages/plugin-sagas-core/src/transports` diff is empty; queue path uses the existing public Redis-compatible adapter, no Streams | Requirement honored |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No `arch-debt.md` change in the diff; no doctrine violation introduced |
| Resolved entries      | 0     | n/a |
| Deepened violations   | 0     | `quality:gate` exit 0 with pre-existing warnings only |
| Unrecorded violations | 0     | None found |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (informational) | Supported-runner desktop-native job carries one non-blocking step error annotation while the job conclusion is `succeeded` | workflow 43940698080 job page | none; job-level verdict stands, recorded here for honesty |
| low (informational) | The described temporary generator formatter config passes on the PR-touched generator file, but nine untouched sibling files in the same register folder do not conform to it | evaluator-replicated fmt run | none for this PR; optional future hygiene slice if the folder is ever normalized |
| none blocking | — | — | — |

## Close-Gate Posture (pre-transition)

- PR body carries `Closes #2636` in `## Scope` and exactly one fenced `acceptance-evidence` block
  mapping issue #2636 box-index 1–4 to the linked IMPL evidence comment. Issue acceptance boxes are
  all checked with that linked evidence.
- PR `## Definition of Done` final box (independent evaluation, required checks, review threads)
  correctly remains unchecked pending this verdict and the generator's post-PASS transition.
  Readiness/label transition, current required checks, and the review-thread gate are the
  generator's post-PASS responsibilities per the run contract — not evaluation blockers.
- No `status:ready-merge`, no merge, no publish authorized or performed by this evaluation.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Emitted-argv restart oracle beats flag-assertion-only tests for persistence work | Generate → parse argv → run the real binary → hard-restart → observe delivery | Archetype 6 runtime gates for cache/DB wiring | high |
| Pinned-binary `--help` verification before composing native flags | Exact-version container probe prevents inventing unsupported options | Any upstream-flag passthrough | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | PASS |
| Rationale | Approved scope fully delivered: DataPath now selects native AOF/recovery, immediate flush acknowledgement, FileStream + storage-tier device configuration, and a shared log/checkpoint directory on every managed Garnet launch arm (Container, Executable, both Auto branches), while no-path launches are byte-identical to the prior Lua/endpoint argv (three no-path controls). Independently verified: 33/33 combined suite including both hard-restart delivery oracles, scoped typecheck, quality:gate, doc lint, JSR dry-run + audit (25 pre-existing warnings), release preflight, docs accuracy, formatter style preservation on changed files, pinned-binary flag existence, zero test-owned Docker residue, no transport/dependency/lock changes, and the supported-runner full smoke SUCCESS at the identical source head. No unrecorded doctrine violations; debt delta zero. Docs accurately describe both durability modes, latency tradeoff, native on-demand checkpoints, and directory retention. |
