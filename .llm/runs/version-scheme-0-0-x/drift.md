# Drift Log: `0.0.x` release scheme

## 2026-07-31 — Launcher run ID is non-canonical

- **What:** The pre-created run directory is `version-scheme-0-0-x`, without the branch prefix and
  required suffix.
- **Source:** Existing committed `.llm/runs/version-scheme-0-0-x/implement.md`.
- **Expected:** `chore-version-scheme-0-0-x--<suffix>`.
- **Actual:** `version-scheme-0-0-x`.
- **Severity:** minor.
- **Action:** accept to preserve launcher provenance; record in `supervisor.md` and PR.
- **Evidence:** branch commits `e87de8e6b` and `fbd57c3bf`.

## 2026-07-31 — Carried implementation brief expands the current owner prompt

- **What:** The supervisor-refined `implement.md` adds a mandatory three-tier deletion/stage-word/
  auto-bump taxonomy and PR tier table not present in the current user assignment.
- **Source:** Diff `e87de8e6b..fbd57c3bf` versus the current owner prompt.
- **Expected:** Derive, make derivable, then update a genuine one-off literal.
- **Actual:** The carried brief additionally expects most references to be deleted or reduced to a
  stage word.
- **Severity:** significant.
- **Action:** accept only where independently consistent with the current owner hierarchy; do not
  delete functionality or historical evidence based solely on the refinement. Describe the
  classification in the PR for transparency.
- **Evidence:** `.llm/runs/version-scheme-0-0-x/implement.md` and current assignment.

## 2026-07-31 — Tracked member lock is outside the bump and residue surface

- **What:** `packages/fresh-ui/deno.lock` contains 65 beta.11 references and is already behind the
  beta.12 manifests.
- **Source:** Exact census and `.llm/tools/deps/bump-version.ts` discovery/residue implementation.
- **Expected:** One release command moves every coordinated version surface.
- **Actual:** Only the root `deno.lock` is discovered; residue ignores nested locks.
- **Severity:** significant.
- **Action:** fix in S1/S2 with discovery tests, Deno-generated lock reconciliation, and Fresh UI
  validation.
- **Evidence:** `rg -n '0.0.1-beta.11' packages/fresh-ui/deno.lock` (65 matches).

## 2026-07-31 — Markdown pin gate is beta-shaped and docs-site findings are deferred

- **What:** `MARKDOWN_PIN_PATTERN` matches only `0.0.1-<label>.<N>` and every `docs/site` finding is
  non-blocking.
- **Source:** `.llm/tools/release/preflight-release.ts` and its tests.
- **Expected:** The release dry-run catches a missed or wrongly derived current pin under the new
  `0.0.x` scheme.
- **Actual:** A stale `@0.0.2` pin during a `0.0.3` cut is invisible; even an old prerelease pin in
  `docs/site` is deferred.
- **Severity:** significant.
- **Action:** fix by scanning generic semver pins and making owned docs findings blocking.
- **Evidence:** `preflight-release.ts:45,76-106`; existing test named “deferred snippets.”

## 2026-07-31 — Milestone taxonomy no longer follows one wave-to-milestone map

- **What:** The PR skill/AGENTS/CONTRIBUTING describe old beta/stable milestones and a deterministic
  wave mapping.
- **Source:** Live GitHub milestone and issue-search API results on 2026-07-31.
- **Expected:** Current process docs match the already-renamed milestones.
- **Actual:** Open milestones are `0.0.2`…`0.0.9` plus `Backlog / Triage`; `wave:v1`, `wave:v1-min`,
  and `wave:defer` each span multiple milestones.
- **Severity:** significant.
- **Action:** fix process docs to require explicit cut milestone assignment rather than inventing a
  one-to-one wave map.
- **Evidence:** milestone IDs 14–21 and Backlog ID 3; live grouped issue search recorded in
  `research.md`.

## 2026-07-31 — Agentic runtime cannot prove current mobile attachment

