# Plan — plan-deploy-plugin--seed

> **Draft — no GitHub mutation.** Generator-stage plan (Fable 5 · xhigh). Pending: supervisor-
> dispatched Sol-xhigh constructive adversarial pass, Kimi-K3 doc-driven story pass, generator
> integration, then (supervisor decision) formal PLAN-EVAL and owner ratification. Nothing below
> files, closes, or edits any issue/PR/milestone/label.

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
| LD-2 | Dependency law R-GRAPH-1…5 (leafward types only; adapters→core+one provider; plugin composes; leaf backings leaf-owned; CLI = presentation) | DP-1 §2 |
| LD-3 | 7-op verb vocabulary `<target> <op>` locked; `plan` subsumes emit; legacy flat verbs = deprecated bare-metal aliases | DP-2 §2 |
| LD-4 | Capability manifest + build-time rejection compiler in core; backend-truthful; sagas tri-state | DP-2 §4 |
| LD-5 | Bindings are declarative name+kind transport; deploy never resolves leaf semantics | DP-2 §5 |
| LD-6 | Multi-target registry (auth's single-active inverted); environments overlay in config | DP-2 §6 |
| LD-7 | Wrap map: wrangler / Build Output API / `deno deploy` / Machines+PaaS REST / LWA / Pulumi Automation API; Serverless v4 rejected; Nitro reference-only with conditional re-entry | DP-5 |
| LD-8 | No resident service/contract in v1; capability manifest + CLI JSON is the machine surface | DP-4 §2 |
| LD-9 | Three named host extensions: `cli-command` axis, doctor-union widening, `contributesDeployTargets` flag | DP-4 §5 |
| LD-10 | Behavior-preserving extraction first; e2e:cli invariant; compatibility contract (config keys + verbs survive; Aspire unchanged in behavior) | DP-6 |
| LD-11 | Provider-optimized scaffolds select leaf backings via per-target catalogs; app code never forks per provider | DP-7/DP-8 |
| LD-12 | Desktop packaging out of family (epic #830 boundary) | DP-3 §8, DP-6 M-16 |

## 3. Owner-fork sweep (numbered; none silently taken)

| Fork | Question | Recommendation (argued at) | Alternative |
| --- | --- | --- | --- |
| OF-1 | Core package name | `@netscript/plugin-deploy-core` (auth parity; DP-1 §1) | `@netscript/deploy-core` (kickoff literal) |
| OF-2 | Thin PaaS packaging | Subpaths of `deploy-container`; graduate on SDK need (DP-1 §1) | One package per platform from day one |
| OF-3 | CLI delivery | Plugin-contributed group + built-in shim (DP-4 §6) | Group stays built-in; plugin only registers targets |
| OF-4 | v1 service surface | None; CLI+manifest machine surface; service seam deferred rework-safe (DP-4 §2) | Ship a deploy service + contracts/v1 now |
| OF-5 | Legacy verb deprecation window | Warn from W2, remove after two minor releases (DP-6 M-11) | Keep aliases indefinitely |
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

Mirrors the enterprise-auth template with its defects fixed
(`research/board-parity-871-887.md` §4): single `DP-N` id scheme, every child milestoned, p0
milestoned, consistent status, GitHub-native sub-issues.

| ID | Title (draft) | Wave | Priority | Delivery shape | Depends on |
| --- | --- | --- | --- | --- | --- |
| EPIC | Epic: Deploy plugin family (`type:umbrella`, `epic:deploy-plugin`, `area:cli` `area:plugin`) | — | p1 | umbrella; epic-acceptance gates from DP-8 + conformance matrix | — |
| DP-1 | Extract `plugin-deploy-core` (ports, registry, conventions, build, config base) | W1 | **p0** | core extraction, no vendor work | — |
| DP-2 | Capability manifest + rejection compiler + conformance-suite harness | W1 | p0 | core contract, backend-truthful | DP-1 |
| DP-3 | Re-wire CLI deploy group over core; verb lock + desktop routing split | W1 | p1 | thin-router rewire | DP-1 |
| DP-4 | Extract `deploy-baremetal` (+ compose public wiring; systemd live probe) | W2 | p1 | adapter over core port | DP-1 |
| DP-5 | Extract `deploy-aspire` | W2 | p1 | adapter delegating to aspire CLI | DP-1 |
| DP-6 | Extract `deploy-deno` (+ manifest honesty rows; transitive-scan follow-up) | W2 | p1 | adapter wrapping `deno deploy` | DP-1, DP-2 |
| DP-7 | Adapter-side config members + schema registry (config debt retirement) | W2 | p1 | config re-home | DP-4–DP-6 |
| DP-8 | Host extensions: `cli-command` axis, doctor union, capability flag | W2 | p1 | `@netscript/plugin` core change | — |
| DP-9 | `plugins/deploy`: manifest triad, composition root, doctor, verify-plugin | W3 | p1 | thin A5 plugin | DP-2, DP-8 |
| DP-10 | Plugin CLI mount + shim; `target add/remove`, `capabilities --json` | W3 | p1 | plugin CLI contribution | DP-3, DP-9 |
| DP-11 | Scaffolder: `deploy/targets.ts` leaf + per-target assets + Story-0 e2e | W3 | p1 | plugin scaffold contribution | DP-9 |
| DP-12 | `deploy-events` stream + telemetry + runtime-config topic | W3 | p2 | plugin contributions | DP-9 |
| DP-13 | `deploy-container` core path + fly/koyeb/sevalla/coolify/dokploy clients | W4 | p1 | new adapter + subpath clients | DP-2 |
| DP-14 | Container scaffold story (Story 3) + generated Dockerfile golden tests | W4 | p2 | scaffold assets | DP-11, DP-13 |
| DP-15 | CF-PROBE (live Workers conformance, Miniflare fidelity, token story) | W5 | p1 | probe card, findings-only | DP-2 |
| DP-16 | `deploy-cloudflare` adapter + Story 1 scaffold | W5 | p1 | probe-gated adapter | DP-15 |
| DP-17 | Vercel probe + `deploy-vercel` + Story 4 | W5 | p1 | probe-gated adapter | DP-2 |
| DP-18 | AWS-PROBE-HTTP + `deploy-aws` (HTTP scope) + Story 2 | W5 | p1 | probe-gated adapter, HTTP-only | DP-13 |
| DP-19 | Docs refresh: target-matrix reference + per-target how-tos (per wave) | W1–W5 | p1 | docs consolidation | rolling |
| DP-20 | Deferred RFC: AWS-PROBE-EVENTS + leaf backing catalog graduation | backlog | p2 | RFC-first, leaf co-owned | DP-18 |

(≈21 children; each future body: `Part of #EPIC` → scoping paragraph with anti-scope boundary →
`- [ ] gate:` acceptance → `Dependencies:` + `Delivery shape:` — per board-parity conventions.)

## 6. Risk register

| Risk | Sev | Mitigation |
| --- | --- | --- |
| Extraction destabilizes the CLI's largest feature | high | Behavior-freeze slices; e2e:cli gate per slice; desktop split isolated (DP-6 R-M1/R-M4) |
| Capability vocabulary designed wrong (too coarse/fine) | high | Vocabulary derived from shipped port set + prior-run L/P/U grid; reviewed in Sol pass; versioned schema so rows can be added without breaking |
| Host-axis creep (`cli-command` opens a contribution firehose) | med | Closed collision rules; one axis, typed registry; doctrine 11 promotion test governs future axes |
| Probe failures strand W5 adapters | med | Probes are findings-first cards; adapters ship only behind passing probes (L-7); W1–W4 value is independent of W5 |
| Provider surface drift (wrangler/Vercel/Deno Deploy move fast) | med | Wrap at CLI process boundaries; compatibility dates pinned in emitted configs; manifest notes carry dates; conformance suite re-run per upgrade |
| Live-probe CI cost/credentials | med | Probe lanes are manually-triggered/secret-gated workflows, not default CI; in-memory suite covers default CI |
| JSR surface growth (6+ new packages) | med | OF-2 subpath folding; F-5 export budgets; publish dry-run + jsr-audit per package before any release wave |
| Leaf-backing dependency (catalog rows need leaf adapters that don't exist) | med | Catalog rows degrade to `external` honestly (DP-7 §2); leaf cards tracked separately (DP-20) |
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
AWS event semantics (DP-20).

## 10. What downstream passes should attack

For the Sol adversarial (constructive) pass: the capability vocabulary granularity (§6 risk 2);
the `cli-command` axis design and its collision rules; whether `plan`-subsumes-`emit` survives
real artifact workflows; the W1 slice ordering against the CLI's actual file graph; the honesty
of every manifest sketch in DP-3. For the Kimi doc-story pass: write the public docs as if W3
shipped (install → target add → plan/up per story) and surface every DX seam the docs cannot
explain — those are design bugs.
