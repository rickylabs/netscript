# Opposite-family review — PR #1217

- **Lane:** `review_claude` (Codex review of Claude-authored repo tooling)
- **Branch:** `feat/agentic-claude-openrouter-run`
- **Reviewed range:** `a194d5a03..d19db2773`
- **Verdict:** **FIX_FIRST**

The exact requested tests pass, and the `claude-print.ts` refactor preserves the prior happy-path
child exit code plus the existing guard SIGTERM → one-second SIGKILL escalation in source. The
first-class runner is not ready to approve, however: it bypasses the repository's established
Claude/OpenRouter credential-isolation policy, and its new tee path can abandon a running child
after reporting launcher failure.

## Findings

### BLOCKING — the launcher does not isolate cached Claude auth or rival provider credentials

`openRouterClaudeEnvironment()` returns only `ANTHROPIC_AUTH_TOKEN` and an empty
`ANTHROPIC_API_KEY` (`.llm/tools/agentic/claude/openrouter-run.ts:60-81`). `runClaudePrint()` then
passes that object to `Deno.Command` without `clearEnv: true`
(`.llm/tools/agentic/claude/claude-print.ts:126-133`), so those two entries are merged into the
parent environment. This has two concrete consequences:

1. When `OPENROUTER_API_KEY` was exported, it remains present in the Claude child in addition to
   the mapped `ANTHROPIC_AUTH_TOKEN`; `OPENAI_API_KEY`, inherited route variables, and any other
   parent credentials also remain. The key is not placed in argv or printed by the launcher's own
   messages/audit event, but child stdout is inherited or streamed without redaction, and
   `--output` tees that raw stream. A Claude turn running with `bypassPermissions` can therefore
   expose inherited credentials through tool output.
2. Emptying `ANTHROPIC_API_KEY` does not isolate the native Claude config/login cache. The child
   still sees the default/inherited `CLAUDE_CONFIG_DIR` and home configuration. A cached native
   login is not represented by `ANTHROPIC_API_KEY`, so the claim at
   `.llm/tools/agentic/claude/openrouter-run.ts:57-58` is not established by that assignment.

This contradicts the suite's existing provider contract. The canonical `claude-openrouter`
profile retains only `ANTHROPIC_AUTH_TOKEN` and clears every rival provider/route key
(`.llm/tools/agentic/runtime/provider-profiles.ts:19-42,51-60,82-89`). Its child policy also installs
an isolated `CLAUDE_CONFIG_DIR` (`provider-profiles.ts:228-243`), and the existing runner adapters
materialize the policy with `clearEnv: true`
(`.llm/tools/agentic/runtime/adapters/child-process-environment-adapter.ts:45-63,119-127`). The suite
README itself states that OpenRouter Claude routes use an isolated `CLAUDE_CONFIG_DIR`
(`.llm/tools/agentic/README.md:289-292`).

This is blocking because the new entry point is specifically a credential-owning, paid-provider
boundary. It must use the canonical provider environment policy (including isolated config and
rival-key clearing), not a weaker parallel policy. Tests should assert the complete spawned-child
environment with opaque values and prove that the parent map is unchanged.

### MAJOR — tee setup/write failure leaves the spawned child alive and breaks exit-code fidelity

`runClaudePrint()` spawns Claude before `teeStdout()` opens the requested output file
(`.llm/tools/agentic/claude/claude-print.ts:127-135`; the file is opened at lines 77-81). If file
open, stdout write, or file write fails, control goes directly to `finally`, which clears the
escalation timer and closes the guard but never terminates or awaits the child (lines 137-140).
The CLI then reports its generic exit `2`, not the child's status.

I reproduced this without contacting OpenRouter by putting a bounded fake `claude` executable
first on `PATH` and invoking the exported runner:

```text
child_exit=37
guarded_exit=0 base_override=true
tee_error=NotFound child_alive_after_error=true
```

Thus normal child exit-code propagation and exact-key guard precedence work, but an invalid
`teePath` leaves the child running after the wrapper has failed. With a real child, an approved
request can already be in flight when tee setup/write fails, producing a charge behind an exit-2
launcher failure. Open the destination before spawning or guarantee kill/escalation plus status
reaping on every post-spawn exception, then cover that failure path.

