# Worklog — harness-evidence-and-verdict-tooling

## Identity

- Worktree: `/home/codex/repos/netscript-007-harness-evidence`
- Branch: `fix/harness-evidence-and-verdict-tooling`
- Base: `01e0960494c95ce56eb35892c211a095eb13e6ed`
- Issues: #1561 + #1563 + #1621
- Route requested: OpenAI Codex GPT-5.6 Sol, medium
- Draft PR: #1644 — https://github.com/rickylabs/netscript/pull/1644

## Design

### Public/tooling surface

- `parseAcceptanceEvidence()` and `validateEvidenceMapping()` retain their fail-closed validation
  roles; the documented fenced block remains the author input.
- The mirror CLI retains JSON/pretty reporting and non-zero failure semantics.
- `extractVerdict()` and the OpenHands workflow summary marker retain the exact harness verdict
  vocabulary; only markdown wrapper tolerance and diagnostic source state change.

### Domain vocabulary

- Evidence target states: `checkbox-targets-present` and `zero-checkbox-targets`.
- Evidence parse states: `valid`, `empty-list-invalid`, and `malformed`.
- Verdict marker states: `parsed`, `absent`, and `unparseable`.
- Exact verdict token set remains `PASS | FAIL_FIX | FAIL_RESCOPE | FAIL_DEBT | FAIL_PLAN | NONE`;
  workflow evaluators still do not accept GitHub review vocabulary.

### Ports and constants

- No new port or external dependency is introduced.
- Existing `OPENHANDS_VERDICT_TOKENS`, workflow regex token lists, `READY_LABEL`, and close-gated
  checkbox extraction remain the finite constants. No provider/model/endpoint value changes.

### RED-first fixtures and slice order

1. S1: add empty-list and zero-checkbox RED fixtures, then implement parser/mapping/reporting
   changes. Prove with the focused validation test wrapper.
2. S2: add heading, emphasis, absence, and malformed RED fixtures, then update shared and workflow
   extractors. Prove with focused agentic/workflow tests.
3. S3: run durable `check`, `test`, and `quality-job` at one immutable final head and prepare the
   separate opposite-family IMPL-EVAL handoff.

### Exact files

- Declared: `.llm/tools/validation/acceptance-evidence.ts`,
  `.llm/tools/agentic/lib/agentic-lib.ts`, `.github/workflows/openhands-agent.yml`.
- Coordinator-authorized extension: `.llm/tools/validation/mirror-acceptance-evidence.ts`,
  `.llm/tools/validation/acceptance-evidence_test.ts`,
  `.llm/tools/validation/mirror-acceptance-evidence_test.ts`,
  `.llm/tools/agentic/lib/agentic-lib_test.ts`,
  `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts`.
- Read/use only: `.agents/skills/netscript-pr/SKILL.md`; it must not be edited.

### Deferred scope

Issue templates, general YAML, routing/model policy, publication, package/plugin fitness, and global
runtime/E2E surfaces are excluded.

### Contributor path

- Evidence behavior: begin with `acceptance-evidence_test.ts`, then read the pure parser/mapping
  functions, then the mirror CLI boundary test.
- Verdict behavior: begin with `agentic-lib_test.ts`, then the shared extractor, then the workflow
  contract test and the two keep-in-sync embedded matchers.
- Operator convention: read the `netscript-pr` close-gate and evidence-mirroring sections.

### PLAN-EVAL disposition

`PLAN-EVAL: N/A` at `2026-08-13T20:25:27Z`. The composed milestone PLAN-EVAL already locked the
fail-closed remedies, issue bodies provide exact acceptance behavior, current-main research found no
material architecture/sequence/public-contract choice, and the leaf has three bounded mechanical
tooling slices. Implementation remains blocked only on coordinator authorization for the exact
undeclared paths, not on a design decision.

## Gates

Structured JSON outputs are preserved under `receipts/`; raw root Deno commands and RTK-filtered
output are not verdict sources.

