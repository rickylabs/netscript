use harness

# #1466 slice-1 repair, cycle 2 — Tier-A returned ACCEPTED_WITH_FINDINGS

Same thread, same worktree `/home/agent/projects/netscript/worktrees/007-leaf-1731`, same branch
`feat/sdk-procedure-meta` (no upstream). Your cycle-1 work is accepted and stays: archive
`9649b349`, content `3c3f9b7c`, evidence `b4157a9d`. Start from `b4157a9d`, do not rebase, do not
revert anything, do not touch `receipts/frozen-c9a391811/`.

## SKILL

You already hold the context. Re-read only `plan.md` A-items T-2 and A-6, and
`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:104-106` (AP-14).

I verified your whole report independently — archive renames, all eight receipts, the 13-finding
doc-lint count and its composition, and that `git diff --stat 21d51622..b4157a9d -- .llm/tools` is
empty. Everything you claimed holds, including the part that contradicted the brief's hoped-for
outcome. Three items follow, in order.

## AF-1 (do this first) — your re-pinned guard is a tautology

```ts
type BaseMeta = typeof baseContract['~orpc']['meta'];
type _BaseMetaSlotPreserved = Assert<Equal<BaseMeta, BaseContractMeta>>;
```

`baseContract` is explicitly annotated `ContractBuilder<…, BaseContractMeta>`, and upstream declares
`'~orpc': ContractBuilderDef<…, TMeta>` (`@orpc/contract@1.15.0/dist/index.d.mts:209`). Both sides of
that `Equal<>` read the **same annotation**. It cannot fail for any change in the initializer, in
`oc.$meta`, or in oRPC.

I proved it rather than asserting it. This probe type-checks with exit 0:

```ts
const c2: ContractBuilder<…, Errs, Meta1 & Record<never, never>> = oc.$meta<Meta2>({}).errors(errs);
type _P2 = Assert<Equal<typeof c2['~orpc']['meta'], Meta1 & Record<never, never>>>;
```

The annotation absorbs a divergent initializer and the assertion still passes. Consequence: **A-item
T-2's "pin generic position 4 exactly" is currently pinned by nothing** — the annotation *declares*
position 4, and only assignability (not equality) checks the initializer against it.

Your can-fail proof was real but proves only that the assertion is not `any`-degenerate — that the
tautology's two sides are equal. It does not show the guard tests oRPC. This is the "guard that
cannot fail" class this lane has already rejected twice; it does not pass a third time renamed.

**The same tautology is in the committed contracts fixture**, so this is not doctest-only:
`packages/contracts/tests/type-fixtures/procedure-meta_type.ts` — `_BaseMetaRemainsExact`,
`_InputOutputRouteMetaRemainsExact`, `_OutputRouteMetaRemainsExact`, and both
`…ErrorsRemainExact` assertions all compare annotation-derived types to that annotation's own
arguments.

**Required.** Add an exactness probe that re-derives the builder **without an annotation** — the same
`oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` expression, its **inferred** type
asserted `Equal<>` to `BaseContractMeta`, and its inferred error map asserted `Equal<>` to
`BaseContractErrors`. That is the thing that actually tests upstream. Then **demonstrate it fails**:
perturb the expected type, show the `TS2344`, restore. Report the exact diagnostic.

Where it lives is your call — it legitimately needs the unexported `commonErrorMap`, so an internal
test-path import is acceptable here; say what you chose and why. Keep it under the receipted `test`
gate.

Do **not** touch what already works: `.meta(publicMeta)`, the two `@ts-expect-error` negatives, and
the runtime storage assertions in `procedure-meta_test.ts` are genuine guards.

## AF-2 — the doc-lint delta, now unblocked by AF-1

Coordinator-authorized: a bounded **NetScript-owned public type correction**. Target is **delta ≤ 0
versus base 12**; you are at 13. Exactly four references are in scope:

| Public symbol | References | Owner |
| --- | --- | --- |
| `baseContract` | `ContractBuilder`, `Schema` | upstream |
| `BaseContractErrors` | `MergedErrorMap` | upstream |
| `BaseContractErrors` | `commonErrorMap` | **NetScript** |

