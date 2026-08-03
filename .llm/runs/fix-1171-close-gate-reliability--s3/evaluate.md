# IMPL-EVAL — S3 Close-Gate Reliability (PR #1179)

**Evaluator:** Claude (independent session, separate from Codex generator and Fable supervisor)
**Date:** 2026-08-03
**Branch:** `fix/1171-close-gate-reliability`
**Worktree:** `/home/codex/repos/ns004-s3-closegate`
**Verdict:** `PASS`

---

## 1. research.md — adopt/wrap/rebuild decision

The decision to **REBUILD** is rigorously supported by the cited evidence:

- **Survey depth:** 4 candidates evaluated (mheap/require-checklist-action, AhmedBaset/checklist, adriangodong/actions-todo-bot, wyozi/contextual-qa-checklist-action) plus GitHub-native task lists/sub-issues and Kubernetes Prow.
- **Comparison matrix:** 7 criteria (checklist completeness, cross-closing issues, structured evidence, live API reads, provenance, race-aware mirror, estimated coverage).
- **Result:** No candidate achieves ≥80% coverage. Best candidate (`mheap`) covers <30%.
- **Decision record:** 6 locked consequences explicitly documented (live fetch, fenced YAML, provenance fields, post-merge handling, race-aware mirror, override escape hatch).
- **Verdict:** Decision is well-supported. The REBUILD choice is the only path that satisfies the cross-issue acceptance/evidence contract.

## 2. Test suite and quality checks

### deno test --allow-read --allow-env --allow-write .llm/tools/validation/

- **Expected:** 34 passed, 0 failed
- **Observed:** 34 passed, 0 failed (893ms)
- **Files tested:** acceptance-evidence_test.ts (8), check-aspire-host-ports_test.ts (10), check-close-gate_test.ts (5), check-netscript-jsr-specifiers_test.ts (7), mirror-acceptance-evidence_test.ts (1), redis-regression-gate_test.ts (3)

### Scoped check/lint/fmt wrappers

- **run-deno-check.ts:** 17 files, 0 findings
- **run-deno-lint.ts:** 17 files, 0 findings
- **run-deno-fmt.ts:** 17 files, 0 findings

## 3. Hostile-fixture attack results

8 adversarial fixtures constructed and executed against `parseAcceptanceEvidence` / `validateEvidenceMapping`:

| # | Fixture | Result | Notes |
|---|---------|--------|-------|
| 1 | Em-dashes in both box text and evidence | **PASS** | Em-dashes treated as data, not separators |
| 2 | Box text contains fenced code block marker | **PASS** | Fence markers in quoted YAML handled correctly |
| 3 | Duplicate box texts across two issues | **FAIL (by design)** | Evidence blocks are issue-scoped; validator enforces per-issue isolation. Not a bug — the design requires separate evidence blocks per issue. |
| 4 | YAML mapping nonexistent box-index | **PASS** | Fails with `Issue #400: no acceptance box matched box-index 99; add an entry for box "#99" using exact trimmed text or its current box-index.` |
| 5 | Legacy format with multiple em-dashes | **PASS** | Splits on last ` — ` only, preserving earlier em-dashes in text |
| 6 | YAML quoted strings with special characters | **PASS** | Double-quoted and single-quoted YAML scalars with `:`, `#`, `"`, `'` all handled |
| 7 | Invalid box-index (0) | **PASS** | Fails with `Issue #700: no acceptance box matched box-index 0` |
| 8 | Both box and box-index in one entry | **PASS** | Fails with `exactly one of box or box-index` |

**Key finding:** The validator is robust against em-dashes, fence markers, special characters, and invalid indices. The issue-scoping behavior (fixture 3) is intentional — each evidence block must be scoped to one issue.

## 4. Frozen-payload regression guard

### Test mechanism

`check-close-gate_test.ts` line 84-98: `assertCloseGateWorkflowUsesLiveLabels(workflow)` scans the `close-gate:` job in `ci.yml` for any reference to `github.event.pull_request.labels`.

### Regression injection

Modified `.github/workflows/ci.yml` to add:
```yaml
if: github.event_name == 'pull_request' && contains(github.event.pull_request.labels.*.name, 'status:ready-merge')
```

### Result

