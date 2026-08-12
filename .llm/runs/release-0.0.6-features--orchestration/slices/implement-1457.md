use harness

# Slice implementation — #1457 chat proxy query forwarding

- Implementation lane: Codex · GPT-5.6 Sol · low (`light_implementation`)
- Worktree: `/home/codex/repos/ns006-1457`
- Branch: `fix/1457-chat-proxy-query-forwarding`
- Baseline: `origin/main@f99cb4fbf`
- Surface: `packages/fresh/src/runtime/ai/stream-proxy.ts` and its focused tests only
- Excluded: `application/defer/**`, `stream-url-resolver.ts`, headers, auth, body, streaming,
  abort, and response sanitization

## Harness selection

- Archetype 2 (Integration): the published Fresh handler is an HTTP proxy edge with an injected
  `fetch` seam.
- PLAN-EVAL: N/A. The owner locked D1–D4, including collision direction, repeat handling, and the
  hook contract; no implementation-changing decision remains open.
- JSR surface risk: additive optional callback only, with explicit parameter and return types plus
  public JSDoc. No export entrypoint or dependency changes.
- Slice: one commit proving default forwarding, `id` exclusion, authoritative resolved-query
  collision handling, repeated keys, mapping-hook replacement, and no-query stability.

