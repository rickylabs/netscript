---
name: netscript-release
description: NetScript canary-first release workflow: prove publish readiness, publish and verify an exact canary through OIDC, require the green canary pair for stable publication, and roll back or retry safely.
---

# NetScript Release

Use this skill for release-cut work, release-readiness questions, publish handoffs, rollback, or
debugging the `release:cut` flow. Pair it with `netscript-deno-toolchain` for Deno 2.9 command
semantics and `netscript-pr` for branch, PR, and comment mechanics.

## Prerequisites

- Work from a clean release-prep branch.
- Confirm `deno task publish:readiness` is green before cutting. It composes publish-set
  completeness, lockstep/residue, versionless-import, first-publish, provisioning dry-check, and the
  canonical `release:preflight` verdict with structured per-check evidence.
- Confirm `deno task release:preflight` is green before cutting. It enforces the JSR-safe bundled
  asset rule: publishable source must use generated TypeScript string constants. Import attributes
  (`with { type: ... }`) and `Deno.readTextFile(new URL(..., import.meta.url))`-style runtime reads
  are rejected because the JSR registry can reject them even when local dry-run passes.
- This import-attribute ban is conditional and carries its incident lineage: #138/#142 recorded the
  alpha.6 half-publish, #143 recovered with string constants, and beta.10 partially published before
  the same registry-side failure was tracked as
  [denoland/deno#35546](https://github.com/denoland/deno/issues/35546). Lift the ban only after that
  upstream issue is fixed, merged, and released **and** an authenticated canary publish of a
  text-import probe is green.
- Do not delete `deno.lock`, delete caches, or run `deno cache --reload`.
- Do not publish from a local machine or hand-run the underlying publish scripts. Stable and canary
  publication stays in the checked-in GitHub Actions workflows through OIDC; ad-hoc publishing is
  prohibited.
- Use `gh ... --body-file` for release PR creation and comments.
- **No `release:publish` without a green canary pair for the same content:** the canary publish and
  the canary-pinned `e2e-cli-prod` run must both be green. The stable publisher and GitHub Release
  command fail closed when the `release/canary-pair` status is absent.
- Never publish a stable JSR version without a GitHub Release created via
  `deno task release:publish`. The release is the stable-publish trigger; its notes must carry the
  hand-written intro plus the generated PR and closed-issue lists, and the newest stable release
  must be non-prerelease so GitHub shows it as Latest.

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
3. `gen:publish-assets` regenerates the registry-safe TypeScript constants from the bumped manifests
   and source assets; CI independently enforces `check:publish-assets` freshness.
4. Residue check aborts if the old version remains in JSON files or `deno.lock`.
5. `publish:readiness` emits the composed pre-publish verdict and calls the canonical
   `release:preflight`, which blocks JSR-unsafe import attributes and import-meta-relative runtime
   reads, rather than duplicating that scanner.
6. `publish:dry-run` proves the package publish surface builds before the real publish.
7. `deno ci --prod` proves the production dependency graph installs from the locked graph.
8. Non-dry-run creates `release/cut-<version>`, stages the bumped manifests and regenerated publish
   assets, commits `chore(release): cut <version>`, pushes, and opens the release PR.

## Mandatory Canary Pair

The canary is the same publisher and package set as the stable pipeline, pointed at an immutable
prerelease version. For stable target `<next-version>`, the version is `<next-version>-canary.N`.
`N` is one greater than the highest matching version found across all workspace-member JSR metadata
(including yanked versions), with existing git tags as a collision guard.

The workflow invokes `deno task release:canary -- <next-version>` to perform the shared coordinated
bump/gates and create the ephemeral branch plus provenance tag without a release PR. Operators may
use `--dry-run` in a disposable checkout to rehearse preparation, but must not run a non-dry canary
cut or the publisher ad hoc from a local machine.

After the release content is ready and before creating the stable release:

1. Dispatch `.github/workflows/release-canary.yml` with the target stable version. The workflow runs
   publish readiness, JSR provisioning, and the existing `run-publish.ts`
   dry-run/preflight/real-publish path through OIDC. It never creates a GitHub Release, never marks
   the canary Latest, and never uses `make_latest`.
2. The successful publish dispatches `e2e-cli-prod.yml` at the canary tag with
   `published-version=<canary>` and waits for that exact workflow run.
3. Only after the exact canary publish and pinned production E2E are green does the workflow write
   `release/canary-pair` on the pre-bump content SHA. A stable coordinated version-only commit may
   inherit that evidence; any other source or manifest drift fails closed.
4. The temporary `release/canary-<version>` branch is deleted best-effort. The canary tag remains as
   provenance and collision evidence.

Canary versions are immutable. Never delete or reuse a failed canary version. If a canary was
published and then its production E2E failed, preserve the workflow and tag evidence, yank that
version for every package member that published it, fix forward, and dispatch the next `canary.N`.
Yanking removes it from normal resolution without erasing the audit record; yanked versions still
count when choosing the next N.

## Merge And Stable Publish Flow

After the release PR merges:

1. Create the GitHub Release with the one command:

   ```bash
   deno task release:publish -- v<version> --notes-file <intro.md>
   ```

   This command first verifies the green canary pair for the same content, then creates
   `v<version>`, which triggers `publish.yml`. There is no stable JSR publish without that pair and
   GitHub Release, so **never hand-run `gh release create`** — it bypasses the composed release
   contract, forgets the intro, and leaves the `prerelease` flag set (which stranded the Latest
   badge on alpha.16 through alpha.19).
   - **The introduction summary is written by hand** — the prose describing what the release ships.
     Pass it via `--notes-file <path>` or `--message "<text>"`; the tool refuses to run without one.
     This is the single deliberately-manual step.
   - **Everything else is generated:** the "What's Changed" merged-PR list, the "Closed Issues" list
     since the previous release, and the `prerelease=false` + `make_latest` flags so the newest
     release shows as **Latest**. The JSR package links are appended later by `publish.yml`.
   - Rehearse with `--dry-run` to print the composed body before creating. Use `--prerelease` (with
     `--no-latest`) only for a genuine prerelease that must not become Latest.
2. `publish.yml` independently verifies the green canary pair, runs composed publish readiness,
   provisioning, dry-run, the real-publish-equivalent preflight, and publishes every effective
   `@netscript/*` workspace member to JSR through OIDC.
3. On successful publish, `publish.yml` writes `version.txt` and uploads it as
   `netscript-published-version-${{ github.run_id }}`.
4. `e2e-cli-prod.yml` runs from `workflow_run` only after `publish` succeeds, downloads that exact
   artifact from `github.event.workflow_run.id`, reads the version, installs
   `jsr:@netscript/cli@<version>`, and runs the published CLI smoke and scaffold runtime suite.
5. The manual `workflow_dispatch` path still accepts `published-version` for targeted rechecks.

### Exact-version resolution and same-semver recovery

- Production E2E must resolve the exact just-published semver. Published NetScript invocations use
  `--minimum-dependency-age=0` because the release gate intentionally consumes artifacts that may be
  only seconds old; leaving Deno's default minimum-age policy in place delays the verdict by roughly
  24 hours. Where Deno 2.9's `deno x` re-exec drops that flag, invoke the published `cli.ts` URL via
  `deno run --minimum-dependency-age=0` so the override reaches the resolving process.
- A partial workspace publish is retried at the same semver after fixing the failing gate or member.
  The publisher skips members already present at that exact version and continues the missing set;
  do not delete immutable versions or introduce a replacement semver merely to hide a partial run.
- Neither rule weakens preflight: every retry still runs composed `publish:readiness`, including the
  canonical import-attribute detector and its denoland/deno#35546 authenticated-canary sunset.

## Hard Release Completion Gate

A stable release may begin only when both canary verdicts are green for the exact content:

1. `release-canary.yml` published the derived canary version successfully.
2. Its exact canary-pinned `e2e-cli-prod` run is green.

That green pair is mandatory, not advisory: **no `release:publish` and no stable `publish.yml`
execution without it.** A stable release is then **done only when both** of these independent stable
workflow verdicts are green:

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
- #810: the import-attribute preflight remains mandatory until denoland/deno#35546 is fixed, merged,
  and present in the pinned Deno release **and** an authenticated canary text-import probe is green.
  Publish readiness calls that canonical preflight so the sunset criterion has one owner.
- #811: a SHA-bound canary publish plus exact canary-pinned production E2E is the mandatory evidence
  boundary before stable publication.

## Rollback And Retry

- If `release:cut` fails before branch creation, fix the reported gate and rerun. Restore any
  dry-run version bump with normal git checkout of the bumped files if you ran it in the live
  checkout.
- If the release PR is wrong before merge, push a follow-up commit to the release branch or close
  the PR and cut again.
- If GitHub Release publish fails before any JSR package publishes, fix the workflow or gate and
  rerun the release workflow.
- If a canary publish or its pinned production E2E fails, do not create the stable GitHub Release.
  Preserve evidence, yank any published canary members, fix forward, and dispatch the next N.
- If publish partially succeeds, do not delete the tag or lockfile. Deno 2.9 skips already-published
  members on retry; rerun after fixing the failing member or gate.
- If `e2e-cli-prod` fails after publish, keep the release record intact, investigate against the
  exact artifact-provided version, and cut a patch/prerelease follow-up when the fix requires code.
