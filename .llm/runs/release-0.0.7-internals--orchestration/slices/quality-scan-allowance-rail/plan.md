# Plan — quality-scan-allowance-rail

## Status and hard stop

Coordinator comment `5286261678` and central commit `874eacc0d` resolve the three authority
questions raised by the advisory OpenRouter `FAIL_PLAN`. The repaired plan is ready for a fresh,
bounded, formal opposite-family PLAN-EVAL, but the owner has forbidden that launch before the
Saturday 2026-08-15 00:00 Europe/Zurich allowance reset. No implementation may begin until a fresh
separate session evaluates this repaired head and `plan-eval.md` records `PASS`.

## Outcome

Land #1545 allowance registration and then #1378 enforcement in one coherent draft PR so that:

1. every live `quality-allow:` has a reason and a verified open, milestoned issue owner;
2. the allowance maximum equals the live population (currently 7) and can never increase without a
   verified issue link in the same change;
3. `any` in a publicly reachable declaration/signature fails while the same token in a local-only
   declaration does not trigger the public-surface rule;
4. already-landed docs-fence, docs-fixture, soundness, trigger-typing, and overflow behavior remains
   green;
5. generated CLI assets, publishable surfaces, repo quality, and doctrine evidence are coherent at
   the final head.

## Locked design

### Public reachability

Extend the existing scanner with a source-native export graph rather than invoking `deno doc` as a
runtime pass/fail oracle. Discover workspace/package export targets from checked-in `deno.json`
files, follow local re-export edges, and scan the publicly reachable declarations/signatures with a
token-aware lexical pass. Keep the existing line-oriented local rules separate. This makes the
acceptance distinction explicit and deterministic without adding a registry dependency.

The public rule covers direct and re-exported type aliases, interfaces, function signatures, generic
defaults/constraints, exported class public members, and exported values whose explicit types
contain `any`. Comments, strings, implementation bodies, and local-only declarations must not be
false positives. Unresolvable local export edges fail closed with a diagnostic rather than silently
shrinking the public graph.

### Allowance record and issue state

Parse each allowance into one record:

```text
quality-allow: #<issue> — <specific reason>
```

Reject missing/multiple IDs, missing reasons, duplicate/malformed records, closed issues, issues
without a milestone, and unavailable/malformed issue-state responses. Deduplicate lookups by issue
number. Keep issue resolution behind an injected port so focused tests use fixtures.

The production adapter is a narrow GitHub REST lookup for `rickylabs/netscript`, using only
`api.github.com` and an optional existing token for rate limits. It must fail closed when no
authoritative answer is available. All seven source registrations bind to open, milestoned #1276 T3
and retain their existing specific reason. #1545 tracks the one-time registration and may close; it
is never written into source as the durable owner.

### Budget

Set both `quality:scan` and `quality:scan:repo` to `--max-allow 7`, matching the measured
population. Keep the existing allowance-budget diff checker as the same-change numeric guard; the
scanner independently validates every source registration, so a new allowance/budget increase cannot
pass without its own open, milestoned issue link in the diff. Normal cleanup only lowers the
count/budget. No planned slice increases the population.

### Existing behavior

Do not rewrite the #1549 work. Preserve the shared docs snippet extractor, docs `*_test.ts` fixture
scan, six soundness assertions, typed triggers reference examples, and current overflow behavior.
Add regression cases only where needed to make their relationship to the new allowance rail
explicit.

### Architecture

This remains one archetype-6 tool with an internal source-discovery adapter, an export-graph
classifier, an allowance parser/resolver port, and a reporting/application boundary. No new CLI
spine, package layer, feature axis, or plugin extension point is introduced. Existing CLI and Fresh
topology stays **Keep**; the workers cast is registered debt, not weakened or removed here.

## Contract-first types and vocabulary

- `PublicExportGraph`: roots and resolved local export edges.
- `PublicAnyFinding`: file, location, declaration kind, and reachable export path.
- `QualityAllowance`: file, line, issue number, and non-empty reason.
- `AllowanceIssueState`: issue number, open/closed state, milestone identity.
- `AllowanceIssueResolver`: deterministic batch resolution port.
- `AllowancePolicyFailure`: malformed registration, unavailable state, closed/unmilestoned owner, or
  overflow.

