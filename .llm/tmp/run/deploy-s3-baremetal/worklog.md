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

### S4 — Linux adapter: `SystemdOsServiceAdapter` + unit renderer (F-10)

- New `kernel/constants/linux.ts` — canonical Linux defaults home mirroring `constants/windows.ts`
  (systemctl/journalctl paths, compile triple, unit prefix, install base, runtime dir, systemd
  `[Unit]`/`[Service]`/`[Install]` defaults).
- New `kernel/adapters/linux/systemd/systemd-unit.ts` — `SystemdUnitConfig` + `renderSystemdUnit`
  producing a well-formed `.service` unit (Linux analogue of `servy-xml.ts`); Environment values
  escaped for systemd's quote/backslash parser; User/Group/RuntimeDirectory emitted only when set.
- New `kernel/adapters/linux/systemd/systemd-command.ts` — the single systemctl/journalctl arg
  source of truth: `fullUnitName`, `systemctlLifecycleArgs`, `systemctlEnableArgs` (+`--force`),
  `systemctlDisableArgs`, `systemctlDaemonReloadArgs`, `journalctlLogsArgs`.
- New `public/adapters/systemd-os-service.ts` — `SystemdOsServiceAdapter implements OsServicePort`
  (placed in `public/adapters` for layer symmetry, see drift D4): `install` = daemon-reload → enable
  (fail-fast), `run` maps start/stop/status → lifecycle args and uninstall → disable.
- Tests: `kernel/.../systemd/systemd_test.ts` (renderer + arg builders) and
  `public/adapters/systemd-os-service_test.ts` (adapter, RecordingProcessPort, byte-identical
  systemctl matrix + reload fail-fast) → **3 suites / 12 steps green**.
- Gates: cli `deno check` 0 (545 files). Drift D4 (adapter dir), D5 (Linux const dup → S5/S7).

### S5 — OS routing/wiring: converge lifecycle onto `OsServicePort` (LD-1/LD-3, D3 convergence)

- New `kernel/adapters/deploy/runtime-detect.ts` (pure kernel): `ServiceOs` type,
  `detectServiceOs(explicit?)` (explicit wins, else host → windows/linux), `fullServiceNameForOs`
  (windows `NetScript.<svc>` / linux `netscript-<svc>.service`), `serviceConfigFileName` +
  `serviceConfigPath` (windows `.xml` / linux `.service`). Single OS-naming source of truth shared by
  the install/uninstall flows.
- New `public/adapters/os-service-factory.ts`: `createOsServicePort(os, { process, servyCliPath?,
  systemctlPath? })` → `ServyOsServiceAdapter` (windows) / `SystemdOsServiceAdapter` (linux). Lives in
  `public/adapters` (constructs public adapters — layer symmetry, D4).
- `public-command-dependencies.ts`: field `windowsServices: ServyOsServiceAdapter` →
  `osServices: OsServicePort`, built via `createOsServicePort(detectServiceOs(), { process })`.
  `deploy-group.ts` install/uninstall wiring updated to `dependencies.osServices`.
- `install-service-deploy.ts` / `uninstall-service-deploy.ts`: added optional `os?: ServiceOs`
  (default `detectServiceOs()`); replaced the Windows-hardcoded `NetScript.<svc>` + `.xml` naming with
  `fullServiceNameForOs` + `serviceConfigPath`. Windows behaviour unchanged when `os` omitted on a
  Windows host.
- `start`/`stop`/`status-deploy-command.ts`: execution converged onto the port
  (`createOsServicePort('windows', { process: new DenoProcess(), servyCliPath: servy.path })` →
  `port.run(op, name)`), replacing the raw `runServy` free function (D3 resolved for the command
  layer). Guard + servy-tuned output parsing retained deliberately (drift D6); `runServy` stays only
  for `upgrade-steps.ts`.
- Tests: new `runtime-detect_test.ts` (5 steps); `deploy_test.ts` gains a Linux-routing install case
  and pins the existing Windows cases to `os: 'windows'` (host-deterministic). Targeted run:
  **5 suites / 22 steps green** (deploy, runtime-detect, systemd renderer/args, systemd adapter).
- Gates: cli `deno check` 0 (548 files); `deno task arch:check` FAIL=0 for cli (layering intact —
  kernel `runtime-detect` imports kernel-only; factory in public). cli is fmt/lint-excluded from the
  root gate by design. Drift D6 (guard/verbose boundary), D3 convergence recorded, D5 still → S7.