- **With regression:** Test FAILS with `close-gate job reads frozen github.event.pull_request.labels; fetch live PR labels through the API instead.`
- **After restore:** Test PASSES (1 passed, 0 failed)
- **ci.yml diff:** Empty (fully restored, no tracked file changes)

## 5. Mid-air-edit retry and exhaustion

### Happy path (existing test)

`mirror-acceptance-evidence_test.ts` line 5-40: A fake client whose `updateIssue` mutates the body on first call (simulating a concurrent edit), then accepts the second update. Result:
- `updates: 2` (two PATCH attempts)
- `result.changed: true`
- Body correctly reflects the merged state after retry

### Exhaustion path (constructed test)

A fake client whose `updateIssue` always injects a concurrent edit (body never matches desired hash). Result:
- Throws: `body changed during acceptance mirroring (before <hash>, expected <hash>, live <hash>); retry from the latest issue body after the concurrent edit finishes.`
- MAX_MIRROR_ATTEMPTS=2 enforced; error names all three hashes for debugging.

## 6. Live read-only verification

### check-close-gate against merged PR #1176 (closes #1168)

```
close-gate PASS rickylabs/netscript#1176
provenance: head=7d64ef559a89b27838e5104031e86740400d7abb evaluated=2026-08-03T20:13:10.138Z
snapshot: #1168 updated=2026-08-03T19:57:32Z bodySha256=c5db304bc8dbdcf7e018f8840d122ff13e71f9378c529f9b678d01af5bc1735c
closing issues: #1168
```

- Provenance line present with headSha, evaluatedAt, and issue snapshot (number, updatedAt, bodySha256).
- Exit code 0 (merged PR, all boxes satisfied).

### mirror --dry-run against PR #1179 (closes #1171)

```
acceptance-mirror DRY-RUN: no changes
provenance: head=5ea73e03be29b7321220eef6f617ce8524c57174 evaluated=2026-08-03T20:13:12.611Z
snapshot: #1171 updated=2026-08-03T19:51:13Z bodySha256=19ccd3387899cdab7219bc146be72c28105e5236d13f05b2b2c9d2755bea5ee8
notice: Mirror skipped because live PR labels do not include status:ready-merge
```

- Provenance line present.
- Correctly skips mirror when `status:ready-merge` is absent (live label check, not frozen payload).
- Notice explains the skip reason and how to trigger a fresh run.

## 7. ci.yml configuration

- **pull_request types:** `[opened, synchronize, reopened, edited, labeled, unlabeled]` — includes `labeled` and `unlabeled`.
- **close-gate job `if:`:** `github.event_name == 'pull_request'` — no label filter at job level.
- **mirror step:** No `if:` filter — reads labels live via API and self-skips when `status:ready-merge` is absent.
- **check-close-gate step:** No `if:` filter — always runs on pull_request events.
- **No frozen label reads:** The `assertCloseGateWorkflowUsesLiveLabels` guard confirms no reference to `github.event.pull_request.labels` in the close-gate job.

## Summary

| Claim | Evidence | Status |
|-------|----------|--------|
| REBUILD decision supported | Comparison matrix, 7 criteria, <80% coverage for all candidates | ✅ PASS |
| 34/34 tests pass | `deno test` output: 34 passed, 0 failed | ✅ PASS |
| 0 check/lint/fmt findings | Wrapper outputs: 0 findings each | ✅ PASS |
| Parser robust to hostile input | 8 fixtures, 7 pass, 1 fails by design (issue scoping) | ✅ PASS |
| Frozen-payload guard fires on regression | Injected regression → test FAILS; restored → test PASSES | ✅ PASS |
| Mid-air retry works | Fake client with divergent body → 2 updates, merged result | ✅ PASS |
| MAX_MIRROR_ATTEMPTS exhaustion | Fake client with persistent divergence → named error with hashes | ✅ PASS |
| Live provenance on merged PR | check-close-gate #1176: headSha, evaluatedAt, bodySha256 | ✅ PASS |
| Live dry-run skips correctly | mirror #1179: skips without label, explains reason | ✅ PASS |
| ci.yml triggers on labeled/unlabeled | `types:` includes both | ✅ PASS |
| No frozen label reads in ci.yml | Guard test passes; no `github.event.pull_request.labels` in close-gate | ✅ PASS |

## Verdict: PASS

All claims verified independently. No tracked files modified. Evaluation artifacts in `.llm/runs/fix-1171-close-gate-reliability--s3/evaluate.md`.
