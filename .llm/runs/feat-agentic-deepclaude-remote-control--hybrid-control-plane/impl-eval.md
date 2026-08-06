# IMPL-EVAL — Hybrid Claude Control Plane

## Verdict

`PASS` — merge-ready subject to required GitHub checks.

## Evaluator Independence

- Evaluator: OpenCode through OpenRouter, `minimax/minimax-m3`, high effort.
- Generator: Codex GPT-5.6 Sol plus bounded implementation subagents.
- The evaluator ran in a separate process/session and made no repository edits.
- OpenHands was intentionally excluded by owner directive because cloud agents cannot reproduce the
  local agentic toolchain.

## Independent Evidence

- Focused hybrid and volatile suite: 34 passed, 0 failed.
- Exact generated-permissions cancellation test: passed. The MCP server ran with
  `--allow-run=setsid,kill`, cancelled a TERM-resistant leader/descendant group, escalated to KILL,
  and proved the descendant PID disappeared.
- Agentic-wide wrappers: check selected 147 files across two batches with zero failures; lint and
  format selected 147 files with zero findings.
- Canonical and Claude skill mirrors were byte-identical.
- `deno.lock` was unchanged from the base.
- Live native Remote Control → MCP → DeepSeek evidence returned exact
  `HYBRID_REMOTE_DEEPSEEK_OK`, with requested and argv-observed identities both resolving to
  OpenRouter / DeepSeek V4 Flash 0731 / high.

## Blocking Findings

None.

## Non-blocking Observations

- Route observation is intentionally invocation-level (`opencode_argv`), not provider-response
  attestation; documentation states that limitation.
- Native Claude must still take the supervisor/tool-selection turn, so this is not a literal
  zero-Claude-quota workaround or transparent model substitution.
- The earlier Grok 4.5 high adversarial finding about scoped `Deno.kill` permission was materially
  valid and is closed by the exact-permissions group-signal implementation and orphan test.
- The surviving canary tmux name changed after host recovery; durable evidence is captured in the
  harness and PR comment rather than relying on scrollback.

## Final Verdict

`PASS`
