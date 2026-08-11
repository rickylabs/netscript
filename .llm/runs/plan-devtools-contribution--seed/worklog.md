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
| 4b | Draft epic + one-file-per-issue set + agent briefs | **DONE** `143c31574` | no board mutation; labels verified against `labels.yml` | `filing/epic.md`, `filing/issues/` (16), `filing/briefs/` (7) |
| 5 | Stage-D2 adversarial design pass | **DONE via owner-approved substitute route** (D-15/D-16). GLM lane unlaunchable (D-10) → **Qwen 3.8 Max** + **Kimi K3**, read-only, findings-only | observed identity **matched** requested on both; 2 criticals found and fixed | `design/ux-evidence/{qwen,kimi}-{prompt,findings,triage}.md`, `qwen-receipt.md`, `FINDINGS-SWEEP.md`; failed GLM attempts kept as evidence |
| 6 | Stage-E canonical RFC + plan lock | **DONE** `a7e49d525`, `9e1b828c5` | `docs:links --root docs/architecture/rfc` PASS; `docs:accuracy` PASS. **`doc:lint` is not a task in this repo and the Markdown fmt gate does not exist** (drift D-4) | `docs/architecture/rfc/rfc-0002-devtools-contribution.md`, `plan.md` |
| 7 | Stage-F adversarial findings + triage + fixes | **DONE** `b7cd62067` | per-finding disposition recorded; docs gates re-run | `adversarial-sonnet.md` (**not** `adversarial.md`), `adversarial-triage.md` |
| 8 | Stage-G PLAN-EVAL | **DONE — verdict `FAIL_PLAN`** `5202ff205` | evaluator re-ran all gates independently | `plan-eval.md`, `planeval/codex-thread-ids.md` |
| 9 | Stage-G fix cycles 1 and 2 | **DONE** `996d47923`, `504ddc559` | docs gates re-run; cross-file sweep → 0 surviving variants | RFC, `plan.md`, `RFC-AUTHORITY.md`; `rfc-sections/` **deleted** (two-corpora fix) |
| 10 | Stage-H-prep | **DONE (drafts)** `143c31574` | live-board dedup run per manifest row | `decision-brief.md`, `filing/filing-manifest.md`, `design/T9-supersession/supersession-map.md` |

### Deferred Scope

- All implementation. Every proposed package/plugin is a **sketch** in this run.
- ~~Board filing blocked~~ — **UNBLOCKED 2026-08-11.** The owner ratified F-1/F-3, waived the third
  PLAN-EVAL cycle, and authorized one-shot filing (drift **D-18**, **D-19**). Note the gate was
  cleared by **owner waiver**, not by an evaluator `PASS`.

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

**Nineteen entries. Seven correct the run's own earlier claims** — that is the point of the log.

| # | Drift | Severity |
| - | ----- | -------- |
| D-1…D-3 | GLM lane reactivated; IMPL-EVAL `N/A` by run shape; GLM has no reasoning trace | minor |
| D-4 | **self-correction** — the Markdown format gate this run planned does not exist | significant |
| D-5 | OpenHands docs gate cannot fire on a draft PR | minor |
| D-6 | **#890's additive-manifest claim is false** (`.strict()`) — cross-RFC defect | significant |
| D-7 | **self-correction** — generator spawn is whole-filesystem; my corpus understated it | significant |
| D-8 | **self-correction** — comment threads reversed a board recommendation | significant |
| D-9 | **self-correction** — off-by-one citation in D-6 | minor |
| D-10 | **mandated GLM design lane unlaunchable** — policy declares a lane nothing can run | significant |
| D-11 | epic **AMENDS #400** rather than creating a second umbrella | significant |
| D-12 | `.github/labels.yml` drifted 19 behind live; `netscript-pr` milestones stale | minor |
| D-13 | one-sender-per-worktree guard correctly refused cycle-2 reuse | minor |
| D-14 | **self-correction** — cycle-2 evaluator spent its budget reading; my brief was unbounded | significant |
| D-15 | **OWNER OVERRIDE** — Qwen 3.8 Max replaces GLM for stage D2 | significant |
| D-16 | **OWNER LANE SPLIT** — Kimi K3 takes the pure UI/UX review | minor |
| D-17 | **self-correction** — I truncated my own design-review evidence with `tail -40` | significant |
| D-18 | **OWNER WAIVER** — no third PLAN-EVAL cycle; gate cleared by owner, not by a verdict | significant |
| D-19 | **OWNER RATIFICATION** — F-1, F-3 decided; board filing authorized | significant |

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

## Stage-G outcome — two cycles, both `FAIL_PLAN`, escalation reached

| Cycle | Thread | Commit evaluated | Verdict | Outcome |
| --- | --- | --- | --- | --- |
| 1 | `019ff05b-cf8b-7051-b66a-fdc52683b2f0` | `b7cd62067` | **`FAIL_PLAN`** | 7 of 8 boxes failed; 8 required fixes. All four independent gates passed |
| 2 | `019ff075-d2e0-7823-9572-0648e158cc16` | `143c31574` | **`FAIL_PLAN`** | Confirmed cycle-1 fixes landed in the RFC but found the **section sources and packs still carried the old boundary** — two corpora. Remaining blockers classified **owner-gated** |

