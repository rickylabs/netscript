use harness

# Slice: saga send() and spawn() (#1013)

Worktree: `/home/codex/repos/ns004-sagasend` · branch `fix/1013-saga-send-spawn` · base `origin/main`
@ `ab0fa13fe`.

## SKILL

- `.agents/skills/netscript-harness` — run loop, slice contract, commit trail.
- `.agents/skills/netscript-doctrine` — `plugins/` archetype, public surface, fitness gates.
- `.agents/skills/netscript-pr` — `Closes #N` in the PR **body**; every `gh` call passes
  `--repo rickylabs/netscript`.
- `.agents/skills/netscript-tools` — scoped check/lint/fmt wrappers, `quality:scan`, `arch:check`.
- `.agents/skills/rtk` — prefix read-heavy `git`/`gh`/`grep` with `rtk`.

## Scope

**#1013 (p1)** — saga `send()` never reaches a worker job, and `spawn()` is unimplemented. The
storefront tutorial's **central path is false**: it documents a flow that cannot work.

Read the issue body in full.

## Start by reading what just landed — it changes your baseline

PR **#1075** merged the saga engine correctness work (#1064, #1065, #1066) and it moved ground you
are standing on. Its supervisor found that **two stated root causes were wrong**, which is a warning
about this issue's stated cause too:

- **#1065's** real defect was not the optional compensator — `publish()` **discarded the cascade
  ledger** and nothing on the publish path ever called `dispatchCascaded`. Effects returned by a
  handler were being dropped between handler and runtime.
- **#1066** had *two* wrong branches: `message.id` also forked a new instance per message, so no
  instance ever resumed.

`send()` failing to reach a worker job is plausibly the **same family** — an effect returned by a
handler that nothing on the dispatch path consumes. Establish the real path empirically before
changing anything; do not implement against the issue's stated cause without confirming it.

## Rules

- Contract first: define what `send()` and `spawn()` must do, then implement, then test.
- **The docs are part of the fix.** The issue is `type:fix` with `area:docs` for a reason: the
  storefront tutorial documents this path as working. Either make the documented path work, or change
  the documentation — leaving a tutorial that describes a false central path is not closing this.
- **No silent-drop paths.** #1064/#1065/#1066 were all silent failures, and the merged fix made
  unknown effect kinds and missing options throw named errors. Follow that precedent: if `spawn()`
  is genuinely not wired, it must fail loudly at definition-build time rather than be accepted and
  ignored.
- Prove every new test **red against pre-fix code** and state the observed failure in the PR comment.
  A test that passes both before and after is worthless — that standard was met by #1075 and #1076
  and it holds here.
- A new `// deno-lint-ignore` or `as unknown as` added to green a wrapper is a review-blocking
  finding, not a pass.

## close-gate is part of the work

`close-gate` reads the `- [ ]` acceptance boxes on #1013 and fails the PR until each is ticked.
Verify each criterion as you land it, tick it, and post the evidence. Tick nothing you cannot
evidence; an unmet criterion is a legitimate outcome — drop the closing keyword and state the
remaining scope.

## Shared-machine constraints

Live wave-four demo runs occupy `/home/codex/repos/wave4-*`, and other 0.0.4 slices are running.
Prove ownership by path containment before killing anything. **Do not run `scaffold.runtime`
concurrently with another slice** — earlier in this release three concurrent runs on a 15 GB box
produced two failures that were contention, not defects.

## Gates

`deno task check` · `deno task test` for `packages/plugin-sagas-core`, `plugins/sagas` and the
workers bridge · scoped lint/fmt wrappers · `deno task quality:scan` · `deno task arch:check`.
Verify the artefact, never the exit code.

## Deliverable

One draft PR closing #1013, driven to ready-for-merge. Commit per slice; push and comment commit hash
+ gate evidence before the next slice.
