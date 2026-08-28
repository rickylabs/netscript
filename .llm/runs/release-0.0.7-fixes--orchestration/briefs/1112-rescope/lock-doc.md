# One documentation-only follow-up — record the reverted `deno.lock` transient

Your amended plan head `26c163fdf` is clean and correctly scoped: five harness artifacts, zero product
paths, and `deno.lock` never entered a commit. Verified independently. Nothing about the plan needs to
change.

**One gap.** Mid-turn, `deno.lock` was modified in the worktree — exactly one added line:

```diff
+    "npm:mysql2@3.22.5": "3.22.5_@types+node@25.9.3",
```

an exact-pin resolution entry beside the existing `"npm:mysql2@^3.22.5"` range, from probing the
`mysql2` import. You restored it before committing, which is the right outcome — but the episode is not
recorded anywhere in `drift.md` or `worklog.md`.

**Required, documentation only:** add a short honest entry to `drift.md` (and `worklog.md` if you keep
receipts there) recording the transient, the exact line, that it arose from probing, and that it was
reverted with `deno.lock` byte-identical to base before any commit. A reverted side effect that goes
unrecorded is how the next run repeats it.

**If you did not cause it, say that instead.** Do not invent a cause to fill the entry — an honest
"observed, origin not established" is better than a plausible fiction. Note also that your gate 15
("no lock churn and no eighth product path") already anticipates this class; say whether that gate was
what caught it.

Nothing else changes: research and plan only, seven-path envelope, no product mutation, no scope
widening, no new gate. Commit, push by explicit refspec, report your exact head, and stop.
