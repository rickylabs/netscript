# Plan: bare-metal deploy targets (#339 S3 + #340 S4)

## Run Metadata

| Field          | Value                                             |
| -------------- | ------------------------------------------------- |
| Run ID         | `deploy-s3-baremetal`                             |
| Branch         | `feat/deploy-s3-baremetal`                        |
| Worktree       | `.claude/worktrees/deploy-s3`                     |
| Base           | `origin/main` @ `bf0113df`                        |
| Phase          | `plan` (Research → Plan & Design → Plan-Gate)     |
| Target         | `@netscript/cli` (+ `@netscript/config` schema)   |
| Archetype      | `7 — Deployment Target Adapter` (composite A2+A6) |
| Scope overlays | none (CLI package + service-shape adapters)       |

## Archetype

**Archetype 7 — Deployment Target Adapter** (composite: folds Archetype 2 port/adapter core +
Archetype 6 thin CLI router; folds neither's identity). This slice is the **first real bare-metal
adapter pair** for the epic. It stays **inside `packages/cli`** — the future `deploy-core` package
extraction is an explicitly later wave (`06-archetypes.md` L302-308, L353), so `OsServicePort`, its
adapters, and the bare-metal target adapters are **package-owned within `@netscript/cli`** for this
slice. The core satisfies Archetype 2 universal gates; the deploy command surface satisfies
Archetype 6 universal + F-CLI gates; F-DEPLOY-1/2 are additive.

## Current Doctrine Verdict

The Archetype 7 doctrine (chapter prose, `ARCHETYPE-7-*` harness file, `F-DEPLOY-1/2` seeds, the
op-contract reconciliation) is **settled and LOCKED** but lives in **PR #357 (draft, branch
`feat/deploy-s2-doctrine`) — not yet on `main`.** Treated as authoritative read-only reference. The
7-op contract (`plan`/`emit` · `up` · `down` · `status` · `logs` · `rollback` · `secrets`, subset
allowed) is not re-litigated. See Dependencies for #357 sequencing.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2  | The generalized `OsServicePort` boundary must stay *simple* — one narrow lifecycle seam both a servy and a systemd adapter satisfy, not a Windows-shaped interface with a Linux bolt-on. |
| A5  | `deploy.targets.linux` **spreads** `deployTargetBaseShape` (composition), never a per-target config base class; adapters compose the port, no `WindowsService*`→`LinuxService*` inheritance. |
| A7  | Wrap upstream: shell `servy-cli.exe` / `systemctl` / `journalctl` / `deno compile` via `ProcessPort`; do not reimplement service management or bundling. |
| A9  | Archetype 7 is the larger named pattern; A2 + A6 fold into it. Do not fragment the deploy feature across two archetypes. |
| A11 | The `OsServicePort` extension axis is **named = the OS/service-manager target**; a 2nd adapter (systemd) exists *in this slice*, so the seam is justified, not premature. |
| A13 | Crash boundaries explicit: activation is health-gated + paired with `rollback`. This slice **declares** the `rollback`/`secrets` op surface but leaves the bodies to #341 — the ops are declared-unsupported (subset), never silently a no-op. |

## Goal

Deliver the first bare-metal deploy-target adapter pair behind one uniform seam:

1. **#339** — Generalize the Windows-only `WindowsServicePort` → OS-agnostic **`OsServicePort`**;
   evolve the existing `ServyCliAdapter` into the Windows adapter and add a new **`SystemdAdapter`**
   (Linux); route the service lifecycle by host OS with **Windows behaviour unchanged**; unify the
   two current Windows call paths (the port for install/uninstall + the `runServy()` helper for
   start/stop/status) behind the single port.
2. **#340** — Adopt a **`deno compile` single-binary** bare-metal artifact: OS-generic cross-compile
   triple selection, `--include`/`--include-as-is` asset embedding, denort runtime; retire the dead
   `deno:2.5` pin and unused compile-config fragments; leave a documented manual-signing hook point.
