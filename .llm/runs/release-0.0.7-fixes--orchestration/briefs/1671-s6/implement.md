use harness

# Wave 1 fixes leaf — `sdk-typed-error-channel` — **slice S6** (derived artifact only)

Same lane, same worktree, same thread. You are the generator; you do not self-review or self-certify.

## Situation — read this, it changed since S5

Your S5 stop was **correct** and has been actioned. `check:mcp-export-corpus` was already red on
`main@9634735bc0` with no leaf involved, so the topic split that repair into its own PR **#1691**, which
**merged** as `61bfd858d20f3bf61e7ee45b5646537af567f247`. Your branch is now **rebased onto it**.

Two consequences:

- **PR #1671 is closed and replaced by #1692.** #1671 was closed unmerged as a side effect of merging
  #1691 (its body contained the literal token `close #1671` inside a sentence disclaiming it — the
  topic's error, not yours), and could not be reopened after the rebase. Same branch, same thread, same
  work. **Post your S6 comment on #1692, not #1671.**
- **The corpus is stale again, and now it is legitimately yours.** With #1691's unrelated drift gone,
  the only remaining delta is your own five approved signature changes.

## Identity

- Worktree: `/home/codex/repos/netscript-007-leaf-typed-error`
- Branch: `fix/sdk-typed-error-channel`, no upstream. Push by explicit refspec only:
  `git push origin HEAD:refs/heads/fix/sdk-typed-error-channel`
- Expected HEAD before you start: `9cdba6321ea3f2d5af20f269b6bd81393dbd84d3`
- PR: **#1692** (draft). Issue: #1350.

## Frozen contract — exactly one product path

1. `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`
   plus existing run artifacts under `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/`.

**Do not touch the four S5 source/test paths.** They are landed and Tier-A-passed. Do not touch
`packages/contracts/src/public/mod.ts`, any `docs/` page, `#1348`, or `#1466`. A second product path is a
rescope: stop and report.

## Task

Run `deno task gen:mcp-export-corpus`. Commit the single regenerated file. Do **not** hand-edit it.

## Acceptance — already proven by Tier-A; reproduce, do not re-derive

The topic has already executed this proof at your exact head. Confirm you reproduce it:

| Criterion | Expected |
| --- | --- |
| Determinism | two clean runs byte-identical, sha256 `f7bbc8925481e8682f84f9057263387030838e6bc7ee366c56e98a9b2829f904` |
| Paths mutated | exactly **1** |
| Added exports | **0** |
| Removed exports | **0** |
| Changed signatures | exactly **5**, all `@netscript/sdk`: `SafeFailure`, `SafeResult`, `ServiceClientMethod`, `isDefinedError`, `safe` |
| `schemaVersion` / `frameworkVersion` / `surfaces` | unchanged |

The corpus is gzip/base64 — a file diff proves nothing. If you verify the delta yourself, decode the
blob and compare on symbol identity. If your numbers differ from the table above, **stop and report**;
do not adjust to match.

Then: `deno task check:mcp-export-corpus` must go **PASS exit 0**.

## Known pre-existing red — report, do not chase

The `packages/mcp` **fmt/lint batch exits 1 with 0 findings**, on the pristine tree as well as after this
change. It is a tooling failure over a ~300 KB single-line generated file, not a formatting difference,
and it is **not yours**. Report it as pre-existing; do not attempt to fix it and do not let it block.

## Finish

Commit, push by explicit refspec, post the S6 phase comment **on #1692** with structured receipts, update
`worklog.md` / `context-pack.md` / `drift.md`, and **stop**. Report your exact head sha. No label,
checkbox, readiness, or merge action. No runtime lease. Tier-A and IMPL-EVAL are someone else's.
