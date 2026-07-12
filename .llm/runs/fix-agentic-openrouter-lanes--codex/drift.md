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

## 2026-07-12 — Claude empty output was cached-auth contamination

- **What:** The reported Claude/OpenRouter command returned empty output because the normal Claude config carried native cached state into the custom gateway process.
- **Source:** Official OpenRouter integration guidance and bounded isolated live probes.
- **Expected:** Anthropic-compatible endpoint/model mapping might itself be incompatible.
- **Actual:** With a dedicated `CLAUDE_CONFIG_DIR`, explicit empty `ANTHROPIC_API_KEY`, and late-bound auth token, GLM completed text and Bash-tool turns.
- **Severity:** significant
- **Action:** fix
- **Evidence:** `glm-live-evidence.md`; `provider-profiles.ts`; `claude-print.ts`.
