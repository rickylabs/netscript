use harness

## SKILL

- netscript-harness — run loop, commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` is framework code; this is a re-base, **not** a re-design.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt wrappers;
  `git ls-remote` immediately before any `--force-with-lease`, never a guessed SHA.

## D-210 — converge S8 (#1754) onto exact current `main` `6c195acaf`

### Why — and why this is not a repair

The Postgres-tier gate `database.seed` fails with exit 16 on this head. **It is not S8's defect.**
The failure correlates exactly with **branch base**, across four independent heads:

| Head | base | behind main | `database.seed` |
| --- | --- | ---: | --- |
| S8 `bc838a0b3` | `8a9257642` | 21 | **FAIL** |
| S9 `29eed9ef9` | `8a9257642` | 21 | **FAIL** |
| S10 `265466059` | `8a9257642` | 21 | **FAIL** |
| S7 `bd3dbc843` | `bd9d463b4` | 9 | **PASS** — both tiers fully green |
| #1747 `2032d4ed7` | `71d5fb8e0` | 7 | **PASS** |

Every head on the stale base `8a9257642` fails; every head on a newer base passes. The coordinator
has authorized **convergence, not repair**. Do **not** change product behaviour to chase this gate.

### Task

Rebase this branch's **13 own commits** onto **exact `origin/main` `6c195acaf`**:

```
git fetch origin main
git rebase origin/main          # 13 commits over base 8a9257642
```

### Conflict rules — unchanged from D-121/D-122, and binding

1. **Generated files** (`*.generated.ts`, generated `*.template` snapshots under
   `packages/cli/src/kernel/assets/generated/`): **do not hand-merge.** Take `main`'s side, `git add`,
   continue. The barrel is regenerated deterministically at the end.
2. **Any non-generated source conflict: STOP, `git rebase --abort`, and report it** with the exact
   file, commit, and hunks. Do not force-resolve. The supervisor brings it back for a ruling. This
   rule has already prevented two bad merges in this programme — honour it.
3. Anything touching `main`'s shipped D-101 listener contract: **`main` wins.**

After the rebase: run `deno task gen:assets-barrel` **once**, then `deno task check:assets-barrel`
and confirm diff-clean. Commit any regeneration delta as a single clearly-scoped commit.

### Verification (all required before pushing)

- `git merge-base HEAD origin/main` **==** `origin/main`.
- `git range-diff 8a9257642..bc838a0b3 origin/main..HEAD` — report the commit mapping. Every commit
  should be `=`; **explain any `!` explicitly** rather than letting it pass.
- **Blob-identity report for the product surface.** For every non-generated file under `packages/`
  that this branch changes, print `git rev-parse HEAD:<path>` at the **old** head `bc838a0b3` and at
  the **new** head, and state which blobs are identical and which changed. The supervisor needs this
  to decide whether the existing IMPL-EVAL verdict carries or a fresh delta evaluation is required —
  **range-diff `=` is not sufficient evidence for that decision, blob hashes are.**
- Scoped structured check on `packages/cli` + `packages/cli/e2e` (`--ext ts,tsx`, `--unstable-kv`).
- Scoped lint + fmt on the files this branch changes.
- Focused tests for the touched areas (operation-runner, generator, runtime-gates, suite registry).
- `deno task check:aspire-version-parity` — expect `fail=0`.
- **No runtime.** No Aspire, Docker, AppHost, or `e2e:cli` runtime suites — CI delivers the runtime
  verdict, and host leases are serialized and not yours.

### Push

`git ls-remote origin refs/heads/feat/aspire-13-5-s8-typed-resource-commands` immediately before
pushing, then `--force-with-lease=<that exact SHA>`. Do not move or delete the
`aspire-13-5-s8-pre-reconstruction` safety tag.

### Out of scope

- No product/behaviour change. No PR base change, no label or lifecycle change.
- Do not touch S9, S10, or any other branch — they converge onto **your new head** afterwards, so
  leaving them alone is what keeps that possible.
- **No self-dispatched evaluator.**

### Report back

Old head, new head, per-conflict resolution taken, the range-diff mapping, **the blob-identity table**,
every verification command's exit code, whether the barrel regeneration produced a delta, and
confirmation the worktree is clean and the push landed.