### MAJOR — the six new tests do not exercise the mapping/guard/process behavior they are meant to pin

All six tests in `.llm/tools/agentic/claude/openrouter-run_test.ts` call only
`parseOpenRouterRunArguments()` or `openRouterClaudeEnvironment()`; the file does not import or call
`runClaudePrint`. They verify three parser cases and three credential-resolution cases, but do not
verify any of the following release-critical claims:

- the main launcher always sets `enforceOpenEvaluatorModels: true`;
- the guard's `ANTHROPIC_BASE_URL` wins over a caller-supplied environment;
- a denied model causes SIGTERM, one-second SIGKILL escalation, and exit `78`;
- an ordinary child exit code is returned unchanged;
- tee success preserves streaming/status, and tee failure reaps the child;
- the spawned environment excludes cached login state and rival credentials;
- the key is absent from argv and launcher/audit output.

The pre-existing `claude-print_test.ts` tests only argv construction, while
`evaluator-model-guard_test.ts` tests the HTTP handler in isolation. Both are useful, but neither
closes the exported-runner integration gap. For a paid route whose safety case is the guard and
credential mapping, green parser/unit tests are insufficient.

### MINOR — the CLI silently ignores unknown, duplicate, and malformed optional flags

The comment says every flag is explicit so misuse fails loudly, but the `value()`-based parser
only searches for known names and never consumes/rejects the remaining argv
(`.llm/tools/agentic/claude/openrouter-run.ts:27-51`). A misspelled `--output` is silently discarded
and the paid turn proceeds without the requested artifact:

```text
parse([--model, caller/model, --effort, high, --prompt, /p, --ouptut, result.json])
=> {"model":"caller/model","effort":"high","prompt":"/p"}
```

Reject unknown/duplicate flags and require a value for every present option. This matters more than
normal CLI polish here because a typo should fail before any OpenRouter request can spend credit.

## Verified behavior / non-findings

- **Guard termination source semantics are preserved.** The refactor carries forward the same
  violation callback, SIGTERM, one-second SIGKILL timer, exception handling, violation-to-`78`
  mapping, timer cleanup, and guard close from the prior inline flow. The missing piece is an
  integration test, not an observed source regression in that path.
- **The guard base URL is exact-key override-proof.** `run.env` is spread first and the guard's
  `ANTHROPIC_BASE_URL` second (`claude-print.ts:126`); the fake-child probe observed the loopback URL,
  not the caller value.
- **Happy-path exit fidelity works.** The fake child exited `37`; `runClaudePrint()` returned `37`.
- **No hidden import cycle exists today.** The graph is
  `openrouter-run.ts → opencode-run.ts → config/versions.ts`; `opencode-run.ts` has no edge back into
  Claude tooling, and its `import.meta.main` block does not execute on import. Reusing
  `parseOpenRouterApiKey` is operationally sound, though a provider-neutral credential parser would
  be better ownership than importing an OpenCode executable module from the Claude executable.
- **Closed-model credit protection is correctly placed at the request boundary.** The guard checks
  the actual model-bearing request and does not forward a denied model. The finding above concerns
  auth/environment isolation and process lifecycle, not the allowlist handler.

## Tests run by this reviewer

| Command | Result |
| --- | --- |
| `deno test --no-lock --allow-read --allow-env --allow-run .llm/tools/agentic/claude/openrouter-run_test.ts` | PASS — 6 passed, 0 failed |
| `deno test --no-lock --allow-read .llm/tools/agentic/config/no-hardcoded-volatile_test.ts` | PASS — 4 passed, 0 failed |
| `deno test --no-lock --allow-read .llm/tools/agentic/claude/claude-print_test.ts .llm/tools/agentic/claude/evaluator-model-guard_test.ts` | PASS — 8 passed, 0 failed |

`deno.lock` SHA-256 was
`d1905ca33fa0af26bacbe3a9971a83af347afcdcb415c6770fc8b2f12aea13af` before and after the requested
tests. No live provider call was made, so this review consumed no OpenRouter credit.

## Re-review

- **Re-review range:** `d19db2773..a839ce747` (three commits)
- **Final verdict:** **APPROVE**

The generator genuinely resolved every prior finding. I found no new blocking, major, or minor
correctness issue in the follow-up diff.

