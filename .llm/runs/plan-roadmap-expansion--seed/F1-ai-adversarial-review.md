# F1-ai Adversarial Review — Topic F-ai (AI suite)

## Overall Verdict

The F-ai section is **not PLAN-EVAL-ready**. A strict Plan-Gate evaluator should return
`FAIL_PLAN`: the plan invents a beta.6 dashboard AI-panel dependency that Topic-A did not ratify,
misstates the Topic-B T9 dependency boundary while claiming FAI-17 is the same work, and carries an
internally inconsistent supersession/new-issue map. The slice list is under the `<30` cap and many
source spot-checks are real, but the cross-topic edges and filing taxonomy are not stable enough for
OpenHands PLAN-EVAL. These are plan-artifact defects, not implementation unknowns.

## Findings

### F1AI-01 — BLOCKER — F-ai invents a beta.6 dashboard AI panel that Topic-A did not scope

- **Artifact:** `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/proposal.md:96-98`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/proposal.md:257-269`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/open-questions.md:31-41`,
  `.llm/runs/plan-roadmap-expansion--seed/plan.md:141-153`.
- **Problem:** The F-ai design says "the dashboard AI panel targets beta.6" and makes Topic-A's
  alleged AI panel hard-depend on FAI-0...3, with FAI-6 becoming a hard dependency if the panel renders
  generative UI. The ratified Topic-A design does not contain a beta.6 AI panel. Its only explicit
  AI edge is DDX-19 "Codegen-from-UI", which is stable-tier and a cross-epic handshake with #238.
- **Evidence:** Topic-A's DAG lists DDX-19 as `[STABLE]` with `⇄ #238`
  (`design/A-dashboard/epic-and-issues.md:52-55`). The DDX-19 issue itself is stable-tier, names the
  AI edge as "AI-on-codegen convergence", and says it is not net-new dashboard scope
  (`design/A-dashboard/epic-and-issues.md:307-316`). Topic-A OQ-13 confirms the dashboard "Add
  resource" action is stable, not beta.6 (`design/A-dashboard/open-questions.md:103-109`). The broad
  search for `AI` in Topic-A only finds this stable DDX-19/OQ-13 edge, not a beta.6 invoke/observe
  panel. The integrated A-E owner fork OF-6 is "AI-invocation-at-beta.6" as a telemetry seam choice,
  not a ratified Topic-A panel issue (`plan.md:195`).
- **Why this fails/risks PLAN-EVAL:** Plan-Gate requires carried-in and cross-topic material to be
  re-baselined honestly. This F-ai dependency would force unnecessary beta.5/beta.6 hard deps on
  Topic-A and could make implementers file or block work for a dashboard panel that the ratified A-E
  graph does not contain.
- **Fix:** Reframe OQ-3 and all "dashboard AI panel" lines as a stable DDX-19/codegen-from-UI
  handshake unless the owner explicitly reopens Topic-A with a new beta.6 AI panel. Keep FAI-0...3 as
  the AI plugin parity floor, but do not present it as a hard dependency of Topic-A beta.6.

### F1AI-02 — BLOCKER — FAI-17 claims to be Topic-B T9 but drops T9's required T3 dependency

- **Artifact:** `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/proposal.md:239-253`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:281-296`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/open-questions.md:6-17`,
  `.llm/runs/plan-roadmap-expansion--seed/plan.md:125-151`.
- **Problem:** F-ai correctly notices that FAI-17 and Topic-B T9 are the same `@netscript/ai/otel`
  adapter work, but it rewrites the hard dependency list to Topic-B T1 + T6. Topic-B's own T9 issue
  and DAG make T9 depend on T3 + T6. T3 is not cosmetic: it is the provider-adapter/SDK posture that
  supplies the OpenTelemetry adapter shape, flush-on-exit behavior, and runtime dependency boundary
  T9 uses.
- **Evidence:** Topic-B T3 creates the thin-vs-SDK provider adapters and is load-bearing for T5/T6
  (`design/B-telemetry/epic-and-issues.md:68-79`). Topic-B T9's labels and dependency line say
  `Deps: T3, T6` (`design/B-telemetry/epic-and-issues.md:146-156`), and the Topic-B DAG repeats
  `T3, T6 -> T9` (`design/B-telemetry/epic-and-issues.md:160-168`). F-ai instead states "Hard-deps:
  FAI-17 -> Topic-B T1 ... and Topic-B T6" (`design/F-ai/proposal.md:249-251`) and repeats T1 + T6 in
  the issue draft and agent brief (`design/F-ai/epic-and-issues.md:292-293`,
  `design/F-ai/agent-briefs.md:191-197`).