3. **Conform to Archetype 7**: evolve the stub `WindowsServiceDeployTarget` (and add a
   `LinuxServiceDeployTarget` sibling) into real 7-op-contract target adapters that *delegate* to
   `OsServicePort` (up/down/status/logs) and the compile build (plan/emit); register both in the
   existing `DeployTargetRegistry`; keep the CLI command surface a thin router.

## Scope

- **Config** (`@netscript/config`): add `deploy.targets.linux` member — `LinuxDeployTargetSchema`
  (spreads `deployTargetBaseShape`, adds `systemctlPath`/`unitPrefix`/`installBase`/`user`/`group`/
  `runtimeDir`) + `LinuxDeployTarget` type; matching CLI deploy-config resolvers.
- **Port** (`@netscript/cli` public): `OsServicePort` + `OsServiceCommandResult` /
  `OsServiceInstallRequest` (generalize `windows-service-port.ts`). **Clean rename** of
  `WindowsServicePort` → `OsServicePort` (see LD-2).
- **Adapters** (one file per target): `ServyOsServiceAdapter` (Windows — evolves `ServyCliAdapter`,
  folds the `runServy` start/stop/status helper so all lifecycle flows through the port);
  `SystemdOsServiceAdapter` (Linux — new: renders a `.service` unit, `systemctl daemon-reload/enable/
  start/stop/status/disable`, `journalctl` logs).
- **Service-config emit**: split the servy-XML emit from the OS-neutral orchestrator; add a systemd
  unit-file renderer as the Linux analog (Type=simple/notify, `ExecStart`, `EnvironmentFile`,
  `WantedBy`, `Restart`, `WorkingDirectory`, `User`/`Group`).
