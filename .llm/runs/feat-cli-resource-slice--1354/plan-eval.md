# PLAN-EVAL — feat-cli-resource-slice--1354

- Plan evaluator session: OpenHands cloud evaluator (Qwen 3.8 Flash max via explicit OpenRouter
  trigger), 2026-08-14; separate from plan-generation session per `evaluator/plan-protocol.md`.
- Run: `.llm/runs/feat-cli-resource-slice--1354/` (judged at head `b210f9092`)
- Surface / archetype: CLI (Archetype 6) generation feature + `packages/fresh` sidecar bridge
  (Archetype 4 exports); no product code exists — plan judged, not implementation.
- Scope overlays: epic #1348 → #1354; hard serialization against unmerged #1664.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` B1–B11 re-verified against tree (generate-group = 3 subcommands; single `withResource` asset); B4 re-baseline duty; baseline `38f2ce735`. |
| Decisions locked                        | PASS   | D1–D11 with rationale and rejected alternatives. |
| Open-decision sweep                     | PASS   | Candidate-decision table locks/defers every item; none found that forces rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS   | 7 ordered slices A–G, ceilings 5/12/14/18/18/23/6, enumerated touch sets, named gates. (Slice G ceiling under-enumerated → Finding 2, not a slice-count violation.) |
| Risk register                           | **FAIL** | No dedicated section; only "slow-type risk" appears in the plan text. Mitigations exist inline (D9, D3, slice stop rules) but are never aggregated. |
| Gate set selected                       | PASS (manual) | Archetype F-* gates satisfied via `arch:check`, `quality:gate`, full-export-map doc lint, JSR audit, `deps:why`/`deps:prod-install`/`publish:dry-run`, asset/emitted-sample/MCP-corpus checks — all verified to exist in `deno.json`. |
| Deferred scope explicit                 | PASS   | Seven deferrals + #1664/#1355 fences; D8/D5 boundary table. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | B11 + D8 gates: slow types, full export-map docs, publish dry-run contents, dependency justification. |

## Open-decision sweep (evaluator-run)

No plan-breaking open decision found. Deferreds (canonical example after A–E, marker schema after E,
Fresh dependency after #1664, hosted runtime failure partitioning) are all correctly "no safe choice
yet" and each names who resolves it. Premise independently re-verified true. Multi-client design
matches #1664's fail-closed selector verbatim with the selector extracted, not duplicated — zero
drift on the coordinator prohibition.

## D3 / D9 assessment (the deciding decisions)

- **D3: substantively sound.** Marker-payload-driven leaf decision table is decidable; late shared
  conflict ⇒ zero-write is already a named test (D3 proof + Slice C reconciler + Slice E
  `late-router-conflict` gate). Spec gaps: Fresh-writer failure semantics, missing/stale `.generated/*`
  case, destructive option-transition sentence, concurrency limitation.
- **D9: mechanism sound; enumeration incomplete.** Confirmed against the full live #1664 file list
  (59 non-artifact files): #1664 also touches `route-templates_test.ts` (Slice F item 22),
  `capability-suites.ts` + `suite-registry_test.ts` (Slice G registration path — ceiling breach),
  `export-surface-corpus.generated.ts` (Slice G regenerates), `key-bridge.ts` (Slice D emitted
  imports), `format-generated-files.ts` + new formatter/process ports (D8 reuse seam),
  `packages/fresh/deno.json` (Slice B dependency), `add-ui-input.ts` (Slice E option shape). None are
  named in D9.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **Add a Risk register section** aggregating at least: #1664 drift at rebase (stale premises,
   island convergence, selector extraction), D3 ordering under apply, ceiling breaches (F=23, D=18),
   doc-lint baseline drift, public-surface growth from new Fresh exports, D4 init/command drift lock.
2. **Complete D9 overlap enumeration at slice level** using the findings above: name
   `route-templates_test.ts` for Slice F; add `capability-suites.ts` + `suite-registry_test.ts` to
   Slice G (raise ceiling) or declare the composition path; note `export-surface-corpus.generated.ts`
   and `add-ui-input.ts`; state B7/Fresh-dependency re-measure post-#1664.
3. **Close D3 apply-phase gaps:** Fresh-writer failure semantics (+ extend the zero-write test),
   missing/stale `.generated/*` rule, destructive-transition rule (removal = conflict), concurrency
   limitation line.
4. (Fold in) D4 standing equivalence test; D8 pointer to #1664's formatter/process ports as the
   format seam; local static gate for Slice G gate-id/suite composition so hosted lane isn't first
   discovery.

No unlocking of D1–D11 required; design stands. Re-submit for PLAN-EVAL cycle 2 (max 2).

## Notes

- Published as PR #1891 comments: verdict comment `issuecomment-5498399743` and full-D9-evidence
  addendum `issuecomment-5498440081` (addendum retracts the earlier `packages/cli/deno.json`
  sub-claim — not in the current #1664 diff).
- Partial semantics verified: D10 locks `Refs #1354` with no closing keyword per slice; PR body uses
  `Refs #1354`; no epic-closing keyword anywhere.
- Identity note: task requested OpenRouter Qwen 3.8 max on cloud-driven PR review — consistent with
  the protocol's cloud-driven exception to the native opposite-family route.
