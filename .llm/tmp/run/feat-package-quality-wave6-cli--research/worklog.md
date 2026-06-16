# Worklog — Wave 6 `@netscript/cli` A6-v2 promotion

## Design

The CLI is the **last** package in the S1 Package Quality program. Research establishes it is a
*fast-evolved A6-v1*, not a broken package: `deno check` clean, zero `console.*` leaks, no file >384
LOC, and `src/{kernel,public,maintainer,local}/` already maps to A6's kernel-horizontal /
surface-vertical shape. So the promotion to A6-v2 is a **bounded set of moves + seam introductions**,
not a rewrite. AP-1 ("Restructure") is valid but its scope is exactly the 7-slice plan.

### Sequencing rationale

The CLI deliberately ships **after** everything else (LD-7 / decision #7). Phase P publishes all 28
other members to JSR alpha.0 first, which lets slice 4 validate the *production* `netscript init`
(JSR-resolved deps) via a new `scaffold.published.runtime` e2e — closing the single biggest untested
gap (today only the maintainer/local scaffold variants are exercised).

### Load-bearing change — slice 2

The typed `CliCommandRegistry` (concrete to Cliffy `Command`, LD-2) replacing the hand-wired
`public-command-tree.ts` chain (V-1/F-CLI-27) is the keystone. If slice 2 doesn't close V-1, the
hand-wired tree becomes a permanent maintenance hotspot (R-15). Therefore slice 2 may only merge with
a green `scaffold.runtime` rerun (41/41) — enforced by the PR template. The `DeployTargetPort` +
`DeployTargetRegistryPort` seam lands in the same slice because it removes the `DeployTargetKey`
literal-union lock-in (V-9) and the two changes share the command-dispatch surface.

### Key design decisions

1. **Concrete registry, not generic (LD-2).** YAGNI — Cliffy `Command` is the only command runtime;
   a generic abstraction adds indirection with no second implementor.
2. **Writers under `maintainer/features/codegen/` (LD-3).** Keeps scaffold writers out of `public/`,
   satisfying F-CLI-3 (no surface↔surface import).
3. **Deploy is a port, not a switch.** `DeployTargetPort` + registry; `WindowsServiceDeployTarget` is
   the one concrete adapter (Windows deploy is *not* Aspire). Future k8s/container/cloud adapters wrap
   `Aspire.Hosting.{Kubernetes,ContainerApps,AWS,Azure}` — seam only, no concrete impl this wave.
4. **Single-file ownership with the upgrade run (LD-8).** This wave verifies the inherited
   `apphost.mts` + `.aspire/modules/*.mts` + `tsconfig.apphost.json` shape that #44/R6 already
   migrated, then adds the schema mirror and `WithProcessCommand()` flag-off seam. The upgrade run
   owns `scaffold-versions.ts` + CI pin, and no file is edited by both programs.
5. **Immutable research (LD-5).** Impl divergence goes in `research-realized.md`, never back-edited
   into `research.md`.

### What this wave does NOT do

- Publish `@netscript/cli` (withheld; ships after this wave).
- Set the Aspire/Deno version pins (upgrade run owns those; this wave consumes them).
- Build concrete new deploy targets (port + seam only).

## Implementation Log

### Slice 0 — Prep / Hygiene

- Verified `packages/cli/e2e` is already a root workspace member in `deno.json`; slice 0.1 is a
  verify-green check, not a workspace edit.
- Confirmed `packages/cli/deno.json` has no dependency currently represented in the root catalog,
  so the catalog-baseline consumption has no package-local import rewrite in this slice.
- Applied D-W6-2 catalog freshness bumps: `tailwindcss` and `@tailwindcss/vite` to `^4.3.1`, and
  `@preact/signals` to `2.9.2`; left `vite` unchanged as DEBT_ACCEPTED.
- Folded PLAN-EVAL gaps #1-#3 into `plan.md`, `worklog.md`, and `drift.md`.
- Validation:
  - `deno task check:packages --unstable-kv` is not defined on this branch; used the current
    repo-native equivalent `deno task check`, which passed with 1,582 selected files and 0 findings.
  - `deno check --unstable-kv packages/cli/bin/netscript.ts packages/cli/bin/netscript-dev.ts packages/cli/mod.ts packages/cli/maintainer.ts packages/cli/scaffolding.ts packages/cli/testing.ts`
    passed.
  - `deno task fmt:check` passed with 1,167 selected files and 0 findings.
  - `deno task lint` passed with 1,082 selected files and 0 findings.
  - `deno task publish:dry-run` passed; existing slow-type and dynamic-import warnings remain
    accepted upstream/package debt, not Slice 0 blockers.

### Slice 1 — Standards Doc

- Added `packages/cli/docs/standards.md` with the command contract, typed error model, IO/output
  discipline, naming rules, testing tiers, public-surface/doc-lint rules, layer discipline, gate map,
  and V-1..V-14 migration checklist with file:line evidence.
- Fixed the CLI public doc-lint leaks discovered by the slice gate by adding type-only public exports
  for `DbEngine`, `FileSystemPort`, `ScaffoldPlan`, and `ScaffoldServicePlan`, and by replacing the
  upstream `PluginManifest` alias with a CLI-owned structural `PluginHostManifest`.
- Validation:
  - `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/cli --entrypoints ./mod.ts --entrypoints ./scaffolding.ts --entrypoints ./testing.ts --pretty`
    passed with totalErrors=0, privateTypeRef=0, missingJSDoc=0.
  - `wc -l packages/cli/README.md` reports 227 lines, so the README >=150 LOC gate remains green.
  - `deno check --unstable-kv packages/cli/bin/netscript.ts packages/cli/bin/netscript-dev.ts packages/cli/mod.ts packages/cli/maintainer.ts packages/cli/scaffolding.ts packages/cli/testing.ts`
    passed.
  - `deno task lint` passed with 1,082 selected files and 0 findings.
  - `deno task fmt:check` passed with 1,167 selected files and 0 findings.
