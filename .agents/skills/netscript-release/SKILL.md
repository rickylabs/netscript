---
name: netscript-release
description: NetScript release-cut workflow: use the one-shot release:cut command, interpret release gates, publish through GitHub Release/OIDC, verify race-free e2e-cli-prod, and roll back or retry a failed cut.
---

# NetScript Release

Use this skill for release-cut work, release-readiness questions, publish handoffs, rollback, or
debugging the `release:cut` flow. Pair it with `netscript-deno-toolchain` for Deno 2.9 command
semantics and `netscript-pr` for branch, PR, and comment mechanics.

## Prerequisites

- Work from a clean release-prep branch.
- Confirm `deno task release:preflight` is green before cutting. It enforces the JSR-safe bundled
  asset rule: publishable source must use generated TypeScript string constants. Import attributes
  (`with { type: ... }`) and `Deno.readTextFile(new URL(..., import.meta.url))`-style runtime reads
  are rejected because the JSR registry can reject them even when local dry-run passes.
- Do not delete `deno.lock`, delete caches, or run `deno cache --reload`.
- Do not publish from a local machine. Publishing stays in GitHub Actions through OIDC.
- Use `gh ... --body-file` for release PR creation and comments.
- Never publish to JSR without a GitHub Release created via `deno task release:publish`. The release
  is the publish trigger; its notes must carry the hand-written intro plus the generated PR and
  closed-issue lists, and the newest release must be non-prerelease so GitHub shows it as Latest.

## One Command

Run the release cut from the repository root:

```bash
deno task release:cut -- <version>
```

Use a semver version newer than the root `deno.json` version, including prereleases such as
`0.0.1-alpha.12`.

For rehearsal:

```bash
deno task release:cut -- <version> --dry-run
```

Dry-run performs the bump, residue check, and gates, then skips branch creation, commit, push, and
PR. Run it in a disposable copy if you do not want the working tree version-bumped after a failed
gate.

## What The Command Proves

`release:cut` is fail-fast and ordered:

1. Version validation refuses invalid semver and equal or older versions.
2. Workspace bump sets the root version, every package/plugin `deno.json`, nested workspace
   `deno.json` files, and `deno.lock` `@netscript/*` ranges to the new version.
3. Residue check aborts if the old version remains in JSON files or `deno.lock`.
4. `release:preflight` blocks JSR-unsafe import attributes and import-meta-relative runtime reads.
5. `publish:dry-run` proves the package publish surface builds before the real publish.
6. `deno ci --prod` proves the production dependency graph installs from the locked graph.
7. Non-dry-run creates `release/cut-<version>`, stages only bumped files, commits
   `chore(release): cut <version>`, pushes, and opens the release PR.

## Merge And Publish Flow

After the release PR merges:

1. Create the GitHub Release with the one command:

   ```bash
   deno task release:publish -- v<version> --notes-file <intro.md>
   ```

   This creates `v<version>`, which is what triggers `publish.yml`. There is no JSR publish without
   a GitHub Release, so **never hand-run `gh release create`** — it forgets the intro and leaves the
   `prerelease` flag set (which stranded the Latest badge on alpha.16 through alpha.19).
   - **The introduction summary is written by hand** — the prose describing what the release ships.
     Pass it via `--notes-file <path>` or `--message "<text>"`; the tool refuses to run without one.
     This is the single deliberately-manual step.
   - **Everything else is generated:** the "What's Changed" merged-PR list, the "Closed Issues" list
     since the previous release, and the `prerelease=false` + `make_latest` flags so the newest
     release shows as **Latest**. The JSR package links are appended later by `publish.yml`.
   - Rehearse with `--dry-run` to print the composed body before creating. Use `--prerelease` (with
     `--no-latest`) only for a genuine prerelease that must not become Latest.
2. `publish.yml` resolves the release version, runs the release preflight, runs publish dry-run, and
   publishes every `@netscript/*` workspace member to JSR through OIDC.
3. On successful publish, `publish.yml` writes `version.txt` and uploads it as
   `netscript-published-version-${{ github.run_id }}`.
4. `e2e-cli-prod.yml` runs from `workflow_run` only after `publish` succeeds, downloads that exact
   artifact from `github.event.workflow_run.id`, reads the version, installs
   `jsr:@netscript/cli@<version>`, and runs the published CLI smoke and scaffold runtime suite.
5. The manual `workflow_dispatch` path still accepts `published-version` for targeted rechecks.

## Hard Release Completion Gate

A release is **done only when both** of these independent workflow verdicts are green:

1. `publish.yml` is all-green for the GitHub Release-triggered publish run.
2. The corresponding artifact-pinned `e2e-cli-prod` run is green.

Any red result in either workflow is a real release defect. Do not relabel it as infrastructure
noise, bypass it, delete the release record, or treat a partial publish as done. Investigate the
exact failing version and fix-forward; when code changes are required, cut the next patch or
prerelease and repeat both gates. The release is not complete until the pair is green.

## Rationale

- #122: one command prevents manual root version, member version, and lockfile drift.
- #123: `workflow_run` plus the run-id artifact removes the race where prod E2E installs before JSR
  has the just-published CLI version.
- #133: asset preflight catches import attributes and `import.meta.url` asset-read defects that
  dry-run can miss and real publish can reject.
- #146: `deno ci --prod` is already lockfile-frozen in Deno 2.9; an explicit extra flag is rejected.

## Rollback And Retry

- If `release:cut` fails before branch creation, fix the reported gate and rerun. Restore any
  dry-run version bump with normal git checkout of the bumped files if you ran it in the live
  checkout.
- If the release PR is wrong before merge, push a follow-up commit to the release branch or close
  the PR and cut again.
- If GitHub Release publish fails before any JSR package publishes, fix the workflow or gate and
  rerun the release workflow.
- If publish partially succeeds, do not delete the tag or lockfile. Deno 2.9 skips already-published
  members on retry; rerun after fixing the failing member or gate.
- If `e2e-cli-prod` fails after publish, keep the release record intact, investigate against the
  exact artifact-provided version, and cut a patch/prerelease follow-up when the fix requires code.
