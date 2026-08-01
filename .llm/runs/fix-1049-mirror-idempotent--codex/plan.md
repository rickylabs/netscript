# Plan — fix #1049 acceptance-evidence mirror idempotency

## Scope and gates

- Surface: internal harness validation tooling; no package/plugin archetype or scope overlay applies.
- Doctrine / JSR: N/A because no `packages/` or `plugins/` public surface changes.
- Required gates: focused Deno test plus scoped check, lint, and format wrappers for
  `.llm/tools/validation`.
- Evaluator waiver: the owner waived open-model PLAN-EVAL on 2026-08-01 and directed immediate
  implementation after this plan. No `plan-eval.md` will be created.

## Locked decisions

1. Add a `known` set containing checked and unchecked checkbox text so unknown evidence remains an
   error while checked evidence is recognized.
2. Track duplicates in a separate `seen` set and validate duplicate/empty evidence before the
   checked/unchecked split, preserving strict validation for already-checked boxes.
3. Return mapping entries only for unchecked boxes. This preserves the mirror contract and makes a
   re-run produce no changes, PATCH, or duplicate provenance comment.
4. Do not modify `mirror-acceptance-evidence.ts`; its current unchecked filter and mapping lookup
   already implement the required no-change behavior.

## Open-decision sweep

- Safe to defer: none.
- Must resolve now: none; error wording and validation order are locked by the slice contract.

## Commit slice

1. **Idempotent evidence validation** — change
   `.llm/tools/validation/acceptance-evidence.ts`, expand/update
   `.llm/tools/validation/acceptance-evidence_test.ts`, and update run artifacts. Prove with the
   focused test, RED/GREEN revert sanity-check, and scoped check/lint/fmt wrappers. Commit as one
   small conventional fix.

## Risks and mitigations

- Risk: accepting unknown evidence silently. Mitigation: use `known` and test non-existent text.
- Risk: checked evidence bypasses duplicate/empty validation. Mitigation: validate with `seen` and
  evidence content before deciding whether to add to the unchecked-only mapping; test both states.
- Risk: idempotency regresses later. Mitigation: add the explicit first-run/ticked-body/re-run test
  and prove it fails under the old lookup logic.

## Deferred scope

- Network/API integration testing, workflow changes, and mirror-script refactoring are excluded.
- No release-wide E2E gate is needed for this isolated validation helper fix.

