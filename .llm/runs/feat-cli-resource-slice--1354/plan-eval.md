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

---

# PLAN-EVAL Cycle 2 — feat-cli-resource-slice--1354

- Evaluator session: OpenHands cloud (Qwen 3.8 Flash via explicit OpenRouter trigger), separate from
  the plan-generation session. Judged at head `7f9d93188`.
- **Submission delta: none.** `plan.md` is byte-identical to the cycle-1 submission (`b210f9092`);
  the only commit since is this file's cycle-1 record. None of the four required fixes was applied,
  so cycle 1's FAIL_PLAN findings all stand, re-verified below against the tree and the live #1664
  file list (162 files via API).

## Cycle-1 fix verification (all unaddressed)

1. **Risk register — still absent.** No dedicated section; only "slow-type risk" appears (gate list
   line). Plan-Gate box remains FAIL.
2. **D9 slice-level enumeration — still incomplete.** Confirmed against the live #1664 diff that it
   also touches: `packages/cli/src/kernel/templates/app/route-templates_test.ts` (Slice F item 22),
   `packages/cli/e2e/suites/scaffold/capability-suites.ts` +
   `packages/cli/e2e/tests/presentation/suite-registry_test.ts` (Slice G adds gate ids and composes
   gates but touches neither registration file — the seventh-change stop rule covers stdout only),
   `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` (Slice E's
   `check:mcp-export-corpus` gate regenerates it), `packages/sdk/src/query-client/key-bridge.ts`
   (emitted loaders' import target), `packages/cli/src/kernel/application/scaffold/support/`
   `format-generated-files.ts` (D8 reuse seam), `packages/fresh/deno.json` (Slice B dependency), and
   `packages/cli/src/public/features/ui/add/add-ui-input.ts` (Slice E option shape). D9 names none of
   these. (`packages/cli/deno.json` correctly not in #1664 — cycle-1 retraction holds.)
3. **D3 apply-phase gaps — still open.** (a) Fresh-writer/IO failure during apply is outside the
   tested zero-write guarantee (staging covers shared transforms only; no write-phase atomicity
   test); (b) no missing/stale `.generated/*` rule; (c) no destructive option-transition rule —
   removing a previously generated option silently strands the old leaf; plus force-then-rerun
   shared-import behavior and single-instance concurrency remain unstated.
4. **Fold-ins — still open.** No standing D4 equivalence gate; marker schema unpinned; doc-lint gate
   is absolute (`run-deno-doc-lint.ts` has no baseline flag) while the reference plan
   (`feat-workers-runtime--1592-1451`) uses "zero new diagnostics relative to the recorded
   baseline"; no local static gate for Slice G suite composition.

## Independent re-verification this cycle

- Premise re-confirmed: `generate-group.ts` registers exactly three commands; only
  `app/routes/examples/service/index.tsx.template` (app assets) references
  `withResource`/`withRouteContract`.
- #1664 fail-closed selector semantics re-confirmed from its live `web-scaffold.ts` patch; D2/Slice A
  adopt-and-extract it with no second mechanism and no auto-pick — prohibition clean.
- Slice ceilings (4/6/11/18/6/23/6), ordering, per-slice gates, and touch-set enumeration match the
  reference-plan shape; `deno.lock` movement is addressed (Slice B item 6). Partial semantics
  (D10, `Refs #1354`, no epic closing keyword) re-confirmed; no #1355/#1664 scope expansion.

## Verdict

`FAIL_PLAN` — **cycle 2 of 2; per protocol, escalate to the owner/supervisor.** The plan's design
(D1–D11) is sound and needs no re-architecture; the block is plan completion: risk register, slice-
level D9 enumeration, D3 apply-phase semantics, and the four fold-ins.

OPENHANDS_VERDICT: FAIL_PLAN
