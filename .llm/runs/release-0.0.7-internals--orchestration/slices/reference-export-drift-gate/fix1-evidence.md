# FAIL_FIX repair evidence — reference-export-drift-gate

## Attestation

- Evaluator finding: F1 at `4c09e9203afee52b43c10dfa1246eb0473ad7e40`.
- Immutable repaired implementation head: `4238670173271bca4281eba7db6c2030d046bc73`.
- Frozen base: `baf1cdf67a4e931af17b4772ddf6101f36152184`.
- Repair diff from the evaluator commit: exactly `.llm/tools/docs/check-exports-drift_test.ts`;
  direct Git diff raw exit 0.
- Checker behavior, product sources, tasks, workflows, and docs were not changed by the repair.

The tests now use real on-disk fixtures, capture the refusal cause, require exactly one expected
error, and reject file-read failures. The invented-symbol case documents the real export alongside
the invented symbol. Full mutation details and raw exits are recorded in
`audit/refusal-mutation-tests.md`.

## Head-bound receipts

The historical `receipts/s3/` set attests the pre-repair implementation head and is superseded for
current-head claims. The authoritative seven-receipt set is `receipts/fix1/`; its generated
`audit/evidence-set-fix1.json` result is `SUFFICIENT` with no reasons.

| Gate                 | Authoritative receipt     | Outcome | Raw exit | Notable result                                                                      |
| -------------------- | ------------------------- | ------- | -------: | ----------------------------------------------------------------------------------- |
| `check`              | `check.json`              | PASS    |        0 | Structured package/plugin check task completed at the repaired head                 |
| `test`               | `test-attempt2.json`      | PASS    |        0 | 4,203 passed, 0 failed, 19 ignored; 4,222 results                                   |
| `quality-job`        | `quality-job.json`        | PASS    |        0 | Composite completed; existing dependency-catalog warnings retained                  |
| `arch-check`         | `arch-check.json`         | PASS    |        0 | Doctrine failures 0; existing WARN/INFO findings retained                           |
| `docs-source-format` | `docs-source-format.json` | PASS    |        0 | Ran from `docs/site`; `Docs source format: OK`                                      |
| `docs-accuracy`      | `docs-accuracy.json`      | PASS    |        0 | Named drift task reached through the aggregate; existing peer warning retained      |
| `publish-dry-run`    | `publish-dry-run.json`    | PASS    |        0 | Static workspace simulation completed; 318,629 bytes of member/file output retained |

The first full-test receipt, `test.json`, is preserved as **RED, raw exit 1**: 4,202 passed, 1
failed, 19 ignored. The repository safety test found forbidden command strings inside the run-owned
full-archive tar under `.llm/tmp/`. After the two explicit mutation scratch directories were removed
(cleanup raw exit 0; absence raw exit 0), the new invocation `test-attempt2.json` returned raw
exit 0. The red is diagnostic interference and is not relabeled as a pass.

`publish-dry-run` proves static packaging and isolated-declaration compatibility only. It does not
prove a real publish, remote registry graph, installation, or production behavior; no publish was
attempted.

## Focused and boundary evidence

- Direct `deno task docs:exports-drift`: raw exit 0; eight nonempty per-package coverage reports and
  terminal PASS.
- Focused checker test after scratch cleanup: raw exit 0; 6 passed, 0 failed.
- Thirteen-path classifier: raw exit 0; contract size 13, 10 changed implementation paths, all
  authorized, and no unauthorized path.
- Direct forbidden-surface diff: raw exit 0 for `docs/exports`, `deno.lock`, Contracts/Fresh UI
  member configs, Contracts public barrel and already-correct primitive JSDoc, and MySQL paths.
- `deno.lock` base, repaired-head, and working-tree blobs are byte-identical:
  `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- Prior JSR audits remain applicable because this repair changes only a non-publishable tooling
  test; the required workspace `publish-dry-run` was recut at the repaired head.
- `fresh-browser`: `NOT_RUN`, N/A / waived; no runtime lease exists or was requested.

## Coordinator-owned close-gate mapping

Issue #1296 has five acceptance boxes. The plan's four-row live table folds the first two together;
the ready-merge evidence must map them separately:

1. Contracts examples import from real exporting entrypoints.
2. Contracts reference inventory advertises no non-exports.
3. Fresh UI reference matches the published export surface.
4. Intentional omissions are machine-readable.
5. Maintainer derivation/update runbook and discoverable drift verification are present.

No issue box was checked, no `acceptance-evidence` block was created, and the issue was not touched.
Those operations remain coordinator-owned at `ready-merge`.

Design checkpoint pointer: the locked D1-D11 table in `plan.md`, together with PLAN-EVAL cycle-2
PASS at `45c249b9c`, carries the design checkpoint for this leaf.

## Prohibited gates and handoff

Aspire, Docker, browser, `e2e:cli`, scaffold/runtime/service smokes, real publish, merge, ready
transition, relabel, issue closure, milestone mutation, central-state mutation, and runtime-resource
cleanup remain `NOT FIRED`. The implementation author does not self-certify; the coordinator owns
Tier-A, substantive review, readiness, and merge decisions.
