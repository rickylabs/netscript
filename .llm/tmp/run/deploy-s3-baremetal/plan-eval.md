# PLAN-EVAL — deploy-s3-baremetal (#339 + #340)

- **Gate:** PLAN-EVAL (separate session, before implementation)
- **Slice:** #339 (`WindowsServicePort → OsServicePort` + `SystemdAdapter`) + #340 (`deno compile`
  single-binary bare-metal artifact), one Archetype-7 bare-metal slice. #341 out of scope.
- **Base verified:** `origin/main` @ deploy-s3 worktree tip. Ground truth read firsthand.
- **Verdict:** **FAIL_PLAN** — one blocking finding (B1: commit order contradicts the ratified
  port-ownership front-load decision). The plan is otherwise high-quality, doctrine-faithful, and
  ground-truth-accurate; B1 is a surgical re-order, not a redesign.

---

## Ground-truth verification (firsthand, not taken from the plan)

| Plan claim | Verified? | Evidence |
| ---------- | --------- | -------- |
| Two seams on main at different levels | **YES** | `deploy-target-port.ts` = 3-op stub (`build\|install\|uninstall`, all optional); `windows-service-port.ts` = real `WindowsServicePort` (`install` + `run(start\|stop\|status\|uninstall)`). |
| Stub adapter is canned-message only | **YES** | `windows-service-deploy-target.ts` returns `${label} ${op} registered for ${root}` — no real work. |
| Two Windows call paths (port vs `runServy` bypass) | **YES — exact** | `install-service-deploy.ts`/`uninstall-service-deploy.ts` call `services.run(...)` (the port); `start`/`stop`/`status-deploy-command.ts` call `runServy()` + `servyLifecycleArgs(...)` directly (bypass). Unification is a genuine, necessary hidden-scope item. |
| Registry closed-on-key, only `windows-service` | **YES** | `deploy-target-registry.ts` seeds `DEFAULT_DEPLOY_TARGETS = [['windows-service', …]]`. |
| Config: linux member spreads `deployTargetBaseShape` (LD-5) | **SOUND** | `deploy-schema.ts` `WindowsDeployTargetSchema` spreads `...deployTargetBaseShape` and annotates `z.ZodType<WindowsDeployTarget>`; the schema comment already reserves `linux` as a future sibling. LD-5 mirrors this exactly. |
| File sizes near F-1 ceiling | **MOSTLY** | Actual: `upgrade-deploy-command.ts` **312** (plan Hidden Scope + context-pack say 342 — wrong; research §8 says 312 — right), `build-windows-strategy.ts` **301**, `compile-runner.ts` **292**. F-1 is a real, enforced doctrine gate (existing arch-debt entries cite it). |
| `WindowsServicePort` is a public-surface rename | **OVERSTATED** | It is **not** on the published JSR surface: `@netscript/cli` `deno.json` exports are only `.`/`./scaffolding`/`./testing`, and the port is absent from the `public-api.ts` barrel. It is an internal-to-package type (folder-convention `public/`, not an export). See N1. |

Doctrine + reconciliation conformance: the 7-op contract, subset rule, verb-lock delegation to the
first real adapter, and the port-ownership decision were all read in the `deploy-s2` worktree and
the plan's citations are faithful.

---

## Adversarial checklist

**1. Port unification (LD-1 two-layer) — SOUND.** The plan genuinely *evolves* both shipped seams
into one: S1 renames the OS-lifecycle port → `OsServicePort`; S2 evolves `ServyCliAdapter` and
**folds the `runServy()` bypass** so all five lifecycle ops flow through the port; S4 routes commands
through the port; S7 evolves the `windows-service` stub → a real target adapter that *composes*
`OsServicePort` + compile, and adds `LinuxServiceDeployTarget`. No parallel third reimplementation;
no orphaned seam. The `runServy()` bypass is explicitly named and unified. Health-poll wait correctly
kept in the command layer. PASS.

