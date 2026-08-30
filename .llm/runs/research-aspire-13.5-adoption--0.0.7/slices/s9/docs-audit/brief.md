use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/workflow/doc-audit.md`,
`.agents/skills/aspire/SKILL.md`, and `.agents/skills/netscript-tools/SKILL.md`. You are the
**opposite-family docs_audit session** (Codex · GPT-5.6 Sol · medium): one single pass over the S9
skill prose at exact head `e11de98d`. You are NOT a generator and NOT the IMPL-EVAL evaluator; you
do not edit tracked files, do not commit, do not push, do not start any AppHost or container, do not
run `e2e:cli`. Your worktree is detached read-only:
`/home/agent/projects/netscript/worktrees/007-aspire-s9-audit`. Host: Aspire CLI 13.5.3 via
`/home/agent/.local/bin/mise exec --`; you MAY run non-runtime CLI reads (`aspire --help`,
`aspire agent mcp --help`, `aspire docs …`) to check claims; `aspire ps` must stay `[]`. Write your
findings as a Markdown report to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s9/docs-audit/report.md`
(absolute path; create it) with: a findings table (severity high/medium/low/info · claim · file:line
· evidence · required change), the six required checks each marked PASS/FAIL with evidence, and a
final line `AUDIT: PASS` or `AUDIT: FAIL_FIX`. Also post the same report as a PR #1759 comment
starting with `**[PHASE: DOCS-AUDIT]**` and the head SHA
(`gh pr comment 1759 --repo rickylabs/netscript --body-file …`). The audit request follows verbatim.

# S9 Aspire Skill Prose Audit Request

Run one independent Codex Sol pass over the shipped Aspire skill prose for PR #1759. This is a
documentation audit only: report findings to the supervisor; do not edit the implementation and do
not certify the slice.

## Audit Scope

- Canonical authority: `skills/aspire/SKILL.md` and `skills/help.md`.
- Generated mirrors: `.agents/skills/aspire/SKILL.md` and `.claude/skills/aspire/SKILL.md`.
- Embedded generated skill asset: `packages/cli/src/kernel/assets/skills.generated.ts`.
- Consumer snapshot: `.agents/generated/consumer-skills/.agents/skills/aspire/SKILL.md` and its
  `.claude` mirror.

## Required Checks

1. Every 13.5.3 behavior claim is supported by an exact S2 or S9 receipt path named in the skill.
2. MCP startup uses `aspire agent mcp`; dashboard-only mode uses `--dashboard-url`; no prose
   recommends the obsolete `aspire mcp start` form.
3. Command prose covers `aspire resources`, `stop --force`, orphan cleanup, exit code 12,
   `aspire doctor --format Json`, OTEL logs/spans/traces, and
   `aspire docs api search … --language typescript` without overstating the receipts.
4. The tool table distinguishes the locked 15-tool acceptance contract from the truthful static
   observation. The S9 receipt shows Aspire CLI/server 13.5.3 exposing only the 14-tool 13.4.6
   baseline and omitting `get_integration_docs`; flag any prose that claims that tool was observed.
5. The generated mirrors and embedded/consumer copies preserve the canonical meaning and contain no
   active `13.4.6` version claim. Manifest rows owned by `archival` remain out of scope.
6. NetScript's `aspire` skill remains distinct from the four explicitly installed upstream workflow
   skills: `aspire-init`, `aspire-orchestration`, `aspire-monitoring`, and `aspire-deployment`.

## Evidence

- S9 static capture:
  `.llm/runs/fix-aspire-13-5-s9-skills-mcp-alignment--impl/receipts/aspire-13.5.3-mcp-tools-static.json`.
- S9 drift record: `.llm/runs/fix-aspire-13-5-s9-skills-mcp-alignment--impl/drift.md`.
- S2 runtime receipts on branch `origin/test/aspire-13-5-s2-runtime-verification`:
  `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/02-v4-otel-*`,
  `02-v5-aspire-describe-final.json`, `03-v8-*`, and `03-v12-*`.

Return a severity-ordered finding list with file/line references and a final `PASS` or `FAIL`. Treat
the observed 14-tool static surface as upstream evidence drift, not as permission to fabricate the
locked 15th tool. The supervisor owns dispatch and disposition.
