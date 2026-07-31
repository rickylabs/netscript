use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-release, netscript-deno-toolchain, netscript-cli, netscript-tools, netscript-pr

## Assignment — adopt the `0.0.x` release scheme repo-wide

Owner decision (2026-07-31). NetScript stops encoding its release train in the semver **prerelease
field** and moves it into the **version core**:

| before | after |
| --- | --- |
| `0.0.1-beta.11` (shipped) | conceptually `0.0.1` |
| `0.0.1-beta.12` (cut, unpublished) | **`0.0.2`** |
| `0.0.1-beta.13` | `0.0.3` |
| canary for a release | `0.0.2-canary.1`, tied to `0.0.2` |

**From now on: `0.0.x` tracks each release, and `0.0.x-canary.N` is tied to its `0.0.x`.**

### Why — do not undo this by "fixing" it back

A canary must sort **below** the release it proves. That is impossible while the train lives in the
prerelease field: semver defines a prerelease relative to its *normal version*, never to another
prerelease, so there is no identifier space below `0.0.1-beta.12`. Every candidate sorts above it —
`0.0.1-beta.12-canary.1` parses as `[beta, "12-canary", 1]` and, because a numeric identifier always
loses to a non-numeric one, it outranks `0.0.1-beta.13`, `0.0.1-beta.20` and every later release
permanently. With the train in the core, the ordering is free and matches the ecosystem
(Next.js `16.3.0-canary.104` → `16.3.0`; React `19.3.0-canary-…` → `19.3.0`):

```
0.0.2-canary.1  <  0.0.2  <  0.0.3-canary.1  <  0.0.3
```

`0.0.2` is also the **first non-prerelease version NetScript will ever publish** — plain `0.0.1` was
never released; every version on JSR today is a `0.0.1-alpha.N` / `0.0.1-beta.N` / `0.0.1-canary.1`.

## The core instruction: TRIAGE every reference into one of three tiers

**A blind `0.0.1-beta.12` → `0.0.2` substitution is the wrong deliverable and will be rejected.**
So is deriving all 325 of them. Most of these references should not exist at all.

For **every** occurrence, decide which tier it is in — and expect the majority to land in tiers 1
and 2:

**Tier 1 — DELETE it.** The version adds no value here. A doc sentence that reads "as of
0.0.1-beta.11 this command supports X" when the command simply supports X. A comment pinning a
version that stopped being relevant. A stale compatibility note about a release nobody runs. This is
**dead reference elimination**, and it is the most valuable outcome of this task: every reference
removed is one that can never go stale, never mislead a reader, and never need bumping again.
Where a reference guards genuinely dead code, remove the code too and say so.

**Tier 2 — SAY THE STAGE, NOT THE NUMBER.** The text needs to convey "this is pre-1.0 / in beta",
not a precise version. Write "beta" (or rephrase so the stage is implied) instead of naming a
release. Nothing in prose should carry a version number just to signal instability.

**Tier 3 — KEEP IT, AND MAKE IT AUTO-BUMP.** A genuine need for the exact version: install
snippets, publishable specifiers, generated metadata, the CLI's own version output. These must be
**derived from a single source AND registered in the release-cut bump path**, so
`deno task release:cut` moves them automatically and they can never freeze again.

If a tier-3 site cannot currently be reached by the bump pipeline, **extend the pipeline** — add it
to the generated-asset flow or the bumper's file set. A tier-3 reference that the cut cannot bump is
not finished work; it is the #991 bug waiting to recur.

**The acceptance question for every surviving reference is: "will `release:cut` move this?"** If the
answer is no, it must be tier 1 or tier 2.

### Why this matters more than tidiness

