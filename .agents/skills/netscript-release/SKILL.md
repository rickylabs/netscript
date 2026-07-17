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
- This import-attribute ban is conditional and carries its incident lineage: #138/#142 recorded the
  alpha.6 half-publish, #143 recovered with string constants, and beta.10 partially published before
  the same registry-side failure was tracked as
  [denoland/deno#35546](https://github.com/denoland/deno/issues/35546). Lift the ban only after that
  upstream issue is fixed, merged, and released **and** an authenticated canary publish of a
  text-import probe is green.
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
3. `gen:publish-assets` regenerates the registry-safe TypeScript constants from the bumped manifests
   and source assets; CI independently enforces `check:publish-assets` freshness.
4. Residue check aborts if the old version remains in JSON files or `deno.lock`.
5. `release:preflight` blocks JSR-unsafe import attributes and import-meta-relative runtime reads.
6. `publish:dry-run` proves the package publish surface builds before the real publish.
7. `deno ci --prod` proves the production dependency graph installs from the locked graph.
8. Non-dry-run creates `release/cut-<version>`, stages the bumped manifests and regenerated publish
   assets, commits `chore(release): cut <version>`, pushes, and opens the release PR.

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

### Minimum-Dependency-Age At Release Time

Deno 2.9's default ~24h minimum-dependency-age rejects a same-day publish: a package published
minutes ago is treated as too fresh to depend on. This bit the beta.10 cut twice in the same
release, back to back:

- #813 pinned `--minimum-dependency-age=0` on every `jsr:@netscript/*` invocation the production E2E
  harness runs — but the harness still failed the very next run
  ([`29564434302`](https://github.com/rickylabs/netscript/actions/runs/29564434302)).
- #817 found the real cause: `deno x` resolves and installs the JSR executable, then internally
  re-invokes `deno run` in a **child process** that does not inherit the parent's
  `--minimum-dependency-age` flag. The fix bypasses `deno x` for fresh-plugin resolution and runs
  `deno run --minimum-dependency-age=0` directly against the resolved entrypoint, keeping fresh
  plugin resolution in one Deno process.

Both fixes are release-harness-only (`.llm/tools/release/` and the E2E suite). The same exposure
exists in the **shipped CLI's** own `deno x` plugin dispatch — tracked separately as a user-facing
product-policy decision in [#818](https://github.com/rickylabs/netscript/issues/818) (a project on a
fresh release hits the 24h wall on every `jsr:@netscript/*` resolution for its first day), not
silently patched here.

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

## First-Publish Checklist

`publish.yml` auto-provisions new JSR packages (`.llm/tools/release/jsr-provision-packages.ts`), but
provisioning is not readiness. Before the first release that carries a brand-new workspace member,
verify by hand:

- README meets the production standard (Install / Quick example / Docs sections) — see #807 for the
  bar `@netscript/mcp` was held to before its first publish.
- Tagline stays under the JSR byte cap.
- `license`, `exports`, and workspace `deno.json` config are complete and correct for the new
  member.
- The docs site has coverage for the new package (or an explicit stub with a tracked follow-up).
- For a server or CLI package, do a live release-candidate/runtime validation pass, not just
  `publish:dry-run` — matching #809: run the in-tree maintainer CLI against a real scaffolded app
  (see the same-semver republish section below for why dry-run passing is not sufficient). Once
  #812's canary channel exists, this step changes: live validation must run against the
  canary-published surface and cite its pinned production E2E verdict, not the in-tree CLI.

This checklist is manual today. #811/#812 track a `publish-readiness.ts` gate (new-package
detection, README/tagline/license/exports checks, docs-site coverage pointer) that runs inside a
mandatory canary-publish channel and will automate it — once #812 merges, prefer the automated
`release:canary` verdict over this manual checklist.

## Same-Semver Republish (Partial-Publish Recovery)

Proven during the 0.0.1-beta.10 cut (2026-07-17,
[run `29558968037`](https://github.com/rickylabs/netscript/actions/runs/29558968037)): a
`publish.yml` run can partially succeed. Keep the unauthenticated graph-preflight outcomes separate
from the real Publish step's registry outcomes — they are two different steps in the same run and
must not be summed:

- **Publish preflight (real graph build, no upload)** deliberately runs with an invalid token to
  build the full dependency graph without uploading. It reported 10 token failures and 25 skipped
  dependents, then stopped at the auth boundary. None of these are registry outcomes — nothing was
  uploaded.
- **Publish** (the real upload) then ran: 33 of the 35 workspace members published, `@netscript/mcp`
  failed on the registry-rejected text import that #810 later fixed, and `@netscript/cli` was
  skipped as a dependent of the failed `mcp` publish.

**JSR version immutability binds only to published members.** A member that failed or was skipped
can still publish at the exact same semver, and workspace `deno publish` skips already-registered
versions on the members that already succeeded (`Warning: Skipping, already published`) rather than
re-publishing or failing on them. This makes recovery a **fix-forward**, not a version bump,
whenever the fix does not touch content that already published.

Byte identity of every already-published member across the tag move is a **MANDATORY precondition**
for step 2 below, not an aspiration. Verify it with
`git diff <old-tag-sha> <new-tag-sha> -- <published-member-paths>` for every member that already
published; if the diff is non-empty for even one of them, that member's published content changed
and the tag move is not safe — use the semver-bump fallback instead.

Recovery steps, as executed for beta.10:

1. Fix forward to `main`. `8a8a9537` (#810) fixed the `@netscript/mcp` text-import rejection and is
   the **direct child commit** of the `a5adb706` release-cut commit. Version **values** stayed at
   `0.0.1-beta.10` in both commits, but this is not the same claim as "every version file
   unchanged": `deno.json` itself changed between the two commits (its content differs even though
   the version field does not).
2. Fast-forward the release tag to the fixed commit — **only** after the byte-identity precondition
   above passes. Applied literally to beta.10, it does not: `git diff a5adb706 8a8a9537` is
   non-empty for six members that run `29558968037` had already published — `@netscript/plugin-ai`,
   `plugin-auth`, `plugin-sagas`, `plugin-streams`, `plugin-triggers`, and `plugin-workers` —
   because their publish-included `src/**`/`services/**` files changed alongside the `mcp` fix.
   beta.10 is therefore not a compliant byte-identical precedent for this step; it is evidence for a
   narrower claim (see below).
3. Re-dispatch `publish.yml` via its `workflow_dispatch` `tag` input set to the existing tag (for
   example `v0.0.1-beta.10`) — do not create a new GitHub Release; that would demand a new semver.
   The workflow checks out the fast-forwarded tag ref, so already-published members log
   `Skipping, already published` and only the previously-failed/skipped members publish for the
   first time.
4. The Hard Release Completion Gate above still applies to the **re-dispatched** run, not the
   original: beta.10's first `publish.yml` run failed
   ([`29558968037`](https://github.com/rickylabs/netscript/actions/runs/29558968037)); the
   re-dispatch on the fast-forwarded tag succeeded
   ([`29562537123`](https://github.com/rickylabs/netscript/actions/runs/29562537123), `mcp` and
   `cli` publishing for the first time); only that green run's artifact is what `e2e-cli-prod` is
   allowed to validate against.

**What beta.10 actually demonstrates:** because JSR's `deno publish` skips already-registered
versions on members that already succeeded and fills in members that never reached the registry, the
re-dispatch on the fast-forwarded tag still completed the partial publish even though six
already-published members were not byte-identical across the move — those six simply logged
`Skipping, already published` with their pre-fix content permanently on the registry at
`0.0.1-beta.10`. This is evidence that JSR skips existing versions and fills unpublished members; it
is **not** evidence that a non-byte-identical tag move is safe. Do not repeat the beta.10 tag move
as a template — treat it as the incident that motivated the mandatory precondition above.

**Fallback:** a semver-bump hotfix is required instead whenever the byte-identity precondition fails
for any already-published member — same-semver republish can only ever fill in members that never
reached the registry, never re-publish over one that did.

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
