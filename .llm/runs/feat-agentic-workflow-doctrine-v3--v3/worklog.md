# Worklog — Agentic Workflow Doctrine V3

Run dir: `.llm/runs/feat-agentic-workflow-doctrine-v3--v3/` · Supervisor: see `supervisor.md`.

## 2026-07-04 — Bootstrap

- Skills loaded: `netscript-harness`, `netscript-pr` (+ `activation.md`, `run-loop.md` read).
- Located the doctrine proposal the owner referenced: **#306 "[S5] Harness + skills revamp"**
  (lane-policy, gate hardening, stale profile deletion, skill/tool hygiene). Adjacent: #305
  (Architecture Doctrine revamp — framework doctrine, separate scope), #387 (false-closed
  acceptance guardrail — folded into V3 stage-label/DoD design).
- Baseline: worktree `.llm/tmp/wt-harness-v3` on `feat/agentic-workflow-doctrine-v3` @ `1b42ba88`.
- Key bootstrap finding: `.llm/tmp/` is git-excluded → v2 run dirs (`.llm/tmp/run/`) are
  unreviewable from GitHub/mobile. V3 dogfoods tracked run dirs under `.llm/runs/` (drift.md D1).
- Epic **#389** created (`type:umbrella`, `epic:harness-v3` [new label], `area:tooling`,
  `priority:p1`, milestone `0.0.1-stable`). Draft PR **#390** opened at start with DoD + run-dir
  path + `status:research` stage label.
- Push path note: Windows worktree has no working credential helper in this session → pushes go
  bundle → WSL clone (`netscript-206-registry`) → `git push origin <local>:refs/heads/<branch>`
  (explicit refspec per upstream-tracking landmine).
- G1 research launched: R1 (Opus, repo inventory: skills/tools/harness staleness, commits.md +
  `.llm/tmp/run` blast radius) and R2 (Opus, GitHub-state: #306/#305/#387 threads, labels.yml
  status taxonomy fit, PR practice audit, epic naming reality).
- Supervisor pre-reads while G1 runs: `gates/plan-gate.md`, `workflow/supervisor.md`,
  `codex-wsl-remote` launch model + agentic-suite table.

## 2026-07-04 — Research complete

- R2 (GitHub-state) + R1 (repo inventory) both returned; folded into `research.md`.
- Key premise correction (R1): `.llm/harness/profiles/{sagas,triggers}` already absent → #306's
  12-file delete is a no-op, dropped from scope. `.llm/runs/` already exists → run-dir move is a
  text/template repath.
