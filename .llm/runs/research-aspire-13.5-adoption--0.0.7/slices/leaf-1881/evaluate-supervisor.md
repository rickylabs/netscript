# Evaluation: IMPL-EVAL — PR #1965 (#1881 / #863 gate 3 root README quickstart on the clean prod runner)

Independent separate-session evaluator at converged head `9cff705f5`. Judged fresh; the prior
pre-convergence IMPL-EVAL (`slices/leaf-1881/evaluate.md`, PASS) was not deferred to.

## Metadata

| Field          | Value                                              |
| -------------- | -------------------------------------------------- |
| Run ID         | `research-aspire-13.5-adoption--0.0.7`             |
| Target         | PR #1965 (head `9cff705f5`) vs main `2b8867d32`    |
| Archetype      | N/A (E2E gate harness slice + README + workflow)   |
| Scope overlays | none                                               |
| Evaluator      | separate session, OpenRouter z-ai/glm-5.3-flash xhigh, 2026-09-03 |

## Scope confirmation

`git diff --name-status 2b8867d32..HEAD`: the non-`.llm/runs` set is exactly the 12 files named in
the eval prompt — `.github/workflows/e2e-cli-prod.yml`, `README.md`,
`packages/cli/e2e/README.md`, `packages/cli/e2e/src/application/gates/quickstart/aspire-walk.ts`
(export-only), `readme-command.ts` (new), `src/domain/cli-surface.ts`, `src/domain/readme-quickstart.ts`
(new), `src/presentation/cli/suites/registry.ts`, `suites/quickstart/readme-quickstart-suite.ts`
(new), and the four test files. `.llm/runs/research-aspire-13.5-adoption--0.0.7/**` is harness
evidence only (incl. regenerated `aspire-surface-manifest.tsv`). No `packages/*/src` product code,
no `plugins/`, no lockfile change. **Doctrine/scope: PASS.**

## Acceptance judgment

### 1. Verbatim source of truth — PASS

- Markers present in the real README: `README.md:34` (`<!-- readme-quickstart:start -->`) and
  `README.md:79` (`<!-- readme-quickstart:end -->`), enclosing all four bash fences.
- `readme-quickstart.ts` is a pure string-in/argv-out parser: marker scan via exact trimmed-line
  match; only ```bash fences parsed (```ts/```` fences and prose skipped, incl. the prose
  `<version>`/`<port>` mentions at README.md:44,71-72); full-line `#` comments and inline
  ` # …` tails stripped (readme-quickstart.ts:47-60); CRLF-tolerant (tested).
- Fail-closed, never silent skip:
  - missing or duplicate marker → throw `requires exactly one … found N`
    (readme-quickstart.ts:109-115, tested at readme-quickstart_test.ts:49-63);
  - end before start → throw (readme-quickstart.ts:41-43);
  - unclosed bash fence → throw (readme-quickstart.ts:62-64, tested :65-74);
  - substitution limited to `<version>` (receipt-backed) and `<port>` (port-receipt-backed);
    `<port>` with no receipt → throw (:75-78); any other `<…>` placeholder → throw (:81-84,
    tested readme-quickstart_test.ts:76-104);
  - shell quoting rejected rather than rewritten (:89-96, tested :106-115).
- Empty block: parser returns `[]` (see Finding 1) but the sole production consumer throws
  immediately — `readme-command.ts:56-57` calls `assertExpectedCommands` before anything executes,
  and it throws on count/mismatch against `README_QUICKSTART_EXPECTED_COMMANDS`
  (readme-command.ts:171-187). Drift test likewise fails on equality.
- Bidirectional drift is a test failure: `readme-quickstart-drift_test.ts:8-14` reads the **real
  root README** via `import.meta.url`-relative path and asserts the parsed commands equal
  `README_QUICKSTART_EXPECTED_COMMANDS`. Passing at head proves README ↔ gate alignment in both
  directions.

### 2. One command, one attempt — PASS

- `readme-command.ts:144-159` (`runCommand`) awaits `runAspireCommand` exactly once; the catch
  converts a spawn failure to `code: 1` with a stderr string. No retry loop, no fallback command,
  no `ASPIRE_RESTORE_MAX_RETRIES`-style budget anywhere in `readme-command.ts` /
  `readme-quickstart-suite.ts` (grep clean).
- Suite gates leave the `retry` parameter `undefined` (readme-quickstart-suite.ts:81-91; the
  factory signature places `retry` at slot 8, `gate-factory.ts:52-75`), asserted by
  readme-quickstart-suite_test.ts:32-34 (`assertEquals(gate.retry, undefined)`).
