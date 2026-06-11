# Worklog — Run 5c1 Composition foundation

> Implementation session for locked Wave 5c Run 1.
> Branch: `feat/package-quality-wave5-apps-5c1-ui-foundation`
> Base planning commit: `cda1c60`
> Date: 2026-06-11

## Design

### Public Surface

- `@netscript/fresh-ui`: package tasks, token artifacts, registry schema/manifest, L0 primitives,
  runtime hook internals for accordion/popover/tooltip, README/JSR publish surface.
- `@netscript/cli`: public commands `ui:init` and `ui:add <item|collection>` only in slices 13-14.
- Registry overlay: v2 item definitions with target placeholders, `registryDependencies`,
  `dependencies`, per-item CSS, `cssVars?`, and `author?`.

### Domain Vocabulary

- `RegistryItemKind`, `RegistryFileDefinition`, `RegistryCssContribution`,
  `RegistryCssVars`, `RegistryItemDefinition`, `RegistryCollectionDefinition`,
  `RegistryManifest`.
- Token source groups: primitives, semantic aliases, dark theme bindings, light theme overrides.
- Distribution targets: `@ui/`, `@islands/`, `@assets/`, `@lib/`, `~/`.
- Runtime tiers: Tier P platform engines, Tier Z Zag-backed machines.

### Ports

- File system and Deno JSON edits are owned by CLI adapters/use cases in slices 13-14.
- Token generation consumes Style Dictionary v5 through a run-local/package task.
- Fitness gates execute raw `deno`/`git` commands and write no root lock state.

### Constants

- Run directory: `.llm/tmp/run/feat-package-quality-wave5-apps--5c1-ui-foundation/`.
- Package unit: `packages/fresh-ui`.
- CLI unit: `packages/cli`.
- Fitness gates introduced here: `tokens-drift`, `manifest-integrity`.

### Commit Slices

1. Package task block + file-list cleanup in fresh-ui `deno.json`.
2. DTCG 2025.10 token source with current hex parity.
3. Style Dictionary v5 build task and generated `tokens.css` parity proof.
4. Generated `theme-bridge.css` and `tokens.json`.
5. `tokens-drift` fitness gate.
6. Registry schema v2 types and manifest migration.
7. `manifest-integrity` fitness gate.
8. Per-item CSS extraction, move-only.
9. L0 conventions doc and primitives module.
10. Throwaway Zag x Fresh combobox spike evidence.
11. Accordion internals to native `<details name>` with public hook shape preserved.
12. Popover/tooltip internals to Popover API + anchor positioning + CSS fixed fallback.
13. `ui:init` command in `packages/cli`.
14. `ui:add <item|collection>` command in `packages/cli`.
15. OKLCH ramp re-derivation in token source.
16. README/docs/JSR dry-run sweep.

### Deferred Scope

- Run 2 owns playground conversion, living `/design`, and broader design-system reconciliation.
- Run 3 owns `netscript init` integration and generated starter app replacement.
- `block:add` contract-driven generation remains post-5c.

### Contributor Path

Start at `packages/fresh-ui/registry/schema.ts` for item contract changes, then
`packages/fresh-ui/registry/manifest.ts` for item inventory, then the fitness gates under
`.llm/tools/fitness/` for registry/token invariants. CLI installation behavior lives under
`packages/cli/src/public/features/ui/` once slices 13-14 land.

## Baseline

Pending measure-first run.

## Slice Evidence

Pending.