- **Why this fails/risks PLAN-EVAL:** This is a direct contradiction of the cross-topic consistency
  reference. If FAI-17 is filed from the F-ai draft, the stable adapter can start without the adapter
  infrastructure Topic-B says it needs, producing a false dependency graph and likely rework.
- **Fix:** Change every FAI-17 dependency statement to Topic-B **T3 + T6**. Mention T1 only as a
  transitive prerequisite through T2/T3 or as the source of naming/attribute conventions, not as the
  direct hard-dep replacing T3.

### F1AI-03 — BLOCKER — Supersession headline and new-issue count are internally inconsistent

- **Artifact:** `.llm/runs/plan-roadmap-expansion--seed/plan.md:165-168`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:300-334`,
  `.llm/runs/plan-roadmap-expansion--seed/worklog.md:98-101`.
- **Problem:** The plan headline says "3 new" means FAI-10 reasoning, FAI-11 BYOK, and "reconcile
  #388 emitter count in-slice." The design-of-record says the three new issues are FAI-4 doctrine
  backstop, FAI-10, and FAI-11. The issue table also says #272 is **KEEP stable**, while the headline
  counts "#272-by-dependency" as one of the two folds.
- **Evidence:** `plan.md:167` lists the three new items as `FAI-10`, `FAI-11`, and `+ reconcile #388
  emitter count in-slice`. The supersession table lists the actual new issue rows as reasoning,
  BYOK, and doctrine backstop (`design/F-ai/epic-and-issues.md:329-331`) and then states the headline
  "3 NEW issues (FAI-4, FAI-10, FAI-11)" (`design/F-ai/epic-and-issues.md:333-334`). The same table
  marks #272 as `KEEP stable` (`design/F-ai/epic-and-issues.md:316`), while the headline counts two
  folds as `#257, #272-by-dependency` (`design/F-ai/epic-and-issues.md:333-334`; `plan.md:167`).
  The worklog repeats the inconsistent F-ai Stage-D headline and then the Stage-E plan headline
  (`worklog.md:100-101`).
- **Why this fails/risks PLAN-EVAL:** Plan-Gate requires commit slices, deferred scope, and open
  decisions to be explicit. The filing map is the handoff surface for issue creation; an inconsistent
  fold/new count can produce the wrong issues, close/fold the wrong child, or omit FAI-4 entirely from
  Phase-2 filing.
- **Fix:** Pick one authoritative supersession headline. Recommended minimal fix: `15 KEEP (12
  re-sequenced) · 1 FOLD (#257 into #379) · 0 close/supersede · 3 NEW (FAI-4, FAI-10, FAI-11)`, with
  #272 listed as "KEEP stable, dependency-superseded by FAI-8" rather than counted as a fold.

### F1AI-04 — MAJOR — F-ai draft labels do not match the canonical taxonomy or machine label file

