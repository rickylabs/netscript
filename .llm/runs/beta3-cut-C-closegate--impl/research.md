# Research — beta3-cut-C-closegate--impl

## Re-baseline

- Carried-in source: issue #387 implementation prompt.
- Re-derived against `main` baseline named by the coordinator: `origin/main` @ `eab02889`.
- What changed vs the carried-in version:
  - `.agents/skills/netscript-pr/SKILL.md` already had a draft `Merge close-gate (#387)` section,
    but it did not define the machine convention, override label, or checked-in CI enforcement.
  - `.github/pull_request_template.md` already had a manual close-gate checklist line.
  - `.github/labels.yml` did not define `status:close-gate-override`.
  - `.llm/harness/workflow/activation.md` points to `.llm/harness/SCOPE-docs.md`, while the checked-in
    docs overlay is `.llm/harness/archetypes/SCOPE-docs.md`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | The exemplar false-close issue #260 has an unchecked `gate:e2e` checkbox inside `## Acceptance & fitness gates`. | `gh issue view 260 --json body --repo rickylabs/netscript` |
| 2 | CI currently has `check-test`, `quality`, and `deps-report`, but no close-gate job. | `.github/workflows/ci.yml` |
| 3 | The Claude skill mirror is generated from `.agents/skills` by `.llm/tools/agentic/sync-claude-skills.ts`. | `.llm/tools/agentic/sync-claude-skills.ts` |
| 4 | The repo already excludes `.llm/` from root lint config, so touched validation TS must be checked directly and linted/formatted through scoped wrappers. | `deno.json`, `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-fmt.ts` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: N/A.
- Slow-type / surface risks: none.
- Reason: this is a process/governance slice; it does not touch packages, plugins, or public JSR
  exports.

## Open questions

- None blocking. The override label is intentionally explicit and auditable as
  `status:close-gate-override`, per issue #387's example.