| Slice | Receipt | Result |
| --- | --- | --- |
| S1 RED | `receipts/s1-red.json` | expected type-check failure: the structured validation/report APIs did not exist |
| S1 focused test | `receipts/s1-green.json` | PASS after Tier-A fix, 19 passed / 0 failed |
| S1 focused check | `receipts/s1-check.json` | PASS, 0 diagnostics across the four S1 files |
| S1 focused format | `receipts/s1-fmt.json` | PASS, 4 files / 0 findings |
| S2 RED | `receipts/s2-red.json` | expected type-check failure: the discriminated verdict-inspection APIs did not exist |
| S2 focused test | `receipts/s2-green.json` | PASS, 81 passed / 0 failed |
| S2 focused check | `receipts/s2-check.json` | PASS, 0 diagnostics across the three TypeScript S2 files |
| S2 focused format | `receipts/s2-fmt.json` | PASS, 3 TypeScript files / 0 findings |
| S2 focused lint attempt | `receipts/s2-lint.json` | NOT FIRED, exit 2: Deno excluded all 3 explicit hidden-path batches; not claimed as a pass |

S1 is not self-certified: first Tier-A review requested one mirror-boundary fixture. That fixture and
replacement green receipts are prepared as a follow-up candidate for Tier-A re-review before the
supervisor sign-off commit.

S2 is not self-certified: its source/workflow diff and receipts are prepared as a distinct candidate
for substantive Tier-A topic-orchestrator review before the supervisor sign-off commit.

## Reconcile notes

- Dispatch: live #1561, #1563, and #1621 are open in milestone 0.0.7; `origin/main` equals the
  approved baseline.
- Dispatch drift: approved `netscript-pr` and test edits are absent from the binding file-surface
  list; coordinator clarification is required before those edits.
- S0 research reconcile: live issue bodies/comments match the locked coordinator remedy. Added the
  undeclared mirror CLI to the clarification request because #1561 requires a structured report at
  the CLI boundary, not merely a more specific thrown parser message.
- S0 draft reconcile: bootstrap commit `0be658912d167da5bc46b718a862a43e33e5f4c4` pushed by the
  explicit refspec; draft PR #1644 targets `main`, milestone 0.0.7, with exactly `type:fix`,
  `area:tooling`, and `status:plan`. Plan/clarification comment id: `5286024710`.
- Coordinator clarification reconcile: PR #1644 comment `5286066438` authorizes the five exact
  implementation/test peers listed above, keeps `netscript-pr` read-only, admits no other product
  path, and requires the leaf to stop at Tier-A plus separate IMPL-EVAL handoff. Implementation may
  now begin; the PR remains `status:plan` until real implementation lands.
- S1 pre-review reconcile (`2026-08-13T20:44:05Z`): `entries: []` and block-style empty `entries:`
  now produce a typed, block-attributed validation failure; the mirror converts expected authoring
  failures into an explicit `ok:false` report; zero checkbox targets are rejected once before any
  per-index matching with remove-or-convert guidance. No mutation occurs in dry-run fixtures. The
  focused test/check/format receipts are green; Tier-A review is the remaining slice gate.
- S1 Tier-A review (`2026-08-13T20:50:46Z`): `CHANGES_REQUESTED` on candidate
  `a4a3010427afa43a36ac1c477b854e067162464a`. The typed error/report split, pre-mutation
  validation, explicit failure verdict, and zero-checkbox ordering were accepted. The reviewer
  required one mirror-boundary regression for a non-existent index on an otherwise checkbox-bearing
  issue and separately flagged the coordinator-owned #1561 documentation/closing-keyword conflict.
- S1 review response (`2026-08-13T20:58:34Z`): added the exact boundary fixture; the mirror resolves
  to `ok:false`, preserves the index-specific repair diagnostic, and performs zero updates. Focused
  test/check/format replacement receipts pass at 19/19, zero diagnostics, and zero findings. Tier-A
  re-review remains required; the skill/closure conflict is recorded in `drift.md`, not widened.
- S2 pre-review reconcile (`2026-08-13T21:00:26Z`): the shared extractor now exposes a fence-aware
  `parsed | absent | unparseable` inspection while retaining `extractVerdict()` compatibility. Bare,
  heading, emphasis, and blockquote-plus-heading exact lines parse; placeholder/fenced lines stay
  excluded. Both embedded workflow matchers accept the same wrapper surface, the trace records
  `agent_verdict_state`, and the final marker/human summary distinguishes no marker from an invalid
  emitted marker. The workflow test executes the embedded JavaScript matcher and validates the
  checked-in shell regex. Focused test/check/format receipts are green; Tier-A review remains.
