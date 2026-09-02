use harness

## SKILL

- netscript-harness — run loop, commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` is framework code; this is a re-base, **not** a re-design.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt wrappers;
  `git ls-remote` immediately before any `--force-with-lease`, never a guessed SHA.

## D-213 — converge S10 (#1760) onto S8's newly converged head

### Why — this is not a repair

The Postgres-tier gate `database.seed` fails with exit 16 on this head. **It is not S10's defect.**
It correlates exactly with **branch base** across five heads: every head on the stale base
`8a9257642` fails, and every head on a newer base passes — S7 `bd3dbc843` came back **fully green
on both tiers**. The coordinator authorized **convergence, not repair**. Do **not** change product
behaviour to chase that gate.

### Ancestry — read this before choosing a command

This branch is **still stacked on S8**: `git merge-base --is-ancestor bc838a0b3 265466059` is **true**, and
this branch carries **25** commits over base `8a9257642` — S8's 13 plus **12 of its own**.

**A plain `git rebase origin/main` would replay S8's 13 commits a second time. Do not do that.**

S8 has already converged onto current `main` `6c195acaf`; its new head is **`d1c6d8b54`**.
Replay only this branch's own 12 commits onto it:

```
git fetch origin
git rebase --onto d1c6d8b54 bc838a0b3
```

### Conflict rules — binding

1. **Generated files** (`*.generated.ts`, generated `*.template` snapshots under
   `packages/cli/src/kernel/assets/generated/`): **do not hand-merge.** Take the upstream side,
   `git add`, continue. The barrel is regenerated deterministically at the end.
2. **Any non-generated source conflict: STOP, `git rebase --abort`, and report it** with the exact
   file, commit, and hunks. Do not force-resolve. This rule has already prevented two bad merges in
   this programme — honour it.
3. Anything touching `main`'s shipped D-101 listener contract: **`main` wins.**

After the rebase: `deno task gen:assets-barrel` **once**, then `deno task check:assets-barrel`,
confirm diff-clean, and commit any regeneration delta as one clearly-scoped commit.

### Verification (all required before pushing)

- `git merge-base HEAD d1c6d8b54` **==** `d1c6d8b54` (stacked on the new S8 head — **not** on
  `origin/main`; asserting against main here is structurally wrong for a stacked slice).
- `git range-diff bc838a0b3..265466059 d1c6d8b54..HEAD` — report the mapping for your **12** own commits.
  Every commit should be `=`; **explain any `!` explicitly**.
- **Blob-identity table for the product surface.** For every non-generated file under `packages/`
  this branch changes, print `git rev-parse HEAD:<path>` at old head `265466059` and at the new head, and
  state which blobs are identical and which changed. The supervisor uses this to decide whether the
  existing IMPL-EVAL verdict carries — **range-diff `=` is not sufficient for that, blob hashes
  are.**
- Scoped structured check on the roots this branch touches (`--ext ts,tsx`, `--unstable-kv`).
- Scoped lint + fmt on the files this branch changes.
- Focused tests for the touched areas.
- `deno task check:aspire-version-parity` — expect `fail=0` at phase 1.
- **No runtime.** No Aspire, Docker, AppHost, or `e2e:cli` runtime suites — CI delivers the runtime
  verdict and host leases are serialized and not yours.

### Push

`git ls-remote origin refs/heads/test/aspire-13-5-s10-e2e-gate-upgrades` immediately before pushing, then
`--force-with-lease=<that exact SHA>`.

### Out of scope

- No product/behaviour change. No PR base change, no label or lifecycle change.
- Do not touch S8 or the sibling slice.
- **No self-dispatched evaluator.**

### Report back

Old head, new head, per-conflict resolution, the range-diff mapping, **the blob-identity table**,
every verification command's exit code, whether the barrel regeneration produced a delta, and
confirmation the worktree is clean and the push landed.

## Execution evidence — 2026-08-31

- PLAN-EVAL: N/A. D-213 is a coordinator-locked mechanical replay with an exact command, immutable
  base/head boundaries, binding conflict rules, and a complete acceptance matrix. It makes no
  architecture or product decision.
- Old head: `2654660595503ee5b851891380f1fe700ffb257b`.
- Replayed product head: `deeb6eb66a025f269cdff8d5cf32ba94f143aff9`.
- Target S8 head: `d1c6d8b54fdb02f4d913f0c269aea2be4a5dfce0`.
- `git rebase --onto d1c6d8b54 bc838a0b3` replayed 12/12 commits with no conflicts. Therefore no
  generated conflict needed the upstream rule, no non-generated conflict triggered the abort rule,
  and no D-101 listener file required a resolution.
- The explicit `deno task gen:assets-barrel` invocation exited 0 and produced no tracked delta.
  `deno task check:assets-barrel` exited 0; the check task internally invokes the generator before
  diffing its declared generated targets.
- `git merge-base deeb6eb66 d1c6d8b54` returned the full target S8 head.

### Range-diff — original 12 S10 commits

| # | Old | Relation | Replayed | Subject |
| -: | --- | :---: | --- | --- |
| 1 | `08e0804a8` | `=` | `d6a81ed19` | lock structured Aspire gate contracts red |
| 2 | `dbba8a9c6` | `=` | `2a77bd2cf` | capture doctor and describe follow evidence |
| 3 | `3c86a273c` | `=` | `612c51eae` | prove exact AppHost cleanup ownership |
| 4 | `c30dc9314` | `=` | `05c193fcb` | register resource command and receipt gates |
| 5 | `cfa64308c` | `=` | `8b0f0cf1e` | record S10 Phase A evidence |
| 6 | `bbfc499e2` | `=` | `c89eb5b5d` | prove cleanup ownership and runnable resource command |
| 7 | `a1418b100` | `=` | `5efd9a747` | accept bare describe follow resources |
| 8 | `e3332d222` | `=` | `85a7fb0c7` | treat nullable health reports as pending |
| 9 | `00437994d` | `=` | `f68b240f1` | make describe follow parser DTO-complete |
| 10 | `aaf5ec639` | `=` | `6f1f71a05` | record blocked S10 unstack verification |
| 11 | `c9e3fcbe8` | `=` | `f1e601160` | restore canonical listener readiness module |
| 12 | `265466059` | `=` | `deeb6eb66` | restore database convergence budgets after restart |

### Product blob identity — old head vs replayed product head

| Path | Old blob | New blob | Identity |
| --- | --- | --- | --- |
| `packages/cli/e2e/README.md` | `64cf5fddef95b8d522acad55e61dbc0f37f2b816` | `64cf5fddef95b8d522acad55e61dbc0f37f2b816` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` | `d3d21d340129b6185d23fffad154dc30435265c4` | `d3d21d340129b6185d23fffad154dc30435265c4` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup.ts` | `86f0e1729ae47dfecec18b219427b59ea48db2b5` | `86f0e1729ae47dfecec18b219427b59ea48db2b5` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts` | `371a9583691856cb9e993af52e71f887b80b16b5` | `371a9583691856cb9e993af52e71f887b80b16b5` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/doctor.ts` | `ee027df642dbf2c1d8fd52b5db33a22ba09bef42` | `ee027df642dbf2c1d8fd52b5db33a22ba09bef42` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/resource-command.ts` | `3671a0deb9ec8dd97650fadd6a4cf72ba915760d` | `3671a0deb9ec8dd97650fadd6a4cf72ba915760d` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/scaffold-capability-gates.ts` | `038ec0bc90b11c2d3a3fcec3f01869b0a36084fb` | `038ec0bc90b11c2d3a3fcec3f01869b0a36084fb` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts` | `f4c98c9982ee634897db4d547ebf3392abb6e0a2` | `f4c98c9982ee634897db4d547ebf3392abb6e0a2` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/wait-for-workers-runtime.ts` | absent | absent | identical |
| `packages/cli/e2e/src/domain/cli-surface.ts` | `36f00b00834ab476c193ed871857b980e9d65ec8` | `36f00b00834ab476c193ed871857b980e9d65ec8` | identical |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts` | `1f4a26275bad2d2e6676f5df9ff305fa3b841ad2` | `1f4a26275bad2d2e6676f5df9ff305fa3b841ad2` | identical |
| `packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` | `2a4369e20b18422db801cbcf2f7455adc29a3133` | `2a4369e20b18422db801cbcf2f7455adc29a3133` | identical |
| `packages/cli/e2e/tests/application/gates/aspire-cleanup-evidence_test.ts` | `32f98a85a840a574a6e67e7e7d493a4504ed7640` | `32f98a85a840a574a6e67e7e7d493a4504ed7640` | identical |
| `packages/cli/e2e/tests/application/gates/aspire-structured-evidence_test.ts` | `0b4178ddbd8b29da8c180fc2cb6eb930def80217` | `0b4178ddbd8b29da8c180fc2cb6eb930def80217` | identical |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-describe-follow-13.5.3-capture.ndjson` | `b758142e5943791d067f283beb44c11e01654ccb` | `b758142e5943791d067f283beb44c11e01654ccb` | identical |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-describe-follow-13.5.3-nullable-state.ndjson` | `9ab98d0aac39823d1185626ff59c4c9c77323b43` | `9ab98d0aac39823d1185626ff59c4c9c77323b43` | identical |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-describe-follow-13.5.3.ndjson` | `eb115d8760aaaf4656d89af09cfe3d4b4eedcea0` | `eb115d8760aaaf4656d89af09cfe3d4b4eedcea0` | identical |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-describe-follow.ndjson` | `51e9999dba2318f4042799e1ed1e32005843b4f4` | `51e9999dba2318f4042799e1ed1e32005843b4f4` | identical |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-doctor-13.5.3.json` | `ed352a9cb9a20b497a4d290a192f11c22865ed97` | `ed352a9cb9a20b497a4d290a192f11c22865ed97` | identical |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-post-stop-probe.json` | `71fe9d586c5dfd9bae163cf37424a826f67fa00d` | `71fe9d586c5dfd9bae163cf37424a826f67fa00d` | identical |
| `packages/cli/e2e/tests/application/gates/fixtures/aspire-stop-transcript.json` | `c5e78347aba2611c53cf471096e748a677bb0c8b` | `c5e78347aba2611c53cf471096e748a677bb0c8b` | identical |
| `packages/cli/e2e/tests/application/gates/resource-command-gate_test.ts` | `6740907b0fb9b7b9f30556ec7fbc667f9f4475a9` | `6740907b0fb9b7b9f30556ec7fbc667f9f4475a9` | identical |
| `packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts` | `8431a814ab457dc2ce78c81f09501bec724428d1` | `8431a814ab457dc2ce78c81f09501bec724428d1` | identical |
| `packages/cli/e2e/tests/application/runner/suite-runner_test.ts` | `a2ad59aa61bf28c2ac54c4de3a86754ee50d8c42` | `a2ad59aa61bf28c2ac54c4de3a86754ee50d8c42` | identical |
| `packages/cli/e2e/tests/presentation/suite-registry_test.ts` | `988f60f4f639b4e9474f2a9daef5512f3aa79a86` | `988f60f4f639b4e9474f2a9daef5512f3aa79a86` | identical |

