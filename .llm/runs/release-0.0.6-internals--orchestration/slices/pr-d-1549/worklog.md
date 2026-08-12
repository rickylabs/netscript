# PR-D worklog

## Design

- Public surface: existing `scanCodeQuality*` APIs gain docs-fence provenance; one diff predicate is
  added for the pull-request workflow.
- Domain vocabulary: source scan units, soundness fixture, docs companion, allowance budget delta,
  and issue link.
- Ports: consume `extractFencedBlocks`; invoke `git` only at the diff predicate CLI boundary.
- Constants: the two quality task names form the finite allowance-budget surface.
- Commit slices: S1 scanner/docs contracts; S2 allowance ratchet and diff predicate; S3 typed
  triggers plus final evidence.
- Deferred scope: export reachability and live issue-state verification remain in #1378 for 0.0.7.
- Contributor path: scanner behavior and its fixtures live together under `.llm/tools/quality/`.

## Evidence

| Check | Result |
| --- | --- |
| Baseline `quality:scan:repo` | exit 0, findings 0, allowCount 10 |
| Baseline `quality:scan` | exit 0, findings 0, allowCount 7 |
| Docs-fence red control | exit 1: fenced `as any` under `docs/site/**` produced no finding before implementation |
| Scanner focused tests after integration | exit 0: 14 passed, 0 failed |

## Reconcile

- Bootstrap commit `f862fb57000c29a212034a25e9700c6a03753da4` is pushed and draft PR #1596
  exists with `Closes #1549`, the required taxonomy, and milestone 0.0.6.
- Live issue #1549 contains seven acceptance boxes. Evidence will use `box-index: 1..7`.
- D-1 records three pre-existing docs-companion findings that the widened scan exposes.
