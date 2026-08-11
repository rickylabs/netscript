# Worklog: NetScript DevTools Contribution Architecture RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `plan-devtools-contribution--seed` |
| Branch | `plan/devtools-contribution` |
| Archetype | Described, not built — see `plan.md` § Run Metadata |
| Scope overlays | `docs` + `frontend` |
| Supervisor | Claude Opus 5 · high — see `supervisor.md` |

## Design

> **Not applicable in the usual sense.** `run-loop.md` § 3b's Design checkpoint governs
> implementation slices (public surface, ports, constants, files created). This run creates **no
> implementation files**. The equivalent design deliverable is the RFC's own normative design —
> contribution envelope, kinds, data plane, trust tiers, host split, and API sketches — authored at
> stage E and evaluated at stage G against `gates/plan-gate.md`.
>
> The **commit slices** below are therefore documentation/planning slices. They keep the same
> contract: each names what it proves, the gate that proves it, and the files it touches.

### Commit Slices (planned)

**Corrected after PLAN-EVAL cycle 1.** The table below previously described *intent* and was never
brought current — it claimed the GLM pass ran, named superseded gates, and listed files that do not
exist. The evaluator caught it, and it was the fairest hit in the verdict: this run has repeatedly
criticised false-green reporting elsewhere. **Status is now what actually happened.**

| # | Slice | Status | Gate actually run | Files that actually exist |
| - | ----- | ------ | ----------------- | ------------------------- |
| 1 | Bootstrap: supervisor identity, run artifacts, charter, draft PR | **DONE** `ccc4c0a70`, `ecae44017` | run dir has `supervisor.md`; draft PR #1450 with docs-only labels | run dir `*`, `.llm/devtools-rfc-orchestrator-brief.md` |
| 2 | Stage-B discovery corpus, `workflow.js` committed before execution | **DONE** `d5852188b` (workflow), `06b3c480f` (corpus) | citation gate; corpus committed before synthesis | `research/*.md` (14), `research/sources/` (78), `workflows/stage-b-*.js` |
| 3 | Stage-C synthesis | **DONE** `ca15ac2c2`…`fc375ec23` | `research.md` findings table populated with citations | `research.md`, `research/SYNTHESIS-NOTES.md` |
| 4 | Stage-D design packs | **DONE** `7d23809a8` | supervisor slice review V1–V4 before sign-off | `design/T{1,2,3,5,6,7,8,9}/*.md` — **proposals + open questions only** |
| 4b | Draft epic + one-file-per-issue set + agent briefs | **NOT DONE — outstanding** | — | *(none — see PLAN-EVAL required fix 7)* |
| 5 | Stage-D2 GLM 5.2 design pass | **FAILED — lane unlaunchable** | none; **zero tokens, both attempts** | `design/ux-evidence/glm-attempt-{1,2}-FAILED.jsonl`, `glm-prompt.md`. **No findings file exists** (drift D-10) |
| 6 | Stage-E canonical RFC + plan lock | **DONE** `a7e49d525`, `9e1b828c5` | `docs:links --root docs/architecture/rfc` PASS; `docs:accuracy` PASS. **`doc:lint` is not a task in this repo and the Markdown fmt gate does not exist** (drift D-4) | `docs/architecture/rfc/rfc-0002-devtools-contribution.md`, `plan.md` |
| 7 | Stage-F adversarial findings + triage + fixes | **DONE** `b7cd62067` | per-finding disposition recorded; docs gates re-run | `adversarial-sonnet.md` (**not** `adversarial.md`), `adversarial-triage.md` |
| 8 | Stage-G PLAN-EVAL | **DONE — verdict `FAIL_PLAN`** `5202ff205` | evaluator re-ran all gates independently | `plan-eval.md`, `planeval/codex-thread-ids.md` |
| 9 | Stage-G fix cycle 1 | **IN PROGRESS** | re-run docs gates + cross-file variant search | this commit |
| 10 | Stage-H-prep: filing manifest, agent briefs | **PARTIAL** — `decision-brief.md` and the supersession map exist; the filing manifest and per-issue briefs do not | live-board dedup **not yet run** | `decision-brief.md`, `design/T9-supersession/supersession-map.md` |

### Deferred Scope

- All implementation. Every proposed package/plugin is a **sketch** in this run.
- Board filing (stage H) — blocked on `plan-eval.md` = `PASS` **and** owner ratification in-turn.

## Progress Log

