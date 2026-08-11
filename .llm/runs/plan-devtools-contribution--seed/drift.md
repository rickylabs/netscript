# Drift Log: plan-devtools-contribution--seed

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-11 — D-1: `major_ui_ux_*` GLM 5.2 lanes reactivated for this run

- **What:** This run dispatches the `major_ui_ux_design` GLM 5.2 xhigh pass (stage D2).
- **Source:** `.llm/harness/workflow/lane-policy.md` § Canonical routes; charter
  `.llm/devtools-rfc-orchestrator-brief.md` § Identity, routes, and evaluation.
- **Expected:** `lane-policy.md` marks the `major_ui_ux_*` GLM lanes **dormant** while the Dev
  Dashboard is paused (epic #400 moved to `0.0.1-beta.13`).
- **Actual:** The charter mandates the GLM pass for this RFC because the subject *is* major UI/UX
  architecture. The same `lane-policy.md` entry states the lanes "remain the enforced route for any
  major UI/UX work that does run" — so this is a reactivation of a dormant-but-enforced lane, not a
  route invention.
- **Severity:** minor
- **Action:** accept — recorded in `supervisor.md` § Recorded lane/eval overrides.
- **Evidence:** `lane-policy.md:49-53`; charter lines 44-49.

## 2026-08-11 — D-2: IMPL-EVAL is N/A by run shape

- **What:** No IMPL-EVAL session will be dispatched.
- **Source:** charter § Identity, routes, and evaluation; `.llm/harness/workflow/run-loop.md` § 7.
- **Expected:** `run-loop.md` makes IMPL-EVAL mandatory unless the owner explicitly waives it.
- **Actual:** The run commits **no implementation** — its changeset is an RFC plus run artifacts.
  There is no implementation for an IMPL-EVAL to evaluate.
- **Severity:** minor
- **Action:** accept, with substitute assurance recorded rather than the gate silently dropped:
  (a) the formal opposite-family Codex GPT-5.6 Sol high **PLAN-EVAL** at stage G against an immutable
  commit, and (b) the docs accuracy / link / format gate set on the RFC changeset.
- **Evidence:** charter lines 52-53; `supervisor.md` § Routes in force.

## 2026-08-11 — D-3: GLM 5.2 transport capability recorded honestly up front

- **What:** Pre-registering the GLM transport limitation before its output exists, so no later
  artifact can accidentally cite it as reasoning evidence.
- **Source:** `.llm/harness/workflow/lane-policy.md` § OpenRouter through Claude Code (drift D-4,
  amended) — per-model capability table.
- **Expected:** —
- **Actual:** `z-ai/glm-5.2` on the Claude Code + OpenRouter transport returns **zero thinking
  blocks**: tools + streaming, **no reasoning trace**. Its `xhigh` effort is therefore nominal on
  this transport.
- **Severity:** minor
- **Action:** accept — every citation of the stage-D2 pass states "tools + streaming, no reasoning
  trace" and never "GLM 5.2 · xhigh reasoning". GLM is never this run's formal evaluator.
- **Evidence:** `lane-policy.md:185-198`.

## 2026-08-11 — D-4: the assumed Markdown format gate does not exist

- **What:** The run's stage-A validation plan named a scoped `deno fmt` pass over the changed docs and
  the run dir as its format gate.
- **Source:** `deno.json` § `fmt.include`; `.github/workflows/ci.yml` § `quality`;
  `.llm/tools/validation/check-internal-doc-links.ts:104-108`.
- **Expected:** A Markdown formatting gate covering docs and run artifacts.
- **Actual:** `fmt.include` is `packages/**/*.ts(x)` and `plugins/**/*.ts(x)` **only** — `deno task
  fmt:check` never inspects Markdown. Running the scoped wrapper at a Markdown root manufactures 29
  findings that no repo gate asks for, and would rewrite the verbatim upstream artifacts under
  `research/sources/` — corrupting the evidence the corpus cites. The real docs gates are
  `docs:links` (default roots `.llm/harness` + `docs/architecture/doctrine`, so a new RFC dir needs
  an explicit `--root`), `docs:accuracy`, and the CI `quality` job gated on `needs_docs`.
- **Severity:** significant — an unexamined gate list is how a run reports false-green evidence, and
  this one would have damaged its own citations.
- **Action:** fix — `plan.md` § Validation Plan replaced with the real gate set, with the correction
  recorded in place rather than silently swapped. `research/sources/**` is designated
  evidence: never formatted.
- **Evidence:** `deno eval` over `deno.json` (fmt include/exclude); `.github/workflows/ci.yml:243-297`.

## 2026-08-11 — D-5: the OpenHands docs gate cannot fire on a draft PR

- **What:** Checked whether the repo's automatic OpenHands docs-accuracy gate would collide with the
  charter's "Do not use OpenHands" boundary.
- **Source:** `.github/workflows/docs-openhands-eval.yml:8-40`.
- **Expected:** A docs-labelled PR might auto-dispatch an OpenHands evaluator.
- **Actual:** Dispatch requires `pull_request: [ready_for_review]` (or an owner `/docs-eval rerun`
  comment). This PR carries `type:docs` and `area:docs` but stays **draft** for the whole run, so the
  workflow never dispatches.
- **Severity:** minor
- **Action:** accept — the boundary holds **structurally**, not by suppression. Deliberately **not**
  applying `docs-eval:skip`: a label that silences a gate which was never going to fire would be
  misleading evidence in the PR's own record.
- **Evidence:** workflow `on:`/`if:` conditions as cited.

## 2026-08-11 — D-6: #890's additive-pointer-block compatibility claim is false at baseline

- **What:** RFC #890's contract C8 states that `PLUGIN_MANIFEST_SCHEMA_VERSION` "bumps additively;
  older CLIs ignore the block, and because the older host also lacks the frontend generate step,
  ignoring is safe (no half-wired state)." A DevTools family adding a pointer block to
  `scaffold.plugin.json` would inherit the same assumption.
- **Source:** surfaced by the stage-D `T2-contribution-family` pack; **independently verified by the
  supervisor** rather than accepted on the agent's word.
- **Expected:** an unknown top-level manifest field is ignored by an older CLI.
- **Actual:** `PluginInstallerManifestSchema` ends in **`.strict()`**
  (`packages/plugin/src/protocol/manifest.ts:283`) and pins `schemaVersion: z.literal(1)` (`:271`).
  Zod `.strict()` **hard-rejects** any unknown top-level key. An older CLI therefore does not ignore
  a new pointer block — it **fails manifest parsing outright**, taking the whole plugin down rather
  than degrading. Corroborated by the stage-B corpus (`r3` F5), which independently recorded that
  `.strict()` makes additive evolution impossible without a major bump.
- **Severity:** significant — and it is **not scoped to this run**. It is a live defect in RFC #890's
  ratified compatibility story, which epic #922 slice #929 (the `.withFrontend()` pointer axis) is
  planned to implement.
- **Action:** fix, in two places.
  1. This RFC does not inherit the claim. Any manifest-visible DevTools pointer requires an explicit
     **schema-evolution precondition slice** (either a `.passthrough()`/`catchall` relaxation with its
     own compatibility test, or a `schemaVersion` bump with a documented migration) sequenced *before*
     the pointer lands. Recorded as an owner fork in the stage-H brief.
  2. Surface it to the owner as a **cross-RFC finding** so #890/#922 can correct their own plan. This
     run does not edit another epic's board — recording and escalating is the whole permitted action.
- **Evidence:** `packages/plugin/src/protocol/manifest.ts:271,283`;
  `.llm/runs/plan-frontend-contrib--seed/design/canonical/01-contracts.md:336-344`;
  `research/r3-plugin-contribution-axes.md` F5.

## 2026-08-11 — D-7: correcting my own corpus — the generator spawn is whole-filesystem, not project-scoped

- **What:** The stage-B corpus recorded that the runtime-registry generator subprocess is spawned
  with "flat `--allow-read --allow-write` over the whole **project root**"
  (`research/r3-plugin-contribution-axes.md` F10). The stage-D `T6-trust-model` pack asserted the
  broader claim — whole **filesystem**. The supervisor verified rather than picking a side.
- **Source:** `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:416-417`.
- **Expected:** permissions scoped to the project root.
- **Actual:** the flags are bare `'--allow-read'` and `'--allow-write'` with **no `=<path>` value**.
  In Deno a valueless permission flag grants the permission **globally**, so the plugin-authored
  generator subprocess receives whole-filesystem read *and* write — not project-root scope. The
  corpus understated it; `T6` is correct.
  Mitigating fact, also verified: **no `--allow-net` and no `--allow-env`** appear in that argument
  list, so Deno's default-deny blocks network exfiltration from the same subprocess.
- **Severity:** significant. This is a security-relevant claim, and the charter forbids asserting
  security properties without cited evidence — which cuts both ways: an *understated* finding is as
  much a defect as an overstated one.
- **Action:** fix — `r3` F10's scope wording is superseded by this entry (the corpus file is
  immutable stage-B evidence and is **not** rewritten; drift is the correction mechanism). The RFC
  carries the corrected claim, and `T6`'s invariant INV-2 (scope the generator spawn) is retained
  with this evidence rather than the weaker one.