Both cycles ran on the recorded route (`openai` / `gpt-5.6-sol` / `high`, requested == observed),
each in its **own** worktree, each against an **immutable** commit.

### Supervisor-fixable findings — all closed

| Finding | Fix | Verified by |
| --- | --- | --- |
| Two identity laws, two ordering laws | One law each, stated once in §6 | cross-file search → **0** surviving variants |
| Archetype A2 failed doctrine's trigger | A1 contracts + A6 CLI emission + A5 plugin; host app is userland; A3 trigger written down | doctrine `06-archetypes.md:41-77` |
| Gate union omitted the CLI surface | Redrawn from A1+A6+A5 with F-2/F-3/F-4/F-9, consumer and e2e-CLI gates | §13.3 |
| Slices were outcomes, not slices | 16 slices, each with files, contract, and one proving command | §14 |
| Partial JSR rubric | Full audit-skill checklist, 11 rows | §13.2 |
| `worklog.md` claimed work that never happened | Rewritten to actual status incl. two `NOT DONE` rows | this file |
| F-1 called reversible | Withdrawn; classified must-resolve; R1 corrected | `plan.md` rework audit |
| Seed deliverables missing | 25 drafts produced, no board mutation | `filing/` |
| **Two corpora** (RFC vs `rfc-sections/`) | Scaffold **deleted**; `RFC-AUTHORITY.md` states the authority order | cross-file search |

### Owner-gated — the run cannot clear these

1. **D-10 / GLM 5.2 design pass.** Unlaunchable. Needs a launcher repair **or an explicit owner
   waiver** of the charter and `lane-policy` invariant 5. Not substitutable — the run refused to
   relabel Sonnet's scrutiny as the mandated pass.
2. **F-1 — package/spine ownership.** Fixes public specifiers and emitter ownership; blocks W1-a.
3. **F-3 — manifest schema evolution.** `.passthrough()` vs `schemaVersion: 2` have different
   old-CLI behavior *and different tests*; blocks the pointer and emitter slices.

**Escalated per `run-loop.md` §4: two `FAIL_PLAN` cycles, then the user decides.** No third cycle was
opened, and no board entry was filed.

## Post-ratification execution (2026-08-11)

| Step | Outcome |
| --- | --- |
| Stage-D2, owner-directed | **Qwen 3.8 Max** (architecture) + **Kimi K3** (pure UI/UX), read-only surfaces, findings-only. Observed identity **matched** requested on both. Each found a **critical** |
| Evidence capture | First launches truncated by my own `tail -40` (**D-17**); both re-run with full redirection; truncated tails **kept** as evidence |
| Amendment A (§6/§7) | F-3 `.passthrough()` normative; one zone rule with typed contexts + 6th quarantine state; canonical `DevToolsPanelState<T>`; third-party mount; F-1 propagated |
| Amendment B (§8/§11) | Six `*Data` wire shapes; **worked end-to-end contributor data path**; matrix consumes the canonical union (10 surfaces × 9 arms, no blanks); ranked row schema + deterministic order; `/flows` index; density + truncation disclosure; `/automation` staged behaviour |
| Amendment C (map/manifest) | **#412 `AMEND` → `SUPERSEDE`**; every #890-dependency hedge rewritten under ratified F-1; live re-read corrected the child count 28 → **29** |
| Findings sweep | **22 findings — 21 fixed, 1 declined with re-entry, 0 deferred** (`FINDINGS-SWEEP.md`) |
| Cross-reference sweep | **`CROSSREF: 0 contradictions, 0 duplications`** vs #890 / RFC-0001 / RFC-A; **21 internal defects** found and fixed, incl. §6/§8 contradicting the new INV-9 |

### Gate results — final

| Gate | Result | Evidence |
| --- | --- | --- |
| `deno task docs:links --root docs/architecture/rfc --pretty` | **PASS** | `docs=1 broken-links=0 broken-anchors=0 orphans=0` |
| `deno task docs:accuracy` | **PASS** | exit 0; 192 published source pages checked |
| Code-fence balance | **PASS** | 90, balanced |
| Retired-vocabulary sweep | **PASS** | `PanelAvailability`/`DevToolsPanelId`/`plugin-devtools-core`/`contribution-core` → 0 outside correction notes |
| Identity / ordering residue | **PASS** | 0 compound-id, 0 flat-sort |
| Lock hygiene | **PASS** | `deno.lock` clean |
| PLAN-EVAL | `FAIL_PLAN` ×2 → **owner waiver** (D-18) | `plan-eval.md` banner states it is **not** an evaluator PASS |

`check`/`test`/`lint`/`arch:check`/`quality:scan`/`e2e:cli` remain **N/A**: the changeset is Markdown
only, with no `packages/**` or `plugins/**` source.
