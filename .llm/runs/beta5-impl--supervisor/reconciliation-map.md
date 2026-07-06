# Beta.5 Reconciliation Map — netscript-framework

*Synthesized for the beta.5 implementation supervisor from per-issue audits. GitHub state is authoritative; docs reconcile to it, not vice versa.*

---

## 1. Summary Table

| Issue | State | body_current | milestone_right | closeable | readiness | Lane |
|---|---|---|---|---|---|---|
| **#402** T1 telemetry convention | OPEN, beta.5 | true | true | false | **ready** | WSL Codex high |
| **#403** T2 telemetry ports/adapters | OPEN, beta.5 | true | true | false | **not-beta5** (blocked on T1) | WSL Codex high (after #402) |
| **#219** AI durable-chat anchor | OPEN, beta.5 | true | true | false | **ready** | No fresh impl — eis-chat validation gate (Fable 5 sub-agent); optional Sonnet 5 docs tweak |
| **#479** AI reference docs | OPEN, beta.5 | true | true | false | **ready** | Opus 4.8 (docs-authoring exception) + Sonnet 5 cross-links; OpenHands validates |
| **#303** [S2] Enterprise maturation | OPEN, beta.5 | true | true | false | **not-beta5** | Split: Opus 4.8 high (soundness residue) + WSL Codex high (doc-lint sweep) |
| **#305** [S4] Doctrine revamp | OPEN, beta.5 | true | true | false | **not-beta5** | Split: WSL Codex high (quick-win) + Opus 4.8 workflow (full rewrite — scope-cut decision needed) |
| **#306** [S5] Harness+skills revamp | OPEN, beta.5 | **false** | true | false | **needs-body-fix** | Opus 4.8 high (prose, no code surface) |
| **#307** [S6] Stale-code elimination | OPEN, beta.5 | true | true | false | **needs-decision** | WSL Codex high (Waves 2/4); Wave 3 blocked on #305; Wave 5 owner/Opus-high per item |
| **#389** Harness V3 epic | OPEN, beta.5 | **false** | true | false | **needs-body-fix** | Opus 4.8 high or light Sonnet 5 (bookkeeping only, do not close) |
| **#327** Deployment epic | OPEN, beta.5 | true | true | false | **ready** (epic bookkeeping) | None for epic itself; children → WSL Codex high |
| **#345** [Deploy-S9] Bare-metal HA/secrets/signing | OPEN, beta.5 | true | true | false | **not-beta5** (owner-deferred to stable) | Opus 4.8 high (port/HA design fork) → WSL Codex high (impl) |
| **#346** [Deploy-S10] K8s/Azure/Docker providers | OPEN, beta.5 | true | true | false | **ready** | WSL Codex high |
| **#347** [Deploy-S11] CI/CD templates + secrets hardening | OPEN, beta.5 | **false** | true | false | **ready** | WSL Codex high (secrets piece may need Opus-high consult) |
| **#348** [Deploy-S12] One-click convergence | OPEN, beta.5 | **false** | true | false | **needs-body-fix** | WSL Codex high |
| **#399** telemetry-revamp epic | OPEN, beta.6 | true | true | false | **not-beta5** | None for epic; T1/T2 already routed via #402/#403; T3-T8 beta.6 WSL Codex high |
| **#301** Road-to-0.0.1-stable umbrella | OPEN, stable | **false** | true | false (deps_correct **false**) | **needs-body-fix** | Direct `gh issue edit` by coordinator — no sub-agent |
| **#238** AI Stack umbrella | OPEN, beta.7 | true | true | false | **not-beta5** | None for umbrella; active child is #219 |

---

## 2. Per-Issue Detail

### #402 — [T1] Telemetry convention (TC-1..14) + namespacing law
**Governing docs:** `design/B-telemetry/epic-and-issues.md`, `design/B-telemetry/proposal.md`, `design/B-telemetry/agent-briefs.md`, `BETA34-FORECAST.md`
**required_edits:** *(none)*
**Closeable evidence (why false):** `packages/telemetry` still has a forbidden `core/` folder and `src/public/`; `SpanNames` is a pre-existing minimal set, not the TC-1..14 `createXAttributes` extension; no TC-1..14 checklist doc exists anywhere; no PR references #402. This is unstarted, foundational, no-behavior-change work — ready to implement.