**2. 7-op mapping — SOUND / clean subset.** `plan/emit·up·down·status·logs` implemented this slice;
`rollback`/`secrets` declared-**optional-unsupported** with the method surface present, bodies to
#341 (LD-4, A13 — never a silent no-op). Matches ARCHETYPE-7 R-DEPLOY-1 "subset allowed." The §7-Op
mapping table is explicit F-DEPLOY-1 evidence. PASS.

**3. Verb-lock + front-loading (LD-3) — PARTIAL → BLOCKING (see B1).** Canonical 7 op names on the
port with CLI verbs kept as aliases is coherent with reconciliation §3 and within supervisor
authority. **But** the port-ownership decision (§3) requires the port-contract expansion to land
**EARLY** as an independently-mergeable commit so #342/#343 can rebase and the p0 Deno Deploy marquee
is not serialized. The plan places the `DeployTargetOperation` → 7-op expansion (+ optional
`rollback?`/`secrets?` sigs on `DeployTargetPort`, + registry key reservation) in **S7 — the last
substantive slice**, bundled with the bare-metal realization. That re-serializes the siblings behind
the whole bare-metal slice — the exact harm the ownership note forbids. **Blocking.**

**4. Config + LD-2 clean break — SOUND (with accuracy note N1).** Linux member spreads the base
(composition, not a new base); Windows member already on main; `z.ZodType` annotation carries for the
new published `@netscript/config` `LinuxDeployTarget` type (the *genuine* published-surface change,
correctly scoped with slow-type handling). The `WindowsServicePort` rename is a clean break with all
importers in-repo — but it is an **internal** rename, not a JSR-surface event (N1).

**5. Archetype-7 conformance — SOUND.** Thin router preserved (no target logic in the command
surface; AP thin-router tracked; F-DEPLOY-2 import-graph evidence in S8); conventions centralized in
the core service-config layer shared by both adapters; one adapter per file (F-12); adapters behind
the stable port. PASS.

**6. File-size / lint headroom — SOUND with a gap (N3).** S5 (compile) and S6 (build-strategy)
explicitly **extract** rather than grow, and commit to `run-deno-lint.ts` per touched file. Gap:
`upgrade-deploy-command.ts` (**312**, already over a ~300 threshold) is only import-renamed by the
`WindowsServicePort` rename with **no extraction planned** — touching an already-over-ceiling file
can trip F-1. Confirm the ceiling / net-growth semantics or add an extraction. Non-blocking.

**7. Planning-only + slice quality — SOUND.** `worklog.md` records "Not run (planning-only)"; 11
slices S0–S10 (< 30), each `proves → gate → files`; F-DEPLOY-1/2 kept `reviewed` with manual mapping
evidence; no implementation started. PASS.

**8. Soundness — SOUND.** No unjustified `any`/casts designed in; contracts-first ordering (S0 config
schema, port before adapters); Validation Plan reproduces the right gates and **correctly defers
`scaffold.runtime` E2E to merge-readiness** (row 9) — the slice touches config-schema + CLI, so that
gate is rightly accounted for. PASS.

---

## Blocking finding

**B1 — Commit order contradicts the ratified port-ownership front-load decision.**
`port-ownership.md` §3 (supervisor decision this slice was told to ratify) mandates: *"#339/#340 must
land its port-contract commit EARLY in its S0→S10 order as an independently-mergeable unit, so
#342/#343 can rebase onto it quickly and the p0 Deno Deploy marquee is not serialized behind the full
bare-metal slice."* The plan places the `DeployTargetPort`/`DeployTargetOperation` 7-op expansion in
**S7** (bundled with the bare-metal adapter realization), i.e. behind S0–S6. Because #342 (Deno
Deploy) and #343 (Aspire) are **cloud** adapters that consume the 7-op `DeployTargetPort` contract +
registry (they do **not** use `OsServicePort` at all — that is bare-metal-only), the artifact they
must rebase onto is precisely the S7 contract expansion, now stranded at the end. This re-serializes
the siblings — the opposite of the decision.

