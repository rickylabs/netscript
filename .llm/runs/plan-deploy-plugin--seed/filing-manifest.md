# Filing manifest — deploy-plugin board (one-shot; executes only on PLAN-EVAL PASS)

> Authority: owner directive 2026-07-19 ("dispatch & on pass create the epic, sub issues and
> prioritize them on milestones; allowed to create further betas"). Corpus r5 is the source;
> `plan.md` §5 is the DAG. After filing, **GitHub is the single source of truth**; run docs carry
> tags under that authority rule. Dependencies are expressed as `DPB-n` ids (titles carry the
> same ids — single-scheme rule).

## Pre-steps

- **Labels:** ensure `epic:deploy-plugin` exists (color `5319e7`, description "Deploy plugin
  family epic (#891 RFC)"). Parity follow-up: add to `.github/labels.yml` in a framework slice
  (recorded in FILING-LOG).
- **Milestones:** ensure `0.0.1-beta.15` ("Deploy plugin — container path (W4)") and
  `0.0.1-beta.16` ("Deploy plugin — probe-gated clouds (W5)") exist. Existing: `0.0.1-beta.13`
  (#15), `Backlog / Triage` (#3).
- **Assignment:** W1+W2+Host+W3 (DPB-1…19) + DPB-28 → `0.0.1-beta.13`; W4 (DPB-20…22) →
  `0.0.1-beta.15`; W5 (DPB-23…27) → `0.0.1-beta.16`; DPB-29 → `Backlog / Triage`. Epic →
  `0.0.1-beta.13`.
- **Common labels:** every child carries `epic:deploy-plugin`, `area:deploy`, `status:plan`, one
  `type:`, one `priority:`; secondary `area:` where noted. No `wave:` labels (milestones carry
  scheduling — consistent-or-not-at-all rule).

## EPIC — `Epic: Deploy plugin family`

labels: `type:umbrella epic:deploy-plugin area:deploy area:plugins priority:p1 status:plan` · milestone: beta.13

Body: RFC pointer (#891, corpus r5 in `.llm/runs/plan-deploy-plugin--seed/`), the family diagram,
`## Epic acceptance` gates:

- [ ] gate: every child's acceptance gates are checked with linked evidence before it closes; no closing keyword ever targets this epic.
- [ ] gate: F-DEPLOY-1 and F-DEPLOY-2 are `gated` (not `reviewed`) and green from W1 on.
- [ ] gate: `deno task e2e:cli` (scaffold.runtime) is green at every wave exit; W1 sub-slices each keep it green.
- [ ] gate: the conformance matrix (target × variant × capability × verdict) runs in CI from W2 on; every `lossless` verdict carries live-platform evidence.
- [ ] gate: no `deploy-*` package imports another `deploy-*` package; core imports no leaf package (import-graph gates).
- [ ] gate: sentinel secret values never appear in plans, artifact manifests, Aspire state cache, argv, logs, telemetry, or errors (negative tests).
- [ ] gate: every documented legacy `netscript deploy …` invocation keeps its exact semantics through the compatibility window (golden tests).
- [ ] gate: all implementation PRs satisfy CI and the required opposite-family review before merge.

`## Children` = checklist of the 29 live issue numbers (filled at filing).

## Children (title · type · priority · milestone · secondary areas · body core)

Each body = `Part of #<EPIC>` + scoping paragraph (with anti-scope) + `## Acceptance` gates +
`## Metadata` (`Dependencies:` by DPB-id · `Delivery shape:`). Corpus refs cite DP docs.

### DPB-1 `[deploy-plugin DPB-1] Move deploy contracts to plugin-deploy-core behind compatibility re-exports` · type:refactor · p0 · beta.13 · +area:cli
Scope: move `DeployTargetPort`/`DeployOperation`/result+error types from the CLI kernel to `plugin-deploy-core/ports|domain` with compatibility re-exports; fix the stale "uniform 7-op" comment (eight-op/declared-subset) incl. matching doctrine/gate wording. Anti-scope: no behavior change, no registry/conventions move, no build-engine move (DP-2 intro, SF-2).
Gates: `- [ ] gate: e2e:cli green with zero verb changes` · `- [ ] gate: consumer imports compile via re-exports` · `- [ ] gate: no "7-op" wording remains in moved code or doctrine touched by this slice`.
Deps: none. Shape: contracts extraction, no vendor work.

### DPB-2 `[deploy-plugin DPB-2] Move pure deploy conventions with their constants to core` · type:refactor · p1 · beta.13 · +area:cli
Scope: activation/secrets/rollback/observability/health-gate conventions move with constants; `runtime-overrides.ts` and `servy-config.ts` stay with their bare-metal/leaf owners. Anti-scope: no convention behavior change (DP-2 §6, SF-2).
Gates: `- [ ] gate: conventions' unit tests pass unchanged from the new home` · `- [ ] gate: adapters delegate (R-DEPLOY-3) — no forked convention copies remain`.
Deps: DPB-1. Shape: pure-module move.

### DPB-3 `[deploy-plugin DPB-3] Empty duplicate-rejecting core registry + CLI compatibility composition root` · type:feat · p0 · beta.13 · +area:cli
Scope: `createDeployTargetRegistry(entries=[])` in core (port, key/error types, `DeployTargetCollisionError` — duplicate rejection is NEW; `replaceForCompatibility` composition-root-only for the shim); `DEFAULT_DEPLOY_TARGETS` deleted as a core concept — defaults stay in the CLI composition root. Anti-scope: core never imports an adapter (SF-1/SF-13).
Gates: `- [ ] gate: constructor + generated-registry duplicate tests reject with both owners named` · `- [ ] gate: environment-qualified keys and deterministic ordering tested` · `- [ ] gate: e2e:cli green via the compat composition root`.
Deps: DPB-1. Shape: registry extraction + NEW rejection behavior.

### DPB-4 `[deploy-plugin DPB-4] Host-owned deploy shell split + router rewired over core contracts` · type:refactor · p1 · beta.13 · +area:cli
Scope: split the `deploy` group into a host-owned shell (owns `desktop`, shared help, future install hint) with the router rewired over core contracts; fix the stale "Windows Service" description. Anti-scope: zero verb changes; desktop subgroup not moved (DP-6 M-16/R-M4).
Gates: `- [ ] gate: help-output goldens unchanged except the description fix` · `- [ ] gate: desktop verbs untouched by diff` · `- [ ] gate: e2e:cli green`.
Deps: DPB-1, DPB-3. Shape: thin-router refactor.

### DPB-5 `[deploy-plugin DPB-5] Capability + topology contracts, rejection compiler, conformance harness` · type:feat · p0 · beta.13
Scope: structural `CapabilityRef`/`BindingRequirement`/`WorkloadConstraint`/`CapabilityVerdict` (levels incl. `unverified`; scopes runtime/adapter/binding) + per-variant `DeployCapabilityManifest` (schemaVersion, toolVersions, probedAt); `DeploymentCell`/`DeploymentTopologyPlan` + `suggested-cells.json`; ONE pure compiler entrypoint over a versioned `CapabilityCheckInput` snapshot; the conformance-suite harness + in-memory fakes in `./testing`. Anti-scope: core imports no leaf package; no live-provider claims (DP-2 §4/§5, SF-6/7/8, SG-4).
Gates: `- [ ] gate: compiler rejects a required unsupported capability at build time with the manifest note` · `- [ ] gate: compiler emits suggestedCells and never partitions silently` · `- [ ] gate: parity test — identical verdict JSON for two consumers over one snapshot` · `- [ ] gate: lossless requires an evidence id (schema-enforced)`.
Deps: DPB-1. Shape: core contracts, backend-truthful.

### DPB-6 `[deploy-plugin DPB-6] Two-phase config loader + deploy schema re-home + frozen legacy union` · type:feat · p0 · beta.13 · +area:config
Scope: bootstrap-parse (identity+plugins+`deploy.targets` unstripped) → resolve schema loaders → compose target schema registry → full parse; unknown target ⇒ `DeployTargetAdapterMissingError` (the ONE deliberate behavior change); `DeployTargetBaseSchema` → core `./config`; `@netscript/config` keeps the loader seam + frozen delegating legacy union; `resolveDeploymentEnvironment` normalization (omitted Aspire env ⇒ production; alias registrations rejected). Anti-scope: no per-target member moves yet (DP-2 §6, SF-10, SG-5).
Gates: `- [ ] gate: installed-custom-target, missing-adapter, malformed-config, loader-failure and all existing-key tests pass` · `- [ ] gate: unknown key errors with the target-add hint — never silently stripped` · `- [ ] gate: bare + @production alias registration rejected`.
Deps: DPB-1. Shape: config bootstrap contract.

### DPB-7 `[deploy-plugin DPB-7] Extract deploy-baremetal (build pipeline, Servy/systemd, compat handlers)` · type:refactor · p1 · beta.13 · +area:cli
Scope: one target `baremetal`, variants `windows|linux`; receives the `deno compile` build pipeline and `BaremetalCompatibilityCommands` (legacy verbs keep exact shipped semantics; only build/status/logs alias, pinned to this target); public composition of the convention ports (closes `DEPLOY-BAREMETAL-PUBLIC-WIRING`); systemd live-probe suite cell. Anti-scope: no desktop packaging; no core compile-emitter graduation yet (DP-3 §2, SF-2/SF-9, KF-3/4).
Gates: `- [ ] gate: state-transition tests — stop never uninstalls, start never registers` · `- [ ] gate: full declared op set advertised at runtime (composition root wires ports)` · `- [ ] gate: legacy help/exit-code goldens unchanged` · `- [ ] gate: systemd live probe green on the probe lane`.
Deps: DPB-2, DPB-3. Shape: adapter extraction + compat handlers.

### DPB-8 `[deploy-plugin DPB-8] Extract deploy-aspire (target×op table, applier matrix, secret-safe state policy)` · type:refactor · p1 · beta.13 · +area:aspire
Scope: the target×op table (DP-3 §1) as the generated source of `operations`; `--list-steps` in pure plan; `aspire destroy` for canonical down; state-cache delegation under the SG-2 no-save secret policy (doctor fails closed on secret-mapped cache keys); `Parameters__*` secrets convention; per-variant `--prebuilt` applier rows (compose/kubernetes; azure absent until proven); adapter-neutral `runCapabilityCheck`; Radius watch (predicate-gated, DP-9 §3). Anti-scope: the pipeline STEP ships with DPB-17; legacy semantics preserved via the shim (DP-9 §2/§2a, SG-1/2/6/7).
Gates: `- [ ] gate: operations generated from the table — AST scan matches` · `- [ ] gate: sentinel secret absent from state cache/artifacts/argv/logs after a secret-resolving op` · `- [ ] gate: prebuilt applier digest-verifies before first mutation (per declared row)` · `- [ ] gate: legacy compose plan still publishes (shim goldens); canonical plan writes nothing`.
Deps: DPB-2, DPB-3, DPB-5, DPB-6. Shape: adapter extraction delegating to the aspire CLI.

### DPB-9 `[deploy-plugin DPB-9] Extract deploy-deno (honest manifest; no emit by design)` · type:refactor · p1 · beta.13
Scope: wrap the built-in `deno deploy` CLI (target key `deno-deploy`); manifest honesty rows (kv atomic per leaf conformance; `kv:queues`/`queue:consume` unsupported; cron lossless; sagas externalized); **`emit` deliberately not declared** (platform builds from source — declared-subset showcase); transitive unstable-scan improvement as follow-up note. Anti-scope: no CI-split claims on this target (DP-3 §3, KF-9).
Gates: `- [ ] gate: declared subset excludes emit; calling it yields DeployOperationUnsupportedError` · `- [ ] gate: manifest rows carry evidence ids from the suite` · `- [ ] gate: plan→up flow green against a live app (probe lane)`.
Deps: DPB-3, DPB-5. Shape: adapter extraction wrapping `deno deploy`.

### DPB-10 `[deploy-plugin DPB-10] Adapter-side config member schemas over the schema registry` · type:refactor · p1 · beta.13 · +area:config
Scope: per-target member schemas move to their adapters (spreading the base — R-DEPLOY-4); the deploy slice of `config-plugin-specific-schema-debt` retires. Anti-scope: legacy union keeps parsing all existing keys.
Gates: `- [ ] gate: all shipped target keys parse identically (golden configs)` · `- [ ] gate: config debt entry retired with evidence link`.
Deps: DPB-6, DPB-7, DPB-8, DPB-9. Shape: config re-home.

### DPB-11 `[deploy-plugin DPB-11] Legacy/config compatibility gate` · type:test · p1 · beta.13 · +area:cli
Scope: the first-class compatibility verification: golden argv/help/exit-code tests for every legacy verb; unknown-target error paths; artifact-side-effect goldens for legacy vs canonical Aspire paths. Anti-scope: no behavior fixes here — findings route to the owning card (SF-9/SF-10, SG-7).
Gates: `- [ ] gate: every documented deploy invocation covered by a golden` · `- [ ] gate: canonical-vs-legacy divergence is exactly the enumerated set (DP-6 §3)`.
Deps: DPB-6, DPB-7, DPB-8. Shape: compat test suite.

### DPB-12 `[deploy-plugin DPB-12] Host: CLI mount-children contribution contract` · type:feat · p1 · beta.13 · +area:plugins +area:cli
Scope: `CliCommandContribution {mount,id,loader,export}` + `withCliCommands` + abstract + merger/verifier; host-owned reserved mounts; duplicate `(mount,id)` fails before parsing naming both owners. Anti-scope: no shadowing of top-level commands, no plugin-specific exceptions (DP-4 §5, SF-4).
Gates: `- [ ] gate: duplicate and reserved-name collisions fail pre-parse with both owners` · `- [ ] gate: verify-plugin gains cliCommands expectations`.
Deps: none. Shape: `@netscript/plugin` contribution contract.

### DPB-13 `[deploy-plugin DPB-13] Host: async CLI bootstrap, loader isolation, plugin-absent UX` · type:feat · p1 · beta.13 · +area:cli
Scope: manifest-loader-fed async bootstrap (resolve manifests → validate safe loader subpaths → built-ins → contributed children → `program()`); loader failure isolation; install-hint when a mount's plugin is absent. Anti-scope: AST source walker does not feed this registry (SF-4).
Gates: `- [ ] gate: one broken plugin cannot take down the CLI (isolation test)` · `- [ ] gate: absent-plugin mount prints the install hint` · `- [ ] gate: startup-time budget unchanged for plugin-less projects`.
Deps: DPB-12. Shape: CLI bootstrap change.

### DPB-14 `[deploy-plugin DPB-14] Host: doctor-checks as data + installer tooling variant + contributionAxes` · type:feat · p1 · beta.13 · +area:plugins
Scope: `DoctorCheckContribution {id, loader}` duplicate-guarded registry (auth migrates compatibly); `officialSource` `sourceKind:'tooling'` variant; `capabilities.contributionAxes`; v1 service manifests keep parsing. Anti-scope: no closed-union widening; no deploy-specific protocol fields (SF-3/SF-14).
Gates: `- [ ] gate: auth doctor check migrates with zero behavior change` · `- [ ] gate: schema parse + official copy/install + backward-compat fixtures green`.
Deps: none. Shape: protocol generalization.

### DPB-15 `[deploy-plugin DPB-15] plugins/deploy: manifest triad, descriptor composition root, verify-plugin` · type:feat · p1 · beta.13 · +area:plugins
Scope: A5 plugin — protocol-valid tooling manifest; `DeployTargetContribution` descriptors resolved from the generated registry module (plugin depends on core ONLY; per-target permission profiles); doctor `deploy-target` check (states incl. adapter-not-installed/credential-unavailable; orphaned declarations); verify-plugin green. Anti-scope: no static adapter imports; no HTTP service (DP-4 §1–§3, SF-12).
Gates: `- [ ] gate: missing-peer/invalid-export/duplicate-key/uninstall/stale-registry tests` · `- [ ] gate: verify-plugin passes with the declared axes` · `- [ ] gate: plugin imports core only (import-graph)`.
Deps: DPB-5, DPB-9, DPB-10, DPB-12, DPB-14. Shape: thin A5 plugin.

### DPB-16 `[deploy-plugin DPB-16] Plugin CLI children: target add/remove, capabilities, cells apply, eight-op router` · type:feat · p1 · beta.13 · +area:cli
Scope: children under the `deploy` mount — `target add|remove` (descriptor + settings member + assets; remove never edits `deploy/targets.ts`, `--keep-config`/`--purge-assets`), `capabilities [--json|--preview]` (bundled published-manifest preview catalog, honestly labeled), `cells apply` (diff shown), the eight-op router with the locked grammar sketch (`--env`, `secrets set|list|unset`, `rollback [--to]`, `emit [--output]`, `down [--yes]`). Anti-scope: no top-level command additions (DP-4 §6, KF-5/10/11/12).
Gates: `- [ ] gate: capabilities --json validates against the published schema incl. schemaVersion` · `- [ ] gate: target remove leaves deploy/targets.ts untouched; doctor flags orphans` · `- [ ] gate: cells apply materializes suggested-cells.json with a shown diff`.
Deps: DPB-13, DPB-15. Shape: plugin CLI contribution.

### DPB-17 `[deploy-plugin DPB-17] Scaffolder: deploy/ leaf, Story-0 assets, conditional capability-check pipeline step` · type:feat · p1 · beta.13
Scope: userland `deploy/targets.ts` leaf + per-target assets on `target add` (golden test per emitter); the **conditional** `netscript-capability-check` Aspire pipeline step (plugin present + ≥1 Aspire descriptor; snapshot-verified via the single compiler entrypoint; standardized failure with recovery command). Anti-scope: no `init --deploy` sugar (deferred fork) (DP-4 §4, SG-3/SG-4, KF-2).
Gates: `- [ ] gate: no plugin ⇒ generated AppHost has no step import; aspire start/deploy valid` · `- [ ] gate: step verdict parity with CLI plan over one snapshot` · `- [ ] gate: goldens for every emitted artifact`.
Deps: DPB-5, DPB-8, DPB-15. Shape: plugin scaffold contribution.

### DPB-18 `[deploy-plugin DPB-18] Story-0 scaffold.runtime E2E (install → target add → plan)` · type:test · p1 · beta.13 · +area:cli
Scope: registered `scaffold.runtime` case: `plugin install deploy` → `deploy target add deno-deploy` → `deploy deno-deploy plan` on a generated workspace. Anti-scope: live platform deploys stay on probe lanes.
Gates: `- [ ] gate: the case is registered in runtime-gates and green in the merge-readiness suite`.
Deps: DPB-16, DPB-17. Shape: e2e registration.

### DPB-19 `[deploy-plugin DPB-19] deploy-events stream, telemetry, runtime-config topic` · type:feat · p2 · beta.13 · +area:telemetry
Scope: versioned `deploy-events` envelope (started/succeeded/failed/rolled-back; target+variant, env, artifact digest, actor, trace ctx); telemetry spans with secret redaction; tiny `deploy` runtime-config topic (checked per invocation). Anti-scope: core deploy success never depends on the stream sink.
Gates: `- [ ] gate: sink outage cannot fail a deploy (fault test)` · `- [ ] gate: sentinel secret absent from events/spans`.
Deps: DPB-15. Shape: plugin contributions.

### DPB-20 `[deploy-plugin DPB-20] deploy-container: OCI build/push + ContainerBuildPort + Dockerfile emission` · type:feat · p1 · beta.15
Scope: `ContainerBuildPort` implementation (Dockerfile generation from `EmittedArtifactManifest`, `denoland/deno:2` base; build/push via docker/podman; registry auth); the generic container-platform port. Anti-scope: no platform clients here; injected into cloudflare/aws lanes — never imported (DP-3 §4, SF-11).
Gates: `- [ ] gate: emitted Dockerfile goldens` · `- [ ] gate: image digest recorded in the artifact manifest and verified by up --prebuilt`.
Deps: DPB-5. Shape: new adapter (injectable shared path).

### DPB-21 `[deploy-plugin DPB-21] Thin platform clients: fly, koyeb, sevalla, coolify, dokploy + live smokes` · type:feat · p1 · beta.15
Scope: subpath REST clients mapping the generic port (managed: fly Machines API, koyeb, sevalla; self-hosted: coolify, dokploy with base URL + token env names); live smokes ≥1 managed + ≥1 self-hosted. Anti-scope: graduation to own package only per the OF-2 rule.
Gates: `- [ ] gate: one shared conformance run per client` · `- [ ] gate: live smoke green on one managed + one self-hosted platform (probe lane)`.
Deps: DPB-20. Shape: subpath REST clients.

### DPB-22 `[deploy-plugin DPB-22] Container scaffold story (Story 3) + artifact goldens` · type:feat · p2 · beta.15
Scope: `target add fly|koyeb|sevalla|coolify|dokploy` assets (Dockerfile + compose parity, workflows, env-name contracts). Anti-scope: platform add-on catalogs only where leaf backings exist.
Gates: `- [ ] gate: goldens for every emitted artifact` · `- [ ] gate: workflows reference only documented secret/OIDC contracts`.
Deps: DPB-17, DPB-20. Shape: scaffold assets.

### DPB-23 `[deploy-plugin DPB-23] CF-PROBE: live Workers conformance, Miniflare fidelity, token story` · type:feat · p1 · beta.16
Scope: findings-only probe — live Workers deploy of a NetScript service; Miniflare-vs-production fidelity; `nodejs_compat` coverage for the service runtime's touchpoints; CI token story (no OIDC on CF). Anti-scope: no adapter code ships from this card.
Gates: `- [ ] gate: probe report committed with live evidence ids` · `- [ ] gate: go/no-go recommendation for DPB-24 recorded`.
Deps: DPB-5. Shape: probe card, findings-only.

### DPB-24 `[deploy-plugin DPB-24] deploy-cloudflare (workers variant) + Story 1` · type:feat · p1 · beta.16
Scope: wrangler wrap (emitted `wrangler.jsonc` + Web-standard worker entry over `ServiceApp.fetch`); workers-variant manifest (sagas rejected, kv:atomic unsupported, long-running unsupported); `suggestedCells` flow to a containers cell via injected `ContainerBuildPort`; Story-1 scaffold assets. Anti-scope: CF Queues consumption is leaf territory; one compute variant per declaration (L-7, DP-3 §5).
Gates: `- [ ] gate: ships only behind CF-PROBE pass` · `- [ ] gate: plan rejects isolate-exceeding graphs with suggestedCells` · `- [ ] gate: conformance cells for every claimed verdict`.
Deps: DPB-20, DPB-23. Shape: probe-gated adapter.

### DPB-25 `[deploy-plugin DPB-25] Vercel probe + deploy-vercel (Build Output API) + Story 4` · type:feat · p1 · beta.16
Scope: probe (minimal service through `.vercel/output` → live deploy → HTTP conformance) then the adapter (Build Output API v3 emission, `vercel deploy --prebuilt`; Node runtime default, `vercel-deno` opt-in with version-lag warning) + Story-4 assets. Anti-scope: marketplace backings are leaf cards.
Gates: `- [ ] gate: .vc-config.json emission validated by the live probe before adapter claims` · `- [ ] gate: conformance cells for claimed verdicts`.
Deps: DPB-5, DPB-17. Shape: probe-gated adapter.

### DPB-26 `[deploy-plugin DPB-26] AWS-PROBE-HTTP: live Lambda Web Adapter conformance` · type:feat · p1 · beta.16
Scope: findings-only probe — LWA container (denoland/deno image) behind Function URL/API GW; OIDC role-assume CI auth. Anti-scope: NO event/queue claims (SQS semantics are leaf territory, DPB-29).
Gates: `- [ ] gate: probe report with live evidence ids` · `- [ ] gate: go/no-go for DPB-27 recorded`.
Deps: DPB-20. Shape: probe card, findings-only.

### DPB-27 `[deploy-plugin DPB-27] deploy-aws (lambda variant, HTTP scope) + Story 2` · type:feat · p1 · beta.16
Scope: LWA container path via injected `ContainerBuildPort`; lambda-variant manifest (HTTP rows only; queue consume unverified with the leaf-card note); optional `./pulumi` subpath (Automation API); Story-2 assets with the OIDC role-trust snippet. Anti-scope: HTTP-only until AWS event probes pass (OF-8, L-7).
Gates: `- [ ] gate: ships only behind AWS-PROBE-HTTP pass` · `- [ ] gate: no event-semantics claims anywhere in manifest or docs` · `- [ ] gate: conformance cells for claimed verdicts`.
Deps: DPB-26. Shape: probe-gated adapter, HTTP scope.

### DPB-28 `[deploy-plugin DPB-28] Docs: target-matrix reference + per-target how-tos replace the alpha-minimal page` · type:docs · p1 · beta.13 · +area:docs
Scope: the docs IA from the doc-story forecast (getting-started `plan → up` on deno-deploy; capabilities/doctor reference incl. `unverified` vs `unsupported`; migration page; per-target how-tos landing with their adapters). Anti-scope: no capability claims beyond shipped manifests; public-docs hygiene.
Gates: `- [ ] gate: docs accuracy eval green (docs gate)` · `- [ ] gate: every claim traces to a shipped manifest or command`.
Deps: DPB-16 (rolling; first tranche with W3). Shape: docs consolidation.

### DPB-29 `[deploy-plugin DPB-29] Deferred RFC: AWS event semantics, leaf backing graduation, Radius target graduation` · type:feat · p2 · Backlog / Triage
Scope: RFC-first — SQS/event conformance design (leaf co-owned); leaf backing catalog graduation (kv/queue provider adapters); Radius as a descriptor-selected `deploy-aspire` variant behind machine-verifiable predicates (pinned CLI ≥ first TS-API release; `deno check` fixture; `app.bicep` emission; Radius step in `--list-steps`; recipe-binding fixture; per-environment capabilities `unverified` until probed). Anti-scope: no implementation from this card.
Gates: `- [ ] gate: RFC lands with owner-arbitrated forks before any implementation card is filed`.
Deps: DPB-27. Shape: RFC-first, leaf/upstream co-owned.

## Post-steps

1. Update epic body `## Children` with live numbers.
2. `FILING-LOG.md` (DPB-id → live number map + label/milestone actions) committed to the run dir.
3. Supersession (per RFC §6): close #824 with successor pointer; pointer comments on #823/#327/#454 (no closes); #451/#453/#455 untouched (KEEP).
4. PR #891 filing comment; labels.yml parity noted as follow-up.
