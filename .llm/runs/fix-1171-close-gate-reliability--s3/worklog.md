# S3 worklog — close-gate reliability

Date: 2026-08-03
Branch: `fix/1171-close-gate-reliability`
Issue: #1171 · part of epic #1169
Lane: Codex implementation; supervisor owns slice review and evaluation

## Design

### Public surface

- `acceptanceCheckboxes` selects the existing acceptance/gate convention and annotates one-based
  indexes plus `[post-merge]` exclusions.
- `parseAcceptanceEvidence` reads fenced structured evidence and the one-release legacy format.
- `validateEvidenceMapping` resolves an explicit issue + exact box text or box index and returns
  only actionable unchecked boxes.
- `issueSnapshot`, `bodySha256`, and `staleSnapshots` define verdict provenance and mechanical stale
  comparison.
- `mirrorIssue` is the race-aware, fake-client-testable issue mutation seam.
- `assertCloseGateWorkflowUsesLiveLabels` guards the close-gate job against frozen event labels.

### Domain vocabulary

- `AcceptanceCheckbox`, `AcceptanceEvidence`, `EvidenceParseResult`
- `IssueSnapshot`, `VerdictProvenance`
- `MirrorClient`, `MirrorIssueResult`, `MirrorReport`

### Ports

- GitHub REST is behind the existing gate client and the new `MirrorClient` seam. Tests supply a
  deterministic fake to force a mid-air edit.
- SHA-256 uses Web Crypto; no new dependency or lockfile entry.

### Constants

- `READY_LABEL = status:ready-merge`
- `MAX_MIRROR_ATTEMPTS = 2`
- `DEFAULT_OVERRIDE_LABEL = status:close-gate-override` (unchanged)
- `[post-merge]` is the documented non-blocking convention.

### Commit slices

1. Research/adoption decision — `research.md`; proof: cited comparison; commit `4d4da3f71`.
2. Shared contract, live gate/mirror, workflow, docs, and negative tests; proof: scoped static gates,
   owned tests, full permission-correct validation suite, YAML parse, and PR #1177 live dry run.

### Deferred scope

- No migration to native sub-issues: they do not model per-box evidence.
- No generic YAML engine: the parser accepts only the documented scalar YAML subset, avoiding a new
  runtime dependency and lock churn.
- No PR/issue mutation outside the existing opt-in mirror.

### Contributor path

Start in `acceptance-evidence.ts` for selection, structured mapping, and provenance. Add parser and
predicate cases beside `acceptance-evidence_test.ts`; mutation/race behavior belongs in
`mirror-acceptance-evidence_test.ts`; workflow-event regressions belong in
`check-close-gate_test.ts`.

## Implementation evidence

- Live state: both executables fetch PR/body/head/labels/issues during execution. The workflow uses
  event context only for repository and PR identifiers; `labeled`, `unlabeled`, and `edited` now
  trigger fresh runs.
- Structured mapping: fenced YAML-subset blocks are issue-scoped and support exact `box` or
  one-based `box-index`; em dashes are not delimiters. Legacy lists emit a named deprecation.
- Provenance: JSON and pretty reports include `headSha`, `evaluatedAt`, and issue
  `{number, updatedAt, bodySha256}` snapshots.
- Failures: mapping/gate errors name issue, box, comparison, and repair.
- Post merge: `[post-merge]` boxes produce notices and remain unticked/non-blocking.
- Mirror: complete mapping is validated before mutation; each issue is fetched again immediately
  before PATCH, the result hash is verified, one mid-air edit retry is allowed, and provenance
  comments are marker-deduplicated.
- Override: `status:close-gate-override` behavior remains in the independent close-gate.
- Skill sync: `sync-claude-skills.ts --pretty` reported only
  `.claude/skills/netscript-pr/SKILL.md` stale, then synchronized it.

## Negative-case coverage

| Predicate | Negative proof |
| --- | --- |
| Evidence punctuation | Evidence containing an em dash maps unchanged. |
| Exact match | Unknown named box fails with issue, compared text, and repair. |
| Snapshot currency | Pre-edit snapshot is stale against changed `updatedAt`/body hash. |
| Post-merge classification | Unchecked `[post-merge]` yields notice and no finding/mutation. |
| Live-label workflow | Synthetic frozen-label close-gate job makes the guard throw. |
| Mutation race | Fake client forces a mid-air body edit; mirror refetches, preserves it, and succeeds on attempt two. |

## Gate evidence

| Gate | Result |
| --- | --- |
| `run-deno-check.ts --root .llm/tools/validation --ext ts` | PASS · 17 files · 0 occurrences |
| `run-deno-lint.ts --root .llm/tools/validation --ext ts` | PASS · 17 files · 0 occurrences |
| `run-deno-fmt.ts --root .llm/tools/validation --ext ts` | PASS · 17 files · 0 findings |
| Owned tests with requested permissions | PASS · 14 passed · 0 failed |
| Directory tests with required temp permission (`--allow-write`) | PASS · 34 passed · 0 failed |
| `ci.yml` parsed with `@std/yaml` | PASS |
| Forbidden-pattern scan | PASS for owned code: no `any`, `deno-lint-ignore`, or `as unknown as` |