### Prior findings disposition

| Prior finding | Disposition | Independent evidence |
| --- | --- | --- |
| **BLOCKING — cached Claude auth and rival provider credentials were not isolated** | **Resolved** | `openRouterClaudeEnvironment()` now obtains the canonical `claude-openrouter` profile, materializes it through `applyChildEnvironmentPolicy()`, and hands the resulting complete environment to `runClaudePrint()` with `clearEnv: true` (`openrouter-run.ts:121-166`). The policy removes `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, inherited route variables, and the caller's native config path; binds only the resolved key to `ANTHROPIC_AUTH_TOKEN`; empties `ANTHROPIC_API_KEY`; and installs the isolated `CLAUDE_CONFIG_DIR`. Tests assert the spawned environment, absent source/rival keys, isolated config, unchanged parent map, and key-free argv. |
| **MAJOR — tee failure abandoned a live child and lost exit fidelity** | **Resolved** | The output file is opened before spawn (`claude-print.ts:168-172`). Any later stream/write failure enters `terminateChild()`, which sends SIGTERM, schedules SIGKILL after one second, awaits child status, and clears the timer (`claude-print.ts:115-140,207-216`). Tests prove an unwritable path never spawns, a mid-stream failure sends SIGTERM/reaps, tee success preserves content/status, and an ordinary child code `37` passes through unchanged. The SIGKILL branch is source-verified; the fast fake settles on SIGTERM, so the test does not wait a real second merely to exercise the timer. |
| **MAJOR — six tests did not exercise the runner/guard/process boundary** | **Resolved** | The launcher suite now has 17 tests and directly imports `runClaudePrint`. It pins mandatory guard opt-in, canonical spawned environment plus `clearEnv`, credential absence from argv, ordinary exit mapping, caller base-URL override resistance, denied model → SIGTERM + exit `78`, tee success, pre-spawn output failure, and post-spawn child reaping. Existing guard-handler and runtime profile/adapter suites remain green. |
| **MINOR — unknown/duplicate/value-less flags were silently accepted** | **Resolved** | `parseOpenRouterRunArguments()` now consumes argv sequentially against a finite flag set and rejects unknown, duplicate, or missing-value arguments before launch (`openrouter-run.ts:40-83`). The exact prior `--ouptut` typo is now a negative test. |

### Flagged ownership seam — accepted

Exporting `applyChildEnvironmentPolicy()` from
`runtime/adapters/child-process-environment-adapter.ts` is acceptable and is **not a finding**. The
function is a pure materializer over the runtime `ChildEnvironmentPolicy` port and
`EnvironmentReader`; the adapter remains its natural owner and still consumes the same function.
The Claude launcher depends inward on the general runtime layer, and no runtime/Claude import cycle
is introduced. Moving the helper to a new neutral module would change file ownership but not improve
the dependency direction or safety contract; doing so now would be speculative churn. A move can be
reconsidered if the policy materializer gains additional independent consumers or adapter-specific
dependencies.

### Tests independently rerun

The following one-pass affected-suite command completed with raw exit `0` and exactly **60 passed,
0 failed**:

```text
deno test --no-lock --allow-read --allow-write --allow-env --allow-run --allow-net \
  .llm/tools/agentic/claude/openrouter-run_test.ts \
  .llm/tools/agentic/claude/evaluator-model-guard_test.ts \
  .llm/tools/agentic/runtime/child-process-environment-adapter_test.ts \
  .llm/tools/agentic/runtime/provider-profiles_test.ts \
  .llm/tools/agentic/runtime/runner-provider-profiles_test.ts \
  .llm/tools/agentic/runtime/provider-canary_test.ts \
  .llm/tools/agentic/runtime/adapters_test.ts \
  .llm/tools/agentic/config/no-hardcoded-volatile_test.ts
```

The pre-existing `claude-print_test.ts` compatibility suite also passed independently: **3 passed,
0 failed**. `git diff --check d19db2773..HEAD` passed. `deno.lock` retained SHA-256
`d1905ca33fa0af26bacbe3a9971a83af347afcdcb415c6770fc8b2f12aea13af` across validation. No live
provider request was made and no OpenRouter credit was consumed.