- Contrast maintained: `aspire-walk.ts` keeps its documented retry classification
  (`retryableRestore`, exit 124, `ASPIRE_TIMEOUT_CLASSIFICATION`) and its walk-level budget
  lives in `quickstart.walk`, untouched. The **only** change to `aspire-walk.ts` is
  `async function runAspireCommand` → `export async function runAspireCommand`
  (aspire-walk.ts:98) — confirmed by diff.
- Failure surfaces a named gate failure receipt: per-command receipts
  `.llm/tmp/readme-quickstart/receipts/NN.json` with argv, cwd, exitCode, timedOut, durationMs,
  stdoutTail/stderrTail (readme-command.ts:24-43, 103-134, 291-303); non-zero/timeout additionally
  logs `README line N failed exactly as printed: <command>` (:136-140); the gate failureHint
  points at the receipt (readme-quickstart-suite.ts:88). Tails truncated at 4 000 chars, not
  masked. Nothing suppressed; gate is `critical: true`.

### 3. Executable readiness — PASS

- README readiness line is exactly `aspire wait postgres --status healthy --timeout 60`
  (README.md:58).
- Verified read-only against the locally installed Aspire CLI (`aspire wait --help`, nothing
  started): `aspire wait <resource>` accepts `--status <healthy|up|down>` (default healthy) and
  `--timeout <seconds>` (default 120); `--apphost` is optional. No invented flags; both flags are
  real. The generated `withHttpEndpoint` registration (render-http-endpoint.ts) confirms the
  service-model matches.

### 4. Suite shape — PASS

- `readme-quickstart-suite.ts:65-70`: gates built by mapping `README_QUICKSTART_EXPECTED_COMMANDS`
  (README order) to one command gate each via `README_GATE_IDS`/`README_GATE_PHASES`, then
  `...createCleanupGates()` **unchanged** — cleanup doctrine is inherited, not reimplemented.
  `createCleanupGates()` (runtime-gates.ts:269-301) returns the same `cli-e2e-aspire-cleanup`
  run-gate used by the other expensive suites.
- `cli-surface.ts` adds only: `QUICKSTART.README` id + title, membership in
  `EXPENSIVE_RUNTIME_SUITE_IDS` (suite lease), and the 11 gate ids. `registry.ts` adds only the
  suite descriptor. All additions; no existing entry modified.
- Read-only listings executed: `deno task e2e:cli suites` lists `readme.quickstart — Root README
  Quickstart walk`; `deno task e2e:cli gates readme.quickstart` lists the 11 command gates in
  exact README order (`01-install-cli` … `11-curl-health`) plus `cleanup.aspire-stop`, exit 0.
- Runner-side doctrine: cleanup gates run in `finally` after the main loop breaks on a critical
  failure (suite-runner.ts:97-119), and Docker pruning is snapshot-diff based
  (`captureSnapshot` → `pruneCreatedResources`), so foreign/unknown-owner containers are never
  removed.

### 5. Hosted runner — PASS

- `.github/workflows/e2e-cli-prod.yml:137-145`: one new step immediately after the
  `quickstart.walk` step, running exactly
  `deno task e2e:cli run readme.quickstart --source jsr --cli jsr:@netscript/cli@<version>
  --cleanup --report .llm/tmp/readme-quickstart-prod-report.json --log-file
  .llm/tmp/readme-quickstart-prod.ndjson`.
- Gated by the identical condition as its neighbour (`always() &&
  steps.install_published_cli.outcome == 'success' &&
  steps.install_workspace_dependencies.outcome == 'success'`; lines 127 and 138 are byte-identical).
- Report added to the failure-summary loop (line 151) and artifacts to the upload list (lines
  174-177, including `state.json` and `receipts/*.json` — the receipt trail survives).
- No `continue-on-error`, no retry step, no manual-recovery step anywhere in the workflow (grep:
  zero matches).

### 6. Process lifecycle — PASS

- `runAspireCommand` pipes output and passes an `AbortController` signal to `Deno.Command`; the
  deadline aborts, terminating the child (aspire-walk.ts:103-126). The wrapper-level timeout
  (child timeout + 5 s grace, readme-quickstart-suite.ts:15,90) backstops via the command adapter,
  which also aborts on timeout (deno-command-adapter.ts:14,24,43).
- After `aspire wait` succeeds, `<port>` capture runs `aspire describe … --format Json` against
  the already-running AppHost (generated-app-endpoint.ts:237-241) — read-only, starts nothing;
  failures are recorded as `servicePortError` and fail the curl gate loudly rather than being
  swallowed (readme-command.ts:72-78, 230-248).
- Failure paths: main-loop break is inside `try { … } finally { cleanupGates … }`
  (suite-runner.ts:97-119) — `aspire stop`-based AppHost cleanup and owned-only Docker prune run
  on every path, and the workflow passes `--cleanup` so the snapshot prune is armed.

