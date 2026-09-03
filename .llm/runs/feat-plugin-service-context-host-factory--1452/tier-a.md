# Tier-A — #1452 Slice 1 (`createLazyKv`, partial)

**Content head:** `7feedee77` · **Base:** `fb08d2f9d` · **PR:** #1820 (draft)
**Verdict:** ACCEPTED as Slice 1

## Provenance — a second interrupted author, work recovered

The Slice 1 Codex thread was **interrupted before committing**, leaving 11 uncommitted files
(`codex-status` showed one `dead / interrupted` and one `idle / turn complete` entry for the same
worktree). Same shape as #1387 Slice 2 earlier in this run. The work was substantively complete and
correct; I committed the author's bytes and **completed the one step it had not run** — the
`gen:assets-barrel` regeneration, without which `embedded.generated.ts` would have carried the old
123-line template while the source template carried the new 43-line one.

The author also **augmented** (did not overwrite) my `plan.md` with harness-profile, open-decision,
and risk-register sections — legitimate harness practice, verified by reading the diff.

## Ceiling

Exactly the planned surface: new `packages/kv/application/lazy-kv.ts`, its `mod.ts` exports,
`packages/kv/mod.ts`, new `packages/kv/tests/lazy-kv_test.ts`, the scaffold template, and the two
regenerated carriers (`embedded.generated.ts`, export corpus). **No `packages/plugin/` file was
touched** — the Slice 2 boundary held. `deno.lock` byte-identical.

## Substance

`createLazyKv(config?: SharedKvConfig): WatchableKv` is a faithful extraction: `supportsWatch`,
memoized `#kv` resolution, async-generator delegation for `list`/`watch`/`watchPrefix`, and
`[Symbol.asyncDispose]` → `close()` all preserved. It additionally threads an optional
`SharedKvConfig` the template's hardcoded class could not accept — a strict superset of prior
behaviour. Template: **123 → 43 lines**.

## The test proves laziness by observation, not happy path

`createLazyKv resolves once and forwards the WatchableKv contract` asserts **zero** resolutions after
construction, exactly **one** after two operations (memoization), every `WatchableKv` member
forwarding with `assertStrictEquals` identity checks on arguments — including all three async
generators — and `[Symbol.asyncDispose]` incrementing the close count a second time. An eager
implementation fails this at the first assertion.

## Gates — all run directly through the wrappers, bypassing the D-1 cache trap

| Gate | Result |
| --- | --- |
| `check` (kv + cli, cache-bypassed) | PASS, 919 files, 0 diagnostics |
| `lint` (kv, cache-bypassed) | PASS, 31 files, 0 findings |
| `fmt:check` (kv, cache-bypassed) | PASS, 31 files, 0 findings |
| `test` (`packages/kv/tests`) | PASS — **80 passed / 3 ignored / 0 failed** |
| `check:assets-barrel` | PASS (exit 0, verified post-commit) |
| `docs:exports-drift` | PASS |
| `check:mcp-export-corpus` | PASS — **7623 → 7624**, exactly one new symbol |
| `deno.lock` | byte-identical |

**A real catch during this review:** `check:mcp-export-corpus` initially **failed** (exit 1, "corpus
is stale") because the author's interrupted run never regenerated it after adding a new public
export. Regenerated and confirmed the delta is exactly the one expected symbol. Had I trusted the
author's own gate list, this would have shipped a stale corpus.

**Method note:** an early `check:assets-barrel` reading of "exit=0" was wrong — that was `tail`'s exit
code through a pipe, not the task's. Re-run without the pipe it was exit 1 (expected pre-commit, as
`gen && git diff --exit-code` must fail while regenerated carriers are uncommitted), then exit 0 after
committing. Worth recording: the same pipe-masking mistake this lane warns implementers about.

## Findings

None blocking. Slice 2 remains correctly deferred and flagged.

## Verdict

**ACCEPTED as Slice 1.** Faithful extraction, genuinely strong laziness proof, correct and honest
partial scoping, and the two incomplete carrier regenerations were caught and finished rather than
inherited.