All numeric maxima and recognized syntax live in named constants or parsed task arguments; no
duplicated magic number is introduced.

## Ordered Design slices

All slices update `worklog.md` and `context-pack.md`, preserve receipts under this run directory,
commit, push with the explicit refspec, and receive a substantive Tier-A topic review before
supervisor sign-off.

### Slice 1 — register the measured allowance population

First capture RED-first focused results for malformed, unlinked, closed, unmilestoned, unavailable,
and overflow cases. Then land the parser/resolver contract, seven issue-linked source records, both
budgets at 7, and deterministic resolver fixtures in one green reviewable commit. Registration
precedes public-`any` enforcement. No pushed head may be day-one red.

Planned files under the coordinator-amended contract:

- `.llm/tools/quality/scan-code-quality.ts`;
- `.llm/tools/quality/scan-code-quality_test.ts`;
- `deno.json`;
- `packages/cli/src/public/features/root/public-command-dependencies.ts`,
  `packages/cli/src/public/public-api.ts`, and `plugins/workers/streams/producer.ts`;
- `.llm/tools/consumer-tools.json` and `packages/cli/src/kernel/assets/agent-tools.generated.ts` for
  the exact consumer permissions and generated copy.

Proof: focused structured tests, `quality-scan`, `quality-scan-repo`, `allowance-budget`, scoped
check/lint/format, and generated-asset freshness where applicable.

### Slice 2 — enforce exported/publicly reachable `any`

Capture RED-first cases for direct export, re-export, multiline alias/signature, class/interface
member, and local-only control. Land the export graph and token-aware public-declaration rule while
keeping local-only `any` outside this specific rule. Preserve the docs and soundness behaviors in
the same focused suite.

Planned files: scanner and focused scanner test only.

Proof: focused structured tests, scoped check/lint/format, `quality-scan`, and `quality-scan-repo`.

### Slice 3 — synchronize shipped assets and public evidence

Regenerate the embedded CLI tool only through `gen:assets-barrel`, then run the checked-in freshness
check a second time with no diff. Review exact CLI/workers export maps, dependency pins, publish
file lists, isolated-declaration diagnostics, and runtime asset availability. Add one
`DEBT_ACCEPTED` no-increase entry to `.llm/harness/debt/arch-debt.md` that binds the Workers
20-diagnostic/13-export-target baseline to #1655. Preserve the already-typed triggers docs and avoid
unrelated Fresh/docs edits unless a RED-first regression demonstrates a necessary approved-surface
correction.

Planned files: generated CLI asset through its checked-in generator and the debt registry entry. Do
not hand-edit generated output. The debt registry is authorized for implementation but remains
untouched during this plan-repair slice.

Proof: `assets-barrel`; CLI full-export `doc:lint`; Workers full-export `doc:lint` showing exactly
20 `private-type-ref` diagnostics and no new diagnostic class/count across all 13 targets; scoped
publish dry-run; and the #1655-linked `DEBT_ACCEPTED` record. This leaf must not report Workers
full-export lint as green.

### Slice 4 — final gates, review reconciliation, and sign-off artifacts

Acquire the coordinator's global/expensive-gate lease before applicable gates. Run every proving
gate at one final SHA, reconcile Tier-A topic findings, update acceptance evidence, and commit only
run-artifact/sign-off changes. Request an opposite-family IMPL-EVAL; leave the PR draft.

No status-ready label, ready-for-review flip, merge, publish, or release action is in scope.

## Gate map

