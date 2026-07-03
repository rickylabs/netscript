# Plan: Deno Deploy tier-1 adapter (#342 [Deploy-S6], MARQUEE)

> **Revision 2 (post-FAIL_PLAN).** Rev 1 was returned `FAIL_PLAN` (blocking finding B1): it
> misattributed the shipped 3-op `DeployTargetPort` to #338, demoted the ratified **7-op Archetype 7**
> contract to "stale corpus," and premised "#337 not merged." This revision: (a) selects
> **Archetype 7 (composite)** as primary; (b) conforms to the canonical **7-op** deploy contract;
> (c) records that the 3-op→7-op **port expansion is OWNED by #339/#340** and #342 **consumes** it
> (does not redefine it); (d) re-baselines against **merged `origin/main`** (#352 config +
> `3137e455` seed port already landed); (e) corrects the dispatch lane to **Opus 4.8 sub-agents**.
> Still **PLAN-ONLY** — no adapter/CLI/schema code is written; Implement waits for PLAN-EVAL.

## Run Metadata

| Field          | Value                                                            |
| -------------- | --------------------------------------------------------------- |
| Run ID         | `deploy-s6-deno-deploy`                                          |
| Branch         | `feat/deploy-s6-deno-deploy` (forked off `cf1ac47b`; re-baselined against merged `origin/main` @ `37108172`) |
| Phase          | `plan` (PLAN-ONLY; Implement blocked on merge order below + PLAN-EVAL PASS) |
| Target         | `packages/cli` (adapter + wiring) + `packages/config` (schema)  |
| Archetype      | **7 — Deploy Target Adapter (composite: Arch 2 Integration + Arch 6 CLI/Tooling)** |
| Scope overlays | `none` (no Fresh/UI; no new long-running service; Aspire-optional at runtime gate) |

## Archetype

**Primary: ARCHETYPE-7 — Deployment Target Adapter (composite).** Ratified by **#338** (impl #357,
IMPL-EVAL PASS); doctrine at `.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md`. It is a
**composite** that composes two archetypes and folds **neither**:

- **Composed Archetype 2 (Integration — port/adapter core).** The substance is wrapping an external
  system — the Deno Deploy platform via the `deno deploy` CLI — behind a **package-owned port**
  (the 7-op deploy port) registered in a **closed-on-key** `deploy-target-registry`. The deno-deploy
  adapter is a new **adapter on that existing port axis**: it shells the external CLI through a
  `ProcessPort` (mirroring `ServyCliAdapter`), never ad-hoc `Deno.*` in features/presentation
  (F-CLI-16, AP-11).
- **Composed Archetype 6 (CLI/Tooling — thin router).** The user reaches the target through a **thin**
  `netscript deploy <target> <verb>` router that carries **no target-specific business logic**
  (R-DEPLOY-2) — it dispatches to the registry.

**Config member (small-contract sub-concern).** The `deploy.targets['deno-deploy']` schema member is
a types+schema addition to the published `@netscript/config` package, following the **exact
spread-composition + `z.ZodType<T>` pattern** merged for `windows` via **#352** (Findings 1–2). Per
R-DEPLOY-4 the member **spreads** `deployTargetBaseShape` — no per-target base-class hierarchy.

**Why Archetype 7 and not "Arch-6 folding Arch-2":** #338 established that deployment targets are a
first-class composite archetype with its own rule family (R-DEPLOY-1..5) and gates (F-DEPLOY-1/2).
Rev 1's "Arch-6 primary folding Arch-2" framing is superseded; this slice is governed by Archetype 7
and must satisfy its rules, not just the generic CLI family.

## Canonical contract (7-op) — the correction

The deploy port exposes the **uniform 7-op contract** (Archetype 7): **`plan`/`emit` · `up` · `down`
· `status` · `logs` · `rollback` · `secrets`**. Each adapter implements the **subset it supports**
(R-DEPLOY-1). The 3-op `build|install|uninstall` port currently on `main` is a **seed stub from
`3137e455`** (an unrelated command-registry slice), scheduled for expansion to 7-op by **#339/#340**.

**#342 CONSUMES the expanded 7-op port; it does NOT define or redefine it** (research Finding 6;
`port-ownership.md`). The deno-deploy adapter implements this subset:

