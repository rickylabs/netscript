use harness

# PR-D — #1549: the provable half of the quality-scan rail

You are the **implementation agent** for the **last** slice of the 0.0.6 internals lane. The plan passed
PLAN-EVAL (`PASS`, cycle 5). Everything here is deliberately scoped to what can be *proven* at this baseline —
the unprovable half (export-reachability, live issue-state verification) was moved to 0.0.7 with #1378 after it
was measured, so do not reach for it.

Your orchestrator is a Claude Opus 5 high session in `/home/codex/repos/netscript-006-internals`. It holds
merge authority and owns the draft → ready flip.

## SKILL

- `netscript-harness` — run artifacts, slice discipline, commit trail.
- `netscript-tools` — scoped wrappers; verdict vs non-verdict.
- `netscript-pr` — branch/PR/label mechanics, closing keywords, the fenced `acceptance-evidence` block.
- `netscript-deno-toolchain` — deterministic `deno test`, task semantics.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-scanrail` |
| Branch | `fix/1549-quality-scan-provable-half` |
| Base | **`eb373db29`** = `origin/main` at dispatch. Verified there: `arch:check` 0, `arch:check:repo` **0**, `quality:scan:repo` ok / `allowCount` **10**. All three green, so any red is yours. |
| Slice dir | `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-d-1549/` |
| Closes | #1549 |
| Route | Codex · gpt-5.6-sol · **medium** |

## The extractor already exists — consume it, do not write a second one

This is rail decision **R-10** and the reason this lane coordinated with the docs lane. #1537 landed
(`d558f9ab2`), so the primary path is available and the fallback is not needed.

**Consume `.llm/tools/docs/snippet-extractor.ts`:**

```ts
export function extractFencedBlocks(source: string, sourcePath: string): FencedBlock[]

export interface FencedBlock {
  sourcePath: string;  fenceOrdinal: number;  openingLine: number;  codeStartLine: number;
  closingLine: number; delimiter: '`' | '~';  delimiterLength: number;
  infoString: string;  language: string;      checkedLanguage?: CheckedLanguage;
  compilationExtension?: 'ts' | 'tsx';        exemptionReason?: string;  body: string;
}
```

That gives you everything needed: `compilationExtension` identifies the TypeScript fences,
`sourcePath` + `fenceOrdinal` + `codeStartLine` give **stable per-snippet provenance** so a finding attributes
back to the documented line, and `exemptionReason` already carries the docs lane's exemption convention —
**respect it** rather than re-deciding what is exempt.

**A second fence parser is a slice failure.** Two parsers with different fence rules would disagree about what
counts as a snippet, and each gate would pass on the corpus it happened to parse — invisibly. Add a test
asserting no second fence-parsing implementation exists under `.llm/tools/quality/**`.

## Baseline, measured at dispatch

```text
deno task quality:scan:repo → exit 0, findings 0, allowCount 10
deno task quality:scan      → exit 0, allowCount 7
deno task arch:check        → exit 0   (36 discovered roots, since PR-B)
deno task arch:check:repo   → exit 0   (since PR-C)
```

`allowCount 10` includes **two allowances PR-B added deliberately** at
`.llm/tools/fitness/check-doctrine.ts` — `explicit-any` firing on the **English word** "any" in comments
(`any export abstract class`, `any class chain`). PR-B routed the durable fix here. See C4.

## Contract

### C1 — docs fences are scanned (boxes 1, 2)

Fenced TypeScript under `docs/site/**` is scanned by the existing rule set, via `extractFencedBlocks`. Prove
**red-first**: an `as any` inside a `docs/site/**` fence must fail `quality:scan` before the change passes
after it. `*_test.ts` companions under `docs/site/**` are **docs fixtures, not exempt tests**.

### C2 — the soundness/type-fixture exemptions are asserted by rule (box 3)

The six `*-soundness_test.ts` files stay green with their `@ts-expect-error` lines **unchanged**, and a test
asserts that exemption rather than relying on filename luck. (The `tests/type-fixtures/**/*_type.ts` exemption
landed in #1530; assert it still holds rather than re-implementing it.)

### C3 — `--max-allow` is wired at the measured count (box 4)

Wire it into **both** `quality:scan` and `quality:scan:repo` at the count you measure **in this PR** — not at
a number copied from this brief. Add a budget-overflow fixture that fails.

**In 0.0.6 there is no issue-id requirement.** The linked-open-milestoned-issue rule moved to 0.0.7 with
#1378, because the scanner runs `--allow-read` only and cannot observe live issue state. Do **not** implement
an id-presence check and call it registration — that would satisfy a test while violating the contract, which
is the unearned-green pattern this lane exists to remove.

### C4 — comment-awareness, which lets the budget fall (box 4, and PR-B's routed finding)

`explicit-any` currently matches the English word "any" in a comment. `scan-code-quality.ts:47` already skips
lines beginning with a quote or backtick for the same class of reason — *fixture and template source is data,
not syntax*. Extend that narrowly to **comment** lines for the `explicit-any` rule.

Then **delete PR-B's two now-redundant `// quality-allow:` lines** in `.llm/tools/fitness/check-doctrine.ts`
and show `allowCount` falling **10 → 8**. Keep the guard narrow and prove it does not leak: a real
`any` in code on the *same line as a trailing comment* must still be found.

