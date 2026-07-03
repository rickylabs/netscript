# Drift — deploy-s3-baremetal (#339 + #340)

Append-only. Severity: `minor` | `significant` | `architectural`.

## D1 (S1) — `config-file.v1.json` does not schematize `deploy.targets` — severity: minor

- **Plan said:** S1 deliverables include a `packages/cli/assets/schema/config-file.v1.json` entry
  for the new `linux` target.
- **Reality:** `assets/schema/config-file.v1.json` is the **vendored upstream Deno config-file
  schema** (`$id: https://deno.land/x/deno/cli/schemas/config-file.v1.json`, title "Deno
  configuration file Schema"). Its `deploy` block is Deno Deploy / `deno sandbox` config, and its
  `plugins` block is Deno's, not NetScript's. NetScript's `deploy.targets.*` is **not** represented
  there — the shipped `windows` target is absent too.
- **Decision:** did **not** add a `deploy.targets.linux` block to that vendored file; doing so would
  be an orphan, unmirrored modification with no `windows` precedent to follow. The config contract
  for `deploy.targets.linux` is enforced by the Zod schemas in `@netscript/config`
  (`LinuxDeployTargetSchema` + `DeployConfigSchema`), which is the real S1 deliverable and which the
  new `linux` member mirrors 1:1 with `windows`.
- **Impact:** none on the contract; the plan's asset reference was based on a misread of that file's
  provenance. No follow-up required.

## D2 (S1) — Resolved base-config duplication across OS targets — severity: minor

- `ResolvedLinuxDeployConfig` (new) and `resolveLinuxDeploy` intentionally repeat the shared
  build/bundle/health/log/v8/docker base fields already present on `ResolvedWindowsDeployConfig` /
  `resolveWindowsDeploy`, mirroring the existing shipped windows pattern. Centralizing this shared
  base across OS targets is deferred to the build-strategy generalization slice (#340, S7) rather
  than refactoring the windows resolver in S1 (which would widen S1's blast radius and risk a
  windows regression). Noted here as the intended debt seam; not a doctrine violation given it
  matches the shipped precedent and is scheduled for consolidation within this same epic.

### D2 update (S7) — base-default extraction re-sequenced from S7 to S8 — severity: minor

- S7 delivered the **D5** half of "consolidate the config duplication" (the five duplicated
  `DEFAULT_LINUX_*` constants in `deploy-config-resolvers.ts` now import from the canonical
  `kernel/constants/linux.ts`; identical values, `resolveLinuxDeploy` tests stay green). The **base
  *default* extraction** (a shared helper feeding both `resolveWindowsDeploy` and `resolveLinuxDeploy`)
  is intentionally **not** done in S7 and moves to **S8**. Rationale: it requires introducing a common
  structural type across the two `@netscript/config` target schemas, and `resolveWindowsDeploy` is
  **not** directly unit-tested in `deploy-config-resolvers_test.ts` (only `resolveLinuxDeploy` is) —
  so a Windows-side merge cannot be proven green on this Windows-only host without the
  per-slice-forbidden `scaffold.runtime` E2E. The duplication is benign (character-identical literal
  defaults). The correct green backstop is direct `resolveWindowsDeploy` unit tests (defaults +
  overrides, mirroring the existing `resolveLinuxDeploy` ones) — those belong with the **S9** tests
  slice, so the base-default extraction is paired with and lands in **S9**, immediately after adding
  that Windows resolver coverage. Deferring (vs. forcing an unvalidatable Windows-config refactor) is
  the guardrail-preferred choice; recorded so the evaluator reads this as a sequencing decision.

## D3 (S3) — servy execution convergence deferred from S3 to S5 — severity: minor

- **Plan said (S3):** "fold the `runServy` start/stop/status helper so all lifecycle flows through
  the port."
- **Reality:** the `runServy(servyCliPath, args, verbose)` free function
  (`kernel/adapters/deploy/commands/servy-command.ts`) is consumed directly by three deploy commands
  (`start`/`stop`/`status-deploy-command.ts`) **and** `kernel/adapters/deploy/upgrade-steps.ts`
  (2 sites). Routing those executions through `ServyOsServiceAdapter` necessarily rewrites those
  command call sites — which is exactly S5's OS routing/wiring slice (its file list owns
  `features/deploy/{start,stop,status,install,uninstall}/*` + `public-command-dependencies.ts`) — and
  the upgrade orchestration the plan otherwise leaves untouched.
- **Decision:** S3 folds servy **argument construction** into shared builders (`servyInstallArgs` +
  `servyLifecycleArgs`) that both the adapter and the `runServy` callers use, which is what the
  byte-identical guarantee actually requires and what the S3 regression test now proves across the
  full lifecycle matrix. The **execution** convergence (making `start`/`stop`/`status` consume the
  adapter instead of the raw-`Deno.Command` free function) moves to S5 where those command files are
  already in scope. `runServy` remains for `upgrade-steps.ts` until/unless a later slice revisits the
  upgrade path (out of this epic's declared scope).
- **Impact:** none on the contract or the byte-identical guarantee; S3 stays green and self-contained.
  Records the S3↔S5 boundary so the evaluator does not read a missing runServy deletion as an S3 gap.

## D4 (S4) — systemd adapter file placed in `public/adapters`, not `kernel/` — severity: minor

- **Plan said (S4 file list):** `systemd-os-service.ts` under `kernel/adapters/linux/systemd/*`.
- **Reality:** the adapter *implements* `OsServicePort`, which S2 placed in `public/ports/`. A
  `kernel/`-located class importing a `public/` port inverts the hexagonal layer direction
  (kernel→public) and would fail `arch:check`. The shipped Windows adapter `ServyOsServiceAdapter`
  already lives in `public/adapters/` for exactly this reason.
- **Decision:** placed `SystemdOsServiceAdapter` at `public/adapters/systemd-os-service.ts` for
  layer symmetry with the servy adapter. The *pure* systemd logic the plan wanted in `kernel/` — the
  `.service` unit renderer (`systemd-unit.ts`) and the systemctl/journalctl arg builders
  (`systemd-command.ts`) — DO live under `kernel/adapters/linux/systemd/`, and hold no port
  dependency. `kernel/constants/linux.ts` added as planned.
- **Impact:** none on behaviour or gates; the only deviation is the adapter's directory, corrected to
  respect layering. Registration/wiring of the adapter happens at S5/S8 as planned.

## D5 (S4) — Linux default-const duplication between resolver and `constants/linux.ts` — severity: minor

- `kernel/constants/linux.ts` (new, canonical Linux defaults home mirroring `constants/windows.ts`)
  re-states a few OS defaults (`systemctl` path, unit prefix, install base, runtime dir, compile
  triple) that S1 hardcoded as private consts inside `deploy-config-resolvers.ts`. Converging the
  resolver to import from `constants/linux.ts` is deferred to the S5/S7 wiring/base-config
  consolidation (same seam as D2) to keep S4 additive and avoid perturbing S1's tested resolver.
  Values are identical, so no behavioural drift.

## D6 (S5) — start/stop/status keep the Windows guard; verbose servy trace dropped — severity: minor

- **D3 convergence (done):** `start`/`stop`/`status-deploy-command.ts` now execute through
  `createOsServicePort('windows', { process: new DenoProcess(), servyCliPath })` →
  `port.run(op, name)` instead of the raw `runServy` free function. `install`/`uninstall` route OS
  naming/config through `runtime-detect.ts` (`fullServiceNameForOs` + `serviceConfigPath`) and the
  injected `OsServicePort`. `runServy` + `servyLifecycleArgs` remain exported solely for
  `kernel/adapters/deploy/upgrade-steps.ts` (upgrade path is out of this epic's scope).
- **Guard retained:** the three interactive lifecycle commands keep their
  `WindowsRequiredError` guard and pin the port to `'windows'`. Their success/"already running"/
  "not installed" branch logic parses **servy** stdout, which is not systemctl-shaped (systemctl
  emits `active (running)` and non-zero exit for inactive units). Unguarding them would ship an
  untested, mis-parsing Linux path. The OS-agnostic Linux lifecycle is delivered through S8's
  `LinuxServiceDeployTarget` (which composes `SystemdOsServiceAdapter` directly), not by loosening
  these servy-tuned commands. Boundary recorded so the evaluator does not read the retained guard as
  an S5 gap.
- **Verbose trace:** the per-command gray `Cmd:`/`Output:` trace that `runServy(..., verbose)`
  printed is dropped for start/stop/status — the `OsServicePort` adapters intentionally do no
  presentation logging (single-responsibility). The `-v/--verbose` flag is retained on the commands
  (still parsed, now inert for the servy call). No behavioural change to exit codes, result
  classification, or health polling; only the optional debug echo is gone. If verbose command
  tracing is wanted later it belongs at the port seam, not re-inlined per command.

## D5 update (S5) — Linux const convergence still deferred to S7 — severity: minor

- S5 did not fold `deploy-config-resolvers.ts`'s private Linux consts into `constants/linux.ts`; that
  resolver was not otherwise touched by S5's wiring. Convergence remains scheduled for the S7
  base-config/build-strategy consolidation (same seam as D2). No behavioural drift (values identical).

## D7 (S6) — plan's `--include-as-is` compile flag does not exist in Deno 2.9 — severity: minor

- The plan's S6 line lists "`--include`/`--include-as-is`". `deno compile --help` on the pinned
  toolchain (deno 2.9.0) exposes only `--include <path>` and `--exclude <path>` — there is **no**
  `--include-as-is` flag. The compile runner already emits `--include` per `target.include`
  (services embed via `include`, apps embed `_fresh/client` + `static`), which satisfies the plan's
  underlying "embed assets into the single binary" intent. Wiring a non-existent flag would be dead
  or crash-on-emit code, so it was deliberately **not** added. If a future Deno adds a verbatim
  include mode, extend `CompileTarget`/the runner then. `denort` needs no flag — it is the standard
  `deno compile` runtime and is used automatically.

## D8 (S6) — plan's `deno:2.5` pin and "dead docker/script config" have no target — severity: minor

- The plan's S6 line says "retire `deno:2.5` pin + dead `docker`/`script` config". A repo-wide grep
  found **no `deno:2.5` pin anywhere** — a stale plan assumption; nothing to retire. The only Deno
  container reference is `denoBaseImage: 'denoland/deno:2'` in
  `kernel/adapters/config/deploy-config-resolvers.ts` (windows + linux resolvers). That is **live**
  container-packaging config consumed by the container/Aspire lane (#343 territory), not dead and not
  bare-metal's to remove — deleting it would be an out-of-scope config-contract change with
  cross-slice risk. Both items are recorded as plan inaccuracies and intentionally left as no-ops;
  S6 delivered its load-bearing intent (OS-generic single-binary compile relocated to a neutral home)
  without them.

## D-S8 (S8) — deploy-target descriptor delegation is bounded by hexagonal layering — severity: minor

- **Plan said (S8):** evolve `WindowsServiceDeployTarget` stub → real "delegates to `OsServicePort` +
  compile for `plan/up/down/status/logs`"; add `LinuxServiceDeployTarget`; register `linux`.
- **Reality:** the `DeployTargetPort` adapters + `DeployTargetRegistry` are the **Archetype-7
  descriptor / extension-point surface** exposed via `kernel/extension-points.ts`, and they are
  **kernel-domain** code. `OsServicePort` lives in `public/ports/` (S2) and the real build/install
  pipeline lives in `public/features/deploy/**`. A kernel-domain adapter importing either would invert
  the hexagonal layer direction (kernel→public) and fail `arch:check` — the same constraint that moved
  the systemd adapter to `public/adapters/` in D4. A repo-wide grep confirms nothing consumes the
  registry on the live deploy execution path today: the CLI deploy verbs run through `deploy-group.ts`
  → `buildWindowsDeployment` / `install-service-deploy` **directly**; the registry is consumed only by
  tests + the exported extension-point surface.
- **Decision:** S8 realizes the registry at the layer it lives in — the adapters now **declare the full
  canonical operation vocabulary** (6 ops + legacy aliases) and return target-scoped operation
  descriptors from a shared `ServiceDeployTarget` base, and `linux-service` is registered as a
  first-class default target. Wiring an **injected** `OsServicePort`/compile delegation onto this seam
  (so the descriptor registry becomes an execution path) is a public-layer composition concern that
  belongs with the deployment-hardening slice **#341** (rollback/health/OTEL/secrets bodies), which is
  explicitly out of this epic's scope. This keeps S8 green, layering-clean, and faithful to the plan's
  intent (canonical-op adapters + Linux sibling + registration) without a layering violation.
- **Impact:** none on gates or the live deploy path. F-DEPLOY-1 (registry scan + subset-declaration) is
  proven by the new tests. Recorded so the evaluator reads the descriptor-level realization as a
  layering decision, not a missing-delegation gap.
