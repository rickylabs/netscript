# NetScript long-range remediation — MASTER PLAN — DRAFT (no GitHub mutation; owner ratification pending)

Seed run `plan-fable5-remediation-roadmap--seed` · PR #1347 · baseline `origin/main` @
`fac9e339042c` (re-verified unchanged at plan lock, 2026-08-08). Supervisor: Claude Fable 5 ·
high. PLAN-EVAL and IMPL-EVAL owner-waived (drift D-2); the owner personally reviews this plan.

This is the integrating document. Detail lives in: `SYNTHESIS.md` (evidence synthesis),
`ISSUE-DEDUP-AND-SUPERSESSION.md` (per-issue dispositions + 41 new drafts + Stage-E ledger),
`MILESTONE-TRAIN.md` (train + moves + entry/exit), `WAVE7-AND-AGENT-ADOPTION.md`,
`EXISTING-ISSUE-AMENDMENTS.md`, `milestones/*/` (complete issue drafts), `rfcs/` (RFC-A, RFC-B),
`IMPLEMENTATION-HANDOFF.md`, and the cited corpus under `research/`.

## 1. The product bar

A credible production meta-framework in 2026 must clear (evidence:
`research/external/meta-frameworks.md`): an end-to-end typed data story at the cache-coherence
frontier (SvelteKit remote functions, TanStack Start serialization checks — the two designs our
oRPC seam is measured against); scaffold/CLI generation that emits the idiomatic app, not a
counter stub; a first-party auth story that composes with the typed client; durable background
work with causal proof; observability that follows one request across every boundary; and an
agent-native surface (docs corpus + MCP + generated conventions) that measurably changes agent
behavior.

**NetScript's genuine differentiation, ranked** (same corpus): (1) first-party saga/compensation
orchestration — unowned by every JS meta-framework surveyed; (2) Aspire as a non-proprietary
local orchestration graph ("Encore's dev experience without Encore's cloud"); (3) plugin-seam
uniformity as the carrier for agent-teaching plugins; (4) the portable oRPC/OpenAPI contract as
the reason the agent story works; (5) Deno single-toolchain. The remediation program exists to
make the table-stakes true so the differentiation is believable.

## 2. Principles (owner-ratified inputs, now evidence-hardened)

1. **Generation over prose.** Six waves prove instruction does not transfer; the only untested
   lever that worked was making the right thing the emitted thing (`SYNTHESIS.md` §1).
2. **Types over convention.** Arbitrary `any`/casts in route code are unacceptable; the no-`any`
   gate extends to *consumer* output, not just framework exports.
3. **Composable seams over escape hatches.** Auth gets no bespoke hook; it dogfoods the generic
   `SdkClientContribution` chain (RFC-A), proven general by a second non-auth contribution.
