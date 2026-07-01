# Drift — PR2 package README revamp

## D1 (significant, 2026-06-24): in-package `/docs` folders DO exist — D5 premise was wrong

**Plan/eval premise:** `plan.md` D5 and `plan-eval.md` Q4 both state "no in-package `/docs`
folders exist on disk" (research.md basis). The decision recorded was "strip dead `./docs/*.md`
links + drop `docs/**/*.md` publish globs, **no folder deletion**."

**Reality (ground-truthed during C1 finalize):** 26 in-package `/docs` folders exist on disk
(every package/plugin that carried the `docs/**/*.md` publish glob, plus `sdk`), totalling
162 markdown files. They are thin pre-overhaul stubs (171b–5.5KB each: architecture.md,
concepts.md, getting-started.md, recipes/…) superseded by the published docs site, which the new
READMEs cross-reference instead.

**Consequence for what shipped (C1):**
- The 24 `docs/**/*.md` publish-glob removals still correct and sufficient for the *publish
  surface* goal — with the glob gone, these stub docs no longer ship to JSR even though the
  folders remain on disk. The user's "remove /docs from each package" intent is satisfied at the
  JSR-surface level.
- The authoring agents' `./docs/*.md` link stripping was still the right outcome (READMEs should
  point to the published site, not in-package stubs) — but the rationale was "superseded," not
  "dangling" as the plan assumed.

**Open decision (needs user — surfaced, not silently deferred):** whether to also DELETE the 26
physical `/docs` folders from the tree. Blanket deletion is NOT uniformly safe:
- `packages/cli/docs/{commands.md,maintainer-cli.md,standards.md,commands/init.md}` and
  `packages/fresh-ui/docs/{l0-conventions.md,theme-authoring.md}` are referenced by ACTIVE skills
  (`.agents/skills/netscript-cli`, `.agents/skills/fresh-ui-horizontal` and their `.claude` mirrors).
  Deleting these breaks skill references.
- Remaining ~20 folders appear orphaned (only run-trace artifacts reference them) and could be
  removed cleanly.

**RESOLVED (2026-06-24, commit f92cee1b):** user chose "Delete ALL + repoint skills". Executed
losslessly:
- Deleted all 26 `/docs` folders (162 files) from `packages/*` + `plugins/*`.
- The 4 skill-load-bearing contracts were RELOCATED into their owning skill dirs (not lost):
  `fresh-ui-horizontal/{l0-conventions.md,theme-authoring.md}`,
  `netscript-cli/{commands.md,maintainer-cli.md}`; both `SKILL.md` files repointed to the
  skill-local copies; `.claude/skills` mirror regenerated (`sync-claude OK`,
  `validate-claude-surface ok:true`, lock unchanged).
- One scaffold-template comment (`composition-view.tsx.template`) repointed off the deleted path.
- `arch-debt.md` AS7 doc-warning note updated to mark the `docs/architecture.md` portion moot.
- Verified zero remaining load-bearing refs to `(packages|plugins)/*/docs/` (only the intentional
  arch-debt historical note remains; `.llm/tmp/run` traces are frozen artifacts).

Tree state is now final → C2 IMPL-EVAL can cover it.
