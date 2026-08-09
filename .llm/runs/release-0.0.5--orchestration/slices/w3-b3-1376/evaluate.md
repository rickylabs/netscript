# IMPL-EVAL: W3-B3 / #1376 / PR #1400

| Field | Value |
| --- | --- |
| Evaluator | Claude · Fable 5 · medium — separate session from the generator (Codex · GPT-5.6 Sol · low) |
| Route | `formal_impl_evaluation`, evaluates=openai → native opposite family |
| Subject | `origin/fix/mcp-execute-command-host-cli@eb0889224` diffed against `origin/main@aa8e151e6` |
| Method | Read-only from the orchestrator worktree; independent re-execution from `git archive` exports of S1 (`6a5ee1bf8`) and head (`eb0889224`) in the session scratchpad |
| Date | 2026-08-09 |

## Verdict

**FAIL_FIX** — the implementation, tests, docs, and gate evidence all verify (every substantive claim I re-executed reproduced exactly), but the merge close-gate for `Closes #1376` is not satisfiable as the PR stands: all ten live acceptance rows on #1376 are unchecked, no fenced `acceptance-evidence` mirror block exists in the PR body or any comment, and the S5 handoff comment falsely asserts the live rows "are truthfully ticked." Protocol rule 12 makes unchecked acceptance criteria on the referenced issue block the pass. The fix is bookkeeping, not code.

## Findings (by severity)

### F1 — blocking. Close-gate state contradicts the handoff claim; no mirror mapping exists

- Claim under test: S5 handoff comment (2026-08-09T02:39:24Z) — "All ten live #1376 acceptance rows are truthfully ticked and the PR body now carries `Closes #1376`."
- Evidence:
  - `gh issue view 1376 --json body | grep '^- \['` (run 2026-08-09, twice) → all ten rows are `- [ ]` (unchecked). `#1376` has zero comments.
  - `grep "acceptance-evidence"` over the PR body and all 9 PR comments (`gh api repos/rickylabs/netscript/issues/1400/comments --paginate`) → zero matches. The netscript-pr close-gate (`.claude/skills/netscript-pr/SKILL.md`, "Merge close-gate (#387)") requires either checked boxes with linked evidence or one fenced `acceptance-evidence` YAML block per closing issue for the `status:ready-merge` mirror (`.llm/tools/validation/mirror-acceptance-evidence.ts`) to consume. Neither exists.
  - The only ticked copy is the run artifact `plan.md` "Live acceptance rows (quoted verbatim from #1376)" — a branch-local mirror, not the live issue.
- Why it blocks: IMPL-EVAL is the pass that authorizes `status:ready-merge`. Evaluator protocol rule 12: "for every referenced issue, its acceptance criteria and every `gate:` checkbox are checked with linked evidence" before any `Closes #N` merge. As-is, the ready-merge close-gate CI has ten unchecked boxes and no mapping to mirror, and the commit-trail record carries a false completion claim.
- Required fix (no code): add one fenced `acceptance-evidence` block to the PR body (or a PR comment) mapping all ten #1376 boxes to their evidence (worklog rows / slice comments / this verdict's reproductions), or tick the live boxes directly with linked evidence; and post a correction to the S5 handoff sentence on PR #1400.
- `Closes #1376` itself is correct: the work fully resolves the issue's target contract (see acceptance-row statement below), and the keyword sits in the PR body `## Scope`.

### M1 — minor. `context-pack.md` header is stale

- `.llm/runs/.../w3-b3-1376/context-pack.md` line 3 still reads "Phase: `plan-eval`; no product source changed" while the body records S1–S4 completion. Resume-accuracy blemish only; the appended slice states are current.

### O1 — observation, not blocking. A8 repair is partly cosmetic

- The slice-caused A8 (file >300 lines) on `packages/mcp/src/domain/tool-contracts.ts` was cleared to 299 lines (verified: `wc -l` = 299) partly by replacing the named `EXPORT_SURFACE_*` imports with `import * as exportSurfaceShapes` and deleting a blank line — line-count trimming, not structural reduction. No lint-ignore, cast, or `any` was introduced, so it is not review-blocking; recorded so the next touch of this file does not repeat the trick.

### O2 — observation. Issue "Docs/consumer proof" prose not covered

- #1376's non-checklist "Docs/consumer proof" paragraph names the site agent-tooling reference. This PR updates `packages/mcp/README.md` only (per the PLAN-EVAL-passed scope); the docs-site reference is not an acceptance row and belongs to the docs program route.

## Independent verification (commands executed)

All from `git archive` exports in the scratchpad; raw exits observed directly.

