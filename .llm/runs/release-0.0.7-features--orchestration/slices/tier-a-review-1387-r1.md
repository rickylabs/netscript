# Tier-A review — #1387 plan repair + Slice 1

| Field | Value |
| --- | --- |
| Reviewer | features topic supervisor, native Claude Opus 5 · high |
| Author | Codex `gpt-5.6-sol` · high, thread `01a0535d-3d1a-7830-b91c-4eb0ebb872b1` |
| **Content head** | **`2ddd60481217f0931ea8f96228d213f10be12a9f`** |
| Evidence head | `c0d61e64`, local == `origin` == PR #1762 head, clean |
| Base | `origin/main` `24f6642f` |
| Review worktree | `ns1387-tiera`, detached — never the author's (D-19) |

## The constraint that mattered — held exactly

`NetScriptProcedureMeta.access` gains an optional readonly `authorization?` with `scopes?: readonly
string[]` and `roles?: readonly string[]`, **nested inside the existing `access` object**:

- **Additive.** No existing field changed; every prior consumer still type-checks.
- **No parallel `{ public }` policy**, and **no second metadata vocabulary**.
- Nothing outside `packages/contracts` and `packages/sdk` **tests** — `git diff --name-only … --
  packages/service packages/plugin` is **0 files**, so Slice 1 added **no enforcement**, exactly as the
  plan requires of a type-contract-only slice.

This was the leaf's central risk: #1387 exists because policy lives in a second place that can drift
from the contract, so a parallel vocabulary would have reproduced its own defect one layer up. It did
not happen.

## Ceiling — exactly the six files, no more

`procedure-meta.ts` · `procedure-meta_test.ts` · `procedure-meta-independence_test.ts` ·
`contracts/type-fixtures/procedure-meta_type.ts` · `sdk/procedure-meta-independence_test.ts` ·
`sdk/type-fixtures/procedure-meta_type.ts`. That is the plan's Slice 1 ceiling verbatim — no seventh
file, no drift entry owed.

## The guards bite — verified by breaking them

Fixtures that type-check are worthless unless a violation fails them, so I perturbed the contract:

| Perturbation | Result |
| --- | --- |
| `readonly scopes?: readonly string[]` → `string[]` (drops the readonly guarantee) | **type check FAILS** at `procedure-meta_type.ts:70` |
| Remove the `authorization` block entirely | **type check FAILS**, 2 errors |
| Unmodified | check exit 0; `packages/contracts` + `packages/sdk` **94 passed / 0 failed** |

Reverted after each; tree clean.

## The five PLAN-EVAL required fixes — all landed

| Fix | Evidence |
| --- | --- |
| **F-1** stale baselines | row 4 now reads `contracts 16, service 90, plugin 68, SDK 77, MCP 136 (387 total)` — matches my own S0 census exactly |
| **F-2** generated carriers | 10 references to `mcp-export-corpus` / `docs-tagline` / `publish-assets` / `agent-docs-prose` / `assets-barrel` across the contract and ceilings |
| **F-3** Slice 3 ceiling | `service-rpc.ts` present |
| **F-4** LD-11 addition | owner-amendment-before-close-gate note recorded |
| **F-5** LD-8 pin | `createContractAuthorizer()` named 4× |

**`research.md` was appended, not rewritten** — the diff contains **zero** deletions, which is what the
evaluator required and the kind of instruction that is easy to satisfy loosely.

## Receipts — seven, at the content head

All `gitHead == actualGitHead == 2ddd6048`, distinct commands, plausible durations:
`check` 2,074 ms · `lint` 648 · `fmt-check` 499 · `test-contracts-sdk` 4,665 · `quality-gate` 7,468 ·
`publish-dry-run` 27,863 · `docs-accuracy` 4,460 — **all PASS**.

`evidence-set.json`: **`SUFFICIENT`, zero reasons** — the first slice in this lane to reach that,
because unlike #1466 and #1730 it contracts no baseline-red gate. `deno.lock` byte-unchanged.

The author's own worklog states it verified receipts by "exact `argv`, positive `durationMs`, and each
receipt's own work output; exit code alone was not treated as evidence" — the rule this lane paid for
on two sibling leaves, applied without being reminded.

## Verdict

**`ACCEPTED`** at content head `2ddd6048`, evidence head `c0d61e64`.

The plan repair is faithful to the evaluator's five fixes, and Slice 1 does exactly what a
type-contract-only slice should: extends the one vocabulary additively, proves the extension with
fixtures that fail when the contract is broken, and adds no enforcement.

## Outstanding — not Tier-A's to close

The evaluator's bounded re-evaluation of the repaired plan sections (row 4 + carrier rows, Slices
2/3/4/7/9 ceilings, LD-8/LD-11 text, appended census) — explicitly permitted as a short same-family
follow-up on the diff, since the design text did not change. Then Slices 2–9, each with its own Tier-A
stop, and a final separate-session IMPL-EVAL before any close-gate. PR #1762 stays **draft**,
`Refs #1387` partial, `closingIssuesReferences` empty.
