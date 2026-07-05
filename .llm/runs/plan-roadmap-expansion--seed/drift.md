# Drift Log: plan-roadmap-expansion

Append-only. Records where the specs (owner-ratified charter) diverge from repo/codebase reality as
surfaced by the Stage-B deep-search corpus. Severity: minor | significant | architectural. Owner
intent is never silently dropped — divergences are recorded here and, where they change scope or a
delegated decision, surfaced to the owner in the PR.

---

## 2026-07-04 — E1: topic-E "172a-2 service-base-seam" prerequisite is a misattribution

- **What:** Topic-E spec (§5) names the "172a-2 service-base-seam" as the load-bearing dependency
  gating true single-process before beta.8.
- **Source:** `analysis/E-desktop/sdk-link-mode-and-service-seam.md` §4; PR #172 title/scope.
- **Expected:** 172a-2 is an unshipped seam that single-process/link-mode depends on.
- **Actual:** PR #172 is **MERGED**; its 172a-2a–2e sub-slices are CLI plugin-contract/service
  **type-soundness** (workers/sagas/auth sound; triggers contract-sound connector-deferred; streams
  no oRPC contract) — unrelated to sdk link-mode or in-process service mounting. The real
  single-process dependency is narrower: server-side `ServiceApp`/Hono `.fetch()` mount seam in
  `@netscript/service` **already ships** (built for the RFC-14 unified seam); only a client-side
  `ClientLinkPort` adapter is missing from `@netscript/sdk`.
- **Severity:** significant.
- **Action:** propose-update — restate E's precursor as "add `@netscript/sdk` `ClientLinkPort`
  in-process adapter (server half shipped)"; strike the 172a-2 cross-reference. Surface to owner.
- **Evidence:** `analysis/E-desktop/sdk-link-mode-and-service-seam.md`, `issue-graph-deployment-epic.md`.

## 2026-07-04 — E2: #327 places `deno desktop` in WATCH/reference-only, unscheduled

- **What:** Topic-E premise is "ships FULLY at beta.8/stable."
- **Source:** `analysis/E-desktop/issue-graph-deployment-epic.md` (live #327 body, updated 2026-07-03/04).
- **Expected:** desktop tier scheduled at beta.8/stable.
- **Actual:** #327 currently lists `deno desktop` as WATCH/reference-only, not scheduled in any tier;
  #375 (lift eis-chat desktop to NetScript) is `priority:p3`, Backlog/Triage.
- **Severity:** significant.
- **Action:** rescope — the E deliverable IS to schedule this as the #327 4th tier + promote #375;
  record that the rescope changes the issue's current WATCH placement. Surface to owner (it is the
  ratified intent, but the current issue state contradicts it → the rescope is real work, not a note).
- **Evidence:** `analysis/E-desktop/issue-graph-deployment-epic.md`.

## 2026-07-04 — A1: D-NSONE premise ("eis-chat looks more finished") is materially weaker than stated

- **What:** `specs/01` D-NSONE frames NS One as a more-finished rival design system to promote into
  `@netscript/fresh-ui`.
- **Source:** `analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md`.
- **Expected:** NS One is ahead of fresh-ui; promotion imports a better system.
- **Actual:** fresh-ui's and NS One's shared **L0–L2 layer is byte-identical** (button/avatar/
  stats-grid/sidebar-shell/tokens.css verified char-for-char) — NS One's primitives are fresh-ui's
  own copy-source output. The real gap is narrow: fresh-ui has **no L3 "blocks" layer** (eis-chat has
  9 block compositions). Also: the true NS One truth chain is `apps/dashboard/components/ui/**`, not
  `.design-sync/previews/` (a partial 27/41 QA-scratch tree).
- **Severity:** significant (reframes, does not remove, the delegated decision).
- **Action:** fix framing in the D-NSONE resolution — the decision is really "add the missing L3
  blocks layer to fresh-ui (promotion of the delta)" vs "borrow blocks per-dashboard." Resolve in
  Stage E deep-dive; keep owner's promotion lean valid but re-costed.