| Contract                | Evidence command/form                                        | Timing                                 |
| ----------------------- | ------------------------------------------------------------ | -------------------------------------- |
| Focused RED/green tests | `.llm/tools/run-deno-test.ts --output <run>/receipts/...`    | each behavior slice                    |
| Scoped type check       | `.llm/tools/run-deno-check.ts` over changed TS roots/files   | each behavior slice                    |
| Scoped lint/format      | structured lint/fmt reporters, TS/TSX only                   | each behavior slice                    |
| Check                   | durable `check` gate receipt                                 | final head; lease if classified global |
| Test                    | durable `test` gate receipt                                  | final head; lease if classified global |
| Quality job             | durable `quality-job` receipt                                | final head; global lease               |
| Scanner                 | durable `quality-scan` and `quality-scan-repo` receipts      | each slice and final head              |
| Doctrine                | durable `arch-check` receipt                                 | final head                             |
| Fresh browser           | durable `fresh-browser` receipt from `packages/fresh`        | final head; global lease               |
| Docs source format      | durable `docs-source-format` plus its test from `docs/site`  | final head                             |
| Docs accuracy           | durable `docs-accuracy` receipt                              | final head                             |
| Generated asset         | `assets-barrel`, followed by a clean second generation       | Slice 3/final head                     |
| JSR docs                | CLI green; Workers exact 20-diagnostic no-increase baseline  | Slice 3/final head                     |
| Publish package set     | scoped `publish:dry-run`; inspect pins and file lists        | Slice 3/final; global lease            |
| Git/lock truth          | raw `git status`, `git diff`, `git diff <base> -- deno.lock` | every slice/final                      |

A receipt proves the exact command at the recorded SHA, not semantic sufficiency. Tier-A review and
the separate IMPL-EVAL remain mandatory.

## JSR audit plan

- **CLI:** inspect all three export targets with `deno doc`, run full-export `doc:lint`, scoped
  publish dry-run, review exact pins/publish files, and verify the embedded scanner runtime asset.
- **Workers:** inspect all thirteen export targets, run full-export `doc:lint`, scoped publish
  dry-run, review exact pins/publish files, and prove that `private-type-ref` remains exactly 20
  with no new diagnostic category. Record `DEBT_ACCEPTED` against #1655 (milestone 0.0.8). Do not
  claim full-export lint green or absorb #1655's repair.
- **Fresh/docs:** run their overlay gates; do not claim them as touched publishable members unless
  the final source diff actually touches them.
- Never publish, reload caches, delete lock files, or retain unrelated `deno.lock` churn.

## Open-decision sweep

### Coordinator-resolved decisions

1. **Allowance owner:** all seven records use open, milestoned #1276 T3 and their specific reasons;
   live #1545 is reconciled to seven and may close.
2. **Exact surface extension:** `.llm/tools/quality/scan-code-quality_test.ts`,
   `.llm/tools/consumer-tools.json`, `packages/cli/src/kernel/assets/agent-tools.generated.ts`, and
   `.llm/harness/debt/arch-debt.md` are authorized. No other widening is permitted.
3. **Workers baseline:** #1655 in milestone 0.0.8 owns removal. This leaf may add one no-increase
   `DEBT_ACCEPTED` entry and prove the exact 20-diagnostic baseline, but may not claim green lint or
   repair the public surface.

No design or authority decision remains open. The only blocker is the required fresh formal
opposite-family PLAN-EVAL, which must not launch before 2026-08-15 00:00 Europe/Zurich.

### Safe deferrals

- Removing the six CLI casts and one workers cast remains #1276 T3 work; this leaf registers and
  enforces the rail but does not perform that removal.
- The 20 Workers `private-type-ref` repairs remain exclusively owned by #1655.
- #1278 Inventory B, #1276 T1–T2/T4–T5, #1245, #1249, #1379, and #1380 remain excluded.
- Broader public API resolution beyond checked-in local export/re-export graphs remains out of
  scope; unresolvable local edges fail closed rather than being ignored.

No listed scope deferral blocks this leaf. The Plan-Gate scheduling hold remains binding.

## Completion and rollback

Completion requires green named proving gates at one final SHA, coherent seven-record registration,
no budget increase, clean generated assets, reviewed JSR evidence, Tier-A topic review after every
implementation slice, separate IMPL-EVAL, and complete per-issue acceptance blocks. Rollback is by
reverting the leaf commits; no persistent service, schema migration, publication, or external data
mutation is introduced.
