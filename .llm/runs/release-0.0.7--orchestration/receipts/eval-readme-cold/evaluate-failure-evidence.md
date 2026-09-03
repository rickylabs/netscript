# IMPL-EVAL final delta: bounded failure-evidence snapshot before cleanup

Proportional review of authored delta `c5ca6b0c4` ("fix(e2e): retain failed README service logs
before cleanup") on top of the previously evaluated `6e9bb276c`, at current checkout
`2743cd0df771ec902799c5d281e6e1111600b331` (merge of already-reviewed `main` `075ea8ed7`; the
merge introduces **no drift on the two reviewed files** — both are absent from the merge diff).
All three prior verdicts (`evaluate.md`, `evaluate-cache-delta.md`,
`evaluate-final-cache-policy.md`) are preserved; none is carried forward to this head.

Evaluator (same resumed independent session, separate from generator): session
`0039d1ad-72eb-4047-964c-8b326ff65902`, Claude Code + OpenRouter, model `z-ai/glm-5.3-flash`
(max IMPL-EVAL preset), 2026-09-03. Read-only local review of this delta only; no full audit,
runtime, GitHub writes, commit, or push.

## Scope honored

Delta touches exactly two product files, insertions only (+34/+52): the README-command gate and
its test. No framework source, no workflow, no assertion relaxation, no retry/recovery, no
version change. `plan.md`/`worklog.md` record the boundary and the measured need (hosted
33760126265: commands 1–10 PASS, `users` readiness exit 18 FailedToStart, cleanup PASS, resource
console not captured; root cause not yet proven, no cache-damage claim).

## Verified behavior (`readme-command.ts`)

- **Trigger is exact and narrow.** The probe runs only when the command is `aspire wait users …`
  (`SERVICE_READINESS_PREFIX`) AND it failed (`result.code !== 0 || result.timedOut`). Success
  paths are byte-identical to before.
- **Diagnostics can never change the verdict.** The probe runs through the existing
  `runCommand` wrapper, which try/catches spawn errors into `{code: 1, stderr: 'Command could not
  start…'}` — it cannot throw, so the receipt is always written and `return result.code` (the
  original 18) is untouched. `timedOut` and `exitCode` are the primary command's own values; the
  probe's results live in a separate additive `failureDiagnostics` object. State `nextIndex` is
  not advanced on failure (unchanged logic); the "failed exactly as printed" console error is
  unchanged.
- **Ordering: evidence precedes owned cleanup.** The probe executes inside the command gate
  before the receipt is written and before the gate returns failure to the suite; cleanup is a
  distinct runner phase (durable `cleanup.aspire-stop` receipts in
  `packages/cli/e2e/src/domain/cli-surface.ts` / `runtime-gates.ts`) that runs only after the
  gates conclude — so the console snapshot is captured before any teardown.
- **Grace math holds.** The suite wraps the gate child with `childTimeoutMs + WRAPPER_GRACE_MS`
  (`WRAPPER_GRACE_MS = 5_000`, `readme-quickstart-suite.ts:16,93`). Worst case for the readiness
  command: 65 s command + 2 s probe = 67 s ≤ 70 s wrapper allowance — the probe fits the existing
  5 s grace with margin; a probe timeout returns `code 124 / timedOut` inside the receipt without
  throwing.
- **Read-only and bounded.** `aspire logs users --tail 40 --format Json --apphost <exact owned
  AppHost path>`: no stop/prune/removal flags, exact owned path, 40-line / 4 kB tails via the
  existing `RECEIPT_TAIL_LENGTH = 4_000` `tail()` helper — the same receipt-tail surface the
  gate already uses for command stdout/stderr, so no new exposure class.

## Verified tests (`readme-command_test.ts`)

Two new parameterized tests (diagnostic exit 0 and 1) assert the full contract with a fake
runner: return value 18; exactly 2 spawn calls; second call is exactly
`['aspire','logs','users','--tail','40','--format','Json','--apphost',appHost]` with `timeoutMs:
2_000`; receipt `exitCode: 18`; `failureDiagnostics.exitCode` equals the diagnostic's own code
(0 or 1 — covering diagnostics-succeed AND diagnostics-themselves-fail); `stdoutTail` captured;
`nextIndex` unchanged at 10. The gate's `assertExpectedCommands` continues to enforce the
verbatim README walk, so the diagnostic cannot mask a README divergence.

**RED reconciliation (static — matches claimed 2 pass/2 fail):** at `6e9bb276c` the receipt has
no `failureDiagnostics` field and only one spawn call occurs, so `receipt.failureDiagnostics.exitCode`
throws and both new tests fail; the other tests in the file pass. GREEN is the 15/0 rerun below.

## Verification commands and results (run at head `2743cd0df`)

| # | Command | Result |
| - | ------- | ------ |
| 1 | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/release/release-canary-workflow_test.ts .github/scripts/aspire-nuget-cache-policy.test.ts .llm/tools/agentic/teardown/forbidden-commands_test.ts packages/cli/e2e/tests/application/readme-command_test.ts` | exit 0 — **15 passed / 0 failed** (8+2+1+4 across four files; matches claimed GREEN 15/0) |
| 2 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file <readme-command.ts> --file <readme-command_test.ts>` | exit 0 — 2 files / 1 batch / 0 diagnostics |
| 3 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file <both files>` | exit 0 — 2 files, 0 findings |
| 4 | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file <both files>` | exit 0 — 2 files, 0 findings (within the `packages/**` lint surface, unlike the `.llm/tools` files of prior deltas) |

## Findings (all non-blocking)

1. **Observation:** `aspire logs` is the same read-only failure-diagnostics precedent the repo
   already uses in `verify-listener-readiness.ts`; the exact `users --tail 40 --format Json
   --apphost` form is runtime-owned. It fails safe either way — an invalid form yields a nonzero
   `failureDiagnostics.exitCode` and the primary verdict is still 18 with the receipt intact.
2. **Observation:** the probe is intentionally scoped to the `users` readiness command; failures
   of other README commands (e.g. `curl` health checks) capture no resource console. Matches the
   measured need; if future rehearsals show a different failing resource, the constant pair
   (`SERVICE_RESOURCE` / prefix) is the single place to extend.
3. **Observation:** fresh hosted diagnostic rehearsal and root-cause analysis for exit 18 remain
   coordinator-owned; nothing here claims a runtime verdict or a cause.

## Verdict

**PASS_IMPL** — a genuinely minimal, read-only, verdict-preserving diagnostic: correct trigger,
correct ordering before owned cleanup, bounded to 40 lines/4 kB/2 s inside the existing wrapper
grace, additive receipt field, and a regression that pins both the happy-diagnostic and
failed-diagnostic paths while leaving the primary exit/state untouched.
