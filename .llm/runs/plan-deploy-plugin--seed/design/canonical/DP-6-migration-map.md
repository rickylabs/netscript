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
| M-2 | Deploy target registry (`kernel/application/registries/deploy-target-registry.ts`, registry port) | `plugin-deploy-core/registry` — **empty registry + port + key/error types only** (r2, SF-1); adapters export target factories; `DEFAULT_DEPLOY_TARGETS` is deleted as a core concept — its compatibility equivalent stays in the CLI composition root in W1, replaced by descriptor composition from W3 | W1 | Extract + **NEW behavior**: duplicate rejection (`DeployTargetCollisionError`) — the shipped registry is register-or-replace (r2, SF-13); composition-root-only `replaceForCompatibility` for the W1 shim |
| M-3 | Conventions: `activation/secrets/observability/rollback-convention.ts`, `health-gate.ts` | `plugin-deploy-core/conventions` — the demonstrably pure policies move *with their constants*; **`runtime-overrides.ts` stays with its bare-metal/leaf owners** (it duplicates leaf job/saga/task vocabulary and describes `.deploy/windows` — r2, SF-2) | W1 | Move (R-DEPLOY-3) |
| M-4 | Compile/build engine (`kernel/adapters/deploy/compile/*`, domain `compile-target.ts`, `build/build-deploy.ts` pipeline) | (r2, SF-2) **Refactor then extract**: the pipeline imports CLI `ResolvedConfig`, CLI output, and Windows manifest/V8 modules — it is not a verbatim move. W2 moves the current Windows/Linux build behavior to `deploy-baremetal`; an adapter-neutral compile emitter graduates to `plugin-deploy-core/build` only after filesystem/process/output/config ports exist | W2 (behavior) / later (core emitter) | Refactor then extract |
| M-5 | `DeployTargetBaseSchema` + target-map (`packages/config/src/domain/schemas/deploy-schema.ts`, types `config-section-types.ts:357-592`) | Base + schema registry → `plugin-deploy-core/config` over the **two-phase loader** (r2, SF-10: bootstrap-parse without stripping → resolve adapter `schemaLoader`s → compose → full parse; unknown target ⇒ `DeployTargetAdapterMissingError`, never silently dropped); per-target members → their adapter packages; `@netscript/config` keeps the loader seam + a frozen delegating legacy union for the compat window | W1 (base+loader) / W2 (members) | Move + **NEW loader phase**; retires the deploy slice of `config-plugin-specific-schema-debt` |
| M-6 | Windows/Linux service targets, Servy/systemd adapters, `servy-config.ts`, OS-service factory | `@netscript/deploy-baremetal` | W2 | Move; compose ports publicly (closes `DEPLOY-BAREMETAL-PUBLIC-WIRING` — the full declared op set advertised at runtime) |
| M-7 | `AspireComposeDeployTarget` + `AspireCloudDeployTarget` (`kernel/adapters/aspire/*`) | `@netscript/deploy-aspire` | W2 | Move; platform-marker validation intact |
| M-8 | Deno Deploy target + CLI port + unstable-API guard (`domain/deploy/deno-deploy-*`, `kernel/adapters/deno-deploy/*`) | `@netscript/deploy-deno` | W2 | Move; transitive-scan improvement is a named follow-up card |
| M-9 | cloud-run docker lane (inside aspire-cloud adapter) | `deploy-container` (+`./cloudrun` client) | W4 | Re-home (micro-decision at W4; until then stays in `deploy-aspire` unchanged) |
| M-10 | `deploy` CLI group + all verbs (`public/features/deploy/**`) | W1–W2: same group re-wired over core/adapters; W3: plugin-contributed group + built-in shim (DP-4 §6) | W1→W3 | Rewire, then re-home |
| M-11 | Legacy flat verbs `build/install/start/stop/status/logs/upgrade/uninstall/copy/package-cli` | (r2, SF-9 — semantics are NOT `up`/`down`-equivalent: shipped `start`/`stop` act on registered services without install/uninstall; `copy` syncs artifacts without registration; `upgrade` is a five-step transaction; `package-cli` builds an operator binary) **First-class compatibility handlers owned by `deploy-baremetal`** (`BaremetalCompatibilityCommands`) preserving current flags and side-effect boundaries **through the next semver-major**. Only `build → plan+emit`, `status`, `logs` are direct aliases. Help deprecates; no minor-release removal date until an equivalent canonical workflow + migration telemetry exist. Golden help/exit-code + state-transition tests (`stop` never uninstalls; `start` never registers) | W2 (handlers) / next semver-major (removal) | Compat handlers (resolves S12/#348; stale "Windows Service" group description fixed in W1) |
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
| `DEPLOY-ARCHETYPE-7-CORE-SEED` | **Retired by W1, conditional** (r2, SF-1): core package exists, pure conventions + empty registry owned, F-DEPLOY-1/2 → `gated`, **and** the externalized composition root (defaults in the CLI root, not core) is in place — the retirement claim is not made on a verbatim `DEFAULT_DEPLOY_TARGETS` move |
| `DEPLOY-SECRETS-ROLLBACK-CORE` | **Retired by W1/W2** (adapters delegate to core conventions) |
| `DEPLOY-BAREMETAL-PUBLIC-WIRING` | **Retired by W2** (production composition root wires ports; full declared op set advertised) |
| `cli-deploy-artifacts-missing` | **Partially retired W4** (container lane emits Dockerfile/compose); Helm/K8s hand-artifacts remain delegated to `aspire publish` (unchanged claim) |
| `DEPLOY-S7-APPHOST-COMPOSE-GEN` | Superseded-in-place: the shared compose-gen primitive becomes `deploy-container` emission; the Aspire `addExecutable` constraint documented in its card |
| `cli-deploy-linux-integration-untested` | Converted into a live-probe suite cell of `deploy-baremetal` (W2) |
| `config-plugin-specific-schema-debt` (deploy slice) | **Retired by W1/W2** (schema re-homed; loader seam only in `@netscript/config`) |
| `packages/cli` AP-1 restructure (Wave-6 deploy seams) | Continued, not duplicated: W1–W3 are its named downstream execution |
| NEW debt (opened by this design) | `doctrine-06/11 A7-plugin-delivery amendment` (DP-1 §3); `deno-deploy transitive unstable scan`; `secrets rotation overlap-window` follow-up |

## 3. Compatibility contract (what users experience)

1. **Config keys survive**: `deploy.targets.windows|linux|docker|compose|deno-deploy|kubernetes|
   azure-*|cloud-run` parse identically through W1–W3 (schema re-home is transparent; legacy
   types stay exported from `@netscript/config` as a frozen delegating union for the compat
   window). One deliberate, documented behavior change (r2, SF-10): an **unknown** target key
   becomes `DeployTargetAdapterMissingError` instead of today's silent strip — surfacing
   misconfiguration is the point.
2. **Verbs survive**: every documented `netscript deploy …` invocation works unchanged through
   W3 and beyond; legacy flat verbs keep their exact current semantics as compatibility handlers
   until the next semver-major (M-11, r2).
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
