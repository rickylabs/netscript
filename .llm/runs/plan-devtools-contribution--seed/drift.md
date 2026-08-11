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
  (`packages/plugin/src/protocol/manifest.ts:282`) and pins `schemaVersion: z.literal(1)` (`:271`).
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
- **Evidence:** `packages/plugin/src/protocol/manifest.ts:271,282`;
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
