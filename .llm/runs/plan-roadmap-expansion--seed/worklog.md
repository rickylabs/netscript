# Worklog: roadmap-expansion planning run

## Run Metadata

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| Run ID         | `plan-roadmap-expansion--seed`                               |
| Branch         | `plan/roadmap-expansion` (draft PR #397)                     |
| Archetype      | N/A — planning-only supervisor run (no framework code)       |
| Scope overlays | docs (planning artifacts only)                               |
| Supervisor     | Fable 5 (this session); B=Sonnet 5, D=Opus 4.8, F1=WSL Codex, G=OpenHands minimax M3 |

## Design

This is a PLANNING run: its "public surface" is the roadmap artifact set, not code. The integrated
program design lives in `plan.md`; the per-epic decomposition lives in `design/<topic>/`. Summarized
here per the run-loop requirement.

### Public Surface (artifacts this run produces)

- `plan.md` — integrated cross-epic roadmap: 12 locked decisions, 9-fork open-decision sweep, DAG,
  milestone train, risk register, per-epic gate matrix, deferred scope.
- `research.md` — Plan-Gate re-baseline + 14-row Findings table + delegated-decision resolutions +
  jsr-audit surface scan.
- `design/A-dashboard/`, `design/B-telemetry/`, `design/E-desktop/`, `design/CD-docs/` — four epic
  drafts (`proposal.md` + `epic-and-issues.md` + `agent-briefs.md` + `open-questions.md`).
- `research/`, `matrix/`, `analysis/`, `context/` — the Sonnet-5 corpus (incl. the owner-expanded
  BaaS admin-console teardown: `research/A-dashboard/04-baas-admin-console-teardown.md` +
  `matrix/A-dashboard/_draft-competitor-rows-baas.md`).

### Domain Vocabulary

- **Spine-1** — the coupled `telemetry-revamp` (enabler) + `dev-dashboard` (headline) beta.6 co-land.
- **Flow A / Flow B** — cross-language duckdb hop (stable) / framework-native multi-process fan-in
  (beta.6 flagship); the two-tier grouped-trace resolution (LD-3).
- **D-NSONE** — the delegated dashboard-component-source decision → promote the missing fresh-ui L3
  `blocks/` layer (LD-2), reframed by the Directus panel-contribution precedent.
- **manage-through-UI / panel-contribution / codegen-from-UI / ai-on-codegen** — the four BaaS
  patterns from the owner-expanded source set (Appwrite/Directus/Strapi) folded into Topic-A.

### Ports (key seams the roadmap introduces)

- `TelemetryQueryPort` (dashboard↔telemetry, DDX-3↔T7) — the live-data source-swap seam.
- Aspire dashboard-contribution `command`/`app` kinds (DDX-1, LD-8) — the "control the full stack"
  surface, no `IInteractionService`.
- `ClientLinkPort` in-process adapter (`@netscript/sdk`, #E1, LD-9) — the desktop single-process
  precursor.
- `.withDashboardPanel(...)` plugin-contribution axis (Directus-precedent) — pending Opus-A verdict.

### Constants

- Milestone train: `0.0.1-beta.5/6/7/8` + `stable` (creation = owner fork OF-1).
- Aspire pin `13.4.6`; accepted casts ceiling = 2 (contract as-unknown-as, top-router any).

### Commit Slices (this planning run — < 30)

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Corpus (5 Sonnet agents) | INDEX.md present ×20 cells | `research|matrix|analysis|context/*` |
| 2 | Stage-C synthesis + delegated decisions | byte-evidence cited | `analysis/FABLE-STAGE-C-SYNTHESIS.md` |
| 3 | research.md to Plan-Gate checklist | Findings verifiable | `research.md` |
| 4 | 4 Opus epic drafts | per-epic acceptance criteria | `design/*/` |
| 5 | BaaS addendum (owner-expanded source set) | matches file-03 depth | `research/A-dashboard/04-*`, `matrix/A-dashboard/_draft-*` |
| 6 | Integrated plan.md + ## Design | Plan-Gate checklist | `plan.md`, `worklog.md` |
| 7 | Opus-A BaaS integration | IA + `.withDashboardPanel` verdict | `design/A-dashboard/*` |
| 8 | F1 WSL-Codex adversarial fixes | caveats closed | per finding |
| 9 | PLAN-EVAL (OpenHands minimax M3) | PASS | verdict artifact |

### Deferred Scope

- stable-tier: telemetry AI adapter + Flow-A duckdb (T9); desktop deploy-e2e/signing (#E7/#E8);
  dashboard depth + schema-driven db tab. Out-of-program: baggage propagation, external dual-write,
  #349 serverless. (Full list in `plan.md` § Deferred Scope.)

### Contributor Path

Post-ratification: owner creates milestones (OF-1) + picks forks → issues filed from
`design/*/epic-and-issues.md` → slices execute on their lane (WSL Codex framework/plugin/sdk/db;
Opus workflows docs prose; OpenHands validation) per each slice's `agent-briefs.md`.

## Progress Log

| Time             | Slice | Step | Notes |
| ---------------- | ----- | ---- | ----- |
| 2026-07-04 (n1) | Stage A | Supervisor online | Charter + specs 00/01/02 + topics A–E read in full; harness skill activated; run dir + worktree + WSL gh auth verified; opening comment posted on PR #397 (4883200883). |
| 2026-07-04 (n1) | Stage B | eis-chat reference staged | Private repo cloned in WSL home (9p chmod blocks direct clone), working tree exported via `git archive` to `.llm/tmp/eis-chat-ref` (1220 files; conventions.md / PRODUCT.md / DESKTOP-SHELL.md verified present). tar utime warnings on 9p are benign. |
| 2026-07-04 (n1) | Stage B | Deep-search workflow launched | Realized as 5 concurrent Sonnet-5 agents (one per topic), each under the B1–B4 output contract writing `matrix|analysis|research|context/<topic>/`. Skill-first mandated in every brief; facts-over-verdicts on delegated decisions (D-NSONE, grouped-trace flow, E sequencing). |
| 2026-07-04 (n1) | Stage B | Corpus complete + committed | All 5 agents returned; 75 files across 20 folder/topic cells, every cell + INDEX.md present. Committed 3d70ff5a, pushed. 9 drift candidates recorded in drift.md (E1 172a-2 misattribution, E2 #327 WATCH, A1 D-NSONE reframe, A2 no TS interaction-service, B1 thin cross-lang boundary, B2 telemetry worse-than-leveling+triggers bug, CD1 #232 disjoint, C1 5-tracks+missing-milestones, D1 two-IA blocker). |
| 2026-07-04 (n2) | Stage C | Fable synthesis + both delegated decisions provisionally resolved | Verified the 4 decision-critical B2 files byte-for-byte. Wrote FABLE-STAGE-C-SYNTHESIS.md. **D-NSONE:** promote the missing L3 blocks layer into fresh-ui (L0–L2 already byte-identical copy-source); MCP components out unless dashboard IA needs them. **Grouped-trace flow (two-tier):** beta.6 flagship = Flow B framework-native multi-process pipeline (workers→oRPC callback→streams fan-in with span-links); stable = Flow A cross-language duckdb.exe hop (needs net-new span + env-carrier + language shim). Recorded telemetry true scope (package restructure + triggers bugfix + streams/ai from zero) + E scope correction (ClientLinkPort = real precursor). Commit b7964509, pushed. |
| 2026-07-04 (n2) | Stage D | Opus deep-dives launched | 4 Opus 4.8 high-effort agents (A dashboard, B telemetry, E desktop, CD docs — C+D combined, shared beta.7 cut/#232/IA/eis-chat). Each skill-first, given the Stage-C working positions as validate/detail/push-back inputs, writing concrete design proposals (proposal + epic-and-issues + agent-briefs + open-questions) to `design/<topic>/`. Planning-only; no mutations. |
| 2026-07-04 (n2) | Stage D | Four deep-dives returned | telemetry T1–T9 (crit path T1→T2→T3→T5→T8; oRPC TracingPlugin found to be a silent no-op → T6 pulled onto the flagship gate); dashboard DDX-0…16 (data-grid NOT promoted — collides with existing `DataGrid<T>`; MCP out; Aspire command-kind HARD); desktop #E1–E8 (#E1 ClientLinkPort precursor, tursodb relocation option-c no VFS spike, #349 kept WATCH); docs S0+C1–6+D1–9+V (recommend Opt-2 NEW epic:docs-cut over #232 rescope). Each epic's slice list < 30. |
| 2026-07-04 (n2) | Stage D+ | Owner expanded Topic-A source set | Owner steering mid-flight: add the "manage framework features THROUGH the UI" category — Appwrite Console (north-star), Directus (extensibility/plugin model), Strapi (codegen-from-UI + in-dashboard AI). Launched a matching-lane Sonnet-5 teardown to file-03 depth with citations; produced `research/A-dashboard/04-baas-admin-console-teardown.md` + 17 new matrix rows (kinds: manage/extensibility/codegen-ui/ai-iterate). Committed 2c21bbe2, pushed. Resumed Opus-A (ad61e41252b22b58b) to fold the 5 patterns into the dashboard IA + `.withDashboardPanel` extensibility axis + sharpen D-NSONE with the Directus precedent. |
| 2026-07-04 (n2) | Stage E | Integrated plan locked | Wrote `plan.md` (12 locked decisions LD-1…12, 9-fork open-decision sweep — only OF-5 must-resolve-now and technically resolved by LD-4, cross-epic DAG, milestone train beta.5→stable, risk register, per-epic gate matrix, deferred scope, <30 commit-slice framing at both run + epic levels) and this `## Design` section. Awaiting Opus-A BaaS integration to finalize the Topic-A summary + PR note. |

## Decisions

| Decision     | Reason     | Source                 |
| ------------ | ---------- | ---------------------- |
| `<decision>` | `<reason>` | `<plan/doctrine/code>` |

## Drift

| Drift     | Severity                            | Logged in drift.md |
| --------- | ----------------------------------- | ------------------ |
| `<drift>` | `<minor/significant/architectural>` | `<yes/no>`         |

## Gate Results

### Static Gates

| Gate     | Command or check | Result                    | Notes     |
| -------- | ---------------- | ------------------------- | --------- |
| `<gate>` | `<command>`      | `<PASS/FAIL/N/A/NOT_RUN>` | `<notes>` |

### Fitness Gates

| Gate    | Result                                         | Evidence     | Notes     |
| ------- | ---------------------------------------------- | ------------ | --------- |
| `<F-#>` | `<PASS/FAIL/PENDING_SCRIPT/N/A/DEBT_ACCEPTED>` | `<evidence>` | `<notes>` |

### Runtime Gates

| Gate     | Result                    | Evidence     | Notes     |
| -------- | ------------------------- | ------------ | --------- |
| `<gate>` | `<PASS/FAIL/N/A/NOT_RUN>` | `<evidence>` | `<notes>` |

### Consumer Gates

| Consumer     | Result                    | Evidence     | Notes     |
| ------------ | ------------------------- | ------------ | --------- |
| `<consumer>` | `<PASS/FAIL/N/A/NOT_RUN>` | `<evidence>` | `<notes>` |

## Handoff Notes

- <what the evaluator should inspect first>
