# Tier-A — #1466 slice-1 bounded repair, PR #1731

| Field | Value |
| --- | --- |
| Reviewer | topic supervisor `topic-features-0.0.7`, native Claude Opus 5 · high |
| Author | Codex · OpenAI · `gpt-5.6-sol` · medium, thread `01a0515c-28c8-7131-8197-e808f7b7e10f` (terminal) |
| Archive commit | `9649b349cda5372838df20f4f17811d79c77e1e6` |
| Content head | `3c3f9b7c999d2fa9ec9d31c0b4f455ae890f4b0d` |
| Evidence head | `b4157a9dcddea35b319563a03b478768d8bc74ad` — local == remote == PR head, clean |
| PR comment | `https://github.com/rickylabs/netscript/pull/1731#issuecomment-5467215279` |
| **Verdict** | **`ACCEPTED_WITH_FINDINGS`** — one substantive finding (AF-1), one authorized continuation (AF-2), one environmental rerun (AF-3) |

## What I verified myself rather than accepting

| Claim | How I checked | Holds |
| --- | --- | --- |
| Archive is byte-identical | `git show --stat 9649b349` → 8 pure renames, `0` insertions / `0` deletions | yes |
| Eight receipts, attempt 2, exact head | parsed all eight JSON: distinct `gateId`s, contracted `invocationId`s, `gitHead == actualGitHead == 3c3f9b7c9` on every one, no mismatch waiver | yes |
| doc-lint at repaired head = 13 | re-ran the plan's exact 16-entrypoint argv myself | yes — **13**, and the composition matches the author's account exactly |
| The +1 residual's cause | the three `BaseContractErrors` consumer refs are gone; two new ones appear **on the alias itself** (`MergedErrorMap`, `commonErrorMap`) | yes |
| Both root-test failures are outside the leaf | `git diff --stat 21d51622..b4157a9d -- .llm/tools` → **0 files**; both failures are in `.llm/tools/agentic/` | yes |
| Nothing self-certified | PR still OPEN draft, labels untouched, no IMPL-EVAL, no slice 2 | yes |

The author's report is accurate in every particular I tested, including the part that contradicted
its own brief's hoped-for outcome. It measured, reported the miss, and stopped instead of chasing it
— which is the behaviour the brief asked for.

## AF-1 (substantive) — the re-pinned guard is a tautology, and nothing now pins position 4

The repair replaced

```ts
type _EmptyBaseMetaSlotPreserved = Assert<Equal<BaseMeta, Record<never, never>>>;
```

with

```ts
type BaseMeta = typeof baseContract['~orpc']['meta'];
type _BaseMetaSlotPreserved  = Assert<Equal<BaseMeta, BaseContractMeta>>;
```

`baseContract` is **explicitly annotated** `ContractBuilder<…, BaseContractMeta>`, and upstream
declares `'~orpc': ContractBuilderDef<TInputSchema, TOutputSchema, TErrorMap, TMeta>`
(`@orpc/contract@1.15.0/dist/index.d.mts:209`). So `BaseMeta` **is** `BaseContractMeta` by
construction: both sides of the `Equal<>` read the same annotation. The assertion cannot fail for any
change in the initializer, in `oc.$meta`, or in oRPC.

I did not argue this from reading — I ran it. A standalone probe annotates a builder position 4 as
`Meta1 & Record<never, never>` while the **initializer** produces `Meta2`:

```ts
const c2: ContractBuilder<…, Errs, Meta1 & Record<never, never>> = oc.$meta<Meta2>({}).errors(errs);
type _P2 = Assert<Equal<typeof c2['~orpc']['meta'], Meta1 & Record<never, never>>>;
```

`deno check` exits **0**. The annotation absorbs the divergence and the assertion still passes. So:

- the guard is vacuous, and
- **A-item T-2 — "pin generic position 4 exactly" — is currently pinned by nothing.** The explicit
  annotation *declares* position 4; assignability, not equality, is what checks the initializer
  against it, and assignability tolerates a divergent meta.

