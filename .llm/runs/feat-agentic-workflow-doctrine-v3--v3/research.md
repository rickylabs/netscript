# Research — Agentic Workflow Doctrine V3

Status: IN PROGRESS (Opus research lanes launched 2026-07-04; findings land here).

## Bootstrap findings

- F1: `.gitignore` excludes `.llm/tmp/` entirely → v2 run dirs are invisible on GitHub. V3 must
  relocate run dirs to a tracked path (`.llm/runs/`) for mobile review + committed `workflow.js`.
- F2: Doctrine proposal = issue **#306** ([S5] Harness + skills revamp): lane-policy.md (surface +
  model bindings, generator≠evaluator-session as the invariant), hard gates (e2e-cli-prod,
  scaffold.runtime, release-gate class), delete `.llm/harness/profiles/sagas|triggers/**` (12 stale
  files), rewrite ARCHETYPE-5 to thin-plugin model, scrub Copilot/Augment residue, fold JSR/OpenHands
  gotchas into skills, tooling.md + agentic task aliases, arch-debt reconcile, frontmatter fixes.
- F3: #387 (open, `status:triage`): gate issue closure on verified acceptance — V3's stage-label +
  DoD + closing-keyword mechanics are the enforcement surface.
- F4: gh CLI is WSL-only here (`wsl -u codex bash -lc`, neutral cwd); Windows PATH has no gh.
  Repo slug is `rickylabs/netscript`.

## Lanes

- R1 (Opus): repo inventory — skills, `.llm/tools/**`, `.llm/harness/**`, commits.md references,
  stale/duplicate candidates, hardcoded `.llm/tmp/run` paths. **[DONE — folded below]**

## R1 findings — repo inventory (2026-07-04)

**Premise corrections (important):**
- `.llm/harness/profiles/{sagas,triggers}/**` (#306's 12-file delete) **DOES NOT EXIST** in baseline
  — already gone. Drop that delete slice; re-confirm what #306 actually targets (SKILL still uses
  "profiles" only as an intent-hint word).
- `.llm/runs/` **already exists** (holds this run) → run-dir move is text/template repath, not a
  new-dir creation.

**Skills (17, mirrored 1:1; sync = `agentic:sync-claude:check`):** none are PRUNE — all live. UPDATE
set: `netscript-harness` (core V3 rewrite: commits.md refs, `.llm/tmp/run`, Copilot/Augment L47,
"v2"/profile framing), `openhands-handoff` (Copilot/Augment L17/56), `agent-handoff.md`,
`netscript-cli`+`netscript-tools` (desc "Copilot"), `fresh-ui-horizontal` (commits.md +
`.llm/tmp/run`). Frontmatter name≠dir: **`deno-fresh`→name `deno-frontend`**, **`design`→name
`frontend-design`** (fix `.agents`, then `agentic:sync-claude` propagates). Keep `status:augment-
review` label (real advisory label) unless owner retires it.

