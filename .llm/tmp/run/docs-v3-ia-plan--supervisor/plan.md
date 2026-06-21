# Docs v3 IA Overhaul — Plan

**Run id:** `docs-v3-ia-plan--supervisor` · **Branch:** `docs/v3-ia-plan` (off `origin/main` @ `5f273355`)
**Archetype:** n/a (docs run) · **Scope overlay:** `SCOPE-docs`
**Deliverable of THIS run:** a locked, PLAN-EVAL'd IA + workstream plan (no prose authoring). Authoring
is a later, separately-gated build run.
**Companion docs:** `research.md`, `doc-architecture-v3.md`, `ground/leakage-diagram-barraising.md`,
`ground/playground-showcase-map.md`.

---

## 1. Objective

Close the structural docs backlog (tasks #26/#27/#28) plus newly-verified feature gaps and a public-voice
cleanup, taking the site from "accurate v3" to **production-grade public docs matching Medusa / Astro /
Laravel / TanStack.** Concretely: give every shipped public surface a discoverable home, replace the
single linear tutorial with multiple project tracks, add a full component + rendered-diagram design
system, an auto-resolving xref system, and scrub all internal-speech leakage.

## 2. Locked decisions (do not relitigate)

- **D1** Tutorials = **multiple independent tracks** (not one ladder, not one mega-project).
- **D2** Each track builds a **different real app**: Storefront (sagas) · Workspace (auth) · ERP-sync
  (jobs+polyglot) · Live-dashboard (Fresh+SDK+streams). Rosters validated vs the `netscript-start`
  playground showcase.
- **D3** Design-system scope = **full**: new shared components + rendered diagrams touching central
  `base.vto`/`styles/`/`_components/`/`_data.ts`; additive + backward-compatible.
- **D4** Eval = **layered**: WSL Codex unconstrained adversarial panel (harden) → OpenHands minimax-M3
  PLAN-EVAL (hard gate). Separate sessions; evaluators not oriented; supervisor does not self-certify.

## 3. Workstreams

Each workstream is independently authorable in the later build run; this plan defines scope + acceptance.

### WS1 — Capability IA restructure
- Rebuild `capabilities/index` as a card grid (Learn/Do/Reference triplet per card).
- Apply the §2 hub template (doc-architecture-v3) to all capability pages.
- **Split** `fresh-ui` → add `capabilities/fresh-framework` (the 12-subpath meta-framework); keep
  `fresh-ui` as design-system / copy-source.
- **Extract** polyglot from `background-jobs` → `capabilities/polyglot-tasks`.
- **Add** `capabilities/sdk` and `capabilities/runtime-config` hubs.
- *Accept:* every `★NEW` hub in doc-architecture-v3 §1 exists; every capability page conforms to §2.

### WS2 — Tutorial tracks (D1/D2)
- Retire the single 5-rung ladder; build 4 independent tracks per doc-architecture-v3 §3, each with a
  `deploy` chapter, prev/next continuity, and result checkpoints.
- Ground each track's integration patterns in `ground/playground-showcase-map.md`.
- *Accept:* `/tutorials/index` chooser + 4 tracks; no track depends on another; each starts from
  `netscript create`.

### WS3 — Feature-gap homes
- Author/enrich the homes in doc-architecture-v3 §4 (polyglot runtime matrix + permissions; worker
  runtime modes; mssql/mysql + db tracing; saga presets/middleware/transports/agent; service shutdown
  hooks + OpenAPI/Scalar + health; sdk discovery/cache/collections; queue providers; runtime-config;
  CLI `db add` + `marketplace`).
- *Accept:* every verified gap in research §4 maps to a published page section; no shipped public
  subpath remains undiscoverable.

### WS4 — Design system & components (D3)
- Add components from doc-architecture-v3 §5.1: in-site search (Pagefind), on-page TOC (scroll-spy),
  code-copy buttons, `comp.diagram`, `comp.fileTree`, `comp.badge`, `comp.cardsGrid`, prev/next nav,
  (P2) feedback widget.
- *Accept:* components render on representative pages; existing pages unbroken; build green.

### WS5 — Rendered-diagram system (D3)
- Implement `comp.diagram` (Mermaid + accessible static fallback) and produce the 11 diagrams in
  doc-architecture-v3 §5.3 / leakage-report Section B. Convert existing ASCII diagrams (architecture,
  request-lifecycle, db aggregation, file-trees) to rendered figures / `comp.fileTree`.
- Respect the Vento `function`-keyword landmine in comp-tag args.
- *Accept:* ≥11 diagrams live; no ASCII architecture/lifecycle/ERD remains where a rendered diagram is specified.

### WS6 — Auto-resolving xref system (W6)
- Implement the keyed xref source + `comp.xref`/filter from doc-architecture-v3 §6; build fails on
  unknown key (build = link checker).
- Migrate internal links to keys.
- *Accept:* zero hardcoded internal hrefs in migrated pages; build fails on a deliberately broken key.

### WS7 — Public-voice cleanup (remove internal speech)
Drive the leakage count to **zero** (currently 19, per `ground/leakage-diagram-barraising.md`):
- **Register rewrite of the Explanation zone** (11 instances): `architecture.md`, `plugin-model.md`,
  `durable-workflows.md`, and the `auth-model.md`/`capabilities/auth.md` doctrine sentences — convert
  contributor-doctrine voice ("the doctrine recognizes six archetypes," "axiom A12," "publish gate is
  the doctrine gate," "fitness function," surfacing `archetype` as user vocabulary) to app-author
  explanation voice. Keep kernel/port/adapter/composition as ordinary nouns.
- **Remove 2 leaked debt IDs** (`workers-scaffold-job-tools-noop`); keep the honest caveat.
- **De-hedge** (6 instances): consolidate the ~7 restatements of the job-tools caveat into ONE canonical
  Observability callout + per-capability **status badge**; drop "Honest reality / Do not say…" framing;
  keep exactly one alpha banner pattern across top pages.
- Scrub `_data.ts` comment `US-`/wave IDs and `author-a-plugin.md` "doctrine-true"/`archetype` phrasing.
- *Accept:* automated scan finds zero instances across the §A.4 leak categories; honest user caveats retained in product voice.

### WS8 — Bar-raising affordances
- From leakage-report Section C: per-capability **status badges** (stable/alpha/partial) replacing
  repeated prose caveats; **version pill/switcher**; **troubleshooting** blocks on capability/how-to
  pages; **examples gallery** surfacing the scaffold `/examples/*`; **API option tables** for
  `defineService`/`defineSaga`/`defineWebhook`/`createQueue`; **tabbed** polyglot + queue-provider
  variants; production-deploy **checklist** in `how-to/deploy`.
- *Accept:* each affordance present on its target pages.

## 4. Sequencing (for the later build run; not executed here)
1. WS4 + WS5 + WS6 foundation (components, diagram + xref systems) — they unblock authoring.
2. WS1 capability restructure + WS3 feature homes (depend on hub template + components).
3. WS2 tutorial tracks (depend on components + capability hubs to link into).
4. WS7 voice cleanup + WS8 affordances (cross-cutting; finalize after content settles).
5. Build + cross-ref audit + visual eval (reuse the existing WF-2/visual-eval capstones).

## 5. Gates / acceptance (build-run merge-readiness)
- Lume build green; Pagefind index generated; no broken `comp.xref` keys (build-enforced).
- Leakage scan = 0; accuracy dossiers not regressed (the 3 v3 ground dossiers re-checked).
- `reference/**` untouched (diff shows zero changes there).
- Markdown/prose targeted fmt via the scoped wrappers (`run-deno-fmt.ts --ext md` on docs roots), not
  raw root fmt.
- Visual/structural audit (existing cross-ref + Playwright capstones) green.

## 6. Debt / deferrals
- Version *switcher* (vs a static alpha pill) may defer to beta — record as debt if deferred.
- "Was this helpful" feedback widget is P2 — optional for first build.
- Any capability whose underlying feature is a known stub (streams consumer, job-tools) is documented
  with a status badge + honest caveat, NOT hidden.

## 7. Risks
- **Central component changes (D3)** touch `base.vto`/`styles/` — regression risk to all pages; mitigate
  with additive components + a visual diff pass.
- **Tutorial accuracy** — 4 real apps must actually run on current `origin/main`; ground in the
  playground showcase and verify scaffold output during the build run.
- **Scope size** — this is large; the build run should slice per workstream/track, each independently
  gated, not one monolith.

## 8. Evaluator handoff (D4 — layered)
1. **WSL Codex adversarial panel** (daemon-attached, mobile-visible): given `research.md` +
   `doc-architecture-v3.md` + `plan.md` + the deployed docs, with an UNORIENTED brief ("find every way
   this plan is wrong, incomplete, or below production-grade — do not limit yourself"). Findings folded
   back into the plan. Subject to the codex-generator launch gate.
2. **OpenHands minimax-M3 PLAN-EVAL** (separate session, hard gate): standard `plan-protocol.md` +
   `plan-gate.md`, unoriented. Emits PASS / FAIL_PLAN. No authoring/build before PASS. Two FAIL_PLAN
   cycles → escalate.

## 9. Out of scope
- Prose authoring (later build run). Framework/code changes. `reference/**` edits. Repo-wide fmt / lock
  churn. Re-injecting fixed docs-v2 accuracy caveats.
