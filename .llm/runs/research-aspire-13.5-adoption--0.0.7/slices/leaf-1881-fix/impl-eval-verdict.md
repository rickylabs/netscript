# IMPL-EVAL PR #1975 @ 0650f6f7b — VERDICT: PASS

Evaluator: independent opposite-family session (Claude/GLM via OpenRouter lane). Scope: diff
`45e57377f..0650f6f7b` (2 commits: RED `b1aafaaa6`, GREEN `0650f6f7b`). GitHub read-only; no
runtime suites, Aspire, or Docker run.

## Tier A verdicts

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | `initializeState` fail-closed removal + recreation of `<runRoot>/.deno-install`, index 0 only | **PASS** | `packages/cli/e2e/src/application/gates/quickstart/readme-command.ts:177-183` — `Deno.remove(denoInstallRoot, { recursive: true })`, only `Deno.errors.NotFound` swallowed, then `Deno.mkdir(denoInstallRoot, { recursive: true })`; `initializeState` is reached only when `index === 0` (`readme-command.ts:69-70`). Any other remove error propagates and fails the gate (fail-closed). Mutation proof: deleting only the remove block at head makes the focused test fail (`assertRejects` → "Expected function to reject", exit 1). |
| 2 | Every README command spawned with `DENO_INSTALL_ROOT` + `PATH` prepend; later indexes read the root from persisted state | **PASS** | Env built from `state.denoInstallRoot` for every index (`readme-command.ts:92`), applied on every non-cd spawn (`readme-command.ts:96`, `:156-173`). `readmeCommandEnvironment` sets `DENO_INSTALL_ROOT=<root>` and `PATH=<root>/bin${DELIMITER}<ambient PATH>` (`readme-command.ts:192-203`; `DELIMITER` is platform-aware from `@std/path`). Index ≥1 state comes from `readState` (`readme-command.ts:71`, persisted `denoInstallRoot` at `:310-317`), and the suite passes one shared `statePath` to all 11 child commands (`packages/cli/e2e/suites/quickstart/readme-quickstart-suite.ts:118`). Test asserts spawn 0 env, persisted root, and `spawns[1].env` deep-equal to `spawns[0].env`. |
| 3 | argv verbatim; no `-f`; README.md / workflows / cleanup gates / quickstart.walk unchanged | **PASS** | Substitution only replaces `<version>`/`<port>` and rejects unknown placeholders (`packages/cli/e2e/src/domain/readme-quickstart.ts:69-86`); test asserts `spawns[0].argv` equals the exact 7-token install argv and `argv.includes('-f') === false`. `git diff --stat 45e57377f..0650f6f7b -- README.md .github/workflows packages/cli/e2e/src/application/gates/cleanup packages/cli/e2e/suites/cleanup` → empty (all unchanged). `quickstart.walk` unchanged: `requireAspireSuccess` still calls `run(command, cwd, timeoutMs)` with 3 args (`aspire-walk.ts:86`); the new `env` param is optional and `env: undefined` at the `Deno.Command` call (`aspire-walk.ts:112`) is behaviorally identical to omission. |
| 4 | Receipt records `environment: { denoInstallRoot, pathPrepend }` | **PASS** | `ReadmeCommandReceipt.environment` (`readme-command.ts:30-33`), frozen population at `:115-118`. Observed in the actual test receipt: `{"environment":{"denoInstallRoot":"…/run/.deno-install","pathPrepend":"…/run/.deno-install/bin"},…}`. |
| 5 | Narrowest `--allow-env=PATH` grant, suite test asserts it | **PASS** | `readme-quickstart-suite.ts:106` adds `'--allow-env=PATH'`; it is the only `--allow-env` occurrence in the suite file (grep). The walker reads env exactly once, `Deno.env.get('PATH')` (`readme-command.ts:194`). Suite test asserts every walker command includes `--allow-env=PATH` (`packages/cli/e2e/tests/presentation/readme-quickstart-suite_test.ts:67`). |
| 6 | RED/GREEN: b1aafaaa6 RED-only; test genuinely fails without the fix | **PASS** (with note F1) | `git show b1aafaaa6` touches only the injectable `spawn` seam (`aspire-walk.ts` +1; `readme-command.ts` seam plumbing, default = real), the new test, and `.llm/runs/**` docs — zero isolation logic. Revert-run of the exact RED tree (extracted to `.llm/tmp/red-tree`; fake spawn ⇒ no real subprocess): `deno test --allow-all packages/cli/e2e/tests/application/readme-command_test.ts` → **FAILED, exit 1**, `AssertionError: undefined ≠ "…/run/.deno-install"` at `spawns[0].env?.DENO_INSTALL_ROOT` (test line 71). Green run at head: same test passes (5/5). |
| 7 | Reproduce gates | **PASS** | See gate table below — check, test, full sweep, fmt, lint, `e2e:cli gates readme.quickstart` all exit 0. |
| 8 | No other caller breaks; `readState` strictness is fail-closed-correct | **PASS** | Repo-wide grep for `runAspireCommand\|AspireCommandRunner`: only `aspire-walk.ts` (definition + internal 3-arg calls), `readme-command.ts`, and the new test. 3-arg call sites stay assignable to the 4-param signature; full 327-test sweep green. `readState` rejecting prior state without `denoInstallRoot` is fail-closed and correct: index 0 never reads `state.json` (`initializeState` ignores it and overwrites on success), so a stale pre-fix state file is discarded, not inherited; any index ≥1 necessarily follows a successful index 0 within the same run. A hard error beats silently spawning with the ambient (collision-prone) env. |
| 9 | No residual collision path at `0.0.7-canary.9` | **PASS** | `deno install --help` (Deno 2.9.5, the actual toolchain) documents shim-location precedence: `--root` option → `DENO_INSTALL_ROOT` env var → `$HOME/.deno`. README command 1 passes no `--root`, so `DENO_INSTALL_ROOT` governs; the run-owned root is empty (and force-removed first at index 0), so "Existing installation found. Aborting (Use -f to overwrite)." cannot recur. Later `netscript …` commands resolve through the PATH **prepend** (ambient tail preserved ⇒ `deno`/`aspire`/`curl` unaffected), and `Deno.Command`'s documented env-merge semantics (merge over inherited env, no `clearEnv`) keep the rest of the environment intact. The implementation relies on nothing beyond documented behavior. |

