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
