# Brief — #1112 agent-docs corpus regeneration (CI `quality` red) at `bbaf70d64`

Canonical author, thread `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, head
`bbaf70d6411fb794895af50b010a66cd475aeb7e`.

Your A2 fix is verified and correct: comment-only, two JSDoc lines, no executable change. The
supervisor re-ran everything it could touch at that head — check `12/0`, lint `12/0`, fmt `12/0`,
tests `51 passed / 0 failed`, `doc:lint` exit 0, seven paths, `deno.lock` identical to base.

CI is red on **`quality` → "Agent docs corpus freshness"**, reproduced locally:

```
{"fresh":false,"stalePaths":["prose.json.gz","provenance.json"], …}
error: Agent docs prose is stale: prose.json.gz, provenance.json
  at .llm/tools/docs/build-agent-docs-bundle.ts:358
```

## Cause

The leaf edits `docs/site/reference/prisma-adapter-mysql/index.md`. That page is **inside the
agent-docs prose corpus** — the checked-in `provenance.json` lists
`pages/reference/prisma-adapter-mysql/index.md` among its files. Editing an in-corpus page without
regenerating the bundle leaves `.llm/assets/agent-docs/` describing the old text, and
`check:agent-docs-prose` fails closed.

This is a **gate-set gap, not a defect in your change**. The plan selected gates 3 (docs source
format) and 4 (docs accuracy) but never `check:agent-docs-prose`, so the plan, the supervisor
Tier-A, and IMPL-EVAL cycle 1 all missed it. The same generated-cascade class as a CLI asset edit
requiring its embedded barrel regenerated: the generated artifact, not the source edit, is what
ships.

## The fix

Regenerate the bundle and commit the two regenerated files:

```
deno task gen:agent-docs-prose
```

Then confirm `deno task check:agent-docs-prose` exits 0.

`.llm/assets/agent-docs/prose.json.gz` and `.llm/assets/agent-docs/provenance.json` are tracked
generated harness assets, **not** product paths — they live outside `packages/`, `plugins/`, and
`docs/`. Supervisor ruling: regenerating them is the mandatory consequence of an in-envelope doc
edit and does **not** consume the eighth product path or need a coordinator rescope. The seven-path
ceiling is unchanged and still binding.

## Also record

Add a dated `drift.md` entry: the gate set omitted `check:agent-docs-prose` even though the leaf
edits an in-corpus documentation page; the omission was caught only by CI after IMPL-EVAL passed.
State that any future leaf touching a page listed in `provenance.json` must carry this gate. Note it
in `worklog.md` gate results too.

## Boundaries

- **Do not touch the seven product paths.** They are evaluator-accepted and verified; nothing about
  them changes here.
- Regenerate only — do not hand-edit `prose.json.gz` or `provenance.json`.
- No `deno.lock` change. No merge, label, readiness, or PR state change.
- Do not re-run the gate-5 generation protocol or the expensive suites; this cannot affect them.
- No self-certification.

## Finish

Commit, **explicitly push** with a full refspec, and report the exact head SHA plus the
`check:agent-docs-prose` exit code. Then stop — the supervisor re-runs the close/readiness gate and
merges under the standing coordinator mandate.
