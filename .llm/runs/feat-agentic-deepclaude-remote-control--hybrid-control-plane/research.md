# Research — production hybrid Claude Remote Control

## Re-baseline

- Carried-in sources: merged PR #1314 and `aattaran/deepclaude`.
- Re-derived against `orchestrator/0.0.5` at `229de5e237133c1dc8d063500cb9fc2be32620cd`
  on 2026-08-05.
- PR #1314 provides a credential-isolated OpenRouter gateway and inference-only Claude launcher,
  but correctly rejects Remote Control on current Claude Code.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | PR #1314 is merged and its gateway/credential primitives are on the base branch. | `git log --oneline origin/orchestrator/0.0.5` |
| 2 | Claude Code 2.1.139+ deliberately disables Remote Control when API-key or third-party-gateway configuration is detected. | Official Claude Code changelog entries for 2.1.92 and 2.1.139. |
| 3 | Claude Code versions below 2.1.139 cannot provide Remote Control. A live 2.1.91 probe exits with “Version 2.1.139 or higher is required.” | `npx --package @anthropic-ai/claude-code@2.1.91 claude remote-control` |
| 4 | Therefore no official Claude version supports both custom model transport and Remote Control; version pinning cannot close the gap. | Findings 2–3. |
| 5 | `aattaran/deepclaude` sets `ANTHROPIC_BASE_URL` before `claude remote-control`, the exact configuration current Claude rejects. Its Linux launcher also parses the proxy's first log line as a port. | Upstream `deepclaude.sh`, `proxy/start-proxy.js`, and `proxy/model-proxy.js`. |
| 6 | Current global Claude is 2.1.222 and must remain current; the workaround must not patch its binary, inject a CA, or intercept TLS. | `claude --version`; owner direction and PR #1314 drift record. |
| 7 | The supported seam is delegation: keep native Claude/OAuth/bridge traffic untouched, expose an explicit local tool that invokes the existing credential-isolated OpenCode/OpenRouter runner, and return bounded results to Claude. | `.llm/tools/agentic/opencode/` and `lib/openrouter-credential.ts`. |
| 8 | Delegation preserves mobile visibility and local tools, but still consumes a small native Claude turn to select/use the worker; it cannot bypass a hard zero-quota state. | Claude Remote Control architecture and tool-call semantics. |

## jsr-audit surface scan

- N/A: this changes internal `.llm/tools/agentic` tooling, not a published package/plugin surface.

## Open questions

- None that force rework. The PLAN-EVAL must challenge the MCP/tool protocol, lifecycle cleanup,
  prompt/context boundary, result-size limit, and credential isolation before implementation.