Hours ago the beta.12 release cut was blocked by exactly the bug that approach creates: two
`jsr:@netscript/sdk@0.0.1-beta.11` string literals frozen inside
`packages/fresh-ui/registry.manifest.ts`. The version bumper walks JSON manifests and `deno.lock`,
so it never saw them, and every release after beta.11 would have shipped a registry telling `ui:add`
to install an SDK a release behind the framework. The fix (#991) was to use the
`FRESH_UI_PACKAGE_VERSION` constant the file already imported.

For tier 3 specifically, in order of preference:

1. **Derive it.** If generated metadata or a constant already exists — `package-metadata.generated.ts`,
   `NETSCRIPT_RELEASE_VERSION`, `netscriptJsrSpecifier`, `gen:publish-assets` output — use it.
2. **Make it derivable.** If a version literal must exist in publishable source and no constant
   covers it, add it to the generated-asset pipeline, and make sure `release:cut` regenerates it.

Done right, the eventual `1.0.0` is **one command** and the reference count is a fraction of 325.
Done as find-and-replace, it is this entire task again next release — with more places to miss.

## Surfaces to cover

Survey first — these counts are from `origin/main` at `8dca67985` and are a starting point, not a
checklist. **325** occurrences of `0.0.1-beta*` outside `.git`/`node_modules`/`_site`/`.llm`, plus
**18** files with `beta` prose in `docs/` and `README.md`.

- `packages/**` and `plugins/**` — source, `deno.json` exports, registry manifests, generated assets
- `docs/site/**` — 162 pages, including install snippets, tutorials, reference prose, and any page
  that describes the project as "beta" or explains the versioning scheme
- Root `README.md` and every per-package README (install lines, badges, tagline)
- `.agents/skills/**` and the `.claude/skills/**` mirror — the release skill especially. Regenerate
  the mirror with `deno task agentic:sync-claude`; **never hand-edit** `.claude/skills/`
- `.github/workflows/**` — input descriptions and examples naming a version
- `.llm/tools/release/**` — `validateStableTarget` keeps its original stable-only strictness (it was
  right; the target is now always a normal version). Check nothing else assumes a `-beta.` shape
- `resources/**`

## Explicitly NOT in scope

- **Do not bump any `deno.json` version.** `deno task release:cut -- 0.0.2` owns that and runs after
  you. The tree you hand back must still say `0.0.1-beta.12` in the manifests.
- **Do not rename GitHub milestones.** Already done: `0.0.1-beta.12` → `0.0.2` … `0.0.1-beta.19` →
  `0.0.9`.
- **Do not rewrite history or retag.** Published `0.0.1-alpha.*` / `0.0.1-beta.*` / `0.0.1-canary.1`
  versions are immutable and stay. Historical references to them (CHANGELOG, incident write-ups,
  harness run artifacts under `.llm/runs/`) are **correct as they stand** — leave them.
- Do not touch `packages/bench` or `packages/cli/e2e` publish config; both are deliberately excluded
  from the publish set.

## Non-negotiables

1. **VERIFY THE ARTEFACT, NEVER THE EXIT CODE.** A previous session produced two false "pushed"
   reports from an `&&` chain short-circuiting, and silently lost a file. Confirm with `git log`,
   `git ls-remote`, `gh pr view`.
2. **Always pass `--repo rickylabs/netscript` to every `gh` command.**
3. **Root `deno task lint` and `fmt:check` EXCLUDE `packages/cli` by their own regex.** A green root
   wrapper proves nothing about a change there. Re-run scoped:
   `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root <pkg> --ext ts,tsx`
   (same for `run-deno-fmt.ts`, `run-deno-check.ts`). Gate evidence must cover the files you changed.
4. **`check:assets-barrel` runs `gen:assets-barrel && git diff --exit-code`** — an intended generated
   diff fails it *until committed*. That blocked a finished slice from ever committing tonight. If
   you regenerate assets, commit them, then re-run.
5. **`.llm/tmp` is gitignored and some tests assume it exists.** `mkdir -p .llm/tmp` before running
   the fresh-ui suite or it fails with `NotFound: tmpdir` (tracked as #990).
6. **Report failures as failures.** A gate you could not run is declared NOT RUN with the reason.

## Validation

- Scoped `check`/`lint`/`fmt` over every root you touched.
- `deno task test` for affected packages.
- `deno task docs:links` if you touched `docs/site` — the built site must still resolve every link.
- `deno task agentic:sync-claude:check` and `deno task agentic:check-claude` if skills changed.
- **`deno task release:cut -- 0.0.2 --dry-run`** is the real proof. It runs `publish:readiness`,
  whose `versionless-specifiers` and `markdown-pins` gates are exactly what catch a missed or
  wrongly-derived reference. It must reach `{"gate":"publish-readiness","ok":true}`. Reset the
  working tree afterwards — dry-run leaves the bump behind.

## Deliverable

Branch `chore/version-scheme-0-0-x` in this worktree (no upstream by design). Commit as you go; push
with the explicit refspec `git push origin HEAD:refs/heads/chore/version-scheme-0-0-x`. Milestone
`0.0.2`. Do not merge.

The PR body must carry a **tier table** — how many references were deleted (tier 1), reduced to a
stage word (tier 2), and kept as auto-bumping (tier 3) — plus the surviving tier-3 sites listed
explicitly with the mechanism that bumps each one. That list is the thing a reviewer checks, because
it is the complete set of places that can ever go stale again.

State the before/after count. If 325 references do not fall substantially, explain why rather than
quietly deriving them all.

If any part of this brief turns out to be wrong — a constant that does not exist, a surface that is
already derived, a gate that cannot run here — say so plainly in the PR and in `drift.md` rather than
working around it silently.
