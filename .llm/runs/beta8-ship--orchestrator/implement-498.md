use harness

# Slice brief — #498 (E7): OpenAI-compatible vision adapter for VisionProviderPort

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-498`, branch `feat/498-vision-adapter`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-498`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-498 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-498 push origin HEAD:refs/heads/feat/498-vision-adapter`.
- Worklog at `/home/codex/repos/ns-b8-498/.llm/runs/feat-498-vision--codex/worklog.md`.

## Task (issue #498 — read it first; acceptance line is the contract)

`VisionProviderPort` (`packages/ai/src/ports/vision.ts`) defaults to throwing-unconfigured; no
adapter ships. Ship an OpenAI-compatible vision adapter registered via `registerVisionProvider`:
base64 + URL image sources; usage reported. Follow the existing adapter patterns in
`packages/ai/src/adapters/` (transport injection, error mapping, usage chunks) — wrap, don't
reinvent. Inline-chat multimodal parts already work; this is ONLY the dedicated analyze-image seam.

## Validation (evidence in worklog)

- Scoped check/lint on `packages/ai`.
- Unit tests with stubbed transport: request shape for base64 + URL sources, usage propagation,
  error mapping, unconfigured default still throws typed error.
- `deno doc --lint` clean on changed surface; publish dry-run green if export map changed.

## Done means

Adapter + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