- **Evidence:** `installed-runtime-registry-generator.ts:416-417` (flag list);
  `grep -n 'allow-net\|allow-env'` over the same file → no matches.

## 2026-08-11 — D-8: two corpus claims about the board were wrong; comment threads settled both

- **What:** The stage-D `T9-supersession` pack contradicted two claims in my committed stage-B
  corpus. The supervisor verified both against live GitHub. **T9 is right on both.**
- **Source:** `gh issue view 400 --comments`, re-read live 2026-08-11.
- **Expected (my corpus, `b1` D8 and F7):** (a) `CR-DDX-HOSTAGNOSTIC` "appears in no #400 body text
  and no ratified rescope artifact" — a dangling dependency for #544; (b) "the last owner-ratified
  board event is the 2026-07-06 rescope batch", implying the children's `0.0.15` placement was drift.
- **Actual:**
  - **(a) `CR-DDX-HOSTAGNOSTIC` exists.** Owner comment on #400, `2026-07-06T12:30:28Z`: *"Change
    request from the process-manager epic (#510) — CR-DDX-HOSTAGNOSTIC"*, arriving from epic #510
    (seed-run PR #504, PLAN-EVAL PASS) and asking for a host-neutral panel descriptor with a
    host-provided `setup()` context. It is **recorded but never resolved** — no later comment accepts
    or declines it. So #544's dependency is real and *unanswered*, not imaginary.
  - **(b) A later owner-ratified board event exists.** `2026-07-19T14:40:43Z`: *"Train
    (owner-ratified 2026-07-19). The dev dashboard ships **after everything else** — umbrella tracked
    on Backlog / Triage; all children move to 0.0.1-beta.18"*. The children's present `0.0.15`
    placement is the cascade of that ratified train. **It is deliberate, not drift.** 2026-07-06
    remains the last ratified *content* rescope; 2026-07-19 is a later ratified *scheduling* event.
  - Bonus, same thread (`2026-07-06T12:30:30Z`): a cross-epic **`CommandInvokePort` first-definer**
    acknowledgement between this epic and #510 — relevant to any DevTools action/command kind.
- **Why the corpus was wrong:** the `b1` agent read issue **bodies and PR threads but not issue
  comment threads**, and said so — `b1` open question 10 flagged exactly this gap. The gap was
  recorded honestly, and stage D closed it. This is the citation discipline working as intended: a
  scoped claim with its scope stated, later corrected by evidence, rather than an unscoped assertion
  that would have propagated silently.
- **Severity:** significant. (b) in particular reverses a recommendation: the supersession map must
  **not** propose re-milestoning the children, because their placement is owner-ratified. Proposing
  to "fix" it would have been this run overturning an owner decision it never read.
- **Action:** fix — the map keeps children on `0.0.15` and instead flags **`0.0.14`'s stale
  description** as the real defect; `CR-DDX-HOSTAGNOSTIC` is carried into the RFC as a live,
  unresolved cross-epic change request the DevTools design must answer explicitly.
- **Evidence:** `gh issue view 400 --comments` — comments at `2026-07-06T12:30:28Z`,
  `2026-07-06T12:30:30Z`, `2026-07-19T14:40:43Z`.

## 2026-08-11 — D-9: citation precision correction to D-6 (off-by-one)

- **What:** Drift **D-6** cited the top-level `.strict()` at
  `packages/plugin/src/protocol/manifest.ts:282`. Correct line is **`:283`**; `:282` is
  `linking: linkingSchema.optional(),`.
- **Source:** flagged by the stage-E `06-family` authoring agent while writing against D-6; verified
  by the supervisor (`sed -n '280,284p'` plus `grep -n 'strict()'`).
- **Expected / Actual:** the **finding is unaffected** — `PluginInstallerManifestSchema` does end in
  `.strict()` and does pin `schemaVersion: z.literal(1)` at `:271`. Only the line anchor was wrong.
- **Severity:** minor — but recorded rather than silently patched, because the file contains **nine**
  `.strict()` calls (`:172, :179, :188, :193, :213, :230, :237, :246, :283`) and only the last is the
  top-level installer schema. An off-by-one here would send a reviewer to a nested sub-schema and
  make a correct finding look wrong.
- **Action:** fix — D-6's citation updated in place to `:283`. The RFC and worklog carry the
  corrected anchor.
- **Evidence:** `packages/plugin/src/protocol/manifest.ts:271,283`; `grep -n 'strict()'` over the
  same file returns nine hits.

## 2026-08-11 — D-10: the mandated GLM 5.2 design lane is BLOCKED by a tooling gap

- **What:** The charter **requires** a GLM 5.2 xhigh pure-design pass via the canonical
  `major_ui_ux_design` / `major_ui_ux_adversarial_review` route. **It could not be executed.** Two
  attempts, both failed in under a second with zero tokens.
- **Source:** `deno task agentic:claude-openrouter --model z-ai/glm-5.2 --effort xhigh …`, attempts
  1 and 2. Raw transcripts preserved as `design/ux-evidence/glm-attempt-{1,2}-FAILED.jsonl`.
- **Expected:** a severity-tagged design-findings file.
- **Actual:** attempt 1 returned `is_error: true`, `terminal_reason: "aborted_streaming"`, 0 tokens.
  Attempt 2 surfaced the real cause on stderr:

  ```text
  evaluator model request denied: model=z-ai/glm-5.2 requesting_session=8ced7882-...
  ```

  **Root cause — a policy/tooling gap, not a transient error.** `openrouter-run.ts` is the only
  OpenRouter-through-Claude transport in the `claude/` lane, and its own doc comment states the
  evaluator model guard "is never optional here". The guard
  (`claude/evaluator-model-guard.ts:68-80`) enforces `OPEN_EVALUATOR_MODEL_IDS` at the HTTP request
  boundary and denies anything outside it. GLM 5.2 is **correctly** absent from that allowlist —
  `lane-policy.md` invariant 6 restricts relay **evaluator** lanes to open models
  (`minimax/minimax-m3`, `deepseek/deepseek-v4-flash-0731`).

  So the block is right in its own terms and still wrong in outcome: the **design** preset
  `claude-design-glm-5-2` exists in `runtime/provider-profiles.ts:192` and is bound to
  `major_ui_ux_design` in `runtime/routing-policy.ts:90,171`, but **no launcher can execute a design
  lane** — the only available transport applies an *evaluator* guard to a *design* request. Policy
  declares a lane the execution surface cannot run.
- **Severity:** **significant** — a charter-mandated deliverable is not produced.
- **Action:** **escalate, do not substitute.** Specifically:
  1. The run does **not** fabricate the pass, and does **not** relabel another model's output as the
     GLM pass. There is no authorized fallback: `lane-policy.md` lists no token-limit fallback for
     the `major_ui_ux_*` lanes, and the Kimi K3 vision lane is defined as *complementing, never
     replacing*, the GLM review.
  2. Design scrutiny is still obtained — the design questions are folded into the **stage-F**
     adversarial brief (Sonnet 5) and labelled there **explicitly as a substitute for design review
     only, and NOT the mandated GLM pass**.
  3. The outstanding pass is raised as an **owner escalation** in the decision brief and the PR
     comment, together with the tooling gap, which is a **repo-level defect worth its own issue**:
     either the guard needs a design-lane path, or `openrouter-run.ts` needs a non-evaluator mode,
     or `lane-policy.md` must stop declaring a lane that cannot be launched.
- **Evidence:** `design/ux-evidence/glm-attempt-1-FAILED.jsonl`, `...-2-FAILED.jsonl`;
  `.llm/tools/agentic/claude/openrouter-run.ts:7-9,85`;
  `.llm/tools/agentic/claude/evaluator-model-guard.ts:1,55-80`;
  `.llm/tools/agentic/runtime/provider-profiles.ts:192`;
  `.llm/tools/agentic/runtime/routing-policy.ts:90,171`.

## 2026-08-11 — D-11: the DevTools epic AMENDS #400; it is not a new umbrella

- **What:** The stage-H drafters produced a **new** epic while the supersession map dispositions
  **#400 as `AMEND`**. Filing both would put **two live DevTools umbrellas** on the board.
- **Source:** `filing/epic.md` (drafted as new) vs `design/T9-supersession/supersession-map.md`
  (#400 → `AMEND`); flagged independently by two of the five drafters, including the filing-manifest
  agent which had already resolved it the other way ("the epic is amended #400, not a new epic").
- **Expected:** one umbrella.
- **Actual:** two competing drafts of the same role.
- **Severity:** significant — this is precisely the board fragmentation the RFC exists to end. It
  already documents *three* competing seams and *two* epics claiming the same panels; adding a
  third umbrella while fixing that would be self-defeating.
- **Decision (supervisor):** **AMEND #400.** `filing/epic.md` is retitled as an **amended body for
  #400**, not a new issue. Reasons, in order:
  1. The supersession map — the artifact that actually studied the board — says `AMEND`.
  2. #400 already carries the ownership thesis this RFC promotes to a normative gate, the
     `epic:dev-dashboard` label, and the **owner-ratified 2026-07-19 train**. A new epic would
     strand all three.
  3. It **removes a label blocker**: `epic:devtools` does not exist in `.github/labels.yml` or live,
     and creating a repo label is a board mutation the owner has not authorized. `epic:dev-dashboard`
     exists and already means this.
  4. Fewer umbrellas is the whole point.
- **Action:** fix — `filing/epic.md` becomes the amended-#400 body; the filing manifest's epic row
  becomes an **amend**, not a create; `area:devtools` / `area:frontend` remain **reported blockers**,
  not invented labels.
- **Evidence:** `gh label list` → `epic:devtools` MISSING, `area:devtools` MISSING, `area:frontend`
  MISSING, `epic:dev-dashboard` EXISTS.

## 2026-08-11 — D-12: `.github/labels.yml` has drifted from the live label set

- **What:** The filing-manifest drafter compared `.github/labels.yml` against the live 129-label set
  and found **19 live labels undocumented** in the file (e.g. `area:packages`,
  `epic:road-to-stable`).
- **Source:** `gh label list` versus `.github/labels.yml`, during stage-H drafting.
- **Expected:** `netscript-pr` states the YAML is the machine-readable mirror and that the two are
  kept in sync.
- **Actual:** live has drifted ahead of the file.
- **Severity:** minor for this run — **no drafted issue uses an undocumented label**, deliberately.
- **Action:** record and **escalate**, do not fix. Editing `.github/labels.yml` is a repo-surface
  change outside a planning-only run's mutation boundary, and `netscript-pr` warns that deleting an
  existing label strips it from live issues. Worth its own parity PR.
- **Also recorded:** `netscript-pr`'s milestone guidance (`0.0.2`…`0.0.9`) is **stale** — the live
  board runs `0.0.6`…`0.0.15`. The drafts use live milestones and say so.

## 2026-08-11 — D-13: one sender per worktree — cycle-2 eval refused reuse, correctly

- **What:** PLAN-EVAL cycle 2 was launched against the **same** evaluator worktree used for cycle 1,
  after checking it out to the new commit. The launch **failed**.
- **Source:** `run-codex-slice.ts:124` →
  `launch failed: … already has a sender; resume session 019ff05b-cf8b-7051-b66a-fdc52683b2f0`.
- **Expected:** a fresh evaluator thread at the same worktree.
- **Actual:** the durable sender registry refused. The guard exists because **two concurrent sends
  at one worktree fork rival agents that fight over the git index** — a documented landmine in
  `.llm/tools/agentic/README.md`.
- **Severity:** minor — a **correct refusal**, caught at launch rather than producing a corrupted
  run. Recording it because the failure mode it prevents is expensive and invisible.
- **Action:** fix — cycle 2 runs in its **own** worktree, `/home/codex/repos/ns-devtools-planeval-c2`,
  at commit `143c315741fc4bc9d0c5069d6cb3c69321c7762b`. The harness rule is now concretely evidenced,
  not just quoted: *an evaluator cycle gets its own worktree*, and reusing one is refused by design.
- **Note for the run record:** cycle 1's worktree is left intact at its own commit so its verdict and
  transcript remain independently inspectable.

## 2026-08-11 — D-14: PLAN-EVAL cycle 2 exhausted its budget reading, producing no verdict

- **What:** Cycle 2 launched cleanly in its own worktree (thread `019ff075-d2e0-7823-9572-0648e158cc16`,
  route **matched**), ran the full **26** turns, and wrote **nothing**. Worktree clean afterwards; the
  `plan-eval.md` present is cycle 1's, restored by checkout.
- **Source:** runner result `{"turns":26,"lastState":"budget_exhausted","reason":"max turns reached"}`;
  `git status --porcelain` in the cycle-2 worktree → empty.
- **Expected:** a cycle-2 verdict file.
- **Actual:** the evaluator consumed its entire budget on **reading**. The artifact set has grown to
  a ~3,600-line RFC plus 14 corpus files, 8 design packs, 25 filing drafts, and a 14-entry drift log —
  and the cycle-2 brief asked it to verify *nine* separate change areas. It is a plausible
  budget-planning failure by the **supervisor**, not evaluator misbehavior: I raised `--max-turns`
  from 12 to 26 to fix cycle 1's cut-off, but did not shrink the reading surface at the same time.
- **Severity:** significant — a required gate produced no verdict.
- **Action:** fix by **steering the same thread**, not by relaunching. The registry allows one sender
  per worktree, and the thread already holds the analysis; a fresh launch would repeat the reading
  and fail identically. The steer instructs it to stop reading, write from what it has, and mark any
  unexamined checklist box **`NOT_ASSESSED`** rather than guessing — with an explicit statement that
  `NOT_ASSESSED` will **not** be treated as a pass.
- **Lesson for the next cycle:** an evaluator brief must bound its own reading. Re-evaluation should
  point at a **diff** plus the specific claims to re-verify, not re-present the whole corpus. Recorded
  because this run is now the second data point (cycle 1 also hit its cap).

## 2026-08-11 — D-15: OWNER ROUTE OVERRIDE — Qwen 3.8 Max replaces GLM 5.2 for Stage D2

- **What:** The owner reviewed the D-10 escalation and **declined to waive** the adversarial design
  pass. Instead they authorized a **route override**: run Stage D2 on
  **`qwen/qwen3.8-max` at `max` reasoning**, launched through the repository agentic toolchain on a
  **fresh read-only evaluator surface**, natively via **OpenCode/OpenRouter**.
- **Source:** owner instruction in-turn, 2026-08-11. This is the explicit authorization
  `lane-policy.md` § Selection and handoff rules requires for a lane override, and the
  owner-authorized fallback that `netscript-harness` § Blocked-lane handling requires before a
  blocked lane may be substituted.
- **Expected (lane-policy default):** `major_ui_ux_design` / `major_ui_ux_adversarial_review` bind to
  GLM 5.2 via the `claude-design-glm-5-2` preset, with **no declared fallback**.
- **Actual:** that lane is unlaunchable (D-10) — `agentic:claude-openrouter` applies an
  open-**evaluator** guard that correctly refuses GLM, and it equally would not admit Qwen. The owner
  therefore routed the pass to the **OpenCode** transport, which is the repo's native
  WSL/OpenRouter surface and is not behind the evaluator guard.
- **Severity:** significant — a lane binding changed by owner decision, which is exactly the class of
  thing that must be recorded rather than absorbed.
- **Scope, stated narrowly on purpose:**
  - **Stage D2 only.** The override does **not** touch the formal evaluator lane. The **Codex
    GPT-5.6 Sol PLAN-EVAL remains separate and remains the verdict of record**; nothing Qwen returns
    is a Plan-Gate verdict, and a Qwen `PASS`-shaped statement would carry no gate authority.
  - **Findings-only.** The evaluator makes **no edits** to any artifact. The supervisor adjudicates
    each finding and applies amendments.
  - **Read-only surface**, its own worktree, separate from every authoring lane.
- **Action:** accept and execute. `supervisor.md` § Routes in force and § Recorded lane/eval
  overrides updated. Prompt, raw output, and a launch receipt (requested vs observed identity) are
  persisted under `design/ux-evidence/`.
- **Requested identity:** provider `openrouter` · model `qwen/qwen3.8-max` · variant `max`.
  **Observed identity:** recorded in `design/ux-evidence/qwen-receipt.md` at launch.
- **Consequence for the gate:** D-10 moves from *"mandated deliverable missing"* to *"mandated
  deliverable obtained on an owner-approved substitute route"*. Risk **R12** is updated accordingly —
  it is **not** silently closed, because the substitution is a recorded deviation from
  `lane-policy` invariant 5, not a satisfaction of it.

## 2026-08-11 — D-16: owner-directed lane split — Kimi K3 takes the pure UI/UX review

- **What:** The owner refined the D-15 override: *"if it pure UX UI use Kimi K3"*. Stage D2 is
  therefore split by **subject**, not merged into one pass.
- **Source:** owner instruction in-turn, 2026-08-11, immediately following the D-15 override.
- **The split:**
  | Lane | Model | Owns |
  | --- | --- | --- |
  | Architecture / contracts | `openrouter/qwen/qwen3.8-max`, variant `max` | Contribution model, identity/ordering, cross-RFC coherence (#890 / RFC-0001 / RFC-A), the declines, worked-example non-duplication |
  | **Pure UI/UX** | `openrouter/moonshotai/kimi-k3`, variant `high` | Information architecture, the state matrix, the `DevToolsUiNode` closed vocabulary, contributor DX, hierarchy and density |
  Each prompt tells its reviewer to **stay in its lane** and skip findings belonging to the other, so
  the two passes complement rather than duplicate.
- **Why this is a better shape than one pass:** `lane-policy.md` already defines
  `adversarial_design_eval` (Kimi) as *complementing* the design lane rather than replacing it. The
  owner's split uses each model where it is strongest instead of asking one reviewer to be both an
  architecture critic and a UX critic — the failure mode that produces broad, soft findings.
- **Honest limitation, recorded rather than glossed:** Kimi K3 is the **vision-capable** lane, but
  this run is planning-only — **no screenshots, mockups, or rendered artifacts exist**, because
  nothing is implemented. Kimi therefore reviews the information architecture **as text** and its
  vision capability is **unused**. Its prompt says so explicitly, so no downstream artifact can imply
  a visual review happened. If the IA is ever prototyped, a follow-up Kimi pass *with* images would
  be materially different evidence.
- **Severity:** minor — a lane refinement within an already-authorized override.
- **Action:** accept and execute. Both passes run on **separate** fresh read-only worktrees
  (`ns-devtools-d2-qwen`, `ns-devtools-d2-kimi`), both findings-only with no edit rights, both
  advisory. The **Codex PLAN-EVAL remains the sole verdict of record** — unchanged by either.
- **Evidence:** `design/ux-evidence/{qwen,kimi}-prompt.md`; model ids resolved from
  `.llm/tools/agentic/config/models.ts:52,81`, not hardcoded.
