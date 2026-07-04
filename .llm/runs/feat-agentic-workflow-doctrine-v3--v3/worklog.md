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
- **Reconcile**: no related-issue state change. Commit sha `39dde76a`.

## 2026-07-04 — S8 landed (residue prune + folds + ARCHETYPE-5) — FINAL SLICE

- **Author**: Opus 4.8 sub-agent (Tier B, D3 lane override), worktree `.llm/tmp/wt-harness-v3`.
- **What** (design §8-S8, five items):
  1. **Prune (5 deletions)** — `.llm/temp/{measure-5a-service,measure-5b-sdk,ui-init-smoke}.ts` +
     `.llm/{2026-06-11-5c1-ui-foundation,2026-06-11-wave5b-sdk-implementation}.md` (stale scratch +
     dated one-offs; basename grep = 0 live refs). `.llm/temp/` now EMPTY (dir removed on commit).
     `.llm/tmp/` (live scratch) untouched.
  2. **AGENTS-handoff.md consolidated** — rewritten from a 118-line duplicate of the handoff spec to a
     **thin pointer** naming the two canonical homes (`openhands-handoff` SKILL = triggers/precedence/
     output-modes/token-rule/gotchas/agentic-suite; `agent-handoff.md` = OPENHANDS_RUN_DIR/TRACE_DIR
     output contract). Kept only the unique Actions-vs-VPS long-running split +
     `ops/openhands/docker-compose.yml`. Copilot/Augment residue scrubbed (grep=0); stale
     `.llm/tmp/run/openhands` path replaced with the S7 contract.
  3. **OpenHands gotchas → `openhands-handoff` SKILL** — folded 3 rules into Common Pitfalls (eval
     lock-churn: evaluator never mutates lock/`git checkout -- deno.lock`/diff vs TRUE base/
     reconcile-not-revert; stale summary comment: verdict = committed `plan-eval.md`/`evaluate.md`
     never the PR comment; per-PR concurrency-cancel: one trigger/run, PR-comment→PR-branch,
     issue-comment→main) + folded the model-precedence 6-step list + provider→secret table.
     `platform.md` trimmed: the 2 OpenHands sections → 1-line rule + SKILL pointer, provenance headers
     + all non-OpenHands lessons (rtk-stale-git, gate-evidence trap, MSYS, Bash-tool, gh-PATH,
     lock-sync, root-quality-gates) preserved.
  4. **JSR gotchas → `jsr-audit` SKILL** — new "JSR publish gotchas (grounded)" section: import-attr
     asset embedding (never readTextFile/fromFileUrl), top-level import.meta/fromFileUrl https crash,
     self-referential subpath trap (cited #188), readmeSource=jsdoc default, prerelease latest=null.
     Cross-referenced (not duplicated) the existing doc-lint full-export-surface bar. Only #188
     carried a groundable issue number (cited); no fabricated issue numbers.
  5. **ARCHETYPE-5 thin-plugin rewrite** — reframed the harness profile around the plugin-thinness /
     core-centralization law (convention-bearing primitives in `@netscript/*` core; plugin = thin
     wiring that composes + re-exports, never redefines; auth-core+adapters = reference). Two new
     anti-patterns (fat plugin owning core's concerns; plugin re-implements a core convention) +
     fat-plugin False-Done + rescope trigger; reframed When-Applies/Folder-Shape/Read-First/Design-
     Checkpoint/Concept-of-Done/Historical-Notes. Structure preserved. **#305 boundary honored**: only
     `.llm/harness/archetypes/ARCHETYPE-5-plugin.md` edited; doctrine references left intact; added a
     "folder-shape reconciliation tracked under #305/#306" note. NO `docs/architecture/doctrine/**` edit.
- **Supervisor review (A1 gate)**: read all 5 diffs + the consolidated AGENTS-handoff.md + full
  ARCHETYPE-5. Thinness law threaded correctly + doctrine untouched + #305 note present; folds are
  grounded (only #188 cited, no fabricated issues) and de-dup correctly (doc-lint cross-ref not
  restated); platform.md provenance + non-OpenHands lessons preserved; AGENTS-handoff is a genuine
  pointer with no contradictory duplicate. Boundary respected — no doctrine/packages/plugins/labels/
  lock/tools-source/fitness-script deletions; the ~28 unwired fitness scripts left for #307.
- **Gate**: `agentic:sync-claude` (2 mirrors refreshed) → `agentic:sync-claude:check` OK →
  `agentic:check-claude` OK (surface green, lock unchanged). Author self-gate: grep copilot|augment
  over AGENTS-handoff = 0; 5 prune basenames = 0 tree refs; no doctrine/mirror edits.
- **Reconcile**: no related-issue state change. Commit sha recorded below. **All slices S2–S8 DONE** →
  next = WSL Codex final adversarial validation → full-surface gates → IMPL-EVAL (OpenHands, separate
  session).

## 2026-07-04 — post-S8: full-surface gate + Amendment A2 (IMPL-EVAL HELD)

- **Full-surface gate** (`docs:maintenance` = docs:links + sync:check + check-claude) caught a real
  S8 defect: the jsr-audit doc-lint cross-ref used GitHub's double-dash slug where the link-checker
  collapses `\s+` around the removed em-dash to a single dash. Fixed `6ff46c82`; gate green.
- **WSL Codex daemon repair**: remote-control was in the unmanaged state (mobile visibility broken
  system-wide). No active agent turn (latest rollout >1 day; lingering deno procs = orphaned plugin
  services from old E2E). Ran the codex-wsl-remote anchored-PID repair → connected/managed
  (YogaBook9i). Native WSL worktree `~/repos/netscript-harness-v3` @ 6ff46c82 staged for the eventual
  full-surface adversarial pass.
- **Amendment A2 (owner-directed)** recorded `62db7abe` (design §8 A2 + drift D6-A2 + context-pack):
  §8 under-scoped `.llm/tools`; IMPL-EVAL HELD; fold S9 (tools prod-grade refactor, audit-first) +
  S10 (`.llm/*` sweep, `.llm/runs/` kept). Adversarial pass deferred to the whole surface.

## 2026-07-04 — S9 STEP 1 (AUDIT ONLY) landed — classification posted

- **Author**: Opus 4.8 sub-agent (Tier B), read-only. No file edited/moved/deleted, no git ops,
  `e2e:cli` not run.
- **Result — 85 tool files**: KEEP 33, HARDEN 24, DEPRECATE-DELETE 1, AMBIGUOUS 27. Caller map from
  `deno.json`, `publish.yml`, `docs/site/deno.json`, all skills + mirrors, `.llm/harness/**`,
  AGENTS/CLAUDE, cross-imports.
- **Key findings**: (a) only 1 clean delete — root `release.ts` (superseded by
  `release/github-release.ts`, stale rickylabs default, no callers) — flagged for owner confirm.
  (b) 27 AMBIGUOUS, all `fitness/` — the unwired #157 CLI-doctrine gate suite (19 `check-cli-*`
  + shared lib) + 4 readiness orchestrators + 2 fresh-ui drift gates + `check-architecture-gates`;
  no live caller but real doctrine → **owner must decide wire-vs-delete**. (c) all 3 #307 debt items
  CONFIRMED (`codex-watch` missing `--allow-env` doc; `gh-token` no main-guard; `claude-hook-log`
  top-level stdin block). (d) global: only 13/85 files have a main-guard (near-universal harmonization
  target). (e) duplication: root `check-internal-doc-links` (markdown) vs `docs/check-internal-links`
  (site HTML) — co-named, both live; doc-drift in `09-anti-patterns` + `fitness-gates.md` naming ~13
  phantom root `check-*.ts` (S10/#305).
- **Restructure map**: keep `agentic/ deps/ docs/ fitness/ release/`; new `validation/ search/ git/
  codegen/ coverage/ e2e/ harness/` for loose root scripts; move publish/jsr wrappers into `release/`.
  Blast radius ≈45–50 refs; `run-deno-{check,lint,fmt}` trio = stable-path (deepest-wired via
  `deno.json` command strings + 2 `files:` arrays). 7 `_test.ts` + 5 fixtures move with subjects.
- **Supervisor A1**: reviewed the audit reasoning; independently confirmed root `release.ts` has the
  stale `DEFAULT_REPO = 'rickylabs/netscript'` + top-level exec + no callers.
- **Posted**: PR #390 classification comment (issuecomment-4881590662). **Escalated 2 decisions to
  coordinator** (confirm `release.ts` delete; verdict on the 27 `fitness/` gates). HARDEN + low-risk
  moves ready on go-ahead; ambiguous set untouched until decided. No destructive action taken.

## 2026-07-04 — S9 STEP 2 (HARDEN) landed — 24 live tools, non-destructive

- **Author**: Opus 4.8 sub-agent (Tier B). Additive hardening only; no file moved/renamed/deleted;
  27 ambiguous `fitness/` tools untouched; `deno.json`/skills/mirrors/docs unchanged.
- **Worktree-pin landmine + reconcile**: the sub-agent's Edits first landed in the MAIN repo tree
  (on branch `ci/fix-jsr-provision-token`) instead of the worktree (known "Workflow subagent worktree
  pin" landmine). It self-reconciled: 24-file patch → `git apply --check` clean → applied to worktree
  → `git checkout --` reverted main repo. **Supervisor verified**: worktree = exactly 24 ` M` under
  `.llm/tools` (0 add/del/rename), main repo `.llm/tools` clean.
- **What** (commit `1457d2d1`): uniform CLI contract (`--help`/`-h` → usage+exit0; `if
  (import.meta.main)` guard so import ≠ run/exit; accurate `--allow-*` banners). #307 fixes:
  codex-watch `--allow-env` doc; gh-token main-guard; claude-hook-log stdin moved into guarded main()
  with help-before-read. deps/* JSON path byte-identical. docs/check-{internal-links,caveat-refs}
  executable moved into guard, closured helpers rescoped/parameterized (logic + output identical).
- **Supervisor A1**: reviewed all 24 diffs — #307 fixes correct; closure refactors sound (clean
  `deno check` proves no dangling module-scope refs); output preserved. **Confirmed** in-env: `deno
  check --unstable-kv` (24) exit 0; `--help` smokes print+exit0; **gh-token imports without running
  main (IMPORT_OK_NO_EXIT)**; tests bump-version/prod-install/check-ds-gates 5/5.
- **Deliberately left** (pre-existing, CI-excluded `.llm/`, non-gating): `no-fallthrough` in
  `report-function-coverage.ts` parseArgs `--help` case; fmt drift in `check-scaffold-versions.ts`.
  Not hand-fixed to avoid out-of-scope legacy-drift churn (AGENTS.md caution).
- **Still HELD for coordinator**: root `release.ts` delete + 27 `fitness/` verdict → drives STEP 3
  (restructure) + any deletion. HARDEN is decision-independent, so it landed now.

## 2026-07-04 — S9 STEP 3A landed — delete 28 dead tools + reconcile gate docs (commit `55c67265`)

- **Owner decisions in** (via coordinator): DELETE root `release.ts` (D1) + DELETE all 27 ambiguous
  `fitness/` gates as superseded (D2). Both destructive halves authorized.
- **Guardrail 1 (load-bearing re-check) — supervisor did it before delegating**: locked the exact
  28-set from the S9 audit classification (reconciles to coordinator's categories); confirmed **zero
  live callers** — no `deno.json` task / `.github` workflow / surviving-tool import. Key catch: `deno
  task arch:check` (deno.json:104) runs `check-doctrine.ts` per-root, **not** the deleted
  `check-architecture-gates.ts`; `release:publish` targets `release/github-release.ts`, not root
  `release.ts`. `fitness-gates.md`'s "check-architecture-gates = arch:check" was stale doc-drift, not
  a wiring. No STOP condition.
- **Author**: Opus 4.8 sub-agent (Tier B), worktree-pinned, no-commit. Deleted 28 (27 fitness + root
  `release.ts`) via `git rm`; survivors preserved (`check-doctrine`, `audit-jsr-package`,
  `check-ds-{no-raw-hex,color-utilities}`, `check-ds-gates_test`).
- **Doc reconciliation (in-surface)**: rewrote `.llm/harness/gates/fitness-gates.md` to the surviving
  surface + **fixed the arch:check factual error** + elevated `PENDING_SCRIPT` to the common case;
  updated `archetype-gate-matrix.md` Phase-A example list. `workflow/tooling.md` names none of the
  28 → untouched.
- **Guardrail 2 (grep-zero)**: supervisor re-verified — only remaining `<name>.ts` refs are the 2
  flagged `docs/**` files + `.llm/runs` history. In-surface = ZERO.
- **Boundary FLAG (raised to coordinator, NOT edited)**: `docs/architecture/doctrine/09-anti-patterns-
  and-fitness-functions.md` (#305 doctrine lane; already stale pre-deletion) and
  `docs/architecture/DOCS-STRUCTURE.md` (`docs/**` outside surface) both still name deleted tools →
  owner/#305 follow-up. Per the #305 boundary I did not edit doctrine prose despite the coordinator's
  guardrail naming 09-anti-patterns.
- **Supervisor A1**: verified worktree diff = 28 `D` + 2 `M`, main repo clean; both doc rewrites
  reviewed factually correct; `run-deno-check --root .llm/tools/fitness` = 5 files/0 errors/exit 0;
  `check-doctrine.ts --root packages/plugin` smoke exit 0 (no missing-import crash).
- **Next**: S9 STEP 3B (topic-subfolder restructure + ~45–50 caller updates; `run-deno-*` stable-path;
  sync `.claude` mirror; grep-zero stale paths) → S10.

## 2026-07-04 — S9 STEP 3B landed — restructure .llm/tools into topic subfolders (commit `c44a1fd3`)

- **Author**: Opus 4.8 sub-agent (Tier B), worktree-pinned, no-commit. **18 `git mv` moves** into 7
  topic subfolders: `release/` (run-publish, run-publish-dry-run, jsr-provision-packages,
  jsr-set-package-settings, publish-workspace), `search/` (find-import-patterns, find-lines,
  find-symbol-usages, compare-export-surface, list-exports), `validation/` (check-internal-doc-links,
  check-readme-standard, check-scaffold-versions), `git/` (git-commit-paths, git-verify),
  `reporting/` (report-function-coverage), `e2e/` (scaffold-e2e-test), `harness/` (watch-run).
- **Stable-path exceptions kept at root**: `run-deno-{check,lint,fmt,doc-lint}` (deepest-wired in
  `deno.json` `files:` + task strings) and `generate-cli-assets-barrel.ts` (embedded as a
  `@generated by` provenance header in four out-of-surface `packages/**/*.generated.ts`; drift D7b).
  Rationale now also recorded in `.llm/harness/workflow/tooling.md` new "Tool layout" section.
- **Callers updated (29 files total; 11 M + 18 R)**: `deno.json` tasks,
  `.github/workflows/publish.yml`, `jsr-package-settings.json`, `AGENTS.md`, `.llm/tools/README.md`
  + `entry.md`, `.llm/harness/workflow/tooling.md` (+ Tool-layout section) + `lessons/platform.md`,
  and `codex-wsl-remote` skill (+ regenerated `.claude` mirror via `agentic:sync-claude`).
  Self-referential path strings inside moved tools updated; `check-scaffold-versions` relative-import
  depth fixed (`../../` → `../../../`).
- **Supervisor A1 catch — `coverage/` gitignore collision**: 3B originally moved
  report-function-coverage into `coverage/`, but `.gitignore:2` is an **unanchored `coverage/`** rule
  → the tool landed in an ignored path (survived only via git-mv force-stage; any future file there
  silently un-tracked). Corrected to `reporting/` during landing (filesystem move + index fixup, since
  `git mv` refuses the ignored dest); single ref (`deno.json coverage:functions`) + tool self-ref +
  tooling.md updated. All 7 new subfolders re-verified collision-free (drift D7c).
- **Supervisor A1 gates (all green, self-run)**: `deno check --unstable-kv` on `.llm/tools` = 69 files
  exit 0 + reporting tool exit 0; sub-agent full `deno task check` = 2099 files 0 errors;
  `publish:dry-run` resolves; `docs:links` green; `agentic:sync-claude:check` OK (17 skills / 21
  mirrored files). `.llm/tools` is **outside** the CI fmt/lint surface (`fmt.include`=packages/plugins,
  `lint.exclude`=`.llm/`) — raw `run-deno-fmt/lint` on it are non-verdicts (would convert the repo's
  `singleQuote` style + churn untouched files); type-check is the authoritative gate here.
- **grep-zero old paths (self-verified)**: the 18 pre-move root paths + `coverage/report-*` = ZERO
  in-surface callers. Only remaining hits: 2 in `.llm/runs` history (kept) + 2 out-of-surface prose
  refs (`docs/site/_includes/readme-template.md:8`, `packages/cli/e2e/README.md:6` → drift D7d).
- **`deno.lock` untouched** (a stray re-resolution from a supervisor `run-deno-check` was reverted
  before staging). Staged explicit paths only (never `git add -A`). Pushed `b85944a6..c44a1fd3`.
- **Next**: S10 (`.llm/*` production-grade sweep; `.llm/runs/` KEPT) → full-surface gates → WSL Codex
  adversarial over the whole V3 surface → OpenHands IMPL-EVAL (separate session). No merge/close.

## 2026-07-04 — S10 part 1: `.llm/harness/**` bring-to-grade (commit `5e5e036b`)

- **Scope**: `.llm/*` production-grade sweep. Surface enumerated (tracked, `.llm/runs/` KEPT +
  gitignored-untracked excluded): `.llm/harness/**` (54), `.llm/tmp/` (108 tracked!), `.llm/frontend`
  (1), `.llm/plans` (1).
- **Read-only audit** (Opus 4.8 Tier-B, all 54 harness files): **zero stale-remove** — every harness
  doc is live; drift = a tight cluster of 8 defects. Audit distinguished historical-provenance
  `.llm/tmp/run/` refs (correct, left) from canonical-path drift (none found), and confirmed the
  "there is no commits.md" notes are correct V3 (not drift). No moved-tool old-flat-paths remain.
- **Fix slice** (Opus 4.8 Tier-B, in-surface `.llm/harness` only, no-commit): 8 fixes across 9 files
  — ARCHETYPE-6 deleted-`check-cli-*` claim → PENDING_SCRIPT/manual backed by `check-doctrine.ts`;
  slash→hyphen group-branch in agent-briefing + phase-registry (slash form is Git-impossible per
  supervisor.md); evaluate.md tables extended F-15→F-19 + AP-20→AP-25; anti-pattern-catalog AP-21..25
  added; gates/README F-15→F-19 + Phase-A caveat reframed to match fitness-gates.md; DOCTRINE-REF
  8→9-phase (incl. Release) + AP-30-headroom note; context-pack retired-commits ledger repointed;
  sub-wave-orchestration "commits"→dropped.
- **Supervisor A1**: reviewed every diff; **verified AP-21..25 / F-16..19 titles verbatim against
  `docs/architecture/doctrine/09-…md` headings** (exact match); phase list matches run-loop.md (9
  incl. Release); branch form matches supervisor.md (hyphen). Confirmed no edit outside `.llm/harness`
  and that `fitness-gates.md`/matrix/`run-loop.md`/`supervisor.md`/doctrine/tool/mirrors were NOT
  touched. `.llm/harness` is docs — outside CI fmt/lint surface; no type-check applies.
- **AP-ceiling judgment (drift D8)**: aligned harness evaluator tables to the **doctrine-defined
  AP-25 / F-19**; the AP-25(doctrine)-vs-AP-30(`check-doctrine.ts`) gap is left as an out-of-surface
  #305 follow-up (reconciling needs a doctrine-prose edit V3 must not make). AP-30 tool refs unchanged.
## S10 part B — untrack stale tmp/run + delete dated singletons (commit `707b21cd`)

Owner authorized (via coordinator): untrack (keep on disk) the stale `.llm/tmp/run/` set; delete
the 2 dated singletons.

- **Locked the exact set first**: `git ls-files .llm/tmp/run/` → **108** tracked paths; verified
  **zero overlap** with `.llm/runs/` (the kept run home, 9 tracked). Only then staged.
- **(a) Untrack, keep on disk**: `git rm -r --cached .llm/tmp/run/` — 108 paths removed from the
  index, all still present on disk. `.llm/tmp/` is `.gitignore:17`, so they stay ignored and do
  **not** reappear as untracked. Post-op `git status` clean of them.
- **(b) Delete both dated singletons** (repo + disk) via `git rm`:
  `.llm/frontend/wi/WI-12-definePage-route-binding-codegen.md` and
  `.llm/plans/2026-06-12-fresh-ui-doctrine-plan.md`.
- **Staged set audit**: exactly **110** entries, all `D` (108 untrack + 2 delete); nothing outside
  the intended paths; `deno.lock` untouched.
- **grep-zero (both singleton filenames, repo-wide)**: no in-surface, framework (`packages/**`), or
  `docs/**` referrer remains. The **only** hit is this run's own historical worklog note (part A
  "STILL PENDING" line) — append-only provenance, superseded by this entry; not rewritten. Reported
  the grep result to the coordinator.
- **arch-debt.md historical `.llm/tmp/run/<id>` provenance links** point to **different**
  already-gone run-ids (not these 108) — left as historical provenance, not rewritten (per owner).
- **Next**: full-surface gates → WSL Codex adversarial (whole V3 surface, owner's pre-eval
  close-all-gaps pass) → OpenHands IMPL-EVAL (separate session). No merge/close.

## Adversarial remediation — WSL Codex pre-eval pass (commit `1d50c6c3`)

Ran the owner-directed WSL Codex adversarial review over the whole V3 surface (gpt-5.5, native
worktree `netscript-harness-v3` at `bfb6185a`, thread `019f2d44`, READ-ONLY brief). Verdict:
**1 blocker / 4 major / 3 minor / 0 nit — all in-surface, zero out-of-surface**. Supervisor
independently re-verified every finding against the tree before acting; all valid. Fixed by an
Opus 4.8 sub-agent, then A1-reviewed + re-gated.

- **BLOCKER `.llm/tools/validation/check-internal-doc-links.ts`**: S9 moved this tool one level
  deeper but `REPO_ROOT` still climbed 2 levels → resolved to `.llm/`, so `docs:links`
  **false-passed with docs=0**. A type-check cannot catch a wrong-but-typed path constant — this is
  precisely why the adversarial pass exists. Fixed with `findRepoRoot()` walk to the nearest
  `deno.json` ancestor. **Proof**: `docs:links --root .llm/harness` now scans **54** docs (was 0),
  0 broken links; `.llm/tools` type-check stays **69 files / 0 errors**.
- **MAJOR ARCHETYPE-6**: static gates named undefined `deno task check:packages` + wrong-form
  `fmt --check` → real `deno task check|lint|fmt:check`; F-CLI range header `…30` → `…31` (matched
  the rest of the file; the two individual `F-CLI-30` gate refs correctly left unchanged).
- **MAJOR 8→9 phase**: `netscript-harness/SKILL.md` + `.agents/skills/README.md` still advertised
  the retired 8-phase model (omitting Release); aligned to run-loop.md's 9 phases and **regenerated
  the `.claude/skills` mirror** via `agentic:sync-claude` (sync:check OK, 17 skills / 21 files). S10
  fixed the harness docs but had missed the skill — the review caught the gap the mirror couldn't.
- **MAJOR `feature_request.yml`**: `["enhancement","status:triage"]` → `["type:feat",
  "status:triage"]` (namespaced `type:` per netscript-pr; both labels confirmed in `.github/labels.yml`).
- **MINOR verbatim titles**: `anti-pattern-catalog.md` (AP-9/15/17/18/20) + `archetype-gate-matrix.md`
  and `templates/evaluate.md` (F-6/8/9/13/15/17) aligned **verbatim** to doctrine 09 headings
  (supervisor cross-checked each against `09-*.md`).
- **MINOR `.llm/tools/entry.md`**: "Deno 2.8" → "Deno 2.9".
- **Lock hygiene**: running deno gates re-added the transient `jsr:@std/fs@*` + `jsr:@std/path@*`
  lines to `deno.lock`; `git restore`d before staging — **not committed** (docs/tooling slice).
- **Reviewer clean confirmations** (corroborate the earlier gates): no dangling `.llm/tools/*.ts`
  refs; `coverage:functions` → `reporting/`; no calls to deleted `check-cli-*`/aggregators; mirror
  sync OK; gitignore `coverage/` trap present but unused.
- **Next**: report remediation-landed to coordinator → hold for OpenHands IMPL-EVAL dispatch
  (separate session). No merge/close.

## IMPL-EVAL — PASS (2026-07-04)

- **Dispatch**: OpenHands, separate evaluator session, `openrouter/qwen/qwen3.7-max`,
  `output=pr-comment`, iterations=600, via `dispatch-openhands.ts` (dry-run contract check first).
  Trigger comment: PR #390 issuecomment-4882250106. Prompt began `use harness` + `## SKILL` chapter;
  pointed at the whole V3 surface (`origin/main..HEAD`, HEAD `7e053757`), the run-dir artifacts, and
  the PR DoD; required independent gate re-runs + the #387 close-gate on every referenced issue.
- **Verdict**: **PASS** — zero blocking findings; close-gate #387 clean; 3 non-blocking advisories
  (all correctly routed out of V3's surface to #305 / owner follow-ups). Evaluator run
  <https://github.com/rickylabs/netscript/actions/runs/28708279015>; verdict comment
  issuecomment-4882250744 (complete/untruncated, verified).
- **Reconcile (per coordinator, [[openhands-eval-commits-lock-churn-and-junk]])**: verified the eval
  session pushed **nothing** to the branch (PR head still `7e053757`). The trace it claimed to commit
  under `.llm/tmp/run/openhands/pr-390/` **never landed** (job errored at push — the "Job status:
  failure" wrapper quirk) → no `git rm` needed; the drift-D1 violation did not materialize. `deno.lock`
  clean. `impl-eval.md` also did not land → **transcribed verbatim** from the evaluator's comment into
  the run dir (same as PLAN-EVAL/D4), recorded as `drift.md` D9. No self-certification.
- **Stage**: `status:impl-eval → status:ready-merge`; PR DoD item 7 checked with the verdict link.
- **HARD HOLD**: no merge, no issue close — owner's call. Ready-merge evidence bundle handed to the
  coordinator.

## 2026-07-04 — Pre-merge main-drift reconcile (merge `266c0f74`)

- PR #390 went `mergeable: CONFLICTING` / `DIRTY` after main advanced one commit (`78eda7f0`, #395 —
  the `JSR_API_TOKEN` CI fix, `.github/workflows/publish.yml` only). Merged `origin/main` **into** the
  branch (merge, not rebase, per coordinator) → single conflict in `publish.yml`.
- **Conflict resolved "keep both"** (complementary, no semantic contradiction): main's
  `JSR_API_TOKEN: ${{ secrets.JSR_API_TOKEN }}` on the two `env:` lines + our S9 restructure
  `run:` tool paths (`.llm/tools/release/jsr-provision-packages.ts`,
  `.llm/tools/release/jsr-set-package-settings.ts`). All 4 referenced `release/` tools verified present.
- **Authoritative `.llm` gates re-run on the merge (all green)**: `.llm/tools` type-check 69 files /
  0 errors; `docs:links` 92 docs / 0 broken; `agentic:sync-claude:check` OK (17 skills / 21 files);
  `agentic:check-claude` OK (lock unchanged). `deno.lock` transient `@std/*` churn `git restore`d —
  not committed.
- **PR CI on the merge**: required `quality` / `check-test` / `deps-report` all green;
  `scaffold-runtime` (aspire+docker+postgres) **success** (merge-readiness authority, no db-init flake);
  `scaffold-static` success. Un-drafted the PR (residual `blocked` was draft state, not a conflict) →
  `mergeable: MERGEABLE` / `clean`. Commit `266c0f74`. Handed the merge trigger to the coordinator
  (channel discipline: no self-merge on a relay).

## 2026-07-04 — Run CLOSED — MERGED

- **PR #390 MERGED** by the coordinator (owner-authorized) via squash — squash commit **`eeaff336`**
  on `main` (`feat(harness): Agentic Workflow Doctrine V3 — tiered agents, tracked runs, stage-labeled
  PRs (#390)`); branch `feat/agentic-workflow-doctrine-v3` deleted. Main-drift brought in by merge
  `266c0f74` (main @ `78eda7f0` / #395). IMPL-EVAL verdict: **PASS** (OpenHands qwen-3.7-max, separate
  session; `impl-eval.md`).
- **Epic #389 left OPEN** (correct — umbrella carries no closing keyword; V3 is one delivered slice of
  the road-to-stable program, cumulative work continues under it).
- **main-push `ci` on `eeaff336`: GREEN** — `quality` success, `check-test` success, `deps-report`
  success (`agent` skipped). Lighter main-push scope; V3 touched zero `packages/`/`plugins/`.
- **Run stage → `merged` / done.** All slices S1–S10 + Amendments A1/A2 + WSL Codex adversarial pass +
  IMPL-EVAL PASS delivered. Out-of-surface follow-ups remain tracked on **#305** (doctrine-prose
  fitness-inventory reconcile, AP-25-vs-AP-30 ceiling, `docs/**` stale tool-name refs — drift D7/D8) and
  **#307** (tools audit / ~28 unwired-fitness verdict already actioned in S9). No new debt opened by
  the closeout.
- Closeout bookkeeping (this entry + `supervisor.md` status + `drift.md` D10 + `context-pack.md`)
  landed run-dir-only on a short-lived branch off updated `main` (`chore/harness-v3-run-closeout`),
  since the run branch was deleted at merge.
