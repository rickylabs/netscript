use harness

# Slice brief — #495: createNetScriptMcpSandbox must not ship as a throwing FA0 stub

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`
(packages/fresh is framework source), `.agents/skills/deno-fresh/SKILL.md`,
`.agents/skills/jsr-audit/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-495`, branch `fix/495-fresh-sandbox-stub`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-495`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-495 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-495 push origin HEAD:refs/heads/fix/495-fresh-sandbox-stub`.
- Worklog at `/home/codex/repos/ns-b8-495/.llm/runs/fix-495-sandbox-stub--codex/worklog.md`.

## Task (issue #495 — read it first; acceptance boxes are the contract)

`packages/fresh/src/runtime/ai/sandbox.ts` exports `createNetScriptMcpSandbox` which throws
`not implemented (FA0 skeleton)` and is PUBLISHED on `@netscript/fresh/ai/sandbox`.
`createMcpSandboxHandler` on the same subpath is real. Decide implement-vs-unpublish in the
worklog with a short rationale:
- **Preferred: implement** the FA composition — wrap `mergeAgentTools` + `createMcpAppBridge`
  (both exist in the package; the issue cites the app-side proof pattern). If the composition is
  genuinely small and its dependencies are all published, implement it with unit tests.
- **Fallback: unpublish** — remove the export from the publish surface (export map/barrel) until
  the FA slice lands, keeping the internal skeleton file if referenced by roadmap code.

No published AI export may throw a by-design skeleton error afterward — grep the published
`packages/fresh` surface for other `FA0`/`not implemented` throwing exports and report any found
(fix only the sandbox one unless another is trivially the same class).

## Validation (evidence in worklog)

- Scoped check/lint on `packages/fresh`.
- Unit tests for the implemented composition (or export-map assertion if unpublished).
- `deno doc --lint` green on the affected export map; `deno task publish:dry-run` green.

## Done means

Fix + tests + gates committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
