# Generated-asset closure proof + fourth-link amendment — PR #1665

| Field | Value |
| --- | --- |
| Raised | 2026-08-15, after the CLI-barrel finding |
| Probe heads | `72d57229f` (branch) and `baf1cdf67` (merge base), both in **detached worktrees** — never the leaf, because `gen:*` tasks mutate the tree |
| Authority | coordinator amendment; recorded **before** mutation |

## The chain — now proven to be exactly four links

```text
docs/site/web-layer/query-bridge.md                        S3 authorized source edit
  → .llm/assets/agent-docs/{prose.json.gz,provenance.json} check:agent-docs-prose   FIXED 7549d9fc0
    → packages/cli/src/kernel/assets/agent-docs.generated.ts  check:assets-barrel    in flight
      → packages/mcp/src/publish-assets.generated.ts          check:publish-assets   THIS amendment
```

The generator edge for link 4 is **explicit in source**, not inferred:
`.llm/tools/generate-publish-assets.ts:34-37` declares its inputs as

```text
.llm/assets/agent-docs/prose.json.gz
.llm/assets/agent-docs/provenance.json
packages/cli/src/kernel/assets/agent-docs.generated.ts
```

**This dictates ordering.** `gen:publish-assets` *consumes* the CLI barrel, so link 4 must be
regenerated **after** link 3 has landed. Regenerating it earlier would embed the stale barrel content.
That is why the closure must converge on one content head and why the serial order within this
orchestrator is not merely bookkeeping.

## Link 4 verified independently

At `72d57229f`, in a detached worktree:

```text
deno task check:publish-assets → EXIT 1
  Error: publish assets are stale: packages/mcp/src/publish-assets.generated.ts.
         Run deno task gen:publish-assets.
```

Exactly one path named. At **base `baf1cdf67`** the same gate **passes (EXIT 0)** — so link 4 is
genuinely branch-caused, not pre-existing. The author found this and correctly refused to edit it
under the `215aae4b2` grant, which is the boundary behaviour the briefs asked for.

## Fifth-mirror question — answered, and the answer is no

Enumerated **every** `gen:*`/`check:*` pair in root `deno.json` and executed the untested ones rather
than reasoning about them:

| Gate | At `72d57229f` | At base `baf1cdf67` | Verdict |
| --- | --- | --- | --- |
| `check:agent-docs-prose` | pass (after repair) | — | link 2, fixed |
| `check:assets-barrel` | fail, one path | — | link 3, in flight |
| `check:publish-assets` | **fail**, one path | **pass** | **link 4, branch-caused** |
| `check:mcp-export-corpus` | fail | **fail** | **pre-existing, NOT ours** |
| `check:emitted-samples` | **pass** | — | not in the chain |

`check:mcp-export-corpus` was the strongest fifth-link candidate and is **stale at the merge base
too**, so it is a pre-existing red of the same family as `surface:diff` and JSR `F-DOCT-5` — not this
leaf's to repair, and not to be reported as green. Corroborating the classification:
`generate-export-surface-corpus.ts` references neither `docs/site`, nor `agent-docs`, nor
`.llm/assets`.

The remaining `check:*` tasks (`aspire-host-ports`, `netscript-jsr-specifiers`, `scaffold-versions`,
`streams-types`) are validators with no generated checked-in mirror, so they cannot carry this class
of staleness.

**Closure claim: the branch-caused generated-asset set is exactly links 2–4, and there is no fifth.**
This is asserted on executed gates at two heads, not on a reading of the dependency graph.

## Scope amendment — exact, bounded

| Path | Why | Kind |
| --- | --- | --- |
| `packages/mcp/src/publish-assets.generated.ts` | embedded publish provenance still points at `504de3f67`; consumes links 2 and 3 | generated output |
| `.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/**` | slice report and worklog | run artifacts |

Nothing else. Regeneration from canonical `deno task gen:publish-assets` only. Hard stop if any other
tracked path moves. Must run **after** the CLI-barrel repair is committed, per the input list above.

## Verdict preservation

The product IMPL-EVAL PASS (`9a26c107a`, five issue contracts) and the delta IMPL-EVAL PASS
(`7549d9fc0`, source→`.llm/assets` fidelity, proven at content level) both stand **for their actual
scopes**. Neither is invalidated by a newly discovered downstream mirror; neither closes it either.
No fresh Tier-A and no further evaluator until links 2–4 sit on **one content head**.

---

## Historical precedent — PR #1652, and what it means

The coordinator's central state already recorded this cascade. Verified from **two independent
sources** rather than accepted on citation:

1. **Central state.** `netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/
   milestone-cluster-state.json:512-517` records `derivedAssetCascadePaths` as exactly:

   ```json
   [".llm/assets/agent-docs/prose.json.gz",
    ".llm/assets/agent-docs/provenance.json",
    "packages/cli/src/kernel/assets/agent-docs.generated.ts",
    "packages/mcp/src/publish-assets.generated.ts"]
   ```

   with `readinessState: "complete"` and `mergeCommitSha: e090f894ff3682405a36e4f896ffd2cc16f9a1f8`.

2. **The shipped diff itself.** `gh pr view 1652 --json files` shows PR #1652
   ("docs(positioning): seed the Next.js comparison programme", MERGED 2026-08-15T07:21:13Z, head
   `a465836b4` — matching the stated repair head) changed 25 files, of which the generated ones are
   **exactly those four paths and no others**.

**The precedent and this run's independently-derived closure agree exactly**, which matters because
the two derivations share no method. #1652 established the cascade empirically by repairing it; this
run derived it by executing every `gen:*`/`check:*` pair at two heads and reading
`generate-publish-assets.ts:34-37`'s declared input list. Convergent evidence from independent
methods is the strongest form available here, and it upgrades the closure claim from "no fifth gate
fired" to "no fifth mirror exists, corroborated by a prior shipped repair of the same cascade".

### Process miss — the cascade was known and was not reused

This four-link cascade was **already persisted in central state before #1665 touched Query Bridge
docs**, and it was not consulted. Had it been, links 2–4 would have been in the S3 scope grant and
gate set from the start, and this leaf would have taken one repair instead of three discoveries.

The coordinator has recorded this as a coordinator/process miss. This orchestrator's share is
concrete and worth stating plainly: when the five-path widening authorized a `docs/site/**` edit, I
reviewed it for formatter and byte-comparison risk and did not ask whether the milestone state
already knew what a docs edit cascades into. The lookup was available and cheap. **Standing
correction for this topic: before authorizing any `docs/site/**` edit, read
`derivedAssetCascadePaths` from the milestone cluster state and fold the whole cascade into the slice
scope and proving set up front.**

### Fifth-link determination against the prior cascade — explicit

`check:mcp-export-corpus` / the MCP export-surface corpus is **NOT** a member of the #1652
`derivedAssetCascadePaths` set. Two independent facts agree on its classification:

- it is **stale at the merge base `baf1cdf67`** (executed, exit 1) as well as on the branch;
- it does not appear in the prior cascade, and `generate-export-surface-corpus.ts` reads neither
  `docs/site`, nor `agent-docs`, nor `.llm/assets`.

**Determination: pre-existing unrelated red — NOT a new branch-caused mirror.** It belongs to the
same family as `surface:diff` (stale `baselines/public-surfaces.json`) and JSR `F-DOCT-5`: red before
this leaf existed, outside its authorized surface, not to be repaired here, and never to be reported
as green.

**Closure, now doubly established: the branch-caused generated-asset set is exactly the four
`derivedAssetCascadePaths` — links 2–4 downstream of the Query Bridge source edit — and there is no
fifth.**