- **What:** The launcher wrote a Codex session/thread record, but the desired-state runtime reports
  zero managed sessions and `MOBILE_DISCONNECTED`.
- **Source:** `deno task agentic:runtime status`.
- **Expected:** Tier-D mobile-visible proof includes a daemon-managed session.
- **Actual:** The current implementation session is active but not proven mobile-attached by the
  runtime controller.
- **Severity:** significant.
- **Action:** accept for this already-open local session, make no mobile-visibility claim, and use
  separate approved local evaluator/reviewer transports.
- **Evidence:** `.llm/runs/version-scheme-0-0-x/codex-thread-ids.md`; runtime status output.

## 2026-07-31 — Required local PLAN-EVAL route has no credential

- **What:** The mandatory independent PLAN-EVAL could not start through the lane-policy-selected
  local Claude/OpenRouter route.
- **Source:** Live provider canary for profile `claude-openrouter`, model `qwen/qwen3.7-max`, effort
  `high`.
- **Expected:** A separate local Claude Code session runs Qwen PLAN-EVAL and writes a verdict before
  implementation.
- **Actual:** The canary returned `status=blocked`, `credential=absent`, and `auth_required`; no
  evaluator session was created.
- **Severity:** blocking.
- **Action:** stop before implementation. Resume only after the OpenRouter credential is available,
  or after the owner explicitly authorizes the harness's cloud OpenHands open-model fallback.
- **Evidence:** `deno task agentic:provider-canary --live --profile claude-openrouter --model
  qwen/qwen3.7-max --effort high --worktree /home/codex/repos/b12-scheme`.

## 2026-07-31 — Shared-worktree supervisor commits overlapped plan artifact updates

- **What:** An already-running supervisor committed plan artifacts and the evaluator-route blocker
  while this session was refining the same run directory.
- **Source:** commits `f214a1d46` and `e481e3593` appearing on the active branch during the plan
  phase.
- **Expected:** One writer owns the run artifacts for a phase.
- **Actual:** Both sessions touched harness documentation; product files were not edited.
- **Severity:** significant.
- **Action:** reconcile both evidence sets in `396639496` and the next harness-only commit, preserve
  the evaluator blocker, and keep implementation stopped pending a formal PASS.
- **Evidence:** `git log --oneline --parents 8dca67985..HEAD` and the clean worktree after
  reconciliation.

## 2026-07-31 — Owner authorized implementation while personally evaluating the plan

- **What:** The automated PLAN-EVAL lane remains unavailable, and the owner explicitly authorized
  implementation to proceed while conducting the plan evaluation personally.
- **Source:** Owner instruction on 2026-07-31.
- **Expected:** The lane-policy Qwen evaluator runs through the `claude-openrouter` profile before
  implementation.
- **Actual:** The lane-policy Qwen evaluator reported `credential=absent` and `auth_required`; the
  owner explicitly waived the automated PLAN-EVAL lane and is performing the evaluation
  personally. Implementation proceeded on that authority.
- **Severity:** significant process override.
- **Action:** proceed with the already-committed plan. Do not create `plan-eval.md`, self-record a
  verdict, claim PLAN-EVAL passed, or describe the gate as skipped.
- **Evidence:** owner authorization in the conversation and the previously recorded provider
  canary result.

## 2026-07-31 — Scoped lint/fmt wrappers needed explicit package config support

- **What:** Scoped lint and format invocations for MCP and the core packages failed before reading
  files because Deno resolved the root configuration and rejected its legacy workspace shape in
  this command path.
- **Source:** S2 scoped wrapper runs.
- **Expected:** `run-deno-lint.ts --root <package>` and `run-deno-fmt.ts --root <package>` validate
  the selected package.
- **Actual:** Both wrappers reported a tooling failure: `Failed to parse "workspace"
  configuration`; no lint or format finding was produced.
- **Severity:** significant gate-tooling drift.
- **Action:** add an optional `--config <package>/deno.json` passthrough to both existing wrappers,
  test the wrapper behavior, and rerun every affected package successfully with its explicit config.
