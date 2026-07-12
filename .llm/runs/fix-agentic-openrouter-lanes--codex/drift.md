# Drift Log: durable OpenRouter agentic lanes

## 2026-07-12 — Launcher path evolved since failure report

- **What:** The launcher no longer directly composes `codex --profile ... debug app-server send-message-v2`; it invokes the repo-owned app-server JSONL client, which still carries the named profile into initialization.
- **Source:** `.llm/tools/agentic/codex/launch-codex-slice.ts` and `app-server-message-cli.ts`.
- **Expected:** Direct unsupported top-level profile flag from the carried-in run-eval.
- **Actual:** The bug boundary moved to profile materialization/client initialization; the supported isolated profile is still not launcher-owned.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` findings 1–3.

## 2026-07-12 — App-server effort override is ineffective or misobserved

- **What:** The run requested effort `max`, but the app-server launch record observed `low` and reported a route mismatch.
- **Source:** owner steering plus `codex-thread-ids.md` requested/observed identity.
- **Expected:** App-server initialization applies and reports the explicitly requested effort.
- **Actual:** Requested `max`; observed `low`.
- **Severity:** significant
- **Action:** fix
- **Evidence:** S1 adds explicit initialization propagation and a v0.144 observation fixture.
