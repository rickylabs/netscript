# IMPL-EVAL — PR #1965 (#1881 / #863 gate 3 root README quickstart on the clean prod runner), immutable head 9cff705f5

You are the separate-session evaluator (NetScript harness, `.llm/harness/evaluator/protocol.md` and
`verdict-definitions.md`). Route: OpenRouter z-ai/glm-5.3-flash, effort xhigh. You are in a fresh
detached worktree checked out at exactly `9cff705f5`. Do not commit, push, checkout, rebase, or
modify any tracked file. Read-only against git; write only the two output files named below.

## Scope

Diff base is main `2b8867d32` (merge of #1952). Run `git diff --stat 2b8867d32..HEAD` and confirm
the non-`.llm/runs` file set is exactly: `.github/workflows/e2e-cli-prod.yml`, `README.md`,
`packages/cli/e2e/README.md`, and under `packages/cli/e2e/`: `src/application/gates/quickstart/aspire-walk.ts`
(export-only change), `src/application/gates/quickstart/readme-command.ts` (new),
`src/domain/cli-surface.ts`, `src/domain/readme-quickstart.ts` (new),
`src/presentation/cli/suites/registry.ts`, `suites/quickstart/readme-quickstart-suite.ts` (new),
tests `tests/domain/readme-quickstart_test.ts`, `tests/presentation/readme-quickstart-drift_test.ts`,
`tests/presentation/readme-quickstart-suite_test.ts`, `tests/presentation/suite-registry_test.ts`.
Everything else under `.llm/runs/research-aspire-13.5-adoption--0.0.7/` is harness evidence
(including a regenerated `aspire-surface-manifest.tsv`). Nothing else.

A prior implementation-completeness IMPL-EVAL (Claude Fable 5.1, spawned by the generator's Codex
thread, `slices/leaf-1881/evaluate.md`) returned PASS on the pre-convergence, pre-commit state.
You are the supervisor-dispatched independent evaluator at the exact converged head. Judge fresh;
you may read that file but must not defer to it.

## Acceptance to judge (#1881 = #863 gate 3)

The gate must execute the root README quickstart **verbatim** on the hosted clean runner, with no
retries and no manual recovery, and must fail loudly when README and gate drift apart. Judge:

1. **Verbatim source of truth.** `README.md` carries `<!-- readme-quickstart:start -->` /
   `<!-- readme-quickstart:end -->` markers. `src/domain/readme-quickstart.ts` is a pure parser that
   extracts the fenced commands between the markers and substitutes only `<version>` and `<port>`
   placeholders; any other placeholder, missing marker, empty block, or duplicate marker must fail
   closed (throw), never silently skip. `tests/presentation/readme-quickstart-drift_test.ts` reads
   the real root README so drift in either direction is a test failure.
2. **One command, one attempt.** `readme-command.ts` runs each parsed command exactly once with no
   retry loop, no fallback command, no `ASPIRE_RESTORE_MAX_RETRIES`-style budget (contrast
   `quickstart.walk`/`aspire-walk.ts`, which legitimately keeps its documented retries — confirm the
   only change to `aspire-walk.ts` is exporting `runAspireCommand`). Non-zero exit or timeout
   produces a named gate failure receipt with stdout/stderr tail; nothing is masked.
3. **Executable readiness.** The README readiness line is `aspire wait postgres --status healthy
   --timeout 60` (real Aspire 13.5.3 CLI flags; verify with `aspire wait --help` read-only, do not
   start anything). No invented flags.
4. **Suite shape.** `suites/quickstart/readme-quickstart-suite.ts` registers `readme.quickstart` with
   one gate per README command in README order, then appends `createCleanupGates()` unchanged, so
   foreign/unknown-owner Docker resources are never removed (cleanup doctrine inherited, not
   reimplemented). `registry.ts`/`cli-surface.ts` only add the suite id. `deno task e2e:cli suites`
   and `deno task e2e:cli gates readme.quickstart` are read-only listings — run them.
5. **Hosted runner.** `.github/workflows/e2e-cli-prod.yml` adds one step after the
   `quickstart.walk` step running `deno task e2e:cli run readme.quickstart --source jsr --cli
   jsr:@netscript/cli@<version> --cleanup --report … --log-file …`, includes its report in the
   summary loop and its artifacts in the upload list, gated by the same install-step outcomes as its
   neighbours. No `continue-on-error`, no retry, no manual-recovery step.
6. **Process lifecycle.** Long-running commands (`aspire start`-style) in `readme-command.ts` must
   be owned and terminated by the gate/cleanup path; no orphaned child processes on failure paths.
7. **Doctrine/scope.** No `packages/*/src` product code, no `plugins/`, no lockfile change. E2E gate
   code + README + workflow only. Product-behaviour change = FAIL_RESCOPE.
8. Tests: run exactly
   `deno test --allow-all packages/cli/e2e/tests/domain/readme-quickstart_test.ts packages/cli/e2e/tests/presentation/`
   plus `deno fmt --check` on the changed `.ts` files under `packages/cli/e2e`. `deno lint` on the
   changed files only (the desktop-native fixture `catalog:` refusal is a known pre-existing
   baseline; do not raise it). Do NOT run `readme.quickstart`, `quickstart.walk`, scaffold runtime
   suites, `deno task test`, `deno task check`, or anything starting Aspire/Docker.

## Hosted evidence (do NOT rerun)

- Exact-head CI at `9cff705f5` (quality / check-test / close-gate / scaffold-static) is driven by
  the supervisor in parallel; do not wait on it or cite it as your own evidence.
- The hosted `readme.quickstart` transcript at a canary tag is produced by the next fix-forward
  canary prod run and is a canary-admission gate, not a merge precondition — its DoD box is
  intentionally open; do not raise it as a finding.

## Output

- Write `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881/evaluate-supervisor.md`
  using `.llm/harness/templates/evaluate.md`: severity-ranked findings with file:line evidence,
  required action per finding, exactly one verdict line `VERDICT: PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT`.
- Also write `.llm/tmp/impl-eval-1965-comment.md`: compact (≤ 60 lines) PR-comment version, first
  line `IMPL-EVAL (separate session, OpenRouter z-ai/glm-5.3-flash xhigh) — head 9cff705f5`.
- Finish your final message with the single verdict line. Do not explore the wider repository.
