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

| # | Slice | Proves | Gate | Files |
| - | ----- | ------ | ---- | ----- |
| 1 | Bootstrap: supervisor identity, run artifacts, charter, draft PR | The run is activated with a recorded identity, a verified baseline, and a live commit trail | run dir contains `supervisor.md`; draft PR open with docs-only CI labels | `.llm/runs/plan-devtools-contribution--seed/*`, `.llm/devtools-rfc-orchestrator-brief.md` |
| 2 | Stage-B discovery corpus (repo + docs + market), with committed `workflow.js` if Tier-C is used | Every load-bearing claim is cited and re-baselined against `2256a67bf` | citation gate; corpus committed before synthesis | run `research/`, `matrix/`, `workflows/` |
| 3 | Stage-C synthesis | The supervisor read the full corpus and named the deep-dive topics | `research.md` findings table populated with citations | `research.md` |
| 4 | Stage-D design packs (one per topic) | Each topic has a proposal + draft epic/issues + agent briefs + open questions | supervisor substantive review before sign-off commit (no lane self-certifies) | `design/<topic>/**` |
| 5 | Stage-D2 design/UX evidence pack (GLM 5.2 pass, optional Kimi visual lane) | The mandatory major-UI/UX design route ran, with per-finding dispositions | pack records requested vs observed identity; transport caveat stated | `design/ux-evidence/**` |
| 6 | Stage-E: canonical RFC + plan lock | All twelve charter questions resolve to a locked decision or a numbered owner fork | `deno task doc:lint`; scoped fmt wrapper; plan-gate self-check | `docs/architecture/rfc/**`, `plan.md` |
| 7 | Stage-F adversarial findings + triage dispositions + fixes | An unoriented distinct-model reviewer found nothing unaddressed | per-finding disposition recorded | `adversarial.md`, `adversarial-triage.md` |
| 8 | Stage-H-prep: supersession map, filing manifest, agent briefs, owner decision brief | The board can be filed in one shot after ratification, with #400 reconciled | live-board dedup check | `supersession-map.md`, `filing-manifest.md`, `briefs/**`, `decision-brief.md` |

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
| V1 | #890's manifest pointer block is "safely additive; older CLIs ignore it" (**T2** disputes) | `packages/plugin/src/protocol/manifest.ts:271,282` | **T2 correct.** Schema ends in `.strict()` with `schemaVersion: z.literal(1)` → unknown top-level key is hard-rejected, not ignored. → drift **D-6**, escalated as a cross-RFC defect in #890/#922 slice #929 |
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
