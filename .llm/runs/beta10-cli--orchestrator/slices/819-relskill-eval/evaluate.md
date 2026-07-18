# Evaluation: PR #819 — release-skill recovery doctrine

## Metadata

| Field           | Value                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| Run ID          | `beta10-cli--orchestrator/slices/819-relskill-eval`                                  |
| Target          | PR #819, `docs/release-recovery-patterns` at `88c2ebf2` against `main` at `aa14e452` |
| Surface         | `.agents/skills/netscript-release/SKILL.md` plus generated `.claude` mirror          |
| Scope overlay   | Docs / internal release doctrine                                                     |
| Evaluator route | `review_claude`: Codex · GPT-5.6 Sol · xhigh; requested and observed route match     |
| Evaluator date  | 2026-07-17                                                                           |

## Evidence reviewed

- Full `origin/main...HEAD` diff: two skill files, 83 additive lines in each; no package, plugin,
  workflow, or lockfile changes.
- GitHub REST metadata, jobs, and job logs for publish runs
  [`29558968037`](https://github.com/rickylabs/netscript/actions/runs/29558968037) and
  [`29562537123`](https://github.com/rickylabs/netscript/actions/runs/29562537123), including the
  step boundary between the auth-boundary graph preflight and the real upload.
- Commit/tag evidence for `a5adb706e37ffdc641a42af16c2d597021e23b13` and
  `8a8a95377a1b3714c5407959bc46eeb1489dbdb1`, the current remote tag ref, and the full path diff
  between those commits.
- Merged PRs #807, #809, #810, #813, and #817; open issue #818; current `publish.yml` and
  `jsr-provision-packages.ts`; pending PR #812's release-skill source at `ddd4242e`.
- Production E2E run `29564434302` (failure on #813) and `29566090314` (success on #817).

## Gate log

| Gate                            | Command(s) / evidence                                                                    | Scope                                                  | Result         | Findings                                                                                                                                                   | Proceeded                     |
| ------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Whole-diff accuracy             | `git diff origin/main...HEAD`; GitHub REST run/job/log endpoints                         | Both changed skill files and every added factual claim | FAIL           | Same-semver incident accounting and safety claims contradict the live record; see findings 1-2                                                             | Blocking findings recorded    |
| Minimum-dependency-age accuracy | PR #813/#817 patches and bodies; issue #818; Actions runs `29564434302` / `29566090314`  | Lines 99-118 in the source skill                       | PASS           | The published-JSR flag sweep, Deno `x` child re-exec flag loss, direct single-resolver `deno run` fix, and user-window deferral all match shipped evidence | No finding                    |
| First-publish accuracy          | Current `publish.yml`; `jsr-provision-packages.ts`; #807; #808/#809; pending #812 skill  | Lines 141-160                                          | FAIL           | Provisioning/README/canary claims align, but the manual live-validation instruction overstates what beta.10 actually ran; see finding 3                    | Blocking wording fix recorded |
| Mirror sync                     | `deno task agentic:sync-claude:check`                                                    | All mirrored skills                                    | PASS           | `17` skills / `21` mirrored files; source and mirror in sync                                                                                               | Continued                     |
| Link integrity                  | `deno task docs:links`                                                                   | Internal docs                                          | PASS           | `98` docs, `0` broken links, `0` broken anchors, `0` orphans                                                                                               | Continued                     |
| Format                          | `.llm/tools/run-deno-fmt.ts --file <source> --file <mirror> --pretty`                    | Two touched Markdown files                             | PASS           | `2` selected, `0` failed batches, `0` findings                                                                                                             | Continued                     |
| Structure / voice               | Full-file read and additive diff inspection                                              | Existing release skill plus both additions             | PASS           | Additive organization is coherent; issue/PR references are appropriate in this internal doctrine; no public-doc vocabulary rule applies                    | No finding                    |
| Pending-branch integration      | `git merge-tree a5adb706 88c2ebf2 ddd4242e`                                              | PR #819 versus pending #812                            | PASS with note | Concrete future textual conflicts exist in both mirrors; see non-blocking finding 4                                                                        | Warning recorded              |
| Diff hygiene                    | `git diff --check origin/main...HEAD`; direct `git status --short` before artifact write | PR diff / evaluator worktree                           | PASS           | No whitespace error; evaluator made no subject-worktree edits                                                                                              | Continued                     |

## Numbered findings

1. **HIGH — The beta.10 run accounting conflates the no-upload auth-boundary preflight with the real
   publish, producing an impossible narrative for a 35-member workspace.** The source skill says one
   partial run published 33 members, had 10 more token failures, one MCP failure, and 26 further
   dependency skips. In run `29558968037`, the **Publish preflight (real graph build, no upload)**
   step deliberately used an invalid token: it reported 10 token failures and 25 skipped dependents,
   then explicitly logged that it stopped at the auth boundary with no upload. The subsequent
   **Publish** step successfully uploaded 33 members, failed only `@netscript/mcp` on the
   unsupported text import, and skipped only `@netscript/cli`. The workspace discovery surface
   contains 35 members. Required fix: separate the two step outcomes explicitly. The partial
   registry state after the real upload was `33 published / mcp failed / cli skipped`; the
   `10 failed / 25 skipped` result belongs only to the deliberately unauthenticated graph preflight
   and must not be counted as additional registry outcomes.

2. **HIGH — The documented tag move violated the section's own byte-identical safety condition, and
   the commit topology is also misstated.** `8a8a9537` is the direct child of `a5adb706`, not "two
   commits after" it. More importantly,
   `git diff a5adb706 8a8a9537 -- <already-published-member-paths>` is non-empty for six members
   that run `29558968037` had already uploaded: `@netscript/plugin-ai`, `plugin-auth`,
   `plugin-sagas`, `plugin-streams`, `plugin-triggers`, and `plugin-workers`. Their changed `src/**`
   / `services/**` files are included by each member's `publish.include`, so the members were not
   byte-identical across the tag move. The fallback rule at the end of the new section therefore
   says beta.10 required a semver bump, while the preceding prose calls the same move legitimate and
   "as executed." Required fix: describe beta.10 as evidence that JSR skips existing versions and
   can fill unpublished members, but not as a compliant byte-identical precedent. State the check as
   an explicit **MANDATORY precondition**, with the existing verification method, before any tag
   move; if any already-published member's exact publish content differs, require the semver-bump
   fallback. Also change "every version file unchanged" to the accurate claim that version
   **values** remained `0.0.1-beta.10`, because `deno.json` itself changed between the two commits.

3. **MEDIUM — The first-publish live-validation instruction claims registry-published evidence that
   beta.10 did not and could not have before first publish.** `publish.yml` does auto-provision and
   #807 did manually raise the MCP README to the Install / Quick example / Docs standard, so those
   claims are accurate. But #808/#809's pre-first-publish acceptance ran the in-tree/local
   maintainer CLI against a real scaffolded Aspire app; it did not run an already-published JSR MCP
   artifact. The current wording, "actually run the published surface," is ambiguous at best and
   operationally impossible for a never-before-published member until #812's canary channel exists.
   Required fix: require a live release-candidate/runtime validation today (matching #809), and say
   that after #812 merges the live validation must use the canary-published surface and its pinned
   production E2E verdict.

4. **LOW / NON-BLOCKING — Pending PR #812 will conflict textually with this skill change and can
   easily drop the new recovery doctrine during resolution.** A three-way `git merge-tree` using
   common base `a5adb706`, PR #819 head `88c2ebf2`, and #812 head `ddd4242e` reports conflicts in
   both release-skill mirrors at Prerequisites, the ordered `release:cut` proof list, publish flow,
   and Rollback/Retry. This is not a defect in PR #819. Required follow-up when #812 rebases/merges:
   resolve the `.agents` source manually so it preserves #810's generated-asset/preflight rules,
   #812's mandatory canary/readiness flow, and the corrected beta.10 recovery/min-age/first-publish
   sections; then regenerate the `.claude` mirror rather than resolving it independently.

## Verified non-findings

- The minimum-dependency-age section accurately reflects what #813 and #817 shipped and correctly
  leaves the shipped-CLI/user policy to #818.
- The same-semver section includes a semver-bump fallback condition and a concrete `git diff`
  verification method; the defects are that the condition is not stated as the requested
  **MANDATORY** precondition and that the cited beta.10 move fails it.
- The source/mirror structure is synchronized, additive, and consistent with the existing internal
  skill voice.
- No architecture-debt change is introduced by this docs-only PR.

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `FAIL_FIX`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Rationale | The approved docs-only scope remains valid, the mechanical gates are green, and the minimum-dependency-age doctrine is accurate. However, the core same-semver section misstates the beta.10 run, calls a non-byte-identical tag move legitimate despite its own fallback rule, and does not express byte identity as the required mandatory precondition. The first-publish live-validation wording also overclaims the evidence. These are bounded documentation corrections, so `FAIL_FIX` is the appropriate verdict. |

## Cycle 2

Evaluated fetched PR head `9d148d88cb7ccc3ccaf70b8f6bd7fa368b1436eb` (parent `88c2ebf2`) against the
current `origin/main` merge base. The evaluator used the clean subject worktree at the same commit
for gates and made no subject edits.

### Gate evidence

| Gate                 | Command / evidence                                                                                   | Result | Notes                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remote-head identity | `git fetch --no-tags origin …`; raw `git ls-remote origin refs/heads/docs/release-recovery-patterns` | PASS   | Remote branch and subject worktree both resolve to `9d148d88`.                                                                                                         |
| Cycle-2 scope        | `git diff --name-status 88c2ebf2...9d148d88`; full commit diff                                       | PASS   | Only the two release-skill mirrors changed; the patch is confined to the first-publish and same-semver sections that findings 1-3 owned.                               |
| Full PR scope        | `git diff --name-status origin/main...HEAD`; full source-skill read                                  | PASS   | Still only `.agents/skills/netscript-release/SKILL.md` and its generated `.claude` mirror; minimum-dependency-age and all pre-existing release guidance remain intact. |
| Mirror byte identity | Raw `git show HEAD:<source>` / `git show HEAD:<mirror>` byte comparison                              | PASS   | `15014` bytes each; byte-identical.                                                                                                                                    |
| Mirror sync          | `deno task agentic:sync-claude:check`                                                                | PASS   | `17` skills / `21` mirrored files.                                                                                                                                     |
| Link integrity       | `deno task docs:links`                                                                               | PASS   | `98` docs; `0` broken links, `0` broken anchors, `0` orphans.                                                                                                          |
| Format               | `.llm/tools/run-deno-fmt.ts --file <source> --file <mirror> --pretty`                                | PASS   | `2` files selected; `0` failed batches; `0` findings.                                                                                                                  |
| Diff hygiene         | `git diff --check origin/main...HEAD`; raw subject `git status --short` after gates                  | PASS   | No whitespace errors and no subject-worktree changes.                                                                                                                  |

### Numbered findings

1. **Finding 1 — CURED.** The skill now separates the deliberately unauthenticated **Publish
   preflight (real graph build, no upload)** from the real **Publish** registry result. It records
   `10` token failures / `25` dependency skips only for the no-upload preflight and records the
   actual partial registry state as `33 of 35` published, `@netscript/mcp` failed, and
   `@netscript/cli` skipped. It explicitly prohibits summing the two step outcomes.

2. **Finding 2 — CURED.** Byte identity for every already-published member is now an explicit
   **MANDATORY precondition**, with the prescribed
   `git diff <old-tag-sha> <new-tag-sha> -- <published-member-paths>` verification and semver-bump
   fallback on any non-empty member diff. The history now says `8a8a9537` is the direct child of
   `a5adb706`, distinguishes unchanged version **values** from changed `deno.json` file content,
   names the six already-published plugin members whose publish content changed, and recasts beta.10
   honestly: it proves skip-existing/fill-unpublished registry mechanics, not that the
   non-byte-identical tag move was safe or repeatable.

3. **Finding 3 — CURED.** The manual first-publish check now requires the beta.10 reality from
   #808/#809: live release-candidate/runtime validation through the in-tree maintainer CLI against a
   real scaffolded application. It separately states that once #812's canary channel exists, the
   evidence must change to the canary-published surface plus its pinned production E2E verdict.

4. **Finding 4 — remains NON-BLOCKING as directed.** The pending #812 textual-conflict warning is
   unchanged. It is an integration instruction for #812's future rebase/merge, not a defect in the
   corrected PR #819 diff.

5. **Regression sweep — no new findings.** The cycle-2 commit changes no files or sections outside
   the two prescribed skill areas, source and mirror remain byte-identical, the previously accurate
   minimum-dependency-age section is unchanged, and all requested mechanical gates pass.

### Cycle 2 verdict

| Field     | Value                                                                                                                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                                                                                                            |
| Rationale | Findings 1-3 are cured exactly as prescribed, finding 4 remains explicitly non-blocking, the complete docs-only diff introduces no regression, and mirror-sync, link, formatting, and diff-hygiene gates are independently green. |
