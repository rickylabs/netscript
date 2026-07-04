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
| 2026-07-04 (n3) | Stage E+ | Opus-A BaaS reconciled | Folded Opus-A's IA shift (flat "Plugin Control list" → cross-cutting panels + per-capability create→configure→monitor sections) into plan.md + `design/A-dashboard/*`; added OF-10..13 (per-capability, `.withDashboardPanel` seam, codegen-from-UI/#238, schema-driven db tab); DDX-0…19 slice set; DDX-8 flagship references confirmed intact. pr-body.md Status block refreshed A–E done / F–G pending + owner-expanded-source-set (Appwrite/Directus/Strapi). |
| 2026-07-04 (n3) | F1 | WSL-Codex adversarial review | Launched via `launch-codex-slice.ts` (argv-staged to dodge quote/CRLF landmines), thread `019f2e6c-5d88-7cc1-85fa-c9e850b4f6ca` (gpt-5.5). Verdict **NOT PLAN-EVAL-ready / FAIL_PLAN**: 3 BLOCKER, 5 MAJOR, 1 MINOR, 1 NIT. `F1-adversarial-review.md` pushed to branch (tip 85cf6135). |
| 2026-07-04 (n3) | F2 | Adversarial fixes applied | All 10 findings resolved in the planning artifacts (no framework code, no GH mutation): **F1-01** LD-2/research#1 softened to "5/37 pairs sampled-identical; 32 = DDX-0 full-tree-diff gate"; **F1-02** OF-10 reclassified must-resolve-now (drafted issue graph already assumes per-capability) + closing note corrected to OF-5+OF-10; **F1-03** DDX-8/DDX-16 now hard-depend telemetry **T4/T5/T6/T7 by ID** + acceptance fails if oRPC span is mock-only; **F1-04** DDX-16 given explicit full beta.6 dep list; **F1-05** `.github/labels.yml` missing `wave:*` block → owner action folded into OF-1 + DDX-19 `wave:v2`→`wave:defer`; **F1-06** `gate:jsr` + publish acceptance added to DDX-0/2/4/17/#E1; **F1-07** dashboard slice count corrected 20→**23** (<30 holds); **F1-08** DDX-2/proposal folder vocab fixed (`telemetry/`→`middleware/` drift; `public/` reframed as harness-observed #305/#306 divergence, not "doctrine-clean"); **F1-09** #E2 `Closes #375` moved from issue body to resolving-PR body; **F1-10** research #14 extended to beta.5/beta.8. Register now LD-1…12 + OF-1…13 with two ratify-now forks (OF-5, OF-10). |
| 2026-07-04 (n4) | Stage G | PLAN-EVAL PASS landed + owner ratified | OpenHands run-28716441078-1 (minimax M3) verdict **PASS** (agent exit 0; 8/8 boxes; all 10 F1 findings verified fixed; independent evaluator open-decision sweep found no rework-forcing deferrals). Corrected the job-status diagnosis: "failure" = CI "Commit changes back to PR branch"/"Commit run trace" steps failing (branch held the empty template), NOT a self-post decline. Recovered the evaluator's filled `plan-eval.md` verbatim from the run log (provenance in-file) and landed it (d22df217). Owner ratified: OF-5 opt-in OTel-SDK on fan-in; OF-10 per-capability sections; OF-11 contract owned by `plugin-dashboard-core` (not core axis). Stage-G PASS comment posted (4883825291); PR #397 body → "Plan-Gate PASSED", still draft. |
| 2026-07-04 (n4) | F-ai Stage B | AI-suite corpus complete | Topic F-ai (6th topic) folded in post-ratification. 4 concurrent Sonnet-5 deep-search agents wrote 14 files across `research|context|analysis|matrix/F-ai`. Verdict: F-ai is **evaluate-and-harden, not rebuild** — the five-home split under #238 (`@netscript/ai` alpha.0 + 6 adapters / `plugin-ai-core` beta.2 oRPC / `plugins/ai` beta.2 `publish:false` / `@netscript/fresh/ai` FA0–2) is correctly shaped; eis-chat is the proof-of-pattern reference (consumes TanStack directly). 5 flagship gaps found (generative-UI renderer stub, MCP single-transport, SkillLoaderPort no-op, no reasoning/BYOK seam, MemoryPort unbuilt); `stream-proxy.stub.ts` bypasses the contract; flagship-quality law has NO doctrine backstop (only #238-c10/#388). |
| 2026-07-04 (n4) | F-ai Stage C | Fable synthesis | Wrote `analysis/FABLE-STAGE-C-SYNTHESIS-F-ai.md`. Working positions: reaffirm TanStack AI (not Vercel; Deno fit) + wrap `chatOtelMiddleware` for GenAI spans + keep `@tanstack/ai-mcp` (exact-pin, pre-1.0 gate); prioritize generative-UI renderer + MCP pooling (beta.6, gate visible parity) after #388 flagship parity (beta.5); promote the flagship-quality-parity law into doctrine (beta.5 backstop). 5 owner forks: milestone re-sequence of #238 beta.3 children into beta.5–8 train; doctrine promotion; AI sub-issue DAG supersession (#262+#290+#247 as unit, #271+#272 collapse); generative-UI scope; TanStack pre-1.0 pin acceptance. Stage-D fan-out = one Opus-F deep-dive. |
| 2026-07-04 (n5) | F-ai Stage D | Opus-F deep-dive returned | One Opus-4.8 high-effort agent wrote `design/F-ai/{proposal,epic-and-issues,open-questions,agent-briefs}.md`. **18-slice DAG FAI-0…17 (<30)**: beta.5 parity+doctrine (FAI-0 `/v1/ai` impl+bind scaffolder / FAI-1 verify+golden+doctor / FAI-2 ai-e2e / FAI-3 publish:false→publishable gate:jsr / FAI-4 doctrine backstop); beta.6 gen-UI + MCP pooling + capability-e2e (FAI-5…9); beta.7 reasoning/BYOK/system-prompt/skills/memory/retriever (FAI-10…16); stable OTel adapter (FAI-17). Key finds: `stream-proxy.stub.ts:16-64` bypasses `aiContractV1`/`AiRouter` (raw handler) → FAI-0; **FAI-17 == Topic-B T9** (co-own, F-ai implements, hard-dep T1+T6); 8 open questions each with a recommended default. Supersession headline: 15 keep (12 re-sequenced) / 2 fold (#257→#379, #272-by-dep) / 0 close / 3 new (reasoning, BYOK, +#388 emitter reconcile). Overrode Stage-C where evidence differed (#248/E9→stable co-own; reasoning/BYOK un-issued→2 new; #262/#247→stable; FAI-10 extend-not-greenfield). |
| 2026-07-04 (n5) | F-ai Stage E | F-ai design locked into plan.md | Added a self-contained "Topic F-ai — post-ratification integration" section to `plan.md` (keeps ratified A–E LD/OF numbering untouched): **LD-F1…F6** (evaluate-and-harden / #388 parity spine beta.5 / doctrine backstop beta.5 / gen-UI minimal-first / FAI-17==B-T9 co-own / 18-slice bound), an `ai-stack` epic row (18 slices, beta.5→stable), the F-ai DAG lane threaded into the train with cross-topic hard-deps (dashboard OF-6→FAI-0…3 parity floor + FAI-6 if gen-UI; FAI-17→B-T1+T6), **OF-F1…OF-F8** = the 8 OQs with statuses (only OF-F4 milestones must-resolve-now; OF-F1 resolved by LD-F5; no FAIL_PLAN fork), a DRAFT supersession map (owner-approved before any close; never a keyword on #238), and F-ai risk rows. Worklog Stage-D+E rows appended. Next: F1 WSL-Codex adversarial review of the F-ai plan, then F2 fixes, then Stage-G OpenHands PLAN-EVAL (separate session, must PASS). Phase-2 filing remains HARD-STOPPED; PR #397 stays draft. |
| 2026-07-05 (n6) | F-ai F1 | WSL-Codex adversarial review of F-ai | Launched via `launch-codex-slice.ts` (argv-staged), fresh thread `019f2f53-bac8-7652-bf4b-10505b078714` (gpt-5.5, approval=never, sandbox=dangerFullAccess), reviewing ONLY the F-ai design against the Plan-Gate. Verdict **NOT PLAN-EVAL-ready / FAIL_PLAN**: **3 BLOCKER** (F1AI-01 invented beta.6 Topic-A "dashboard AI panel"; F1AI-02 FAI-17 deps stated T1+T6 but T9's real deps are T3+T6; F1AI-03 supersession headline/new-issue count internally inconsistent), **3 MAJOR** (F1AI-04 draft labels don't match `.github/labels.yml` — no `epic:`/`wave:` blocks + `wave:defer` on beta milestones; F1AI-05 gate set only `gate:jsr`/`gate:e2e`, not the archetype gate matrix; F1AI-06 OF-F3 underplays rework), **1 MINOR** (F1AI-07 FAI-9 over-described as whole-epic gate), **1 NIT** (F1AI-08 line-ref cleanup). `F1-ai-adversarial-review.md` committed `6b1f2e9c`, pushed to `plan/roadmap-expansion` (did NOT overwrite the A–E `F1-adversarial-review.md`). |
| 2026-07-05 (n6) | F-ai F2 | Adversarial fixes applied (planning-only) | All 8 findings resolved in the F-ai artifacts + plan.md Topic-F section (no framework code, no GH mutation): **F1AI-01** removed the invented beta.6 Topic-A AI panel everywhere → FAI-0…3 reframed as a parity *floor* for OF-6 telemetry seam + stable DDX-19 handshake, NOT a Topic-A beta.6 hard-dep (proposal §1/§7, plan DAG + OF-F3, OQ-3); **F1AI-02** FAI-17 deps corrected T1+T6 → **T3+T6** (T1 transitive) across proposal/epic-and-issues/agent-briefs/OQ-1/plan LD-F5+DAG+OF-F1, matching B-T9's declared deps; **F1AI-03** single authoritative supersession headline **15 KEEP · 1 FOLD (#257→#379) · 0 close · 3 NEW (FAI-4/10/11)**, #272 = KEEP-stable-not-a-fold, mirrored in plan+epic-and-issues; **F1AI-04** epic-header label-sync owner action added (`epic:ai-stack`/`epic:telemetry-revamp`/`wave:*` into `.github/labels.yml`, folded into OF-F4) + FAI-10/11/14 `wave:defer`→`wave:v1` (beta.7 is v1 train); **F1AI-05** added Archetype gate matrix §8.1 (surface→archetype→gates) + plan epic-entry gate note; **F1AI-06** OF-F3 reclassified safe-to-defer (rework-forcing only if owner reopens Topic-A); **F1AI-07** FAI-9 renamed "beta.6 capability merge gate" + per-milestone gate table; **F1AI-08** tightened FAI-0/FAI-6 exact `file:line` refs. **Verdict impact:** all 3 blockers + 3 majors + minor + nit closed; register still LD-F1…F6 / OF-F1…F8 with **no FAIL_PLAN open decision**. Also folded V3 cleanup: deleted run-root `commits.md`; fixed "append commits.md" wording in A/B/E `agent-briefs.md`; grep confirms all remaining refs V3-correct. Divergences recorded in `drift.md` (FAI-1, FAI-2, V3). Committed `1d3ca080`, pushed explicit refspec (`6b1f2e9c..1d3ca080`) via WSL codex; remote tip verified; PR #397 confirmed still DRAFT. Next: Stage-G OpenHands PLAN-EVAL (separate session, must PASS). |
| 2026-07-05 (n6) | F-ai Stage G | OpenHands PLAN-EVAL dispatched | Posted the F-ai PLAN-EVAL trigger (`@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment`) as PR comment `issuecomment-4884094177`, separate evaluator session (minimax M3). Scoped to the Topic F-ai leg only (A–E already PASSED — `plan-eval.md` run-28716441078-1); instructed to verify all 8 F1-ai fixes, walk the Plan-Gate box-by-box, run an independent open-decision sweep, and land the verdict as a NEW `plan-eval-F-ai.md` (NOT overwriting the A–E `plan-eval.md`). Trigger carries the job-status caveat (agent-exit-0 + committed PASS = verdict of record even if the CI commit-back step reports job failure). Polling to completion. |
| 2026-07-05 (n6) | F-ai Stage G | PLAN-EVAL PASS landed | OpenHands `run-28722662042-1` (minimax M3, separate session) verdict **PASS** for the F-ai leg. Agent exited 0; walked the Plan-Gate **8/8**; verified all **8 F1-ai findings FIXED** (F1AI-01…08) with file:line evidence; ran an independent **11-candidate open-decision sweep → 0 rework-forcing**; confirmed the 18-slice FAI-0…17 DAG (<30) ordered/sized/gated and the jsr-audit surface scan. Runner committed `plan-eval-F-ai.md` as `a1e66534` but the CI "Commit changes back to PR branch" step failed to push it (known commit-back caveat; job status "failure" = that step, not a self-post decline) — recovered the 138-line artifact **verbatim** from the run artifact `openhands-agent-28722662042-1` (agent.log file_editor create) and landed it as `plan-eval-F-ai.md` with a provenance header (source run-28722662042-1, PR comment `issuecomment-4884094576`). A–E `plan-eval.md` unchanged. Plan is FULLY RATIFIED (A–E PASS + F-ai PASS). The evaluator's own artifact + Note 3 keep PR #397 DRAFT and Phase-2 filing HARD-STOPPED for the next-run owner-approved filing pass. |

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
