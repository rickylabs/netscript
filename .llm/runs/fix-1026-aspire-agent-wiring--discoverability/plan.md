# Plan

## Profile and doctrine

- Archetype: **6 — CLI / Tooling**, because this changes a shipped public command flow. The external Aspire process is a smaller Archetype-2 concern folded into the feature.
- Overlays: none. The Markdown skill assets are shipped CLI assets, not a docs-only product surface.
- Current doctrine verdict: `@netscript/cli` is **Restructure**; this slice must not deepen it.
- In-scope anti-patterns: AP-2, AP-9, AP-10, AP-18, AP-25; Archetype rules R-A6-N8 and R-A6-N13.
- Known debt: no open debt entry directly governs agent initialization. No new debt is planned.

## Locked decisions

1. The bundle will contain exactly `netscript`, `netscript-build`, `netscript-operate`, `aspire`, `deno`, plus `help.md`; the three supplied drafts are adapted in place and registered in both manifest arrays.
2. Both host configurations always merge an `aspire` server `{ command: "aspire", args: ["agent", "mcp"] }` beside `netscript`, preserving unrelated keys and byte-stable idempotence on a second run.
3. Aspire CLI delegation is a consumed `AspireAgentInitializer` port with a Deno adapter. The use case never calls `Deno.Command` directly.
4. The adapter executes the exact verified argument vector and applies a 60-second `AbortSignal.timeout`. Missing executable, non-zero exit, and timeout normalize to one non-fatal skip reason.
5. MCP and NetScript skill installation precede/are independent of optional delegation, so Aspire MCP configuration survives every delegation failure.
6. The marked `AGENTS.md` block is symptom-indexed and explicitly prefers `netscript plugin doctor`, Aspire log/OTel commands, and `deno info` before ad-hoc probes.
7. Referential integrity is tested semantically against installed routes; any Playwright wording describes the installed tool, not a dangling skill handoff.

## Open-decision sweep

- Safe to defer: future support for non-Claude Aspire skill locations; richer structured subprocess telemetry; `.llm/tools` shipping (#1024).
- Must resolve now: none. The exact warning carrier will be selected from the existing result/presentation contract without changing the locked one-line behavior.

## Commit slices

1. **S1 — harness plan is reviewable.** Files: this run directory. Gate: PLAN-EVAL `PASS`.
2. **S2 — shipped assets close every routing loop.** Files: `skills/**`, manifest, generated barrel, asset/routing tests, run artifacts. Gates: asset generation/check, focused tests, referential-integrity assertion.
3. **S3 — agent init provides unconditional MCP plus bounded optional delegation.** Files: agent-init port/adapter/composition/use-case/tests and run artifacts. Gates: focused check/lint/test, quality/architecture scan.
4. **S4 — acceptance evidence and discoverability are proven.** Files: tests/run artifacts/PR evidence only unless a defect is found. Gates: requested validation matrix and cold-start symptom grep.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Delegation hangs | 60-second abort signal and fake cancellation test |
| Abort does not terminate child | adapter uses Deno command signal semantics; focused adapter test/review |
| Warning changes idempotence | warnings are result/output events, never written project files |
| Aspire init overwrites shipped skills | only `playwright-cli` is requested from Aspire and bundle install remains deterministic |
| Manifest/hash drift | regenerate and run `check:assets-barrel` |
| Router still points at missing skills | manifest-driven referential integrity test |
| Existing host config is damaged | parse/merge tests retain unrelated root/server keys |

## Gates

- `deno task gen:assets-barrel` and `deno task check:assets-barrel`
- scoped check/lint/fmt wrappers for `packages/cli` plus requested skill formatting check
- `deno test -A packages/cli/src/public/features/agent/`
- `deno task quality:gate` (includes quality scan and architecture check)
- cold-start local `agent init` followed by symptom-string grep in installed files
- no `scaffold.runtime` gate: the user explicitly excludes it and scaffold output is unchanged

## Deferred scope

`.llm/tools` shipping (#1024), scaffold templates, `packages/mcp`, alternate agent hosts/skill locations, and changes to Aspire CLI itself.
