# Second post-eval CI finding + scope amendment — PR #1665

| Field | Value |
| --- | --- |
| Raised | 2026-08-15, after the first generated-asset repair and its delta PASS |
| PR head at detection | `72d57229f28e3010c43d76fbecd3b3082680804f` |
| CI run / job | `31893659579` / quality `95033583015` — **terminal FAILURE**, 52 s |
| Failing gate | `check:assets-barrel` (Generated asset freshness step) |
| Classification | **branch-caused**, second transitive generated dependency |
| Authority | coordinator amendment; recorded **before** any generated-output mutation |

## Two corrections to this orchestrator's previous report

1. **I reported `quality` as "pending". It is a terminal FAILURE.** My reading came from a
   `gh pr checks` snapshot taken while the job was still running, and I published it without
   re-confirming. `check-test` remains genuinely pending; `quality` is red.
2. **I claimed "product preservation" at `72d57229f` on the strength of
   `git diff 9a26c107a..72d57229f -- packages/ …` being empty.** That measurement was accurate but the
   inference was wrong. An empty product diff was not evidence of correctness here — it was the
   defect signal. `packages/cli/src/kernel/assets/agent-docs.generated.ts` **should** have changed and
   did not. Readiness must not be claimed at `72d57229f`.

## The finding

`check:assets-barrel` is `deno task gen:assets-barrel && git diff --exit-code` over seven generated
files, one of which is `packages/cli/src/kernel/assets/agent-docs.generated.ts`.

Reproduced by this orchestrator in a **detached worktree** at `72d57229f` (never in the leaf, because
`gen:assets-barrel` mutates the tree):

```text
EXIT=1
git status --porcelain →  M packages/cli/src/kernel/assets/agent-docs.generated.ts
```

The diff shows the CLI barrel still embedding the **old** corpus and regeneration advancing it:

| Field | Embedded (stale) | Regenerated |
| --- | --- | --- |
| `uncompressedBytes` | 4753233 | 4753909 |
| `compressedBytes` | 1363117 | 1363396 |
| `sha256` | `a7c72177…` | `6df99eb8…` |

**Exactly one tracked path changes.** The other six barrel entries are untouched, which bounds the
amendment precisely and proves this is not a broad barrel drift.

## The dependency chain — now three links, not two

```text
docs/site/web-layer/query-bridge.md          (S3 authorized source edit)
  → .llm/assets/agent-docs/{prose.json.gz,provenance.json}   (repair 7549d9fc0, check:agent-docs-prose)
    → packages/cli/src/kernel/assets/agent-docs.generated.ts (this repair,   check:assets-barrel)
```

The first repair fixed link 2 and `check:agent-docs-prose` is genuinely green. It did not — and could
not — close link 3, because nothing in that slice's scope or gate set reached the CLI barrel.

## Accountability — the same rule, applied one link short

The first finding recorded the generalized rule: *when a slice edits a file a `gen:*` task consumes,
the matching `check:*` freshness gate belongs in that slice's proving set.* I applied that rule to the
edited file and stopped. I did not apply it **transitively** — to the output of the regeneration,
which is itself an input to a second generator.

This is now the third instance of one class in this topic: E-1 on #1657 (`embedded.generated.ts` is
what ships), the agent-docs prose bundle, and now the CLI agent-docs barrel. My own recorded lesson
from E-1 was literally "CLI asset edits need barrel regen — `embedded.generated.ts` is what ships",
and this is the barrel gate firing again.

**Rule, corrected and strengthened:** generated-artifact freshness is a **transitive closure**, not a
single hop. When a slice edits any file consumed by a `gen:*` task, the proving set must include every
`check:*` gate downstream of that file **and downstream of that gate's outputs**, walked until it
closes. In this repository the practical form is: touching `docs/site/**` implies
`check:agent-docs-prose` **and** `check:assets-barrel`. That pair should have been in the S3 gate set
and in the first repair's gate set; it was in neither, and neither Tier-A nor either evaluator was
positioned to catch it because none was given the closure.

## Scope amendment — exact, bounded

| Path | Why | Kind |
| --- | --- | --- |
| `packages/cli/src/kernel/assets/agent-docs.generated.ts` | CLI embedded barrel; stale against the regenerated agent-docs corpus | generated output |
| `.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/**` | slice report and worklog | run artifacts |

Nothing else. Explicitly **not** authorized: the other six `check:assets-barrel` entries, any
`docs/site/**` page, any `packages/**` or `plugins/**` hand-written source, `.llm/assets/agent-docs/**`
(already correct), and the two pre-existing baseline reds (`surface:diff` stale
`baselines/public-surfaces.json`; JSR `F-DOCT-5`). Regeneration must come from canonical
`deno task gen:assets-barrel`, not a hand-edited asset. Hard stop and report if any other tracked path
changes.

## Verdict preservation

Both prior PASS verdicts stand **for their actual scopes** and neither closes this dependency:

- product IMPL-EVAL PASS at `9a26c107a` — evaluated the five issue contracts; its gate set did not
  include `check:assets-barrel`;
- delta IMPL-EVAL PASS at `7549d9fc0` — evaluated source→`.llm/assets` fidelity, which it proved at
  content level (181-entry manifest unchanged; only `query-bridge/index.md` and `llms-full.txt`
  differ). It was scoped to link 2 and was correct about link 2.

Sequence: repair → fresh Tier-A → one further proportionate delta evaluator focused on **asset-chain
fidelity** (the full closure, not a single hop) → readiness. No merge, no relabel, no runtime gate.