The prompt's exact directory command, `deno test --allow-read --allow-env
.llm/tools/validation/`, exits non-zero before assertions in eight unrelated existing tests. Those
tests call `Deno.makeTempDir()` and Deno 2.9 correctly reports `NotCapable: Requires write access to
<TMP>`. The same complete directory suite passes 34/34 with `--allow-write`. Rewriting unrelated
validators to avoid their declared temp work would exceed S3 scope; supervisor should either accept
the permission-correct evidence or amend the requested command.

## Read-only live demonstration — PR #1177

Mirror dry-run (exit 0, no mutation):

```text
acceptance-mirror DRY-RUN: no changes
provenance: head=ac0252fbd43df9d9e921a20890c61c8049431dc9 evaluated=2026-08-03T20:01:33.200Z
snapshot: #1170 updated=2026-08-03T19:57:44Z bodySha256=abb3470428a3aba39e731ff3b0f80be4340ce549c17161f38de04dc13ca2a2fe
notice: Mirror skipped because live PR labels do not include status:ready-merge; apply the label then push because reruns do not create a new labeled event.
```

Independent close-gate (exit 0):

```text
close-gate PASS rickylabs/netscript#1177
provenance: head=ac0252fbd43df9d9e921a20890c61c8049431dc9 evaluated=2026-08-03T20:00:39.070Z
snapshot: #1170 updated=2026-08-03T19:57:44Z bodySha256=abb3470428a3aba39e731ff3b0f80be4340ce549c17161f38de04dc13ca2a2fe
closing issues: #1170
```

## Harness handoff note

The slice directory arrived with the supervisor's `implement.md` and thread metadata but without
`supervisor.md`, `plan.md`, or `plan-eval.md`. The owner prompt supplied locked invariants and
explicitly assigned this implementation lane. No evaluator verdict is invented here; the supervisor
must perform the required substantive slice review and separate-session evaluation before merge.

## S3 sign-off (Tier-A review)

- 2026-08-03 · Research decision (rebuild; no candidate ≥30% coverage) reviewed and accepted —
  sources verified, coverage table honest. Implementation reviewed in full: live reads only with a
  frozen-payload regression guard test; structured `acceptance-evidence` fenced block with
  box-index fallback + legacy format kept one release behind a deprecation warning; provenance on
  every verdict; whole-mapping validation before first mutation; mid-air-edit retry with hash
  compare; provenance comment deduped by marker; `[post-merge]` boxes excluded with notice;
  `labeled` activity type added to ci.yml triggers.
- Supervisor changes on top: rebased onto main past #1177/#1178 (ci.yml conflict resolved in favor
  of tool-owned label logic, superseding the #1178 hotfix step); discarded deno.lock churn;
  reworded the skip notice (reruns DO work now that reads are live).
- Independent gates: check/lint/fmt 17 files 0 findings; deno test .llm/tools/validation 34/34;
  live check-close-gate PASS on merged #1176 (legacy em-dash evidence read compatibly); live
  mirror dry-run on #1178 with provenance + corrected notice.

## Reconciliation with #1181 (2026-08-03)

Rebased `fix/1171-close-gate-reliability` onto `origin/main` at `c49bd1db2`, which contains #1181
commit `3049ef027`. Conflicts were limited to `check-close-gate.ts` and its tests; the rebuilt S3
implementation remained the base and #1181's additive PR-body Definition-of-Done capability was
ported into it.

### Reconciled contract

- Added `PrFinding`, `findUncheckedPrBody`, the `prFindings` report field, and
  `closeGatePasses(overrideActive, issueFindings, prFindings)`. Unchecked boxes beneath PR-body
  `## Definition of Done` or `## Acceptance` now fail the gate; `## Slices` and other checklists do
  not.
- Ported #1181's PR-body negative test, override/pass semantics, and pretty-report assertion. The
  provenance assertion was deliberately adapted from #1181's duplicate `evaluatedIssues` field to
  S3's canonical `issues: [{number, updatedAt, bodySha256}]` field and compact
  `provenance: head=… evaluated=…` pretty output. No information asserted by #1181 was dropped.
- Retained S3's shared acceptance parser, live API reads, structured evidence, post-merge notices,
  named repair actions, stale-snapshot helper tests, race-aware mirror, and frozen-payload workflow
  guard.
- Kept the #1181 PR template unchanged from main: its `Definition of Done` heading and comments
  match the implemented authoritative-section predicate.
- Canonical `netscript-pr` documentation now contains both #1181's PR-body DoD wording and S3's
  structured-evidence/operator playbook. The rules are complementary and no contradiction was
  found: PR-body DoD/Acceptance boxes govern PR completion claims, while issue acceptance evidence
  governs boxes in issues named by closing keywords. The generated `.claude` copy was synchronized.
- `deno.lock` has no reconciliation diff.

### Reconciliation gates

| Gate | Result |
| --- | --- |
| Scoped validation check | PASS · 17 files · 0 occurrences |
| Scoped validation lint | PASS · 17 files · 0 occurrences |
| Scoped validation format | PASS · 17 files · 0 findings |
| `deno test --allow-read --allow-env --allow-write .llm/tools/validation/` | PASS · 37 passed · 0 failed |
| `ci.yml` YAML parse | PASS |
| `deno task agentic:check-claude` | PASS · config, mirror sync, and hook lock checks |
| Lock hygiene | PASS · `deno.lock` unchanged |

Reconcile note: #1181's PR-body enforcement is preserved as an additive predicate rather than a
replacement parser/report. The supervisor's previous sign-off and IMPL-EVAL predate this
reconciliation commit; the reconciliation diff remains intentionally unpushed for renewed review.
