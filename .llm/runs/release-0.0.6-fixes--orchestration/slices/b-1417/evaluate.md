use harness

# IMPL-EVAL — Slice B / PR #1538 / issue #1417

You are the **formal IMPL-EVAL evaluator** for this slice. You did not write this code and you must
not fix it. Your output is a verdict with evidence.

| Field | Value |
| --- | --- |
| Lane | `formal_impl_evaluation` — native opposite-family (Claude evaluating Codex-authored work) |
| Your route | Claude · Fable 5 · medium |
| Generator | Codex · GPT-5.6 Sol (separate session — you are not it) |
| Evaluator worktree | `/home/codex/repos/ns006-f-b-impleval` (detached at `1a05934e9`) — **work here, not in the generator's worktree** |
| Generator worktree | `/home/codex/repos/ns006-f-b-dryrun` — **do not touch it; a second writer there corrupts the slice** |
| PR | #1538 `fix(release): keep publish dry-runs from mutating the tree` |
| Issue | #1417 (p1 release blocker) |
| Verdict file | write your verdict into this file's directory as `verdict.md` |

## SKILL

- `netscript-harness` — evaluator protocol and evidence discipline.
- `netscript-release` — what the publish dry-run gate is actually for.
- `netscript-deno-toolchain` — **canonical on the `catalog:` law (npm-only) and `deno publish
  --dry-run` behaviour**. Read it; the whole defect lives here.
- `netscript-tools` — validation wrappers, git ground truth.
- `rtk` — `rtk git`, `rtk grep`, `rtk proxy deno task`.

## Why this slice gets a focused evaluation

#1417 guards **working-tree integrity**. The defect being fixed is a command that exits 0 while
silently rewriting 19 manifests, expanding `catalog:` into pinned `npm:` specifiers and thereby
opting packages out of central version control. The failure mode is that eighteen near-identical
manifest edits read as formatting noise in review, so a semantically meaningful change hides among
them. It was caught only by accident.

That means a *plausible-looking* fix that doesn't actually hold is the dangerous outcome here, and
you are the check on that.

## What the slice claims

- Took issue **option 1** (preferred): workspace and MCP member dry-runs execute in a **throwaway
  workspace**, so the source tree is never a command working directory.
- Argues this beats snapshot/restore because an interruption can at worst abandon temp data; it
  cannot leave live manifests expanded.
- Recorded **drift D-4**: mutation is *mixed* in origin — NetScript's `publish-workspace.ts`
  deliberately materializes `catalog:` entries before calling Deno, **and** the package-scoped
  `deno publish --dry-run` can rewrite MCP publish metadata. The prior `finally` restored only on
  normal completion.
- Changed 4 files: `publish-workspace.ts`, new `publish-workspace_test.ts`,
  `run-publish-dry-run.ts`, and `packages/mcp/deno.json` (routing the package task through the
  wrapper and dropping `--allow-dirty`).

## Your job — attack these, in order

1. **Does the tree actually stay clean?** Re-run it yourself in your own worktree. Assert clean
   before, run `deno task publish:dry-run`, assert `git status --porcelain` is **empty** after, and
   assert `packages/service/deno.json` still contains `"zod": "catalog:"`. Do not accept the
   slice's transcript — produce your own.
2. **Is the gate still a gate?** The issue is explicit: *do not "fix" this by removing the dry-run
   from the validation sequence; the defect is the mutation, not the check.* Verify a **real**
   `deno publish --dry-run` still executes and can still fail. Construct a deliberately
   publish-invalid state in your worktree and confirm the task **fails**. A dry-run that no longer
   detects publish problems is a regression dressed as a fix — this is the single most valuable
   thing you can check.
3. **Is the isolation sound?** Read the throwaway-workspace construction. Does the copy include
   everything the dry-run needs (workspace members, lockfile, catalog root)? Could it silently
   dry-run *less* than before — e.g. skip members — and therefore pass more easily? Does it clean
   up? What happens on interruption?
4. **`packages/mcp/deno.json`.** It now shells to `../../.llm/tools/release/run-publish-dry-run.ts`
   with `--root ../..` and drops `--allow-dirty`. Is the relative path robust? Does dropping
   `--allow-dirty` change behaviour for a legitimately dirty tree in a way that will surprise CI?
5. **The regression check (acceptance box 4).** The slice claims both isolation tests fail when the
   helper is bypassed. Reproduce that: bypass it yourself, watch the tests go **red**, restore,
   watch green. A regression check you never saw fail is not proven.
6. **`deno.lock` untouched** in all paths (box 5), including the MCP package path.
7. **Scope.** Diff against the **merge-base**, not `origin/main` — `origin/main` moves during this
   milestone and a two-dot range will falsely show other lanes' merged work as deletions.

## Gates you must execute yourself

```
rtk proxy deno task publish:dry-run   # then rtk git status --porcelain
rtk proxy deno task check
rtk proxy deno task test
rtk proxy deno task lint
rtk proxy deno task fmt:check
rtk proxy deno task quality:gate      # required: packages/mcp/deno.json changed
```

Verdicts come from **commands you ran**, never from the generator's claims. Quote real output.

## Hard constraints

- **No publication, ever.** Dry-run only. No `deno publish`, no tag push.
- Do not commit to the generator's branch. Do not push. Do not merge.
- Do not fix the code. If you find a defect, describe it precisely enough that the generator can
  fix it — that is the deliverable, not a patch.
- `deno fmt` rewraps prose and can silently undo a scripted edit; verify any edit you make in your
  own worktree for testing purposes.

## Verdict format

Write `verdict.md` with:

- **VERDICT: PASS** / **PASS WITH FINDINGS** / **FAIL** — one line, up front.
- Per acceptance box (all five from #1417): satisfied / not satisfied, with the command output that
  proves it.
- Findings, each labelled blocking or non-blocking, each with a concrete failure scenario.
- What you executed, verbatim.
- Explicitly state anything you could **not** verify, rather than passing it silently. An
  unverified claim stays a claim.

Be adversarial. A PASS from you authorizes a p1 release-blocker merge, so make it earned.
