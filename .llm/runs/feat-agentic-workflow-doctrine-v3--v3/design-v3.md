# V3 DESIGN — Agentic Workflow Doctrine (harness V3)

Status: PLAN-EVAL PASSED (see `plan-eval.md`); implementation in flight under the D3 lane override.
Amendment A1 (below) added post-PLAN-EVAL by owner directive — recorded in `drift.md`
D5-slice-review-gate.
Epic #389 · Draft PR #390 · Adopts #306 · Enforces #387 direction · Coordinates with #305.

> **Amendment A1 — Slice review gate (owner-directed, 2026-07-04, post-PLAN-EVAL).** New permanent,
> **lane-agnostic** harness doctrine: after an implementation sub-agent lands a slice and its
> automated gates pass, the **Tier-A supervisor performs a substantive intelligence review of the
> slice content — correctness, coherence with already-landed slices, doctrine-fit, gaps/overreach —
> BEFORE the commit that signs it off**; the sign-off commit is the supervisor's, not the
> implementer's. This applies to every implementation tier (B Opus sub-agents, C Workflow-generated
> slices, D WSL Codex) — **no lane self-certifies**. Codified in S2 (`workflow/lane-policy.md`
> invariant + `netscript-harness` SKILL reference) and S5 (`workflow/run-loop.md` step between
> automated gates and sign-off commit). Scope impact: minor additions to S2/S5; slice count
> unchanged.

## 1. Problem

Weeks of supervised agentic runs exposed recurring hygiene failures the v2 spec does not prevent:

- skills silently skipped by sub-agents;
- run artifacts live in git-ignored `.llm/tmp/run/` → invisible on GitHub/mobile, stale copies pile
  up;