## S6 — compile generalization (#340)

- Relocated the whole compile tree `kernel/adapters/windows/compile/*` →
  `kernel/adapters/deploy/compile/*` via `git mv` (history preserved): `compile-bundler.ts`,
  `compile-config.ts`, `compile-format.ts`, `compile-runner.ts`, `compile-targets.ts` +
  `compile.test.ts` + `compile_test.ts`. Only cross-import that broke was the runner's
  `../runtime/v8-profiles.ts` → fixed to `../../windows/runtime/v8-profiles.ts` (v8-profiles stays
  in `windows/runtime`; it is intra-kernel so `arch:check` stays FAIL=0). All other relative imports
  (`./compile-*`, `../../config/plugin-registry.ts`, `../../../constants/windows.ts`,
  `../../../domain/deploy/compile-target.ts`, `../../../presentation/...`) keep the same depth after
  the move and needed no edit.
- New `kernel/adapters/deploy/compile/compile-platform.ts`: `defaultCompileTarget()` = host triple
  (`Deno.build.target`) and `binaryExtensionForTarget(triple)` = `.exe` for `*-windows-*` triples,
  empty otherwise. `compile-runner.ts` now derives `arch = options.target ?? defaultCompileTarget()`
  (was hardcoded `DEFAULT_COMPILE_TARGET`) and the output path uses
  `${target.name}${binaryExtensionForTarget(arch)}` (was hardcoded `.exe`). On a Windows host this is
  **byte-identical** (host triple *is* `x86_64-pc-windows-msvc` → `.exe`); on Linux the same pipeline
  now emits an extension-less ELF and the Linux triple.