`commonErrorMap` is ours and is simply missing a public export — that one is straightforward, with
real ownership JSDoc. The two upstream names stay unexportable: AP-14 is not lifted.

**Here is the seam AF-1 opens.** The only reason `baseContract` carries an explicit
`ContractBuilder<…>` annotation instead of the base's `ReturnType<typeof oc.errors<…>>` — which cost
**one** finding, `oc`, not three — is to pin position 4 for T-2. AF-1 establishes the annotation does
not actually deliver that pin. Once your unannotated probe pins it, the annotation form is no longer
load-bearing for T-2 and becomes a free representation choice, and a NetScript-owned `typeof`-derived
alias becomes available and is measurably cheaper.

I am naming the seam, not prescribing the edit. **Land AF-1 first, then measure.** Whatever you
choose must keep `check`, every fixture, the assertion budget, `arch:check`, `publish-dry-run` and
the contracts JSR audit green, and must preserve `isolatedDeclarations` emission.

If delta ≤ 0 is unreachable without re-exporting an upstream type, weakening T-2, or dropping a
public alias, **stop and return a scoped blocker with the measured numbers.** That outcome is
pre-authorized by the coordinator and is worth more than a manufactured green.

Not authorized: un-exporting `BaseContractErrors` to buy back findings; touching `QueryClient`,
`StreamsInstrumentation`, `CrudRoute` or `AnySchema` (pre-existing baseline, other packages);
changing generic position 3; touching the #1350 error channel; any assertion or `any`.

## AF-3 — rerun `test` under quiet load

Your two failures are in `.llm/tools/agentic/` and this leaf's diff touches **zero** files there —
I checked. `codex-follow_test.ts` died on `Deno.watchFs` → `Too many open files (os error 24)` and
`hybrid-launcher_test.ts` on a surviving worker descendant; both are fd/process-contention shapes,
and your run was concurrent with three other Codex threads on this host.

Rerun the root `test` gate at your new content head with nothing else of yours running, and do the
receipt cut serially rather than in parallel with the other gates. If both stay red under quiet load
they are pre-existing repo-tooling failures unrelated to this leaf: report them as a scoped blocker
with the evidence. Do **not** fix, skip, de-catalog, ignore, or narrow them — they are not this
leaf's to touch.

## Then

Recut **all eight** receipts at the new content head (`--attempt 3`, contracted paths / `gateId`s /
`invocationId`s, `gitHead == actualGitHead`, never `--allow-git-head-mismatch`). Re-run the
supplemental contracts JSR audit — you are changing the public export surface again. Recompute
sufficiency over the eight named files. Update `worklog.md`, `drift.md` (D-1 gets the final measured
numbers; add an entry for the tautology and what now pins T-2) and `context-pack.md`. Push with the
explicit refspec, post the structured PR comment, and **stop**.

**Land what exists before you stop** — commit and push even if a gate is red, and say what is
unfinished. A red gate is still the deliverable; uncommitted work is invisible to review.

## Prohibitions unchanged

No merge, publish, ready-flip, relabel, milestone change, issue close, `#1348`/cluster-state
mutation, rebase, force-push, push to `main`, expensive-gate lease, `scaffold.runtime`,
`fresh-browser`, Aspire, Docker, sibling worktrees, lock churn, IMPL-EVAL, or slice 2. Tier-A is
mine. There is no IMPL-EVAL until the exact-head doc/JSR/export gates and root `test` are green or a
genuine scoped blocker is returned.

## Report back

The AF-1 probe with its failure demonstration and exact diagnostic; the AF-2 change with base /
pre-repair / cycle-1 / cycle-2 doc-lint counts side by side and re-measured assertion baselines; the
AF-3 quiet-load result; the new content head and evidence head; all eight recut receipt outcomes with
`gitHead == actualGitHead` shown; your sufficiency verdict; the PR comment URL; and any scoped
blocker. Then stop.