- plan-only PRs merged as if implemented ("false done", #387);
- issues stranded open after their PR merged (missing closing keywords) or closed without verified
  acceptance;
- `commits.md` duplicates what draft PRs already show, and rots;
- the actual operating model (Fable supervisor / Opus research / Workflow batch / Codex impl) is
  undocumented — v2 still says "Claude coordinates, OpenHands evaluates, Codex implements" with
  hardcoded lanes (#306 calls this out).

V3 goal: **the GitHub surface (epic + draft PR + stage labels + tracked run dir) IS the process** —
fully reviewable from mobile without cloning or diffing.

## 2. Tiered agent model (lane policy)

The invariant: **generator ≠ evaluator session**. Lanes are configuration, not dogma (#306).

| Tier | Agent | Use for | Never for |
| --- | --- | --- | --- |
| A | **Fable 5 feature supervisor** | decisions, orchestration, briefs, run-dir upkeep, GitHub surface, design authoring | heavy implementation; self-certification; workflow fan-out (too expensive) |
| B | **Opus 4.8 sub-agents** | deep research, analysis, reporting, doc/doctrine authoring (per CLAUDE.md docs exception) | deciding scope; certifying their own output |
| C | **Sonnet-5-high dynamic Workflows** (steps may escalate to Opus where genuine intelligence is needed) | batch work across the codebase, parallel deep search, parallel refactor/mechanical edits | anything whose `workflow.js` is not persisted+committed in the run dir first |
| D | **WSL Codex GPT-5.5-high** | framework/plugin/harness-tool SOURCE edits, extremely long refactors, deterministic coding, housekeeping, side quests, parallel verification | detached/headless runs when supervision is expected |
| E | **OpenHands** (separate session) | PLAN-EVAL and IMPL-EVAL per-domain verdicts | generation |

Selection rules:

1. Source-code slices (packages/, plugins/, .llm/tools TS) → Tier D, daemon-attached
   (`send-message-v2` via `launch-codex-slice.ts`; steer via `codex-resume.ts`; watch via
   `codex-watch.ts` git+turn modes). Record per slice: worktree, thread id, steering command.
2. Batch/parallel mechanical work spanning many files → Tier C Workflow. HARD RULE: copy the
   generated `workflow.js` into `<run-dir>/workflows/<slice>-workflow.js` and commit BEFORE
   executing the workflow. A workflow whose script is not in the run dir does not run.
3. Research/analysis/synthesis and doc prose → Tier B (report to supervisor; supervisor decides).
4. Skills + `.llm/tools/agentic/` are the ONLY interface for Tier D (never ad-hoc `wsl.exe`); every
   brief starts with `use harness` and carries a `## SKILL` chapter.
5. Model routing per CLAUDE.md: never route Workflow stages to Fable 5; Fable is the supervisor.

## 3. Run dir mechanics

- **Location: `.llm/runs/<run-id>/` — TRACKED** (v2's `.llm/tmp/run/` is git-excluded; that made
  runs unreviewable — the root cause of stale-artifact drift). `.llm/tmp/` stays for scratch only.
- **`supervisor.md` (mandatory, written at start):** supervisor agent identity — model, session
  id/URL, host, checkout + worktree disk paths, branch, baseline SHA, lane table. Other supervisors
  cross-peek by reading this file.
- **Mandatory artifacts:** `supervisor.md`, `research.md`, `plan.md`, `design-*.md` (or `## Design`
  in worklog), `worklog.md`, `drift.md`, `context-pack.md`, `phase-registry.md` (multi-group),
  `plan-eval.md`/`evaluate.md` (evaluator-written), `workflows/` (committed workflow.js scripts).
- **`commits.md` is DROPPED.** The draft PR's commit list + per-slice PR comments are the commit
  trail. Templates, activation.md, run-loop.md, skills, and tools that reference it are updated in
  the migration slices.
- **Per-slice currency (hard rule):** worklog.md + context-pack.md updated and committed as part of
  EVERY slice — a slice whose commit does not touch the run dir is incomplete. drift.md appended the
  moment reality diverges.
- **Post-slice reconcile loop (new §):** after each slice completes → (1) sweep related issues
  (state, needed label/milestone moves, closing-keyword coverage on the resolving PR), (2) read new
  issue/PR comments since last sweep, (3) record plan readjustments in plan.md/drift.md. One
  reconcile note per slice in worklog.md.

## 4. GitHub surface

- **Draft-PR-on-start:** opening a feature = opening a DRAFT PR in the same working session as the
  first commit (run-dir bootstrap is a natural first commit). Body carries: Definition-of-Done
  (explicit, checkable), run-dir path, slice checklist, live commit list, drift/debt.
- **Stage labels** = existing `status:` taxonomy, moved in the same action as the phase comment:
  `status:research → status:plan → status:plan-eval → status:impl → status:impl-eval →
  status:augment-review (optional advisory) → status:ready-merge`. Exactly one at a time.
- **Merge / close guardrail (#387 close-gate):** a PR whose `status:` is research/plan/plan-eval
  MUST NOT be merged; merging requires `status:ready-merge`, which requires IMPL-EVAL PASS evidence
  (phase comment) + DoD checklist complete + **every referenced issue's acceptance and `gate:`
  checkbox checked with linked evidence** (the #387 mechanism; exemplar failure #260 closed with
  `gate:e2e` unchecked). A plan-only artifact set can never satisfy an impl DoD. Codified as a
  **close-gate section in `netscript-pr`** beside the closing-keyword standard. Enforcement now:
  netscript-pr + evaluator protocol + PR-template checkbox; future: Phase-D label automation blocks
  ready-merge/auto-close while any `- [ ]` remains.
- **Epic standard:** title `Epic: <name>`; labels `type:umbrella` + `epic:<slug>` + area/priority +
  milestone; body = pillars + sub-issue checklist + links; NEVER a closing keyword targeting an
  epic. Sub-issues: real issues titled `[<epic-slug> S<n>] <slice>`, each carrying
  `epic:<slug>`, resolved by exactly one PR whose body carries `Closes #N`; epic closes by hand
  when all children are done. (GitHub native sub-issue linkage: pending R2 finding.)
- **Phase comments:** one structured comment per phase transition (netscript-pr format), including
  PLAN-EVAL/IMPL-EVAL verdicts posted by the evaluator session.

## 5. Doctrine adoption from #306

Folded into V3 scope (verbatim from the issue, re-validated by R1):

- `workflow/lane-policy.md` — single source for surface+model bindings; generator≠evaluator-session
  as the invariant (supersedes hardcoded lane dogma). §2 above becomes this file.
- Hard gates: `e2e-cli-prod` + `scaffold.runtime` + release-gate class into gate docs; Release
  phase in run-loop.
- ~~Delete `profiles/sagas|triggers/**`~~ — **R1: already absent in baseline; no-op, dropped from
  scope.** ARCHETYPE-5 rewrite to thin-plugin model still applies (highest content defect).
- Scrub Copilot/Augment residue; rewrite agent-handoff output contract to
  OPENHANDS_RUN_DIR/TRACE_DIR + dispatch-openhands/openhands-status.
- Fold JSR gotchas into `jsr-audit`; OpenHands concurrency-cancel + lock-churn into
  `openhands-handoff`.
- Hygiene: arch-debt reconcile, frontmatter name=dir fixes, `workflow/tooling.md`, `agentic:*`
  task aliases, document `gh-watch.ts`/`gh-token.ts`, SCOPE-frontend `fresh/ai`.

(ARCHETYPE-5 rewrite touches framework doctrine content → Tier D or B per slice map; boundary with
#305 confirmed by R2.)

## 6. Tooling mandates

- `.llm/tools/run-deno-check|lint|fmt.ts` + `.llm/tools/deps/*` (via `deno task deps:*`) are
  **MANDATORY** for check/lint/fmt/dependency evidence in any harness run. Raw root `deno fmt
  --check`/registry curls are non-verdicts. Wrappers reviewed to prod-readiness (slice).
- `.llm/tools/agentic/` is the only Tier-D/E driving surface; `rtk` prefixes read-heavy git/gh/grep.
- Supervisor wake is event-driven (`watch-run.ts`, `codex-watch.ts`, `gh-watch.ts`) — no polling.

## 7. Skills: never skipped

- Every brief (Workflow prompt, Codex brief, OpenHands trigger, sub-agent prompt) MUST begin with
  `use harness` and carry a `## SKILL` chapter naming each relevant skill — checked at PLAN-EVAL
  and IMPL-EVAL (evaluator protocols get an explicit checklist line).
- Harness activation checklist gains: "briefs carry SKILL chapters" + "run dir has supervisor.md".
- Stale skills pruned per R1; `.claude/skills/` stays generated (sync check in gates).

## 8. Migration slices (finalized against R1 blast-radius)

S1 = this design doc → PLAN-EVAL (hard stop). On PASS, sub-issues `[harness-v3 S2..S8]` filed under
#389, then:

- **S2 — lane policy + tiered model** (Tier D Codex; doc-heavy parts Tier B). New
  `workflow/lane-policy.md` (§2 tiering + model bindings; invariant generator≠evaluator-session;
  **+A1: lane-agnostic Slice review gate invariant — no implementation lane B/C/D self-certifies;
  Tier-A supervisor reviews substantively before the sign-off commit**);
  add tiered-agent model + supervisor-identity requirement + **A1 Slice-review-gate reference** to
  `netscript-harness` SKILL, re-baseline
  its "v2"/profile framing. Gate: `agentic:check-claude` + `agentic:sync-claude:check`.
- **S3 — run-dir relocation** (Tier C Workflow; workflow.js committed first). Repath
  `.llm/tmp/run/` → `.llm/runs/` across the ~30 migration-relevant files (harness workflow/templates/
  lessons/evaluator/README, `.agents/rules/harness-workflow.mdc`, AGENTS.md, 4 skills +mirrors,
  watch-run.ts, tools/README, `.github/workflows/openhands-agent.yml`, `pull_request_template.md`,
  CONTRIBUTING.md). Keep historical `.llm/tmp/run/` runs in place (OD4). Add supervisor-identity
  template + workflow.js-storage note to templates. Gate: sync check + grep-zero of stale non-legacy
  refs.
- **S4 — drop commits.md** (Tier D Codex). Delete `templates/commits.md` + rewrite/retire
  `workflow/commit-tracking.md`; scrub the 13-file blast radius; edit `watch-run.ts` to watch
  `worklog.md` only (same slice). Update `evaluator/protocol.md` + `netscript-harness` SKILL artifact
  table. Gate: check wrapper on watch-run.ts + sync check.
- **S5 — GitHub-surface codification** (Tier B/D). Draft-PR-on-start + stage-label lifecycle +
  #387 close-gate + epic/sub-issue standard (`Epic:` + `[<epic-slug> S#]`, OD2) into `netscript-pr`;
  add reconcile-loop + Release-phase + **A1 Slice-review-gate step (between automated gates and the
  sign-off commit, all implementation tiers)** to `run-loop.md`/`evaluator/protocol.md`; PR/issue
  template close-gate checkbox. NO new labels (OD1). Gate: sync check.
- **S6 — tooling mandates + aliases** (Tier D Codex). Make `run-deno-check|lint|fmt` + `deps/*`
  mandatory in `netscript-tools` + `netscript-deno-toolchain` + harness gate docs; add `agentic:*`
  task aliases for the 10 unwired supervisor tools; wire/cite `run-deno-doc-lint.ts`; document
  `gh-watch.ts`/`gh-token.ts`; new `workflow/tooling.md`. Wrapper prod-readiness review. Gate:
  `deno task check` on touched TS + the new aliases resolve.
- **S7 — Copilot/Augment scrub + frontmatter + fitness-gates drift** (Tier C Workflow, parallel;
  workflow.js committed first). Scrub the 7 residue files; agent-handoff output contract →
  OPENHANDS_RUN_DIR/TRACE_DIR; fix `deno-fresh`/`design` frontmatter name=dir; **rewrite
  `gates/fitness-gates.md`** to the real script set (or, if scope grows, file the fitness-tool audit
  as a #307-coordinated follow-up). Gate: sync check + `agentic:check-claude`.
- **S8 — scrub residue + ARCHETYPE-5 + fold gotchas + close** (Tier B/D). Prune `.llm/temp/` +
  loose dated `.llm/*.md`; consolidate `AGENTS-handoff.md`; fold JSR gotchas → `jsr-audit`,
  OpenHands concurrency/lock-churn → `openhands-handoff`; ARCHETYPE-5 thin-plugin rewrite
  (coordinate #305 boundary — no doctrine-prose edits). Then full-surface gates + IMPL-EVAL
  (OpenHands, per-domain). ~28 unwired fitness scripts = audit-only, coordinate #307 (not deleted
  here).

Slice count 8 (< 30). Each slice: own PR comment + run-dir currency + reconcile note; source slices
= Tier D Codex daemon-attached; batch/parallel = Tier C Workflow with committed workflow.js.

## 9. Risk register

| Risk | Mitigation |
| --- | --- |
| Collision with #305 doctrine-revamp lane | R2 boundary map; V3 does not edit `docs/architecture/doctrine/` content except cross-references; ARCHETYPE-5 slice checks #305 state first |
| Run-dir relocation breaks tools/docs with hardcoded `.llm/tmp/run` | R1 blast-radius grep drives an exhaustive S4 sweep; v2 path kept readable as legacy note |
| commits.md removal breaks evaluator protocol expectations | evaluator docs updated in the same slice; OpenHands briefs updated |
| Label churn strips live issues | never delete labels; only add/extend labels.yml |
| Workflow scripts leak secrets/paths | workflow.js reviewed by supervisor before commit |
| Big-bang temptation | slice-per-PR-comment cadence; PLAN-EVAL hard stop honored |

## 10. Open decisions sweep

- OD1 — final `status:` label set — **RESOLVED (R2): zero new labels.** All 7 V3 stages already
  exist in labels.yml and live matches exactly. V3 codifies ENFORCEMENT of single-status-through-
  lifecycle (practice audit shows ~50% of merged PRs unlabeled or frozen at `status:plan`).
- OD2 — GitHub native sub-issues vs checklist linkage — **RESOLVED (R2): native sub-issues are
  UNUSED repo-wide (#301 totalCount 0).** V3 standard = `Epic: <name>` + `[<epic-slug> S#] <slice>`
  child issues linked by `Part of #<epic>` body text + epic checklist + `Closes #<child>` on the
  resolving PR. Native sub-issue linkage adopted opportunistically (nice-to-have), not required —
  no migration burden.
- OD3 — lane-policy model IDs location — **RESOLVED: `workflow/lane-policy.md` with named model
  bindings** (Fable/Opus/Sonnet-5/Codex GPT-5.5/OpenHands minimax-M3 + qwen-3.7-max), per #306's
  configurable-lane intent; only hard invariant = generator-session ≠ evaluator-session.
- OD4 — historical `.llm/tmp/run/` runs — **RESOLVED: keep historical in place (readable), new runs
  only under tracked `.llm/runs/`.** No migration of old runs.
- OD5 (new, R2) — `--allow-slow-types` oRPC exception: V3 gate/jsr-audit wording must NOT re-flag
  slow-types on oRPC-bound `-core`/`services`/`contracts`. Honor #305's user-ratified exception;
  do not redefine it (that's #305's lane) — reference only.
- OD6 (new, R2) — #305 boundary: V3 adds the Release phase + names hard gates (e2e-cli-prod,
  scaffold.runtime, release-gate class) but WIRES to #309's release-engineering + stays consistent
  with #305 fitness numbering; V3 does not rewrite doctrine prose or the fitness registry.

## 11. Coordination map (R2)

| Issue | Relationship | V3 action |
| --- | --- | --- |
| #306 [S5] | ADOPT | fold all body directives into V3 spec; this PR is its impl |
| #305 [S4] | COORDINATE (boundary) | no doctrine-prose edits; consistent gate wiring; honor slow-types exception |
| #387 | ENFORCE | close-gate in netscript-pr + ready-merge guardrail + evaluator checklist |
| #307 [S6] | COORDINATE (overlap) | stale-skill/tool pruning; avoid double-deleting files S6 owns |
| #309 [S8] | REFERENCE | Release phase CALLS #309 release gates, does not redefine |
