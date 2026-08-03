use harness

# Implementation Brief: OMB S5 ServiceEndpointDirectoryPort + adapters — #1131

You are the attached implementation lane. Work only in
`/home/codex/repos/ns005-s5` on branch `feat/openapi-mcp-endpoint-directory`.

## SKILL

- `.agents/skills/netscript-harness` — follow the locked run artifacts, per-slice evidence, and
  commit trail; PLAN-EVAL is already composed/waived by the milestone ruling.
- `.agents/skills/netscript-doctrine` — apply Archetype-2 ports/adapters layering in `packages/mcp`.
- `.agents/skills/aspire` — use the Aspire 13.4 machine-readable query surface correctly.
- `.agents/skills/jsr-audit` — keep both public entrypoints doc-lint/publish clean.
- `.agents/skills/netscript-tools` — use scoped wrappers, quality gate, raw git truth, and lock hygiene.
- `.agents/skills/netscript-pr` — push explicit refspec and post one structured comment per slice.
- `.agents/skills/rtk` — compress read-heavy git/rg and proxy Deno task output.
- `.agents/skills/codex-wsl-remote` — remain on this attached thread/worktree; never fork a rival send.

## Authority and required reading

Read before editing:

1. `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/plan.md` — LOCKED D1–D9.
2. `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/worklog.md` — Design and slices.
3. `.llm/runs/feat-openapi-mcp-endpoint-directory--s5/context-pack.md`.
4. `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P1-verdict.md` and `P3-verdict.md`.
5. `.llm/runs/plan-openapi-mcp-plugin--seed/design/canonical/02-discovery.md`.
6. `packages/mcp/deno.json`, `mod.ts`, `cli.ts`, README, and focused existing port/adapter tests.

## Binding contract

- Effective precedence: `override > aspire-cli > run-manifest > appsettings`.
- Four source outcomes are always visible; CLI absent/non-zero/parse failures are explicit failed
  rows, never absence.
- Manifest use requires real-path project-root match and a supplied expected current `runId` match.
- Override carrier: `.netscript/agent-mcp.json`, decoding only
  `introspection.serviceEndpoints` and `introspection.excludeServices`.
- Status mapping: `not_running`, `spec_unavailable`, `identity_mismatch`, `excluded`, plus success
  `running`; exclusions happen before fetch.
- Use the exact ratified P3 wording for 401/403 guidance.
- One hanging spec is one timed-out row while other rows return; bound concurrency and isolate all
  probe failures.
- No S4 imports or projection implementation. Preserve parsed spec only as opaque JSON if needed by
  S6.
- No new dependency, lint ignore, `as unknown as`, `as any`, or `deno.lock` churn.

## Slices

Implement the three Design slices in order. After each:

1. Run its focused gate.
2. Update `worklog.md` and `context-pack.md` with exact evidence and one reconcile note.
3. Commit only owned files with a message naming what the slice proves.
4. Push with explicit refspec:
   `git push origin HEAD:refs/heads/feat/openapi-mcp-endpoint-directory`.
5. Post one structured `[PHASE: IMPL]` draft-PR comment with scope, SHA, and commands/results.

Do not mark the PR ready, add `Closes #1131`, tick final DoD boxes, trigger evaluation, or merge.
Those remain supervisor authority. Stop with a concise handoff after slice 3 gates, or write
`BLOCKED: <reason>` if a locked decision cannot be implemented without rescope.

