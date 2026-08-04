use harness

# Slice W4-B: OMB S9 activation surfaces + migration fixture — #1135 (epic #1126)

You are the implementation supervisor for the PR resolving #1135. Read the live issue body
first, then the design sources it names: RFC #1123 (`rfc.md` §2.7) and
`design/canonical/05-activation.md` (rev 2) — both under the epic's run artifacts; search
`.llm/runs/` for the openapi-mcp RFC directory. The registry now holds 21 tools (S6 read tools,
S7 manifest emission, and the #1218 export-surface corpus all landed) — read the CURRENT
`initialize` surface before writing the instructions sentence; do not assume the 14-tool state
the issue's lineage describes.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (packages/mcp Archetype-2)
- `.agents/skills/netscript-cli` (scaffold surface: AGENTS.md template, `.mcp.json`, agent init)

## Milestone-run evaluator rule

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol + ruling D6: no local formal
PLAN-EVAL — mark the gate row "composed per milestone-run.md (orchestrator waiver)", lock the
plan, implement in the same run.

## Deliverable = the gates (the issue's two acceptance boxes)

1. Activation surfaces: one sentence in server `initialize` instructions naming the curl
   moment; one behavioural line in the scaffolded app-scoped `AGENTS.md` template;
   endpoint-shaped findings in `get_recent_errors`/`doctor` output cross-reference
   `get_operation_schema`. **Byte fixtures** for each (instructions sentence present,
   AGENTS.md template line present, failure-path pointer present).
2. **S-18 migration fixture**: `.mcp.json` entries are exact-version-pinned — an existing
   project stays on the old server until `agent init` re-run + host restart. Fixture starts
   from prior-release host files and proves the new tools appear after the documented path.
   "Zero install" claimed for new scaffolds only.

## Gates and PR

Archetype-2 column on touched packages: `quality:gate`, scoped wrappers, doc-lint + publish
dry-run if exports move, no new lint ignores, no `deno.lock` churn. Branch
`feat/openapi-mcp-activation-s9`; body `Closes #1135`; labels `type:feat` + `area:sdk` +
`epic:openapi-mcp` + `priority:p2` + exactly one `status:`; milestone 0.0.5. Draft while
implementing; ready when green; explicit-refspec pushes only. End DONE when ready, or
BLOCKED: <reason>.
