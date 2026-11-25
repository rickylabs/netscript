# Drift — feat-rfc-0008-rolling-quotas--rfc-0008

Append-only.

| Date | Severity | Entry |
| ---- | -------- | ----- |
| 2026-11-25 | minor | Owner matrix override recorded before launch: builder on `antigravity` / `gemini-4-neon` (`thought_level: xhigh`); round-1 IMPL-EVAL on `claudeAgent` / `claude-fable-5-2` (`effort: high`, Anthropic vs Google family); optional subsequent IMPL-EVAL pass on `antigravity` / `gemini-4-hydrogen` (`thought_level: xhigh`) only if needed. Transport is T3 `delegate_task` (`isolation: 'worktree'`). See `worklog.md` § Owner direction. |
| 2026-11-25 | minor | Re-exported `type RateLimitPolicyConfig` alongside `RateLimitStore` in `packages/service/mod.ts` because `RateLimitStore.validate?: (config: RateLimitPolicyConfig) => void` triggered a standalone `private-type-ref` diagnostic in `deno task doc:lint --root packages/service` on `./mod.ts`. Keeps root entrypoint `deno doc --lint` clean at 0 diagnostics (same pattern as existing `RateLimitRequest`/`RateLimitDecision` re-exports in `packages/service/mod.ts`). |
