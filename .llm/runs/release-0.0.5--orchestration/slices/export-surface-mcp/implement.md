use harness

# Slice W4 (canary.3 train): MCP path for the generated export surfaces — #1201 (p2, owner-scheduled)

You are the implementation supervisor for the PR resolving #1201's implementable boxes. Read the
issue body first — it is measured, not speculative: in the 452-tool-call wave-4 control run,
deno-doc surfaces were touched by 17 commands (the most-used doc surface), pages by 5, llms.txt
by 1, MCP by zero. The most-used surface is the only one with no MCP path.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (packages/mcp Archetype-2)
- `.agents/skills/netscript-deno-toolchain` (`deno doc` is the corpus source — read its JSON
  surface before designing)
- `.agents/skills/jsr-audit` (new exports)

## Milestone-run evaluator rule (read before planning)

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator ruling D6: no
local formal PLAN-EVAL — evaluation composes draft→ready augment + OpenHands + the orchestrator
pre-merge gate. Mark your PLAN-EVAL gate row "composed per milestone-run.md (orchestrator
waiver)", lock your plan, and implement in the same run.

## Design frame (owner's, binding)

Prose already has a map (llms.txt index, page headings); the export surface has none — 36 flat
files, "excellent once you know what you want, useless for discovering what exists". Grep only
answers questions already phrased as a symbol name — precisely what an agent lacks on a
framework with no training-data presence. This is a **new corpus type**, not an extension of
the prose ranking in `docs-corpus-port.ts`. Do NOT collapse this with #1197 (that issue
measures discoverability of existing surfaces; this adds a capability with no bash equivalent —
the #1194 directory-vs-curl shape).

## Deliverable = the gates

1. **The four question forms, in priority order**, each a bounded MCP answer with a fixture:
   a. Which package + subpath exports a given symbol.
   b. What a package exports, grouped by subpath.
   c. One symbol's signature + JSDoc with **bounded retrieval** — never the whole file into
      context (truncation metadata per the S8/#1134 conventions).
   d. What exports match a partial name or shape (the specific-helper-below-the-general-one
      case).
2. **Mirror-free acceptance, demonstrated end to end**: a workspace with NO docs directory at
   all answers "which subpath exports this helper" via MCP. RED first: show today's build
   cannot (zero MCP path), then GREEN.
3. **Version-pinned corpus** exactly like the embedded prose corpus, so runs stay comparable.
4. Registry wiring per current main (S6's 17-tool registry landed); receipts + truncation per
   the shipped conventions. Archetype-2 full column: `quality:gate`, scoped wrappers, doc-lint +
   publish dry-run for new exports, no new lint-ignores, no `deno.lock` churn.
5. **The adoption box is NOT yours to tick**: the re-measured agent run (MCP non-zero,
   deno-doc greps zero) happens on the canary.3 train, recorded by the orchestrator. Body
   carries `Refs #1201`-style evidence-gating for that box only if the issue's boxes split
   that way — otherwise `Closes #1201` only when every box is locally provable and the
   measurement box is explicitly routed on the issue. Check the live issue body and mirror its
   split truthfully.

## Anticipated files

`packages/mcp`: new corpus module (export-surface index/port), tool contract(s) + flow(s),
registry wiring, fixtures from real `deno doc --json` output of first-party packages; the
corpus generation/pinning step (mirror the embedded-prose pipeline). Coordinate: #1135 (S9
activation) may run the same wave — different files (instructions/templates); do not touch
its surface.

## PR contract

Branch `feat/mcp-export-surface-corpus` (worktree provided at dispatch), target `main`. Labels:
`type:feat`, `area:docs`, `area:agentic`, `area:tooling`, `priority:p2`, exactly one `status:`;
milestone `0.0.5`. Authoritative `## Definition of Done`; no keyword-adjacent issue references
in prose. Slice `worklog.md`/`drift.md` in this dir. Push via explicit refspec only.
