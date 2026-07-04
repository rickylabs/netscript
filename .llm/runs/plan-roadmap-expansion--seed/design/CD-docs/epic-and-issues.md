# Opus-CD — Docs-cut decomposition (epic + issues, draft text only)

Draft issue text only — **no gh/git mutations this run.** Labels follow the netscript-pr taxonomy
(`.github/labels.yml`). Milestone = **`0.0.1-beta.7`** everywhere (owner must create it first).
Closing-keyword rule: sub-issues carry `Part of #<epic>` (no closing keyword on the epic); the PRs
that land each sub-issue carry `Closes #<sub-issue>` in their body.

---

## 0. Dependency DAG

```
                    ┌─────────────────────────────────────────────┐
   [OWNER] create   │  EPIC (fork): E-Opt2 new docs-cut epic       │
   0.0.1-beta.7 ───►│         (recommended) or E-Opt1 rescope #232 │
   milestone        └───────────────────┬─────────────────────────┘
                                         │  organizational parent — not a code blocker
                                         ▼
                        ┌────────────────────────────────┐
                        │  S0  IA-RECONCILIATION (Codex)  │  ◄── HARD PRECURSOR
                        │  capabilities/ → 9 pillars +    │      blocks ALL authoring
                        │  redirects + xref + _data.ts    │
                        └───────┬───────────────┬─────────┘
                                │               │
              ┌─────────────────┘               └───────────────────┐
              ▼ (C authoring, Opus workflows)                        ▼ (D authoring, Opus workflows)
   C1 storefront   C2 workspace   C3 erp-sync                D1 services-sdk   D2 durable-workflows
   C4 live-dash    C5 chat*       C6 minimal-eis-chat        D3 background     D4 data-persistence
        │  *C5 gated on @netscript/ai publish state          D5 identity-access D6 observability
        │                                                    D7 orchestration-runtime (+cli/scaffold)
        │                                                    D8 web-layer        D9 ai (+mcp)*
        └──────────────┬──────────────────────────┬─────────┘  *D9 gated on @netscript/ai
                       ▼                           ▼
              V-C OpenHands per-track      V-D OpenHands per-pillar
              validation verdict          validation verdict
                       └──────────┬────────────────┘
                                  ▼
                       Docs-only PR wave merged by beta.7 cut
```

Edges: **everything authoring depends on S0.** C5 and D9 additionally depend on the `@netscript/ai`
publish-state pre-flight (§3.5 of proposal). V-C/V-D depend on their authoring slice. The epic-fork
choice is organizational and does not block S0 from starting once beta.7 exists.

---

## 1. EPIC — the #232 fork (both options drafted; owner picks ONE)

### Option 2 (RECOMMENDED) — NEW docs-cut child epic

> **Title:** `epic: beta.7 docs release cut — tutorial rewrites + per-feature positioning`
> **Labels:** `type:umbrella`, `epic:docs-cut`, `area:docs`, `status:plan`, `wave:v1-min`
> **Milestone:** `0.0.1-beta.7`
> **Body:**
> Ground-up documentation release cut for beta.7 (owner decision D3). Two workstreams:
> **(C)** complete exercise-first rewrites of the 5 live tutorial tracks + a new minimal-eis-chat
> on-ramp; **(D)** per-feature storytelling/positioning across the 9 pillars. Both are gated on the
> IA-reconciliation precursor (#S0).
> Part of #301 (Road to 0.0.1-stable). Related: #232 (docs accuracy/coverage debt — disjoint scope;
> its storefront-Run-2 item is partly superseded by the storefront rewrite here).
> **Precursor:** #S0 IA-reconciliation (hard blocker).
> **Children:** C1–C6 (tutorials), D1–D9 (positioning), V-C/V-D (validation).
> **Positioning law (binds every child):** build-efficiency for AI agents, not throughput; no
> honesty/candor framing; one factual competitor comparison per major feature; no unshipped-capability
> claims. *(No closing keyword — closes by hand when all children land.)*

### Option 1 (ALTERNATIVE) — Rescope #232 + re-file its accuracy checklist

> **Edit #232** → title `epic: beta.7 docs release cut …` (same body as Option 2), and **open a new
> issue** to hold #232's displaced content:
> **Title:** `docs: accuracy & coverage debt (Run-2 storefront grounding, reference depth, telemetry docs)`
> **Labels:** `type:docs`, `area:docs`, `status:triage`, `wave:defer`
> **Milestone:** `Backlog / Triage`
> **Body:** verbatim migration of #232's current accuracy/coverage checklist; note the storefront
> Run-2 item is partly superseded by the storefront rewrite in the rescoped epic.

**Recommendation:** Option 2 (proposal §1). Owner decides.

---

## 2. S0 — IA-reconciliation (HARD PRECURSOR, WSL Codex)