### Verification ledger before push

| Command | Exit | Result |
| --- | ---: | --- |
| `git fetch origin` | 0 | target object and remote refs refreshed |
| `git rebase --onto d1c6d8b54 bc838a0b3` | 0 | 12/12 replayed, no conflict |
| explicit `deno task gen:assets-barrel` | 0 | no tracked delta |
| `deno task check:assets-barrel` | 0 | generated targets diff-clean |
| `git range-diff bc838a0b3..265466059 d1c6d8b54..deeb6eb66` | 0 | all 12 original commits `=` |
| initial check/lint/fmt wrappers with JSON output but no `--allow-write` | 1 each | evidence-write permission error; rerun below |
| scoped check wrapper rerun (`packages/cli/e2e` + gate catalog, `ts,tsx`, default unstable KV) | 0 | 0 diagnostics |
| combined changed-file lint rerun | 2 | 0 findings, but refused partial coverage because root config dropped the gate catalog |
| split E2E changed-file lint wrapper | 0 | 0 findings |
| split gate-catalog lint wrapper with explicit minimal config | 0 | 0 findings |
| exact changed-file format wrapper rerun | 0 | 17 files, 0 findings |
| focused static/unit test wrapper | 0 | 94 passed, 0 failed |
| `deno task check:aspire-version-parity` | 0 | phase 1, `fail=0` |
| `deno task quality:gate` | 0 | quality scan clear; doctrine `FAIL=0` with baseline warnings |

No Aspire, Docker, AppHost, `e2e:cli`, runtime suite, evaluator, PR-base, label, or lifecycle action
was run. The existing IMPL-EVAL carry decision remains with the supervisor; D-213 supplies exact
product blob identity rather than self-certification.