- **Compile machinery** (#340): make triple selection + asset embedding + denort OS-generic; move
  `kernel/adapters/windows/compile/*` to an OS-neutral `…/deploy/compile/*`; retire `deno:2.5` pin +
  dead `docker`/`script` config fragments.
- **Routing/wiring**: resolve the `OsServicePort` adapter by host OS (and/or explicit
  `deploy.targets.<name>`) in `public-command-dependencies.ts`; commands consume the port.
- **Target adapters + registry** (Archetype 7 conformance): expand `DeployTargetOperation` to the
  canonical **7 ops**; evolve `WindowsServiceDeployTarget` (stub → real) + add
  `LinuxServiceDeployTarget`; register `linux` in `DeployTargetRegistry`.
- **Tests**: systemd unit rendering; servy path regression (Windows unchanged); OS-routing; a smoke
  `deno compile`; F-DEPLOY-1 subset-declaration assertion.

## Non-Scope

- **rollback + health-gate + `OTEL_DENO` + env-file secrets = #341 (S5).** This slice **declares**
  the `rollback?`/`secrets?` op surface on the target-adapter contract (so #341 fills bodies with no
  contract change) but implements **neither**. The existing `start` health-check *wait* is preserved
  in the command layer as-is; the doctrinal **health-gated activation** primitive is #341.
- Multi-instance/HA, external secret store, automated signing = #345 (S9, stable).
- Deno Deploy adapter = #342 (S6). Aspire Docker/Compose = #343 (S7). Cloud adapters generally.
- No `deploy-core` package extraction (later wave).
- No change to `deploy.targets.windows` semantics beyond re-seating behind the port.

## Hidden Scope

- **Two Windows call paths must be unified.** start/stop/status today call `runServy()` in
  `kernel/adapters/deploy/commands/servy-command.ts` directly, **not** the port; only install/
  uninstall use `WindowsServicePort`. Generalization must route *all five* lifecycle ops through
  `OsServicePort` or the Windows/Linux behaviours will diverge. Keep the health-poll wait in the
  command layer, not the port.
- **File-size (F-1) — comfortable headroom.** The gate **flags >500 LOC and fails >800**
  (`09-anti-patterns…` §F-1). The largest files this slice touches — `upgrade-deploy-command.ts`
  (**312**, import-rename only), `build-windows-strategy.ts` (301), `compile-runner.ts` (292) — are
  all well under the 500 flag. The ~300-line "two screenfuls" figure is a **soft guideline**, not
  the gate. Extraction in S6/S7 is hygiene against that guideline, **not** an F-1 requirement, and
  the `upgrade` import-rename needs **no extraction** (N3).
- **Internal rename, not a JSR event (N1).** `WindowsServicePort` is **not** on the published
  `@netscript/cli` surface (exports = `.`/`./scaffolding`/`./testing`; absent from the `public-api.ts`
  barrel). The rename is an **internal-consumer update** — no `deno.json` exports diff for the port.
  All ~4-6 in-repo importers must be renamed in the **same commit** (S2) to stay green. The genuine
  published-surface change is the `@netscript/config` `LinuxDeployTarget` type (S1). `deno doc --lint`
  (F-6) still runs on both packages, scoped to what actually publishes.
- **Windows-only constants** in `kernel/constants/windows.ts` (servy path, `NetScript.*` naming,
  startup-type/priority enums, V8 `--single-threaded`/`--no-sparkplug`) need OS-neutral
  counterparts or a Linux constants sibling.
- **Cross-compile reality:** a Linux-triple binary cannot *run* on a Windows CI host; the smoke
  proves the compile *command/config* is well-formed for the target, not host execution.

## Locked Decisions

| ID   | Decision | Rationale |
| ---- | -------- | --------- |
| LD-1 | Two-layer architecture: **`OsServicePort`** = low-level OS service-lifecycle seam (install/start/stop/status/uninstall/logs); the **bare-metal `DeployTargetPort` target adapters** implement the 7-op contract by *composing* `OsServicePort` (up/down/status/logs) + the compile build (plan/emit). | Cleanly reconciles the two seams that ship on main today; satisfies "evolve the stub, not a parallel reimplementation"; keeps the registry/router seam intact. |
| LD-2 | **Clean rename** `WindowsServicePort` → `OsServicePort` (no deprecated shim). | Repo is alpha; D5 established clean breaks are allowed. A shim is dead weight and violates A2 (simple boundary). All consumers are in-repo and updated in the same slice. |
| LD-3 | Expand `DeployTargetOperation` to the **canonical 7 op names** (`plan`/`emit`,`up`,`down`,`status`,`logs`,`rollback`,`secrets`); map the seed `build→plan/emit`, `install→up`, `uninstall→down`. **Keep the existing CLI command names** (`build`/`install`/`start`/`stop`/`status`/`logs`/`uninstall`/`upgrade`) as thin-router aliases. | Reconciliation §3 defers the verb-vocab lock to the first real adapter = this slice. Locking op names at the *port* while keeping CLI verbs = F-DEPLOY-1 conformance with **zero CLI-UX churn / no rework**. |
| LD-4 | `rollback?` + `secrets?` declared **optional** on the target-adapter contract and reported as an explicit **declared-unsupported subset** this slice; bodies land in #341. | ARCHETYPE-7 subset rule (adapters implement the subset they support); A13 (declared, never a silent no-op); avoids a contract change in #341. |
| LD-5 | `deploy.targets.linux` config member **spreads** `deployTargetBaseShape`; `SystemdAdapter` composes `ProcessPort`. No config base-class hierarchy, no `WindowsService*→LinuxService*` inheritance. | R-DEPLOY-4 / A5. Mirrors the shipped `WindowsDeployTargetSchema` spread pattern. |
| LD-6 | Bare-metal deploy code stays **inside `packages/cli`**; no `deploy-core` extraction. | Doctrine defers extraction to a later wave; premature extraction would balloon this slice and risk the epic critical path. |
| LD-7 | `OsServicePort` adapter is resolved by **host OS** (`Deno.build.os`), overridable by explicit config target; Windows resolves to `ServyOsServiceAdapter` with byte-identical servy invocations. | Epic #339 acceptance: "routes by host OS; Windows behaviour unchanged." |
| LD-8 | Move `kernel/adapters/windows/compile/*` → OS-neutral `kernel/adapters/deploy/compile/*`; keep servy-specific emit under a `windows/` sibling and add `linux/systemd/*`. | Compile is already cross-platform (deno compile); only the *service-config emit* is OS-specific. Keeps one-adapter-per-file + F-3 layering. |
| LD-9 | **Front-load the port-contract expansion (S0)** as a pure type-level, independently-mergeable commit — the **rebase point for #342/#343**. Bare-metal *realization* (S8) stays late. | Ratifies `port-ownership.md` §3: #339/#340 OWNS the port contract; siblings CONSUME it and must not be serialized behind the bare-metal slice. Merge order: #357 → S0 port-expansion → siblings rebase. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Verb-vocabulary lock (port op names) | **resolved now** → LD-3 | Would force rework in #342/#341 if deferred; resolved within supervisor authority (reconciliation §3 delegates it here). Reversible. |
| `WindowsServicePort` fate (rename vs shim) | **resolved now** → LD-2 | Public-surface-defining; deferring forces a later break. Covered by the standing D5 clean-break grant. |
| Whether to rewire live commands through the target-adapter layer | **resolved now** → LD-1 | Scope-defining. Chosen: commands keep their names + orchestration but resolve lifecycle via `OsServicePort`; the target adapters wrap the same primitives for registry/router conformance. Avoids touching the 312-L upgrade orchestration. |
| Port-contract expansion commit ordering (front-load vs bundled) | **resolved now** → LD-9 | PLAN-EVAL B1: bundling it in S8 would serialize #342/#343 behind the bare-metal slice. Carved out as S0, first + independently mergeable. |
| systemd `rollback`/health-gate seam | **safe to defer bodies** → LD-4 | Op *surface* declared now (optional); bodies are #341. No rework: #341 fills methods without a contract change. |
| PR #357 (doctrine + F-DEPLOY gates) not yet on `main` | **resolved now (sequencing)** | See Dependencies: land/coordinate after #357 so gates + Archetype-7 file are on `main`; the contract is already frozen, so design does not block on it. |
| Cross-triple smoke depth | **safe to defer** | Smoke validates compile command/config for the target triple; live Linux execution is a manual/out-of-CI step (documented). |

> No `NEEDS USER:` items. The two potentially user-facing calls (LD-2 clean break, LD-3 verb lock)
> are covered by the standing D5 clean-break grant + the reconciliation's delegation of the verb
> lock to this slice; both are reversible. Flagged for PLAN-EVAL visibility, not blocking.

## 7-Op Contract Mapping (bare-metal target — F-DEPLOY-1 evidence)

| Op | This-slice implementation | In scope? |
| -- | ------------------------- | --------- |
| `plan`/`emit` | `deno compile` single-binary artifact (OS-generic triple, `--include`/`--include-as-is`, denort) + service-config emit (servy XML / systemd unit) | **Yes (#340)** |
| `up` | `OsServicePort` install + enable + start (servy install / `systemctl enable+start`) | **Yes (#339)** |
| `down` | `OsServicePort` stop + disable + uninstall (servy uninstall / `systemctl stop+disable` + unit removal) | **Yes (#339)** |
| `status` | `OsServicePort` status (servy status parse / `systemctl status`) | **Yes (#339)** |
| `logs` | servy log-file tail / `journalctl -u` | **Yes (#339)** |
| `rollback` | **declared-unsupported subset** — optional method present, body deferred | **No → #341** |
| `secrets` | **declared-unsupported subset** — optional method present, body deferred | **No → #341** |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Renaming `WindowsServicePort` breaks in-repo consumers mid-slice (build red). | N2: rename **all** importers in the same S2 commit (`install-service-deploy.ts`, `uninstall-service-deploy.ts`, `public-command-dependencies.ts`, `deploy_test.ts`, + start/stop/status once S3 folds `runServy`); `deno check` must be green at S2 close. It is an **internal** rename (N1) — no JSR exports diff. |
| Unifying the two Windows call paths (port vs `runServy` helper) subtly changes start/stop/status. | Keep health-poll wait in the command layer; adapter only wraps the *identical* `servy-cli` args; add a servy-path regression test asserting arg strings unchanged. |
| File-size lint (F-1). | Low risk: F-1 flags >500 / fails >800; all touched files ≤ 312. Extraction (S6/S7) is optional hygiene for the ~300 soft guideline; verify via `run-deno-lint.ts` per slice regardless. |
| systemd/`systemctl` unavailable (or needs root) in CI. | Adapter tests validate **unit rendering + `systemctl` arg construction**, not live activation; live systemd is a documented manual/out-of-CI verification. |
| Cross-compiling a Linux binary on a Windows host can't be run to prove it works. | Smoke asserts the compile command/config is well-formed for the target triple; artifact execution documented as target-host manual step. |
| PR #357 not merged → `F-DEPLOY-*` gates + Archetype-7 file absent on `main`; IMPL-EVAL can't cite them. | Sequence this slice to land after/with #357; report F-DEPLOY-1/2 as `reviewed` with manual evidence (the 7-op mapping table) until promoted. |
| Config drift: `deploy.targets.linux` must round-trip through CLI deploy-config resolvers + JSON schema asset. | S0 updates `config-file.v1.json` asset + resolvers; add a config parse/round-trip test. |
| Scope creep into #341 (rollback/secrets tempting to "just add"). | LD-4 hard boundary: declare surface only; any body = drift → `drift.md` + stop. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-11 (target-specific base class / premature port) | risk | Avoid: `OsServicePort` justified by 2 adapters *in this slice*; adapters compose, no inheritance (LD-5). |
| Thin-router violation (R-DEPLOY-2 / F-DEPLOY-2) | risk | Keep target logic in adapters/core; the deploy command surface only parses + routes by OS/target. |
| Convention duplication (R-DEPLOY-3) | risk | health/log/env-emit conventions centralized in the core service-config layer, shared by both adapters — not re-implemented per OS. (Full health-gate/secrets centralization completes in #341.) |
| Config base-class hierarchy (R-DEPLOY-4) | avoid | `deploy.targets.linux` spreads `deployTargetBaseShape` (LD-5). |
| `cli-deploy-artifacts-missing` (existing debt) | existing | Not closed here; note progress (bare-metal artifact now first-class) but the entry's gate (generated Docker/compose/k8s) is #343/#346. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-1 File-size lint | yes | Flags >500 / fails >800; all touched files ≤ 312 → comfortably passing. `run-deno-lint.ts` over touched files each slice. |
| F-2 Helper-reinvention | yes | Reuse `ProcessPort`, `@std/path`, existing compile/manifest helpers; no re-rolled service mgmt. |
| F-3 Layering | yes | ports ← adapters ← application; no domain→adapter leak; compile move preserves layering. |
| F-4 Inheritance audit | yes | No new abstract/base classes; adapters implement the port directly. |
| F-5 Public surface audit | yes | New types explicitly annotated. **Genuine published-surface change = `@netscript/config` `LinuxDeployTarget`** (S1); `OsServicePort` is internal-to-`@netscript/cli` (N1) — no exports diff, but annotate cleanly. |
| F-6 JSR publishability | yes | `deno doc --lint` on `@netscript/cli` + `@netscript/config`; `publish:dry-run`. Scope evidence to what actually publishes (N1). |
| F-9 Permission decl | yes | New systemctl/journalctl `ProcessPort` calls need `--allow-run`; declare in manifests. |
| F-10 Test-shape | yes | Unit tests colocated; systemd rendering, servy regression, routing, subset-declaration. |
| F-12 Naming-convention | yes | `os-service-port.ts`, `servy-os-service.ts`, `systemd-os-service.ts`, one adapter per file. |
| F-14 Console-log lint | yes | Route output through existing display helpers, not raw `console.*` in core. |
| F-15/F-16/F-17/F-18 | yes | Re-export/cardinality/co-location/sub-barrel lints on the new files. |
| F-CLI-* (router) | yes | Deploy command surface stays a thin router; run the F-CLI subset touching deploy. |
| **F-DEPLOY-1** | yes (`reviewed`) | 7-op mapping table above + registry scan: both bare-metal target adapters declare the 7-op contract, implement the plan/up/down/status/logs subset, `rollback`/`secrets` declared-unsupported. |
| **F-DEPLOY-2** | yes (`reviewed`) | Import-graph/AST: no target-specific business logic in the deploy command surface; conventions (service-config emit, health, env) live in the core. |
| jsr-audit | yes | Applied to planned surface (research §jsr-audit); slow-type risks named; re-check pre-merge. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| deployment core-centralization / F-DEPLOY seed (`#338 Slice 3`, in #357/deploy-s2) | update | Record: seed 3-op `DeployTargetPort` **expanded to 7-op canonical** at this slice; `windows-service` stub **evolved to real** + `linux` added; `rollback`/`secrets` deferred to #341. Closing gate `F-DEPLOY-1`→`gated` moves closer. |
| `packages/cli — cli-deploy-artifacts-missing` | update (not close) | Bare-metal `deno compile` artifact now first-class; entry's gate (generated Docker/compose/k8s) remains #343/#346. |
| `windows-service` verb-vocab lock | close/record | Reconciliation §3's deferred verb lock is resolved by LD-3; record the resolution. |
| (new, if needed) systemd live-activation not CI-covered | create | Note that live `systemctl` activation is manual/out-of-CI; adapter tests cover rendering + arg construction only. |

## Commit-Slice List

Each slice: proves → gate → files. Ordered; DAG noted. `< 30` slices.

> **B1 front-load (PLAN-EVAL):** S0 is the **pure type-level port-contract expansion**, carved out
> of the old S7 and placed **first** as an independently-mergeable unit. It is the **rebase point for
> #342 (Deno Deploy, p0) and #343 (Aspire)** — they consume the 7-op `DeployTargetPort` and must not
> be serialized behind the bare-metal realization. It has **no dependency** on config (S1) or the
> `OsServicePort` rename (S2): it is type-level + registry-shape only, no bare-metal bodies. The
> bare-metal *realization* stays late (S8).

1. **S0 port-contract expansion (7-op `DeployTargetPort`) — REBASE POINT for #342/#343** — pure
   type-level: expand `DeployTargetOperation` → the 7 canonical op names (`plan`/`emit`,`up`,`down`,
   `status`,`logs`,`rollback`,`secrets`); add the optional op method signatures (`plan?`/`up?`/
   `down?`/`status?`/`logs?`/`rollback?`/`secrets?`) + their request/result types on
   `DeployTargetPort`; record the `build→plan/emit · install→up · uninstall→down` verb-alias map in
   JSDoc; reserve the `linux` key in the registry *shape/type* (no `linux` adapter registered yet —
   that is S8). **No bare-metal bodies, no `OsServicePort`, no config.** Independently mergeable.
   *Proves:* F-DEPLOY-1 contract shape (AST); `deno check` compiles; registry type accepts the
   reserved key. *Files:* `kernel/domain/deploy/deploy-target-port.ts`, `…/deploy-target-registry-port.ts`, `*_test.ts`.
2. **S1 config: `deploy.targets.linux`** — add `LinuxDeployTargetSchema` (spread base) + `LinuxDeployTarget` type + CLI deploy-config resolver + `config-file.v1.json` asset; round-trip test. *Proves:* F-3/F-5, config parse. *Files:* `packages/config/src/domain/schemas/deploy-schema.ts`, `…/config-section-types.ts`, `…/public/mod.ts`; `packages/cli/src/kernel/adapters/config/deploy-config-*.ts`; `packages/cli/assets/schema/config-file.v1.json`; `*_test.ts`.
3. **S2 port: `OsServicePort`** — generalize `windows-service-port.ts` → `os-service-port.ts` (`OsServicePort`, `OsServiceCommandResult`, `OsServiceInstallRequest`); clean-rename (LD-2). **Update ALL in-repo importers in the SAME commit to stay green (N2):** `public/features/deploy/install/install-service-deploy.ts`, `…/uninstall/uninstall-service-deploy.ts`, `public/features/root/public-command-dependencies.ts`, `public/features/deploy/build/deploy_test.ts`, plus the `public-api.ts` folder-barrel if referenced. *Proves:* `deno check` green; F-6 `deno doc --lint`. *Files:* `public/ports/os-service-port.ts` (+ remove old), the importers above. **N1: `WindowsServicePort` is internal — not on the JSR exports (`.`/`./scaffolding`/`./testing`); no `deno.json` exports diff for the port.**
4. **S3 Windows adapter: `ServyOsServiceAdapter`** — evolve `servy-cli.ts` to implement `OsServicePort`; fold the `runServy` start/stop/status helper so all lifecycle flows through the port; byte-identical servy args. *Proves:* servy-path regression test (args unchanged). *Files:* `public/adapters/servy-os-service.ts`, `kernel/adapters/deploy/commands/servy-command.ts`, `*_test.ts`.
5. **S4 Linux adapter: `SystemdOsServiceAdapter` + unit renderer** — `systemd-unit.ts` (render `.service`), `systemd-command.ts` (`systemctl`/`journalctl` args), `systemd-os-service.ts` (adapter). *Proves:* F-10 unit-rendering + arg-construction tests. *Files:* `kernel/adapters/linux/systemd/*`, `kernel/constants/linux.ts`, `*_test.ts`.
6. **S5 OS routing/wiring** — resolve `OsServicePort` by `Deno.build.os` (+ explicit target) in `public-command-dependencies.ts`; start/stop/status/install/uninstall consume the port; Windows unchanged. *Proves:* routing test; Windows regression. *Files:* `public/features/root/public-command-dependencies.ts`, `public/features/deploy/{start,stop,status,install,uninstall}/*`, `kernel/adapters/deploy/runtime-detect.ts`.
7. **S6 compile generalization (#340)** — move `kernel/adapters/windows/compile/*` → `kernel/adapters/deploy/compile/*`; OS-generic triple + `--include`/`--include-as-is` + denort; retire `deno:2.5` pin + dead `docker`/`script` config. *Proves:* smoke `deno compile` for host triple. *Files:* `kernel/adapters/deploy/compile/*`, `kernel/domain/deploy/compile-target.ts`, `kernel/constants/*`.
8. **S7 build-strategy generalization** — split `build-windows-strategy.ts` (301 L) into an OS-neutral orchestrator + per-OS service-config emit (servy XML vs systemd unit). Extraction is hygiene for the ~300 soft guideline; **F-1 flags >500 / fails >800, so no file here is near the gate.** *Proves:* build emits artifacts for both OS shapes; F-3. *Files:* `public/features/deploy/build/*`, `kernel/adapters/windows/servy/*`, `kernel/adapters/linux/systemd/*`.
9. **S8 bare-metal realization + registry (Archetype 7)** — evolve `WindowsServiceDeployTarget` stub → real (delegates to `OsServicePort` + compile for `plan/up/down/status/logs`); add `LinuxServiceDeployTarget`; leave `rollback?`/`secrets?` declared-unsupported (LD-4, bodies → #341); **register `linux` in `DeployTargetRegistry`** (the S0 shape is now filled with a real adapter). *Proves:* F-DEPLOY-1 (registry scan + subset-declaration test). *Files:* `kernel/domain/deploy/windows-service-deploy-target.ts`, `…/linux-service-deploy-target.ts`, `kernel/application/registries/deploy-target-registry.ts`, `*_test.ts`.
10. **S9 tests + F-DEPLOY-2 evidence** — fill gaps: subset-declaration assertion, thin-router import-graph check, OS-routing e2e-lite. *Proves:* F-10, F-DEPLOY-2. *Files:* `*_test.ts` across the above.
11. **S10 docs + arch-debt** — `@netscript/cli` README/JSDoc for the OS-agnostic port + systemd target + `deno compile` artifact + documented manual-signing hook; update arch-debt entries (see table). *Proves:* F-7 doc-score; debt registry accurate. *Files:* `packages/cli/README.md`, module JSDoc, `.llm/harness/debt/arch-debt.md`.
12. **S11 validation sweep** — `deno task check` (`--unstable-kv`), scoped lint/fmt, `publish:dry-run`, targeted deploy tests; record in `worklog.md`. *Proves:* all required gates green pre-IMPL-EVAL. *Files:* none (gate pass).

## Validation Plan

| Order | Gate | Command or check | Expected |
| ----- | ---- | ---------------- | -------- |
| 1 | check | `deno run … .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` (+ `--unstable-kv`) and `--root packages/config` | 0 errors |
| 2 | lint (incl F-1) | `deno run … .llm/tools/run-deno-lint.ts --root packages/cli --ext ts` | 0 violations; touched files under size ceiling |
| 3 | fmt | `deno run … .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | clean |
| 4 | F-6 publishability | `deno doc --lint` on changed `@netscript/cli`/`@netscript/config` modules; `deno task publish:dry-run` | passes |
| 5 | unit tests | `deno test` for systemd rendering, servy regression, routing, target-adapter subset | green |
| 6 | smoke compile | build one target for the host triple via the generalized compile path | binary produced |
| 7 | F-DEPLOY-1/2 | manual: 7-op mapping table + registry scan + thin-router import graph | `reviewed` PASS |
| 8 | arch:check | `deno task arch:check` | passes |
| 9 | (merge-readiness, expensive — eval pass only) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | passes |

## Dependencies

- **#337 (S1) config contract** — **MERGED on `main`** (`DeployTargetBaseSchema` +
  `deploy.targets.windows`). This slice adds the `linux` sibling. Satisfied.
- **#338 (S2) doctrine — PR #357, DRAFT, not on `main`.** Provides the Archetype-7 chapter, the
  `ARCHETYPE-7-*` harness file, and the `F-DEPLOY-1/2` seeds this plan cites. **Sequencing:** land or
  coordinate this slice **after #357** so gates + doctrine are on `main`; the 7-op contract is
  already frozen, so *design* does not block on it. If #357 is still open at implementation time,
  report F-DEPLOY-1/2 as `reviewed` with the mapping-table manual evidence.
- **#340 (S4)** is co-planned here with #339 (S3) as one bare-metal slice (both feed #341).
- **Merge order (port-ownership §3):** **#357 (doctrine) → S0 port-expansion commit → #342/#343
  rebase.** #339/#340 OWNS the port contract; **#342 (Deno Deploy, p0) + #343 (Aspire) CONSUME** the
  7-op `DeployTargetPort` and rebase onto the S0 commit — they do **not** use `OsServicePort`
  (bare-metal-only). Front-loading S0 keeps the p0 marquee un-serialized.
- **Downstream:** **#341 (S5)** rollback/health-gate/OTEL/secrets consumes this slice's declared
  `rollback?`/`secrets?` surface + the `deno compile` + adapter lane — **out of scope here.**
- **Toolchain:** Deno 2.9; `deno compile` denort cross-compile triples; `servy-cli.exe` (Windows,
  external); `systemctl`/`journalctl` (Linux, external, `--allow-run`).
- **Process (dispatch lane — port-ownership §"Dispatch-lane correction"):** implementers =
  **Opus 4.8 sub-agents** (WSL Codex is dropped for the deployment epic); evaluators = **separate
  Opus session** (or Codex GPT-5.5 when reachable). PLAN-EVAL runs before any implementation.

## Drift Watch

- If `origin/main` advances the deploy tree (esp. `packages/cli/src/**/deploy`, `constants/windows.ts`,
  or `deploy-schema.ts`) before implementation — re-baseline.
- If PR #357 merges/renames the Archetype-7 file or gate IDs — reconcile gate citations.
- If the file-size ceiling can't be held by extraction (build-strategy/upgrade) — log as drift and
  consider a dedicated extraction sub-slice.
- If unifying the two Windows call paths changes start/stop health-wait behaviour — log to `drift.md`.
- Any temptation to implement rollback/secrets bodies (=#341) — hard stop, log drift.