- **Artifact:** `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:6-9`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:211-224`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:253-254`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:282-283`,
  `.github/labels.yml:1-151`, `.agents/skills/netscript-pr/SKILL.md:190-210`,
  `.agents/skills/netscript-pr/SKILL.md:238-256`.
- **Problem:** F-ai uses labels that are not present in `.github/labels.yml` and mixes `wave:defer`
  with beta.7 milestones. The PR skill says `wave:defer` maps to stable or Backlog/Triage, while
  FAI-10, FAI-11, and FAI-14 use `wave:defer` with `0.0.1-beta.7`. FAI-17 uses `epic:ai-stack` and
  `epic:telemetry-revamp`, but `.github/labels.yml` has no `epic:` or `wave:` label definitions at
  all.
- **Evidence:** The canonical taxonomy allows only `wave:v1`, `wave:v1-min`, and `wave:defer`, and
  says labels are mirrored in `.github/labels.yml` (`.agents/skills/netscript-pr/SKILL.md:190-210`).
  Its milestone table maps `wave:defer` to `0.0.1-stable` or `Backlog / Triage`
  (`.agents/skills/netscript-pr/SKILL.md:238-256`). `.github/labels.yml` declares type/status/
  priority/area/ci/gate labels but no `wave:` or `epic:` block (`.github/labels.yml:14-151`). F-ai
  labels beta.7 FAI-10/11 as `wave:defer` (`design/F-ai/epic-and-issues.md:211-224`), FAI-14 as
  `wave:defer` with beta.7 (`design/F-ai/epic-and-issues.md:253-254`), and FAI-17 with two epic labels
  (`design/F-ai/epic-and-issues.md:282-283`).
- **Why this fails/risks PLAN-EVAL:** The user explicitly required taxonomy validation. This is a
  filing blocker: the drafts cannot be applied as written without either creating missing labels or
  violating the wave-to-milestone mapping.
- **Fix:** Add an F-ai owner action that explicitly syncs `epic:ai-stack`, `epic:telemetry-revamp`,
  and `wave:v1`/`wave:v1-min`/`wave:defer` into `.github/labels.yml` before filing. Change beta.7
  implementation slices from `wave:defer` to the accepted beta scheduling band, or record an explicit
  taxonomy amendment that maps `wave:defer` to beta.7 for this roadmap before using it.

### F1AI-05 — MAJOR — Gate set selection is only `gate:jsr`/`gate:e2e`, not the archetype gate matrix

- **Artifact:** `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/proposal.md:273-288`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:61-296`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/agent-briefs.md:16-197`,
  `.llm/harness/gates/archetype-gate-matrix.md:18-80`.
- **Problem:** The F-ai artifacts select `gate:jsr` and `gate:e2e` per slice, but they do not select
  the required archetype gate set from the matrix for the actual surfaces: Archetype 1 contract,
  Archetype 2/integration package surfaces, Archetype 3 runtime behavior, Archetype 5 plugin, and
  docs/doctrine prose. The matrix requires F-1...F-19 style static/fitness gates for every archetype,
  not only doc-lint/publish and e2e smoke tests.
- **Evidence:** Plan-Gate requires the "gate set selected" box to be chosen from the archetype gate
  matrix (`.llm/harness/gates/plan-gate.md:29-30`). The matrix marks F-1 through F-19 as required
  across the package/plugin archetypes and explains static/runtime/consumer import validation
  (`.llm/harness/gates/archetype-gate-matrix.md:18-80`). F-ai's JSR surface delta table only names
  `deno doc --lint` and `deno publish --dry-run` acceptance (`design/F-ai/proposal.md:273-288`), and
  the slice issues repeat `gate:jsr`/`gate:e2e` labels without a selected F-gate bundle.
- **Why this fails/risks PLAN-EVAL:** A strict evaluator walking Plan-Gate cannot check the "Gate set
  selected" box for F-ai. This matters because FAI-0 changes contract soundness, FAI-6/8 touch runtime
  Fresh subpaths, FAI-7/10/11/13/15/16/17 alter `@netscript/ai` public package surfaces, and FAI-3
  turns an unpublished plugin into a publishable one.
- **Fix:** Add a compact F-ai gate matrix mapping each surface to its archetype and required gates:
  scoped check/lint/fmt, `arch:check`/doctrine fitness gates F-1...F-19 as applicable, full export
  `doc:lint`, publish dry-run, consumer import/prod-install where public subpaths change, and
  scaffold.runtime e2e for plugin slices.

### F1AI-06 — MAJOR — Open-decision sweep underplays rework for OF-F3

- **Artifact:** `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/open-questions.md:31-41`,
  `.llm/runs/plan-roadmap-expansion--seed/plan.md:151-163`.
- **Problem:** OF-F3 says invoke-vs-observe only changes FAI-6 dependency shape and "not the slice
  set." That classification depends on the invented beta.6 dashboard AI panel from F1AI-01. If an
  actual beta.6 invoke panel is added, FAI-0/FAI-6/FAI-9 become critical-path blockers and Topic-A's
  beta.6 DAG changes. If no such panel exists, the dependency row should be deleted or deferred to
  stable DDX-19. Either path is plan rework, not a harmless deferral.
- **Evidence:** F-ai's OQ-3 says the panel can invoke or observe AI and that the dependency shape
  differs (`design/F-ai/open-questions.md:31-35`). The plan says this changes the FAI-6 dep shape but
  not the slice set (`plan.md:153`) and then concludes there is no `FAIL_PLAN` open decision in the
  F-ai set (`plan.md:160-163`). Topic-A's ratified AI edge is stable DDX-19, not a beta.6 panel
  (`design/A-dashboard/epic-and-issues.md:307-316`).
- **Why this fails/risks PLAN-EVAL:** Plan-Gate explicitly says an open decision that would force
  rework when deferred is `FAIL_PLAN`. OF-F3 is either a non-existent cross-topic edge that must be
  removed or a new beta.6 dashboard scope that would force A/F DAG rewrites.
- **Fix:** Reclassify OF-F3 as "must resolve before PLAN-EVAL if keeping a beta.6 panel edge"; or
  delete the beta.6 panel framing and replace it with the stable DDX-19 handshake, making the deferral
  genuinely safe.

### F1AI-07 — MINOR — FAI-9 is called the epic merge gate but only proves beta.6 capabilities

- **Artifact:** `.llm/runs/plan-roadmap-expansion--seed/plan.md:130-132`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:198-204`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:336-347`.
- **Problem:** The `ai-stack` epic row names FAI-9 as the merge-gate. FAI-9 only proves beta.6
  generative-UI and MCP widget capability. It does not gate the beta.7 depth seams (reasoning/BYOK,
  system-prompt, skills, memory/retriever) or stable FAI-17.
- **Evidence:** FAI-9 acceptance is limited to a generative-UI render assertion plus an MCP widget
  round-trip (`design/F-ai/epic-and-issues.md:198-204`). The milestone summary places FAI-10...16 at
  beta.7 and FAI-17 at stable (`design/F-ai/epic-and-issues.md:342-347`). Yet the epic row lists
  FAI-9 as the merge-gate for the whole 18-slice `ai-stack` hardening epic (`plan.md:130-132`).
- **Why this fails/risks PLAN-EVAL:** This is not necessarily a blocker if FAI-9 is intended as the
  beta.6 merge-readiness gate, but the artifact wording can let beta.7/stable work appear gated by a
  test that does not exercise it.
- **Fix:** Rename FAI-9 to "beta.6 capability merge gate" and add a separate beta.7/stable gate row
  or per-milestone gate statement for FAI-10...17.

### F1AI-08 — NIT — Some verified source claims are good, but line references need cleanup

- **Artifact:** `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/proposal.md:61-70`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:103-104`,
  `.llm/runs/plan-roadmap-expansion--seed/design/F-ai/epic-and-issues.md:153-154`.