### C5 — the same-PR budget-link predicate (box 5)

A budget increase must carry an issue link in the same PR. That is a property of a **diff**, which a file
scanner cannot observe, so it is proved by **one added step in the existing `code-quality` pull-request job**
(rail `R-12`, owner-approved). Compare the `--max-allow` delta against issue links in the same diff and fail
when the budget rose without one. Provide a **missing-link RED** control and a **linked GREEN** control.

Do not change the workflow's triggers or any skip semantics.

### C6 — the triggers reference and its executable twin are typed (box 6)

`docs/site/reference/triggers/index.md:310` (`const observedEvents: any[] = []`) and
`docs/site/reference/triggers/examples_test.ts:65` become properly typed and both compile. This is the
consumer-visible half of the issue: an agent copying the triggers reference should not inherit `any[]`.

### C7 — the gate pair (box 7)

`deno task quality:scan:repo` and `deno task arch:check` both green after the change.

## Acceptance mapping

#1549 has **7** boxes. Read them live. Use a fenced `acceptance-evidence` block with **`box-index: 1..7`** —
**not** exact box text; wrapped boxes are unmatchable by exact text and this cost PR #1560 a failed IMPL-EVAL
cycle.

## Gates — paste real output with exit codes

| # | Gate | Command |
| --- | --- | --- |
| 1 | quality + docs tool tests | `deno test --allow-read --allow-env --allow-write --allow-run .llm/tools/quality/ .llm/tools/docs/` |
| 2 | repo scan | `deno task quality:scan:repo` — exit 0, and report `allowCount` **before and after** (expect 10 → 8) |
| 3 | default scan | `deno task quality:scan` — exit 0 |
| 4 | doctrine gates | `deno task arch:check` and `deno task arch:check:repo` — both **exit 0** (they are green at your base; keep them so) |
| 5 | docs snippet gate | the #1537 gate still passes — you are adding a consumer, not changing its behaviour |
| 6 | scoped check/lint/fmt | wrappers with `--root .llm/tools/quality --root .llm/tools/docs --ext ts` (**owned roots only** — do not sweep all of `.llm/tools`, it holds pre-existing residue you do not own) |
| 7 | **asset-barrel freshness** | `deno task gen:assets-barrel`, then `git status --porcelain` **empty** |
| 8 | triggers docs compile | the reference and its twin type-check |

Run **all** gates before reporting done, so the head is final when the orchestrator flips to ready — that flip
triggers IMPL-EVAL and any commit after it invalidates the verdict.

## PR mechanics

1. First commit is the slice-dir bootstrap; open the **draft PR** in that same session; comment per slice.
2. `## Scope` carries `Closes #1549` on its own line. Reference `#1378` and `#1545` **without** closing
   keywords — both are 0.0.7 and stay open.
3. Labels: `type:chore`, `area:tooling`, `area:docs`, `priority:p1`, `status:impl`, milestone `0.0.6`. Exactly
   one `status:`.
4. **Leave the PR draft.** The orchestrator owns the flip and re-syncs against main immediately before it.
5. **State gate claims as evidence, not buckets.** For any scaffold tier, give the **wall time** and whether
   step 2 was "Skipped by policy" — a `scaffold.runtime` that returns in seconds did nothing whatever the
   rollup says. Do **not** cite `quality:gate` as coverage of your own diff without saying what it covers.
6. Resolve commit hashes in a separate step; paste literal values.

## Boundaries

- Touch only `.llm/tools/quality/**`, `.github/workflows/code-quality.yml` (the C5 step), the two named
  `docs/site/reference/triggers/` files, the two `// quality-allow:` lines named in C4, and your slice dir.
- Do **not** implement export-reachability or allowance issue-state verification. Both moved to 0.0.7 with
  #1378 after being measured unimplementable here (567 `deno doc` warnings over 1,714 published symbol
  records; `--allow-read`-only scanner).
- Do **not** modify `.llm/tools/docs/**` — you are a **consumer** of the extractor. If its surface is
  insufficient, say so and stop; do not fork it.
- Do **not** re-implement the `tests/type-fixtures` exemption (#1530) or `discoverDoctrineRoots()` (#1403).
- Do **not** fix findings the widened scan surfaces — triage them into your slice dir with file, line, rule and
  assessment, and say how many.
- Do **not** add `deno-lint-ignore`, `@ts-ignore`, `as any`, `as unknown as`, or a new `quality-allow:`.
- Do **not** merge, flip to ready, or apply `status:ready-merge` / `status:impl-eval` / `impl-eval:skip`.

## Escalate instead of going idle

If a gate is red and you cannot green it, or a contract here is wrong, write it in your slice `drift.md`, post
it as a PR comment, and continue with what is not blocked. On this lane escalation has **five** times found the
orchestrator's brief or plan wrong rather than the code — three missing gate commands, one incoherent
sequencing decision that would have shipped a red gate, and one false provenance claim I defended before
checking. Raising it is the expected behaviour, not a failure.
