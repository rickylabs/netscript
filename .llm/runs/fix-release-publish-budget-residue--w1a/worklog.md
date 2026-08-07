# Worklog

## Bootstrap

- Fresh worktree from `origin/main` `d6db645a89d830e6c36e838e8e1dac98fc84fde5`.
- Owner-authorized proportional workflow: PLAN-EVAL waived; independent IMPL-EVAL mandatory.
- OpenHands paused; milestone orchestrator retains merge authority.
- PLAN-EVAL: N/A under the owner's written proportional waiver for this small connected cluster;
  separate-session IMPL-EVAL remains mandatory.

## Design

- **Public/tool surface:** two internal release CLI tools: a pre-mint JSR budget check and a
  post-failure exact-version outcome report. No package export changes.
- **Domain vocabulary:** `JsrPublishBudget` (`usage`, `limit`, `remaining`, `requiredAttempts`) and
  `PublishOutcome` (`none | partial | complete`, `published`, `missing`).
- **Ports:** injected `fetch` for deterministic JSR API/registry tests; existing
  `discoverWorkspaceMembers` owns the package set. No new abstraction layer.
- **Constants:** scope `netscript`; generated-source suffixes; the existing centralized JSR API and
  registry base URLs; output classification strings.
- **Commit slices:** S0 bootstrap; S1 contracts/tests + minimal implementation/docs; S2 complete
  generator gates and evidence. The detailed file/gate mapping is in `plan.md`.
- **Deferred scope:** changed-package publishing, local quota ledger, Billing Run, W1-B/W1-C,
  publication, and orchestration.
- **Contributor path:** workflow step → focused tool → colocated `_test.ts`; residue behavior stays
  in `bump-version.ts` with its existing tests; operator policy stays in `netscript-release`.
- **JSR safety:** fail closed before minting, never publish locally, preserve exact-version
  immutability, and distinguish registry outcomes from pinned consumer verification.

## Gate evidence

### S1 — publish-budget, truthful outcome, and generated residue safety

- Focused tests: `deno test ... check-jsr-publish-budget_test.ts ... report-jsr-publish-outcome_test.ts ... release-canary-workflow_test.ts ... bump-version_test.ts` — exit 0; 18 passed, 0 failed.
- Scoped check wrapper (`.llm/tools/release` + `.llm/tools/deps`, 53 files) — exit 0; 0 diagnostics.
- Scoped lint wrapper (same roots, 53 files) — exit 0; 0 diagnostics.
- Scoped fmt wrapper initially found five owned formatting findings; focused `deno fmt` changed only
  the seven owned TS files. Wrapper recheck — exit 0; 0 findings.
- Residue scan cost over the repository, five runs: 260/246/253/253/282 ms; mean 259 ms, max
  282 ms. Generated-name-only TS scope adds the required asset coverage while avoiding ordinary TS
  tests/docs and keeping the bump scan sub-second.
- JSR rubric: no package export/metadata/include surface changed; OIDC-only real publication remains
  untouched. The new quota call is authenticated/read-only and fails closed before minting.

### S1 self-inspection

- Budget order is mechanically asserted before `release:canary`.
- Registry classification cannot write a green pair and runs only after the real Publish step fails.
- Published-member immutability and identical-tree missing-member recovery stay aligned with the
  existing republish guard.
- `deno.lock` remains untouched.

### Post-slice reconcile

PR #1341 and issues #1312/#1148 are open in milestone `0.0.5`, each has exactly one
`status:impl`, and the resolving PR retains both closing keywords. No new reviewer/evaluator
comments were present at the slice checkpoint.

## Generator gate set

| Gate | Raw exit | Receipt |
| --- | ---: | --- |
| `check:publish-assets` | 0 | generated publish assets fresh |
| `release:preflight` | 0 | text imports/import attributes/file-URL/self-imports all PASS |
| `publish:readiness` | 0 | 35 effective members; every composed check PASS; version 0.0.4 |
| `publish:dry-run` | 0 | coordinated workspace dry-run completed; no real publish |
| `deps:audit --level low` | 0 | completed with 26 pre-existing advisory findings |

The dry-run helper left catalog-materialized/format-only changes in 19 member `deno.json` files.
They were clean immediately before the gate, the diff was inspected as generated churn, and only
those 19 paths were restored. No source or lockfile was restored; final worktree/lock checks are
clean.

## Residual risks

- The budget check and real publish are separate JSR operations; workflow concurrency and requiring
  the full 35-member headroom reduce but cannot make the external quota read transactional.
- JSR exposes rolling usage/limit, not the expiry timestamp of each attempt; operators must wait for
  attempts to age out rather than rely on a guessed reset clock.
- The 26 dependency advisories are baseline graph findings and out of this release-tooling cluster;
  this change adds no dependency and does not modify `deno.lock`.
- Formal IMPL-EVAL is deliberately pending in a separate session. No writer PASS is recorded.

## Independent IMPL-EVAL handoff

Run from this native WSL worktree in a fresh session:

```bash
deno task agentic:claude-openrouter -- --model deepseek/deepseek-v4-flash-0731 --effort max \
  --prompt .llm/runs/fix-release-publish-budget-residue--w1a/evaluate-prompt.md \
  --output .llm/tmp/w1a-impl-eval-result.json
```

Canonical route: `formal_impl_evaluator` via `claude-openrouter`, preset
`claude-evaluator-deepseek-v4-flash-0731`, DeepSeek V4 Flash 0731 at max effort. If and only if
OpenRouter reports a provider limit, use the checked-in AGY Google fallback
`gemini-3.6-flash-high` at high effort. OpenHands remains paused.
