use harness

# PR-G — #1612: `main` is red on the published-JSDoc codename guard

You are the implementation agent for a **one-line documentation fix that is currently breaking
`deno task test` on `main`**. The defect is fully characterised and the sweep is already done; your job is the
reword plus the evidence, not investigation.

Your orchestrator is a Claude Opus 5 high session in `/home/codex/repos/netscript-006-internals`. It holds merge
authority.

## SKILL

- `netscript-harness` — run artifacts, slice discipline, commit trail.
- `netscript-tools` — scoped validation wrappers; what is a verdict and what is not.
- `netscript-pr` — branch/PR/label mechanics, closing keywords, the fenced `acceptance-evidence` block.
- `netscript-deno-toolchain` — deterministic `deno test`, task semantics.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-jsdoc` (fresh, created for this leaf) |
| Branch | `fix/1612-published-jsdoc-codename` |
| Base | `6aee2b414` = `origin/main` at dispatch |
| Slice dir | `.llm/runs/release-0.0.6-internals--orchestration/slices/pr-g-1612/` |
| Closes | #1612 |
| Route | Codex · gpt-5.6-sol · **low** |
| PLAN-EVAL | **N/A** — single-line prose fix against a deterministic guard. Recorded by the orchestrator. |

## The defect — reproduced, do not re-investigate

`packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts:6`:

```text
 * runtime. A second fresh-ui instance therefore cannot own the cache-provider singleton in #1589.
```

The guard (`.llm/tools/fitness/check-public-jsdoc-codenames_test.ts`, shipped by #1554) fails on current `main`:

```text
Error: Published JSDoc contains internal codenames:
packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts:6 #1589
FAILED | 3 passed | 1 failed
```

This is the guard **working**, not a false positive: a bare `#1589` renders on JSR and a consumer cannot resolve
it. #1554 defines the class as internal workstream names, wave/epic codenames, **and issue numbers** in published
JSDoc.

## The sweep is already complete — box 3 is measured, not yours to discover

I ran the guard's own class over **every** `.ts`/`.tsx` under `packages` and `plugins`, ignoring closure
membership (so it covers files the guard does not yet reach because they are outside a published entrypoint
closure, where an occurrence would be latent):

```text
repo-wide JSDoc findings (guard class, closure-membership ignored): 1
  packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts:6  #1589
```

**Exactly one occurrence exists repo-wide, and it is this one.** Re-run the sweep yourself to confirm and to
produce your own evidence for box 3 — do not take my number on trust — but do not go looking for a second site.

## Contract

### C1 — the reword states the mechanism, and introduces no new claim

The current comment **already states the complete reason** in the sentence before the defect:

> `@netscript/fresh-ui` is intentionally excluded: its SDK imports are limited to desktop and auto-update, whose
> implementations do not import cache or query modules, and it imports no Fresh runtime.

So the trailing `in #1589` is a dangling pointer on an already-complete explanation. Replace it with
consumer-facing wording that says **why** a second `fresh-ui` instance cannot own the cache-provider singleton —
the mechanism being that it never imports the cache or query modules, so it cannot instantiate a second
cache-provider at all.

**Do not introduce a factual claim that is not already supported by the surrounding comment or the code in this
file.** If you believe the accurate mechanism differs from the above, say so and stop rather than writing prose
you cannot substantiate — published JSDoc that is merely guard-clean but wrong is a worse outcome than the
current red.

Keep it short. This is a doc comment, not an essay.

### C2 — do not defeat the guard instead of satisfying it

A backticked `` `#1589` `` **would** pass, because inline code spans are stripped before scanning. **Do not use
that escape here.** It keeps an unresolvable internal pointer in published output and satisfies the letter of the
guard while missing its purpose. The issue itself offers it only as an option for maintainer value; the
orchestrator's decision is the mechanism reword, with no issue reference in the published comment at all.

Equally: do not add the file to any exclusion list, do not weaken `INTERNAL_CODENAME`, and do not touch the guard
or its fixtures.

### C3 — the guard passes and nothing else regresses

`deno test --allow-all .llm/tools/fitness/check-public-jsdoc-codenames_test.ts` → **4 passed / 0 failed**.

## Acceptance mapping

#1612 has **3** boxes. Read them live. Use a fenced `acceptance-evidence` block with **`box-index: 1..3`** — not
exact box text. Box text wrapping is unmatchable by exact text and has already cost this lane a failed IMPL-EVAL
cycle on PR #1560.

Box 2 says the guard passes "on `main`" — before merge you can only prove it on this branch at the merge base.
State it that way honestly: green on this branch over base `6aee2b414`. The orchestrator re-verifies on merged
`main` after the squash and records that.

## Gates — paste real output with exit codes

| # | Gate | Command |
| --- | --- | --- |
| 1 | the codename guard | `deno test --allow-all .llm/tools/fitness/check-public-jsdoc-codenames_test.ts` — **4 passed** |
| 2 | repo-wide sweep | your own re-run of the guard class over `packages` + `plugins`; report the count and paste it |
| 3 | the file still type-checks | `deno check --unstable-kv packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts` |
| 4 | scoped fmt/lint | wrappers over the one file's root — a doc comment reflow must not leave `fmt` dirty |
| 5 | package tests unaffected | the CLI kernel tests that cover this module, if any; if none exist say so plainly rather than implying coverage |

`deno task test` repo-wide is **not** your gate — it is a large suite and CI runs it. Do not claim it.

## PR mechanics

1. First commit is the slice-dir bootstrap; open the **draft PR** in that same session; comment per slice.
2. `## Scope` carries `Closes #1612` on its own line. Reference **#1554** without a closing keyword — it shipped
   the guard, is closed, and is not defective.
3. Labels: `type:fix`, `area:cli`, `area:docs`, `priority:p1`, `status:impl`, milestone `0.0.6`. Exactly one
   `status:`.
4. **Leave the PR draft.** The orchestrator owns the ready flip and the evaluation decision.
5. Resolve commit hashes in a separate step and paste literal values.
6. State gate claims as evidence with exit codes, never as buckets.

## Boundaries

- Touch **only** `packages/cli/src/kernel/domain/dependency-closures/netscript-web-runtime-closure.ts` and your
  slice dir.
- Do **not** touch `.llm/tools/fitness/check-public-jsdoc-codenames_test.ts`, its fixtures, or any exclusion list.
- Do **not** fix unrelated prose, reflow untouched comments, or tidy the export lists in this file.
- Do **not** add `deno-lint-ignore`, `@ts-ignore`, `as any`, `as unknown as`, or `quality-allow:`.
- Do **not** merge, flip to ready, or apply `status:ready-merge` / `status:impl-eval` / `impl-eval:skip`.

## Escalate instead of going idle

If a contract here is wrong — in particular if the mechanism in C1 is not what the code actually does — write it
in your slice `drift.md`, post it as a PR comment, and stop. On this lane escalation has found the
orchestrator's brief or plan wrong **seven** times rather than the code, three of them gate commands I wrote
without running. Raising it is the expected behaviour.