**Required fix (surgical, no redesign):** Split S7. Carve a new **early, standalone,
independently-mergeable commit** (e.g. new S1, before or beside the `OsServicePort` rename) containing
only the *pure contract expansion*: `DeployTargetOperation` → the 7 canonical op names, the optional
`status?`/`logs?`/`rollback?`/`secrets?` method signatures on `DeployTargetPort`, the
`build→plan/emit · install→up · uninstall→down` verb-alias map, and the `linux` registry-key
reservation. This unit has no dependency on S0/S1–S6 (it is type-level + registry-shape only) and is
exactly what #342/#343 rebase onto. Leave the bare-metal *realization* (evolving the Windows stub to
delegate to `OsServicePort` + compile, adding `LinuxServiceDeployTarget`, wiring the registry entry)
in the later S7 slot where its S1–S6 dependencies belong. Update the commit-slice DAG + Dependencies
("Merge order: #357 → **port-expansion commit** → sibling adapters rebase") to match.

---

## Non-blocking Implement-phase fixes

- **N1 (accuracy).** `WindowsServicePort` is **not** on the published `@netscript/cli` surface
  (exports = `.`/`./scaffolding`/`./testing`; absent from the `public-api.ts` barrel). The rename is
  an internal-consumer update; the plan's "update `deno.json` exports" for the *port* is likely a
  no-op — do not fabricate an exports diff. The real published-surface change is the
  `@netscript/config` `LinuxDeployTarget` type (S0), which is correctly scoped. `deno doc --lint`
  (F-6) is still worth running on both packages, but scope the F-5/F-6 evidence to what actually
  publishes.
- **N2 (build-green sequencing).** The S1 clean rename must update **all in-repo importers in the
  same commit** or the build breaks mid-slice: `install-service-deploy.ts`, `uninstall-service-
  deploy.ts`, `public-command-dependencies.ts`, and `deploy_test.ts` (plus the `start`/`stop`/
  `status` command files once S2 folds `runServy` behind the port). S1's file list currently names
  only the port file + barrel + `deno.json`; add the importers.
- **N3 (F-1 on a touched-but-not-extracted file).** `upgrade-deploy-command.ts` is **312** lines
  (already over a ~300 threshold) and receives only an import rename with no extraction planned.
  Confirm F-1 semantics (hard ceiling vs net-growth) for touched files; if hard, add a small
  extraction so the rename does not trip F-1. Also fix the plan's stale "342" figure (actual 312;
  research §8 already has it right).
- **N4 (dispatch lane).** The plan's "implement via WSL Codex / PLAN-EVAL via OpenHands-minimax"
  next-steps are superseded by `port-ownership.md` §"Dispatch-lane correction": implementers = Opus
  4.8 sub-agents; evaluators = separate Opus session. Update `context-pack.md` §Next action + the
  worklog so the implementer does not follow the stale lane.

## NEEDS USER
None. The two potentially user-facing calls (LD-2 clean break, LD-3 verb lock) are covered by the
standing D5 clean-break grant and the reconciliation's delegation of the verb lock to this slice;
both are reversible. No product decision is pending.

---

result: FAIL_PLAN
- BLOCKING: B1 — front-load the `DeployTargetPort` 7-op contract expansion as an early,
  independently-mergeable commit (split it out of S7) per `port-ownership.md` §3, so #342/#343 rebase
  without serializing behind the bare-metal slice.
- Implement-phase (non-blocking): N1 port is internal-not-published (don't fake a deno.json exports
  diff); N2 S1 must rename all importers in one commit to stay green; N3 confirm F-1 on the 312-line
  `upgrade-deploy-command.ts` (import-rename only, no extraction); N4 correct the dispatch lane to
  Opus 4.8 sub-agents per the ownership override.
