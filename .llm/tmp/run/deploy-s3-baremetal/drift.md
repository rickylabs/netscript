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
