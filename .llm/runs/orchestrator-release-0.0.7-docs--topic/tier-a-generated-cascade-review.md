# Tier-A closure review — generated-asset cascade, PR #1652

| Field                     | Value                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Reviewer                  | `topic-docs-0.0.7` (native Claude Opus 5 / high) — opposite family to the Codex author |
| Final head                | `a465836b4cc1c40262a473de07b5744e70b20ead`                                             |
| Window reviewed           | `d4a0a8340` → `d24c3fa03` → `a465836b4`                                                |
| Author (separate session) | WSL Codex `019ffcc9-16c2-7573-b7f6-d627172408e8`                                       |
| Content verdict           | IMPL-EVAL cycle 2 `PASS` at `c7ce58a19` — unchanged; no cycle 3 launched               |
| Verdict                   | **PASS** on the generated cascade                                                      |
| Readiness                 | **withheld** — exact-head Actions not yet terminal                                     |

## The cascade, and why it arrived in layers

One stale input propagated through three generators. Each fix was correct and each exposed the next
consumer:

| # | Head         | Failing CI step                             | Generator                               | Emitted target                                           |
| - | ------------ | ------------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| 1 | `c8e3f26d85` | Agent docs corpus freshness                 | `build-agent-docs-bundle.ts`            | `.llm/assets/agent-docs/{prose.json.gz,provenance.json}` |
| 2 | `d4a0a8340`  | Generated asset freshness (`assets-barrel`) | `generate-cli-assets-barrel.ts:382,389` | `packages/cli/src/kernel/assets/agent-docs.generated.ts` |
| 3 | `d24c3fa03`  | Publish asset freshness (`publish-assets`)  | `generate-publish-assets.ts:34-43`      | `packages/mcp/src/publish-assets.generated.ts`           |

Layers 2 and 3 are the two causal CI failures inside the `d4a0` → final window, and both are now
closed. The chain is genuinely causal: each generator's declared input list contains the previous
layer's output, which is verifiable by reading those exact lines.

**The reviewable failure here was process, not code.** Layers 2 and 3 were each discovered by a CI
run rather than predicted, and a repo memory already recorded the layer-1→2 coupling. The closure
was only made systematic at layer 3, when this lane enumerated and executed every freshness check in
the repository before dispatching instead of fixing the reported symptom.

## Independent re-execution of the full freshness closure

All four run by the reviewer at the final head, after confirming the author's turn was idle so no
concurrent process could contaminate a receipt or a build directory:

| Gate                                | Raw exit |
| ----------------------------------- | -------- |
| `deno task check:agent-docs-prose`  | `0`      |
| `deno task check:assets-barrel`     | `0`      |
| `deno task check:publish-assets`    | `0`      |
| `deno task check:mcp-export-corpus` | `0`      |

Working tree clean after all four. `mcp-export-corpus` was never implicated — it was checked to
prove that, not because it was suspected. `publish-assets.generated.ts` is consumed by runtime code
rather than by another generator, so no fifth layer exists by construction.

## Determinism

Both generated targets were re-generated at their committed heads and produced **no diff**:

- `deno task gen:assets-barrel` at `d24c3fa03` — exit `0`, tree clean.
- `deno task gen:publish-assets` at `a465836b4` — exit `0`, tree clean.

A generator that is a no-op against the committed state proves the committed bytes are exactly its
deterministic output, not a hand-edited approximation.

## Structured receipt validation

`.llm/tmp/gate-receipts/quality/publish-assets.json`:

- `exitCode` `0`
- `gitHead` `a465836b4cc1c40262a473de07b5744e70b20ead` — the **full committed head**
- `argv` `deno,task,check:publish-assets`
- `startedAt` `2026-08-15T07:09:56.955Z`

The `gitHead` is the committed head rather than a pre-commit state, so this is a genuine post-commit
receipt. That matters because `check`-style gates end in a working-tree diff and pass trivially on a
staged file that still differs from `HEAD` — the weak-receipt pattern Tier-A rejected at layer 2 and
which was corrected there and honoured here.

## Scope and preservation

Layer-3 diff is `packages/mcp/src/publish-assets.generated.ts` (8 lines) plus append-only journals.
No other generated target moved.

Against the cycle-2 evaluated source `c7ce58a19`, `git diff` over `docs/site`, `.llm/tools`,
`deno.lock`, and `docs/site/deno.lock` is **empty**. The complete change set since that source is
nine files: two agent-docs assets, five run artifacts, and two generated package assets — exactly
the authorized surface across all four amendments. No canonical #1551 comment, pin, label,
milestone, or issue state changed.

## Readiness — deliberately withheld

Actions at `a465836b4`: `Code quality` success, `Deploy docs site to Pages` success, `e2e-cli`,
`public-surface-diff`, and the OpenHands runner skipped — and **`ci` run `31871283408` is
`in_progress`**. Not terminal, therefore not green.

This lane previously called CI green from an `agentic:pr-checks` snapshot taken one second after a
failing job completed, and that conclusion was wrong. The correction is recorded append-only in
`drift.md`. Readiness will be reconciled only from the terminal state of the exact-head Actions runs
— specifically `quality` and `check-test` — and through a **new authoritative PR comment** rather
than by editing the stale one.

No Definition-of-Done box ticked, no ready flip, merge, publish, relabel, or next docs leaf. This
topic remains independent of the internals, fixes, and features lanes.
