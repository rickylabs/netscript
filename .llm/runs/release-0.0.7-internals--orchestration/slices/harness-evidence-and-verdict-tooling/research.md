# Research — harness-evidence-and-verdict-tooling

## Baseline and binding inputs

- Worktree `HEAD`, branch, and live `origin/main` baseline were reconciled at
  `01e0960494c95ce56eb35892c211a095eb13e6ed`; the leaf branch has no upstream and the remote leaf
  ref does not yet exist.
- The coordinator plan passed its composed PLAN-EVAL at `331f7c664`. Its leaf contract selects
  `6-cli-tooling`, no overlays, and only these mutation surfaces:
  `.github/workflows/openhands-agent.yml`, `.llm/tools/agentic/lib/agentic-lib.ts`, and
  `.llm/tools/validation/acceptance-evidence.ts`.
- Contract gates are `check`, `test`, and `quality-job`. JSR audit, publish dry-run, package/plugin
  `quality:gate`, and global runtime/E2E gates are N/A because this leaf changes no publishable or
  runtime/scaffold surface.
- All three issues are live, open, and assigned to milestone `0.0.7` (GitHub milestone number 27).

## Live issue contract

### #1561 — empty structured evidence

- Reproduction: `entries: []` reaches `parseStructuredBlock()` and fails at the generic
  `Invalid acceptance-evidence YAML line` throw. The promise rejection escapes
  `mirror-acceptance-evidence.ts`, producing a stack trace rather than a structured mirror report.
- The live follow-up comment records the sibling zero-checkbox failure from PR #1574: an issue with
  no close-gated boxes receives six `box-index` entries and reports six misleading index misses.
- Locked remedy: remain fail-closed. Reject the supported empty-list spelling structurally with
  evidence-block and repair context; do not silently treat it as successful mirroring.

### #1621 — zero-checkbox ordering and guidance

- `acceptanceCheckboxes()` correctly gates markdown checkboxes only; plain bullets under an
  Acceptance heading produce zero targets.
- `validateEvidenceMapping()` currently enters per-entry resolution before checking target
  cardinality, so every index is reported separately. With both zero targets and zero parsed
  entries it returns an empty successful mapping.
- Locked remedy: detect zero actionable checkbox targets before per-entry matching and fail with
  `remove the evidence block or convert the issue acceptance list to markdown checkboxes` guidance.
  Issue-template policy and silent no-op behavior remain out of scope.

### #1563 — verdict token wrappers and provenance

- The shell trace step and the final `github-script` each carry a separate verdict matcher. Both
  accept a bare token and limited `*`/backtick decoration, but neither accepts a heading such as
  `## OPENHANDS_VERDICT: PASS`.
- The final workflow collapses both true absence and malformed emission to `verdict=NONE` and
  `verdict_source=none`, so supervisors cannot distinguish those cases.
- `agentic-lib.ts` has a third extraction implementation. Its machine regex accepts several
  decoration prefixes but not heading markers; `extractVerdict()` returns `null` for both genuine
  absence and an emitted unsupported token/form.
- Locked remedy: accept bare, heading-wrapped, and supported emphasis-wrapped exact tokens outside
  fences; keep placeholder/menu text excluded; represent absent and emitted-but-unparseable states
  distinctly without expanding verdict vocabulary or routing policy.

## Current call sites and tests

- Parser/mapping: `.llm/tools/validation/acceptance-evidence.ts`.
- CLI orchestration/reporting: `.llm/tools/validation/mirror-acceptance-evidence.ts`.
- Parser fixtures: `.llm/tools/validation/acceptance-evidence_test.ts`.
- Dry-run/mirror fixtures: `.llm/tools/validation/mirror-acceptance-evidence_test.ts`.
- Shared agentic extraction: `.llm/tools/agentic/lib/agentic-lib.ts` and
  `.llm/tools/agentic/lib/agentic-lib_test.ts`.
- Workflow extraction and summary provenance: `.github/workflows/openhands-agent.yml`, with source
  contract coverage in `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts`.
- Required operator documentation: `.agents/skills/netscript-pr/SKILL.md`.

The last five paths above are undeclared by `leaf-contracts.json`; the mirror CLI is also
undeclared even though #1561 explicitly requires a reported validation result rather than an
unhandled promise rejection. They remain read-only until the topic orchestrator clarifies the
contract.

## RED-first fixture matrix

| Issue | RED fixture | Expected post-fix verdict |
| --- | --- | --- |
| #1561 | fenced block with `issue: 1561` and `entries: []` | structured failure naming the block, empty list, and removal/add-entry repair; no uncaught parser crash |
| #1621 | issue body with plain bullets plus evidence `box-index` entries | one zero-checkbox failure before any per-index mismatch; removal-or-convert guidance |
| #1621 | mirror dry-run against a zero-checkbox fixture | non-zero, structured zero-checkbox verdict; no mutation and no index list |
| #1563 | `## OPENHANDS_VERDICT: PASS` | exact `PASS` |
| #1563 | `**OPENHANDS_VERDICT: FAIL_FIX**` and supported heading/emphasis combination | exact supported token |
| #1563 | text with no marker | explicit absent/no-token state |
| #1563 | `OPENHANDS_VERDICT: APPROVED` or malformed marker | explicit unparseable state distinct from absence |

## Open questions

No implementation-design question remains. The only blocker is authority: the coordinator must
authorize the exact undeclared source, documentation, and test paths before they are edited.
