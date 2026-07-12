# beta8-ship — Codex thread ledger (orchestrator-maintained)

| slice | branch | thread | model/effort (requested) |
| --- | --- | --- | --- |
| #663 | fix/663-release-cut-pr-api | 019f5326-6955-72e0-8646-6aba3b30a6a4 | luna/max (resumed after ledger-crash abort) |
| #664 | fix/664-launcher-allow-env | 019f5326-f78e-7500-9ce9-7ed4b3a8362d | luna/max |
| #665 | fix/665-route-identity-effort | 019f5329-2940-7753-9835-61e808871cd2 | sol/high (launcher exit 1 on its own mismatch check post-send; thread active) |
| #659 | refactor/659-remove-legacy-aspire | 019f5329-35c0-7d52-8a73-d885832da8ca | sol/medium |
| #460 | feat/460-modeloptions-passthrough | 019f532a-2439-79f2-b3e8-c4066cae6087 | sol/medium |
| #495 | fix/495-fresh-sandbox-stub | 019f532a-321e-7852-84d8-93e02be64afa | sol/medium |
| #496 | feat/496-token-budget-history | 019f532a-3e86-7b10-b4f0-030d9590e01c | luna/max |
| #498 | feat/498-vision-adapter | 019f532b-24d2-7f32-bcb4-386d222ae990 | sol/medium |
| #500 | feat/500-retry-backoff-seam | 019f532b-312b-7013-a53b-30630553c6f6 | sol/medium |
| #380 | feat/380-prompt-assembly | 019f532b-3e2d-78d2-ba55-79bc50b81d50 | sol/medium |
| #246 | feat/246-skill-loader-port | 019f5330-b967-75a1-9849-6594ea644eec | sol/high |
| #497 | feat/497-otel-genai-adapter | 019f5330-cbc0-7c90-9662-47b8e84ccf4a | sol/medium |
| #219 | feat/219-durable-chat-adapter | 019f5330-dc45-70c3-8870-3033e7825e9f | sol/xhigh |

Orphan probe sessions (idle, ignore): 019f532a-87fb, 019f532e-3903.
Steering: `deno run --no-lock -A .llm/tools/agentic/codex/codex-resume.ts --thread-id <id> --message "..." --worktree /home/codex/repos/ns-b8-<n>`
Docs agents (Claude Opus 4.8): 660a, 660b, 661s — via orchestrator Agent tool, see orchestrator-session.md.