| Time (UTC) | Stage | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-11 | A | Charter read | `.llm/devtools-rfc-orchestrator-brief.md` read in full before acting |
| 2026-08-11 | A | Harness activation | `netscript-harness` skill + `workflow/activation.md`, `run-loop.md`, `lane-policy.md`, `seed-run.md`, `gates/plan-gate.md` read |
| 2026-08-11 | A | Baseline verified | `git fetch origin`; `origin/main` = `2256a67bf`, matching the charter. No divergence, no rebase |
| 2026-08-11 | A | `supervisor.md` written | Identity, routes, mutation boundary, prohibitions, invariants recorded **first**, per `seed-run.md` hard invariants |
| 2026-08-11 | A | Run artifacts scaffolded | `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `phase-registry.md` |
| 2026-08-11 | A | Bootstrap commit + push | `ccc4c0a70`, pushed with explicit refspec `plan/devtools-contribution:plan/devtools-contribution` |
| 2026-08-11 | A | Draft PR opened | [#1450](https://github.com/rickylabs/netscript/pull/1450) → `main`, draft, milestone `Backlog / Triage`; labels `type:docs`, `rfc`, `status:research` (exactly one `status:`), `ci:skip-e2e`, `ci:skip-scaffold`, `area:docs/fresh/fresh-ui/plugins`, `priority:p1`, `epic:dev-dashboard`, `epic:frontend-contrib` |
| 2026-08-11 | A | Opening phase comment | Charter read-back, verified baseline, routes in force, evaluation posture, CI-lane rationale, pre-registered drift — [comment](https://github.com/rickylabs/netscript/pull/1450#issuecomment-5251257498) |
| 2026-08-11 | A→B | **Stage A closed** | Seed-run stage A contract satisfied: `supervisor.md` + run dir + draft PR + charter read-back → opening PR comment |
| 2026-08-11 | B | Workflow committed before execution | `workflows/stage-b-discovery-workflow.js` @ `d5852188b`, per the Tier-C hard rule that an uncommitted workflow does not run and its corpus does not count as stage-B proof |
| 2026-08-11 | B | Discovery fan-out launched | Workflow run `wf_a9f80af4-2af`, 14 agents: 5 repo surfaces, 3 prior RFCs, 2 board/doctrine, 4 market teardowns. Read-only on source and on GitHub |
| 2026-08-11 | B | Downstream lane pre-flight | `deno task agentic:runtime doctor` → `no_change`, 18 components, foundation healthy (stage-G Codex launch path viable). `agentic:claude-openrouter` usage confirmed for the stage-D2 GLM lane; ids resolved from `config/models.ts` (`z-ai/glm-5.2`, `openrouter/moonshotai/kimi-k3`) rather than hardcoded |
| 2026-08-11 | B | Evidence-input worktrees verified | `ns-rfc-runtime-versioned-automation` head = `6cb79675c` — **exactly** the charter's stated final evaluated head for #1446. `ns-rfc-sdk-client` present @ `14b5c858c`. `.llm/runs/dashboard-rescope--seed/` present |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Run shape = seed run (`workflow/seed-run.md` A–I) | The deliverable is a board + RFC, not code — the seed-run trigger exactly | `seed-run.md` § When to use a seed run |
| PLAN-EVAL **selected** (not `N/A`) | Twelve open architecture decisions, multi-PR/wave board output, and an explicit charter mandate | `run-loop.md` § 4; charter line 50 |
| IMPL-EVAL = **N/A by run shape** | No implementation exists to evaluate; substitute assurance recorded | `drift.md` D-2 |
| Docs-only CI labels applied proactively | Changeset is Markdown only — no TS, no `packages/**`/`plugins/**` | `netscript-harness` SKILL § Workflow |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| D-1 GLM `major_ui_ux_*` lane reactivated from dormant | minor | yes |
| D-2 IMPL-EVAL N/A by run shape | minor | yes |
| D-3 GLM transport has no reasoning trace (pre-registered) | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Markdown format | `.llm/tools/run-deno-fmt.ts` (scoped) | `NOT_RUN` | Stage I |
| Doc lint / links | `deno task doc:lint` | `NOT_RUN` | Stage I |
| Docs source + rendered CI gates | PR checks (#1440) | `NOT_RUN` | Runs on the draft PR |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Planned-surface `jsr-audit` rubric | `NOT_RUN` | — | Stage E, against the RFC's proposed API sketches |
| Citation gate (stage B) | `NOT_RUN` | — | Every load-bearing claim cited |
| Live-board dedup | `NOT_RUN` | — | Before any issue draft enters the filing manifest |

### Runtime / Consumer Gates

| Gate | Result | Notes |
| --- | --- | --- |
| `deno task check` / `test` / `lint` | `N/A` | Changeset contains no TypeScript |
| `arch:check` / `quality:scan` | `N/A` | No `packages/**` or `plugins/**` source touched |
| `e2e:cli` / `scaffold.runtime` | `N/A` | No scaffold, CLI, or runtime behavior changes |

## Handoff Notes

- The evaluator should read `supervisor.md` first (identity + mutation boundary), then `plan.md`
  § Open-Decision Sweep, then the RFC.
- The two things most worth attacking: (1) whether each retained contribution kind has a **real**
  first-party consumer rather than a speculative union, and (2) whether the Aspire/Scalar/DevTools
  ownership boundary holds without cloning upstream UIs.

## Stage-D slice review — supervisor verification log

Amendment A1: no lane self-certifies. Before the stage-D sign-off commit the Tier-A supervisor
independently verified the **load-bearing** claims each pack rests on, in source, rather than
relaying them. Verification found one pack right and my own committed corpus wrong, which is the
point of the gate.

| # | Claim (pack) | Verification | Result |
| - | ------------ | ------------ | ------ |
| V1 | #890's manifest pointer block is "safely additive; older CLIs ignore it" (**T2** disputes) | `packages/plugin/src/protocol/manifest.ts:271,283` | **T2 correct.** Schema ends in `.strict()` with `schemaVersion: z.literal(1)` → unknown top-level key is hard-rejected, not ignored. → drift **D-6**, escalated as a cross-RFC defect in #890/#922 slice #929 |
| V2 | Generator subprocess permissions are whole-**filesystem**, not project-scoped (**T6** vs my corpus `r3` F10) | `installed-runtime-registry-generator.ts:416-417`; `grep` for `allow-net`/`allow-env` | **T6 correct, my corpus understated it.** Flags are bare `--allow-read`/`--allow-write` with no `=<path>` → global grant. No `--allow-net`/`--allow-env`, so default-deny blocks exfiltration. → drift **D-7** |
| V3 | `createSSEStream`/`createKvWatchSSE` ship but are unexported with zero importers (**T5**) | `packages/fresh/src/runtime/server/sse.ts` exists (12.6 KB); `deno eval` over `packages/fresh/deno.json` → 15 export subpaths, **none** is `sse`; only importer is its own `sse_test.ts` | **Confirmed.** A promotion slice, not new design |
| V4 | NetScript is in the documented `transformIndexHtml` injection no-op bucket (**T1**, closing research OQ1) | `find` for `index.html*` under the scaffold → none; `grep -rn transformIndexHtml packages plugins` → **zero matches repo-wide** | **Confirmed** on the locally checkable half. The upstream half (`@fresh/plugin-vite` catch-all middleware calling `mod.default.fetch`) is cited to a pinned JSR path and remains a Wave-0 probe |

**Consequence of V4:** research open question 1 — flagged at stage C as *the single most
decision-relevant unknown* — is **closed**. A Vite-`transformIndexHtml`-shaped mount is not
available to NetScript, which removes an entire branch of the T1 option space rather than leaving it
as a risk.

**Not verified, carried as named probes** (recorded rather than glossed): `fresh({ islandSpecifiers })`
end-to-end with JSR specifiers under Deno resolution; whether the Vite dev server's own endpoints
(HMR WS, `/@fs`) are auth-gated when non-loopback.

### Stage-D lock hygiene

`git status` after the fan-out showed `deno.lock` modified (+386/−9) — incidental churn from the
packs' `deno doc` / module-resolution runs (`jsr:@fresh/plugin-vite@^1.1.2`, `jsr:@fresh/core@2`,
`jsr:@deno/loader@0.4` entries added). **Reverted with `git checkout -- deno.lock`.** A planning-only
docs run has no business mutating the workspace lock, and `AGENTS.md` operating rule 6 plus the
`netscript-tools` lock-hygiene rule both bind here. Verified afterwards that nothing outside the run
directory remains modified.

## Stage-G — formal PLAN-EVAL identity proof

The harness requires requested-versus-observed identity, a concrete thread id, and a worktree — not
prose claiming an evaluator ran.

| Field | Value |
| --- | --- |
| Lane | `formal_plan_evaluation` — opposite-family (Codex evaluates Claude-authored work) |
| Requested route | provider `openai` · model `gpt-5.6-sol` · effort `high` |
| **Observed route** | provider `openai` · model `gpt-5.6-sol` · effort `high` — **route verdict: matched** |
| Thread / session id | `019ff05b-cf8b-7051-b66a-fdc52683b2f0` |
| Rollout | `~/.codex/sessions/2026/08/11/rollout-2026-08-11T12-26-16-019ff05b-…jsonl` |
| Worktree | `/home/codex/repos/ns-devtools-planeval` — **its own**, detached |
| Evaluated commit | `b7cd6206762bc8f7a681526a993082c20e4cddfc` — **immutable**; cannot move under the evaluator |
| Steering | `codex exec resume 019ff05b-cf8b-7051-b66a-fdc52683b2f0 -- "<follow-up>"` — one sender per worktree |
| Launch path | `.llm/tools/agentic/codex/run-codex-slice.ts` via `deno task` — never ad-hoc `wsl.exe` |

Dry-run preceded the real launch and validated the brief contract (`use harness` + `## SKILL`) and
the git-safety check. **Generator ≠ evaluator holds**: every authoring lane in this run was Claude
(Opus 5 supervisor, Fable 5 packs and sections) or Sonnet 5 (stage F); the evaluator is OpenAI Codex
in a session that authored nothing.
