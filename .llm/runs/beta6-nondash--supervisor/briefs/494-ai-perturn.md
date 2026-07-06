use harness

# Slice AI-494 — per-turn generation options + reasoning support across shipped chat adapters (#494)

You are a Tier-D implementation agent (WSL Codex, high effort) for harness run
`beta6-nondash--supervisor`. You implement exactly this slice; the supervisor reviews before
sign-off. Do NOT edit `.llm/runs/beta6-nondash--supervisor/` (supervisor-owned).

## SKILL

Read before implementing:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md` (ai-core is ports/adapters; plugin-ai-core carries
  the zod contract — lockstep law)
- `.agents/skills/netscript-tools/SKILL.md` (scoped check/lint/fmt wrappers are the ONLY gate evidence)
- `.agents/skills/netscript-deno-toolchain/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/rtk/SKILL.md`

## Identity

- Issue: **#494** `feat(ai-core)` — epic #238 family, milestone `0.0.1-beta.6`.
- Worktree: `/home/codex/repos/netscript-494-perturn` (fresh clone, branch already checked out).
- Branch: `feat/494-ai-perturn-options` — **no upstream is set; keep it that way.**
  Push ONLY with `git push origin HEAD:refs/heads/feat/494-ai-perturn-options`.
- Base: `origin/main` @ `a1669f60`.

## Scope (from issue #494 — implement fully)

Today `ChatClientRequest` (`packages/ai/src/ports/chat-client.ts:38-48`) carries only
`messages/system/tools`; `AgentLoopOptions` only `signal/maxSteps`. Only
`OpenRouterModelProviderConfig.reasoningEffort` exists (static per instance). The internal
`toTanstackChatClient` already has a `modelOptions` passthrough
(`packages/ai/src/adapters/tanstack-chat-client.ts:55-62,106`). `AgentChunkType`
(`packages/ai/src/contracts/chunk.ts:17-24`) has no reasoning chunk.

Acceptance criteria:

1. An owned, provider-neutral per-turn options type (reasoning effort off/low/medium/high,
   `maxOutputTokens`, open provider-options record) threads
   `AgentLoopInput`/`AgentLoopOptions` → `ChatClientRequest`/call options → adapter `modelOptions`.
2. Anthropic, OpenAI-compatible, and OpenRouter adapters map it provider-natively (Anthropic
   `thinking`/`output_config.effort`, OpenAI `reasoning_effort`, OpenRouter `reasoning:{effort}`;
   Ollama documented as no-op).
3. `AgentChunk` gains a reasoning-delta chunk; the zod contract schema in **`plugin-ai-core` is
   updated in lockstep** (this is a hard law — search for every consumer of the chunk contract).
4. Probe: an eis-chat-shaped per-message effort picker is expressible with shipped adapters only —
   demonstrate via a test or example snippet in the PR body.
5. Doc-lint + adapter tests green; publish dry-run green.

Reference consumer patterns: eis-chat `apps/dashboard/lib/models.ts:139-162`,
`routes/api/chat.ts:92-162` (read-only reference — do not vendor code from it).
Design source: `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/` (proposal + epic-and-issues).

## Constraints

- Surface: `packages/ai/` (ports, adapters, contracts) + `packages/plugin-ai-core/` (zod contract
  lockstep). Telemetry T6 will later touch `packages/ai/src/runtime/mod.ts` for TelemetryPort
  invocation — keep your runtime edits minimal and scoped to option threading.
- The published `@netscript/fresh/ai/sandbox` is a throwing stub (drift D-4) — irrelevant to this
  slice; do not touch `packages/fresh/`.
- Backward compatibility: per-turn options are additive/optional — existing adapter call sites
  must compile unchanged.
- Do not commit `deno.lock`. No new casts beyond the 2 accepted repo-wide.

## Validation (gate evidence — run from worktree root)

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/ai --ext ts,tsx`
  (and `--root packages/plugin-ai-core`); same roots for the lint + fmt wrappers.
- Tests: `rtk proxy deno test -A packages/ai` + `rtk proxy deno test -A packages/plugin-ai-core`;
  add adapter mapping tests (each provider's native payload asserted) + reasoning-chunk tests.
- `deno doc --lint` on both packages' full export maps; `rtk proxy deno task publish:dry-run`.
- Direct `deno check` invocations must include `--unstable-kv`.

## Protocol

1. Implement in reviewable commit slices.
2. Push with the explicit refspec above.
3. Open a **draft PR** to `main` via gh (from `/tmp`; body via `--body-file`): title
   `feat(ai-core): per-turn generation options + reasoning chunks across shipped adapters`, body
   includes scope summary, the effort-picker probe snippet, gate evidence, and **`Closes #494`**;
   labels `type:feat,area:ai,priority:p1,wave:now,epic:ai-stack,status:in-review`; milestone
   `0.0.1-beta.6`.
4. Comment on your PR with the gate-evidence block (commands + exit codes).
5. Final message: PR URL, commit list, gates run + results, any drift/debt discovered.