### #403 — [T2] Telemetry package ports/adapters restructure
**Governing docs:** `design/B-telemetry/epic-and-issues.md`, `proposal.md`, `FILING-LOG.md`, `BETA34-FORECAST.md`
**required_edits:** *(none)*
**Closeable evidence:** `src/core/` still exists, no `./otel` or `./query` export subpaths, no `testing/` dir. Blocked on #402 (T1) landing first — sequential dependency, not scope drift.

### #219 — AI durable-chat anchor
**Governing docs:** `design/F-ai/epic-and-issues.md`, `BETA34-FORECAST.md`, `SUPERSESSION-MAP.md`, `CONFORM-LOG.md`, `design/ROUTING-ADJUSTMENTS.md`
**required_edits:**
- No milestone/label/body edit required right now — all three are already correct per the ratified design-of-record.
- Optional, low-priority docs gap (not a blocker): `docs/site/web-layer/defer-streaming-ui.md` still has zero chat/durable-session cross-reference (Ask #2 is ~2/3 done).
- Procedural, not an issue edit: run the ROUTING-ADJUSTMENTS.md item-8 "eis-chat validation gate" (Fable 5 sub-agent against `rickylabs/eis-chat`) to produce the proof artifact needed to close #219.

**Closeable evidence:** Primitives (FA1 `createNetScriptChatConnection` #250, FA2 `createChatStreamProxyHandler` #251, gzip-strip fix #239, SR1/SR2) are **already merged on main**. What's unmet is the owner's posted closing criterion: proof that eis-chat's 3 `Accept-Encoding: identity` workaround sites are removed and streaming still works — an out-of-repo dogfooding step, not more framework code.

### #479 — AI reference docs (3 new pages)
**Governing docs:** `design/CD-docs/proposal.md`, `design/F-ai/proposal.md`, `design/F-ai/epic-and-issues.md`, `beta5-impl--supervisor/{charter,context-pack,phase-registry}.md`
**required_edits:** *(none)*
**Closeable evidence:** None of `docs/site/reference/{ai,plugin-ai,plugin-ai-core}/index.md` exist on main. Clean, low-ambiguity checklist, no open product decisions blocking it. Supervisor's own phase-registry already sequences this after #219 (conservative choice, not a hard body dependency).

### #303 — [S2] Enterprise maturation + consolidation
**Governing docs:** `docs/architecture/doctrine/11-plugin-thinness-and-base-seams.md`, `02-public-surface.md`, `SUPERSESSION-MAP.md`, `CONFORM-LOG.md`, `beta5-impl--supervisor/{charter,context-pack}.md`
**required_edits:**
- No body/label/milestone edit required. Optional polish only: tighten "Depends on S4 ... S6 ..." to explicit `#305`/`#307`.
- When dispatched, read "no slow-types allowances" together with the sanctioned exception (commit `86eca907`) — bar is "no **unsanctioned** slow-types allowances." Worth a one-line clarifying edit at dispatch time, not required now.

**Closeable evidence:** Most 172a-2-SOUND work (base contract + workers/sagas/triggers/auth conversion) is already merged. Remaining: full-repo doc-lint sweep and the two hard CI gates (`e2e-cli-prod`, `scaffold.runtime`) are "intentionally red for beta.4 — beta.5 cut must re-prove green" per context-pack — still open.

### #305 — [S4] Architecture Doctrine revamp
**Governing docs:** `beta5-impl--supervisor/{charter,phase-registry}.md`, `design/ROUTING-ADJUSTMENTS.md`, `SUPERSESSION-MAP.md`, `CONFORM-LOG.md`, `docs/architecture/doctrine/01-thesis-and-axioms.md`, `.llm/tools/fitness/check-doctrine.ts`
**required_edits:** *(none — issue body itself is current and accurate; the open question is scope-cut, not a defect)*
**Closeable evidence:** `docs/architecture/doctrine/` still has only 11 files, not the 12-file v2 target; `01-thesis-and-axioms.md` still has 3 dead `phase-0-research/*` links; `check-doctrine.ts` still enforces the dead `@netscript/shared` rule; `arch:check` is not rewired to an F-family composite. **Owner-batch flag:** full 12-chapter rewrite vs. quick-win-only is a scope decision for the supervisor/owner — chapter-06 (package-graph/plugin-thinness gate) is explicitly meant to be sequenced after AI-stack (#238) and plugin-v2.

### #306 — [S5] Harness + skills revamp
**Governing docs:** `SUPERSESSION-MAP.md`, `design/ROUTING-ADJUSTMENTS.md`, `beta5-impl--supervisor/{phase-registry,worklog}.md`, `.llm/harness/workflow/lane-policy.md`, `run-loop.md`, `ARCHETYPE-5-plugin.md`
**required_edits:**
- Update the issue body's checklist to mark done what's already merged: ARCHETYPE-5 realignment (PR #361), profiles/sagas+triggers deletion (PR #369, 12 files), `lane-policy.md`'s #306 invariant + Amendment-A1, `tooling.md`'s agentic:* aliases, `run-loop.md` §8 Release phase, Copilot/Augment scrub (zero hits), skill frontmatter name-field fixes.
- Flip `status:plan` → `status:impl`: two merged PRs (#361, #369) already reference this issue and are live on main.
- Keep as remaining scope in the body: doctrine-06 archetype-5 folder-shape reconciliation (still deferred, not resolved); wiring named release gates into `evaluator/protocol.md` and `gates/archetype-gate-matrix.md` (currently only in `run-loop.md` §8); dedicated `release-gates.md`; `SCOPE-frontend.md` "add fresh/ai" (zero hits); `arch-debt.md` reconciliation (unverified).

**Closeable evidence:** Body undercounts progress (stale in the *other* direction) but real sub-items remain unresolved — not closeable.

### #307 — [S6] Stale-code elimination
**Governing docs:** issue body (self-contained, no dedicated design doc), `CONFORM-LOG.md` line 46, `beta5-impl--supervisor/{phase-registry,charter,worklog,context-pack}.md`
**required_edits:**
- Post a progress comment (or checklist edit) recording Wave 1 DONE and merged: PR #324 (commit `af7ae997`) deleted 17 dead files + 4 dead exports. Note `data-grid.css` was investigated and correctly **kept** (follow-up commit `0ecf669d`) — couples to shipped `DataGrid` (#225) by BEM class name, not import; original 0-importer scan was a false positive. Record this so no future agent re-attempts the delete.
- Update `phase-registry.md` to reflect Wave 1 shipped, so the Step-1 chores-wave lane for #307 only needs to cover Waves 2-5.
- No milestone/label change needed.

**Closeable evidence:** Wave 1 fully verified merged and absent from live tree. Waves 2-5 have zero commits anywhere. Wave 3 genuinely blocked on #305 (doctrine reconcile). Wave 5 requires owner per-item decisions (e.g. `--legacy-aspire` removal explicitly flagged "coordinated sub-epic, user approval"). **The issue's own "Beta gate (Wave 1)" condition IS satisfied — beta.5 is not blocked by #307's remaining scope.**

### #389 — Harness V3 program epic
**Governing docs:** `feat-agentic-workflow-doctrine-v3--v3/{plan,design-v3,plan-eval,impl-eval,drift,worklog,supervisor}.md`, `SUPERSESSION-MAP.md`, `CONFORM-LOG.md`, `BETA34-FORECAST.md`
**required_edits:**
- Update stale placeholders: "Sub-issues" checklist still shows `[ ] V3 design + doctrine spec (draft PR #TBD)` / `[ ] Slice map TBD post-design` / "Design/dogfood PR: #TBD" — update to reference PR #390 (merged, squash `eeaff336`, 13 slices S0-S10 + Amendments A1/A2), IMPL-EVAL PASS, finalize PR #398 (merged), closeout PR #396 (merged).
- Clarify that no separate GitHub sub-issues were filed for V3 slices — all landed as commits inside PR #390, per `worklog.md`.
- No milestone/label change needed — `status:plan` is the standing convention for umbrella epics (#301, #327 too), not a stale-phase signal.
- **Do not close #389** — worklog's own closeout entry explicitly records it stays OPEN as a durable umbrella.

**Closeable evidence (why it stays open, not why it's incomplete):** the substantive V3 rollout is complete and verified live; this is purely a bookkeeping/body-accuracy fix.

### #327 — Deployment framework epic
**Governing docs:** `design/E-desktop/epic-and-issues.md`, `SUPERSESSION-MAP.md`, `FILING-LOG.md`, `analysis/E-desktop/issue-graph-deployment-epic.md`, `specs/topic-E-desktop-deploy.md`
**required_edits:** *(none)*
**Closeable evidence:** 8 of 14 linked sub-issues remain open (#345-350 beta.5/backlog, #451-458 beta.8/stable). Tier-1 (#337-344) all closed and correctly checked. No drift found anywhere in the dependency tree.

### #345 — [Deploy-S9] Bare-metal stable hardening (HA, secrets, signing)
**Governing docs:** `analysis/E-desktop/issue-graph-deployment-epic.md`, `SUPERSESSION-MAP.md`, `CONFORM-LOG.md`, `BETA34-FORECAST.md`, `design/ROUTING-ADJUSTMENTS.md`
**required_edits:** *(none)*
**Closeable evidence:** No HA/multi-instance rollout, no external secret-store adapter, no automated signing pipeline exists on main — only the already-closed S5 secrets/rollback seam commit. **Owner-batch flag:** explicitly deferred past beta.5 by the owner (D3/D4 decisions) — milestone beta.5 is a staging placement, not an execution commitment; do not pull into current-wave execution.

### #346 — [Deploy-S10] Aspire Kubernetes + Azure + Docker-image providers
**Governing docs:** live epic #327 body (design-of-record), `analysis/E-desktop/issue-graph-deployment-epic.md`, `CONFORM-LOG.md`, `BETA34-FORECAST.md`
**required_edits:** *(none)*
**Closeable evidence:** No k8s/Azure/Cloud-Run code exists on main (`git log --all | grep -i "Deploy-S9\|S11\|S12"` = zero hits for this cluster). Dependency S7 (#343) confirmed closed. Ready to route now.

### #347 — [Deploy-S11] CI/CD templates + Aspire deployment-state hardening
**Governing docs:** `analysis/E-desktop/issue-graph-deployment-epic.md`, `CONFORM-LOG.md`, `BETA34-FORECAST.md`, epic #327 body + owner D1-D6 comments
**required_edits:**
- Fix the body's "## Tier / phase" line: reads "STABLE · Phase 4 · milestone 0.0.1-stable" but live milestone is 0.0.1-beta.5 (CONFORM-LOG confirms beta.5 is correct/unchanged). Reword so the text stops contradicting the live milestone field.
- Optional: add explicit issue numbers (#342, #343) next to the internal "S6/S7" codes in the Dependencies line — both confirmed CLOSED.

**Closeable evidence:** No GH Actions workflow-template generator, no Aspire deployment-state/secrets hardening layer exists in `packages/cli/src`. Deps (#342, #343) both closed and verified (not falsely-closed — the related risk issues #393/#394 that would undermine that trust are themselves closed via #468/#469/#470).

### #348 — [Deploy-S12] One-click convergence + release-skill integration
**Governing docs:** issue body/comments, epic #327 Phase 5 section, `analysis/E-desktop/issue-graph-deployment-epic.md`, `CONFORM-LOG.md`, `SUPERSESSION-MAP.md`, `BETA34-FORECAST.md`, `design/E-desktop/epic-and-issues.md` (MILESTONE AUTHORITY banner)
**required_edits:**
- Update "## Tier / phase" line ("STABLE · Phase 5 · milestone 0.0.1-stable") to reflect the actual live milestone 0.0.1-beta.5 — label/milestone are already correct on GitHub, but body text misleadingly reads stable-tier.
- Update "## Dependencies" line ("Deferred to stable.") — stale/misleading: S5/S6/S7 (#341/#342/#343) are all CLOSED, so #348 is unblocked and ready, not deferred.
- No label/milestone/parent-link mutation needed.

**Closeable evidence:** `deploy-group.ts` line 76 has a literal developer marker "full convergence is S12/#348"; `target-deploy-command.ts`'s `ROUTED_OPERATIONS` has no `init` verb; `.llm/tools/release/cut.ts` has no deploy-step integration. Real, unstarted work, correctly unblocked.

### #399 — telemetry-revamp epic
**Governing docs:** `design/B-telemetry/{proposal,epic-and-issues,agent-briefs}.md`, `FILING-LOG.md`, `OWNER-DECISION-BRIEF.md`
**required_edits:** *(none)*
**Closeable evidence:** All 8 direct children (T1-T8, #402-#409) OPEN; only T1→T2 (beta.5 slice) has begun implementation per the live supervisor run. Milestone beta.6 correctly reflects the T3-T8 body of work landing after beta.5's T1/T2.

### #301 — Road-to-0.0.1-stable umbrella
**Governing docs:** `plan.md`, `filing-manifest.md`, `SUPERSESSION-MAP.md`, `design/{B-telemetry,A-dashboard,CD-docs,E-desktop,F-ai}/epic-and-issues.md`
**required_edits:**
- Add 4 missing checklist rows to "Children (sub-epics)": **#391** (beta.3→stable re-forecast epic, OPEN, milestone stable), **#399** (telemetry-revamp, OPEN, beta.6), **#400** (Dev Dashboard, OPEN, beta.6), **#401** (docs-cut, OPEN, beta.7). All four bodies say "Part of #301" but none appear in #301's own checklist.
- Check the box on `- [ ] #304` (S3 De-rickylabs) — it is **CLOSED** (2026-07-03) but still rendered unchecked.

**Closeable evidence:** Only #304 of 9+4 children is closed; program is mid-flight (beta.1-4 shipped, beta.5 actively running). **This is the one issue with `deps_correct: false`** — the dependency/children list itself is incomplete, not merely stale prose.

### #238 — AI Stack umbrella
**Governing docs:** `design/F-ai/{epic-and-issues,proposal}.md`, `FILING-LOG.md`, `SUPERSESSION-MAP.md`
**required_edits:** *(none)*
**Closeable evidence:** Body checkboxes spot-checked against every child (#240-263 cluster) — zero drift between body and live state. Milestone beta.7 (moved from beta.3) matches the design's re-forecast target exactly, with epic comment confirming the re-sequencing was posted 2026-07-05. Forbidden by design to ever carry a closing keyword (Part of #301).

---

## 3. Recommended Lane Order

**Phase 0 — trivial bookkeeping (can run immediately, in parallel, no dependencies):**
1. `#301` — add missing children (#391/#399/#400/#401), check #304's box. Direct `gh issue edit`, no sub-agent.
2. `#389` — replace stale `#TBD` placeholders with PR #390/#398/#396 references. Sonnet 5 or light Opus pass; do **not** close.
3. `#347` / `#348` — fix stale "Tier/phase" and "Dependencies" body lines before dispatch (cosmetic, low-risk, can ride with the impl PR instead if preferred).

**Phase 1 — chores wave (per user directive, land before feature lanes):**
4. `#303` — split: Opus 4.8 high on remaining plugin-service soundness residue (fresh-ui/Aspire touchpoints) **in parallel with** WSL Codex high on the full-repo doc-lint/`publish:dry-run` sweep. Both gate on `e2e-cli-prod` + `scaffold.runtime` going green — this is the hard beta.5-cut proof point.
5. `#305` — WSL Codex high ships the quick-win PR now (dead `check-doctrine.ts` rule, dead `phase-0-research/*` links, AP/F ref reconciliation). **Owner-batch decision needed**: quick-win-only vs. full 12-chapter doctrine v2 ratification for this cut — full rewrite is RFC-gated prose work, sequenced to not force chapter-06 ahead of AI-stack (#238)/plugin-v2 landing.
6. `#306` — Opus 4.8 high updates the checklist to reality (mark #361/#369 done, flip `status:impl`) and scopes the real remainder (doctrine-06 archetype-5 folder-shape, gate-matrix wiring, `SCOPE-frontend.md`).
7. `#307` — WSL Codex high on Wave 2 (quick-glance deletes) and Wave 4 (`.llm/tmp` purge, coordinate with S3 PR-3b). Wave 3 stays blocked until `#305`'s doctrine reconcile lands. Wave 5 is **owner-batch** (per-item human calls, e.g. `--legacy-aspire`). Beta gate (Wave 1) is already satisfied — not a blocker.

**Phase 2 — features:**
8. **Critical path:** `#402` (T1, WSL Codex high) → `#403` (T2, WSL Codex high, strictly sequential — do not start T2 until T1's namespacing-in-`domain` change lands and passes IMPL-EVAL).
9. **AI:** `#219` — no fresh framework-source slice; dispatch the "eis-chat validation gate" (Fable 5 sub-agent against `rickylabs/eis-chat`) to produce the closing proof. Optional trivial Sonnet 5 docs tweak (`defer-streaming-ui.md`) can ride alongside.
10. **Deploy:** `#346`, `#347`, `#348` — WSL Codex high, parallelizable (no cross-deps among the three; #348 depends only on already-closed #341/#342/#343). `#345` is **owner-batch / parked** — explicitly deferred to stable by the owner; keep tracked at beta.5 for staging visibility only, do not schedule implementation this wave.
11. **Docs:** `#479` — Opus 4.8 (docs-authoring exception) for the 3 reference pages, Sonnet 5 for cross-link stitching, OpenHands (qwen 3.7 max) validates per-page. Sequence after or interleaved with `#219` (soft ordering choice, not a hard body dependency).

**Owner-batch items (surface to owner, do not treat as blockers to the beta.5 cut):**
- `#305` full-rewrite scope-cut (quick-win vs. full 12-chapter ratification).
- `#307` Wave 5 per-item decisions (`--legacy-aspire`, `packages/runtime-config` orphan, AI package HOLD, auth/fresh shims, kv redis fallback).
- `#345` stays parked at stable-tier per existing owner D3/D4 rulings — no action needed, just don't schedule.
- `#403`'s "not-beta5" readiness is a **sequencing block** (waiting on #402), not an owner scope question — distinguish this from the true deferrals above when reporting status upward.

---

## 4. Conflicts & Risks

- **`#301` is the only issue with `deps_correct: false`** — its children checklist is missing 4 live epics (#391, #399, #400, #401) that all self-report "Part of #301." This is a real GitHub↔body mismatch, not a docs-vs-GitHub disagreement; fix by direct issue edit, GitHub already has the correct individual epic milestones.
- **Milestone-field vs. body-tier-language mismatches are widespread but *intentional*, not drift:** `#345`, `#346`, `#347`, `#348` all show "STABLE"/"stable-tier" language inside the body while the live GitHub milestone is `0.0.1-beta.5`. Per `CONFORM-LOG.md`, this is a deliberate staging placement ("Milestones left at beta.5, unchanged") distinct from the epic's internal phase/tier vocabulary — **GitHub milestone wins for scheduling purposes**, but the body text should still be reworded on #347/#348 (flagged above) since it actively misleads a reader who trusts prose over the milestone field.
- **`#403`'s readiness flag is ambiguous** — labeled `not-beta5` even though its milestone is correctly beta.5; the real state is "blocked on #402, not out-of-scope." Recommend the supervisor track this distinctly from genuine owner-deferred items (`#345`, and the beta.6/beta.7 epics `#399`/`#238`) to avoid conflating "sequenced-next" with "parked."
- **Missing/incomplete dependency surfacing in body text:** `#347` and `#348` both cite internal codes ("S6/S7", "S5+S6+S7") without issue numbers, forcing cross-referencing against the epic body. Low-risk but worth the one-line fix at dispatch time (already captured in required_edits above).
- **Stale progress-undercounting bodies** (opposite failure mode from staleness-by-overclaiming): `#306` and `#307` both have bodies that fail to reflect real merged progress (PRs #361/#369 for #306; PR #324 for #307's Wave 1). Left unfixed, a future agent could re-derive or even re-attempt already-completed work (explicitly flagged risk: `#307`'s `data-grid.css` false-positive dead-file scan, already correctly resolved once — document it so it isn't re-litigated).
- **`#399` and `#238` are epics one milestone-tier ahead of beta.5** (beta.6 and beta.7 respectively) — correctly so; their beta.5-scoped children (`#402`/`#403` for #399; `#219`/`#479` for #238) are already tracked as standalone lane items above. Do not attempt to "close the wave" by acting on the epics themselves.
- **No framework-source work should route to a Claude workflow/Opus lane** except the two explicitly carved-out design-fork consults (`#303` type-soundness residue, `#345` secret-store/HA port design) and the docs-authoring exception (`#479`, `#306`, `#305`'s prose half, `#389`'s bookkeeping edit) — per `CLAUDE.md`'s Claude-Workflow-Policy, everything else (all of `#402`/`#403`/`#346`/`#347`/`#348`, and `#303`/`#305`/`#307`'s mechanical halves) is WSL Codex high, never Fable 5.
- **Two hard CI gates remain the true beta.5-cut bottleneck**, not any single issue: `e2e-cli-prod` and `scaffold.runtime` are called out as "intentionally red since beta.4" in `#303`'s notes — both must go green as part of `#303`'s doc-lint/soundness sweep before the cut, independent of feature-lane completion.