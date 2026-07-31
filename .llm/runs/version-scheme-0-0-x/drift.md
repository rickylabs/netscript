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
