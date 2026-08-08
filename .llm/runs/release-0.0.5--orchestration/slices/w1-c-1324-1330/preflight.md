# W1-C preflight — OpenCode MCP attachment and provider-valid resume

Observed on 2026-08-06 before dispatch:

- `netscript agent init --host all` can generate project MCP declarations, but Wave 6 proved the
  OpenCode launcher can ignore them when it owns a separate fixed `OPENCODE_CONFIG`.
- The measured run then exposed zero NetScript/Aspire tools and silently substituted other discovery
  sources, invalidating the experiment rather than merely reducing adoption.
- A separate Wave 6 recovery forwarded an empty assistant turn during OpenCode/OpenRouter resume and
  received the provider's HTTP 400 rejection.
- Current agentic runtime code already centralizes provider profiles, environment isolation, route
  identity, session ownership, and resume planning; the fix must extend those authorities rather
  than create launcher-local policy.

## Required supervisor mission

1. Define typed project-MCP discovery and deterministic OpenCode config translation/merge that
   preserves provider, permissions, model, and credential isolation while attaching the generated
   NetScript and Aspire servers for the current worktree.
2. Add config fixtures for missing, malformed, colliding, and multi-server declarations. Fail closed
   before product code when a run declares MCP-required measurement but expected tools are absent.
3. Add a pre-code receipt proving `tools/list` exposes the expected NetScript/Aspire tools and one
   harmless MCP documentation lookup succeeds. Record available-tool count separately from call
   count and classify MCP/public-web/local-doc/generated-source discovery without prompt content.
4. Normalize provider-facing history before every resume dispatch. Cover interrupted text, tool-only
   turns, empty deltas, reasoning-only events, provider switches, repeated resume, and an
   unsafe-to-normalize case that names only the local event identity.
5. Preserve tool-call/result semantics and ordering while removing or coalescing empty assistant UI
   fragments. Never log secrets, private prompts, raw credentials, or normalized message bodies.
6. Run focused OpenCode/runtime/provider tests, config/history matrices, scoped wrappers, agentic
   suite and docs gates, plus real MCP attachment and a real OpenRouter resume on every route
   required by the current lane policy.
7. Open a draft PR with `Closes #1324` and `Closes #1330` only after all twelve rows have current
   evidence; leave it at `status:impl-eval` for separate Qwen evaluation.

A mocked provider-only test cannot close either real-runtime row. If approved OpenRouter access is
unavailable, finish deterministic local work but hold the handoff at `status:impl` with the missing
live receipts named explicitly.