> **Title:** `docs(ia): reconcile capabilities/ into the 9 pillar folders (one IA, redirected)`
> **Labels:** `type:refactor`, `area:docs`, `status:plan`, `wave:v1-min`, `priority:p1`
> **Milestone:** `0.0.1-beta.7` · **Lane:** WSL Codex daemon-attached (structural, not prose)
> **Part of #<epic>.**
>
> **Scope:** promote every `docs/site/capabilities/*.md` page into its target pillar folder per the
> mapping in proposal §2.2; add a URL redirect for each old `/capabilities/<x>/` path; retarget every
> `comp.xref({ key: "cap:<x>" })` to the new pillar path; update `_data.ts` "Overview & Concepts"
> cards on the 3 pillars that route into `capabilities/`; add the two net-new pillar leaf stubs
> (`orchestration-runtime/cli-scaffold.md`, `ai/mcp.md`) as empty-but-navigable placeholders for D to
> fill; delete `capabilities/index.md` after redirects land.
>
> **Explicit non-goals:** do NOT touch tutorial-chapter nav anchors (Topic-C's surface); do NOT
> rewrite page prose (that is D's job — move content as-is); no framework source.
>
> **Acceptance criteria:**
> - [ ] `deno task verify` green in `docs/site` (build → `check:links` → `check:caveats`) — zero
>       broken internal links.
> - [ ] Every old `/capabilities/<x>/` URL 301/redirects to its new pillar path (manual curl/nav
>       check of all 15 moved pages).
> - [ ] `capabilities/` no longer referenced by any `comp.xref` key or `_data.ts` entry (grep clean).
> - [ ] `_data.ts` nav renders the 9 pillars unchanged in count/order; the 3 rerouted "Overview &
>       Concepts" cards point at in-pillar leaves.
> - [ ] Two new leaf stubs exist and are reachable from nav.
> - [ ] No `packages/`/`plugins/` file touched; no `deno.lock` churn.

---

## 3. C — tutorial-rewrite sub-issues (Opus authoring workflows)

Common to all C issues: **Labels** `type:docs`, `area:docs`, `status:plan`, `wave:v1-min`;
**Milestone** `0.0.1-beta.7`; **Part of #<epic>**; **Depends on #S0**; lane = Opus-medium workflow
(agents RETURN prose; Fable commits). Common acceptance criteria (the "C-common bar"):
- [ ] Exercise-first: every step closes on a literal observable checkpoint (URL/JSON/log/file diff/
      screenshot), never a comprehension checkpoint (style contract:
      `research/C-tutorials/medusa-inspired-writing-style-contract.md`).
- [ ] Premise carries real stakes grounded in the track's real domain (proposal §3.2); no
      stakes-free toy premise.
- [ ] Chapter **slugs preserved** (or any rename paired with the matching `_data.ts` hub-anchor edit
      — proposal §3.4).
- [ ] `deno task verify` green; no Lume/Vento landmine (no `function`-keyword in comp args; no
      repo-wide `deno task fmt`); every API/symbol traces to `deno doc`.
- [ ] Positioning law honored (build-efficiency, no honesty framing).

| ID | Title | Track-specific acceptance additions |
|----|-------|--------------------------------------|
| **C1** | `docs(tutorial): rewrite storefront track (playground-dogfood premise)` | Anchor chapter = `04-checkout-saga` money-loss narrative kept; resolves storefront Run-2 grounding by rebuilding against a verified live scaffold; 6 slugs `01-scaffold…06-deploy` preserved. |
| **C2** | `docs(tutorial): rewrite workspace track (team workspace + auth)` | Auth chapters (`02-auth`, `05-route-authz`) backed by framework `builder-auth_test` 401/403/200 pattern + package docs — **not** eis-chat (zero-auth); keep the `arch-debt:seamless-auth-roadmap` factual callout. |
| **C3** | `docs(tutorial): rewrite erp-sync track (VIF→CSB import pipeline)` | **Make `03-polyglot-transform` runnable** via the sandboxed `deno` task runtime; Python step = caveated forward capability; note (not fix) `WORKER_CONCURRENCY` footgun for a separate Codex side-fix. |
| **C4** | `docs(tutorial): rewrite live-dashboard track (live orders)` | Ground in eis-chat `notifications-stream` + channel live-query; `05-live-stream` still delivers a no-polling self-updating table. |
| **C5** | `docs(tutorial): rewrite chat track (durable AI chat)` — **GATED** | Author against **shipped `@netscript/fresh/ai`** only; `@netscript/ai` engine = caveated forward-ref, never a runnable import; pre-flight the publish state (proposal §3.5). If engine still `publish:false` at authoring window, ship the light-touch form; owner-lever = defer full rewrite. |
| **C6** | `docs(tutorial): NEW minimal-eis-chat on-ramp` | New `tutorials/eis-chat/` folder; single-sitting scaffold→contract→worker→stream→done; **post-scaffold story only** (never lift `PHASE-*.md` pre-NetScript build order); closes with a map into the 5 deep tracks; add lane to `tutorials/index.md` featureGrid. |

---

## 4. D — per-feature positioning sub-issues (Opus authoring workflows, per pillar)

Realization of the owner's "one supervisor per feature" as **per-pillar authoring slices** (proposal
§5). Common to all D issues: **Labels** `type:docs`, `area:docs`, `status:plan`, `wave:v1-min`;
**Milestone** `0.0.1-beta.7`; **Part of #<epic>**; **Depends on #S0**; lane = Opus-medium workflow
(Tier-1/2 pages) / Opus-low (Tier-3 thin pages). Common acceptance criteria (the "D-common bar"):
- [ ] Each feature page follows the story template (proposal §4.2): elevator pitch (eis-chat-led) →
      story spine (concrete failure/workflow) → mechanism (cross-linked, not duplicated) → **one
      factual competitor comparison for Tier-1/2** → cross-links.
- [ ] Positioning law: no throughput/benchmark, no superlatives/absolutes, no unshipped-capability
      claims (traceable to `deno doc`), no honesty/candor framing, no fabricated %/social proof
      (constraints: `context/D-positioning/authoring-constraints.md`;
      `research/D-positioning/competitor-teardown.md` §3).
- [ ] **Do NOT lift `_plan/*` prose verbatim** (it carries honesty framing + a throughput phrase).
- [ ] Diátaxis respected — link `reference/`/`how-to/`/`tutorials/`, never duplicate.
- [ ] `deno task verify` green; no orphan page outside `_data.ts` nav.

| ID | Title | Pages / features | Competitor angle (Tier) |
|----|-------|------------------|--------------------------|
| **D1** | `docs(positioning): services & SDK stories` | `services-sdk/{index,services,sdk}.md` | Encore nestjs-alt (T1); tRPC declare-once (T1) |
| **D2** | `docs(positioning): durable-workflows stories` | `durable-workflows/{index,sagas,triggers,streams}.md` | Inngest-vs-Temporal determinism (T1); Convex sync (T2) |
| **D3** | `docs(positioning): background-processing stories` | `background-processing/{index,workers,polyglot-tasks}.md` | Trigger.dev-vs-Temporal table (T2); polyglot light (T3) |
| **D4** | `docs(positioning): data-persistence stories` | `data-persistence/{index,database,kv-queues-cron}.md` | Convex/Supabase Yes-No matrix (T2); BullMQ/Celery light (T3) |
| **D5** | `docs(positioning): identity-access story + plugin-system fix` | `identity-access/{index,auth}.md` + fix `explanation/plugin-system.md` auth-telemetry contradiction | Supabase agent-skills failure-modes, no invented % (T2) |
| **D6** | `docs(positioning): observability story` | `observability/{index,telemetry}.md` | Encore MCP + traces self-verify (T1) |
| **D7** | `docs(positioning): orchestration-runtime + CLI/scaffold + plugin-system` | `orchestration-runtime/{index,runtime-config,cli-scaffold}.md` | Encore file-count + AdonisJS (T1 cli); Medusa Agent-Skills plugin=capability (T1); Encore dashboard (T3 aspire) |
| **D8** | `docs(positioning): web-layer stories` | `web-layer/{index,fresh-ui}.md` (fold `fresh-framework`) | Astro tone + live sandbox (T3) |
| **D9** | `docs(positioning): AI-stack + MCP stories` — **GATED** | `ai/{index,mcp}.md` | Medusa Build/Optimize/Operate + Convex "LLMs love"; Encore MCP blog. Author against shipped surface only (proposal §3.5). |

**Front-door side-fix (Sonnet-trivial):** `docs(fix): concepts.vto alpha→beta drift` — one-line fix,
folds into whichever D slice touches `concepts.vto` or a standalone Sonnet-5 slice.

---

## 5. Validation slices (OpenHands, per-domain, separate session)

> **V-C** `docs(validate): tutorial-rewrite per-track verdict` and **V-D** `docs(validate):
> positioning per-pillar verdict`
> **Labels:** `type:docs`, `area:docs`, `status:impl-eval`; **Milestone** `0.0.1-beta.7`.
> **Lane:** OpenHands, qwen 3.7 max, separate session (doc-authoring exception: workflow is
> generator-only, does not self-certify).
>
> **Per-slice verdict checks:**
> - [ ] `deno task verify` green (build + `check:links` + `check:caveats`).
> - [ ] Every present-tense API/capability claim traces to `deno doc` (accuracy worklog line each).
> - [ ] Positioning-law grep: no `honest/honestly/candor`, no `throughput`/`X% faster`, no
>       superlatives, no `_plan`-lifted phrasing.
> - [ ] (C) no `_data.ts` hub anchor broken by a slug change; (D) no page orphaned from nav.
> - [ ] Verdict `PASS` / `CHANGES_REQUESTED` per track/pillar; two fail-cycles → escalate.

---

## 6. Milestone note

`0.0.1-beta.7` (and `0.0.1-beta.6` for spine-1) do not exist yet. **Owner creates
`0.0.1-beta.7`** before any issue above can be filed (AGENTS.md milestone obligation). No mutation
this run.
