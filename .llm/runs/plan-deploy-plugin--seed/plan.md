# Plan — plan-deploy-plugin--seed

> **Draft — no GitHub mutation.** Generator-stage plan (Fable 5 · xhigh), **revision r2**: the
> Sol-xhigh constructive adversarial pass (`adversarial-sol.md`, SF-1…SF-16) is integrated —
> all sixteen findings accepted (`adversarial-sol-triage.md`). Pending: Kimi-K3 doc-driven story
> pass, generator integration, then (supervisor decision) formal PLAN-EVAL and owner
> ratification. Nothing below files, closes, or edits any issue/PR/milestone/label.

## 1. Scope statement

Design (not implement) the NetScript **deploy plugin family** — `@netscript/plugin-deploy` +
`@netscript/plugin-deploy-core` + per-cloud adapters — composed exactly like the auth plugin,
under the goal frame "Deno native first, then Node compat where needed", including the migration
of the entire shipped deploy layer, per-layer plugin contributions, provider-optimized scaffold
stories, and a selective-wrapping map. Deliverable = this run's canonical corpus
(`design/canonical/DP-0…DP-8`) + this plan; a future stage H files the board from it.

**Archetype statement** (plan-gate requirement): composite **Archetype 7** delivered as
**A5 plugin + A2 core + A2 adapters** (DP-1 §3); scope overlays: none (framework/plugin design;
docs refresh is a mapped consequence, not an overlay-driven docs run). Current doctrine verdict
inputs and in-scope anti-patterns: `research/doctrine-constraints.md` §5/§7 (AP-3, AP-4, AP-9,
AP-11, AP-13/14/16/19, AP-22–25; F-DEPLOY-1/2 flip to `gated`).

## 2. Locked decisions (with rationale pointers)

