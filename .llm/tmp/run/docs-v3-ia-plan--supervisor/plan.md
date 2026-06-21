# Docs v3 IA Overhaul — Plan

**Run id:** `docs-v3-ia-plan--supervisor` · **Branch:** `docs/v3-ia-plan` (off `origin/main` @ `5f273355`)
**Archetype:** n/a (docs run) · **Scope overlay:** `SCOPE-docs`
**Deliverable of THIS run:** a locked, PLAN-EVAL'd IA + workstream plan (no prose authoring). Authoring
is a later, separately-gated build run.
**Companion docs:** `research.md`, `doc-architecture-v3.md`, `surface-inventory.md`,
`hub-content-contracts.md`, `tutorial-proof-plans.md`, `ground/leakage-diagram-barraising.md`,
`ground/playground-showcase-map.md`. **Harness artifacts:** `worklog.md` (incl. `## Design`), `drift.md`,
`commits.md`.

> **Hardening note (2026-06-21):** this plan was hardened against the unoriented WSL Codex adversarial panel
> (`codex-panel-findings.md`: 3 blockers / 6 majors / 1 minor) before re-dispatching
> PLAN-EVAL. The first OpenHands PLAN-EVAL run crashed (workflow failure, not a verdict). All panel
> blockers/majors are resolved here and in the companion artifacts; see `drift.md` for the mapping.

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

## 2a. Open-decision sweep (resolved — locked architecture decisions)

Resolves panel majors #4/#7/#8/#9. These were "open" in the IA; they are now **locked** so the build run
cannot rework file ownership/accessibility after authoring.

| # | Open question | **Locked decision** | Rationale |
|---|---------------|---------------------|-----------|
| OD1 | Mermaid client-side vs build-time | **Build-time render → committed static SVG** wrapped by `comp.diagram` with `<figure>`+`<figcaption>` alt text. No client-side Mermaid JS. | No-JS accessible; deterministic build; diagrams are diffable assets. |
| OD2 | xref storage surface | **Dedicated `_data/xref.ts`** (not `_data.ts`) exposing a keyed map; resolved by a `comp.xref` Vento filter. | Isolates link data; keeps `_data.ts` nav-only; build fails on unknown key. |
| OD3 | xref key namespace | Locked prefixes: `cap:` `howto:` `tut:` `explain:` `concept:` `ref:` `cli:` `glossary:`. Reference units keyed `ref:<unit>/<subpath>` (matches `surface-inventory.md`). | One stable scheme so hubs link reference without hardcoded paths. |
| OD4 | Pagefind index scope | Index the built `docs/site/_site/**` **including `reference/**`** (generated API docs are searchable); exclude nav chrome. | Search must find generated reference, the bulk of the surface. |
| OD5 | Version UI | **Static "alpha" pill** in `base.vto` this release; real JSR-keyed switcher **deferred to beta (debt)**. | Honest now; avoids half-built switcher rework. |
| OD6 | `archetype` as public vocabulary | **Internal contributor doctrine — REMOVED from all public IA/glossary/tutorial vocabulary** (not relabeled). `explanation/plugin-system` explains plugin-package vs core-package in plain terms with **no** archetype taxonomy. | Panel #7: the IA both flagged and preserved the term. Resolve by removing it. |
| OD7 | Marketplace CLI commands | `marketplace publish\|search` are **stubs** ("coming soon"); documented with an **alpha/stub status badge + exact current behavior**, and **excluded from the "full CLI surface" claim**. A CLI smoke check captures actual output. | Panel #8: production reference must not present stubs as working. |
| OD8 | Production deployment scope | This run documents **local + Aspire-orchestrated** deploy with an exact env/secrets/migration/health contract (below). **Cloud-production deployment is deferred (debt).** Tracks end in a local/Aspire deploy chapter, not a cloud-prod claim. | Panel #9: "deployment is named, not designed." Lock a real, achievable target. |

**OD8 deployment contract (local + Aspire, the only deploy the build run documents):** target = the Aspire
AppHost topology already in the scaffold (Postgres + Garnet + Deno services + plugin processors + streams);
required env/secrets enumerated from `appsettings.json` + plugin `secretEnv`; migration step =
`deno task db:migrate` (or scaffold equivalent) before start; health = `createReadinessHandler`/
`createLivenessHandler` endpoints per service; verification command = `deno task e2e:cli run scaffold.runtime`
(already validates the full local topology). Cloud targets (Deno Deploy / container / Windows-Service beyond
the existing `--no-aspire` note) are **out of scope** and recorded in §6 debt.

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
- *Accept:* binds to `surface-inventory.md` — a build-run check enumerates all **242** export subpaths and
  asserts each has its matrix disposition realized (narrative subpath has a hub/explanation section; how-to
  subpath has a recipe/tutorial step; reference-only resolves to a `ref:` xref key; testing-only has a
  reference link; deferred has a status badge + caveat). Any unclassified/undiscoverable subpath fails.
  The 8 complex hubs additionally satisfy their `hub-content-contracts.md` content contract.

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
- **Archetype removal (OD6):** `archetype` is internal contributor doctrine — remove it from ALL public
  vocabulary: delete the "six archetypes" section + table in `architecture.md`, remove `archetype` from the
  `explanation/plugin-system` framing (explain plugin-package vs core-package in plain terms, no taxonomy),
  drop it from the glossary "every term…" list, and scrub `author-a-plugin.md` "doctrine-true"/"decide which
  archetype" phrasing. Also scrub `_data.ts` comment `US-`/wave IDs. (This is a decision, not just a scrub:
  the IA must not reintroduce `archetype` as a user-facing concept anywhere.)
