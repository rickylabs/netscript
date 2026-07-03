# Plan: Deploy-S7 — Aspire Docker/Compose deploy target adapter (#343)

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `deploy-s7-aspire`                                         |
| Branch         | `feat/deploy-s7-aspire` (tracks `origin/main`)             |
| Phase          | `plan` (PLAN-EVAL pending — separate session)              |
| Target         | `packages/cli` (deploy core + adapter + router) + `packages/config` (schema) + scaffold AppHost gen |
| Archetype      | 7 — Deployment Target Adapter (composite: A2 core + A6 router) |
| Scope overlays | service (Aspire/runtime validation) · none-frontend        |

## Archetype

**Archetype 7 — Deployment Target Adapter** (composite). The Aspire docker/compose target is a
**cloud adapter behind the deploy port** (A2 core seam) plus a **thin `deploy <target>` router**
(A6). Per doctrine it DELEGATES `up`/`plan` to the Aspire CLI (A7 — wrap, do not reinvent). The
deployment core lives inside `packages/cli` today (Archetype 6 host); extraction to a dedicated
`@netscript/deploy` package is a later stable concern (arch-debt), not this slice.

## Current Doctrine Verdict

Deploy feature is future-wave in doctrine; `F-DEPLOY-1/2` are seeded **`reviewed`** (manual evidence)
until the deployment packages exist. This slice conforms the docker/compose adapter to the ratified
Archetype 7 7-op contract without promoting the gates to `gated` (that promotion is an epic-level
step once all #339–#343 land).

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A2    | Port/adapter seam — the docker/compose adapter sits behind the deploy port; ≥2 cloud adapters foreseeable (compose, aca, k8s) justify it (R-DEPLOY-5). |
| A5    | No config base-class hierarchy — the docker/compose member **spreads** `deployTargetBaseShape` (R-DEPLOY-4). |
| A7    | Wrap, do not reinvent — `plan`/`up` shell `aspire publish`/`aspire deploy`; never hand-roll compose/manifest generation (F-2). |
| A9    | Explicit permissions — the adapter declares `--allow-run` for `aspire`/`docker`; no ambient authority. |
| A11   | Named extension axis = the deploy **target**, resolved through the closed-on-key `DeployTargetRegistry`. |
| A13   | Convention-bearing primitives (secrets, rollback) centralized in the deploy core, shared across targets (R-DEPLOY-3). |

## Goal

Ship a beta-tier Aspire-driven **Docker / Compose** deploy target: `netscript deploy docker|compose
<verb>` routes through a thin router to an adapter that generates compose artifacts via
`aspire publish` (against a compose-enabled generated `apphost.mts`), applies via
`aspire deploy` / `docker compose up`, and covers the full 7-op lifecycle (supported subset,
no silent no-ops), with NetScript config surfaced as `Parameters__*` and a `denoland/deno:2` base.

## Scope

- **Config (`packages/config`):** add a `docker`/`compose` member schema to `deploy.targets.*`
  spreading `deployTargetBaseShape`; re-home the existing `docker` sub-block; keep `denoland/deno:2`.
- **Core port (`packages/cli/.../domain/deploy`):** expand the seed 3-op `DeployTargetPort` → the
  uniform **7-op** contract (`plan`/`emit` · `up` · `down` · `status` · `logs` · `rollback` ·
  `secrets`, all optional; adapters declare supported ops via `operations`). Migrate the
  `windows-service` stub + registry to the expanded surface.
- **Core conventions:** centralize the **secrets** + **rollback** convention primitives in the deploy
  core (shared, not per-adapter) — R-DEPLOY-3.
- **AppHost generation (scaffold templates):** extend `apphost.mts` generation to emit
  `addDockerComposeEnvironment` + a Deno `addContainer('denoland/deno:2')`/`addDockerfile` resource +
  `publishAsDockerComposeService`, config → `Parameters__*` mapping.
- **Adapter (one file):** `adapters/aspire/aspire-compose-deploy-target.ts` implementing the supported
  subset by shelling `aspire` + `docker compose` through the existing `ProcessPort`; registered under
  keys `docker`/`compose`.
- **Router (A6, thin):** add `docker`/`compose` target sub-commands to `deploy-group.ts` that only
  parse + route (no target-specific logic) — R-DEPLOY-2 / F-DEPLOY-2.
- **Docs + arch-debt:** update `how-to/deploy.md`; record the `@netscript/deploy` extraction + full
  router-convergence deferral.
- **E2E gate:** CI-safe compose-artifact emit + `docker compose config` validation (live boot opt-in).

## Non-Scope

- **Bare-metal `OsServicePort` / systemd** (#339) — separate lane; only coordinate the shared port expansion.
- **Deno Deploy adapter** (#342) — separate marquee lane.
- **k8s + Azure (ACA/App Service) publish shapes** — stable slice S10/#346.
- **Full `deploy <target> <verb>` convergence for ALL targets** (retiring the legacy flat Windows
  verbs) — S12/#348. This slice adds docker/compose target sub-commands **alongside** the legacy verbs.
- **ada2a5 `AddDenoApp`** named resource type — optional DX fold-in later (#320, TRACK).
- **Extracting a `@netscript/deploy` package** — deferred (arch-debt).
- **CI/CD template generation + secret-store hardening** — Phase 4 (#347).

## Hidden Scope

- The seed `DeployTargetPort` is **3-op**; a real 7-op adapter cannot register cleanly without the
  port expansion — S7 must own it if #342/#339 have not landed it first (coordination, see risks).
- `WindowsServiceDeployTarget` + `DeployTargetRegistry` + `deploy_test.ts` reference the 3-op surface;
  expanding the port forces a migration of the stub + tests in the same slice (no orphaned 3-op).
- The adapter shells external CLIs → the CLI's permission manifest must declare `--allow-run` for
  `aspire`/`docker` (F-9).
- `publishAsDockerComposeService` requires the AppHost to add a **compose environment**; the current
  generated `apphost.mts` has none — apphost generation must change, which ripples into scaffold
  snapshot tests and the `scaffold.runtime` E2E.
- Config public surface change (new schema export) triggers a JSR publishability check on `@netscript/config`.

## Locked Decisions

| ID    | Decision | Rationale |
| ----- | -------- | --------- |
| L1    | Target the **7-op** uniform contract; never entrench 3-op. | Doctrine is LOCKED (contract-reconciliation.md); 7-op is the canonical epic contract. |
| L2    | **Delegate** `plan`→`aspire publish`, `up`→`aspire deploy`/`docker compose up`; no hand-rolled compose/manifest generation. | A7 / R-DEPLOY-1; F-2 helper-reinvention. |
| L3    | Post-apply lifecycle (`down`/`status`/`logs`) shells `docker compose` against the emitted project; `rollback` re-deploys the last-good emitted artifact/image (NOT a silent no-op); `secrets` uses the centralized core convention via Aspire secret `Parameters__*`. | R-DEPLOY-3; rollback must map to a platform-native mechanism. |
| L4    | Adapter lands as **one file** at `adapters/aspire/aspire-compose-deploy-target.ts`; shells via the existing `ProcessPort` (`kernel/ports/process-port.ts`, `DenoProcess`). | One-adapter-per-file (F-16/F-17); wrap existing runtime port (F-2). |
| L5    | Deploy core stays **inside `packages/cli`** for beta; `@netscript/deploy` extraction is arch-debt. | Incremental beta; matches where the seed port + registry already live. |
| L6    | Router adds `docker`/`compose` sub-commands **alongside** the legacy flat Windows verbs; no rip-out. | Full convergence is S12; keep S7 additive + low-risk. Router stays a thin parse+route surface (R-DEPLOY-2). |
| L7    | Config member **spreads** `deployTargetBaseShape`; re-home the `docker` sub-block; base image `denoland/deno:2`. | R-DEPLOY-4 / A5; issue AC #4. |
| L8    | Merge gate E2E = CI-safe **artifact emit + `docker compose config` validation**; live `docker compose up` boot is an opt-in/local gate. | Issue AC allows "CI-safe equivalent"; a Docker daemon in the runner is not guaranteed. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Who physically lands the 3-op→7-op port expansion (#342 vs #339 vs #343). | **safe to defer** (merge-order only) | L1 fixes the design target; if a sibling lands it first, S7 rebaselines (a merge reconciliation, not a redesign — no rework). Tracked in Risk R1 + Drift Watch. |
| `docker` and `compose` as **two registry keys** vs one. | **resolve now → RESOLVED** | One adapter, **two keys**: `compose` = emit + self-host `docker compose up`; `docker` = single-image build/push path (thin variant of the same adapter). Both delegate to Aspire publish; the adapter branches on key. Keeps R-DEPLOY-2 (no logic in router). |
| E2E depth (live boot vs artifact validation) as the **merge gate**. | **resolve now → RESOLVED (L8)** | CI-safe artifact validation is the gate; live boot opt-in. |
| Whether S7 promotes `F-DEPLOY-1/2` to `gated`. | **safe to defer** | No — promotion is an epic-level step after all #339–#343 land. S7 keeps them `reviewed` with manual evidence. |
| Non-interactive `aspire deploy` auth / registry push in CI. | **safe to defer** | Only exercised by the opt-in live-boot gate, not the merge gate. Surface as a follow-up note, not a blocker. |

> No open decision forces rework when deferred → Plan-Gate open-decision check satisfiable.

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| **R1** Port-expansion collision with #342/#339 (both may edit `deploy-target-port.ts`). | L1 fixes the design; S7 rebaselines against whichever lands first; keep the port-expansion its own early slice so a rebase is surgical. Log to `drift.md` if a sibling merges mid-run. |
| **R2** Aspire CLI / Docker daemon absent in CI → E2E flakes. | L8: merge gate needs only `aspire publish` + `docker compose config` (no daemon). `scaffold.runtime` already restores/starts Aspire, so the Aspire CLI is present there. |
| **R3** `aspire publish` output shape (compose filename/dir) not pinned → brittle adapter. | Adapter reads the emitted artifact path from `aspire publish --output-path`; validate via `docker compose -f <path> config`; snapshot-test the generated `apphost.mts`, not Aspire's internal output. |
| **R4** apphost.mts generation change breaks the existing `scaffold.runtime` E2E. | Land apphost-gen as its own slice with snapshot tests; run the full `scaffold.runtime` smoke in the merge-readiness pass. |
| **R5** Reinventing compose generation (violates F-2/A7). | L2 hard rule: adapter only shells Aspire for emit/apply; reviewer checks no YAML is hand-authored in the adapter. |
| **R6** Secrets/rollback implemented per-adapter (violates R-DEPLOY-3). | S3 centralizes both in the deploy core before the adapter is written; adapter calls the core primitive. |
| **R7** Doctrine PR #357/#338 not yet merged when S7 slices. | Conform by reference to the read-only archetype md; note in PR that gate promotion waits on #338. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-11 (target-specific base class / premature port) | risk | Adapter behind the existing port; no per-target base class; seam justified by ≥2 cloud adapters (R-DEPLOY-5). |
| Thin-router violation (R-DEPLOY-2) | risk | Router only parses + routes to the adapter; adapter branches on key; F-DEPLOY-2 evidence. |
| Convention duplication (R-DEPLOY-3) | risk | Secrets + rollback centralized in core (S3) before adapter. |
| Config base-class hierarchy (R-DEPLOY-4) | risk | Member spreads `deployTargetBaseShape` (S1). |
| Helper reinvention (F-2 / A7) | risk | Delegate compose/manifest to Aspire; wrap `ProcessPort`; reuse `infrastructure-docker.ts` helpers. |

## Fitness Gates

Archetype 7 = union of Archetype 2 (core) + Archetype 6 (router) universal gates + F-DEPLOY-1/2.

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-DEPLOY-1 (uniform 7-op / subset; config spreads base) | yes | Manual (`reviewed`): registry scan shows the adapter declares its supported ops; config member spreads `deployTargetBaseShape`. |
| F-DEPLOY-2 (no target logic in router; conventions in core) | yes | Manual (`reviewed`): import-graph/AST — router imports only the registry/adapter entry; secrets+rollback resolve in core. |
| F-1 file-size, F-3 layering, F-4 inheritance, F-5 public surface, F-11 forbidden-folder, F-12 naming, F-16 folder-cardinality, F-17 abstract-derived co-location, F-18 sub-barrel | yes | `deno task lint` + `arch:check` + scoped `run-deno-lint.ts` on touched roots. |
| F-2 helper-reinvention | yes | Review: adapter delegates to Aspire/`docker`, no hand-rolled compose YAML. |
| F-6 JSR publishability / F-5 public surface (`@netscript/config`) | yes | `deno task publish:dry-run` + jsr-audit rubric on the new schema export; keep `z.ZodType<…>` annotations (no slow types). |
| F-9 permission decl | yes | `--allow-run` declared for `aspire`/`docker` in the CLI manifest. |
| F-14 console-log lint (core) | yes | Adapter/core route output through the CLI reporter, not raw `console.log`. |
| Runtime/Aspire validation (Arch 7 = required) | yes | `scaffold.runtime` smoke (apphost gen) + CI-safe compose-artifact validation (L8). |
| Consumer import validation | yes | Generated workspace type-checks with the new apphost + config. |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| deployment — Archetype-7 core-centralization + F-DEPLOY seed | update | Record that S7 expanded 3-op→7-op (or rebaselined onto a sibling's expansion) and added the cloud-adapter seam; gate promotion still pending all #339–#343. |
| `cli-deploy-artifacts-missing` | update/partial-close | S7 delivers the first generated compose artifact path; note remaining targets. |
| `@netscript/deploy` package extraction | create | Deploy core still lives in `packages/cli`; extraction deferred to stable. |
| Full `deploy <target> <verb>` router convergence (retire legacy Windows verbs) | create | Deferred to S12/#348. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/config --root packages/cli --ext ts,tsx` (+ `--unstable-kv`) | clean |
| 2 | lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --root packages/config --ext ts,tsx` | clean |
| 3 | unit (config) | `deno task test` scoped to config schema tests | new docker/compose member validates; base spread verified |
| 4 | unit (adapter) | adapter tests with a **fake `ProcessPort`** asserting each op shells the right `aspire`/`docker compose` argv | all 7 op mappings verified; delegation proven |
| 5 | unit (router) | router tests: `docker`/`compose` sub-commands resolve the adapter, no business logic | thin-router evidence (F-DEPLOY-2) |
| 6 | JSR | `deno task publish:dry-run` | `@netscript/config` publishable; no slow types |
| 7 | arch | `deno task arch:check` | no new violations |
| 8 | scaffold snapshot | apphost.mts generation snapshot test | compose env + Deno container + `publishAsDockerComposeService` present |
| 9 | runtime E2E (merge-readiness) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` + CI-safe compose-artifact emit/`docker compose config` | green; compose artifact emits and validates |

## Design

The design is a **three-layer composite** conforming to Archetype 7:

- **Core (A2 seam, in `packages/cli/src/kernel/domain/deploy`).** The seed 3-op `DeployTargetPort`
  expands to the uniform 7-op contract with every op optional; adapters advertise their supported ops
  via `operations`. Two convention-bearing primitives — **secrets** (restricted-perm env-file backed
  by Aspire secret `Parameters__*`) and **rollback** (redeploy the last-good emitted artifact/image
  from retained deploy state) — live in the core and are shared by all future targets (R-DEPLOY-3),
  never re-implemented per adapter. The closed-on-key `DeployTargetRegistry` is the named extension
  axis (A11).
- **Adapter (one file, `adapters/aspire/aspire-compose-deploy-target.ts`).** Registered under two
  keys — `compose` (emit + self-host `docker compose up`) and `docker` (single-image build/push) — it
  is a pure **delegation shell** over the existing `ProcessPort` (`kernel/ports/process-port.ts` /
  `DenoProcess`). `plan`→`aspire publish --output-path`; `up`→`aspire deploy` / `docker compose up -d`;
  `down`/`status`/`logs`→`docker compose` against the emitted project; `rollback`/`secrets`→core
  primitives. It authors **no** compose YAML itself (A7 / F-2). Unit tests drive a fake `ProcessPort`
  and assert the exact argv per op, proving both the 7-op mapping and the delegation.
- **AppHost generation (scaffold templates).** The generated `apphost.mts` gains a compose
  compute-environment (`addDockerComposeEnvironment`), a Deno `addContainer('denoland/deno:2')` /
  `addDockerfile` resource, and a `publishAsDockerComposeService` per-resource callback, with
  NetScript `appsettings.json` facts mapped to `Parameters__*`. This is what `aspire publish` reads to
  emit the compose artifact — so the adapter never generates the manifest; Aspire does.
- **Router (A6, thin).** `deploy-group.ts` gains `docker`/`compose` sub-commands that only parse flags
  and route to the registry-resolved adapter — zero target-specific logic (R-DEPLOY-2). Legacy flat
  Windows verbs remain untouched; full `deploy <target> <verb>` convergence is S12.

Data flow for `netscript deploy compose plan`:
`router → registry.get('compose') → adapter.plan(request) → ProcessPort.exec('aspire', ['publish', …])
→ emitted docker-compose.yaml + build context`. For `up`: `adapter.up → aspire deploy` (or
`docker compose up -d` on the emitted artifact). The config→`Parameters__*` bridge and the
`denoland/deno:2` base are the only NetScript-owned inputs; image build, compose emission, and apply
are Aspire's.

## Commit-Slice List (ordered, < 30)

1. **S1 · config member** — add `docker`/`compose` target schema spreading `deployTargetBaseShape`;
   re-home `docker` sub-block; `denoland/deno:2`. Files: `packages/config/src/domain/schemas/deploy-schema.ts`,
   `.../config-section-types.ts`, `.../public/mod.ts`, `packages/config/tests/schema/*`. Proves
   R-DEPLOY-4. Gate: check + config unit tests + `publish:dry-run`.
2. **S2 · port expansion** — 3-op → 7-op uniform `DeployTargetPort` (all optional); migrate
   `windows-service-deploy-target.ts` + `deploy-target-registry.ts` + `deploy_test.ts`. Files under
   `packages/cli/src/kernel/domain/deploy/` + `application/registries/` + deploy tests. Proves
   R-DEPLOY-1 shape. Gate: check + deploy tests. (Rebaseline if #342/#339 landed it — R1.)
3. **S3 · core conventions** — centralize secrets + rollback primitives in the deploy core (shared).
   Files: new modules under `kernel/domain/deploy/` (+ tests). Proves R-DEPLOY-3. Gate: unit tests.
4. **S4 · AppHost compose generation** — extend `apphost.mts` gen with `addDockerComposeEnvironment`
   + Deno `addContainer('denoland/deno:2')`/`addDockerfile` + `publishAsDockerComposeService` +
   config→`Parameters__*`. Files: `kernel/templates/aspire/helpers/helpers-generator-pipeline.ts`,
   `kernel/templates/aspire/generate-aspire-config.ts`, embedded assets, `render-ts-apphost.ts`,
   snapshot tests. Gate: snapshot + check.
5. **S5 · Aspire compose adapter** — `adapters/aspire/aspire-compose-deploy-target.ts` implementing
   the supported subset via `ProcessPort` (shell `aspire publish`/`aspire deploy`/`docker compose`);
   register keys `docker`/`compose`. Files: adapter + `deploy-target-registry.ts` + adapter tests
   (fake ProcessPort) + `public-command-dependencies.ts` wiring + permission manifest (`--allow-run`).
   Proves R-DEPLOY-1 + A7 delegation. Gate: adapter unit tests + F-9.
6. **S6 · thin router** — add `docker`/`compose` target sub-commands to `deploy-group.ts` (parse +
   route only). Files: `public/features/deploy/deploy-group.ts`, new `features/deploy/<target>/`
   router file(s), router tests. Proves R-DEPLOY-2 / F-DEPLOY-2. Gate: router tests + F-CLI.
7. **S7 · docs + arch-debt** — update `docs/site/how-to/deploy.md` (docker/compose now first-class);
   write arch-debt entries (package extraction, router convergence, gate-promotion pending). Files:
   `docs/site/how-to/deploy.md`, `.llm/harness/debt/arch-debt.md`. Gate: manual + docs build (deferred).
8. **S8 · E2E gate** — CI-safe compose-artifact emit + `docker compose config` validation in the
   scaffold E2E; live boot opt-in. Files: e2e suite wiring. Gate: `e2e:cli run scaffold.runtime`.

## Dependencies

- **Merged:** #352 `deploy.targets.*` config contract (`DeployTargetBaseSchema` on `main`).
- **Reference (pending merge, read-only):** #357 / #338 Archetype 7 doctrine.
- **Runtime:** `aspire` CLI (SDK 13.x) + `docker`/`docker compose` in the E2E environment.
- **Parallel (no hard block, coordinate port expansion):** #339 (OsServicePort), #342 (Deno Deploy).
- **Optional DX (TRACK):** ada2a5 `AddDenoApp` / #320.

## Drift Watch

- If #342 or #339 merges the 3-op→7-op port expansion before S2 lands → rebaseline S2, log to `drift.md`.
- If `aspire publish` compose output path/shape differs from the assumed `--output-path` contract → log + adjust S5.
- If the doctrine PR #357/#338 changes the 7-op verb names before merge → reconcile S2/S5 op names.
- If the `scaffold.runtime` E2E cannot access a Docker daemon in the target CI → confirm L8 keeps the
  merge gate green on artifact validation alone.
```