The author's can-fail proof (restoring `Record<never, never>` → `TS2344`) is real but proves only
that the assertion is not `any`-degenerate. It proves the tautology's two sides are equal; it does
not show the guard tests oRPC. That distinction is exactly the "guard that cannot fail" class this
lane rejected on #1730/S-1 (mutation B reds nothing) and on the `never reaches the Anthropic provider
wire request` test. I am not going to let it through a third time under a different name.

**The same tautology is in the committed contracts fixture**, so this is not a doctest-only slip:
`packages/contracts/tests/type-fixtures/procedure-meta_type.ts` `_BaseMetaRemainsExact`, and
`_InputOutputRouteMetaRemainsExact` / `_OutputRouteMetaRemainsExact` / the two `…ErrorsRemainExact`
assertions, all compare annotation-derived types to the same annotation's arguments.

Not everything there is vacuous, and the repair should not touch what works: `.meta(publicMeta)`,
the two `@ts-expect-error` negatives, and the runtime `procedure-meta_test.ts` storage assertions are
genuine guards over real behaviour.

**Required:** one exactness probe that re-derives the builder **without an annotation** — the same
`oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` expression, its inferred type asserted
`Equal<>` to `BaseContractMeta` (and its error map to `BaseContractErrors`). That is what tests
upstream. Then demonstrate it fails when the expected type is perturbed.

## AF-2 (authorized continuation) — the doc-lint delta, and why AF-1 unblocks it

Coordinator-authorized: a bounded **NetScript-owned public type correction** for the remaining
private references. Measured target is **delta ≤ 0 versus base 12**; the head is at 13.

The four in scope, and only these four:

| Public symbol | References | Owner |
| --- | --- | --- |
| `baseContract` | `ContractBuilder`, `Schema` | upstream oRPC |
| `BaseContractErrors` | `MergedErrorMap` | upstream oRPC |
| `BaseContractErrors` | `commonErrorMap` | **NetScript** |

`commonErrorMap` is ours and is the one that is simply missing a public export. The two upstream
names cannot be cleared by re-exporting them — that is AP-14, and it stays prohibited.

**The connection to AF-1 is the useful part.** The only reason `baseContract` carries an explicit
`ContractBuilder<…>` annotation rather than the base's `ReturnType<typeof oc.errors<…>>` (one
finding, `oc`) is to pin position 4 for T-2. AF-1 establishes that the annotation **does not
actually deliver that pin**. Once an independent unannotated probe pins it, the annotation form stops
being load-bearing for T-2 and becomes a free representation choice — at which point a NetScript-owned
`typeof`-derived alias is available and is measurably cheaper.

I am describing the seam, not prescribing the edit. Land AF-1 first, then measure. If delta ≤ 0 is
unreachable without re-exporting upstream, weakening T-2, or dropping a public alias, **return a
scoped blocker** — that outcome is pre-authorized and is a better result than a manufactured green.

Explicitly not authorized: un-exporting `BaseContractErrors` to buy back findings, touching
`QueryClient`, `StreamsInstrumentation`, `CrudRoute` or `AnySchema` (pre-existing baseline, other
packages), changing generic position 3, or touching the #1350 error channel.

## AF-3 (environmental) — the `test` red is load, not code

`test-final.json` attempt 2: **4,246 passed / 2 failed / 19 ignored**. Both failures are in
`.llm/tools/agentic/`, which this leaf's diff does not touch at all:

- `codex-follow_test.ts` — `Deno.watchFs` → `Too many open files (os error 24)`;
- `hybrid-launcher_test.ts` — `worker descendant 301646 survived cancellation`.

Both are fd/process-contention shapes, and the run was concurrent with three other Codex threads on
this host (`007-aspire-s5`, `007-leaf-1736`, `007-leaf-1673`) plus the launcher. The slice's own
`TS2344` is fixed — `check` is PASS and the focused SDK doctest is 3/3.

**Required:** rerun the `test` gate at the exact content head under quiet load. If both stay red with
nothing else running, they are pre-existing repo-tooling failures unrelated to this leaf and are a
scoped blocker to report — not something this leaf fixes, skips, or de-catalogs.

## Sufficiency

`INSUFFICIENT`, and correctly so: eight named files, eight distinct `gateId`s, no missing, duplicate,
contradictory, nonterminal or head-mismatched receipt; `test` and `public-doc-lint` are FAIL. The
author computed this itself and did not round it up. `public-doc-lint` was not weakened, renamed,
narrowed, or omitted — the gate that was contracted is the gate that was reported.

## For the coordinator, not this lane

PR #1731 still carries `status:plan` while the phase is IMPL. Relabelling is withheld from this lane.

## Disposition

Back to the **same author thread** `01a0515c` via `agentic:codex-resume` — same worktree, no rival
sender, no fresh author. AF-1 first, then AF-2 measured against it, then AF-3. Recut all eight
receipts at the new content head. **No IMPL-EVAL** until the exact-head doc/JSR/export gates and root
`test` are green or a genuine scoped blocker is returned.