| Check | Command | Exit | Result |
| --- | --- | ---: | --- |
| S1 compile-time RED label | `deno check --unstable-kv --no-lock packages/cli/.../cli-mcp-adapters_test.ts` @ S1 tree | 1 | Exactly TS2554 (third `HostCliRuntime` arg absent) + TS2339 (`identity` absent) — class and reason match the recorded evidence |
| S1 behavioral RED label | `deno test ... drift-evidence_test.ts --filter "successful execute_command receipt"` @ S1 tree | 1 | `execute_command` returned `isError:false`, then `receipt.command` was `undefined` vs `"mcp execute_command"` — genuinely behavioral at baseline (S1 test authored against baseline types; identity fields were added to it only in S4) |
| S1 characterization label | `deno test ... command_adapters_test.ts --filter "published CLI prefix by default"` @ S1 tree | 0 | 1 passed — correctly labeled not-RED |
| Decisive CLI-host suite | `deno test ... cli-mcp-adapters_test.ts` @ head tree | 0 | 4/4 incl. `9.9.9-host` fixture actually spawned via `execute_command`, list/execute both reporting `9.9.9-host`, no `jsr:@netscript/cli@` in either identity |
| Falsifiability (mutation) | Reverted S3 wiring in the scratch copy (`commandExecutor: new SpawnCommandExecutor()`), re-ran suite | 1 | 2/4 failed (default-version and mismatched-host tests) — the decisive tests pin the fix and can fail |
| Full MCP package | `deno test --no-lock --allow-all packages/mcp/tests/` @ head tree | 0 | 113 passed, 0 failed |
| MCP quality scan | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/mcp/src` @ head tree | 0 | `findings:[]`, `allowCount:0` |
| #1403 roots claim | `scan-code-quality.ts:18` | — | `DEFAULT_ROOTS = ['packages/cli/src', 'plugins']` — root `quality:gate` exit 0 is indeed uninformative for `packages/mcp`; the lane declared this and ran the scoped scan (reproduced above). The new CLI-side test file lives under `packages/cli/src`, which root `quality:gate` does cover |
| MCP doctrine checker | `deno run ... .llm/tools/fitness/check-doctrine.ts --root packages/mcp` @ head tree | 1 | FAIL=1 WARN=2 INFO=1: two baseline F-16 cardinality warnings, baseline A9 info, baseline A14 false-positive on untouched `service-endpoint-sources_test.ts` (`describe` local helper); no A8 — slice-caused warning repaired as claimed |
| Gate integrity | grep added diff lines for `deno-lint-ignore`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`, `any` | — | Zero hits in code; the single textual match is prose ("any MCP-capable host") inside the generated README string constant |
| Lock hygiene | `git diff --stat origin/main...head` | — | `deno.lock` untouched; 24 files, all in scope |

## The eight verdict questions

