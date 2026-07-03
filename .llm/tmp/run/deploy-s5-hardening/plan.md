# Plan: Bare-metal hardening — secrets/rollback CORE-convention seam + reference binding (#341 [Deploy-S5])

> **PLAN-ONLY.** No production code is written in this phase. Implement is **GATED on #364 (S3
> `OsServicePort`/adapters + S4 `deno compile`) merging** and on PLAN-EVAL PASS. This slice is the
> **reference binding** for R-DEPLOY-3: it *defines* the target-agnostic secrets + rollback +
> health-gate + OTEL convention seam in the deploy **core**, and proves it against bare-metal
> (Linux systemd + Windows SERVY). #342 (deno-deploy) and #343 (aspire) **deferred** their
> `rollback`/`secrets` ops onto this seam and will delegate to it with **zero convention
> re-implementation**.

## Run Metadata

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Run ID         | `deploy-s5-hardening`                                                             |
| Branch         | `feat/deploy-s5-hardening` (forked off `origin/main` @ `bd03e51d`)                |
| Phase          | `plan` (PLAN-ONLY; Implement blocked on #364 merge + PLAN-EVAL PASS)             |
| Issue / epic   | `#341` (child of epic `#327`), milestone `0.0.1-beta.1`, BETA · Phase 1          |
| Target         | `packages/cli` (deploy core + bare-metal bindings) + `packages/config` (schema)  |
| Archetype      | **7 — Deployment Target Adapter (composite: Arch 2 port/adapter core + Arch 6 thin router)** |
| Scope overlays | `none` (no new Fresh/UI surface; deploy-time side effects at the edge only)      |

## Archetype

**ARCHETYPE-7 — Deployment Target Adapter (composite).** Doctrine:
`.llm/harness/archetypes/ARCHETYPE-7-deploy-target-adapter.md` +
`docs/architecture/doctrine/06-archetypes.md#archetype-7`. This slice is where the archetype's
**core-centralization rule R-DEPLOY-3** ("convention-bearing primitives — health gating, OTEL,
secrets, rollback — live in the core, shared across all targets") is first *realized in code*. The
uniform contract row for `rollback` reads: "bare-metal: **health-gated**; cloud: native" — exactly
this slice. `F-DEPLOY-1/2` are seeded `reviewed`; this slice + #364 promote them toward `gated`.

The deliverable is **not** bare-metal-private logic. It is:

1. a set of **target-agnostic CORE convention primitives** in `packages/cli/src/kernel/domain/deploy/**`
   (contracts + pure orchestration + injected **port interfaces**), that
2. the 7-op `DeployTargetPort` `rollback`/`secrets` ops (and the health-gated `up`) route through, with
3. **bare-metal** (systemd + SERVY) supplying the first concrete **port bindings** (the reference
   binding that ratifies the seam), and
4. a documented mapping showing how #342/#343 later supply *their* platform binding onto the *same*
   core convention.

## Grounded facts (research → design inputs)

- **7-op port already on `main`** (`deploy-target-port.ts`, landed via S0/#370): `plan · emit · up ·
  down · status · logs · rollback · secrets`, every method optional, legacy `build/install/uninstall`
  aliases retained. `rollback?`/`secrets?` JSDoc explicitly says "bodies → #341". **I do not redefine
  the port** — I fill in the deferred bodies + the core they route to.
- **S3 shape (#364, worktree `.claude/worktrees/deploy-s3`, not yet merged):**
  - `ServiceDeployTarget` (kernel/domain, abstract) declares a **6-op** subset
    `['plan','emit','up','down','status','logs']` (`SERVICE_DEPLOY_OPERATIONS`) + legacy aliases;
    `rollback`/`secrets` are **declared-unsupported (omitted)** with a code comment "until #341 (LD-4)".
    `LinuxServiceDeployTarget`/`WindowsServiceDeployTarget` only override `key`/`label`.
  - The descriptor is **declarative** — its handlers return an operation *descriptor*, not real I/O.
    Real systemd/servy execution lives on the **public deploy path** via `OsServicePort`
    (`public/ports/os-service-port.ts`: `install/start/stop/status/uninstall`) with
    `SystemdOsServiceAdapter` / `ServyOsServiceAdapter` (`public/adapters/**`), pure renderers/arg
    builders under `kernel/adapters/{linux/systemd,windows/servy}/**`. S3 drift note **D-S8**
    explicitly hands "wiring an injected port/compile delegation onto this seam" to **#341**.
  - Env-file secrets already exist in embryo: `kernel/adapters/windows/environment/env-file-writer.ts`
    writes `.deploy/<target>/.env` via `Deno.writeTextFile` — but with **no restricted permission**
    and Windows-only. #341 lifts this to a target-agnostic, 0600-equivalent convention.
- **Config base (`packages/config/.../deploy-schema.ts`):** `deployTargetBaseShape` is the spread-composed
  target-agnostic base (R-DEPLOY-4). It already carries a `health` block, but that is *runtime
  heartbeat monitoring* (servy `heartbeatIntervalSeconds`/`maxFailedChecks`), **not** deploy-time
  health-*gated activation*. `resolveDeployBase` in
  `kernel/adapters/config/deploy-config-resolvers.ts` defaults every base field. The `linux` member +
  `resolveLinuxDeploy` live in #364's worktree (not yet on `main`).
- **OTEL:** `env-file-content.ts`/`writeEnvFile` already accept `otlpEndpoint`/`otlpProtocol` options;
  no `OTEL_DENO` is emitted yet, and it is not wired into the systemd unit / servy XML environment.

## Locked Decisions

| ID  | Decision | Rationale |
| --- | -------- | --------- |
| **D1** | **The R-DEPLOY-3 primitives live in `packages/cli/src/kernel/domain/deploy/**` as pure contracts + orchestrators + injected *port interfaces*.** No `Deno.*` I/O, no `public/**` import in these modules (hexagonal: kernel-domain may not depend on public; edge-only side effects, A11). Side-effecting work is expressed as **ports** the domain declares and adapters implement at the edge. | R-DEPLOY-3 mandates conventions in the core; A11/F-CLI-16 keep I/O at the edge; matches S3's existing kernel-domain-descriptor / public-adapter split. |
| **D2** | **Secrets convention** = `secrets-convention.ts`: types (`SecretRef`, `SecretsBundle`, `SecretsReconcileRequest/Result`), the policy constant `RESTRICTED_SECRET_FILE_MODE = 0o600`, a **pure** renderer `renderSecretsEnvFile(bundle) → { content, mode }`, an injected **`SecretsStorePort`** (`put`/`list`/`clear`), and a pure orchestrator `reconcileSecrets(request, store)`. **Every adapter's `secrets` op delegates to `reconcileSecrets`; only the `SecretsStorePort` binding is per-target.** | Centralizes the "restricted-perm env-file, never world-readable" convention once; per-target code shrinks to a store binding. |
| **D3** | **Rollback convention** = `rollback-convention.ts`: types (`ReleaseId`, `ReleaseRecord`, `ReleaseHistory`, `RollbackRequest/Result`), retention constant `DEFAULT_RELEASE_RETENTION = 3`, **pure** math `retainReleases(history, keep)` + `selectRollbackTarget(history)`, an injected **`ActivationPort`** (`activate(releaseId)`/`current()`/`history()`/`record(release)`), and a pure orchestrator `rollbackToPrevious(request, activation)`. **Every adapter's `rollback` op delegates to `rollbackToPrevious`; only the `ActivationPort` binding is per-target.** | Version-retention + previous-good selection is convention, not platform detail; the platform only supplies the atomic swap. |
| **D4** | **Health-gate convention** = `health-gate.ts`: `HealthProbeSpec` (`url`/`path`, `timeoutMs`, `intervalMs`, `retries`, `expectStatus`), injected **`HealthProbePort`** (`probe(spec)`), and a **pure** orchestrator `runHealthGate(spec, probe, sleep)` returning `{ passed, attempts }`. | "New version only takes traffic after a health probe passes" is a shared convention; the transport (fetch) is the only edge binding. |
| **D5** | **Health-gated activation** = `activation-convention.ts`: the composite orchestrator `activateWithHealthGate({ candidate, activation, health, spec })` — (1) `activation.activate(candidate)`, (2) `runHealthGate(...)`, (3a) on **pass** `activation.record(candidate)` + `retainReleases`/prune, (3b) on **fail** `activation.activate(previous)` (**automatic rollback**) and return failure. `up` routes through this. | This is the single core primitive that makes "atomic activate/rollback + health-gated activation" true for *any* target; bare-metal is its reference exercise. |
| **D6** | **OTEL convention** = `observability-convention.ts`: pure `observabilityEnv(opts) → Record<string,string>` emitting `OTEL_DENO=1` (+ `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT/PROTOCOL` when configured). Bare-metal wires this env-map into the **systemd unit** (`Environment=`) and **servy XML** (`environmentVariables`); cloud adapters can inject the same map into their platform env. | `OTEL_DENO` is a Deno-*runtime* feature common to every Deno target, so the env derivation is convention, not bare-metal-private. |
| **D7** | **Bare-metal reference bindings** (edge adapters): `EnvFileSecretsStore` (`SecretsStorePort`; writes the rendered env file then `Deno.chmod(0o600)` on POSIX / owner-only ACL on Windows), `SymlinkActivationPort` (Linux: `releases/<id>/` + atomic `current` symlink swap + `systemctl restart` via `OsServicePort`) and `DirSwapActivationPort` (Windows: junction/dir swap + servy restart), `FetchHealthProbe` (`HealthProbePort`; `fetch` with `AbortSignal.timeout`). These implement the D2–D5 ports. | First concrete binding = the seam ratifier; proves the port interfaces are sufficient and platform-neutral. |
| **D8** | **7-op promotion + routing.** Promote `ServiceDeployTarget` to the full **7-op** set (add `rollback`/`secrets` to `operations` + handlers) and make `up` health-gated. Handlers delegate to the D2/D3/D5 orchestrators via **optional injected ports** (constructor deps). When ports are absent (pure registry descriptor) the adapter still constructs; the **public deploy path** injects the concrete bare-metal bindings for real execution. The thin router (`netscript deploy <target> rollback|secrets`) only dispatches — no target logic (R-DEPLOY-2). | Makes bare-metal a genuine 7-op adapter (F-DEPLOY-1) while keeping conventions in core and the router thin (F-DEPLOY-2). Honors S3 D-S8 hand-off. |
| **D9** | **Config surface is added to `deployTargetBaseShape` (spread, target-agnostic — R-DEPLOY-4), not a per-target base class.** New base blocks: `activation` (`retain?`, `strategy?: 'symlink'|'dir-swap'`, `healthGate?: { path?, port?, timeoutMs?, intervalMs?, retries?, expectStatus? }`), `secrets` (`envFile?`, `mode?`), `otel` (`enabled?`, `endpoint?`, `protocol?`, `serviceNamePrefix?`). `resolveDeployBase` defaults all. | Conventions are shared → their config is on the shared base; every current and future target inherits them for free. |
| **D10** | **Dispatch lane = Opus 4.8 sub-agents** (this epic), evaluator a separate Opus session. **Not** WSL Codex / OpenHands for the deployment epic. | Epic dispatch-lane override (matches #342/#343 plans D10). |

## How #342 (deno-deploy) and #343 (aspire) delegate — R-DEPLOY-3 proof

Both siblings shipped their implementer phase with `rollback`/`secrets` **deferred onto this seam**
(#342 declared subset `[plan, up, down, status, logs]`; #343 same). After #341 lands, each adds
**only a port binding** — no convention logic:

| Convention primitive (core, this slice) | Bare-metal binding (D7, reference) | #342 Deno Deploy binding | #343 Aspire/compose binding |
| --------------------------------------- | ---------------------------------- | ------------------------ | --------------------------- |
| `reconcileSecrets` + `SecretsStorePort` | `EnvFileSecretsStore` (0600 env file) | `SecretsStorePort` → `deno deploy env add [--secret]` / `env load` | `SecretsStorePort` → Aspire secret `Parameters__*` |
| `rollbackToPrevious` + `ActivationPort` | `Symlink`/`DirSwapActivationPort` (swap `current` + service restart) | `ActivationPort` → platform repoint to prior good deployment | `ActivationPort` → redeploy last-good emitted artifact/image tag |
| `runHealthGate` + `HealthProbePort` (`activateWithHealthGate`) | `FetchHealthProbe` | `FetchHealthProbe` (or platform status) | `FetchHealthProbe` against emitted service |
| `observabilityEnv` (`OTEL_DENO`) | systemd `Environment=` / servy XML env | `deno deploy` env vars | `Parameters__*` env |

**Proof of zero re-implementation:** retention math, previous-good selection, the health-gate retry
loop, the rollback-on-fail sequencing, the env-file render + restricted-mode policy, and the OTEL env
derivation are **all in `kernel/domain/deploy/**`**. Each adapter's `rollback`/`secrets`/`up` handler
is `~10 lines` that constructs its store/activation/probe binding and calls the core orchestrator.
The #343 plan currently proposes its **own** "S3 · core conventions — centralize secrets + rollback"
— that is **this slice's seam**; #343 must **consume** these modules, not re-create them (see
Collision Map).

## Slice breakdown (contract-first: schema/type → impl → tests)

| #  | Slice | Contract-first order | Files (relative to repo root) | Gate / validation |
| -- | ----- | -------------------- | ----------------------------- | ----------------- |
| **S1** | **Config contract** — add `activation`/`secrets`/`otel` blocks to `deployTargetBaseShape`; extend `ResolvedDeployBaseConfig` + `resolveDeployBase` defaults. | schema+types → resolver → tests | `packages/config/src/domain/schemas/deploy-schema.ts`, `packages/config/src/domain/config-section-types.ts`, `packages/cli/src/kernel/adapters/config/deploy-config-resolvers.ts`, `packages/cli/src/kernel/domain/resolved-config.ts`, `packages/cli/src/kernel/constants/*.ts`; tests `packages/config/tests/schema/deploy_schema_test.ts` (+ resolver `_test.ts`) | `run-deno-check.ts` (config+cli, `--ext ts`) · schema round-trip/defaults test · `deno publish --dry-run` (config) |
| **S2** | **Core secrets convention** — `SecretsStorePort`, `renderSecretsEnvFile`, `reconcileSecrets`, `RESTRICTED_SECRET_FILE_MODE`. | types+port → orchestrator → tests | NEW `packages/cli/src/kernel/domain/deploy/secrets-convention.ts` (+ `secrets-convention_test.ts`) | `run-deno-check.ts` (cli) · pure unit tests (fake store; render mode = 0o600; escaping) |
| **S3** | **Core rollback + health-gate + activation** — `ActivationPort`, retention math, `rollbackToPrevious`, `HealthProbePort`, `runHealthGate`, `activateWithHealthGate`. | types+ports → orchestrators → tests | NEW `packages/cli/src/kernel/domain/deploy/rollback-convention.ts`, `health-gate.ts`, `activation-convention.ts` (+ co-located `_test.ts`) | `run-deno-check.ts` (cli) · unit tests covering **rollback path + health-gate pass/fail/timeout + rollback-on-fail** (fake ports + injected clock) |
| **S4** | **Core OTEL convention** — `observabilityEnv`. | types → fn → tests | NEW `packages/cli/src/kernel/domain/deploy/observability-convention.ts` (+ `_test.ts`) | `run-deno-check.ts` (cli) · unit test (`OTEL_DENO=1`; endpoint/protocol wiring) |
| **S5** | **Bare-metal reference bindings** — `EnvFileSecretsStore`, `Symlink`/`DirSwapActivationPort`, `FetchHealthProbe`; wire `observabilityEnv` into the systemd unit renderer + servy XML env. | adapters → tests | NEW `packages/cli/src/kernel/adapters/{linux,windows}/**` (or `public/adapters/**` where `OsServicePort` is needed — see D8 layering); edits to `kernel/adapters/linux/systemd/systemd-unit.ts`, `kernel/adapters/windows/servy/servy-environment.ts`, `kernel/adapters/windows/environment/env-file-writer.ts` (**#364-owned — post-merge, see Collision Map**) | `run-deno-check.ts` (cli) · adapter unit tests (fake `ProcessPort`/`OsServicePort`/fs; assert `chmod 0o600`, atomic swap ordering, argv) |
| **S6** | **7-op promotion + thin-router reach** — full 7-op `ServiceDeployTarget` (rollback/secrets handlers + health-gated up delegating to core via injected ports); public `deploy <target> rollback|secrets` dispatch; README permissions. | descriptor+wiring → tests → docs | `packages/cli/src/kernel/domain/deploy/service-deploy-target.ts` (**#364-owned — post-merge**), `packages/cli/src/public/features/deploy/**` (thin router reach), `packages/cli/README.md` | `run-deno-check.ts` · descriptor + router tests · F-DEPLOY-1 (7-op) + F-DEPLOY-2 (thin router / conventions in core) manual evidence |
| **S7** | **Docs / debt / drift** — arch-debt (Archetype-7 core-centralization **advanced**), harness drift + worklog, per-slice PR comments. | docs only | `.llm/harness/debt/arch-debt.md`, `.llm/tmp/run/deploy-s5-hardening/{drift,worklog}.md` | `run-deno-fmt.ts` + `run-deno-lint.ts` |

**Slice count: 7** (< 30). S2–S4 (pure core) are unblocked design-wise and can be authored against
`origin/main` today; **S1, S5, S6 edit #364-owned files and are hard-gated on #364 merge** (rebase
first). Merge-readiness `scaffold.runtime` e2e is the evaluator's authority, not a per-slice gate.

## Test strategy (rollback + health-gate emphasis)

- **`runHealthGate`** (S3): fake probe returning `fail × (retries-1)` then `pass` → asserts retries
  honored + `passed:true`; all-fail → `passed:false` after `retries` attempts; timeout (probe
  rejects/`AbortSignal`) counts as a failed attempt; injected `sleep` so tests are deterministic and
  fast.
- **`activateWithHealthGate`** (S3): fake `ActivationPort`. Health **pass** → `activate(candidate)`
  called once, `record(candidate)` called, `retainReleases` prunes to `retain`, current = candidate.
  Health **fail** → after activation the port receives `activate(previous)` (**automatic rollback**),
  result = failed, current back at previous. Asserts ordering: candidate activated **before** probe.
- **`rollbackToPrevious`** (S3): history fixture with ≥2 good releases → selects previous good,
  calls `activate(prev)`; single/empty history → structured "nothing to roll back to" result, no
  activation call.
- **`retainReleases`** (S3): prunes oldest beyond `keep`; **never** prunes the current release;
  `keep >= len` → no-op.
- **`reconcileSecrets` / `renderSecretsEnvFile`** (S2): fake `SecretsStorePort` → `put` receives the
  rendered content; render asserts `mode === 0o600`, `KEY=VALUE` lines, value escaping/quoting, and
  no world-readable bits.
- **Bare-metal bindings** (S5): `EnvFileSecretsStore` with a fake fs → asserts `chmod(0o600)` invoked
  on POSIX; Windows branch asserts owner-only ACL call (or records a documented bound in arch-debt if
  ACL is best-effort). `ActivationPort` adapters with fake `ProcessPort`/`OsServicePort` → assert
  swap + restart argv and atomicity. `FetchHealthProbe` with a stub fetch → status/timeout mapping.
- **7-op descriptor** (S6): `operations` includes `rollback`/`secrets`; handlers with injected fake
  ports delegate to the core orchestrators (spy asserts delegation, **not** re-implementation).
- **Semantic assertions only** (AP-18): assert argv arrays / mode ints / call-order, never stdout
  snapshots.

## NEEDS-USER (surfaced, not invented)

| # | Item | Default proposed (reversible) | Why it needs a decision |
| - | ---- | ----------------------------- | ----------------------- |
| **U1** | **Health-probe contract** — what endpoint/status defines "healthy" for gated activation? | Default: HTTP `GET {service}:{port}/health`, expect `200`, `retries:5`, `intervalMs:2000`, `timeoutMs:2000`. | The issue says "a health probe passes" but defines no endpoint/path/status contract; the default path/port convention is product-facing. Does not block the core seam shape (all fields are `HealthProbeSpec` config). |
| **U2** | **Windows secret-file permission mechanism** — `0o600` has no direct Windows analogue. | Default: owner+SYSTEM-only ACL via `icacls` (inherit-disabled), treated as the "0600-equivalent". | POSIX `chmod 0o600` is unambiguous; Windows restricted-perm needs an explicit ACL policy. Beta baseline is env-file (external secret store is the deferred stable slice per the issue). |
| **U3** | **Release retention count** | Default `3` (`DEFAULT_RELEASE_RETENTION`). | Safe, reversible default; recorded so PLAN-EVAL can confirm the deferral is safe. Not blocking. |

None of U1–U3 changes the **seam shape** (ports, orchestrators, config-block names) — they are field
defaults/policy, so deferring them does not force rework.

## Collision Map

Every file a slice edits, with overlap flags. **#364-owned deploy-domain files are hard-gated: my
Implement rebases onto #364 post-merge; I do not edit them before that.**

| File | My slice | Overlap / owner | Action |
| ---- | -------- | --------------- | ------ |
| `kernel/domain/deploy/deploy-target-port.ts` | (read-only) | on `main` (S0/#370), 7-op already declared | **No edit** — I fill deferred bodies + their core, not the port. |
| `kernel/domain/deploy/service-deploy-target.ts` | S6 (promote 6→7-op) | **#364 (S3)** owns this file | **COLLISION** → gate S6 on #364 merge; rebase, then add `rollback`/`secrets`. Flag for coordinator sequencing. |
| `kernel/domain/deploy/{linux,windows}-service-deploy-target.ts` | S6 (inherit 7-op) | **#364 (S3)** | Collision via the base; same gate. |
| `kernel/adapters/linux/systemd/systemd-unit.ts` | S5 (OTEL `Environment=`) | **#364 (S3)** owns systemd renderer | **COLLISION** → post-#364-merge edit; flag. |
| `kernel/adapters/windows/servy/servy-environment.ts` | S5 (OTEL env) | #364/main (servy adapters) | **COLLISION** → post-merge edit; flag. |
| `kernel/adapters/windows/environment/env-file-writer.ts` | S5 (restricted-mode via store) | main/#364 | **COLLISION-adjacent** → prefer NEW `EnvFileSecretsStore` that *reuses* the writer rather than mutating it; edit only if unavoidable; flag. |
| `packages/config/.../deploy-schema.ts` | S1 (base-shape blocks) | **#364 (S3)** adds `linux` member + base edits in its worktree | **COLLISION** → rebase onto #364's config commit; add my base blocks after. Flag. |
| `kernel/adapters/config/deploy-config-resolvers.ts`, `kernel/domain/resolved-config.ts`, `kernel/constants/*.ts` | S1 (defaults) | #364 adds linux resolver/consts | **COLLISION** → rebase; extend `resolveDeployBase` (shared) so both members inherit. Flag. |
| `public/features/deploy/**` (thin router reach for rollback/secrets) | S6 | #364 touches install/uninstall/start/stop/status features | **Possible overlap** → add new `rollback`/`secrets` command files; avoid editing #364's verb files. Flag if the router entry is shared. |
| NEW `kernel/domain/deploy/{secrets-convention,rollback-convention,health-gate,activation-convention,observability-convention}.ts` | S2–S4 | **none** (new files) | Clean — no collision. |
| **Shared register/aspire generators** (`generate-register-infrastructure.ts`, `packages/aspire/config.ts`, `helpers-generator-pipeline.ts`, `generate-aspire-config.ts`, `render-ts-apphost.ts`) | **none** | sibling **aspire lane (#343)** owns these | **I do NOT touch them.** No collision from #341. |
| **Cross-plan seam collision** | S2–S4 | **#343 (aspire)** plan proposes its own "S3 · core conventions — centralize secrets + rollback in the deploy core" | **FLAG FOR COORDINATOR:** that is *this* slice's seam. #341 must land the `kernel/domain/deploy/*-convention.ts` modules; #343 must **consume** them (construct its `SecretsStorePort`/`ActivationPort` bindings), not re-create the core. Sequence #341 core (S2–S4) before #343's adapter, or have #343 rebase onto #341. |

## Fitness gates (Archetype 7 + composed)

| Gate | Required | Evidence |
| ---- | -------- | -------- |
| **F-DEPLOY-1** (7-op contract or declared subset) | yes | Bare-metal `operations` = full 7-op incl. `rollback`/`secrets`; subset/delegation test (S6). |
| **F-DEPLOY-2** (thin router; conventions in core) | yes | Router only dispatches (R-DEPLOY-2); `rollback`/`secrets`/`up` delegate to `kernel/domain/deploy/*-convention.ts` (R-DEPLOY-3); import-graph evidence. |
| Static check/lint/fmt (scoped wrappers) | yes | `run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts` on `packages/cli` + `packages/config`, `--ext ts`. |
| F-CLI-16 (`Deno.*` only in adapters) | yes | Convention modules are pure; I/O in `EnvFileSecretsStore`/activation adapters/`FetchHealthProbe` only. |
| F-4 (kernel ≠ public import) | yes | `kernel/domain/deploy/**` imports no `public/**`; ports injected. |
| F-6 / publish dry-run (config) | yes | `deno publish --dry-run` on `@netscript/config` after S1. |
| AP-19 (permissions documented) | yes | README: `--allow-run` (systemctl/servy), `--allow-net` (health probe), `--allow-write`/`--allow-read` (env file), `--allow-sys` as needed. |
| Merge-readiness | evaluator | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` — evaluator pass, not per-slice. |

## Anti-patterns to avoid

| AP | Plan |
| -- | ---- |
| Convention duplication (R-DEPLOY-3) | Secrets/rollback/health/OTEL centralized in `kernel/domain/deploy/*-convention.ts`; adapters supply only a port binding. |
| AP-11 (side effects outside adapters) | Domain conventions are pure; I/O confined to the named edge adapters. |
| AP-24 (switch-over-union) | Bare-metal registered in the closed-on-key `deploy-target-registry`; router does not branch on target. |
| AP-3 (port bloats with every backend op) | The 7-op port is not widened; the *convention ports* (`SecretsStorePort`/`ActivationPort`/`HealthProbePort`) are narrow, single-purpose seams. |
| AP-18 (string-snapshot tests) | Semantic argv/mode/call-order assertions only. |
| Config base-class hierarchy (R-DEPLOY-4) | New config blocks spread onto `deployTargetBaseShape`; no per-target inheritance. |

## Implement gate (merge order)

```
#364 (S3 OsServicePort/adapters + S4 deno-compile) merged to main
   → rebase feat/deploy-s5-hardening onto main
   → author S1,S5,S6 (touch #364-owned files) + land S2,S3,S4 (new core, mergeable independently)
```

S2–S4 (new-file core conventions) are safe to author now against `origin/main`; S1/S5/S6 wait for
#364. #342/#343 rebase onto #341's core-convention commit (or #341 lands first) so their deferred
`rollback`/`secrets` bind to the shared seam.
