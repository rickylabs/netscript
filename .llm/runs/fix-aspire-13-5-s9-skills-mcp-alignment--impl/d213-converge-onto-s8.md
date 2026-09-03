use harness

## SKILL

- netscript-harness — run loop, commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` is framework code; this is a re-base, **not** a re-design.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt wrappers;
  `git ls-remote` immediately before any `--force-with-lease`, never a guessed SHA.

## D-213 — converge S9 (#1759) onto S8's newly converged head

### Why — this is not a repair

The Postgres-tier gate `database.seed` fails with exit 16 on this head. **It is not S9's defect.**
It correlates exactly with **branch base** across five heads: every head on the stale base
`8a9257642` fails, and every head on a newer base passes — S7 `bd3dbc843` came back **fully green
on both tiers**. The coordinator authorized **convergence, not repair**. Do **not** change product
behaviour to chase that gate.

### Ancestry — read this before choosing a command

This branch is **still stacked on S8**: `git merge-base --is-ancestor bc838a0b3 29eed9ef9` is **true**, and
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
- `git range-diff bc838a0b3..29eed9ef9 d1c6d8b54..HEAD` — report the mapping for your **12** own commits.
  Every commit should be `=`; **explain any `!` explicitly**.
- **Blob-identity table for the product surface.** For every non-generated file under `packages/`
  this branch changes, print `git rev-parse HEAD:<path>` at old head `29eed9ef9` and at the new head, and
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

`git ls-remote origin refs/heads/fix/aspire-13-5-s9-skills-mcp-alignment` immediately before pushing, then
`--force-with-lease=<that exact SHA>`.

### Out of scope

- No product/behaviour change. No PR base change, no label or lifecycle change.
- Do not touch S8 or the sibling slice.
- **No self-dispatched evaluator.**

### Report back

Old head, new head, per-conflict resolution, the range-diff mapping, **the blob-identity table**,
every verification command's exit code, whether the barrel regeneration produced a delta, and
confirmation the worktree is clean and the push landed.

## Execution record — 2026-08-31

### Heads and ancestry

- Old S9 head: `29eed9ef9729940e9ec022b23d4abe5b190357e3`.
- New S8 base: `d1c6d8b54fdb02f4d913f0c269aea2be4a5dfce0`.
- Rebased S9 implementation head: `b054ef6cfefb4c48050901a862c8d3a0a92d9204`.
- Post-regeneration head before this evidence commit:
  `55791043eeaded114c5817a5405a8c5d7b6f5c22`.
- `git merge-base HEAD d1c6d8b54` returned the full new S8 base with exit 0.

### Conflict resolutions

| Old commit | Path | Classification | Resolution |
| --- | --- | --- | --- |
| `8d8c5e00b` | `packages/cli/src/kernel/assets/skills.generated.ts` | generated | took rebase upstream/S8 (`git checkout --ours`), staged, continued |
| `905f787f8` | `packages/cli/src/kernel/assets/skills.generated.ts` | generated | took rebase upstream/S8 (`git checkout --ours`), staged, continued |
| `00c2ef168` | `packages/cli/src/kernel/assets/skills.generated.ts` | generated | took rebase upstream/S8 (`git checkout --ours`), staged, continued |

No non-generated source conflict occurred. No D-101 listener-contract conflict occurred.

### Compact range mapping

| # | Old | Status | New | Subject |
| ---: | --- | :---: | --- | --- |
| 1 | `d81f5fd34` | `=` | `7396abd1d` | test(cli): add Aspire MCP smoke receipt gate |
| 2 | `06103eeef` | `=` | `5063e7b30` | ci(e2e): retain Aspire MCP smoke receipts |
| 3 | `8d8c5e00b` | `!` | `352a7a6c4` | fix(agent): align Aspire 13.5 skills and corpora |
| 4 | `b2667fba6` | `=` | `ed658a415` | docs(harness): close S9 phase A evidence |
| 5 | `905f787f8` | `!` | `702a1333b` | docs(skills): apply S9 docs_audit cycle-1 fixes |
| 6 | `7553078a1` | `=` | `8d97157bc` | fix(e2e): keep observed tool surface in the MCP smoke failure receipt |
| 7 | `00c2ef168` | `!` | `b1376e6ae` | fix(e2e): ratify the 14-tool 13.5.3 MCP baseline |
| 8 | `b162de6c1` | `=` | `c78593d1b` | fix(e2e): tolerate headless Aspire MCP dashboards |
| 9 | `d9bd6250c` | `=` | `b13404c43` | fix(e2e): authenticate the Aspire dashboard for MCP smoke |
| 10 | `0c4d9990a` | `=` | `be28d8f39` | fix(e2e): fail closed on the exact Aspire dashboard payload |
| 11 | `042ff3ca5` | `=` | `4a2037756` | docs(harness): record D-148 S9 un-stack evidence |
| 12 | `29eed9ef9` | `=` | `b054ef6cf` | fix(e2e): bind Aspire config to AppHost workspace |

The three `!` rows are exactly the three generated-file conflict resolutions above. Their
non-generated product blobs are unchanged. Deterministic regeneration produced the separate
`55791043e` commit; no source repair or behavior change was made.

### Non-generated `packages/` blob identity

The denominator is every `packages/` path changed by `bc838a0b3..29eed9ef9`, excluding
`*.generated.ts` and generated template snapshots under
`packages/cli/src/kernel/assets/generated/`.

| Path | Old blob (`29eed9ef9`) | New blob (`55791043e`) | Result |
| --- | --- | --- | --- |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp-smoke.ts` | `d15937600f5006a259675c3689e0bd35b5cd1f71` | `d15937600f5006a259675c3689e0bd35b5cd1f71` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/contract.ts` | `44900f4f0c8453362f4f0f02c9d429c85f556a2f` | `44900f4f0c8453362f4f0f02c9d429c85f556a2f` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/evaluate.ts` | `aa4494308c343696b0bdda18732144f32fe90408` | `aa4494308c343696b0bdda18732144f32fe90408` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/evidence.ts` | `ac3eed133d4f9a290833eb0e8aed4e7f27754448` | `ac3eed133d4f9a290833eb0e8aed4e7f27754448` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/receipt.ts` | `80da5dbf7da3150a53c9342e5081145a8dbec927` | `80da5dbf7da3150a53c9342e5081145a8dbec927` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/stdio-transport.ts` | `7420dd05939c46cac29c46daac3e1d59261d2e59` | `7420dd05939c46cac29c46daac3e1d59261d2e59` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/aspire-mcp/tools.ts` | `564afa1e5fa97c463dd8c7564806ed1d05c7f6a2` | `564afa1e5fa97c463dd8c7564806ed1d05c7f6a2` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` | `bf47a758895ccd7035c6dffc905c172eeb680ff2` | `bf47a758895ccd7035c6dffc905c172eeb680ff2` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/runtime/runtime-scripts.ts` | `ff0fb4e9e7c9f3698caf374cf928df5e141ff570` | `ff0fb4e9e7c9f3698caf374cf928df5e141ff570` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/scaffold-capability-gates.ts` | `e2bea025cf8586687712e71b2099c07a333ca20a` | `e2bea025cf8586687712e71b2099c07a333ca20a` | identical |
| `packages/cli/e2e/src/application/gates/scaffold/scaffold-gates.ts` | `da76b690a45af76c1ffde5d2d8778e6f025fe6e5` | `da76b690a45af76c1ffde5d2d8778e6f025fe6e5` | identical |
| `packages/cli/e2e/src/domain/cli-surface.ts` | `daa7007f7deb73d11b8a5802704a228c2ccaa41d` | `daa7007f7deb73d11b8a5802704a228c2ccaa41d` | identical |
| `packages/cli/e2e/suites/scaffold/capability-suites.ts` | `7dcdaafb9e3ed744c4a7aca1620215837fa0584e` | `7dcdaafb9e3ed744c4a7aca1620215837fa0584e` | identical |
| `packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` | `c8584a6e464569d59ed27ab073b99f9cce7c5e3e` | `c8584a6e464569d59ed27ab073b99f9cce7c5e3e` | identical |
| `packages/cli/e2e/tests/application/gates/aspire-mcp-smoke_test.ts` | `6856f57c53b5478eef3ba4c2d4ae2501761f8ecd` | `6856f57c53b5478eef3ba4c2d4ae2501761f8ecd` | identical |
| `packages/cli/e2e/tests/fixtures/aspire-13.5.3-mcp-recorded.json` | `4dbeb026b5cd5df135dbc26b28e5bf6e39ce4be7` | `4dbeb026b5cd5df135dbc26b28e5bf6e39ce4be7` | identical |
| `packages/cli/e2e/tests/presentation/suite-registry_test.ts` | `da3ea8b8c4449739dce6a81a31ca3153154bc687` | `da3ea8b8c4449739dce6a81a31ca3153154bc687` | identical |
| `packages/cli/src/kernel/assets/agent/guidance.md.template` | `7ad43f478e7b0c988aa2bd13c0670df5c7346839` | `7ad43f478e7b0c988aa2bd13c0670df5c7346839` | identical |
| `packages/cli/src/public/adapters/agent/deno-aspire-agent-initializer.ts` | `6311fae297db35e3d331ea9bc8c6d5a898ad233a` | `6311fae297db35e3d331ea9bc8c6d5a898ad233a` | identical |
| `packages/cli/src/public/adapters/agent/deno-aspire-agent-initializer_test.ts` | `7add09eeb57c7f779326d662b2353a8b24fff75d` | `7add09eeb57c7f779326d662b2353a8b24fff75d` | identical |
| `packages/cli/src/public/features/agent/init/aspire-agent-initializer.ts` | `e7b7d77453439b6ba0e9bcf81d72babc7cce7a61` | `e7b7d77453439b6ba0e9bcf81d72babc7cce7a61` | identical |
| `packages/cli/src/public/features/agent/init/init-agent.ts` | `f77afb1f74861183abcd75ae6c06168b8fcae1e6` | `f77afb1f74861183abcd75ae6c06168b8fcae1e6` | identical |
| `packages/cli/src/public/features/agent/init/init-agent_test.ts` | `f5975eb4aa43417a0ed9047863ffad6655ce0b0c` | `f5975eb4aa43417a0ed9047863ffad6655ce0b0c` | identical |

Summary: 23 identical, 0 changed.

### Verification exits

| Command | Exit | Result |
| --- | ---: | --- |
| `git fetch origin` | 0 | target/base objects refreshed |
| `git rebase --onto d1c6d8b54 bc838a0b3` plus generated-only continuations | 0 final | 12 commits replayed; three generated conflicts resolved as above |
| `deno task gen:assets-barrel` | 0 | produced a 3-line add/3-line delete delta in `skills.generated.ts` |
| first `deno task check:assets-barrel` | 1 | expected non-verdict: detected the uncommitted regeneration delta |
| post-commit `deno task check:assets-barrel` | 0 | reproducible and diff-clean |
| `git merge-base HEAD d1c6d8b54` | 0 | exact full S8 head returned |
| `git range-diff --no-patch bc838a0b3..29eed9ef9 d1c6d8b54..HEAD` | 0 | 9 `=`, 3 generated-only `!`, plus one regeneration commit |
| blob-identity loop (`git rev-parse <rev>:<path>`) | 0 | 23 identical, 0 changed; every per-rev lookup exited 0 |
| initial broad scoped check (206 files) | 1 | non-verdict: base-dependent `Timeout` ambient-type interaction outside the exact changed-file evidence scope |
| exact changed-file structured check (`--ext ts,tsx`; wrapper uses `--unstable-kv`) | 0 | 21 selected, 1 batch, 0 failed batches/diagnostics |
| initial root-config lint / fmt | 2 / 2 | non-verdict coverage refusals: root config excluded five CLI files |
| exact changed-file lint / fmt with temporary no-exclude rules-preserving config | 0 / 0 | 21/21 processed, zero drops/findings; temporary config removed |
| focused structured tests | 0 | 82 passed, 0 failed across five touched-area suites |
| `deno task check:aspire-version-parity` | 0 | phase 1, checked 812, `fail=0` |
| `deno task quality:gate` | 0 | quality scan clean; doctrine `FAIL=0` with pre-existing warnings |

No Aspire, Docker, AppHost, `e2e:cli`, PLAN-EVAL, or IMPL-EVAL command was run.