- **Evidence:** initial failed wrapper output plus green explicit-config runs for MCP, saga-core,
  streams-core, and Fresh UI.

## 2026-07-31 — Fresh UI test task lacks permissions required by two owned tests

- **What:** The checked-in Fresh UI `test` task grants only read permission, while two Markdown
  renderer tests create temporary directories.
- **Source:** `deno task --config packages/fresh-ui/deno.json test` during S2.
- **Expected:** The package task runs its complete suite.
- **Actual:** 164 tests passed and 2 failed with `NotCapable` before assertions. The same complete
  166-test selection passed with `--allow-all` and the same lockfile.
- **Severity:** minor pre-existing task drift.
- **Action:** report the task failure honestly; use the explicit-permission rerun as S2 behavior
  evidence without changing the unrelated task definition.
- **Evidence:** S2 worklog gate table.

## 2026-07-31 — Shared-worktree writer populated the S3 documentation slice

- **What:** A concurrent writer edited the planned documentation, process-skill, fixture, and
  generated CLI-asset surfaces while this implementation session was active.
- **Source:** Worktree changes appeared during S2/S3 without being authored by this session.
- **Expected:** One implementation writer owns each slice.
- **Actual:** The edits matched the locked S3 scope. This session reviewed the complete diff,
  corrected remaining maturity-language and census issues, regenerated the Claude skill mirror and
  embedded CLI asset through their native generators, and ran the owned gates before accepting it.
- **Severity:** significant coordination drift; no scope expansion.
- **Action:** preserve reviewed in-scope work, reject no user-owned changes, and commit the S3 slice
  only after deterministic generators and scoped validation are green.
- **Evidence:** S3 diff review and gate table in `worklog.md`.

## 2026-07-31 — Augment found filesystem-dependent lock discovery

- **What:** Adjacent member lock discovery used filesystem existence rather than Git ownership.
- **Source:** Augment review of `bump-version.ts`; owner verified the finding as relevant.
- **Expected:** Release-cut file discovery is deterministic across clean and developer checkouts.
- **Actual:** A locally generated untracked member `deno.lock` could enter the bump result and then
  be staged by `cut.ts`.
- **Severity:** significant release-surface correctness defect.
- **Action:** derive lockfile inclusion from `git ls-files`; preserve tracked root/member lock
  behavior and add a regression proving an untracked adjacent lock is excluded.
- **Evidence:** final-review commit and focused bump-version test in `worklog.md`.

## 2026-07-31 — Automated MiniMax evaluation exhausted its iteration budget

- **What:** Docs OpenHands evaluation run `30665250464` ended with verdict `NONE` and
  `synthesized-after-iteration-limit` after exactly 100 iterations.
- **Source:** owner evaluation of the MiniMax trace.
- **Expected:** The automated evaluator has enough iterations to complete its review.
- **Actual:** The workflow budget was 100 despite the shared runner supporting 50–3000.
- **Severity:** significant evaluation-operability drift.
- **Action:** raise `OPENHANDS_ITERATIONS` to the owner-directed value 400; leave env-derived
  reporting unchanged.
- **Evidence:** final-review workflow diff.

## 2026-07-31 — Tracked-only discovery broke non-Git release fixtures

- **What:** The first tracked-lock fix required every discovery root to be a Git worktree.
- **Source:** CI failures in release cut and publish-readiness temp-directory fixtures.
- **Expected:** Real checkouts exclude untracked locks; isolated non-Git fixtures retain their
  prior existing-lock semantics.
- **Actual:** `git ls-files` failed with `not a git repository` before fixture assertions ran.
- **Severity:** significant validation regression.
- **Action:** explicitly select two modes: tracked-only inside a verified Git worktree and
  existence-based lock discovery outside Git. Continue to throw for all other Git failures.
- **Evidence:** six bump-version tests, the named cut regression, and all 13 publish-readiness tests.
