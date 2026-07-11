# Research — issue #665

## Baseline

- Issue #665 is open. Its three acceptance boxes require a proven root cause, applied-and-observed
  requested effort, and loud mismatch escalation.
- Preflight HEAD is `955b4abf639522c7da50bd15d20c6e999acb808f`; the branch started clean.
- Target is internal agentic CLI tooling, classified as Archetype 6. No package/plugin public or JSR
  surface changes.

## Findings

1. `launch-codex-slice.ts` invokes `codex --model <model> -c model_reasoning_effort=<effort> debug
   app-server send-message-v2 <message>` and parses the resulting app-server transcript.
2. Codex CLI 0.144.1 help documents `-c` as a config override, but empirical probes show the helper
   applies `--model` while leaving the per-message `turn/start.effort` null.
3. Probe `019f532a-084c-7751-9a98-6279804a0571`, requested model `gpt-5.6-sol` and effort `medium`,
   returned authoritative `thread/start` values model `gpt-5.6-sol`, provider `openai`, and
   `reasoningEffort: "low"`; its `turn/start` request contained `effort: null`. The turn completed
   successfully. Repeating with explicitly quoted TOML produced the same `low` result in thread
   `019f532a-87fb-70e0-95f8-a88a53923329`.
4. Host config has `model_reasoning_effort = "low"`. Therefore the child inherited the daemon/default
   value. The observer is correctly exposing the wrong applied effort; this is not an observer-scope
   false positive.
5. Existing launcher code already exits non-zero for any non-matched final evidence, but has no
   explicit operator action or opt-out flag and lacks a focused launcher-level escalation test.

## Open questions

- Must resolve now: identify the smallest supported app-server input that sets per-turn effort while
  preserving mobile-visible `send-message-v2` semantics.
- Safe to defer: upstream Codex CLI behavior/doc correction; NetScript must enforce its own contract.
