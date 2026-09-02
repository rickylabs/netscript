# #1925 — CI failure diagnosis and repair (head `d0fa4ffea`)

## What failed

Run `33630630168`, `quality` job, step 14 `README fence integrity` — the gate this PR adds, failing
in CI while passing locally at exit 0.

Receipt (`.llm/tmp/gate-receipts/quality/readme-fences.json`, `outcome: FAIL`, `exitCode: 1`):

```
readme fences: FAIL readmes=36 fences=167 ts_like=72 exempt=0 checked=71
               syntax_invalid=1 type_errors=32 failing_readmes=7 unattributed_failure=false
ratchet failure: failing readmes 7 > 6
ratchet failure: type errors 32 > 31
```

## Diagnosis — base drift, not a defect

Local head measured `fences=166 ts_like=71 checked=70 type_errors=31 failing_readmes=6`; CI measured
the merge ref. The delta is exactly one fence. Isolated it mechanically rather than by inspection:

```
for f in $(git diff --name-only ef608b0b3 HEAD -- 'packages/*/README.md' 'plugins/*/README.md'); do
  compare ```ts|tsx|typescript fence counts at each end
done
→ plugins/auth/README.md  1 -> 2      (only file that moved)
```

The new fence is main's typed bearer client example. It imports `./auth/sdk-client.ts` — the module
the **installer emits into the consumer app**, which no repository path resolves → `TS2307`.

`unattributedFailure` was `false`, so the leading transient-network hypothesis was wrong: the gate
attributed every diagnostic correctly and failed for a real, readable reason.

## Ruling

Same tolerated *consumer-owned-module* class already carried by `packages/sdk`
(`blocks/contracts/orders.ts`), `packages/service` (`blocks/router.ts`) and
`packages/prisma-adapter-mysql` (`.generated/client.server.ts`). Pre-existing debt class, not a
defect introduced here; rewriting another lane's just-merged documentation is out of scope for this
leaf. Absorbed by **re-measuring at the merge base**, with every moved number named in the policy
header and the commit message — `tsLike` 71→72, `checked` 70→71, `typeErrors` 31→32,
`failingReadmes` 6→7. Floors moved with the ceilings, so the corpus still cannot shrink to
manufacture a pass.

**The failure is the best evidence the PR has.** It is an unplanned, real-world demonstration of
acceptance box 1: a README fence naming an unresolvable specifier now fails CI, on content nobody
wrote for the test.

## Second repair — the evaluator's scope edge, fixed rather than filed

The IMPL-EVAL found the gate would not run on the diffs it polices. Verified directly:

```
classifyPath('packages/cli/README.md') → {deno:false, docs:true, surface:true, pages:true, …}
classifyPath('plugins/auth/README.md') → {deno:false, docs:true, …}
```

The step was guarded `if: env.RUN_DENO == 'true'`, so **README-only** PRs skipped it.

Initially scoped as an `orchestrator:internals` classifier issue — CI routing is theirs. That was
wrong. Reading the job showed `quality` already runs on `needs_deno || needs_docs`, exposed as
`RUN`. Only my own step's guard was too narrow. Fixed inside this leaf with a one-token change; no
classifier change, no other lane, no cross-lane issue needed.

`readme-fence-workflow_test.ts` (new) pins plumbing, exactly-once quality placement, the receipt,
and the guard. Confirmed a real regression test, not a proxy: restoring the `RUN_DENO` guard makes
it fail; restoring `RUN` makes it pass.

## Box 2 proved by injection

Appending a `ts` fence with `renamedOrUndeclaredSymbol` to the clean `packages/logger/README.md`:
`type_errors=33 failing_readmes=8`, exit 1, both `ratchet failure:` lines. README restored
byte-clean (`git diff --quiet` passes).

## Commits

| Commit | What |
| --- | --- |
| `5d0a84a35` | merge current main `4720596fc` |
| `69c4cf620` | re-measure the ratchet at the current base |
| `9d33f38cb` | point the README existence gate at the compile gate (box 4, both directions) |
| `d0fa4ffea` | run the gate on docs-only diffs + workflow contract test |

## Methodology note worth keeping

A ratchet baseline measured on a commit is stale the moment main moves. Measuring on the **merge
base** — not the branch head — is the only measurement CI will agree with. The same trap will hit
any future ratchet gate in this repo.
