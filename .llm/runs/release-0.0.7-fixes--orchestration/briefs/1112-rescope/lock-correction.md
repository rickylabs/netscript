# Boundary correction — restore `deno.lock` before you commit anything

A live boundary check found an **out-of-envelope side effect** in your worktree: `deno.lock` is
modified. It is unstaged and `HEAD` is still `8c4bef940`, so nothing is committed yet — restore it
before your next commit.

## What happened, precisely

`git diff -- deno.lock` shows exactly **one** added line:

```diff
+    "npm:mysql2@3.22.5": "3.22.5_@types+node@25.9.3",
```

An **exact-pin** resolution entry added beside the existing `"npm:mysql2@^3.22.5"` range entry. Almost
certainly a resolution artifact from probing the example or the adapter's `mysql2` import — benign in
content, but `deno.lock` is **not** one of the seven authorized paths, and this repository treats lock
hygiene strictly.

## Required

1. **Restore it byte-for-byte to base** before committing:

   ```bash
   git checkout 8c4bef9403595db4ecb6f01e85bde0b6c55bafea -- deno.lock
   ```

   Base blob at that commit: `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`. After restoring,
   `git status --porcelain` must not list `deno.lock` at all.

2. **Do not commit or push the lockfile.** Not in this commit, not in a follow-up.

3. **Document it honestly** in `drift.md` (and `worklog.md` if you record receipts there) as a
   transient probe side effect that was reverted, naming the exact line and how it arose. Do not
   quietly drop it — a reverted side effect that goes unrecorded is how the next run repeats it. If you
   genuinely did not cause it, say that instead; do not invent a cause.

4. **Prove the final diff is harness artifacts only** before you stop:

   ```bash
   git diff --name-only cf648f1ff973d74c213bb125a6f5f5b9328e693b HEAD
   ```

   Every path must be under `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/`. Zero `packages/`,
   zero `docs/`, zero `deno.lock`. Report that command's output verbatim when you stop.

## Do not widen scope

This is a restore, not a task. Do not regenerate the lockfile, do not run `deno cache --reload`, do not
`deno add`/`deno install`, and do not "fix" the duplicate-looking `mysql2` entries — the range entry was
already there at base and is not yours to touch. Everything else in the seven-path rescope amendment
stands unchanged, and this turn remains research and plan only.

If you need an exact-pin resolution to compile-check the example during **implementation**, that is a
question for the plan to raise as a dependency decision — not something to leave in the tree now.