**`.llm/tools` (42 tasks):** wrappers `run-deno-check|lint|fmt.ts` wired + AGENTS-cited (mandatory
candidates); `run-deno-doc-lint.ts` + `run-publish.ts` NOT task-wired (wire or cite). `deps/*` all
wired. **`agentic/` suite: 10 supervisor tools documented in README but NO task alias**
(launch-codex-slice, codex-status/watch/resume, dispatch-openhands, openhands-status, gh-pr,
gh-watch, gh-token, agentic-lib) → add `agentic:*` aliases (#306's "document orphans"). `watch-run.ts`
watches `commits.md`/`worklog.md` — MUST edit in the commits.md-drop slice or supervisor-wake
degrades.

**`.llm/harness/` (53 files):** `workflow/commit-tracking.md` = whole-file commits.md mechanism
(delete/rewrite). **`gates/fitness-gates.md` names 13 fitness scripts that DO NOT EXIST** in
`.llm/tools/fitness/` — worst doc-vs-reality gap; own slice. ARCHETYPE-5 = #306 rewrite target.

**commits.md blast radius (removal scope, 13 files):** `AGENTS.md`, `.llm/tools/watch-run.ts`,
`.llm/tools/README.md`, `workflow/commit-tracking.md`, `workflow/{supervisor,retrieval-order,run-
loop,activation,agent-handoff}.md`, `templates/{implement,agent-briefing,commits}.md`,
`evaluator/protocol.md`, `harness/README.md`, `netscript-harness` SKILL (+mirror, ~6 refs),
`fresh-ui-horizontal` SKILL (+mirror). Leave the agentic fixture log.

**`.llm/tmp/run` refs:** 44 files; migration-relevant subset ~30 (harness workflow/templates/
lessons/evaluator/README, `.agents/rules/harness-workflow.mdc`, AGENTS.md, AGENTS-handoff.md, 4
skills +mirrors, watch-run.ts, tools/README, `.github/workflows/openhands-agent.yml`,
`pull_request_template.md`, CONTRIBUTING.md). Some `fitness/*` scripts embed `.llm/tmp/run` output
paths — verify before mass sed.

**Templates changing:** delete `commits.md`; repath `agent-briefing.md`/`implement.md` + all
run-dir names to `.llm/runs/`; ADD supervisor-identity template + workflow.js storage note.

**Copilot/Augment residue (7 files):** `AGENTS-handoff.md` (L4/20/77), `openhands-handoff` SKILL
(L17/56 +mirror), `netscript-harness` SKILL L47 (+mirror), `workflow/agent-handoff.md` (L4/12),
`netscript-cli`+`netscript-tools` desc, `git-verify.ts` L21 (benign example).

**validate/sync:** `validate-claude-surface.ts` (`agentic:check-claude`) + `sync-claude-skills.ts`
(`agentic:sync-claude[:check]`) — neither touches commits.md/`.llm/tmp/run`, so the move+drop won't
break them; sync auto-propagates frontmatter fixes.

**Extra stale/orphan (judgment):** `.llm/temp/` stray dir (measure-*.ts) vs canonical `.llm/tmp/`;
loose dated `.llm/2026-06-11-*.md` scratch; ~28 unwired `fitness/` scripts (audit, don't blind-
delete); root `AGENTS-handoff.md` duplicates `agent-handoff.md`/`openhands-handoff` (consolidate).
- R2 (Opus): GitHub-state — #306/#305/#387 full threads, labels.yml status taxonomy fit, recent-PR
  label usage, open issues V3 should absorb. **[DONE — folded below]**

## R2 findings — GitHub state (2026-07-04)

- **#306** (OPEN, milestone `0.0.1-stable`, 0 comments — all direction in body). Lane policy is the
  headline: `workflow/lane-policy.md` = single source for surface+model bindings; **only hard
  invariant is generator-session ≠ evaluator-session** — the "Claude never implements / OpenHands
  only" dogma is explicitly retired, lane configurable. Mandates: hard gates (e2e-cli-prod,
  scaffold.runtime, release-gate class) + a **Release phase** in run-loop; delete
  `profiles/sagas|triggers/**` (12 files); rewrite ARCHETYPE-5 (thin-plugin, highest content
  defect); scrub Copilot/Augment; agent-handoff output contract → OPENHANDS_RUN_DIR/TRACE_DIR;
  frontmatter name=dir fixes (deno-fresh/design); `workflow/tooling.md` + `agentic:*` aliases;
  document gh-watch.ts/gh-token.ts. Acceptance: `sync-claude-skills --check` +
  `validate-claude-surface` green. **Beta gate.**
- **#305** (OPEN, `rfc`, milestone `0.0.1-stable`) — BOUNDARY: owns the `docs/architecture/doctrine/
  01..11-*.md` rewrite + fitness-registry-as-SoT + doctrine numbering/ref-migration + `check-*.ts`
  rewiring of `arch:check`. V3 must NOT edit doctrine prose; V3 gate wiring must stay CONSISTENT
  with #305, not redefine. **User-ratified comment:** `--allow-slow-types` is a sanctioned doctrine
  exception for oRPC-bound packages (`@netscript/contracts`, plugin `-core`/`services` on the base
  seam) — V3 gate defs must not re-flag it there.
- **#387** (OPEN, milestone `0.0.1-beta.3`) — close-gate mechanism: coordinator/evaluator MUST
  verify every acceptance + `gate:` checkbox is checked+evidenced before closing an issue / before a
  `Closes #N` PR merges; block `status:ready-merge` while referenced issue has unchecked `- [ ]`
  boxes; codify a close-gate section in netscript-pr. Exemplar failure: #260 closed with unchecked
  `gate:e2e`.
- **Labels:** `.github/labels.yml` `status:*` = triage, research, plan, plan-eval, impl, impl-eval,
  augment-review, ci-fail, ready-merge — **live == labels.yml, all 7 V3 stages already exist. Zero
  new labels needed.** V3's job is ENFORCING single-status-through-lifecycle (OD1 resolved).
- **Practice audit (~50% compliance):** 7/15 recent merged PRs shipped with ZERO labels; `status:`
  frozen mid-lifecycle (#374/#373 merged still `status:plan`); only #383 had correct
  `status:ready-merge`. Closing keywords correct where used. → the guardrail V3 adds is real and
  needed.
- **Epic naming:** mixed (`Epic:` dominant for top-level; `[epic]` #327; `[S#]` slices under #301;
  `[AI-stack E#]`/`[Deploy-S#]` sub-prefixes). **Native GitHub sub-issues UNUSED** (#301
  `subIssues.totalCount: 0`) — linkage is body text + checklists. V3 epic/sub-issue standard is
  greenfield → pick ONE convention (recommend `Epic: <name>` + `[<epic-slug> S#] <slice>`), decide
  native-sub-issues adoption explicitly (OD2).
- **Coordinate (not absorb):** #307 [S6] stale-code elimination (overlaps pruning), #309 [S8]
  release gates (owns release gates V3's Release phase calls). #390/#389 landed correctly.
