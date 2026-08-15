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