1. **Version identity fixed end to end — yes.** `run-agent-mcp.ts` resolves the re-entry prefix from the live process (`[Deno.execPath(), "run", "-A", Deno.mainModule]` script/installed; `[Deno.execPath()]` compiled via `isCompiledBinary()`), injects `CLI_PACKAGE_VERSION`, and replaces catalog `version: "current"` with `host.version`. One executor instance's frozen identity is shared by `list_commands` and `execute_command` (`packages/mcp/cli.ts:133`, bindings at `:197-210`). The decisive test can fail: pre-fix it fails at type-check (reproduced, TS2554/TS2339), and with the S3 wiring reverted post-types it fails behaviorally (mutation check, 2 failures). The `9.9.9-host` fixture genuinely executes the host entrypoint — the child's stdout marker is asserted.
2. **Standalone decision honestly implemented and publishable — yes.** `SpawnCommandExecutor` defaults to `mode: 'standalone'`, `version: MCP_PACKAGE_VERSION`, `DEFAULT_CLI_COMMAND` pinned to `jsr:@netscript/cli@${MCP_PACKAGE_VERSION}`. `packages/mcp/README.md` "CLI executor identity" states what a standalone server spawns and why, and explicitly disclaims the cycle-1 false claim: "This is an explicit MCP-owned compatibility policy, not a claim that publish-asset generation compares the two package versions." No equivalent false claim reappears anywhere in the shipped docs.
3. **`record_drift` still tells the truth — yes.** `diagnosticEvidenceRefusal` now adds "or successfully call MCP \"execute_command\" with resource \"${resource}\"" — accurate, since a success receipt requires the runner's `resultSucceeded` (pre-existing at baseline, `mcp-server.ts:154`) to see `status !== 'fail'`, which `SpawnCommandExecutor` sets from the child exit (`exitCode === 0 ? 'pass' : 'fail'`, timeout → 124 → fail). Every tool the refusal names is receipt-producing. TTL semantics unchanged and correctly restated in the README.
4. **Denial receipts safe — yes.** Denial returns `ok:false` from the flow → runner settles `succeeded=false` → `withReceipt` overwrites the named resource's receipt with `exitStatus: 1`. The five-denial test asserts `executions === 0` (executor never invoked), the pre-seeded green `mcp doctor` receipt overwritten to failure, and `record_drift` refused. An earlier success cannot survive; the overwrite cannot mask a success in the only sense the system consumes one, because `record_drift` reads only the freshest receipt — the store was already latest-state-per-resource at baseline (`withReceipt`, `cli.ts:245-273`), so this is consistent fail-closed semantics, per the locked plan decision 5.
5. **Mutating-verb surface safe, not merely consistent — position holds.** `command-policy.ts` is untouched (not in the diff; the issue's own "Not a goal"). The stated safety basis — default-deny with deny-beats-allow, guaranteed host-binary identity, truthful exit-aware receipts — removes the issue's named hazard: a different release silently writing to the project. The allowed mutating verbs now run the same binary the maintainer is running, visibly.
6. **Acceptance rows and `Closes` — all ten proven; live boxes not ticked (F1).** Row statement below. `Closes #1376` is correct and in the body.
7. **Gate integrity — clean, and the #1403 honesty requirement was met.** No new ignore/cast/`any` (grep). Root `quality:gate`/`arch:check` exit 0 explicitly declared not-MCP-evidence in the PR body, worklog, and drift.md; the scoped equivalents (MCP quality scan, MCP doctrine checker, scoped check/lint/fmt, export-map `doc:lint`, JSR audit, publish dry-run) were run by the lane and the two decision-bearing ones reproduced here. Serialized `scaffold.runtime` ran once post-grant: exit 0, `passed=78 failed=0 skipped=2` with both skips declared under #1398; token released in the handoff.
8. **Separability from #1375 — respected.** The diff touches no `--docs-root`, `writeHostConfig`, `NETSCRIPT_DOCS_ROOT`, corpus-selection, or host-config surface. The shared `run-agent-mcp.ts` hunk is confined to host runtime/version/executor injection; the shared `README.md` hunks are the executor-identity section, two tool-catalog rows, and the record-drift evidence sentence; `publish-assets.generated.ts` changed only the embedded README constant. Each shared-file slice comment carried the disclosure the plan required.

## Acceptance-row statement (#1376, live body order)

| # | Row | Proven? | Evidence |
| --- | --- | --- | --- |
| 1 | `agent mcp` injects re-entering `cliCommand` | **Proven** | `run-agent-mcp.ts:154-167,190-194`; host tests 1–2; mutation check fails when reverted |
| 2 | No JSR download when CLI-hosted | **Proven** | Command prefix asserted to contain no `jsr:@netscript/cli@` in both identities; actual spawned child is the host entrypoint (marker asserted) — no JSR specifier, hence no download; `behavior.mcp-endpoint-directory` passed in the serialized runtime |
| 3 | `list_commands` reports `CLI_PACKAGE_VERSION`, not `"current"` | **Proven** | `version: host.version` replaces `"current"`; test asserts `identity.version === CLI_PACKAGE_VERSION` (default) and `9.9.9-host` (injected) |
| 4 | `execute_command` results include resolved command + version | **Proven** | `executor` required in the output schema (`tool-contracts.ts`); asserted in host and adapter tests |
| 5 | Receipt on success and on failure | **Proven** | drift-evidence tests: success → `exitStatus: 0`; failed child → `exitStatus: 1`; settlement path verified in `mcp-server.ts:107-143` + `withReceipt` |
| 6 | `record_drift` accepts an `execute_command` receipt | **Proven** | Behavioral RED (exit 1, reproduced) → GREEN test ids 20/21 |
| 7 | Refusal message accurate | **Proven** | `record-drift-flow.ts:18-23`; every listed tool writes receipts; asserted in test |
| 8 | Tests cover host resolution / standalone fallback / both exit paths | **Proven** | Enumerated above; standalone fallback correctly kept as characterization (exit 0, reproduced) |
| 9 | Denied commands: no success receipt, cannot authorize | **Proven** | Five-denial loop: `executions=0`, receipt forced to `exitStatus: 1`, drift refused |
| 10 | Mismatched host version: no spawn resolves to MCP pin | **Proven** | `9.9.9-host` test, reproduced 4/4 and mutation-falsifiable |

All ten are proven by executed evidence. None is ticked on the live issue, and no mirror mapping exists — that gap is F1 and the sole reason this verdict is not `PASS`.

## Fix list

1. F1 — add the fenced `acceptance-evidence` YAML block for #1376 (all ten boxes → evidence) to the PR body or a PR comment, or tick the live boxes with linked evidence; post a correction to the S5 handoff sentence. No code change.
2. M1 — refresh the `context-pack.md` phase header. (One line, may ride along.)

Eval cycle 1 of 2 consumed.
