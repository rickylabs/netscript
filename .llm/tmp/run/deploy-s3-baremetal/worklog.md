# Worklog — deploy-s3-baremetal (#339 + #340)

## Design checkpoint (Plan & Design complete — awaiting PLAN-EVAL)

- **Phase:** Research → Plan & Design DONE; Plan-Gate PENDING (PLAN-EVAL, separate session,
  OpenHands/minimax M3). **No implementation may begin before PASS.**
- **Archetype:** 7 (composite A2+A6), package-owned in `@netscript/cli`.
- **Slice:** #339 (S3 `OsServicePort` + `SystemdAdapter`) + #340 (S4 `deno compile` bare-metal
  artifact), planned as one coherent bare-metal slice. #341 (S5 hardening) explicitly out of scope.
- **Contract:** 7-op canonical, LOCKED from PR #357/deploy-s2 (read-only). This slice implements the
  `plan/up/down/status/logs` subset for the bare-metal target; `rollback`/`secrets` declared-
  unsupported (→ #341).
- **Key architecture:** two layers — `OsServicePort` (OS service-lifecycle seam; servy + systemd
  adapters) and the bare-metal `DeployTargetPort` target adapters (evolve the `windows-service` stub,
  add `linux`) that compose the port + compile build for 7-op conformance. See `plan.md` LD-1..LD-8.
- **Design decisions locked:** LD-1..LD-8 (plan.md). No `NEEDS USER:` items.
- **Artifacts:** `research.md`, `plan.md` written. `context-pack.md` for resume.
- **Base:** `origin/main` @ `bf0113df`. Worktree `.claude/worktrees/deploy-s3`, branch
  `feat/deploy-s3-baremetal`.

## PLAN-EVAL cycle

- **v1** (commit `94c332e3`): **FAIL_PLAN**. Blocking **B1** — the `DeployTargetPort` 3-op→7-op
  contract expansion was bundled in the last substantive slice (old S7), not front-loaded, which
  would serialize the sibling cloud adapters #342/#343 behind the whole bare-metal slice. Non-blocking
  N1–N4 (internal-not-published port; importer-rename-in-one-commit; F-1 headroom; Opus dispatch lane).
- **v2** (this revision): applied surgically —
  - **B1:** carved the pure type-level port-contract expansion into a new **S0** (first slice,
    independently mergeable, the **rebase point for #342/#343**); bare-metal realization stays late
    (S8). Slices renumbered S0→S11; LD-9 + merge-order added.
  - **N1:** corrected `WindowsServicePort` framing to internal (not on `@netscript/cli` JSR exports);
    no fabricated `deno.json` exports diff; genuine published change = `@netscript/config`
    `LinuxDeployTarget`.
  - **N2:** S2 renames all in-repo importers in the same commit (listed in the slice).
  - **N3:** F-1 is flag >500 / fail >800 → `upgrade-deploy-command.ts` (312) is comfortably under;
    import-rename only, no extraction; fixed the stale "342" figures.
  - **N4:** dispatch lane corrected to Opus 4.8 sub-agents (WSL Codex dropped for this epic).
  - Awaiting re-run of PLAN-EVAL.

## Gate results

- Planning phase: not run (planning-only).

### S0 — DeployTargetPort 7-op contract (commit `12d70ff0`, REBASE POINT, pushed first)

- `deno check` packages/cli: 0 errors (538 files). fmt: clean (scratch config, cli excluded from
  root fmt/lint by design). tests: 8/8 (4 new `deploy-target-port_test.ts` + 4 untouched
  `command-registry_test.ts` incl. the legacy `['build','install','uninstall']` assertion — stays
  green under additive union expansion, IMPL-1 satisfied).

### S1 — config `deploy.targets.linux` (this slice)

- Added `LinuxDeployTarget` type + `LinuxDeployTargetSchema` (spreads `deployTargetBaseShape`,
  LD-5), wired `linux` sibling into `DeployConfig.targets` / `DeployConfigSchema`, exported both
  from `@netscript/config` public `mod.ts`. Added `ResolvedLinuxDeployConfig` +
  `resolveLinuxDeploy` CLI resolver (Linux-sensible defaults; honors overrides).
- Round-trip tests: `packages/config/tests/schema/deploy_schema_test.ts` (3) +
  `packages/cli/.../deploy-config-resolvers_test.ts` (2) → **5 passed / 0 failed**.
- Gates: config `deno check` 0 (34 files); cli `deno check` 0 (539 files); config `deno lint` 0;
  config `deno fmt --check` 0 findings (config IS lint/fmt-gated, unlike cli).
- Drift: D1 (config-file.v1.json is vendored Deno schema, no `deploy.targets` — asset entry
  correctly omitted), D2 (resolved base-config duplication deferred to S7). See `drift.md`.

### S2 — port `OsServicePort` clean rename (LD-2, N1/N2, IMPL-2)

- Renamed `public/ports/windows-service-port.ts` → `os-service-port.ts`; types
  `WindowsService{Port,CommandResult,InstallRequest,Operation}` → `OsService*`. Clean break, no
  deprecated shim (LD-2). Internal surface — not on `@netscript/cli` JSR exports, no `deno.json`
  exports diff (N1).
- Updated ALL in-repo importers in this one commit (N2): `adapters/servy-cli.ts` (IMPL-2 — type
  refs; class stays `ServyCliAdapter`, evolves at S3), `features/deploy/install/
  install-service-deploy.ts`, `.../uninstall/uninstall-service-deploy.ts`,
  `features/deploy/build/deploy_test.ts` (incl. `RecordingWindowsServicePort` →
  `RecordingOsServicePort`). `public-command-dependencies.ts` imports the concrete `ServyCliAdapter`
  (name unchanged) so needed no S2 edit.
- Gates: cli `deno check` 0 (539 files); `deploy_test.ts` 4/4 steps incl. the "maps Windows service
  operations to servy-cli invocations" regression (servy args byte-identical).

### S3 — `ServyOsServiceAdapter` evolution + servy arg-fold (LD-1/LD-7, F-12)

- Renamed `public/adapters/servy-cli.ts` → `servy-os-service.ts`; class `ServyCliAdapter` →
  `ServyOsServiceAdapter` (+ `ServyOsServiceAdapterOptions`). Clean break, no shim (LD-2). Concrete
  importers updated in the same commit: `public-command-dependencies.ts` (import + field type +
  construction), `deploy_test.ts`.
- Folded servy argument construction into shared builders in `servy-command.ts`: added
  `servyInstallArgs` (structurally typed, no kernel→public import) alongside the existing
  `servyLifecycleArgs`. The adapter now composes both — single source of truth for servy args, so
  port-driven and command-layer invocations are byte-identical.
- Expanded the servy-path regression test in `deploy_test.ts` to the full lifecycle matrix
  (install +--force, install w/o force, start/stop/status/uninstall) — locks the byte-identical
  guarantee after the fold.
- Drift **D3**: the `runServy` *execution* free function is still consumed by the start/stop/status
  commands + `upgrade-steps.ts`; routing those through the adapter is S5's command-wiring slice, so
  S3 unifies the arg source-of-truth only and defers execution convergence to S5. See `drift.md`.
- Gates: cli `deno check` 0 (539 files); `deploy_test.ts` 4/4 steps green (expanded servy matrix).
