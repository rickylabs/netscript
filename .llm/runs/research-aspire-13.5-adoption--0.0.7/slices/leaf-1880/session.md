# leaf-1880 (PR #1952) — IMPL-EVAL session record

- Head: `478450a3c`; base main `ba6f1f49a`; worktree `007-aspire-eval-1952` (detached).
- Route: `agentic:claude-openrouter` · z-ai/glm-5.3-flash · xhigh (sanctioned local recovery route).
- Attempt 1: session `16762a5f-40e0-41a1-96b4-57d02472f738` in `007-eval-1952` — lost when the
  worktree was removed externally at ~23:47Z (D-334); no verdict.
- Attempt 2: session `a27d7dd5-88ac-4654-9e65-477f6e21c3d3`; 30 turns; cost USD 1.33.
- Verdict: **PASS** — checks 1–7 PASS; three low non-blocking findings (fixture wiring unit seam,
  `appHostSourceOf` duplicate of `containerAppHostSource`, docker grant on garnet-only tiers).
  See `evaluate.md`, `impl-eval-comment.md`.
