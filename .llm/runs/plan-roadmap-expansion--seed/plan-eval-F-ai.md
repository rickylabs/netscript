<!-- PROVENANCE: This is the F-ai-leg verdict-of-record authored by the independent OpenHands
     PLAN-EVAL run-28722662042-1 (minimax M3 via OpenRouter), a separate session from the Fable 5
     author and from the WSL-Codex F1-ai adversarial reviewer. The run's agent exited 0 and committed
     this file as `a1e66534` inside the CI runner, but the workflow's "Commit changes back to PR
     branch" step failed to push it (the known commit-back caveat — the job reported status "failure"
     for that step, NOT a self-post decline). Per the trigger's own protocol note, the posted PASS
     summary + this committed artifact ARE the verdict of record. Content recovered verbatim from the
     run artifact `openhands-agent-28722662042-1` (agent.log file_editor create action) and committed
     by the supervisor to restore the F-ai verdict of record — NOT re-authored, re-scored, or
     defended. The canonical clean copy is also preserved in the run's posted
     `<!-- openhands-agent-summary -->` comment on PR #397 (issuecomment-4884094576) and run artifact
     openhands-agent-28722662042-1. The A–E verdict of record (`plan-eval.md`) is unchanged. -->

# PLAN-EVAL — `plan-roadmap-expansion--seed` (Topic F-ai leg)

- Plan evaluator session: OpenHands `run-28722662042-1` (minimax M3 via OpenRouter) — separate from
  the Fable 5 author session and from the WSL-Codex F1-ai adversarial reviewer
