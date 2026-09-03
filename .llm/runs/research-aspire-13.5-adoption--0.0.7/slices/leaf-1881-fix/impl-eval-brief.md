# IMPL-EVAL — PR #1975 at exact head 0650f6f7b (README install-root isolation, #1881 / #863 gate 3)

You are the independent opposite-family evaluator. Work ONLY in `/home/agent/projects/netscript/worktrees/007-aspire-leaf-1881-fix-eval` (detached at 0650f6f7b). Read-only against GitHub; do not push, comment, label, or merge. Do not run Aspire, Docker, or any runtime suite.

## What the PR claims
Slice brief: `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/brief.md` (includes the coordinator Addendum). Diff under review: `git diff 45e57377f..0650f6f7b`.
The Canary 9 red: hosted `e2e-cli-prod` README command 1 (`deno install --global --allow-all --name netscript jsr:@netscript/cli@0.0.7-canary.9`) aborted with "Existing installation found. Aborting (Use -f to overwrite)." because the workflow pre-installs a global `netscript`.

## Verify (Tier A — each is PASS/FAIL with file:line evidence)
1. `initializeState` (readme-command.ts) fail-closed removes a pre-existing `<runRoot>/.deno-install` (recursive; only NotFound tolerated) and then recreates it, at index 0 only.
2. EVERY README command (index 0 and ≥1) is spawned with `DENO_INSTALL_ROOT=<runRoot>/.deno-install` and `PATH=<root>/bin<delimiter><ambient PATH>`; later indexes read the root from persisted state, not re-derive it.
3. README argv stays verbatim (only existing <version>/<port> substitution); no `-f` anywhere; README.md unchanged; `.github/workflows/**` unchanged; cleanup gates unchanged; `quickstart.walk` behaviour unchanged (`env` optional on `runAspireCommand`).
4. Receipt JSON records `environment: { denoInstallRoot, pathPrepend }`.
5. Permission set: `readmeWalkerCommand` in `packages/cli/e2e/suites/quickstart/readme-quickstart-suite.ts` grants `--allow-env=PATH` (narrowest) because readme-command.ts calls `Deno.env.get('PATH')`; no broader env grant. Confirm the suite test asserts this.
6. RED/GREEN: the focused test seeds a fake `<runRoot>/.deno-install/bin/netscript`, proves removal, asserts argv verbatim, env on spawn 0, spawn 1 env identical, receipt environment. Confirm `git show b1aafaaa6` is RED-only and that the test genuinely fails without the fix (reason from the diff or revert-run locally).
7. Reproduce gates yourself: `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx --unstable-kv`; `deno test --allow-all packages/cli/e2e/tests/application/readme-command_test.ts packages/cli/e2e/tests/presentation/readme-quickstart-suite_test.ts`; `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx`; `deno lint` on the changed .ts files; `deno task e2e:cli gates readme.quickstart`.
8. Search for regressions: does any other caller of `runAspireCommand` / `AspireCommandRunner` break with the new optional 4th param? Does `readState` now reject prior-run state that lacks `denoInstallRoot` (acceptable since receipts dir is reset at index 0 — judge whether that is fail-closed and correct)?
9. Any residual way the hosted run at `published-version=0.0.7-canary.9` could still hit the collision (e.g. Deno ignoring DENO_INSTALL_ROOT, `deno install` resolving via existing PATH entry)? Deno 2.9.5 honours DENO_INSTALL_ROOT then PATH — state whether the implementation relies on anything beyond that.

## Output (write to `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix/impl-eval-verdict.md`, and print it)
Header `# IMPL-EVAL PR #1975 @ 0650f6f7b — VERDICT: PASS|FAIL_IMPL`, then a table Tier-A item → PASS/FAIL → evidence (file:line / command + exit code), then findings ordered by severity with a concrete failure scenario for each, then gate outputs (exit codes, pass/fail counts). FAIL_IMPL only for a real defect or unmet Tier-A item; style nits are non-blocking notes.