- **Evidence:** `analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md`, `02-eis-chat-design-sync-full-extraction.md`.

## 2026-07-04 — A2: Aspire `IInteractionService` not available in the TS AppHost SDK

- **What:** Topic-A §5 gate is "WithCommand + interaction-service."
- **Source:** `research/A-dashboard/01-aspire-dashboard-extension-surface.md`, `02-aspire-version-pin-and-apphost-seam.md`.
- **Expected:** both `WithCommand` and interaction-service available for the Aspire extension.
- **Actual:** Aspire pin verified **13.4.6** → `withCommand` IS available (one seam → dashboard
  Actions + `aspire resource` CLI + MCP tool). But `IInteractionService` is **not exposed in the TS
  AppHost SDK at any version**; command `arguments` (InteractionInput prompt) is the only substitute.
- **Severity:** significant (design constraint on the dashboard Aspire seam).
- **Action:** fix — design routes interactive prompts through command `arguments`, not
  interaction-service. Record as a locked design constraint; not owner-facing (implementation detail).
- **Evidence:** `research/A-dashboard/*`.

## 2026-07-04 — B1: telemetry "grouped-trace showcase" — eis-chat's real cross-language boundary is thin

- **What:** owner retracted the button→python→trigger→saga→services chain; asked Fable to derive the
  real grouped-trace flow from eis-chat, cross-language where the pipeline actually crosses languages.
- **Source:** `analysis/B-telemetry/eis-chat-real-pipeline-map.md`, `context/B-telemetry/eis-chat-pipeline-diagram.md`.
- **Expected:** eis-chat has a rich real cross-language pipeline to instrument end-to-end.
- **Actual:** the SigNoz "archaeology ⋈ live telemetry" join in eis-chat docs is **aspirational, not
  implemented** ("not provisioned yet"); the only genuine non-Deno boundary today is a `duckdb.exe`
  subprocess that is **telemetry-dark**. NetScript already injects TRACEPARENT/TRACESTATE/
  CORRELATION_ID into subprocesses across a shipped 7-runtime polyglot capability, but no example
  demonstrates a non-Deno child span stitching back into the parent trace (env-var half real,
  child-continuation half undemonstrated). Candidate flows offered (A cross-language duckdb, B
  cross-process same-language workers→streams, baseline in-repo, framework-native polyglot task).
- **Severity:** significant (shapes the delegated flow + milestone choice — the hardest cross-language
  hop may need a built demonstration, not just instrumentation).
- **Action:** resolve in Stage E/D — pick the showcase flow + the beta.6-vs-stable milestone for the
  cross-language hop with eyes open that the child-continuation shim is net-new work. Surface the
  chosen flow + rationale to owner.
- **Evidence:** `analysis/B-telemetry/*`, `context/B-telemetry/*`.

## 2026-07-04 — B2: telemetry per-plugin parity worse than "level the rest up to workers" implies

- **What:** owner brief: workers is best; level the rest up.
- **Source:** `analysis/B-telemetry/plugin-instrumentation-grading.md`, `telemetry-package-surface.md`.
- **Expected:** a leveling exercise across roughly-comparable plugins.
- **Actual:** grades are very uneven — workers A, database B+/A−, sagas B+ (tracer NOOP-by-default),
  auth B (different axis), triggers C+ (**real correctness bug**: inbound-webhook W3C context captured
  but never used to parent processing spans → severed ingress→process trace), services/oRPC C+,
  streams **F** (zero wiring), ai **F** (seam never invoked — load-bearing given flagship AI mandate).
  Package itself is structurally non-compliant (forbidden `core/` folder, role-vocab drift, orphan
  `src/public/mod.ts`, duplicated `./registry`) with a tracked arch-debt "Refactor" verdict already
  mandating a ports/adapters split + dedicated OTEL-adapter subpath. Real OTel span-links exist in
  exactly ONE place (database Prisma bridge); sagas "fan-in links" are test-mock no-ops.
- **Severity:** significant (the revamp is larger and includes a bugfix + a package restructure, not
  just per-plugin leveling).