- Run: `plan-roadmap-expansion--seed` (branch `plan/roadmap-expansion`, PR #397, draft)
- Leg: **F-ai (AI suite) only** — Topic-F post-ratification integration; the A–E plan already PASSED
  PLAN-EVAL (verdict of record `plan-eval.md`, OpenHands `run-28716441078-1`, minimax M3)
- Surface / archetype: **PLANNING-ONLY** — no framework code. The F-ai planned public-surface deltas
  span the same archetype columns the A–E plan covered: `plugins/ai` = Archetype 5 (plugin);
  `@netscript/plugin-ai-core` `/v1/ai` contract = Archetype 1; `@netscript/ai` package public surface
  (`./otel`, `./mcp`, `modelOptions`/BYOK, skill/memory/retriever ports) = Archetype 2;
  `@netscript/fresh/ai` runtime = Archetype 3; `@netscript/fresh-ui` `ai` registry = Archetype 2;
  doctrine-11 prose = docs authoring exception.
- Scope overlays: docs (planning artifacts only). Runtime + jsr + arch-check + e2e validation
  deferred to per-slice IMPL-EVAL.
- Evaluator protocol: `gates/plan-gate.md` + `evaluator/plan-protocol.md` (separate-session
  discipline observed; this session did not author, defend, or re-edit the plan).
- F2 commit verified: `1d3ca080` (Fable 5, 2026-07-05) — "plan(F-ai): resolve F1-ai adversarial
  findings + V3 commits.md cleanup" — at HEAD of `plan/roadmap-expansion`, in sync with
  `origin/plan/roadmap-expansion`. Working tree clean.

## F1-ai adversarial fix verification (8 findings, F2 commit `1d3ca080`)

| ID | Severity | Status | Evidence (post-F2) |
| --- | -------- | ------ | ------------------ |
| **F1AI-01** | BLOCKER — invented beta.6 Topic-A "dashboard AI panel" | **FIXED** | The invented panel is removed everywhere. `design/F-ai/proposal.md:96-100` reframes FAI-0…3 as a parity **floor** for the OF-6 telemetry seam + stable DDX-19 handshake, not a Topic-A beta.6 hard-dep. `design/F-ai/open-questions.md:34-54` (OQ-3) is fully corrected with a recommended default. `plan.md:144-149` (F-ai DAG lane annotation) explicitly says `[no ratified beta.6 Topic-A "AI panel": FAI-0…3 is a parity FLOOR … NOT a Topic-A beta.6 hard-dep (F1AI-01/OQ-3)]`. `plan.md:161` (OF-F3 row) classifies it safe-to-defer. The ratified Topic-A graph (DDX-19 stable `⇄ #238` + OF-6 telemetry-seam) is the only AI edge; no F-ai slice set or milestone changes. |
| **F1AI-02** | BLOCKER — FAI-17 deps stated T1+T6; T9's real deps are T3+T6 | **FIXED** | Every FAI-17 dep statement now reads **T3 + T6 (T1 transitive)** across all five artifacts. `design/F-ai/proposal.md:247-252`: "**Hard-deps:** FAI-17 → Topic-B **T3** (thin-vs-SDK provider adapters + flush-on-exit …) and Topic-B **T6** … This matches Topic-B T9's own declared deps (`design/B-telemetry/epic-and-issues.md:156`; DAG `:168` reads `T3, T6 → T9`). Topic-B **T1** is a *transitive* prerequisite … not a direct hard-dep." Verified by grep — `design/F-ai/epic-and-issues.md:307-312` (FAI-17 dep line), `design/F-ai/agent-briefs.md:196-199` (FAI-17 brief dep), `design/F-ai/open-questions.md:6-20` (OQ-1), and `plan.md:125-126` (LD-F5 rationale) all match. Topic-B T9's own deps confirmed at `design/B-telemetry/epic-and-issues.md:156` (`Deps: T3, T6`) and DAG `:168` (`T3, T6 → T9`). |
| **F1AI-03** | BLOCKER — supersession headline/new-issue count internally inconsistent | **FIXED** | Single authoritative supersession headline: **15 KEEP (12 re-sequenced) · 1 FOLD (#257 into #379) · 0 close/supersede · 3 NEW issues (FAI-4 doctrine backstop, FAI-10 reasoning, FAI-11 BYOK).** Mirrored verbatim across both `plan.md:177-181` and `design/F-ai/epic-and-issues.md:331-334` + table `:323-333`. #272 is **KEEP stable, dependency-superseded by FAI-8** — explicitly **not** counted as a fold. The plan.md F-ai supersession block quotes the headline and notes it mirrors `epic-and-issues.md` verbatim. The worklog Stage-E row (`worklog.md:103`) records the reconciliation. |
| **F1AI-04** | MAJOR — draft labels don't match `.github/labels.yml`; `wave:defer` on beta milestones | **FIXED** | Epic-header label-sync owner action added at `design/F-ai/epic-and-issues.md:20-30`: "**Taxonomy/label-file sync (owner action, before Phase-2 filing — F1AI-04).** `.github/labels.yml` currently declares only `type:`/`status:`/`priority:`/`area:`/`ci:`/`gate:` blocks — it has **no** `epic:` or `wave:` label definitions …" and the plan.md OF-F4 row (`plan.md:162`) folds this into the shared A–E owner action OF-1. **Wave→milestone rule:** beta.5/6/7 slices carry `wave:v1`; only stable FAI-17 carries `wave:defer`. Verified by grep on `design/F-ai/epic-and-issues.md`: FAI-10 (`:227`), FAI-11 (`:239`), FAI-14 (`:269`) all use `wave:v1`; only FAI-17 (`:298`) uses `wave:defer` (correct for stable). Read-only label-file check: `.github/labels.yml` has **0** `epic:` definitions and **0** `wave:` label definitions (only 1 comment-header mention at `:4`); this matches the F2 fix's read-only verification that the labels are not yet in the file. |
| **F1AI-05** | MAJOR — gate set only `gate:jsr`/`gate:e2e`, not the archetype gate matrix | **FIXED** | A compact F-ai archetype gate matrix is present in `design/F-ai/proposal.md` §8.1 (lines 306-321): surface → archetype → required gates beyond scoped check/lint/fmt. `plugin-ai-core` `/v1/ai` contract (Arch 1) → contract-soundness test + `arch:check` + full-export `deno doc --lint` + `deno publish --dry-run`; `@netscript/ai` package (Arch 2) → full-export `deno doc --lint` + publish dry-run + `deps:prod-install` on new subpaths; `@netscript/fresh/ai` (Arch 3) → export doc:lint + runtime render/round-trip unit + dry-run; `plugins/ai` (Arch 5) → `verify-plugin.ts` + `plugin doctor` + `scaffold.runtime` `ai` e2e + FAI-3 first-publish full-map doc:lint + dry-run + JSR-safe-asset check. The F-ai epic entry in `plan.md:133-141` explicitly cross-references §8.1 and names the per-archetype gate set. Per-slice `agent-briefs.md` correctly maps each FAI-* to its archetype gate bundle. |
| **F1AI-06** | MAJOR — OF-F3 underplays rework | **FIXED** | `plan.md:161` (OF-F3 row, "Rework if deferred?" column = "**No**"): "**No** — with the invented panel removed, no F-ai slice set or milestone changes. Rework-forcing ONLY if the owner reopens Topic-A to add a beta.6 panel (a Topic-A decision)." `plan.md:171-173` (closing note): "**OF-F3 is no longer rework-forcing:** the F1-ai review removed the invented beta.6 Topic-A AI panel, so deferring OF-F3 changes no F-ai slice or milestone (it becomes rework-forcing only if the owner *reopens Topic-A* …)." `design/F-ai/open-questions.md:46-54` (OQ-3 rework classification): "with the invented panel removed, deferring OQ-3 is **safe** — no F-ai slice set or milestone changes. It becomes rework-forcing **only** if the owner reopens Topic-A to add a beta.6 AI panel …" |
| **F1AI-07** | MINOR — FAI-9 over-described as whole-epic gate | **FIXED** | FAI-9 renamed "beta.6 capability merge gate" (`design/F-ai/epic-and-issues.md:195` scope note + the F-ai epic entry in `plan.md:131` merge-gate column). A per-milestone gate table is present in `design/F-ai/epic-and-issues.md:370-376`: beta.5 = FAI-2 `scaffold.runtime` e2e + FAI-3 `gate:jsr`; **beta.6 = FAI-9 (gen-UI render + MCP widget round-trip)**; beta.7 = FAI-14 `--mcp`/skill e2e variant + per-slice `gate:jsr`; stable = FAI-17 `gate:jsr` + co-land under Topic-B T8 real-e2e. `plan.md:139-141` cross-references the per-milestone gate table and explicitly says "FAI-9 gates **beta.6 only** — beta.5/beta.7/stable carry their own gates." |
| **F1AI-08** | NIT — line-ref precision | **FIXED** | Load-bearing source claims now use exact `file:line` citations. `stream-proxy.stub.ts:16-64` (raw POST bypassing contract) at `design/F-ai/proposal.md:25, :67` and `design/F-ai/epic-and-issues.md:73` and `design/F-ai/agent-briefs.md:20`. `sandbox.ts:71-77` (FA3 `createNetScriptMcpSandbox` throws `notImplemented`) at `design/F-ai/epic-and-issues.md:164` and `design/F-ai/agent-briefs.md:88`. `memory.ts:70` (recall? optional, omitted) at `design/F-ai/epic-and-issues.md:280` and `design/F-ai/agent-briefs.md:173`. `aiContractV1:377-379` (consumer) at `design/F-ai/agent-briefs.md:18` and `design/F-ai/epic-and-issues.md:73` (golden test asserts the import). `packages/fresh/deno.json:15-16` (`./ai/sandbox` already exported) at `design/F-ai/agent-briefs.md:89`. `deno.json:25` (`"publish": false` → flip) at `design/F-ai/agent-briefs.md:57`. |

**V3 bookkeeping also landed:** F2 commit deletes the run-root `commits.md` and corrects "append
commits.md" wording in `design/{A-dashboard,B-telemetry,E-desktop}/agent-briefs.md` to the V3 trail.
Verified by grep — remaining `commits.md` mentions in those files are all V3-correct ("no
commits.md" framing). The F-ai `agent-briefs.md` has zero `commits.md` references. Drift `V3` entry
recorded at `drift.md:197-204`. **No new gap introduced** — the worklog Stage-D+E n5/n6 rows
(`worklog.md:93-98`) and the F2 row (`worklog.md:103`) document each fix; the supersession table and
supersession headline now match; all `wave:` labels on beta slices are `v1`; the F-ai risk rows are
intact.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` exists; re-baselined against `main` (`eeaff336`). F-ai is additive: the F-ai Stage-B corpus (`research\|analysis\|context\|matrix/F-ai`, 14 files per `worklog.md:93`) and Stage-C synthesis (`analysis/FABLE-STAGE-C-SYNTHESIS-F-ai.md`) are committed (`da0ffb77`); the A–E research's 14 findings carry over. F-ai source spot-checks confirmed: `plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts:16-64` (raw POST, never binds `aiContractV1`); `plugins/ai/deno.json:25` (`"publish": false`); `packages/fresh/src/runtime/ai/sandbox.ts:71-77` (`createNetScriptMcpSandbox` throws `notImplemented`); `packages/ai/src/ports/memory.ts:70` (`recall?` optional, omitted). F-ai does not require its own re-baseline beyond the A–E research; the A–E research already covers `@netscript/ai` indirectly via Finding #5 (telemetry per-package grades, ai F) and the BaaS teardown (the cross-epic AI surfaces are scoped in Topic-A's DDX-19/OQ-13). |
| Decisions locked | PASS | `plan.md` lines 113-126 carry **LD-F1…LD-F6** with rationale + source column. Spot-checks: **LD-F2** (FAI-0…3 parity floor for OF-6 telemetry seam + stable DDX-19 handshake, NOT a Topic-A beta.6 hard-dep; `stream-proxy.stub.ts:16-64` confirmed; `plan.md:118-119`) ✓; **LD-F5** (FAI-17 == Topic-B T9; co-own; **hard-deps T3 + T6 (T1 transitive)** — verified at `plan.md:125-126` and matches `design/B-telemetry/epic-and-issues.md:156` T9's own declared deps) ✓; **LD-F3** (doctrine backstop: new dedicated section in doctrine-11 "Thinness is a layering choice, not a quality-bar exemption" + `plugins/ai/README.md` framing fix; `plan.md:121`) ✓; **LD-F4** (gen-UI at beta.6 = renderer + minimal catalog + HTML fallback, full 30+ → stable; `plan.md:123`) ✓. |
| Open-decision sweep | PASS | `plan.md` lines 159-166 carry **OF-F1…OF-F8** with three explicit columns: Status, Rework if deferred? (Yes/No), and Notes. Post-F2 the only "must resolve now" fork is **OF-F4** (milestones + `.github/labels.yml` `epic:`/`wave:` sync — shared with A–E OF-1, a pure owner action, blocks issue-filing only, not design). **OF-F1** is "should resolve before filing FAI-17" and is technically pre-resolved by **LD-F5** with a documented single-issue co-own path. **OF-F3** is reclassified safe-to-defer (rework-forcing only if owner reopens Topic-A — a Topic-A decision, not a silent F-ai deferral). **No `FAIL_PLAN` open decision in the F-ai set** (the closing note at `plan.md:168-173` is correct). My independent sweep (below) found no additional rework-forcing deferrals. |
| Commit slices (< 30, gate + files each) | PASS | **18 slices FAI-0…17** (well under 30). Each is enumerated, ordered, sized, and names its proving gate + files + dep edges in `design/F-ai/epic-and-issues.md:32-55` (DAG block) and per-slice entries `:69-302`. Spot-checks: **FAI-0** `gate:jsr` + files (`stream-proxy.stub.ts:16-64`, `ai.contract.ts:377-379`, soundness test mirroring `workers-core`); **FAI-2** `gate:e2e` + `scaffold.runtime` `ai` join; **FAI-3** `gate:jsr` + `deno.json:25` flip + full-export `deno doc --lint`; **FAI-9** renamed "beta.6 capability merge gate" (per-milestone gate table at `:370-376`); **FAI-17** `gate:jsr` + `gate:e2e` (co-land with Topic-B T8) + hard-deps T3+T6. Each per-slice entry in `design/F-ai/agent-briefs.md` lists lane/model/files/acceptance/##SKILL. **Post-F2 fix to F1AI-03 verified:** the supersession map (`:306-334`) is the single authoritative source and matches `plan.md:177-181` verbatim. |
| Risk register | PASS | `plan.md:184-189` (F-ai risk additions) carries four live risks with concrete mitigations: (R1) `plugins/ai` first JSR publish (FAI-3 `gate:jsr` with full-map doc:lint + dry-run + JSR-safe asset embedding; `latest:null` documented as cosmetic); (R2) FAI-17/T9 double-build (LD-F5 co-own + OF-F1 owner ratifies before either filed); (R3) TanStack AI pre-1.0 breaking cadence (exact-pin + upgrade-watch lint, OF-F7); (R4) gen-UI renderer scope-creep to full vocabulary at beta.6 (LD-F4 caps at minimal). All four have a slice-bound or contract-bound mitigation, not a hand-wave. The A–E risk register (plan.md:222-230) carries forward; F-ai's four additions integrate with the A–E Drift Watch and Risk Mitigations. |
| Gate set selected | PASS | `design/F-ai/proposal.md` §8.1 (lines 306-321) names the archetype gate matrix mapping each F-ai surface to its archetype + required gates. Cross-referenced from `plan.md:133-141` (F-ai epic entry gate note). The F-ai slice labels correctly carry `gate:jsr` (FAI-0/3/5/6/7/8/10/11/12/13/15/16/17) and `gate:e2e` (FAI-2/9/14) per the matrix; the runnable proxy is `deno task arch:check` plus the scoped `.llm/tools/run-deno-{check,lint,fmt}.ts` wrappers. Per-slice `agent-briefs.md` carries a `## SKILL` chapter that explicitly invokes `jsr-audit` where a public subpath changes. The Plan-Gate "gate set selected" box is checkable. |
| Deferred scope explicit | PASS | `design/F-ai/epic-and-issues.md:336-347` (Milestone summary) and `proposal.md:§10` (Discipline note) carry an explicit deferred list: `#262` gateway, `#247` orchestration, `#271` skill-write approval-gate, `#256` paced-reveal, `#272` MCP-app bridge, the FAI-16 citation-provenance half. Each is named, milestoned stable (or "stable (unchanged)"), and excluded from the 18-slice F-ai set. The A–E plan's Deferred Scope (plan.md:250-256) carries forward; F-ai's deferred list integrates. **Post-F2 fix to F1AI-01 verified:** the invented beta.6 Topic-A AI panel is removed from the F-ai surface — F-ai no longer carries a cross-topic beta.6 dashboard-panel dependency, so the deferred list is honest. **Post-F2 fix to F1AI-03 verified:** #272 is KEEP stable (not a fold), matching the design-of-record. |
| jsr-audit surface scan (pkg/plugin) | PASS | `design/F-ai/proposal.md` §8 (lines 290-305) enumerates the planned public-surface deltas with slice mapping: `plugin-ai-core` `/v1/ai` impl (FAI-0); `plugins/ai` **`publish:false` → publishable** (FAI-3 primary, with FAI-0/FAI-14 also touching); `@netscript/ai` new `./otel` subpath, `modelOptions`/BYOK types, skill-loader, memory/retriever ports, MCP pool exports (FAI-7, FAI-10, FAI-11, FAI-13, FAI-15, FAI-16, FAI-17); `@netscript/fresh/ai` FA3 sandbox renderer export + FA4 `createMcpAppCallHandler` (FAI-6, FAI-8); `@netscript/fresh-ui` `ai` registry FB5 generative-UI catalog + FB4 mcp-ui-widget (FAI-5, FAI-8). Every delta carries `gate:jsr` + `deno doc --lint` (full export map, not `mod.ts` alone) + `deno publish --dry-run` acceptance. Slow-type risk is named: port generic `ChatClientPort<TContext>` + `modelOptions` shape + GenAI-semconv attributes must stay explicitly typed across the publish boundary (per §8.1 archetype-2 row). `plugins/ai` first-publish is flagged as the highest-risk jsr delta (FAI-3). The A–E `research.md` Findings #6-#11 jsr-audit table is referenced (the F-ai deltas are additive to the A–E deltas, not replacements). |

## Open-decision sweep (evaluator-run)

The plan's OF-F1…OF-F8 table is already complete, so this section is the **independent** sweep I ran
looking for any decision the plan *left out* of the OF table that would force rework if deferred. I
evaluated the LD-F1…F6 lock table, the per-epic drafts, the DAG, the supersession map, the risk
register, and the gate matrix; the following are the candidate deferrals I considered and my verdict
on each.

| Candidate decision (not in OF table) | Verdict / Reasoning |
| --- | --- |
| `plugins/ai` first-publish JSR namespace/version strategy | FAI-3 acceptance handles the version bit (prerelease `latest:null` documented as cosmetic, self-heals at first non-prerelease, OQ-4). JSR namespace matches the rest of `@netscript/*` (no F-ai decision). **Not a fail.** |
| GenAI-semconv attribute-version stability for the FAI-17 adapter | Owned by Topic-B **T1** (`SpanNames`/`createGenAiAttributes`) per LD-F5. F-ai is the implementation lane, not the semconv authority. **Not a F-ai decision.** |
| Generative-UI sandbox isolation primitive for FAI-6 (iframe `sandbox=` vs Deno Worker vs custom) | Doctrine binding: **wrap-don't-reinvent** — web-platform `iframe sandbox="allow-scripts"` + `srcdoc` + zero-`src` is the eis-chat reference and the natural default. The agent brief's `deno-fresh` skill + eis-chat precedent make this the obvious choice; the slice's IMPL-EVAL will lock the primitive. Rework-forcing only if a non-web-platform sandbox is chosen (against doctrine). **Not a fail**; standard slice-level concern. |
| `@netscript/ai/otel` runtime dependency declaration (zero-dep default vs opt-in subpath) | A–E LD-4 + OF-5 (owner ratified opt-in OTel-SDK on fan-in) carry the dep posture. FAI-17's `./otel` is naturally an opt-in subpath — consumers import the subpath when they want telemetry. No F-ai-specific decision. **Not a fail.** |
| FAI-2 e2e `ANTHROPIC_API_KEY` handling in CI | FAI-1 acceptance mentions `plugin doctor` `ANTHROPIC_API_KEY` required-config path; FAI-2 e2e presumably uses the same mock/fixture pattern as A–E `scaffold.runtime` e2es. Standard e2e test-shaping concern, not a F-ai design call. **Not a fail.** |
| `#257` "FOLD" mechanism (soft cross-ref + `Superseded by` keyword vs hard close) | The supersession map says "FOLD into #379's landing" — semantically a soft fold. The exact GitHub mechanism (cross-ref vs close with keyword) is owner-gated at Phase-2 filing, slice-level. Not a F-ai plan-time call. **Not a fail.** |
| F-ai supersession map's treatment of `#266` (usage/cost analytics) | Marked "track-only / Backlog/Triage." Owner has not been asked. Acceptable deferral; no F-ai rework. **Not a fail.** |
| Co-owning epic label primary for FAI-17 (`epic:ai-stack` vs `epic:telemetry-revamp`) | OF-F1 covers this ("owner confirms the single-issue co-own and which epic is primary"). No new F-ai decision. **Not a fail.** |
| Race: who files the F-ai supersession map issues first | Owner-gated at Phase-2 filing, ordering not a F-ai design decision. **Not a fail.** |
| Cross-topic docs debt: 5-tutorial `chat` track teaches against `publish:false` `@netscript/ai` | A–E drift C1 already named this; F-ai FAI-3 flipping `publish:false`→publishable naturally clears the debt. No F-ai-specific decision. **Not a fail.** |
| Topic-C tutorial `chat` track timing relative to FAI-2 e2e | The `chat` tutorial teaches mid-flight `@netscript/ai` today; FAI-3 ships publishable at beta.5. Docs refresh is in Topic-C's C5/D9 per A–E plan; timing is owner-gated. **Not a fail.** |

**No additional rework-forcing decisions found.** The plan's OF-F1…OF-F8 sweep is genuinely
complete. F2's reclassification of OF-F3 from rework-forcing to safe-to-defer correctly captures that
the F1AI-01 correction removed the invented Topic-A cross-topic hard-dep.

## Verdict

`PASS`

### Notes (non-blocking)

These are observations the author may want to consider in a follow-up F-cycle; they do **not** affect
the Plan-Gate verdict.

1. **Generative-UI sandbox primitive** is implicitly locked to eis-chat's `iframe sandbox` pattern
   (web-platform, wrap-don't-reinvent). IMPL-EVAL on FAI-6 should record the exact `sandbox=`
   attribute set in the slice's acceptance evidence so the FAI-8 widget round-trip (which shares the
   iframe primitive) inherits a documented posture, not an implicit one.
2. **`@tanstack/ai` exact-pin discipline as a lint rule** (OF-F7) should be added to the
   `.llm/tools/fitness/`-equivalent TanStack-touching slice's `deno task deps:why` evidence before
   FAI-0 lands, so the pin discipline is part of the FAI-2 e2e acceptance (drift at the FAI-0/FAI-1
   boundary is otherwise easy to miss).
3. **Supersession map's `NEW` issue list** (FAI-4 / FAI-10 / FAI-11) — owner must approve before any
   filing. The map explicitly says "DRAFT — owner approves before any Phase-2 filing; NO closes until
   approved; NEVER a closing keyword on #238." The Phase-2 filing HARD-STOP on this run protects the
   live state, but the next run that actually files must surface the approval back to the owner
   explicitly, not as a single "drafts are ready" line.
4. **Lane discipline** for F-ai is consistent with the A–E plan's LD-11: WSL Codex for
   `packages/`/`plugins/`/sdk/db framework code, Opus workflow (docs exception) for FAI-4 doctrine
   prose, OpenHands for per-slice IMPL-EVAL validation. `design/F-ai/agent-briefs.md` encodes this
   lane law per slice. Per-slice `## SKILL` chapters are present and generous (MEMORY
   handover-prompts-need-skill-chapter), avoiding the trap of restating the shared baseline per brief.
5. **Per-milestone gate table** in `design/F-ai/epic-and-issues.md:370-376` is the authoritative
   gate-set source for the F-ai epic; `plan.md:139-141` cross-references it. IMPL-EVAL must use this
   table, not the F-ai epic entry's single "merge-gate" column, to avoid the F1AI-07 conflation
   (FAI-9 gates beta.6 only, not the whole epic).
6. **`wave:defer` on FAI-17** (the only `wave:defer` in the F-ai set) is correct: the slice is at
   `0.0.1-stable`, where `wave:defer` is the canonical label per
   `.agents/skills/netscript-pr/SKILL.md:190-210`. Post-F1AI-04 verification confirms no other F-ai
   slice carries `wave:defer` on a beta milestone.

### Summary for PR comment

Verdict: **PASS** on `plan/roadmap-expansion` (PR #397) for the **Topic F-ai (AI suite) leg**. All
eight Plan-Gate checklist items satisfied; all eight F1-ai findings (3 BLOCKER + 3 MAJOR + 1 MINOR +
1 NIT) verified fixed at F2 (commit `1d3ca080`) without introducing new gaps. The plan's OF-F1…OF-F8
open-decision sweep is genuinely complete: the only "must resolve now" fork (OF-F4 — milestones +
`.github/labels.yml` `epic:`/`wave:` sync) is a pure owner action that blocks issue-filing only, not
design. **OF-F1** (E9/#248 co-ownership) is pre-resolved by LD-F5; **OF-F3** is safe-to-defer
(rework-forcing only if the owner reopens Topic-A). F-ai's supersession headline (**15 KEEP · 1 FOLD
· 0 close · 3 NEW**) is single-source and mirrored verbatim across `plan.md` and
`design/F-ai/epic-and-issues.md`. The 18-slice DAG (FAI-0…17, well under 30) is ordered, sized, and
each slice names its proving gate + files + dep edges. The jsr-audit surface scan covers all F-ai
deltas (`plugins/ai` `publish:false`→publishable, `@netscript/ai` new `./otel` subpath == Topic-B
T9, `@netscript/fresh/ai` FA3/FA4 exports) with the F-ai archetype gate matrix (§8.1) selected per
surface. The A–E verdict of record (`plan-eval.md`) is unchanged; this is the F-ai leg verdict. Plan
is ready for owner ratification; PR #397 stays draft. Phase-2 filing remains HARD-STOPPED per
`worklog.md:103`.
