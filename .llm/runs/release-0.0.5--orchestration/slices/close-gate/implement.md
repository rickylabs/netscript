use harness

# Slice: close-gate honesty — #1171 (verdict provenance) + #1105 (PR-body checklists)

You are the implementation supervisor for one PR closing #1171 and #1105 — both live in
`.llm/tools/validation/check-close-gate.ts` and share the verdict-honesty acceptance family
(epic #1169 slice S3 is #1171; #1105 is clustered by shared surface). Read both bodies first.
Epic order note: S1/S2/S4 already landed (#1176–#1178) — you are next in the epic's sequence.

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-pr` (you are changing the PR
template/convention surface it documents — keep them consistent),
`.agents/skills/netscript-tools`.

## Deliverable = the gates

For #1171:
1. `Report` carries `headSha`, `evaluatedAt`, per-issue `{number, updatedAt, bodySha256}` in log
   + report JSON.
2. Staleness is mechanically detectable from artifacts alone; a test proves a verdict computed
   against a pre-edit issue body is flagged stale.
3. Pass/fail semantics unchanged (regression evidence).

For #1105 — **decision box, orchestrator recommendation: ENFORCE** (gate fails on unticked
`- [ ]` DoD boxes in the PR body; the #1088 incident is the argument). If you find enforcement
technically wrong (e.g. legitimate non-DoD checklists in bodies), the alternative — a convention
making PR-body checklists non-authoritative, enforced by tooling — is acceptable; either way the
PR body records the choice and rationale, the template is updated to match, and a test/fixture
covers the failing case.

## Anticipated files

`.llm/tools/validation/check-close-gate.ts` + tests/fixtures; the slice/PR template the repo
ships (locate via netscript-pr skill); possibly the workflow step that surfaces the verdict
(annotation text only — do not restructure CI). Repo-tooling slice: no `packages/**`, framework
law not triggered; scoped check/lint on touched files.

## Known context

The close-gate mirror matches evidence entries to checkbox first-line + last-em-dash; label the
PR before push-after-ready or the mirror skips (recorded 0.0.4 behavior). Your own PR is checked
by the tool you are changing — make sure the shipped version passes on your PR's real state.

## PR contract

Branch `fix/close-gate-verdict-provenance` (worktree provided), target `main`. Body:
`Closes #1171`, `Closes #1105` only with every box truthfully ticked (the #1105 decision box is
tickable once the chosen convention ships with its test). Labels: `type:fix`, `area:tooling`,
exactly one `status:`; milestone `0.0.5`. No `deno.lock` churn. Slice `worklog.md`/`drift.md`
here as you go.
