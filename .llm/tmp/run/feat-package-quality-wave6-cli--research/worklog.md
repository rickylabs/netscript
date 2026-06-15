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
4. **Single-file ownership with the upgrade run (LD-8).** This wave owns `scaffold-files.ts` +
   `scaffold-aspire.ts` apphost-path migration; the upgrade run owns `scaffold-versions.ts` + CI pin.
   No file is edited by both programs.
5. **Immutable research (LD-5).** Impl divergence goes in `research-realized.md`, never back-edited
   into `research.md`.

### What this wave does NOT do

- Publish `@netscript/cli` (withheld; ships after this wave).
- Set the Aspire/Deno version pins (upgrade run owns those; this wave consumes them).
- Build concrete new deploy targets (port + seam only).