- *Accept:* the leakage scanner (§5) finds **zero** instances across the §A.4 leak categories AND zero
  public occurrences of `archetype`/`axiom A\d+`/`fitness function`/`the doctrine`; honest user caveats
  retained in product voice.

### WS8 — Bar-raising affordances
- From leakage-report Section C: per-capability **status badges** (stable/alpha/partial) replacing
  repeated prose caveats; **version pill/switcher**; **troubleshooting** blocks on capability/how-to
  pages; **examples gallery** surfacing the scaffold `/examples/*`; **API option tables** for
  `defineService`/`defineSaga`/`defineWebhook`/`createQueue`; **tabbed** polyglot + queue-provider
  variants; production-deploy **checklist** in `how-to/deploy`.
- *Accept:* each affordance present on its target pages.

## 4. Ordered commit slices (for the later build run; not executed here)

Each slice is independently committable, names the files it touches, the output it introduces, and the
**proving gate** that must pass before the next slice. 20 slices (≤30 per Plan-Gate). Slices are grouped
foundation → content → tutorials → finalize; within a group, later slices may proceed in parallel once the
foundation group (S01–S05) lands.

| Slice | Scope | Files touched (build run) | Output introduced | Proving gate |
|-------|-------|---------------------------|-------------------|--------------|
| **S01** | `comp.diagram` + build-time Mermaid→static-SVG (OD1) | `_components/diagram.vto`, Lume build config, `styles/` | accessible diagram component | sample diagram renders to committed SVG with `<figcaption>`; build green; visible with JS off |
| **S02** | xref system (OD2/OD3) | `_data/xref.ts`, `comp.xref` filter, build config | keyed link resolver; build = link checker | deliberate bad key **fails build**; valid `cap:`/`ref:` key resolves |
| **S03** | design-system components | `_components/{cardsGrid,badge,fileTree}.vto`, `base.vto` (TOC, code-copy), `styles/` | shared components | render on a representative page; existing pages unbroken (visual diff); build green |
| **S04** | Pagefind search (OD4) | build config, `base.vto` header | in-site search over `_site/**` incl. `reference/**` | search returns a `reference/` hit; build green |
| **S05** | alpha version pill (OD5) | `base.vto` | static alpha pill | renders on top pages |
| **S06** | `fresh-framework` hub split from `fresh-ui` + nav | `capabilities/fresh-framework/*`, `capabilities/fresh-ui.md`, `_data.ts` | ★NEW hub | `hub-content-contracts.md` §1 satisfied; nav entry; fresh-ui retained as design-system |
| **S07** | `sdk` hub | `capabilities/sdk/*`, `_data.ts` | ★NEW hub | contracts §2 satisfied |
| **S08** | `polyglot-tasks` + `runtime-config` hubs | `capabilities/{polyglot-tasks,runtime-config}/*`, `_data.ts` | ★NEW hubs | contracts §4 satisfied; runtime-config narrative home exists |
| **S09** | enrich `services` + `database` | `capabilities/{services,database}.md` | shutdown/OpenAPI/health; mssql/mysql/tracing sections | contracts §7/§8 satisfied |
| **S10** | enrich `durable-sagas` + `triggers` + `background-jobs` + `kv-queues-cron` | those 4 capability pages | extension points + runtime modes + 4 queue providers | contracts §3/§5/§6 satisfied; `createParallelQueue` shown |
| **S11** | enrich `telemetry` + `auth`; rebuild `capabilities/index` | `capabilities/{telemetry,auth,index}.md` | card grid; auth diagram | index = Learn/Do/Reference card grid; auth flow diagram present |
| **S12** | surface-completeness check | (check script + xref keys) | 242-subpath realization assertion | every `surface-inventory.md` subpath realized per its disposition; unclassified → fail |
| **S13** | how-to recipes (8 ★NEW incl. deploy local+Aspire per OD8) | `how-to/*` | Type-R recipes | each recipe present; `marketplace` badged stub (OD7); CLI smoke captures output |
| **S14** | explanation essays | `explanation/{architecture,plugin-system,durability-model,observability,aspire}.md` | Type-E essays + diagrams | leakage scanner = 0 on explanation zone; **no `archetype` taxonomy** (OD6); diagrams present |
| **S15** | Track A (storefront) + Track D (live-dashboard) — playground-direct | `tutorials/{storefront,live-dashboard}/*`, `tutorials/index`, xref | 2 tracks + chooser | scaffold output type-checks; prev/next continuity; chooser links |
| **S16** | Track B (workspace/auth) | `tutorials/workspace/*` | track | **`tutorial-proof-plans.md` Track B proof gate passed first**; else rescope per that doc |
| **S17** | Track C (erp-sync/polyglot) | `tutorials/erp-sync/*` | track | **Track C proof gate passed first**; polyglot chapter gated or rescoped |
| **S18** | WS7 voice cleanup + WS8 affordances | explanation zone, capability pages, `glossary.md`, `_data.ts` | status badges, troubleshooting blocks, examples gallery, option/tabbed tables | leakage scanner = 0 site-wide; affordances on target pages |
| **S19** | xref migration | all migrated pages | internal links → keys | zero hardcoded internal hrefs in migrated pages; build link-check green |
| **S20** | final build + audits | (no content) | merge-readiness verdict | gate table §5 all green (build, leakage, xref, accuracy, visual) |