## Gate outputs (reproduced by evaluator)

| Gate | Command | Result |
|------|---------|--------|
| check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts,tsx` | exit 0 — 234 files, 0 findings; wrapper internally runs `deno check --unstable-kv <files>` (shown in its own JSON) |
| focused tests | `deno test --allow-all packages/cli/e2e/tests/application/readme-command_test.ts packages/cli/e2e/tests/presentation/readme-quickstart-suite_test.ts` | exit 0 — 5 passed / 0 failed |
| full e2e unit sweep | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/tests` | exit 0 — **327 passed / 0 failed** |
| fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts,tsx` | exit 0 — 234 files, 0 findings |
| lint | `deno lint` on the 5 changed `.ts` files | exit 0 — "Checked 5 files" |
| gate listing | `deno task e2e:cli gates readme.quickstart` | exit 0 — 11 indexed `readme.quickstart.*` gates + `cleanup.aspire-stop` |

RED revert-run: `deno test --allow-all packages/cli/e2e/tests/application/readme-command_test.ts` at `b1aafaaa6` → exit 1 (0 passed / 1 failed). Mutation run at head with only the `Deno.remove(denoInstallRoot, …)` block deleted → same test fails ("Expected function to reject"); full suite under mutation: 326/327, the focused test is the sole failure.

## Findings (ordered by severity — all non-blocking)

1. **F1 (info, process):** The GREEN commit also extends the RED test with the Addendum-required
   assertions (seeded `<runRoot>/.deno-install/bin/netscript` removal via `assertRejects`,
   persisted-state root, receipt `environment`). At `b1aafaaa6` the RED test asserts only the env
   fields, so those specific assertions were never exercised against an unfixed tree — the RED
   evidence for them is indirect. *Failure scenario if unfixed:* none today; the risk is a future
   assertion added green-only that never demonstrably fails. **Compensating evidence:** evaluator
   mutation run deletes only the removal block and the focused test fails exactly on that
   assertion, and the full suite under mutation isolates it as the sole failure. Non-blocking.
2. **F2 (info, eval brief, not the PR):** The eval brief's literal check command appends
   `--unstable-kv` to the `run-deno-check.ts` wrapper; the wrapper's `parseArgs` rejects it
   (`Unknown argument: --unstable-kv`, exit 1). The wrapper already passes `--unstable-kv`
   internally, so re-running without the flag is the equivalent gate (exit 0). Brief nit only.
3. **F3 (note, code):** `readState` type-checks the persisted `denoInstallRoot` as a string but
   does not validate containment under `runRoot`, so a tampered/hand-edited `state.json` could
   point the install root anywhere. *Failure scenario:* a corrupt or foreign `state.json` at
   `.llm/tmp/readme-quickstart/state.json` would send command 1's install (and its receipt's
   recorded root) to an arbitrary directory. Reachable only by pre-seeding that run-owned file;
   hosted runners are single-use and index 0 overwrites state on success. Non-blocking hardening
   candidate.
4. **F4 (note, code):** `Deno.env.get('PATH') ?? ''` yields `PATH = "<prepend>:"` (trailing
   delimiter, empty tail) if PATH is unset, which would break `deno`/`aspire`/`curl` resolution in
   the spawned children. Unreachable on hosted runners (PATH is always set) and the failure would
   be loud, not silent. Non-blocking.

## Verdict

**PASS.** All nine Tier A items hold with file:line and reproduced-command evidence; the exact
Canary 9 red (global `netscript` collision aborting README command 1) is eliminated by the
documented `DENO_INSTALL_ROOT` + fresh-run-owned-root mechanism with verbatim argv, and the four
findings above are informational/nits that do not block merge readiness. The hosted
`e2e-cli-prod` rerun at a new canary remains the acceptance gate for closing #1881 (per brief, no
closing keyword on the PR).
