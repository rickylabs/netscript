# Plan: Deno Deploy tier-1 adapter (#342 [Deploy-S6], MARQUEE)

## Run Metadata

| Field          | Value                                                            |
| -------------- | --------------------------------------------------------------- |
| Run ID         | `deploy-s6-deno-deploy`                                          |
| Branch         | `feat/deploy-s6-deno-deploy` (off origin/main `cf1ac47b`)       |
| Phase          | `plan` (PLAN-ONLY; Implement blocked on #337 + #338 + PLAN-EVAL) |
| Target         | `packages/cli` (adapter + wiring) + `packages/config` (schema)  |
| Archetype      | `6 - CLI/Tooling` (primary); folds `2 - Integration`; config member follows `1 - Small-Contract` |
| Scope overlays | `none` (no Fresh/UI; no new long-running service; Aspire-optional at runtime gate) |

## Archetype

**Primary: ARCHETYPE-6 (CLI / Tooling).** The deliverable ships a user-run command flow in the
`@netscript/cli` package (`netscript deploy deno-deploy <verb>`). Per the archetype decision order,
when a package "ships a binary or command-line flow" it is Arch-6, and smaller concerns fold inside.

**Folded: ARCHETYPE-2 (Integration).** The substance is wrapping an external system — the Deno
Deploy platform via the `deno deploy` CLI — behind a package-owned port. #338 already provides that
port (`DeployTargetPort`) and registry (`DeployTargetRegistry`); the deno-deploy adapter is a new
**adapter on an existing axis**, exactly the Arch-2 "named adapter behind an owned port" shape. It
must shell the external CLI through a `ProcessPort` (mirroring `ServyCliAdapter`), never ad-hoc
`Deno.*` in presentation/application layers (F-CLI-5/16, AP-11).

**Config member: ARCHETYPE-1 (Small-Contract) sub-concern.** The `deploy.targets['deno-deploy']`
schema member is a types+schema addition to the published `@netscript/config` package, following the
exact spread-composition + `z.ZodType<T>` pattern #337 established for `windows` (Findings 1–2).

Justification for not splitting: doctrine says "if two archetypes apply, choose the larger and fold
the smaller." The CLI flow is the marquee; integration and the small contract are folded. The config
schema lives in a *different published package* (`@netscript/config`), so its slice carries the
Arch-1 publishability gates (F-6 / publish dry-run) while the CLI slices carry the F-CLI-* family.

## Current Doctrine Verdict

N/A as a fresh verdict for this consumer-of-doctrine slice. The governing doctrine is
`07-composition-and-extension.md` (Deploy target axis; `registerDeployTarget` factory pattern; no
cross-package inheritance; every `Registry` in `extension-points.ts`) as amended on
`feat/deploy-s2-doctrine` (#338). The adapter conforms to that axis; it does not change doctrine.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2 (public surface minimal) | Adapter is internal; only the config type + schema is new public surface. |
| A5 / A6 (ports & adapters, no cross-boundary inheritance) | Adapter implements `DeployTargetPort`; consumer supplies a factory, not a subclass (doctrine R-COMP). |
| A11 (edge-only side effects) | `deno deploy` shelling goes through a `ProcessPort` in `adapters/`; no `Deno.Command` in features/presentation (F-CLI-16, AP-11). |
| A8 (extension via typed registry) | New target registered in `DeployTargetRegistry`, exported from `extension-points.ts` (F-CLI-31, AP-24). |
| A13/A14 (declarative composition, documented permissions) | Composition declarative (F-CLI-27); README declares `--allow-run` for `deno deploy` + network (AP-19). |

## Goal

Add a tier-1 **Deno Deploy** deployment target to NetScript: a `deploy.targets['deno-deploy']`
config member (extends #337's base) + a resolver + a `DenoDeployTarget` adapter implementing #338's
`DeployTargetPort`, which shells the native `deno deploy` CLI (source build, no Dockerfile) to push a
scaffolded NetScript project to the new Deno Deploy platform — reachable via the CLI as
`netscript deploy deno-deploy <verb>`. Includes the **unstable-API preflight guard** (Finding 10).

## Scope

- `packages/config`: `DenoDeployTarget` interface + `DenoDeployTargetSchema` (`z.ZodType<…>`,
  spread-composed on `deployTargetBaseShape`); add `deno-deploy` key to `DeployConfigSchema.targets`
  and `DeployConfig.targets`.
- `packages/cli` kernel: `DenoDeployTarget` adapter implementing `DeployTargetPort`
  (`key='deno-deploy'`), registered in `DEFAULT_DEPLOY_TARGETS`; a `deno deploy` process wrapper
  adapter (mirrors `ServyCliAdapter`); an unstable-API preflight checker; a
  `resolveDenoDeployTarget` config resolver.
- `packages/cli` CLI reach: expose the deno-deploy target's operations through the deploy command
  surface (minimal, register-first; see Locked D6), with `--org`/`--app`/`--prod`/`--env-file` and
  `--dry-run` options mapped onto `deno deploy` flags.
- Tests: schema round-trip/defaults; resolver defaults; adapter unit tests with a fake `ProcessPort`
  (asserting the exact `deno deploy` argv, exit-code mapping, and unstable-guard refusal); registry
  membership test.
- Docs: README permissions block (`--allow-run`, network) + a short how-to note; drift/worklog.

## Non-Scope

- Merging #337/#338 (external prerequisites; this slice rebases onto them).
- Managed Postgres/KV wiring (`deno deploy database`), HA/multi-region, rollback/promote/traffic
  verbs, GitHub-push auto-build provisioning, Deploy Classic/deployctl — all deferred (research
  Non-goals).
- Generalizing windows-only lifecycle verbs (start/stop/upgrade/copy/package-cli) to the cloud target
  — no cloud analogue; beta implements only `DeployTargetPort` operations.
- Full `netscript deploy <target> <verb>` router refactor of the windows-hardcoded `deploy-group.ts`
  — that generalization is #338/epic router work; this slice reaches the target through the registry
  with the smallest necessary CLI surface (Locked D6).

## Hidden Scope

- **Operation-vocabulary mismatch (Finding 3 vs corpus).** #338's port exposes only
  `build|install|uninstall`; Deno Deploy's natural verb is "deploy/push". The plan maps semantics
  onto the existing 3 operations (Locked D3) rather than editing #338's port, to avoid cross-slice
  coupling. If the port owner adds a `deploy` operation, revisit.
- **`isolatedDeclarations` on config** — the new interface needs explicit field types; the schema
  must keep the `z.ZodType<T>` annotation or fast-types/`deno doc` break (Finding 2).
- **Unstable-API guard is not optional** — without it the marquee "one-click" silently ships an app
  that dies on-platform (KV `--unstable-kv`). This is a first-class slice, not a nice-to-have.
- **Windows key precedent** — keep config member key, CLI token, and registry key all `deno-deploy`
  (Finding 14) to avoid the windows `windows` vs `windows-service` split.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | **Implement phase depends on #337 merged/rebased first.** Plan proceeds now against the read contract; no config code committed until the `deploy.targets.*` base exists on the working base. | #337 owns `DeployTargetBaseSchema`/`DeployConfigSchema` this member extends (Findings 1–2). |
| D2 | **Adapter conforms to #338's `DeployTargetPort`/`DeployTargetRegistry`; Implement depends on #338 merged/stabilized.** Design against the read port now. | #338 owns the target-adapter archetype (Findings 3–5); PLAN-EVAL checks conformance. |
| D3 | **Operation mapping:** `build` = preflight (validate `deno.json` Deploy build settings + run the unstable-API guard, no remote call); `install` = **push/deploy** via `deno deploy` (`--prod` gated by an option); `uninstall` = delete the app/deployment. Conform to the existing 3-op port; do **not** edit #338's port in this slice. | Mirrors windows (`install`=create, `uninstall`=remove) and avoids cross-slice port coupling. Marquee "deploy" is surfaced as a CLI verb aliasing `install` (see D6). |
| D4 | **CLI push is the beta driver** (`deno deploy` from project root), not GitHub-push auto-build. GitHub-push is deferred. | Shortest deterministic one-click for a CLI tool; matches D2 "shortest path" marquee intent. *(Product-facing default — also flagged in Open-Decision sweep for user confirmation.)* |
| D5 | **Shell `deno deploy` through a `ProcessPort` adapter** (new `DenoDeployCliAdapter`), mirroring `ServyCliAdapter`; capture stdout/stderr, map exit code → `DeployTargetResult`. No `Deno.Command` outside `kernel/adapters/**`. | Arch-6 R-A6-N8 / F-CLI-16; Arch-2 named-adapter-behind-port; testable with a fake port. |
| D6 | **Register-first, minimal CLI reach.** Add the target to `DeployTargetRegistry` (authoritative) and expose it through the deploy command surface with the smallest change that lets `netscript deploy deno-deploy <deploy\|build\|uninstall>` run; do **not** refactor the windows-hardcoded `deploy-group.ts` router. | Keeps the slice bounded; the full `deploy <target> <verb>` router is epic/#338 work (research Finding 6). |
| D7 | **Registry key = CLI token = config member key = `deno-deploy`.** | Avoid the windows `windows`/`windows-service` split (Finding 14). |
| D8 | **Unstable-API preflight guard is a required slice.** `build`/`install` scan the entrypoint + `deno.json` imports for `--unstable-*`-requiring APIs (KV et al.) and refuse (or hard-warn) before push. | Deno Deploy rejects `--unstable-*`; NetScript KV plugins use `--unstable-kv` (Finding 10). |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Op-vocabulary: reuse `build/install/uninstall` vs add a `deploy` op to #338's port | **safe to defer** (resolved as D3 for beta) | Deferring does not force rework: D3 conforms to the current port; adding a `deploy` op later is additive and coordinated with #338's owner. |
| **CLI-push vs GitHub-push default** | **NEEDS USER** (proceeding on D4 = CLI-push) | Product-facing default for the marquee. D4 is a reversible assumption; if user wants GitHub-push-first, the driver changes but the port/schema/guard do not. |
| **Non-interactive CI auth for new `deno deploy`** (env var / org token) | **NEEDS USER** + freshness re-check at Implement | Docs confirm keyring + interactive prompt + user/org tokens but not a documented non-interactive env var (Findings 11–12). Blocks CI/e2e automation of a *real* push, not the adapter/unit design. Beta may ship CLI-push with an interactive-auth caveat + a `--token`/env passthrough pending confirmation. |
| Unstable-guard = **refuse** vs **warn-and-continue** | safe to defer (default: refuse for `--prod`, warn for preview) | Reversible flag on the guard; does not affect its structure. |
| Whether beta exposes `env`/`logs` passthrough verbs | safe to defer | Additive CLI verbs; out of the D6 minimal reach unless trivial. |

> No open decision would force rework if deferred: the two `NEEDS USER` items affect the *driver
> default* and *CI auth wiring*, not the port conformance, schema shape, adapter structure, or guard —
> which are all locked. Recorded so PLAN-EVAL can confirm the deferral is safe.

## Change Map

| Area | File (relative to repo root) | Change | Slice |
| ---- | ---------------------------- | ------ | ----- |
| Config type | `packages/config/src/domain/config-section-types.ts` | Add `DenoDeployTarget extends DeployTargetBase`; add `deno-deploy?` to `DeployConfig.targets`. | S1 |
| Config schema | `packages/config/src/domain/schemas/deploy-schema.ts` | Add `DenoDeployTargetSchema: z.ZodType<DenoDeployTarget>` (spread `deployTargetBaseShape` + Deno-Deploy fields); add `'deno-deploy'` key to `DeployConfigSchema.targets`. | S1 |
| Config test | `packages/config/**/deploy-schema*_test.ts` (co-located) | Round-trip + defaults + optionality for the new member. | S1 |
| Adapter port impl | `packages/cli/src/kernel/domain/deploy/deno-deploy-target.ts` | `class DenoDeployTarget implements DeployTargetPort` (`key='deno-deploy'`, ops `['build','install','uninstall']`, D3 mapping). | S3 |
| Process wrapper | `packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-cli.ts` | `DenoDeployCliAdapter` shelling `deno deploy` via `ProcessPort` (mirrors `ServyCliAdapter`); argv builders for create/deploy/env/uninstall. | S3 |
| Unstable guard | `packages/cli/src/kernel/domain/deploy/unstable-api-guard.ts` (or `adapters/…` if it reads FS) | Scan entrypoint + `deno.json` for `--unstable-*`-requiring APIs; return a violation report. | S2 |
| Registry wiring | `packages/cli/src/kernel/application/registries/deploy-target-registry.ts` | Add `DENO_DEPLOY_TARGET` to `DEFAULT_DEPLOY_TARGETS`. | S3 |
| Extension-points | `packages/cli/src/kernel/extension-points.ts` | No new export needed (registry already exported); confirm re-export completeness (F-CLI-31). | S3 |
| Config resolver | `packages/cli/src/kernel/adapters/config/deploy-config-resolvers.ts` | Add `resolveDenoDeployTarget(userDeploy?.targets?['deno-deploy'])` → `ResolvedDenoDeployConfig` + defaults. | S4 |
| CLI reach | `packages/cli/src/public/features/deploy/**` (minimal, D6) | Surface `deno-deploy` operations + `--org/--app/--prod/--env-file/--dry-run` options mapped to `deno deploy` flags. | S4 |
| Adapter tests | co-located `*_test.ts` under the new folders | Fake `ProcessPort`: assert exact argv, exit-code→result, guard refusal, registry membership. | S2–S4 |
| README/permissions | `packages/cli/README.md` (permissions block) | Declare `--allow-run` (deno deploy) + network; note unstable-API caveat + auth caveat. | S4 |
| Debt note | `.llm/harness/debt/arch-debt.md` §`cli-deploy-artifacts-missing` | Update: cloud target added; debt advanced, not closed. | S4 |

## Commit Slices

Ordered per Arch-6 "kernel domain + ports + abstracts first; registries + adapters next; features
one at a time; composition last." Each is independently committed, pushed, PR-commented. All slices
are gated behind D1/D2 (rebase onto merged #337 + #338) at Implement time.

| # | Slice | Proves | Gate | Files |
| - | ----- | ------ | ---- | ----- |
| S1 | **Config member** — `DenoDeployTarget` type + `DenoDeployTargetSchema` + `targets['deno-deploy']`. | The published config surface accepts a valid deno-deploy target and rejects bad shapes; fast-types intact. | `deno task check` (config, `--unstable-kv` where needed) + config `_test.ts` + `deno publish --dry-run` (config) + `run-deno-check.ts --root packages/config --ext ts`. | config type + schema + test. |
| S2 | **Unstable-API guard** (pure/kernel) + tests. | Guard flags `--unstable-*`-requiring imports (KV) in a fixture project and passes a clean one. | `run-deno-check.ts --root packages/cli` + guard `_test.ts` (fixtures) + fitness F-CLI-1/16 manual. | `unstable-api-guard.ts` + test. |
| S3 | **Adapter + process wrapper + registry** — `DenoDeployTarget implements DeployTargetPort`, `DenoDeployCliAdapter` (ProcessPort), `DEFAULT_DEPLOY_TARGETS` entry. | Adapter emits the exact `deno deploy` argv, maps exit codes, refuses on guard violation; registry lists `deno-deploy`. | adapter/registry `_test.ts` with fake `ProcessPort` + `run-deno-check.ts` + fitness F-CLI-16/17/19/28/31 manual + F-4 (kernel≠surface imports). | adapter, cli-wrapper, registry, extension-points confirm. |
| S4 | **Resolver + CLI reach + docs/debt** — `resolveDenoDeployTarget`, minimal deploy-surface reach, README permissions, arch-debt update. | `netscript deploy deno-deploy build` runs the guard/preflight against a scaffold without a real push; options map to `deno deploy` flags; README declares perms. | resolver `_test.ts` + CLI help/name check + `deno task lint` + `run-deno-fmt.ts --root packages/cli --ext ts` + fitness F-CLI-26/27 + AP-19 manual. | resolver, deploy-surface reach, README, arch-debt. |

Slice count: **4** (< 30). If S3 reveals the #338 router must change to reach the target at all,
that is a **rescope trigger** (Arch-6 "command vocabulary / surface boundary change") → confirm with
user before expanding.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| #337/#338 not merged when Implement starts. | D1/D2 hard-block Implement on merge/rebase; PLAN designs against read contracts only. |
| #338's `DeployTargetPort` shape shifts before merge. | Design against the read interface; add a drift-watch entry; re-verify the port at Implement start. |
| Deno Deploy CLI surface/auth changes (fast-moving platform). | Freshness re-check (`deno deploy --help`) at Implement; auth flagged `NEEDS USER`; adapter isolates argv construction in one wrapper for cheap updates. |
| Unstable-API guard false-negatives (misses a transitive KV import). | Scan entrypoint + `deno.json` import map + (best-effort) `deno info` graph; document the guard's bounds; default to **refuse** on `--prod`. |
| Real e2e push needs live Deno Deploy creds/org. | Unit-test with fake `ProcessPort` (no live push); a real push is an interactive/manual verification, not a CI gate this slice, pending the auth `NEEDS USER`. |
| Scope creep into the full `deploy <target> <verb>` router. | D6 register-first minimal reach; router refactor is an explicit rescope trigger. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-11 (side effects outside adapters) | risk | `deno deploy` shell only in `kernel/adapters/deno-deploy/**` via `ProcessPort` (D5). |
| AP-24 (switch-over-union for variants) | avoid | Register `deno-deploy` in the typed `DeployTargetRegistry`; no `if target === …` branching. |
| AP-3 (port with every backend op) | avoid | Conform to the existing 3-op `DeployTargetPort`; do not bloat it (D3). |
| AP-19 (undocumented permissions) | new | README permissions block: `--allow-run` + network + unstable/auth caveats (S4). |
| AP-1 (command/pipeline monolith) | avoid | Adapter + wrapper + guard + resolver are separate files, each ≤ per-layer LOC caps (F-CLI-1/2). |
| AP-18 (string-snapshot tests) | avoid | Assert semantic argv arrays + exit-code mapping, not stdout snapshots. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Static (check/lint/fmt via scoped wrappers) | yes | `run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts` on `packages/config` + `packages/cli`, `--ext ts`. |
| F-1/F-CLI-1,2 (file size) | yes | Adapter ≤ 350, guard/domain ≤ 250, command ≤ 150 LOC — manual/PENDING_SCRIPT. |
| F-4/F-CLI-4 (kernel ≠ surface imports) | yes | Import-graph manual: adapter in kernel imports no `public/**`. |
| F-CLI-16 (`Deno.Command` only in adapters) | yes | Regex/manual: shelling only in `kernel/adapters/deno-deploy/**`. |
| F-CLI-31 (registry in extension-points) | yes | `DeployTargetRegistry` already exported; confirm. |
| F-5 (public surface audit) | yes | Only `DenoDeployTarget`/schema newly public (config); CLI adapter internal. |
| F-6 / publish dry-run (config) | yes | `deno publish --dry-run` on `@netscript/config` (published surface). |
| F-9 / AP-19 (permissions declared) | yes | README permissions block updated. |
| F-10 (test-shape) | yes | Fake-`ProcessPort` semantic tests, guard fixtures, schema round-trip. |
| Runtime/Aspire (optional) | at evaluator | `scaffold.runtime` e2e is the merge-readiness authority (below) — evaluator/OpenHands, not per-slice. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `cli-deploy-artifacts-missing` (`arch-debt.md:1300`) | update | Cloud (Deno Deploy) target added; debt **advanced not closed** (no Dockerfile/k8s/compose generation; windows + deno-deploy only). |
| (new, if guard bounds are partial) | create-if-needed | If the unstable-API guard is best-effort (misses deep transitive imports), record the bound as an explicit debt entry rather than claiming full coverage. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Config check | `deno run -A .llm/tools/run-deno-check.ts --root packages/config --ext ts` | 0 errors |
| 2 | Config tests | `deno test` on config deploy-schema `_test.ts` | green |
| 3 | Config publish surface | `deno task publish:dry-run` (config member) | dry-run success (modulo declared JSR_DEPS_PENDING) |
| 4 | CLI check | `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --ext ts` (+`--unstable-kv` if KV-touching) | 0 errors |
| 5 | CLI tests | `deno test` on new adapter/guard/resolver `_test.ts` (fake `ProcessPort`) | green |
| 6 | Lint + fmt | `run-deno-lint.ts` + `run-deno-fmt.ts` on both roots, `--ext ts` | clean |
| 7 | Fitness (Arch-6) | `deno task arch:check` (F-CLI-*) or PENDING_SCRIPT with manual evidence | pass / documented |
| 8 | Merge-readiness (evaluator) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | evaluator/OpenHands pass; NOT a per-slice gate (expensive) |
| 9 | Real push (manual, gated on auth `NEEDS USER`) | `netscript deploy deno-deploy build` (preflight, no push) then interactive push | preflight runs guard; push deferred pending auth confirmation |

## Risks

- Platform freshness / auth (mitigated: `NEEDS USER` + re-check + isolated argv wrapper).
- Cross-slice contract drift from unmerged #337/#338 (mitigated: D1/D2 + drift-watch + re-verify).

## Dependencies

- **#337** (`feat/deploy-s1-targets-config`) — merged before Implement (Locked D1).
- **#338** (`feat/deploy-s2-doctrine`) — merged/stabilized before Implement (Locked D2).
- External: Deno 2.8 toolchain (native `deno deploy`), a Deno Deploy org + token for real push
  (manual verification only).

## Drift Watch

- `DeployTargetPort` shape on #338 (operations set, request/result fields) — re-verify at Implement.
- `deploy.targets.*` schema shape on #337 (base fields, `z.ZodType` annotation).
- `deno deploy` CLI flag surface + non-interactive auth mechanism (docs freshness).
- If #338 adds a `deploy` operation or lands the `netscript deploy <target> <verb>` router, revisit
  D3/D6.