- **Action:** scope the telemetry-revamp epic to include (a) the mandated package ports/adapters
  restructure, (b) the triggers W3C-parenting bugfix, (c) streams+ai from-zero instrumentation, (d)
  real span-links for fan-in — not merely "raise everyone to workers." Not owner-facing beyond the
  epic scope; record as design input.
- **Evidence:** `analysis/B-telemetry/*`.

## 2026-07-04 — CD1: #232 is an accuracy/coverage umbrella with zero overlap with C+D new scope

- **What:** topics C (tutorial rewrites) and D (positioning) are to land "under #232."
- **Source:** `analysis/C-tutorials/03-docs-cut-logistics.md`, `analysis/D-positioning/current-docs-audit.md`
  (both fetched live #232).
- **Expected:** #232 is the docs umbrella these slot under.
- **Actual:** #232's live content is 100% accuracy/coverage debt with **zero** tutorial-rewrite or
  positioning content. Landing C+D "under #232" requires an explicit **rescope of #232** (or a new
  child epic), not a bare addition.
- **Severity:** significant.
- **Action:** rescope — draft #232 rescope (or a docs-cut child epic) as the C+D home; surface the
  choice (rescope #232 vs new epic) to owner.
- **Evidence:** `analysis/C-tutorials/03-docs-cut-logistics.md`, `analysis/D-positioning/current-docs-audit.md`.

## 2026-07-04 — C1: "4 tutorials" vs 5 live tracks; `chat` teaches against mid-flight @netscript/ai

- **What:** topic-C brief says rewrite the 4 tutorials.
- **Source:** `analysis/C-tutorials/01-current-tutorial-inventory-and-gaps.md`, `context/C-tutorials/drift-candidates.md`.
- **Expected:** 4 existing tutorials.
- **Actual:** **5** live tracks (storefront, workspace, erp-sync, live-dashboard, chat); `chat` landed
  separately (`2f643f49`) after the historical 4-track decision, and teaches against `@netscript/ai`
  which is mid-flight (`publish:false` today) — a real scheduling constraint. Tutorial **chapter**
  URLs are wired into 8 capability-hub nav sections (rewrite blast radius beyond the tutorials dir).
  No `beta.6`/`beta.7` GitHub milestones exist yet (blocks correct issue-filing per AGENTS.md).
- **Severity:** significant.
- **Action:** resolve in Stage E — decide whether `chat` is one of "the 4" or separate + how it maps
  to the new minimal-eis-chat tutorial; flag the missing beta.6/beta.7 milestones to owner (owner
  creates milestones — no mutation this run). Candidate mappings A/B/C in the corpus (C evidence-led).
- **Evidence:** `analysis/C-tutorials/*`, `context/C-tutorials/*`.

## 2026-07-04 — D1: two unreconciled docs IAs block per-feature authoring

- **What:** topic-D wants one supervisor per feature authoring per-feature story pages.
- **Source:** `analysis/D-positioning/current-docs-audit.md`.
- **Expected:** a coherent feature-page IA to author into.
- **Actual:** `capabilities/` (~15 pages) and the 9 pillar folders are **two unreconciled IAs from
  different eras** (proven via `_data.ts`/`index.vto`) — the single biggest structural decision
  blocking per-feature authoring. Only 2 named-competitor mentions exist site-wide outside `why.vto`.
  CLI/deployment/MCP have no dedicated hub page. eis-chat has **zero auth usage** (cannot back an auth
  proof point). Locked-positioning violations are confined to unshipped `_plan/` files (contained).
  One factual bug: `plugin-system.md` vs `auth-model.md`/`observability.md` on auth-audit surface.
- **Severity:** significant.
- **Action:** the D epic must include an IA-reconciliation slice as a precursor to the per-feature
  fan-out; resolve the reconciliation direction in Stage E (or surface to owner if it touches locked
  IA decisions). Record the factual bug as a docs-fix slice.
- **Evidence:** `analysis/D-positioning/current-docs-audit.md`.

## 2026-07-04 — MISC: two minor path/source drifts (accept)

- Topic-B §6.5 cites `.agents/skills/aspireify/references/opentelemetry.md` — path does not exist in
  the NetScript worktree (it exists in eis-chat's skill tree). Accept; research used eis-chat's copy.
- eis-chat `PRODUCT.md`/`ARCHITECTURE.md` narrate a SigNoz join + component map ahead of current code
  (aspirational docs). Accept; use code-verified reality for any telemetry showcase.
- Severity: minor. Action: accept (recorded so Stage D/E agents don't chase dead paths).

## 2026-07-05 — FAI-1: F-ai design invented a beta.6 Topic-A "dashboard AI panel" not in the ratified graph

- **What:** the Opus-F F-ai design (proposal §1/§7, plan.md DAG + OF-F3, open-questions OQ-3) framed a
  beta.6 Topic-A "dashboard AI panel" and made it hard-depend on FAI-0…3 (and FAI-6 if gen-UI).
- **Source:** F1-ai adversarial review finding **F1AI-01** (BLOCKER), cross-checked against ratified
  Topic-A artifacts.
- **Expected:** a ratified beta.6 Topic-A AI panel to hang F-ai cross-topic deps on.
- **Actual:** the ratified Topic-A graph has **no** beta.6 AI panel. Its only AI edges are the **stable
  DDX-19** "codegen-from-UI" handshake `⇄ #238` (`design/A-dashboard/epic-and-issues.md:52-55`,
  `:307-316`) and the integrated A–E owner fork **OF-6 "AI-invocation-at-beta.6"**, a *telemetry-seam*
  choice (`plan.md:195`) — not a dashboard panel issue.
- **Severity:** significant (invents a cross-topic hard-dep that the ratified A–E DAG does not carry).
- **Action:** fixed in F2 — reframed FAI-0…3 as a parity **floor** for any future AI consumer (and for
  the OF-6 telemetry seam / DDX-19 handshake), **not** a hard-dep injected into Topic-A's beta.6 DAG;
  OQ-3/OF-F3 reclassified as a safe deferral (rework-forcing only if the owner reopens Topic-A to add a
  panel). No Topic-A artifact was edited (F-ai does not mutate a ratified topic).
- **Evidence:** `F1-ai-adversarial-review.md#F1AI-01`; `design/A-dashboard/epic-and-issues.md:52-55,307-316`.

## 2026-07-05 — FAI-2: FAI-17 cross-topic dep stated as Topic-B T1+T6; T9's real deps are T3+T6

- **What:** F-ai stated FAI-17 (== Topic-B T9) hard-deps Topic-B **T1 + T6**.
- **Source:** F1-ai review finding **F1AI-02** (BLOCKER).
- **Expected:** the F-ai dep list matches Topic-B T9's own declared deps.
- **Actual:** Topic-B T9 declares **T3, T6** (`design/B-telemetry/epic-and-issues.md:156`; DAG `:168`
  `T3, T6 → T9`). T3 (thin-vs-SDK provider adapters + flush-on-exit) is the adapter/SDK posture the
  GenAI adapter is built on; T1 supplies attribute conventions transitively through T3.
- **Severity:** significant (a false cross-topic dependency graph → likely rework if filed as-is).
- **Action:** fixed in F2 — every FAI-17 dep statement changed to **T3 + T6** (T1 transitive) across
  proposal, epic-and-issues, agent-briefs, open-questions, and plan.md.
- **Evidence:** `F1-ai-adversarial-review.md#F1AI-02`; `design/B-telemetry/epic-and-issues.md:156,168`.

## 2026-07-05 — V3 harness: run-root `commits.md` retired

- **What:** the run carried a run-root `commits.md` and several agent-briefs instructed "append
  `commits.md`" per slice.
- **Source:** V3 harness change (commit trail = draft-PR commit list + per-slice PR comments).
- **Actual/Action:** deleted the run-root `commits.md`; corrected the "append commits.md" wording in
  `design/{A-dashboard,B-telemetry,E-desktop}/agent-briefs.md` to the V3 trail; grep confirms all
  remaining `commits.md` mentions are V3-correct ("no commits.md"). Severity: minor (bookkeeping).