| # | Decision | Where argued |
| --- | --- | --- |
| LD-1 | Family topology: `plugins/deploy` (A5) + `plugin-deploy-core` (A2) + adapters `deploy-aspire`, `deploy-baremetal`, `deploy-deno`, `deploy-container` (+ thin PaaS subpaths), probe-gated `deploy-cloudflare` / `deploy-vercel` / `deploy-aws` | DP-1 §1 |
| LD-2 | Dependency law R-GRAPH-1…5 r2: core imports **no leaf package** (structural capability contracts); **no `deploy-*` imports another `deploy-*`** (`ContainerBuildPort` by injection); the plugin depends only on core and composes **descriptors**; leaf backings leaf-owned; CLI = presentation | DP-1 §2 |
| LD-3 | **Eight-op** lifecycle `<target> <op>` locked: `plan` pure (serializable `DeploymentPlan`), `emit` materializes artifacts + provenance, `up --prebuilt` consumes them; legacy flat verbs = first-class compat handlers owned by `deploy-baremetal` until next semver-major (only build/status/logs alias) | DP-2 §2 |
| LD-4 | Capability contracts are structural (`CapabilityRef` namespaced+versioned, `BindingRequirement`, `WorkloadConstraint`); verdicts carry `scope` + `level` (incl. `unverified`) + evidence; manifests are per target-**variant**; build-time rejection compiler; backend-truthful; sagas tri-state; `lossless` requires a live cell | DP-2 §4 |
| LD-5 | Bindings are declarative name+kind transport; deploy never resolves leaf semantics. Topology: `DeploymentCell`/`DeploymentTopologyPlan`; v1 cells are **user-declared**; the compiler returns `suggestedCells` but rejects, never partitions silently | DP-2 §5 |
| LD-6 | Multi-target duplicate-rejecting registry (**empty in core** — no `DEFAULT_DEPLOY_TARGETS`; rejection is NEW behavior, `DeployTargetCollisionError`); environments overlay; **two-phase config loader** (unknown target ⇒ error, never silently stripped) | DP-2 §6 |
| LD-7 | Wrap map: wrangler / Build Output API / `deno deploy` / Machines+PaaS REST / LWA / Pulumi Automation API; Serverless v4 rejected; Nitro reference-only with conditional re-entry | DP-5 |
| LD-8 | No resident service/contract in v1; capability manifest + CLI JSON is the machine surface | DP-4 §2 |
| LD-9 | Three named host extensions, generic and data-driven: CLI **mount-children** contribution + async bootstrap (host-owned reserved mounts, no shadowing, duplicate `(mount,id)` fails); doctor-check contributions as data (`{id, loader}` registry — no union widening); installer-protocol `sourceKind:'tooling'` variant + `capabilities.contributionAxes` (no deploy-specific flag) | DP-4 §5 |
| LD-10 | **Refactor-then-extract** (W1 sub-sliced; build engine moves W2 to `deploy-baremetal`; `runtime-overrides.ts` stays leaf-side); e2e:cli invariant per sub-slice; compatibility contract (config keys + verbs survive with exact semantics; unknown-target error is the one documented change; Aspire unchanged in behavior) | DP-2, DP-6 |
| LD-11 | Provider-optimized scaffolds select leaf backings via per-target catalogs; app code never forks per provider | DP-7/DP-8 |
| LD-12 | Desktop packaging out of family (epic #830 boundary) | DP-3 §8, DP-6 M-16 |

## 3. Owner-fork sweep (numbered; none silently taken)

| Fork | Question | Recommendation (argued at) | Alternative |
| --- | --- | --- | --- |
| OF-1 | Core package name | `@netscript/plugin-deploy-core` (auth parity; DP-1 §1) | `@netscript/deploy-core` (kickoff literal) |
| OF-2 | Thin PaaS packaging | Subpaths of `deploy-container`; graduate on SDK need (DP-1 §1) | One package per platform from day one |
| OF-3 | CLI delivery | (r2, SF-4) Host-owned reserved `deploy` shell (owns `desktop`, help, install hint); plugin contributes the **children** under that mount — never shadows top-level (DP-4 §6) | Fully plugin-owned group with a shadowing exception (rejected: makes a generic host facility plugin-aware) |
| OF-4 | v1 service surface | None; CLI+manifest machine surface; service seam deferred rework-safe (DP-4 §2) | Ship a deploy service + contracts/v1 now |
| OF-5 | Legacy verb handling | (r2, SF-9 — flipped) First-class compat handlers owned by `deploy-baremetal` through next semver-major; only build/status/logs alias; no minor-release removal claim (DP-6 M-11) | Two-minor-release alias-and-remove (rejected: `start`/`stop`/`copy`/`upgrade` semantics are not `up`/`down`-equivalent) |
| OF-6 | Board/milestone relation | New `epic:deploy-plugin` umbrella **supersedes #824** (unified-runtime seed) and re-scopes #823's deploy half; W1–W3 → `0.0.1-beta.13`, W4–W5 → beta.14/stable; #825 (Aspire NuGet packaging) unaffected | Fold under #823 as-is; or all-waves one milestone |
| OF-7 | Nitro | No dependency; reference corpus + L-1-gated re-entry as optional emitter package (DP-5 §3) | Commission `deploy-nitro` emitter in first waves |
| OF-8 | AWS first-wave scope | HTTP-only until AWS-PROBE-EVENTS passes (DP-3 §7) | Commit full event surface in W5 |

Open decisions not taken and safe to defer (plan-gate sweep): cloud-run re-home timing (W4
micro-decision, DP-6 M-9); `--deploy <provider>` at `init` vs post-init `target add` only (pure
UX addition, additive); deploy dashboard service (seam priced, OF-4); secrets rotation
overlap-window card (follow-up debt, DP-6 §2). None forces rework if deferred — each lands
behind an already-designed seam.

## 4. Milestone / wave train (pending OF-6)

```
W1 core extraction ──► W2 adapter extraction ──► W3 pluginization ──► W4 container path ──► W5 probe-gated clouds
        └────────────── 0.0.1-beta.13 ──────────────┘                └──── beta.14 / stable ────┘
```

Cross-epic edges: host extensions (LD-9) precede W3; frontend-contrib seed run (parallel) is a
**consumer**, not a dependency; #830 desktop consumes `deploy-baremetal`'s compile primitives at
most; leaf backing packages (kv/queue provider adapters) are separate leaf-owned cards that W5
scaffold catalogs reference but do not block on (catalog rows say `external` until they exist).

## 5. Draft board sketch (stage-H input; full bodies authored at integration)

(r2 — recut per SF-15: oversized W1/host children split, the compatibility gate added,
dependencies corrected.) Mirrors the enterprise-auth template with its defects fixed
(`research/board-parity-871-887.md` §4): single **`DPB-n`** id scheme used in titles AND
cross-references (distinct from the `DP-N` design-doc numbering), every child milestoned, p0
milestoned, consistent status, GitHub-native sub-issues. **29 children** (< 30); each body names
files, an anti-scope boundary, and the smallest proof command; the expensive full runtime E2E
remains a **wave exit gate**, not an intermediate loop.

| ID | Title (draft) | Wave | Pri | Delivery shape | Depends on |
| --- | --- | --- | --- | --- | --- |
| EPIC | Epic: Deploy plugin family (`type:umbrella`, `epic:deploy-plugin`, `area:cli` `area:plugin`) | — | p1 | umbrella; epic-acceptance gates from DP-8 + conformance matrix; each wave exit includes its docs refresh | — |
| DPB-1 | Move deploy port/result/error contracts to core behind compatibility re-exports | W1 | **p0** | contracts move, no behavior change | — |
| DPB-2 | Move pure conventions (activation/secrets/rollback/otel/health-gate) with their constants | W1 | p1 | conventions move; `runtime-overrides.ts` stays leaf-side | DPB-1 |
| DPB-3 | Empty duplicate-rejecting core registry + CLI compatibility composition root | W1 | p0 | NEW rejection behavior + externalized defaults | DPB-1 |
| DPB-4 | Host-owned `deploy` shell split (desktop preserved) + router rewired over contracts | W1 | p1 | thin-router refactor, no verb changes | DPB-1, DPB-3 |
| DPB-5 | Capability + topology contracts (`CapabilityRef`/verdicts/variants; `DeploymentCell`/`suggestedCells`) + rejection compiler + conformance harness | W1 | **p0** | core contract, backend-truthful | DPB-1 |
| DPB-6 | Two-phase config loader + base schema re-home + frozen legacy union | W1 | **p0** | config bootstrap contract (unknown target ⇒ error) | DPB-1 |
| DPB-7 | Extract `deploy-baremetal` (build behavior, Servy/systemd, `BaremetalCompatibilityCommands`, systemd live probe) | W2 | p1 | adapter over core port + compat handlers | DPB-2, DPB-3 |
| DPB-8 | Extract `deploy-aspire` | W2 | p1 | adapter delegating to aspire CLI | DPB-2, DPB-3 |
| DPB-9 | Extract `deploy-deno` (+ honest manifest rows; transitive-scan follow-up) | W2 | p1 | adapter wrapping `deno deploy` | DPB-3, DPB-5 |
| DPB-10 | Adapter-side config member schemas over the schema registry (config debt retirement) | W2 | p1 | config re-home | DPB-6, DPB-7–DPB-9 |
| DPB-11 | Legacy/config compatibility gate: state-transition + help goldens + unknown-target error paths | W2 | p1 | first-class compat verification (SF-9/SF-10) | DPB-7, DPB-6 |
| DPB-12 | Host: CLI mount-children contribution contract/builder/merger/verifier | pre-W3 | p1 | `@netscript/plugin` change | — |
| DPB-13 | Host: async CLI bootstrap, mount collision rules, loader isolation, plugin-absent behavior | pre-W3 | p1 | CLI bootstrap change | DPB-12 |
| DPB-14 | Host: doctor-check contributions as data + installer-protocol `tooling` variant + `contributionAxes` | pre-W3 | p1 | protocol generalization (auth migrates compatibly) | — |
| DPB-15 | `plugins/deploy`: manifest triad, descriptor composition root, verify-plugin expectations | W3 | p1 | thin A5 plugin (depends on extracted adapters + schema loader) | DPB-5, DPB-9, DPB-10, DPB-12, DPB-14 |
| DPB-16 | Plugin CLI children under the `deploy` mount: `target add/remove`, `capabilities --json`, eight-op router | W3 | p1 | plugin CLI contribution | DPB-13, DPB-15 |
| DPB-17 | Scaffolder: `deploy/targets.ts` leaf + Story-0 assets + golden tests | W3 | p1 | plugin scaffold contribution | DPB-15 |
| DPB-18 | Story-0 `scaffold.runtime` E2E case (`install deploy` → `target add deno-deploy` → `plan`) | W3 | p1 | e2e registration | DPB-16, DPB-17 |
| DPB-19 | `deploy-events` stream + telemetry + runtime-config topic | W3 | p2 | plugin contributions | DPB-15 |
| DPB-20 | `deploy-container`: OCI build/push, `ContainerBuildPort` impl, Dockerfile emission | W4 | p1 | new adapter (injectable shared path) | DPB-5 |
| DPB-21 | Thin platform client tranche (fly/koyeb/sevalla/coolify/dokploy) + live smokes (≥1 managed, ≥1 self-hosted) | W4 | p1 | subpath REST clients | DPB-20 |
| DPB-22 | Container scaffold story (Story 3) + generated-artifact goldens | W4 | p2 | scaffold assets | DPB-17, DPB-20 |
| DPB-23 | CF-PROBE: live Workers conformance, Miniflare fidelity, token story | W5 | p1 | probe card, findings-only | DPB-5 |
| DPB-24 | `deploy-cloudflare` (workers variant) + Story 1 | W5 | p1 | probe-gated adapter; containers cell via injected OCI path | DPB-20, DPB-23 |
| DPB-25 | Vercel probe + `deploy-vercel` (Build Output API) + Story 4 | W5 | p1 | probe-gated adapter | DPB-5, DPB-17 |
| DPB-26 | AWS-PROBE-HTTP (live LWA conformance) | W5 | p1 | probe card, findings-only | DPB-20 |
| DPB-27 | `deploy-aws` (lambda variant, HTTP scope) + Story 2 | W5 | p1 | probe-gated adapter, HTTP-only | DPB-26 |
| DPB-28 | Docs: target-matrix reference + per-target how-tos replace the alpha-minimal page | W3–W5 | p1 | docs consolidation (wave exits carry interim refreshes) | rolling |
| DPB-29 | Deferred RFC: AWS-PROBE-EVENTS + leaf backing catalog graduation | backlog | p2 | RFC-first, leaf co-owned | DPB-27 |

(Each future body: `Part of #EPIC` → scoping paragraph with anti-scope boundary →
`- [ ] gate:` acceptance → `Dependencies:` + `Delivery shape:` — per board-parity conventions.)

## 6. Risk register

| Risk | Sev | Mitigation |
| --- | --- | --- |
| Extraction destabilizes the CLI's largest feature | high | Behavior-freeze slices; e2e:cli gate per slice; desktop split isolated (DP-6 R-M1/R-M4) |
| Capability vocabulary designed wrong (too coarse/fine) | ~~high~~ resolved (r2) | SF-6 adopted: structural namespaced+versioned `CapabilityRef`s with scoped verdicts — leaves grow without core edits or manifest rot; residual risk is descriptor-authoring discipline, covered by the conformance-cell gate |
| Host-axis creep (`cli-command` opens a contribution firehose) | med | Closed collision rules; one axis, typed registry; doctrine 11 promotion test governs future axes |
| Probe failures strand W5 adapters | med | Probes are findings-first cards; adapters ship only behind passing probes (L-7); W1–W4 value is independent of W5 |
| Provider surface drift (wrangler/Vercel/Deno Deploy move fast) | med | Wrap at CLI process boundaries; compatibility dates pinned in emitted configs; manifest notes carry dates; conformance suite re-run per upgrade |
| Live-probe CI cost/credentials | med | Probe lanes are manually-triggered/secret-gated workflows, not default CI; in-memory suite covers default CI |
| JSR surface growth (6+ new packages) | med | OF-2 subpath folding; F-5 export budgets; publish dry-run + jsr-audit per package before any release wave |
| Leaf-backing dependency (catalog rows need leaf adapters that don't exist) | med | Catalog rows degrade to `external` honestly (DP-7 §2); leaf cards tracked separately (DPB-29) |
| Monorepo gap on Deno Deploy git integration | low | Local-source deploys unaffected; noted in manifest; revisit on platform changelog |

## 7. Gates (selection from `archetype-gate-matrix.md`)

Per DP-1 §3: A5 set for the plugin (+R-PLUGIN-PARITY checklist), full A2 set for core and every
adapter, A7 union + F-DEPLOY-1/2 flipped to `gated` at W1, plus: `quality:scan`, `arch:check`,
scoped check/lint/fmt wrappers, `deno doc --lint`, publish dry-run, jsr-audit per package,
`scaffold.runtime` e2e (Story 0) at W3, conformance suite matrix from W2 on.

**jsr-audit on planned surfaces** (plan-gate item 8): no oRPC contract in core or plugin v1 ⇒ no
`--allow-slow-types` exception anywhere in the family (auth's sanctioned exception is *not*
inherited); adapters keep vendor CLIs at process boundaries so no vendor types can leak into
public signatures (AP-14 guarded by F-15); export budgets per subpath ≤ 20 (F-5); string-constant
templates for all emitted artifacts (JSR text-import doctrine).

## 8. Debt implications

Retires: `DEPLOY-ARCHETYPE-7-CORE-SEED`, `DEPLOY-SECRETS-ROLLBACK-CORE`,
`DEPLOY-BAREMETAL-PUBLIC-WIRING`, deploy slice of `config-plugin-specific-schema-debt`,
container half of `cli-deploy-artifacts-missing`, `cli-deploy-linux-integration-untested`
(as probe cell). Opens: doctrine 06/11 A7-plugin-delivery amendment; deno-deploy transitive
unstable scan; secrets rotation overlap-window. Details: DP-6 §2.

## 9. Deferred scope (explicit)

Frontend contribution axis (parallel seed run `plan/frontend-contrib`); leaf provider backing
packages (`kv-cloudflare`, `queue-sqs`, DO saga store — leaf-owned cards); desktop packaging
(#830); Netlify/Railway/Render/GKE adapters (open registry, community path); Nitro emitter
(OF-7 conditional); deploy dashboard service (OF-4 seam); secrets rotation overlap-window;
AWS event semantics (DPB-29).

## 10. Downstream passes

**Sol adversarial — DONE (r2).** `adversarial-sol.md` (SF-1…SF-16, all accepted), triage in
`adversarial-sol-triage.md`; every attack item from r1 §10 produced an adopted amendment
(capability structure, mount-children CLI axis, plan/emit split, W1 recut, manifest honesty).

**Kimi K3 doc-story — pending.** Write the public docs as if W3 shipped (install → `target add`
→ `plan`/`emit`/`up` per story, capability output, doctor); surface every DX seam the docs
cannot explain — those are design bugs to report back, not to fix in docs.