- Header comments on the moved files de-Windowsed (comment-only). `DEFAULT_COMPILE_TARGET` is still
  exported from `constants/windows.ts` and still consumed by `package-cli-deploy-command.ts` (the CLI
  self-packager, a separate Windows-scoped subcommand out of this slice's scope) — no dangling ref.
- Importers updated in the same commit: `package-cli-deploy-command.ts`,
  `build-windows-strategy.ts`, `build-windows-cli.ts` (grep for `windows/compile` now returns none).
- `--include` asset embedding already present in the runner (satisfies the plan's "embed assets"
  intent); `denort` is automatic in `deno compile` (no flag). See drift D7/D8 for the plan's
  `--include-as-is` and `deno:2.5` items that have no target in Deno 2.9 / this tree.
- Tests: new `compile-platform_test.ts` (3 steps). Targeted run of the relocated dir:
  **5 passed (3 steps) / 0 failed** (compile-platform + extractCompileTargets + loadDeployConfig
  cases). Gates: cli `deno check` 0 (463 files in cli batch), lint 0 occurrences on the moved dir,
  `arch:check` FAIL=0.

## S7 — build-strategy generalization (#340)

- **D5 dedupe (safe):** `deploy-config-resolvers.ts` re-declared five Linux defaults
  (`DEFAULT_SYSTEMCTL_PATH`, `DEFAULT_LINUX_UNIT_PREFIX`, `DEFAULT_LINUX_INSTALL_BASE`,
  `DEFAULT_LINUX_RUNTIME_DIR`, `DEFAULT_LINUX_COMPILE_TARGET`) that already exist as canonical exports
  in `kernel/constants/linux.ts`. Removed the local block; the resolver now imports them. Values are
  character-identical, so `resolveLinuxDeploy` tests stay green (4 passed).
- **OS-neutral orchestrator (the S7 deliverable):** new
  `public/features/deploy/build/prepare-deploy-build.ts` — `deployBuildDirs(deployDir)` (pure: the
  four `DEPLOY_DIRS` subpaths) + `prepareDeployBuild(config, options)` (creates the layout, extracts
  compile targets, applies `--skip`, topo-sorts). This is the OS-agnostic build core the Linux
  strategy (S8) will reuse. `buildWindowsDeployment` now calls `prepareDeployBuild` instead of
  inlining the dir-mkdir + `extractCompileTargets` + skip-filter + `topologicalSort` block; the
  Windows call sequence and stdout are unchanged (`sortedTargets` is the same skip-filtered ordered
  set; the verbose "Skipping:" line is preserved). Dropped the now-unused `join`, `DEPLOY_DIRS`,
  `extractCompileTargets`, and `topologicalSort` imports from the strategy.
- **D2 base-default extraction re-sequenced to S8** (see drift D2 update): the shared-base-default
  helper across both OS resolvers needs a common structural type over two `@netscript/config` schemas
  and `resolveWindowsDeploy` has no direct unit test here, so it cannot be proven green on a
  Windows-only host without the per-slice-forbidden E2E. Benign (identical literals); re-sequenced to
  **S9** (the tests slice) so the extraction lands paired with new direct `resolveWindowsDeploy`
  coverage as its green backstop — S8 (registry realization) does not itself exercise that resolver.
- Tests: new `prepare-deploy-build_test.ts` (2 tests on the pure `deployBuildDirs` mapping; the
  composed `prepareDeployBuild` layers already-unit-tested `extractCompileTargets` + `topologicalSort`
  over `Deno.mkdir`). Kept the test cast-free to respect the type-soundness doctrine. Gates: cli
  `deno check` 0 (465 files), deploy feature tests 3 passed/5 steps + config resolver tests 4 passed,
  lint 0 occurrences, `arch:check` no FAIL.

## S8 — bare-metal deploy-target registry realization (#339, commit `c9f23efc`)

- **Stub → real (canonical surface):** `WindowsServiceDeployTarget` migrated off the legacy-3
  `operations = ['build','install','uninstall']` hardcode onto the canonical 6-op subset
  (`plan/emit/up/down/status/logs`). Added the `LinuxServiceDeployTarget` sibling
  (`kernel/domain/deploy/linux-service-deploy-target.ts`). Both are now three-line concrete classes
  over a new shared `kernel/domain/deploy/service-deploy-target.ts` base (`ServiceDeployTarget` +
  `SERVICE_DEPLOY_OPERATIONS`) that centralizes the canonical handlers **and** the legacy
  `build`/`install`/`uninstall` verb aliases (LD-3) — no per-OS duplication; mirrors the endorsed
  base-plugin-service seam. `rollback`/`secrets` remain **omitted** (declared-unsupported, LD-4;
  bodies → #341).
- **Registration:** `linux-service` added to `DEFAULT_DEPLOY_TARGETS` alongside `windows-service`
  (+ `LINUX_SERVICE_DEPLOY_TARGET` const). The `KnownDeployTargetKey` reservation is now backed by a
  concrete default descriptor; `DeployTargetRegistry.entries()` returns both in deterministic order.
- **IMPL-3 (same commit):** `command-registry_test.ts` operations assertion updated from the legacy-3
  array to the canonical 6-op array in the very commit that migrates the stub — no red interval.
- **F-DEPLOY-1 evidence:** `deploy-target-port_test.ts` gains (a) a subset-declaration test — each
  target's `operations` equals the canonical subset, every declared op resolves to a `function`
  handler, legacy aliases stay callable, and `rollback`/`secrets` are `undefined`; (b) a
  target-scoped result assertion (`linux.up` → `{target:'linux-service', operation:'up', …projectRoot}`);
  (c) a default-registry scan (both OS targets seeded, deterministic order, correct labels). The
  `undefined`-check required typing the loop as `readonly DeployTargetPort[]` (the interface carries
  the optional `rollback?/secrets?`; the concrete class types do not) — no casts introduced.
- **Layering boundary (drift D-S8):** these adapters are kernel-domain descriptors exposed via
  `kernel/extension-points.ts` and are **not** on the live deploy path (CLI verbs run
  `deploy-group.ts` → `buildWindowsDeployment`/`install-service-deploy` directly). Kernel-domain code
  may not import the public `OsServicePort`/build pipeline, so the plan's "delegates to OsServicePort
  + compile" bodies (injecting execution onto the descriptor seam) are a public-layer concern deferred
  to #341. S8 realizes the registry faithfully at its own layer: full canonical vocabulary + Linux
  sibling + registration, layering-clean and green.
- **Gate:** cli `deno check` 0 errors; `deploy-target-port_test.ts` + `command-registry_test.ts`
  **11 passed / 0 failed**; `arch:check` FAIL=0. packages/cli is check-only (excluded from the root
  fmt/lint gate → "No target files" is expected, not a failure).