| Canonical op   | Deno Deploy mapping | Support |
| -------------- | ------------------- | ------- |
| `plan`/`emit`  | Preflight: validate `deno.json` Deploy build settings + run the **unstable-API guard**; compute the plan, no platform mutation. | Supported (local) |
| `up`           | **`deno deploy`** (preview) / **`deno deploy --prod`** (production) — the marquee one-click push. | Supported (marquee) |
| `down`         | Delete the Deno Deploy app/deployment (platform-native; CLI verb TBD). | Supported (platform-native) |
| `status`       | Deployment/app state via platform API. | Supported |
| `logs`         | **`deno deploy logs`**. | Supported |
| `rollback`     | Platform-native rollback (repoint to prior good deployment), routed via the **core rollback convention** (R-DEPLOY-3) — not a no-op. | Supported |
| `secrets`      | **`deno deploy env add [--secret]` / `env load`**, via the **core secrets convention** (R-DEPLOY-3). | Supported |
| (host install/uninstall) | N/A — hosted platform has no OS-service install. | **Explicitly unsupported** (declared subset) |

Legacy CLI verbs (`build/install/uninstall`) remain **user-facing aliases** onto canonical ops per
the #339/#340 verb-lock (`build`→`plan`, `install`→`up`, `uninstall`→`down`); the adapter's declared
`operations` set uses the **canonical** names.

## Current Doctrine Verdict

N/A as a fresh verdict for this consumer-of-doctrine slice. Governing doctrine: **Archetype 7**
(#338/#357) + `07-composition-and-extension.md` (Deploy target axis; `registerDeployTarget` factory
pattern; no cross-package inheritance; every `Registry` in `extension-points.ts`). The adapter
conforms to that axis; it does not change doctrine. **R-DEPLOY-3** requires the shared conventions
(health, OTEL, **secrets, rollback**) to live in the deploy **core**, not in this adapter.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2 (public surface minimal) | Adapter is internal; only the config type + schema is new public surface. |
| A5 / A6 (ports & adapters, no cross-boundary inheritance) | Adapter implements the port; consumer supplies a factory, not a subclass (R-COMP, R-DEPLOY-4). |
| A11 (edge-only side effects) | `deno deploy` shelling goes through a `ProcessPort` in `adapters/`; no `Deno.Command` in features/presentation (F-CLI-16, AP-11). |
| A8 (extension via typed registry) | New target registered in the closed-on-key `deploy-target-registry`, exported from `extension-points.ts` (F-CLI-31, AP-24). |
| A13/A14 (declarative composition, documented permissions) | Composition declarative (F-CLI-27); README declares `--allow-run` for `deno deploy` + network (AP-19). |

## Goal

