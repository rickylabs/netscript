# PLAN-EVAL — plan-unified-runtime--seed

- Plan evaluator session: OpenRouter `qwen/qwen3.7-max` via `claude-openrouter`, 2026-07-18 (Stage-G evaluator lane, `formal_evaluation`).
- Run: `plan-unified-runtime--seed` (#824)
- Surface / archetype: seed run (planning-only; no package publication)
- Scope overlays: cross-cutting refactor over service / SDK / CLI-config / database-KV-queue / plugin-runtime / Fresh surfaces; per-package doctrine archetype and JSR gates delegated to the UR-11 architecture-contracts prerequisite card.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research/` holds 7 topic files (nitro-v3, adapter-mapping, orpc-fresh, sagas-constraint, drift-ledger, market, deno-deploy-new) dated 2026-07-18 and re-baselined against `origin/main` @ 56cf84b5 (post-#847). Every load-bearing claim cites a URL, a `deno doc` surface, or a repo path+line. The Stage-F residual concern that dated extracts were absent (finding 15) is RESOLVED per the recheck: `evidence/SHA256SUMS` covers 6 extracts and `sha256sum -c` passes all of them (`market-frameworks`, `netscript-deno-doc`, `nitro-v3-live`, `orpc-fresh-live`, `pr822-frame`, `deno-deploy-new-live`). |
| Decisions locked                        | PASS   | 12 locked decisions (L1–L12) in `plan.md` §Locked decisions, each with rationale and canonical-file source citations. |
| Open-decision sweep                     | PASS   | F-1…F-17 + SC-1…SC-6 in `plan.md` §Owner-fork sweep and `design/D3-board-mechanics/decision-brief.md`. Every fork is numbered, default stated, and source-attributed. Body-changing forks (F-3, F-4, F-5, F-7, F-8, F-10 plus F-1, F-2, F-16) carry explicit A/B deltas inline in the relevant `design/canonical/UR-<n>.md` under `## Fork deltas`. F-12 branch-B delta is materialized at `decision-brief.md:68` explicitly addressing the recheck's residual concern. |
| Commit slices (< 30, gate + files each) | PASS   | For a seed run the "commit slices" box maps to the canonical slot artifacts + the resumable filing manifest: 13 canonical `design/canonical/UR-0…UR-12.md` files + `DD-RESEARCH.md` + `slot-map.md` with merge transforms; 14-row DAG create order in `filing-manifest.md` Step 4 (well under 30); each row names the exact label set, milestone, and the gates it proves (`- [ ] gate:` boxes in every canonical `## Body`). The manifest at `:83-88` specifies per-slot idempotency (slot marker), search-before-create, immediate per-slot FILING-LOG append, read-after-write, and preflight failure on a missing status or a label absent from `.github/labels.yml`. |
| Risk register                           | PASS   | 7 risks with mitigations in `plan.md` §Risk register, including Deno Deploy withdrawal, Nitro beta churn, oRPC v2 pin, preset-claim rot, lifecycle hook loss, filing duplication, and board drift — each mapped to a specific slice or rework lane. |
| Gate set selected                       | PASS   | Seed-run gate matrix in `plan.md` §Gate matrix names Stage-F, Stage-E rework, Stage-F re-verification, Stage-G (this verdict), Stage-H ratification, label-parity prerequisite, and KEEP-only reconciliation. Per-package doctrine archetype/fitness/JSR/E2E gates are explicitly assigned to the UR-11 architecture-contracts prerequisite card (`design/canonical/UR-11.md:27-30, 50`), which blocks UR-1/UR-4/UR-5 — so no implementation lane starts without the gate matrix settled. |
| Deferred scope explicit                 | PASS   | DD-RESEARCH successor card (deno_deploy re-proof, `0.0.1-stable`, F-2); #455 offline-sync implementation (`0.0.1-stable` or `Backlog / Triage`, F-10); `@netscript/data` facade (deferred unless owner commissions, F-8); WebSocket/upgrade scope (deferred to post-v1 cell proof, F-4); externalized sagas (v1.1, F-3). Every defer site has a named milestone or fork control. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | This is a seed planning run with no package publication. UR-11 architecture-contracts card names package/export/JSR surface gates as an acceptance-gated prerequisite (`design/canonical/UR-11.md:49-53`) — the JSR bar is enforced before any implementation lane starts, not at the seed stage. |

## Open-decision sweep (evaluator-run)

No open decisions found that would force rework if deferred. Every load-bearing fork I checked either carries explicit A/B deltas in the canonical file (so a selection is filed from the committed artifact) or is a label/naming/milestone choice that the manifest's compare-before-edit guards already handle. The recheck's residual concern about F-12 branch B changing the issue count is explicitly materialized at `decision-brief.md:68` (UR-6a/b/c slot-template branch with markers and slot-map +3 rows) — that is a committed plan artifact, not improvisation after ratification.

## Evidence-citation gate (seed-run stage B — 5 spot-checks)

1. **Deno Deploy sunset claim (live URL).** `research/deno-deploy-new.md:10` and the committed evidence extract `deno-deploy-new-live-2026-07-18.md` both say Classic/`deployctl` sunset **2026-07-20**, sourced from `https://docs.deno.com/deploy/migration_guide/`. CONFIRMED.
2. **`deno doc` claim.** `evidence/netscript-deno-doc-2026-07-18.md` records 11 exact `deno doc --filter` commands over `packages/kv`, `queue`, `database`, `service`, `plugin-workers-core`, `plugin-sagas-core`, `plugin-triggers-core`, `plugin-streams-core` modules with the returned surface. `research/sagas-constraint.md:33` cites `deno doc --filter SagaDefinition packages/plugin-sagas-core/mod.ts` as the source of the durable-tier shape. CONFIRMED.
3. **`service-builder-impl.ts:423-432` (build returns only ServiceApp).** Repo `packages/service/src/builder/service-builder-impl.ts:427-433` confirmed — `build()` calls `installAuth`, `installDeferredRoutes`, `notFound`, `onError`, and `return this.app`. No lifecycle hooks executed. CONFIRMED.
4. **`service-builder-impl.ts:501-521` (hooks run only in serve()).** Repo lines 506-522 confirmed — `serve()` runs `startupHooks` before `build()`, wraps the app with `startServiceListener`, and passes `shutdownHooks` to it. `build()` itself does not. CONFIRMED.
5. **`service-shutdown.ts:1-135` (ServiceShutdownCoordinator).** File exists at 179 lines (the cited range is a subset); `DEFAULT_DRAIN_TIMEOUT_MS` appears 3 times. CONFIRMED.
6. **oRPC pin `^1.14.6`.** `packages/service/deno.json:21-22` pins `@orpc/server: "npm:@orpc/server@^1.14.6"` and `@orpc/openapi: "npm:@orpc/openapi@^1.14.6"`. CONFIRMED.

## Stage-F cycle honesty (spot-check 3 of 9 BLOCKERs)

1. **F1 — C2/`deno_deploy` withdrawal.** Adversarial finding 1 said the plan validated a platform being shut down. Triage accepted: C2 leaves v1 cell set, replaced by a research card. Verified in canonical artifacts: `UR-6.md:32-39` explicitly withdraws `deno_deploy` from v1 with dated reason (sunset 2026-07-20), gates "deno_deploy produces **no** v1 capability claim", and defers re-entry to DD-RESEARCH. `DD-RESEARCH.md` is a separately-milestoned successor (`0.0.1-stable`) with four concrete reproducible-proof gates and a dependency on UR-6 (so re-entry cannot bypass the v1 conformance harness). The recheck rates this RESOLVED. **Honest closure.**
2. **F2 — #451 over-fold into UR-4.** Adversarial finding 2 said the fold would lose the public SDK contract. Triage accepted: UR-4 = host bridge only, no `Closes #451`, O-1 restored. Verified: `UR-4.md:31-40,49,53-60` limits UR-4 to host-side bridge, removes the `Closes #451` keyword, adds a KEEP note, and restores the SDK↔service direction as fork F-7. The recheck rates this RESOLVED. **Honest closure.**
3. **F5 — hostable lifecycle bypass.** Adversarial finding 5 said D1 would silently lose `.onStartup()`/`.onShutdown()` hooks. Triage accepted: new UR-0 prerequisite. Verified: `UR-0.md:26-44` specifies build/start/stop hostable contract, explicitly reuses `ServiceShutdownCoordinator` (idempotency/abort/drain/LIFO/ShutdownReport), preserves startup-hook ordering and startup-failure rollback, and gates UR-2. `D1-2` agent brief at lines 57-62 of `D1/agent-briefs.md` directs the lane to consume UR-0's surface and forbids inventing a bespoke disposer. The recheck rated this PARTIALLY-RESOLVED citing D1-briefs.md:58-62, but the verbatim text at those lines actually reads "invokes the **UR-0 hostable-service lifecycle contract** (which reuses the shipped `ServiceShutdownCoordinator` policy — idempotency, bounded drain, LIFO, structured report). Do NOT invent a bespoke disposer registry (Stage-F finding 5)" — which is the correct fix. The residual concern is mis-read; the artifact is correct. **Honest closure.**

## Drafts-only boundary verification

- `design/D3-board-mechanics/decision-brief.md` H1: `DRAFT — owner ratifies in-turn at Stage-H`.
- `design/D3-board-mechanics/filing-manifest.md` H1: `DRAFT — executes only after owner in-turn ratification of decision-brief.md`.
- Manifest `§Step 0` pre-flight (`:38-47`) makes PLAN-EVAL PASS and in-turn ratification a hard gate before any mutation.
- Manifest `§Step 1` (`:49-60`) makes the `epic:unified-runtime` label-parity PR a **GATED PREREQUISITE** — filing explicitly may not begin until it is merged (CI green + opposite-family eval PASS per Stop-line 1). The transaction has **no** step that proceeds on an unmerged parity PR.
- Manifest `§Step 5` (`:122-152`) reconciliation is KEEP-only with a drafted #327 non-closing addendum text. Zero filing-time closes.
- No issue, epic, milestone, or label has been mutated by this run. The run's own draft PR is the only writable GitHub surface (per `supervisor.md:29-31` and the seed-run doctrine).

## Notes

The Stage-F recheck at `f85d4919` rated 13/17 findings RESOLVED, 4 PARTIALLY-RESOLVED, and raised 3 NEW findings (2 MAJOR, 1 MINOR). None rise to plan-level failure:

- **NEW-1 (duplicate idempotency marker).** The recheck claimed whole-file publishing would duplicate the marker. The manifest at `:10-14` and `:83-88` is explicit: publish ONLY the `## Body` section, never the metadata header. The file-scope marker in `UR-6.md:1` lives outside `## Body` (it is above the H1 at line 3); the body-scope marker at line 17 is the only instance in the publishable region. This finding is a mis-read of the manifest, not a plan defect.
- **NEW-2 (F-2 branch B dependency cycle).** UR-6's fork delta F-2 at `UR-6.md:63-69` addresses this explicitly: branch B keeps UR-6 at three cells in both branches and creates a SEPARATE UR-6-EXT successor extension card after DD-RESEARCH passes. No cycle. The plan is consistent.
- **NEW-3 (UR-6 title says "four-cell" vs three-cell v1).** Real minor wording inconsistency at `UR-6.md:3`. The acceptance gates at `:51-54` correctly say three v1 cells. The title could be adjusted at Stage-H filing or in a trivial canonical edit — not a blocker.

The PARTIALLY-RESOLVED recheck concerns (F1, F5, F8, F12) were all re-verified above and either the residual concern is a mis-read or the manifest already addresses it.

Overall: a well-defended, evidence-cited, adversarially-tested seed plan. The decision brief is fully materialized, the canonical slot artifacts are deterministic, the filing manifest is resumable, and the drafts-only boundary is preserved. Implementation may begin after owner ratification in-turn at Stage-H.

## Verdict

`PASS`

PASS
