use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — run mechanics, slice/commit-trail rules
- `netscript-doctrine` — public-surface + archetype law for `packages/`/`plugins/`
- `jsr-audit` — doc-lint bar, slow-types, publish-surface traps
- `netscript-deno-toolchain` — `deno doc --lint`, `publish --dry-run`, deps wrappers
- `netscript-tools` — scoped check/lint/fmt wrappers, gate-evidence rules, lock hygiene
- `netscript-pr` — branch/PR/label/milestone process
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are a WSL Codex implementation slice for **issue #303 — [S2] Enterprise maturation:
public-surface doc-lint sweep + publish dry-run cleanliness** (beta.5 chores wave, run
`beta5-impl--supervisor`).

Worktree: `/home/codex/repos/netscript-303-doclint` · branch `chore/303-enterprise-surface-sweep`
(cut from origin/main `1c175990`, NO upstream — keep it that way).

Most of #303 (172a-2-SOUND type-soundness: base contract + workers/sagas/triggers/auth conversion)
is already merged on main. Your slice is the REMAINDER:

1. **Full-repo public-surface doc-lint sweep.** For every publishable `@netscript/*` package
   (packages/ + plugins/ with a JSR export map), run `deno doc --lint` across the **full export
   map** (every subpath in each `deno.json` `exports` — NOT just `mod.ts`; sibling re-exports
   false-flag otherwise). Fix all findings: missing JSDoc on exported symbols, missing return
   types, private-type leaks. Follow existing JSDoc style in each package.
2. **`deno task publish:dry-run` clean with no UNSANCTIONED slow-types allowances.** The single
   sanctioned exception is the one introduced in commit `86eca907` — read that commit first; do not
   remove it, do not add new ones. If a slow-type finding requires an API redesign to fix, STOP on
   that item and record it in `notes.md` for the supervisor instead of changing public API shape.
3. **Type-soundness residue check (verify-only + trivial fixes).** Grep for the two accepted casts
   (contract `as unknown as`, top-router `any`) and confirm no OTHER casts/`any` leaks exist in
   plugin service seams (fresh-ui/Aspire touchpoints included). Fix trivial residue; anything
   needing a design fork goes to `notes.md`, NOT into this PR.

**Out of scope:** DB layer (ROUTE-TO-PRISMA), AI stack re-architecture (#238 owns), stale-file
deletion (#307 owns, running in parallel — do not delete files, only fix docs/types in place),
doctrine prose (#305 owns).

## Validation (run before the PR is marked ready)

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx`
- `deno task publish:dry-run` (must be clean; capture the tail in the PR comment)
- Full-export-map `deno doc --lint` evidence per package (script it; paste the summary)
- `deno task check` + `deno task test` (workspace `check` needs `--unstable-kv`)

Do NOT run `deno task e2e:cli` — the supervisor triggers the runtime smoke at merge-readiness.

## Process

- Commit in reviewable slices (per package-cluster), message names what the slice proves.
- Push ONLY via explicit refspec: `git push origin HEAD:refs/heads/chore/303-enterprise-surface-sweep`.
- Never force-push, never `git add -A`, zero `deno.lock` churn (if the lock changes, revert it and
  note why in notes.md).
- Open a **draft PR** early (gh works natively in this clone): base `main`,
  title `chore(surface): #303 full-export doc-lint sweep + publish dry-run cleanliness`.
  Body: scope, evidence, **`Refs #303`** (NOT a closing keyword — remaining acceptance is the
  `e2e-cli-prod` re-proof at the beta.5 cut). Labels: `type:chore`, `area:packages`,
  `priority:high`, `epic:road-to-stable`, `status:impl`; milestone `0.0.1-beta.5`.
- Comment on the PR after each pushed slice: scope, commit hash, gate evidence.
- Keep a `notes.md` at the repo root of your worktree (untracked is fine) recording stops/deferrals;
  summarize it in your final PR comment.
- End state: draft PR open, all validation green, final PR comment `SLICE-COMPLETE` with a summary.
