use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — run mechanics, slice/commit-trail rules
- `netscript-doctrine` — package/plugin surface law (before deleting any export)
- `netscript-tools` — scoped wrappers, gate-evidence rules, lock hygiene
- `netscript-pr` — branch/PR/label/milestone process
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are a WSL Codex implementation slice for **issue #307 — [S6] Stale-code elimination, Waves 2
and 4 ONLY** (beta.5 chores wave, run `beta5-impl--supervisor`). Wave 1 is DONE (PR #324). Wave 3
is BLOCKED on #305. Wave 5 is owner-decision — do not touch anything listed under it.

Worktree: `/home/codex/repos/netscript-307-stale24` · branch `chore/307-stale-wave2-wave4`
(cut from origin/main `1c175990`, NO upstream — keep it that way).

### Wave 2 — LIKELY-dead candidates (~18; VERIFY EACH before deleting)

Candidates (from the issue body; re-verify against YOUR checkout — some may already be gone):
CLI `extension-points.ts` barrel + `compile.test.ts` doublet; sdk `collections/*`,
`openapi/helpers.ts`, `discovery/service-discovery.ts`, `query/composite-query.ts`,
`query-client/kv-cache-persister.ts`; plugins `workers/bin/{combined,scheduler,worker}.ts`,
`workers|sagas/services/src/routers/health.ts`; `plugin-streams-core/src/domain/errors.ts`;
orphan public barrels (`plugin`, `plugin-workers-core`, `telemetry` `src/public/mod.ts`);
`fresh-ui data-grid.tsx` `DataGrid`.

**Delete-safety rule (hard):** every candidate gets an explicit verification before deletion:
- 0 importers repo-wide (grep bare specifier + relative paths + export-map subpaths).
- Check each package's `deno.json` `exports` map — a file wired as a published subpath is NOT dead.
- For any component/asset: **class-name-coupling check** — `data-grid.css` was a false positive
  once (couples to shipped `DataGrid` #225 via `ns-data-grid*` BEM classes, invisible to
  import-grep). ⚠️ **`fresh-ui data-grid.tsx` `DataGrid` is a SHIPPED export (#225) — the issue
  lists it, but Wave-1 evidence says KEEP. Verify; if it is exported/used, record KEEP with
  rationale instead of deleting.**
- Scaffold templates: grep `packages/cli/src/**/templates` for references before deleting anything
  a scaffold might emit or copy.
Record every verdict (DELETE/KEEP + evidence) in a committed manifest
`.llm/runs/beta5-impl--supervisor/slices/307-stale24/wave2-manifest.md` in your worktree.

### Wave 4 — `.llm/tmp` tracked-scratch purge

The audit counted 2799 tracked files under `.llm/tmp/` that should be git-excluded scratch.
First re-count on your checkout (`git ls-files .llm/tmp | wc -l`) — S3 may have partially purged.
If still tracked: single `git rm -r --cached`-style purge commit that removes them from tracking
AND from the tree where they are pure scratch, keep/extend the `.gitignore` exclusion so they never
return, and keep the `.llm/tmp/` directory usable (agents write scratch there). Do NOT touch
`.llm/tmp/docs/` extracts if any are referenced by run artifacts — verify with a grep first.
This is ONE dedicated commit, separate from Wave 2.

## Validation

- Per affected package after Wave 2: scoped `run-deno-check.ts`/`run-deno-lint.ts` + that
  package's tests (`deno task test` filtered or per-package task).
- Full `deno task check` + `deno task test` at the end.
- After Wave 4: `deno task check` still green; `git status` clean; repo tooling that reads
  `.llm/tmp` still functions (spot-check one `.llm/tools` script that writes there).

## Process

- Commits: one per coherent Wave-2 cluster + one for Wave 4. Push ONLY via
  `git push origin HEAD:refs/heads/chore/307-stale-wave2-wave4`.
- Never force-push, never `git add -A` (stage explicit paths; Wave 4's bulk removal may use
  `git rm -r` on the specific `.llm/tmp` paths), zero `deno.lock` churn.
- Open a **draft PR** early: base `main`, title
  `chore(stale): #307 Wave 2 verified deletes + Wave 4 .llm/tmp purge`.
  Body: **`Refs #307`** (NOT closing — Waves 3 and 5 remain). Include the DELETE/KEEP manifest
  summary table. Labels: `type:chore`, `area:packages`, `priority:high`, `epic:road-to-stable`,
  `status:impl`; milestone `0.0.1-beta.5`.
- Comment per pushed slice with commit hash + evidence. End with a `SLICE-COMPLETE` comment.