Add a tier-1 **Deno Deploy** deployment target to NetScript: a `deploy.targets['deno-deploy']`
config member (spreads #352's `deployTargetBaseShape`) + a resolver + a `DenoDeployTarget` adapter
implementing the **subset of the 7-op deploy port** (consumed from #339/#340) that Deno Deploy
supports, shelling the native `deno deploy` CLI (source build, no Dockerfile) to push a scaffolded
NetScript project to the new Deno Deploy platform — reachable via the thin router as
`netscript deploy deno-deploy <verb>`. Includes the **unstable-API preflight guard** (Finding 9) in
`plan`, and routes `secrets`/`rollback` through the **core conventions** (R-DEPLOY-3).

## Scope

- `packages/config`: `DenoDeployTarget` interface + `DenoDeployTargetSchema` (`z.ZodType<…>`,
  spread-composed on `deployTargetBaseShape`); add `deno-deploy` key to `DeployConfigSchema.targets`
  and `DeployConfig.targets`.
- `packages/cli` kernel: `DenoDeployTarget` adapter implementing the **7-op port** subset
  (`key='deno-deploy'`, `operations = ['plan','up','down','status','logs','rollback','secrets']`); a
  `deno deploy` process-wrapper adapter (mirrors `ServyCliAdapter`); an unstable-API preflight
  checker (used by `plan`); a `resolveDenoDeployTarget` config resolver.
- `packages/cli` router reach: register the target so the thin `netscript deploy deno-deploy <verb>`
  router dispatches its ops (R-DEPLOY-2 — no target logic in the router), with `--org`/`--app`/
  `--prod`/`--env-file`/`--dry-run` mapped onto `deno deploy` flags.
- **Core conventions (consume, do not fork):** `secrets` and `rollback` route through the deploy
  **core** convention primitives (R-DEPLOY-3) owned by #339/#340's core, not re-implemented here.
- Tests: schema round-trip/defaults; resolver defaults; adapter unit tests with a fake `ProcessPort`
  (asserting exact `deno deploy` argv, exit-code mapping, unstable-guard refusal, declared-subset
  reporting for unsupported ops); registry membership test.
- Docs: README permissions block (`--allow-run`, network) + a short how-to note; drift/worklog.

## Non-Scope

- **Owning or redefining the deploy port / op vocabulary** — owned by **#339/#340**; #342 consumes
  the expanded 7-op port and rebases onto its port-contract commit.
- Building the `OsServicePort` + the full multi-target router — #339/#340 core work; #342 adds the
  deno-deploy adapter behind it + its registry entry.
- Merging #357 / #339 / #340 (external prerequisites; this slice rebases onto them — merge order
  below).
- Managed Postgres/KV wiring (`deno deploy database`), HA/multi-region, GitHub-push auto-build
  provisioning, Deploy Classic/deployctl — deferred (research Non-goals).
- Authoring the shared `secrets`/`rollback`/health/OTEL **core conventions** — those are R-DEPLOY-3
  core primitives (#339/#340); #342 consumes them for the deno-deploy mapping.

## Hidden Scope

- **Port timing (Finding 3/6).** `main` currently carries only the 3-op seed stub. #342 Implement
  **must not** begin against the 3-op stub; it rebases onto #339/#340's expanded 7-op port commit
  first (merge order below). Designing the adapter against the 7-op contract now is safe because the
  contract is ratified doctrine (#338).
- **`isolatedDeclarations` on config** — the new interface needs explicit field types; the schema
  must keep the `z.ZodType<T>` annotation or fast-types/`deno doc`/JSR slow-types break (Finding 2).
- **Unstable-API guard is not optional** — without it the marquee "one-click" silently ships an app
  that dies on-platform (KV `--unstable-kv`). First-class slice, not a nice-to-have (Finding 9).
- **`secrets`/`rollback` must not be re-implemented per-target** — R-DEPLOY-3 requires the core
  convention; the adapter only maps the convention onto `deno deploy env`/platform rollback.
- **Windows key precedent** — keep config member key, CLI token, and registry key all `deno-deploy`
  (Finding 6 / windows precedent) to avoid the `windows` vs `windows-service` split.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | **Config base is MERGED (#352).** Implement adds the `deno-deploy` member by **spreading** `deployTargetBaseShape` (R-DEPLOY-4). No "rebase onto unmerged #337" gate — that rev-1 premise is dropped. | #352 (`44d7945b`) landed `DeployTargetBaseSchema`/`DeployConfigSchema` on `main` (Findings 1–2). |
| D2 | **Conform to Archetype 7 (#338/#357); cite it by name.** Adapter satisfies R-DEPLOY-1..5 + F-DEPLOY-1/2. | #338 ratified the composite archetype + 7-op contract (Findings 4–5); PLAN-EVAL checks conformance. |
| D3 | **CONSUME the 7-op port from #339/#340 — do NOT redefine it.** The adapter's `operations` uses the **canonical** op names; `build/install/uninstall` are user-facing aliases only. Implement rebases onto #339/#340's expanded-port commit. | Port expansion is **owned** by #339/#340 (Finding 6; `port-ownership.md`). Redefining it = the B1-class error. |
| D4 | **Op mapping = the 7-op→Deno-Deploy table above.** Deno Deploy implements the declared subset; host install/uninstall is explicitly unsupported. `secrets`/`rollback` route via the **core conventions** (R-DEPLOY-3), not adapter-local logic. | Uniform contract + R-DEPLOY-1 (subset) + R-DEPLOY-3 (conventions in core). |
| D5 | **CLI push is the beta driver** (`deno deploy` from project root → `up`), not GitHub-push auto-build. GitHub-push deferred. | Shortest deterministic one-click marquee. *(Product-facing default — flagged NEEDS USER for confirmation; reversible.)* |
| D6 | **Shell `deno deploy` through a `ProcessPort` adapter** (`DenoDeployCliAdapter`), mirroring `ServyCliAdapter`; capture stdout/stderr, map exit code → deploy result. No `Deno.Command` outside `kernel/adapters/**`. | Arch-2 named-adapter-behind-port + F-CLI-16; testable with a fake port. |
| D7 | **Thin router, register-first (R-DEPLOY-2).** Register the target in the closed-on-key `deploy-target-registry`; the `netscript deploy deno-deploy <verb>` router only dispatches — **no target-specific logic in the command surface**. The generalized router is #339/#340 work; #342 supplies the adapter + registry entry. | R-DEPLOY-2; keeps the slice bounded. |
| D8 | **Registry key = CLI token = config member key = `deno-deploy`.** | Avoid the `windows`/`windows-service` split (Finding 6). |
| D9 | **Unstable-API preflight guard is a required slice**, invoked by `plan`. Scans entrypoint + `deno.json` imports for `--unstable-*`-requiring APIs (KV et al.) and refuses (or hard-warns) before `up`. | Deno Deploy rejects `--unstable-*`; NetScript KV plugins use `--unstable-kv` (Finding 9). |
| D10 | **Dispatch lane = Opus 4.8 sub-agents (this epic).** Implementers = Opus 4.8 sub-agents; evaluators = separate Opus session (or Codex GPT-5.5). **WSL Codex / OpenHands is NOT the impl lane for the deployment epic.** | Epic dispatch-lane override (Finding 14; `port-ownership.md`). |

## Merge order (Implement gate)

```
#357 (Archetype-7 doctrine)  →  #339/#340 expanded 7-op port commit  →  rebase #342 onto both (+ current main, which already carries #352 + 3137e455)
```

Implement does NOT start until #339/#340's port-contract commit exists and #342 is rebased onto it.
Designing now against the ratified 7-op contract is safe and unblocks PLAN-EVAL.

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| **CLI-push vs GitHub-push default** | **NEEDS USER** (proceeding on D5 = CLI-push) | Product-facing marquee default. Reversible: if GitHub-push-first is wanted, the `up` driver changes but the port/schema/guard/conventions do not. |
| **Non-interactive CI auth for new `deno deploy`** (env var / org token) | **NEEDS USER** + freshness re-check at Implement | Docs confirm keyring + interactive prompt + user/org tokens but not a documented non-interactive env var (Finding 11). Blocks CI/e2e automation of a *real* push, not the adapter/unit design. |
| Unstable-guard = **refuse** vs **warn-and-continue** | safe to defer (default: refuse on `--prod`, warn on preview) | Reversible flag on the guard; does not affect its structure. |
| Exact `down`/`status`/`rollback` CLI-vs-API surface | safe to defer (confirm at Implement vs then-current platform API) | Each op isolated behind the port; platform-native mechanism confirmed at Implement freshness re-check. |

> No open decision forces rework if deferred: the two `NEEDS USER` items affect the *driver default*
> and *CI auth wiring*, not port conformance, schema shape, adapter structure, the guard, or the
> core-convention routing — all locked. Recorded so PLAN-EVAL can confirm the deferral is safe.

## Change Map

| Area | File (relative to repo root) | Change | Slice |
| ---- | ---------------------------- | ------ | ----- |
| Config type | `packages/config/src/domain/config-section-types.ts` | Add `DenoDeployTarget extends DeployTargetBase`; add `deno-deploy?` to `DeployConfig.targets`. | S1 |
| Config schema | `packages/config/src/domain/schemas/deploy-schema.ts` | Add `DenoDeployTargetSchema: z.ZodType<DenoDeployTarget>` (spread `deployTargetBaseShape` + Deno-Deploy fields); add `'deno-deploy'` key to `DeployConfigSchema.targets`. | S1 |
| Config test | `packages/config/**/deploy-schema*_test.ts` (co-located) | Round-trip + defaults + optionality for the new member. | S1 |
| Unstable guard | `packages/cli/src/kernel/domain/deploy/unstable-api-guard.ts` (or `adapters/…` if it reads FS) | Scan entrypoint + `deno.json` for `--unstable-*`-requiring APIs; return a violation report. | S2 |
| Adapter (7-op subset) | `packages/cli/src/kernel/domain/deploy/deno-deploy-target.ts` | `class DenoDeployTarget implements <7-op DeployPort>` (`key='deno-deploy'`, `operations = ['plan','up','down','status','logs','rollback','secrets']`, D4 mapping; `secrets`/`rollback` delegate to core conventions). | S3 |
| Process wrapper | `packages/cli/src/kernel/adapters/deno-deploy/deno-deploy-cli.ts` | `DenoDeployCliAdapter` shelling `deno deploy` via `ProcessPort` (mirrors `ServyCliAdapter`); argv builders for deploy/env/logs/create. | S3 |
| Registry wiring | `packages/cli/src/kernel/application/registries/deploy-target-registry.ts` | Add `DENO_DEPLOY_TARGET` to `DEFAULT_DEPLOY_TARGETS` (closed-on-key registry). | S3 |
| Extension-points | `packages/cli/src/kernel/extension-points.ts` | Confirm registry re-export completeness (F-CLI-31); no new export expected. | S3 |
| Config resolver | `packages/cli/src/kernel/adapters/config/deploy-config-resolvers.ts` | Add `resolveDenoDeployTarget(userDeploy?.targets?['deno-deploy'])` → `ResolvedDenoDeployConfig` + defaults. | S4 |
| Router reach | `packages/cli/src/public/features/deploy/**` (thin, R-DEPLOY-2) | Dispatch `deno-deploy` ops through the router + `--org/--app/--prod/--env-file/--dry-run` → `deno deploy` flags; **no target logic in the surface**. | S4 |
| Adapter tests | co-located `*_test.ts` under the new folders | Fake `ProcessPort`: exact argv, exit-code→result, guard refusal, declared-subset for unsupported ops, registry membership. | S2–S4 |
| README/permissions | `packages/cli/README.md` (permissions block) | Declare `--allow-run` (deno deploy) + network; note unstable-API + auth caveats. | S4 |
| Debt note | `.llm/harness/debt/arch-debt.md` §`cli-deploy-artifacts-missing` | Update: cloud target added; debt advanced, not closed. | S4 |

## Commit Slices

Ordered per Archetype 7: kernel port-conformant domain + guard first; registry + adapters next;
router reach + resolver + docs last. Each is independently committed, pushed, PR-commented. All
slices are gated behind the **merge order** (rebase onto #357 + #339/#340 port commit) at Implement.

| # | Slice | Proves | Gate | Files |
| - | ----- | ------ | ---- | ----- |
| S1 | **Config member** — `DenoDeployTarget` type + `DenoDeployTargetSchema` + `targets['deno-deploy']`. | Published config surface accepts a valid deno-deploy target and rejects bad shapes; fast-types intact; spreads base (R-DEPLOY-4). | `run-deno-check.ts --root packages/config --ext ts` + config `_test.ts` + `deno publish --dry-run` (config). | config type + schema + test. |
| S2 | **Unstable-API guard** (pure/kernel) + tests. | Guard flags `--unstable-*`-requiring imports (KV) in a fixture project and passes a clean one; consumed by `plan`. | `run-deno-check.ts --root packages/cli` + guard `_test.ts` (fixtures) + F-CLI-1/16 manual. | `unstable-api-guard.ts` + test. |
| S3 | **Adapter (7-op subset) + process wrapper + registry** — `DenoDeployTarget` implements the 7-op port subset; `DenoDeployCliAdapter` (ProcessPort); `DEFAULT_DEPLOY_TARGETS` entry. | Adapter declares the canonical op subset, emits exact `deno deploy` argv, maps exit codes, refuses on guard violation, delegates `secrets`/`rollback` to core conventions; registry lists `deno-deploy`. | adapter/registry `_test.ts` (fake `ProcessPort`) + `run-deno-check.ts` + F-DEPLOY-1 + F-CLI-16/17/19/28/31 + F-4 manual. | adapter, cli-wrapper, registry, extension-points confirm. |
| S4 | **Resolver + thin router reach + docs/debt** — `resolveDenoDeployTarget`, thin router dispatch, README permissions, arch-debt update. | `netscript deploy deno-deploy plan` runs the guard/preflight against a scaffold without a real push; router carries no target logic (R-DEPLOY-2); options map to `deno deploy` flags; README declares perms. | resolver `_test.ts` + CLI help/name check + `run-deno-lint.ts` + `run-deno-fmt.ts` + F-DEPLOY-2 + F-CLI-26/27 + AP-19 manual. | resolver, deploy-surface reach, README, arch-debt. |

Slice count: **4** (< 30). If S3/S4 reveals the #339/#340 router/port is not yet mergeable or its
shape differs from the ratified 7-op contract, that is a **blocking dependency**, not a #342 rescope
— surface it, do not redefine the port.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| #339/#340 port-expansion commit not merged when #342 Implement starts. | Merge order hard-blocks Implement; PLAN designs against the ratified 7-op contract; rebase onto the port commit first. |
| Temptation to redefine the port inside #342 to "unblock." | **Forbidden** (D3): the port is owned by #339/#340. If blocked, escalate to the epic supervisor; do not fork the contract. |
| 7-op port shape lands slightly different from doctrine. | Design against ratified doctrine; drift-watch the port commit; re-verify at Implement start; reconcile with #339/#340 owner, not by local edits. |
| Deno Deploy CLI surface/auth changes (fast-moving platform). | Freshness re-check (`deno deploy --help`) at Implement; auth flagged `NEEDS USER`; adapter isolates argv construction in one wrapper. |
| Unstable-API guard false-negatives (misses a transitive KV import). | Scan entrypoint + `deno.json` import map + best-effort `deno info` graph; document bounds; default refuse on `--prod`. |
| Real e2e push needs live Deno Deploy creds/org. | Unit-test with fake `ProcessPort`; a real push is manual verification, gated on the auth `NEEDS USER`. |
| `secrets`/`rollback` re-implemented per-target (R-DEPLOY-3 violation). | Route through core conventions; adapter only maps convention → `deno deploy env`/platform rollback. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-11 (side effects outside adapters) | risk | `deno deploy` shell only in `kernel/adapters/deno-deploy/**` via `ProcessPort` (D6). |
| AP-24 (switch-over-union for variants) | avoid | Register `deno-deploy` in the closed-on-key registry; no `if target === …` in the router (R-DEPLOY-2). |
| AP-3 (port with every backend op) | avoid | Implement the **declared subset** of the 7-op port; do not add adapter-only ops or bloat the shared port (D3/D4). |
| AP-19 (undocumented permissions) | new | README permissions block: `--allow-run` + network + unstable/auth caveats (S4). |
| AP-1 (command/pipeline monolith) | avoid | Adapter + wrapper + guard + resolver are separate files, each ≤ per-layer LOC caps (F-CLI-1/2). |
| AP-18 (string-snapshot tests) | avoid | Assert semantic argv arrays + exit-code mapping, not stdout snapshots. |
| (R-DEPLOY-3) convention duplication | avoid | `secrets`/`rollback` consume core conventions, not adapter-local re-implementations. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| **F-DEPLOY-1** (adapter implements 7-op contract or a **declared** subset) | yes | Adapter `operations` = canonical op names; unsupported host ops explicitly declared; subset test. |
| **F-DEPLOY-2** (thin router, conventions in core) | yes | Router dispatches only (R-DEPLOY-2); `secrets`/`rollback` delegate to core (R-DEPLOY-3). |
| Static (check/lint/fmt via scoped wrappers) | yes | `run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts` on `packages/config` + `packages/cli`, `--ext ts`. |
| F-1/F-CLI-1,2 (file size) | yes | Adapter ≤ 350, guard/domain ≤ 250, command ≤ 150 LOC — manual/PENDING_SCRIPT. |
| F-4/F-CLI-4 (kernel ≠ surface imports) | yes | Import-graph manual: kernel adapter imports no `public/**`. |
| F-CLI-16 (`Deno.Command` only in adapters) | yes | Shelling only in `kernel/adapters/deno-deploy/**`. |
| F-CLI-31 (registry in extension-points) | yes | `deploy-target-registry` exported; confirm. |
| F-5 (public surface audit) | yes | Only `DenoDeployTarget`/schema newly public (config); CLI adapter internal. |
| F-6 / publish dry-run (config) | yes | `deno publish --dry-run` on `@netscript/config`. |
| F-9 / AP-19 (permissions declared) | yes | README permissions block updated. |
| F-10 (test-shape) | yes | Fake-`ProcessPort` semantic tests, guard fixtures, schema round-trip, declared-subset test. |
| Runtime/Aspire (optional) | at evaluator | `scaffold.runtime` e2e is the merge-readiness authority — evaluator, not per-slice. |

> **F-DEPLOY-1/2 are currently seeded `reviewed`** (packages don't yet exist). This slice — the first
> cloud adapter — is where they promote toward `gated`; PLAN-EVAL confirms the promotion path.

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `cli-deploy-artifacts-missing` (`arch-debt.md`) | update | Cloud (Deno Deploy) target added; debt **advanced not closed** (windows + deno-deploy only). |
| `Archetype-7 core-centralization + F-DEPLOY seed` | reference | This slice exercises the R-DEPLOY-3 core conventions for the first cloud adapter; note progress. |
| (new, if guard bounds are partial) | create-if-needed | If the unstable-API guard is best-effort, record the bound as explicit debt rather than claiming full coverage. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Config check | `deno run -A .llm/tools/run-deno-check.ts --root packages/config --ext ts` | 0 errors |
| 2 | Config tests | `deno test` on config deploy-schema `_test.ts` | green |
| 3 | Config publish surface | `deno task publish:dry-run` (config member) | dry-run success (modulo declared JSR_DEPS_PENDING) |
| 4 | CLI check | `deno run -A .llm/tools/run-deno-check.ts --root packages/cli --ext ts` (+`--unstable-kv` if KV-touching) | 0 errors |
| 5 | CLI tests | `deno test` on new adapter/guard/resolver `_test.ts` (fake `ProcessPort`) | green |
| 6 | Lint + fmt | `run-deno-lint.ts` + `run-deno-fmt.ts` on both roots, `--ext ts` | clean |
| 7 | Fitness (Arch-7) | `deno task arch:check` (F-DEPLOY-1/2 + F-CLI-*) or PENDING_SCRIPT with manual evidence | pass / documented |
| 8 | Merge-readiness (evaluator) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | evaluator pass; NOT a per-slice gate (expensive) |
| 9 | Real push (manual, gated on auth `NEEDS USER`) | `netscript deploy deno-deploy plan` (preflight, no push) then interactive `up` | preflight runs guard; push deferred pending auth confirmation |

## Dependencies

- **#352** (`[Deploy-S1]` config contract) — **MERGED** (`44d7945b`); provides `deployTargetBaseShape`
  the member spreads.
- **#357** (#338 Archetype-7 doctrine) — IMPL-EVAL PASS; merged before Implement.
- **#339/#340** (`[Deploy-S3]` bare-metal) — **owns the 3-op→7-op port-expansion commit**; #342
  rebases onto it and consumes the expanded port (does NOT redefine it).
- External: Deno 2.9 toolchain (native `deno deploy`), a Deno Deploy org + token for real push
  (manual verification only).

## Drift Watch

- The 7-op deploy port shape as landed by #339/#340 (op set, request/result fields) — re-verify at
  Implement; reconcile with the owner, never by local port edits.
- `deploy.targets.*` schema shape on `main` (base fields, `z.ZodType` annotation) — already merged
  (#352); re-confirm at Implement.
- `deno deploy` CLI flag surface + non-interactive auth mechanism (docs freshness).
- `ARCHETYPE-7-deploy-target-adapter.md` stale slice-number parenthetical (`#340 deno-deploy` /
  `#342 docker`) — #338's doc to correct; #342 does not edit it. Logged so PLAN-EVAL is not misled.
- Dispatch lane: Opus 4.8 sub-agents (not WSL Codex) for this epic.