4. **Runtime truth over green wrappers.** Receipts are non-ignorable, children report liveness,
   durable claims survive restart, and every causal claim has a trace that fails if the seam is
   removed. (The fourth leg this run adds to the pre-plan's three.)
5. **Current GitHub wins over carried-in reports** — enforced throughout; six corpus corrections
   from source re-verification are recorded in `ISSUE-DEDUP-AND-SUPERSESSION.md` §3.1.

## 3. Current state in one paragraph

The board holds 259 open issues across 13 open milestones; 0.0.5 is mid-canary (canary.16 green)
with its continuation plan ~40% delivered and four p0s undispatched. The web layer's builder
surface is complete and nearly cast-free, but the scaffold demonstrates none of it; the CLI has
no generator for the canonical slice and its one page verb emits a counter into the wrong tree;
the SDK client is sealed (auth cannot compose; oRPC's machinery is hidden, not missing); docs
teach three names for the client module and two query dialects; runtime plugins can report green
while children are dead, receipts are droppable, and "durable" streams are in-memory; the docs/
MCP discovery chain is structurally unwired (`--docs-root` never emitted). Full evidence:
`SYNTHESIS.md` §1–2, `research/repo-audit/*`.

## 4. Target architecture (the five contracts the program lands)

1. **The typed extension chain (RFC-A).** `SdkClientContribution`: one versioned, typed chain
   extending client construction, request context, credentials/headers, transport middleware,
   procedure policy metadata (oRPC `$meta`), error types, query factories and invalidation.
   Mostly *unhides* oRPC 1.14.6 machinery. Host-app usable without plugins; compile/config-time
   failure on absence/version-mismatch/conflict; auth first consumer, trace-context second.
2. **The canonical vertical slice, generated.** DB-derived schema (where present) → API contract
   → typed route contract + params/search → generated client/query/invalidation module →
   `definePage` composition root → `withResource`/layers → forms/partials/streams → route-local
   `(_components)/(_islands)/(_shared)/(_lib)` → Fresh-UI states → tests that reject `any`/raw
   fetch/manual parsing. Emitted by `ui:add` slice mode + the client generator; #1333 makes the
   default app the exemplar.
3. **The flexible service slice + command model (RFC-B).** Collapsible
   `domain/application/ports/adapters/routers/auth` vocabulary; transactional commands with
   expected-version, idempotent receipts, audit+outbox in one commit; `service add-handler`
   places into the slice; telemetry carries a command vocabulary.
4. **Runtime truth.** Non-ignorable publish receipts; endpoint discovery that errors instead of
   guessing; child-process liveness in the health surface; explicit stream persistence modes;
   compensation visible in traces; E2E gates that probe children and assert spans.
5. **The agent-native surface.** One docs dialect, compiled docs snippets, MCP corpus wired by
   default, generation verbs discoverable, measured adoption (Wave-7) as the program's exit
   criterion.

## 5. Dependency DAG (program level)

```text
0.0.5 close-out (existing scope only)
   └─> 0.0.6  RFC-A ratify ──────────────┬─> 0.0.7 T1 seam impl ─┬─> 0.0.7 T1-05/06 dogfoods
              RFC-B ratify ──────────────┼───────────────────────┼─> 0.0.8 T3-03 command kit
              T5 docs dialect + gates ───┤   0.0.7 T2 generators ─┴─> 0.0.8 T7-01 Wave-7 smoke
              T6 quality/hygiene gates ──┘        │                        ▲
              (T5-01 dialect choice feeds T2-02 naming)                    │
   0.0.8 T4 runtime truth + TA auth defects + T3-02 service slice ────────┘
   (T4-06/T4-08 are #979's prerequisites; TA-02 precedes TA-01; T4-01 sequenced with T4-08)
0.0.9 (renamed) #922 frontend-contrib — #928 contracts reviewed against ratified RFC-A
```

Intra-milestone edges are on every draft header and in `ISSUE-DEDUP-AND-SUPERSESSION.md` §2.
The only cross-pack sequencing hazard is recorded in §3.3 there (`ServiceQueryUtils` narrowing
lives in T2 but bites T1-05/06).

## 6. Sequencing and release mechanics

Per `MILESTONE-TRAIN.md`: two inserted milestones via the house rename pattern (verified twice in
board history); every existing issue retained; five explicit per-issue moves; canary-first
publishing per `netscript-release` throughout; Wave-7 verdict gates the train past remediation.
No `wave:*` labels (dead system); no semver jump — a "0.1.0" claim is exactly the Wave-7 GO.

## 7. Owner-fork sweep (numbered; none silently taken)

| # | Fork | Default proposal (reversible) |
| --- | --- | --- |
| F1 | Insert two milestones (rename shift of 0.0.7→0.0.13 up two) vs pack remediation into 0.0.6/0.0.7 | **Insert** — keeps #922's nine-p0 path unmixed |
| F2 | #922 before vs after remediation cuts | **After** (new 0.0.9); #928 contract freeze reviews against ratified RFC-A |
| F3 | Fold #1276→#1278 and #1275→#1279 (close the Backlog duplicates) | **Fold** — amendment text ready; closes happen only on owner action |
| F4 | RFC mechanism: issue-hosted (#1123 precedent) vs first-ever `rfcs/NNNN` file | **Issue-hosted**, divergence from `rfcs/README.md` recorded (zero file RFCs exist on main) |
| F5 | 0.0.2 stragglers (#175/#767/#768/#863/#864) destination | **Backlog + labels fixed** — explicit retriage, no closes |
| F6 | #1279 (migration chapter) leaves 0.0.6 | **→ 0.0.15** — post-remediation adoption surface |
| F7 | Canonical client dialect: module name + ONE query API (`createQueryFactories`+KV vs `createServiceQueryUtils`) | T5-01 proposes `lib/<service>.ts` + query-factories path; **owner ratifies the dialect** before docs rewrite |
| F8 | Server-side plugin seam (`PluginContractRouter = object`, Hono-vs-oRPC middleware) | **Defer** to RFC-A unresolved-questions; revisit at 0.0.7 planning (currently ownerless) |
| F9 | Saga compensation *semantics* (no prior-step rollback, unpersisted state) — file T4-09 now vs after T4-01 evidence | **After T4-01** lands its verification evidence |
| F10 | T4-01 receipt mechanism: compiler-forced discrimination vs throw-on-rejection + usage gate | Draft presents both; **owner picks at ratification** |
| F11 | Wave-7 scale: 3 arms × 2 runs × frontier models (cost) | **Approve as designed**; trimming arm B (init-gate lever) is the acceptable cut |
| F12 | oRPC 1.14.15 bump: folded into T1-04 vs standalone deps issue | **Folded** (patch-level, identical export surface) |

## 8. Risk register

| Risk | Mitigation |
| --- | --- |
| Duplicate filing against 9 prose-only umbrellas + promised-but-unfiled #1208-ph.2 | Every draft has `## Boundaries`; dedup table §1/§2; filing happens once from a manifest |
| Re-implementing landed work (#1245→#1265, #1328, #1184) | Dispositions cite merge SHAs; drafts cite current source, not wave-era observations |
| Milestone-rename blast radius (~150 issues' display) | House pattern (title-only rename, zero per-issue mutation) + move ledger |
| RFC-A over-design | Constraint written into the RFC: unhide oRPC, don't parallel it; two-consumer proof required |
| 0.0.5 scope creep | Train rule: no new scope enters 0.0.5; remediation starts at 0.0.6 |
| Corpus staleness at filing time | Stage-H filing (later, owner-ratified) re-verifies issue states before mutation; GitHub wins |
| Program stalls mid-train | Each cut has entry/exit criteria; Wave-7 verdict is a go/no-go, not a vibe |

## 9. Explicit exclusions (this plan deliberately does not touch)

Enterprise-auth vendor scope (#871 children, incl. #884/#885 — TA drafts are defects/defaults
only); deployment/process-manager/desktop epics (#327/#510/#830/#892/#823 — normalization
amendments only); Dev Dashboard (#400, paused); AI stack (#238) beyond the trace-context
contribution; docs-site visual polish (#1277); migration-chapter authoring (#1279, moved late);
blocked upstream items (#1280, #1320); `wave:*` label revival; any semver-minor jump; and all
GitHub board mutation, which remains owner-gated Stage H.

## 10. What ratification unlocks (pointer)

`IMPLEMENTATION-HANDOFF.md` names the first executable PR groups, their harness profiles, gates,
and agent briefs. Nothing in it launches until the owner ratifies the forks above and the filing
manifest is executed by a later, separately-authorized run.