### 7. Doctrine/scope — PASS

See scope confirmation: E2E gate code + README + workflow only; no product-behaviour change, so
FAIL_RESCOPE does not apply.

### 8. Tests — PASS (mandated commands only)

- `deno test --allow-all packages/cli/e2e/tests/domain/readme-quickstart_test.ts
  packages/cli/e2e/tests/presentation/` → **56 passed | 0 failed** (3 s).
- `deno fmt --check` on the 10 changed `.ts` files → clean, exit 0.
- `deno lint` on the same 10 files → clean, exit 0 (desktop-native fixture `catalog:` refusal did
  not surface — known pre-existing baseline outside these files; not raised).
- Prohibited runs (readme.quickstart, quickstart.walk, scaffold suites, `deno task test/check`,
  Aspire/Docker starts) were not executed.

## Static Gates

| Gate            | Command or check                          | Result | Evidence                                            | Notes |
| --------------- | ----------------------------------------- | ------ | --------------------------------------------------- | ----- |
| Format          | `deno fmt --check` (10 changed ts files)  | PASS   | `Checked 10 files`, exit 0                          |       |
| Lint            | `deno lint` (10 changed ts files)         | PASS   | `Checked 10 files`, exit 0                          |       |
| Unit/suite test | mandated `deno test --allow-all …`        | PASS   | 56 passed / 0 failed                                |       |
| Read-only lists | `deno task e2e:cli suites` / `gates …`    | PASS   | suite + 11 gates + cleanup listed, exit 0           |       |
| Typecheck       | covered by mandated test run              | PASS   | test run type-checks all imported changed modules   | full `deno task check` out of scope per prompt |

## Runtime Gates

| Gate                | Validation                                            | Result  | Evidence                                                        |
| ------------------- | ----------------------------------------------------- | ------- | --------------------------------------------------------------- |
| `readme.quickstart` | hosted runner transcript                              | NOT_RUN | prompt: canary-admission gate from next fix-forward canary prod run; DoD intentionally open — not raised |
| CI @ 9cff705f5      | quality / check-test / close-gate / scaffold-static   | PENDING | supervisor-driven in parallel; not cited as evaluator evidence  |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low      | Empty-block fail-closed is enforced downstream, not in the parser: `parseReadmeQuickstartCommands` returns `[]` for a marker block with no bash commands instead of throwing. No silent path exists — the only production consumer (`readme-command.ts:56-57`) throws via `assertExpectedCommands` before execution, and the drift test fails on equality — so the acceptance's "never silently skip" holds everywhere. | `readme-quickstart.ts:45-66`, `readme-command.ts:55-57,171-187`, `readme-quickstart-drift_test.ts:13` | Optional hardening: throw in the parser when zero commands are extracted. Not merge-blocking. |
| low      | The verbatim `curl http://localhost:<port>/health` gate cannot distinguish HTTP 500 from 200 via curl's exit code (no `-f`, and adding one would break verbatim-ness). Readiness is nonetheless independently asserted by the preceding `aspire wait postgres --status healthy` gate, and the receipt's `stdoutTail` preserves the body for inspection. | `README.md:75`, `readme-command.ts:103-134` | Optional future hardening (only if a false-pass is ever observed): assert the receipt body matches the README's printed healthy shape. Not merge-blocking. |

No high/medium findings. No `packages/*/src` product surface touched; no anti-pattern or arch-debt
delta introduced by this scope (E2E harness files only; debt ledger untouched).

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Marker-extracted docs commands need a pinned expected-command constant asserted three ways (drift test vs real doc, walker assertion before each exec, suite gate construction from the same constant) to keep docs and gate honest in both directions | single-source contract constant + bidirectional drift test | e2e docs-walk suites | high |
| Verbatim docs gates should own process teardown through inherited cleanup gates in a runner `finally`, not reimplement teardown | inherit `createCleanupGates()` + snapshot-diff prune | e2e suites that start runtimes | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | PASS |
| Rationale | All eight acceptance criteria hold at converged head `9cff705f5` with direct file:line and executed-command evidence: the README block is marked and the pure parser fails closed on every enumerated error; each command runs exactly once with named, unmasked line-aware receipts; the readiness line's flags are real per `aspire wait --help` (read-only); the suite is one gate per README command in order plus unchanged inherited cleanup gates; the workflow step mirrors its neighbour's gating with report/artifact coverage and no retries or continue-on-error; process teardown is abort-based with cleanup in a runner `finally`; scope is E2E/README/workflow only; and the mandated tests (56/0), fmt, and lint pass on the changed files. The two low findings are optional-hardening observations with no silent-failure path and do not block. |

VERDICT: PASS
