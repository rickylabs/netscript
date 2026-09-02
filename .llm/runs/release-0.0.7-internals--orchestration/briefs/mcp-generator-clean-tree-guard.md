use harness

## SKILL

Load `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`, and `rtk`.

# Implementation brief — #1867 F-3 · generator clean-tree guard

**Role:** implementation author (leaf). **Supervisor:** `topic-internals-0.0.7`.
**Issue:** #1867 (`type:chore`, `area:tooling`, `priority:p2`, milestone **0.0.8**).
**Worktree:** `/home/agent/projects/netscript/worktrees/007-leaf-1867`
**Branch:** `fix/mcp-corpus-generator-clean-tree-guard` — created, base **`3066a0cc5`**
(`origin/main`, the #1929 merge). Do not rebase without telling me.

**Scope is F-3 only.** F-2 (wiring `check:mcp-export-corpus` into CI) was delivered by #1920/#1929
and is on `main`; the boundary is recorded on #1867. Do not re-wire the gate.

---

## The defect, and why a freshness gate does not cover it

`deno task gen:mcp-export-corpus` silently bakes whatever the working tree contains. A modified file
under `packages/**` or `plugins/**` perturbs `deno doc` output, and the generator overwrites the
committed artifact with a **plausible-looking but wrong** corpus.

This is not hypothetical. Inside #1859 an author regenerated while a repo-wide `deno task test` was
running in the same worktree and produced blob `bc3f6a2c2…` — neither the correct output
(`19cdf3783…`) nor the stale committed one. It was pushed, and was caught only because a supervisor
compared it against an independently reproduced reference. Nothing in the tooling objected.

**A freshness gate cannot catch this.** `check:mcp-export-corpus` proves the committed blob equals
what the generator produces *now*; a wrong-but-fresh corpus passes it. #1929 raised the value of this
guard rather than reducing it.

## Two interactions you must decide deliberately — these are the whole design

**1. `--check` shares the same script.** `check:mcp-export-corpus` is
`generate-export-surface-corpus.ts --check`, and #1929 now runs it as a **required CI gate**. If your
guard fires in `--check` mode you risk turning a required gate red for a reason unrelated to corpus
freshness — a flaky required gate gets disabled and takes the real signal with it, which is worse
than the drift it replaces.

My reading: guard the **write** path only, since `--check` does not mutate the artifact and cannot
bake a wrong blob. If you disagree, argue it — but do not silently apply the guard to both.

**2. The legitimate dirty-tree workflow is real and common.** The normal shape of a surface change
is *edit `packages/**`, regenerate the corpus, commit together*. #1922 did exactly that (added
`locale-contribution.ts` and regenerated in one change). A hard refusal forces *edit → commit →
regenerate → commit again*, which is a real workflow cost and will be worked around if it is
annoying enough — and a guard people route around protects nothing.

So a bare refusal is probably not sufficient on its own. Consider an explicit, named override
(`--allow-dirty` or similar) that must be passed deliberately and is **recorded in the generated
artifact's provenance or stderr**, so a wrong blob produced under override is attributable
afterwards. Decide, justify in the plan, and state the tradeoff plainly. If your analysis says the
issue's preferred hard refusal is right without an override, say why the #1922 workflow is still
served.

The issue's own words are the bar: *"a wrong generated artifact that looks plausible is worse than a
failed command, because it survives review."*

## Scope

- `.llm/tools/docs/generate-export-surface-corpus.ts` — the guard.
- `.llm/tools/docs/generate-export-surface-corpus_test.ts` — both directions.
- `.llm/runs/<slice>/{worklog,evidence,drift}.md`.
- Only if your design requires it, and stated as a decision: `deno.json` task wiring. **A manifest
  change is not expected — flag it to me before making one**, because it moves the root lock and
  restales the private Fresh UI lock (#1905's surface).

**Hard stops:** no change to `ci.yml` or any workflow; no regeneration of the corpus itself; no
dependency or lockfile change; nothing under `packages/` or `plugins/`.

## Required properties

- The dirtiness probe must be **scoped to the generator's actual read set** —
  `git status --porcelain -- packages plugins` — not the whole tree. An unrelated dirty file in
  `.llm/runs/` or a scratch note must not block generation; this lane writes run artifacts constantly
  and a guard that trips on them will be disabled within a day.
- Refusal must be a **real non-zero exit with a message naming the offending paths**, not a warning
  swallowed by a task pipeline. Remember `cmd | tail` destroys exit codes.
- The guard must not fire when git is unavailable or the directory is not a repo — degrade to a
  loud warning rather than blocking a legitimate consumer outside a checkout. State which you chose.

## Tests — both directions, RED first

1. Clean tree ⇒ generator runs and writes the artifact.
2. Dirty `packages/**` or `plugins/**` ⇒ generator **refuses**, real non-zero exit, artifact
   **unmodified** on disk (assert the file's bytes are unchanged — a guard that refuses *after*
   writing is not a guard).
3. Dirty path outside the read set ⇒ generator still runs.
4. If you add an override, cover that it works and that its use is recorded.

Capture RED by checking the RED commit out in a **throwaway worktree** — not the live tree, where an
uncommitted edit silently rescues it. This release has produced two false REDs that way. Always
`out=$(cmd); rc=$?`.

## Validation

```
deno test --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts
deno task check:mcp-export-corpus
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools --ext ts
```

`check:mcp-export-corpus` must still pass — it is a required CI gate on `main` since #1929, and
proving you did not break it is part of this slice. Do **not** run `deno task e2e:cli`.

## Deliverables

Commits on the branch; run artifacts; a **draft** PR to `main` with `Closes #1867`, labels
`type:chore`, `area:tooling`, `area:mcp`, `priority:p2`, `orchestrator:internals`, `status:impl`,
milestone **0.0.8**. **Commit your work — do not end a turn with a dirty tree.** Report head SHA,
every gate's real exit code, your decision on both design questions above with reasoning, and which
acceptance boxes you can honestly tick.