## 5. Gates / acceptance (build-run merge-readiness) — executable

Every gate names an exact command, the root it runs over, the expected result, and an owner. Replaces the
prior slogan list (panel #5).

| Gate | Command (build run) | Input root | Expected | Owner |
|------|---------------------|-----------|----------|-------|
| Lume build | the docs site build task (e.g. `deno task build` in `docs/`) | `docs/site/**` | exit 0; `_site/` produced | build |
| xref integrity | the build itself (S02 fails on unknown key) + a post-build href check over the generated xref map | `_site/**` | 0 unknown keys; 0 dead internal hrefs | build |
| Pagefind index | Pagefind build step | `_site/**` incl. `reference/**` | index generated; a reference term is findable | build |
| **Leakage scan** | the deterministic scanner spec below | `docs/site/**` minus `_site/`, `reference/` | **0 hits** | docs |
| Accuracy non-regression | re-check the 3 v3 dossiers under `…/docs-overhaul-v3/ground/` against the rewritten pages | capability/explanation pages | no reintroduced inaccuracy; fixed caveats not re-injected | docs |
| Surface completeness | S12 enumeration check vs `surface-inventory.md` | export maps + pages/xref | all 242 subpaths realized | docs |
| `reference/**` untouched | `git diff --stat origin/docs/user-site -- docs/site/reference` | `docs/site/reference/**` | zero changes | docs |
| Targeted fmt | `run-deno-fmt.ts --ext md` (scoped wrapper) | docs content roots only | clean; **not** raw root fmt over generated/legacy | docs |
| Visual/structural | existing cross-ref (WF-2) + Playwright capstone, **desktop + mobile** | served `_site/` | screenshot matrix green; no layout breaks | docs |
| SCOPE-docs overlay | source-alignment, scope-separation, link-integrity, terminology, drift-logging checks | `docs/site/**` + run artifacts | each overlay check green; drift logged | docs |

### Leakage-scanner spec (deterministic — so any evaluator counts the same)
- **Roots:** all authored files under `docs/site/**` (`capabilities/`, `tutorials/`, `how-to/`, `explanation/`,
  `*.vto`, `glossary.md`, `cli-reference.md`, `_data*.ts`); **exclude** `_site/` (build output) and
  `reference/` (generated).
- **Deny patterns (case-insensitive, word-boundary):** `harness`, `use harness`, `openhands`, `codex`,
  `claude`, `\bwsl\b`, `supervisor`*, `evaluator`*, `run[- ]?id`, `wf_[a-z0-9]+`, `jobs/[0-9a-f]{6,}`,
  `\.llm/`, `\.agents/`, `\bPR ?#\d+`, `issue ?#\d+`, `TODO|FIXME|XXX` (as leaks), `\barchetype\b`,
  `axiom A\d+`, `fitness function`, `the doctrine`, `doctrine[- ]gate`, `workers-scaffold-job-tools-noop`,
  raw un-rendered `{{ comp` in a content body.
- **Allowlist (NOT leaks):** `saga supervisor`, `process supervisor`, `bring-your-own-supervisor` (runtime
  terms); editorial "we" on `why.vto`/`index.vto` marketing pages; "not a placeholder" reassurance prose.
  (*`supervisor`/`evaluator` are denied only when referring to authoring machinery; the allowlisted runtime
  phrases are explicit exceptions.)
- **Expected:** 0 hits after the overhaul. The spec + allowlist are committed so the count is reproducible.

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