- **Problem:** Several load-bearing source claims are correct, but some exact line references drift
  or use section shorthand that will be brittle during PLAN-EVAL. This is small compared with the
  cross-topic blockers, but easy to fix.
- **Evidence:** The `stream-proxy.stub.ts` raw handler claim is real (`plugins/ai/src/adapter/resources/
  stream-proxy/stream-proxy.stub.ts:16-64`). `plugins/ai/deno.json` has `"publish": false` at line 25.
  `aiContractV1` is at `packages/plugin-ai-core/src/contracts/v1/ai.contract.ts:377-379`, and the
  `chat` route uses `eventIterator(chatChunkZodSchema)` at line 332. The FA3 sandbox export exists in
  `packages/fresh/deno.json:15-16`, while `createNetScriptMcpSandbox` throws at
  `packages/fresh/src/runtime/ai/sandbox.ts:71-77`, not just a generic `sandbox.ts` section.
- **Why this fails/risks PLAN-EVAL:** It will not by itself fail the plan, but exact source citations
  are part of the requested adversarial bar and make evaluator verification cheaper.
- **Fix:** Replace section shorthand with exact `file:line` citations for each FAI-0/3/6/7/10/13/15/17
  source claim.

## Plan-Gate checklist walk

- [x] **Research present and current.** F-ai has a dedicated Stage-B corpus under
  `research|analysis|context|matrix/F-ai` and a Stage-C synthesis
  (`analysis/FABLE-STAGE-C-SYNTHESIS-F-ai.md:1-7`). Source spot-checks confirmed the raw stream proxy,
  `publish:false`, `aiContractV1`, FA3 sandbox skeleton, single MCP transport, no-op telemetry,
  no-op skill loader, omitted memory recall, and OpenRouter reasoning normalizer.
- [ ] **Decisions locked.** LD-F1...F6 exist (`plan.md:117-126`), but LD-F5's dependency rationale is
  wrong against Topic-B T9. Blocking finding: F1AI-02.
- [ ] **Open-decision sweep.** OF-F1...OF-F8 exist (`plan.md:147-163`), but OF-F3 is misclassified as
  non-reworking while depending on an unratified beta.6 dashboard AI panel. Blocking findings:
  F1AI-01 and F1AI-06.
- [ ] **Commit slices.** FAI-0...17 are enumerated and under 30 (`design/F-ai/epic-and-issues.md:22-55`),
  but the supersession/new-issue filing map is inconsistent and FAI-9 is over-described as the whole
  epic merge gate. Blocking finding: F1AI-03. Residual risk: F1AI-07.
- [x] **Risk register.** F-ai risk additions exist (`plan.md:169-176`) and cover first JSR publish,
  FAI-17/T9 double-build, TanStack pre-1.0, and gen-UI scope creep. F1AI-02 means one mitigation is
  incomplete, but the risk register artifact is present.
- [ ] **Gate set selected.** `gate:jsr` and `gate:e2e` are present, but the required archetype gate
  matrix is not selected for each F-ai surface. Blocking finding: F1AI-05.
- [ ] **Deferred scope explicit.** Deferred items are named (`proposal.md:314-320`,
  `epic-and-issues.md:336-347`), but the #272 fold/keep status and the stable/beta dashboard AI edge
  are inconsistent. Blocking findings: F1AI-01 and F1AI-03.
- [ ] **jsr-audit (package/plugin waves).** The planned public-surface scan exists
  (`proposal.md:273-288`), and individual slices carry doc-lint/publish bullets. It is incomplete as a
  publishability plan because the gate set lacks the full archetype/source gates and the draft labels
  do not match the machine taxonomy. Findings: F1AI-04 and F1AI-05.
