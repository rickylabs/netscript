# DP-6 — Migration map: the shipped deploy layer → the plugin family

> **Draft — no GitHub mutation.** Canonical design doc of `plan-deploy-plugin--seed`.
> Source inventory with citations: `research/deploy-layer-inventory.md`. Waves: DP-1 §4.
> Governing rule: **behavior-preserving extraction first** — `deno task e2e:cli`
> (`scaffold.runtime`) green is the invariant across W1–W3; no verb or config key breaks without
> a deprecation window.

## 1. Item-by-item map

| # | Shipped item (owner today) | Destination | Wave | Kind |
| --- | --- | --- | --- | --- |
| M-1 | `DeployTargetPort` + `DeployOperation` (`packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`) | `plugin-deploy-core/ports` | W1 | Move + sharpen (capability field) |
| M-2 | Deploy target registry + `DEFAULT_DEPLOY_TARGETS` (`kernel/application/registries/deploy-target-registry.ts`, registry port) | `plugin-deploy-core/registry` | W1 | Move (closed-on-key preserved) |
| M-3 | Conventions: `activation/secrets/observability/rollback-convention.ts`, `health-gate.ts`, `runtime-overrides.ts` | `plugin-deploy-core/conventions` | W1 | Move verbatim (R-DEPLOY-3) |
| M-4 | Compile/build engine (`kernel/adapters/deploy/compile/*`, domain `compile-target.ts`, `build/build-deploy.ts` pipeline core) | `plugin-deploy-core/build` | W1 | Move; CLI keeps the presentation wrapper |
| M-5 | `DeployTargetBaseSchema` + target-map (`packages/config/src/domain/schemas/deploy-schema.ts`, types `config-section-types.ts:357-592`) | Base + schema registry → `plugin-deploy-core/config`; per-target members → their adapter packages | W1 (base) / W2 (members) | Move; retires the deploy slice of `config-plugin-specific-schema-debt`; `@netscript/config` keeps the loader seam and a re-export for one deprecation window |
| M-6 | Windows/Linux service targets, Servy/systemd adapters, `servy-config.ts`, OS-service factory | `@netscript/deploy-baremetal` | W2 | Move; compose ports publicly (closes `DEPLOY-BAREMETAL-PUBLIC-WIRING` — the 7-op set advertised at runtime) |
| M-7 | `AspireComposeDeployTarget` + `AspireCloudDeployTarget` (`kernel/adapters/aspire/*`) | `@netscript/deploy-aspire` | W2 | Move; platform-marker validation intact |
| M-8 | Deno Deploy target + CLI port + unstable-API guard (`domain/deploy/deno-deploy-*`, `kernel/adapters/deno-deploy/*`) | `@netscript/deploy-deno` | W2 | Move; transitive-scan improvement is a named follow-up card |
| M-9 | cloud-run docker lane (inside aspire-cloud adapter) | `deploy-container` (+`./cloudrun` client) | W4 | Re-home (micro-decision at W4; until then stays in `deploy-aspire` unchanged) |
| M-10 | `deploy` CLI group + all verbs (`public/features/deploy/**`) | W1–W2: same group re-wired over core/adapters; W3: plugin-contributed group + built-in shim (DP-4 §6) | W1→W3 | Rewire, then re-home |
| M-11 | Legacy flat verbs `build/install/start/stop/status/logs/upgrade/uninstall/copy/package-cli` | Aliases onto `baremetal` target ops; deprecation notice two minor releases, then removal | W2 announce / W5 remove | Deprecate (resolves S12/#348 convergence; stale "Windows Service" group description fixed in W1) |
| M-12 | Scaffold deploy emission: 3 workflow templates, `netscript.config.ts` `deploy:{}`, appsettings model | Workflow templates move to their owning adapters' scaffold assets; `deploy:{}` gains the plugin-era schema (targets added via `deploy target add`); appsettings model unchanged (it is the logical graph — L-4) | W3 | Re-home + extend |
| M-13 | Aspire scaffold bundle (`apphost.mts`, `.helpers`, aspire.config.json…) | Unchanged — `@netscript/aspire` substrate + CLI templates stay; the deploy plugin consumes, never owns, AppHost emission | — | Keep |
| M-14 | `packages/aspire` | Unchanged (composer/diagnostics substrate) | — | Keep |
| M-15 | `packages/runtime-config` | Unchanged; plugin adds the tiny `deploy` topic | W3 | Keep + extend |
| M-16 | Desktop packaging (`public/features/deploy/target/desktop/**`) | **Out of family** — remains in CLI until epic #830 (desktop graph, beta.14) re-homes it; the deploy plugin neither moves nor blocks it | — | Boundary |
| M-17 | Maintainer `test-scaffold` + e2e scaffold gates | Extended: new `scaffold.runtime` case for `plugin install deploy` (DP-4 §7) | W3 | Extend |
| M-18 | Docs (`deploy.md`, `deploy-deno-deploy.md`, `deploy-local-aspire.md`, `explanation/aspire.md`, cli-reference) | Rewritten on the plugin story per wave; the "alpha-minimal" framing replaced by the target-matrix + capability story (drift D-C1) | each wave | Refresh |

## 2. Debt ledger effects

| Debt entry | Effect |
| --- | --- |
| `DEPLOY-ARCHETYPE-7-CORE-SEED` | **Retired by W1** (core package exists, conventions+registry owned, F-DEPLOY-1/2 → `gated`) |
| `DEPLOY-SECRETS-ROLLBACK-CORE` | **Retired by W1/W2** (adapters delegate to core conventions) |
| `DEPLOY-BAREMETAL-PUBLIC-WIRING` | **Retired by W2** (production composition root wires ports; 7-op advertised) |
| `cli-deploy-artifacts-missing` | **Partially retired W4** (container lane emits Dockerfile/compose); Helm/K8s hand-artifacts remain delegated to `aspire publish` (unchanged claim) |
| `DEPLOY-S7-APPHOST-COMPOSE-GEN` | Superseded-in-place: the shared compose-gen primitive becomes `deploy-container` emission; the Aspire `addExecutable` constraint documented in its card |
| `cli-deploy-linux-integration-untested` | Converted into a live-probe suite cell of `deploy-baremetal` (W2) |
| `config-plugin-specific-schema-debt` (deploy slice) | **Retired by W1/W2** (schema re-homed; loader seam only in `@netscript/config`) |
| `packages/cli` AP-1 restructure (Wave-6 deploy seams) | Continued, not duplicated: W1–W3 are its named downstream execution |
| NEW debt (opened by this design) | `doctrine-06/11 A7-plugin-delivery amendment` (DP-1 §3); `deno-deploy transitive unstable scan`; `secrets rotation overlap-window` follow-up |

## 3. Compatibility contract (what users experience)

1. **Config keys survive**: `deploy.targets.windows|linux|docker|compose|deno-deploy|kubernetes|
   azure-*|cloud-run` parse identically through W1–W3 (schema re-home is transparent; one
   deprecation window for import-path movers).
2. **Verbs survive**: every documented `netscript deploy …` invocation works unchanged through
   W3; legacy flat verbs warn from W2, removed after two minor releases (M-11).
3. **Scaffolded projects**: existing projects keep working without the plugin (shim path);
   `plugin install deploy` is additive. New scaffolds from W3 get the plugin preinstalled with
   the `deno-deploy` default target (T1 default, DP-3 §3).
4. **Aspire keeps its place**: local dev loop (`aspire start`) and the compose/k8s/azure publish
   lanes are unchanged in behavior — they change owner (adapter package), not shape.
5. **CI workflows**: previously scaffolded workflow files keep functioning (they call the same
   verbs); new scaffolds get per-target workflows from the adapters (OIDC-first where the
   platform supports it — AWS role-assume, Deno Deploy org tokens; token-based where not —
   Cloudflare).

## 4. Sequencing risks

- **R-M1 The extraction tail wags the CLI**: W1 touches the CLI's largest feature. Mitigation:
  behavior-freeze slices, e2e:cli as the gate, no verb work mixed into move commits.
- **R-M2 Schema re-home breaks config consumers**: mitigate with a one-window re-export from
  `@netscript/config` + `deps:check` sweep.
- **R-M3 Plugin-mounted CLI regressions** (W3): the shim keeps the built-in path alive; the
  `scaffold.runtime` deploy case gates the mount.
- **R-M4 Desktop entanglement**: desktop subgroup shares the deploy group namespace; W1 must
  split routing without moving desktop (M-16) — a dedicated slice with its own review.