- Key constraints (R2): only hard invariant = generator-session ≠ evaluator-session (#306 retires
  the OpenHands-only dogma); zero new labels needed (all 7 stages exist, OD1 resolved); native
  sub-issues unused repo-wide (OD2 → checklist standard); honor `--allow-slow-types` oRPC exception
  (#305, OD5); #305 doctrine-prose is out of bounds (OD6); #387 close-gate = acceptance-box
  verification (folded into §4 guardrail).
- All 6 open decisions resolved in design §10. Slice map finalized to 8 slices (§8) against R1's
  exact blast-radius (commits.md 13 files, `.llm/tmp/run` ~30 files, Copilot/Augment 7 files).

## Design

The V3 Design checkpoint is the dedicated artifact **`design-v3.md`** (public surface = harness spec
+ skills + tooling + GitHub process; domain vocabulary = tiers A–E + `status:` stage lifecycle;
constants = the fixed stage set + lane/model bindings; commit slices = §8 S2–S8; deferred scope =
§8 notes + ~28 unwired fitness scripts audit → #307). Every file a slice will touch traces to a
concept named in `design-v3.md` §5/§8. Ready for PLAN-EVAL (OpenHands, separate session).

## 2026-07-04 — S1 pushed + PLAN-EVAL dispatched

- S1 committed `1b025afa` (research + design), pushed to origin via bundle→WSL(206-registry)→origin.
- PR #390: RESEARCH+PLAN phase comment posted (issuecomment-4881023435); stage label advanced
  `status:research` → `status:plan-eval`.
- **PLAN-EVAL dispatched** to a SEPARATE OpenHands session (minimax-M3 requested) via
  `@openhands-agent` PR-comment trigger (issuecomment-4881027719). Evaluator will read
  plan-protocol + plan-gate + research.md + design-v3.md, write `plan-eval.md`, and comment
  `[PHASE: PLAN-EVAL] [VERDICT: …]`. **HARD STOP: no implementation slice (S2–S8) until PASS.**
- Watch-and-act: await PLAN-EVAL verdict → on PASS, file `[harness-v3 S2..S8]` sub-issues under
  #389, advance label to `status:impl`, launch S2 (Tier D Codex daemon slice) + S3/S7 (Tier C
  Workflows, workflow.js committed first). On FAIL_PLAN, revise design and re-dispatch (2 cycles).

## 2026-07-04 — PLAN-EVAL PASS → Implementation phase (lane override)

- **PLAN-EVAL verdict: PASS** (OpenHands minimax-M3, separate session; `plan-eval.md`). Zero of two
  FAIL_PLAN cycles used. Checklist all-green (research current, 5 decisions locked, 6 ODs resolved,
  slices <30, risk register, gate set, deferred scope explicit). Adversarial V3 checks all ✅.
- **Owner directive (lane override):** the **supervisor stays Fable 5** (unchanged); implementation
  of ALL slices S2–S8 runs on **Opus 4.8 sub-agents** (not the design's Tier-D Codex / Tier-C
  Workflow lanes), given V3's high importance. **WSL Codex = final adversarial validation before
  IMPL-EVAL** only. IMPL-EVAL stays OpenHands (separate session). See `supervisor.md` Phase 2.
- Delivery model: single PR **#390** carries S2–S8 as sequential commits, one PR comment per slice,
  run-dir currency (`worklog.md` + `context-pack.md`) touched every slice, reconcile note per slice.
- `#390` stage label advanced `status:plan-eval` → `status:impl`.
- Next: S2 (lane-policy + tiered model) → Opus 4.8 sub-agent, worktree `.llm/tmp/wt-harness-v3`.

## 2026-07-04 — Pre-S2 currency (commit `f220e0c2`)

- **plan-eval.md transcribed** (drift D4): the PLAN-EVAL OpenHands job errored before its artifact
  landed, but posted a PASS verdict (issuecomment-4881028564). Supervisor transcribed it faithfully
  with a provenance note (transcription, not self-certification). Session separation intact.
- **Amendment A1 recorded** (drift D5-slice-review-gate, design-v3.md top + §8 S2/S5): owner-directed
  post-PLAN-EVAL scope addition — permanent, **lane-agnostic Slice review gate** (no implementation
  lane B/C/D self-certifies; Tier-A supervisor substantively reviews before the sign-off commit).
  Codified in S2 (lane-policy invariant + SKILL ref) and S5 (run-loop step). Slice count unchanged.

## 2026-07-04 — S2 landed (lane policy + tiered model)

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **Files**: NEW `.llm/harness/workflow/lane-policy.md` (single source: Tier A–E table + OD3 model
  bindings + exactly-two-invariants section incl. A1 with explicit B/C/D enumeration + selection
  rules + supervisor-identity requirement); EDITED `.agents/skills/netscript-harness/SKILL.md`
  (retire hardcoded lane dogma → defer to lane-policy; add Slice-review-gate + supervisor-identity
  rows/checklist items; re-baseline v2→V3, incl. frontmatter `v2 runs`→`runs`); regenerated mirror
  `.claude/skills/netscript-harness/SKILL.md`.
- **Supervisor review (A1 gate)**: read full diff + lane-policy.md. Two hard invariants stated
  exactly; A1 enumerates B/C/D; dogma retired everywhere except the pitfall that explicitly retires
  it. Boundary respected — `.llm/tmp/run` paths + `commits.md` refs in untouched sections left for
  S3/S4; Copilot/Augment residue left for S7/S8. One supervisor edit: frontmatter description
  `harness v2 runs` → `harness runs` (S2 re-baseline scope; left "commit tracking" for S4).
- **Gate**: `agentic:sync-claude` (SYNCED, 1 stale mirror refreshed) → `agentic:sync-claude:check`
  OK → `agentic:check-claude` OK (all surface checks green, lock unchanged). File set matches §8-S2
  scope exactly (source SKILL + mirror + new lane-policy.md; no framework source).
- **Reconcile**: no related-issue state change needed (S2 touches no issue acceptance boxes; #306
  remains open, resolved cumulatively by this PR). No new labels. Commit sha `f33141fd` (+ currency
  `dca28ee9`).

## 2026-07-04 — S3 landed (run-dir relocation)

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **What**: relocated the harness run-dir convention `.llm/tmp/run/<run-id>/` (git-ignored) →
  `.llm/runs/<run-id>/` (tracked) — drift D1's root-cause fix. 15 source files repathed: harness
  `workflow/{activation,agent-handoff,commit-tracking,supervisor,retrieval-order}.md`,
  `evaluator/protocol.md`, `README.md`, `templates/{agent-briefing,implement}.md`, `AGENTS.md`,
  `.agents/rules/harness-workflow.mdc`, `.github/pull_request_template.md`, and 3 skills
  (`netscript-harness`, `netscript-pr`, `fresh-ui-horizontal`). 3 mirrors regenerated. Templates
  also gained the §3 supervisor.md-first + `workflows/<slice>-workflow.js`-before-run notes (pointing
  to `lane-policy.md`). The SKILL `.llm/tmp` Path Caveat renamed to `.llm/runs` with a legacy note.
- **Supervisor review (A1 gate)**: read the full classified grep hit list + all 15 diffs. Template
  additions correct (point to lane-policy, do not restate). Boundary respected: `commits.md` tokens
  left intact for S4 (only the co-located path repathed); Copilot/Augment residue left for S7;
  OpenHands trace-output paths (`.github/workflows/openhands-agent.yml`, `openhands-handoff` L103)
  left as a distinct live convention for the S7 agent-handoff contract; 6 `fitness/*.ts` output
  defaults left under `.llm/tmp/` (ephemeral audit scratch, source-behavior change out of S3 scope).
- **Gate**: `agentic:sync-claude` (SYNCED, 3 stale mirrors refreshed) → `agentic:sync-claude:check`
  OK. **grep-zero of stale non-legacy convention refs holds** — all residual `.llm/tmp/run` hits are
  OD4 concrete historical run-ids (`supervisor.md` L9, `lessons/*`, `debt/arch-debt.md` — evidence
  links, not the convention placeholder), the OpenHands trace convention, or the one intentional
  legacy note. `watch-run.ts`/`CONTRIBUTING.md`/`tools/README.md` were no-ops (no hardcoded base
  path).
- **Reconcile**: no related-issue state change. `commits.md` drop remains S4; watch-run.ts `--files`
  default remains S4. Commit sha `57ce8d75`.

## 2026-07-04 — S4 landed (drop commits.md)

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **What**: dropped the `commits.md` run-artifact mechanism entirely (design §3, drift D2) — in V3
  the draft-PR commit list + per-slice PR comments are the commit trail. DELETED
  `templates/commits.md` + `workflow/commit-tracking.md` (1 live inbound link, de-linked; its two
  still-valid non-commits.md crumbs — "message names what the slice proves" + the dirty-worktree
  `git status --short` rule — folded into `run-loop.md` §5). Scrubbed the 13-file blast radius
  (AGENTS.md, tools/README, harness `workflow/{run-loop,activation,supervisor,retrieval-order,
  agent-handoff}.md`, `templates/{implement,agent-briefing}.md`, `evaluator/protocol.md`, harness
  README, `netscript-harness` + `fresh-ui-horizontal` SKILLs) replacing "append commits.md" with the
  PR-comment trail. Repointed `evaluator/protocol.md` IMPL-EVAL reading from `commits.md` → draft-PR
  commit list + per-slice PR comments.
- **The one TS edit**: `.llm/tools/watch-run.ts` default watched-file set `['commits.md',
  'worklog.md']` → `['worklog.md']`; doc-comment/usage/README references updated. CLI contract,
  `Deno.watchFs` behavior, exit codes (0 change / 2 heartbeat / 1 bad-args), `--timeout-seconds`,
  and `--files` override all unchanged.
- **Supervisor review (A1 gate)**: read watch-run.ts + run-loop + protocol + implement diffs and the
  full post-edit grep. Doctrine crumbs preserved via the run-loop fold (no doctrine loss from the
  delete). Boundary respected — Copilot/Augment (S7), tooling wiring (S6) untouched; only commits.md
  concern + the single watch-run default edit.
- **Gate**: `.llm/tools/run-deno-check.ts` on watch-run.ts → 0 occurrences (EXIT 0);
  `agentic:sync-claude:check` OK (2 mirrors refreshed). `commits.md` grep over source scope = zero
  non-intentional hits (residual = deliberate "no commits.md" drop-notes + the historical
  `__fixtures__/codex-launch-s1.head.log`).
- **Reconcile**: no related-issue state change. Commit sha `d80e0bd8`.

## 2026-07-04 — S5 landed (GitHub-surface codification)

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **What**: codified the V3 GitHub surface (design §4). `netscript-pr` SKILL gained four sections
  using existing structure/voice: **Merge close-gate (#387)** (placed right after the existing
  "Linking issues" keyword law — references it, does not rewrite: no merge below
  `status:ready-merge`, which requires IMPL-EVAL PASS + complete DoD + every referenced issue's
  acceptance & `gate:` box checked+evidenced; #260 cited), **Epic / sub-issue standard** (OD2:
  `Epic: <name>` + `type:umbrella`+`epic:<slug>`, sub-issues `[<epic-slug> S<n>]` linked by
  `Part of #<epic>`, resolved by one `Closes #<child>` PR, epics never carry a closing keyword,
  native sub-issues opportunistic), **Draft-PR-on-start** (draft PR in the same session as the first
  commit; body carries checkable DoD + run-dir path + slice checklist + live commit list +
  drift/debt), **Stage-label lifecycle** (exactly one `status:` walking the existing 7-token path,
  cite ~50% practice-audit non-compliance; no new labels). `run-loop.md`: A1 slice-review step placed
  **between the named-gate bullet and the sign-off commit** in §5.2, plus a **Post-slice reconcile
  loop** subsection and a new **Release phase (§8, stub)** that names `e2e-cli-prod`/
  `scaffold.runtime`/release-gate class but REFERENCES #309/`netscript-release` (does not redefine);
  Close renumbered §8→§9, phase count 8→9. `evaluator/protocol.md`: rules 12 (close-gate honored) +
  13 (briefs/PR carry `## SKILL` chapter). `.github/pull_request_template.md`: close-gate checkbox.
  `.github/ISSUE_TEMPLATE/feature_request.yml`: epic/sub-issue convention note (templates exist — no
  new template invented).
- **Supervisor review (A1 gate)**: read all 5 diffs. Close-gate correctly ADJACENT to the keyword
  law (not a rewrite); A1 step correctly placed between automated gate and sign-off commit; Release
  phase is a call-out stub (#309 boundary honored, no gate redefinition); zero new labels/stages
  (verified tokens all pre-exist in labels.yml). Boundary respected — no commits.md/`.llm/tmp/run`
  re-churn, no Copilot/Augment scrub, no doctrine prose, no labels.yml edit.
- **Gate**: `agentic:sync-claude` (1 mirror refreshed) → `agentic:sync-claude:check` OK;
  `agentic:check-claude` OK (all surface checks green, lock unchanged).
- **Reconcile**: no related-issue state change (S5 codifies process; touches no issue acceptance
  boxes). No new labels. Commit sha `aa3e2fed`.

## 2026-07-04 — S6 landed (tooling mandates + agentic aliases)

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **What**: made the scoped tool surface **mandatory** (design §8-S6). `netscript-tools` SKILL:
  Validation Wrappers rewritten as a MANDATE (check/lint/fmt evidence MUST come from
  `run-deno-{check,lint,fmt}.ts`; raw root `deno check .`/`deno fmt --check` = non-verdict), new
  **Dependency Evidence** MANDATE (deps/* wrappers; never `deno outdated --latest` for latest) that
  cross-references `netscript-deno-toolchain` as the canonical gotcha home, `doc:lint` wrapper cited
  in Publish-And-Docs, new **Supervisor Automation** section documenting `gh-watch.ts` (token-free
  CI/verdict watch + exit-code table) and `gh-token.ts` (durable token check/store).
  `netscript-deno-toolchain` SKILL: deps/* MANDATE line (keeps canonical role); `doc:lint` wrapper
  in the inspection table. Harness gate docs: `gates/static-gates.md` "Parser Preference" → "Required
  Evidence Source (mandatory)"; `run-loop.md` §6 gate para "evidence is wrapper-sourced". NEW
  `.llm/harness/workflow/tooling.md` — pure INDEX (map not manual) of the mandatory tool surface,
  cross-linking the two skills; linked from harness `README.md`. `deno.json`: **11 new task aliases**
  — the 10 unwired `agentic:*` supervisor tools (`codex-resume|status|watch`, `launch-codex-slice`,
  `dispatch-openhands`, `openhands-status`, `gh-pr|watch|token`, `claude-hook-log`) each with
  per-script permission scoping + `--no-lock`, plus `doc:lint` wrapping `run-deno-doc-lint.ts`.
- **Supervisor review (A1 gate)**: read all 6 diffs + new tooling.md. Mandates correctly DEFER to
  the canonical gotcha homes (no restated `--latest`/catalog gotchas — cross-ref only, per AGENTS.md
  law); tooling.md is an index not a manual; alias permission strings verified sane (e.g. `codex-watch`
  gets `--allow-env` for its unguarded `HOME` read). Boundary respected — no `.claude/skills` hand-edit,
  no `packages/`/`plugins/`, no `deno.lock`, no `.llm/tools/**` script-body edits (aliases in
  `deno.json` only); S7 (Copilot/Augment, frontmatter, fitness-gates) + S8 (residue/ARCHETYPE-5)
  untouched.
- **Gate**: `agentic:sync-claude` (2 mirrors refreshed) → `agentic:sync-claude:check` OK →
  `agentic:check-claude` OK. Alias-resolve independently verified: `agentic:gh-watch --help` and
  `agentic:dispatch-openhands --help` print usage (resolve, not missing-file); `deno.json` parses.
- **Drift/debt candidates** (sub-agent flagged, NOT fixed — source-behavior out of S6 scope):
  (1) `codex-watch.ts` header doc-comment omits `--allow-env` it actually needs (`HOME` read);
  (2) `gh-token.ts` lacks an `import.meta.main` guard + `--help`; (3) `claude-hook-log.ts` is
  stdin-blocking (hook consumer, not an interactive supervisor command). Carry to S6-reconcile note /
  #307 tooling audit; none block the mandated wrappers.
- **Reconcile**: no related-issue state change. Commit sha `f5b77425`.

## 2026-07-04 — S7 landed (residue scrub + frontmatter + fitness-gates rewrite)

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **What** (design §8-S7, four items):
  1. **Copilot/Augment residue scrub** — the retired agent lanes removed from 5 files:
     `.llm/harness/workflow/agent-handoff.md` (header lane list + review-loop line),
     `openhands-handoff` SKILL (when-to-use + example), `netscript-tools` + `netscript-cli` SKILL
     descriptions ("OpenHands/Copilot"→"OpenHands"), `netscript-harness` SKILL handoff line.
     **KEPT** (correctly): `netscript-pr` (L161/197/226) + `CONTRIBUTING.md` (L84) — those are the
     **live `status:augment-review` label/stage** (verified `.github/labels.yml` L62-64, in design §4
     stage lifecycle), NOT the retired Augment agent. `docs/site/_plan` "augment with components"
     (English verb, docs lane) + `AGENTS-handoff.md` (S8) + `.llm/runs/**` left.
  2. **OpenHands output contract** — `agent-handoff.md` `## Output Contract` rewritten + reconciled in
     `openhands-handoff` SKILL: evaluator writes to **`OPENHANDS_RUN_DIR`** = tracked
     `.llm/runs/<run-id>/` (verdict `plan-eval.md`/`evaluate.md` committed there; no commits.md) and
     **`TRACE_DIR`** = `trace/` beneath it (`OPENHANDS_TRACE_DIR`); explicitly REPLACES the legacy
     `.llm/tmp/run/openhands/…` / `.llm/tmp/openhands/summary.md` scratch. Fixed the stale
     `openhands-status.ts --source local` committed-trace path + `thread-replies`→`OPENHANDS_REPLIES_PATH`.
     Doc-only; references existing `dispatch-openhands.ts`/`openhands-status.ts` (no new tooling).
  3. **Frontmatter name=dir** — `deno-fresh` `name: deno-frontend`→`deno-fresh`; `design`
     `name: frontend-design`→`design` (`name:` line only; upstream `description`/`license`/`metadata`/
     body untouched). Swept all `.agents/skills/*`: no other frontmatter dir-mismatch
     (`jsr-audit` `name: Publish to JSR` hit is a body heading, frontmatter `name: jsr-audit` correct).
  4. **fitness-gates.md rewrite** — replaced the F-1..F-15 table of **13 non-existent `check-*.ts`**
     with the REAL surface: an **Aggregators** table (`check-architecture-gates.ts`=`arch:check`,
     `audit-jsr-package.ts` w/ its real internal F-1..F-7, `audit-all-packages.ts`,
     `release-readiness.ts`, `check-doctrine.ts` AP-1..AP-30 authority, `check-netscript-standards.ts`
     NS-S-##) + a **per-domain `check-*` family** table (structure/layering, naming/edges, CLI, DS)
     — all 32 names glob-verified. Reporting/Manual/Debt sections preserved (paths updated). Honest
     **#307 follow-up** note instead of a fabricated per-AP 1:1 map.
- **Supervisor review (A1 gate)**: read all 8 diffs + full fitness-gates.md + verified the KEEP
  decision (labels.yml L62-64 confirms `status:augment-review` live). Scrubs surgical + meaning-
  preserving; output contract V3-consistent (tracked dir, no commits.md); frontmatter minimal;
  fitness-gates names only real scripts + honest #307 deferral. Boundary respected — no
  AGENTS-handoff/doctrine-prose/labels.yml/packages/tools-source edits.
- **Gate**: `agentic:sync-claude` (6 mirrors refreshed) → `agentic:sync-claude:check` OK →
  `agentic:check-claude` OK (surface green incl. name=dir now consistent, lock unchanged). Author-side
  self-gate: grep `(?i)copilot|augment` over scrubbed files = 0; all fitness script paths exist.
- **Drift/debt candidate**: exhaustive fitness AP-1..AP-30 → script map deferred to #307
  (interim authority = `check-doctrine.ts`). Recorded in fitness-gates.md follow-up note.
- **Reconcile**: no related-issue state change. Commit sha recorded below.
