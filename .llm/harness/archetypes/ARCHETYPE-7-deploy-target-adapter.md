# Archetype 7 — Deployment Target Adapter

> A **composite** archetype for the deployment feature. It is not a package shape a single package
> picks over its true archetype; it is a named cross-package pattern that **composes** Archetype 2
> (Integration — port/adapter core) and Archetype 6 (CLI / Tooling — thin router), folding neither.
> Doctrine source:
> `docs/architecture/doctrine/06-archetypes.md#archetype-7--deployment-target-adapter`.

## Status

Future-wave. The deployment core and its adapters are not built yet — deploy today lives inside
`packages/cli` (Archetype 6). This archetype exists so the four adapter slices of deployment epic
#327 (#339 systemd, #340 deno-deploy, #342 docker/compose, #343 aca) have a single named conformance
target. Its archetype-specific gates `F-DEPLOY-*` are seeded **`reviewed`** (see the gate matrix),
not `gated`, until the packages exist.

## Doctrine Reference

- Axioms: A2, A5, A7, A9, A11, A13.
- Primary sections:
  - `docs/architecture/doctrine/06-archetypes.md#archetype-7--deployment-target-adapter`
  - `docs/architecture/doctrine/06-archetypes.md#archetype-2--integration` (the port/adapter core)
  - `docs/architecture/doctrine/06-archetypes.md#archetype-6--cli--tooling-package` (the thin
    router)
  - `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`
- Composed archetypes: `ARCHETYPE-2-integration.md`, `ARCHETYPE-6-cli-tooling.md`.
- Config contract: `@netscript/config` `DeployTargetBaseSchema` (landed by #337).

## When This Archetype Applies

Select Archetype 7 when a deployment feature deploys an app to **multiple targets** behind a
**port/adapter seam** with a **thin CLI router**. A deploy flow that is only a CLI command with no
port and a single target stays Archetype 6. The trigger is: the `OsServicePort`/cloud-adapter seam
**and** multi-target routing both exist.

## Composition

- **Core = Archetype 2.** A package-owned `OsServicePort` (bare-metal — servy + systemd adapters)
  plus cloud adapters (docker/compose/aca wrapping `aspire publish`/`aspire deploy`; deno-deploy
  wrapping `deno deploy`). Each target is one adapter behind the stable port; the **target** is the
  named extension axis (A11), resolved through a closed-on-key `deploy-target-registry`.
- **Router = Archetype 6.** `netscript deploy <target> <verb>` parses input and routes to an
  adapter. The command surface is a thin router — no target-specific business logic (Archetype 6 v2
  rules R-A6-N5/N7 and its F-CLI gates still bind the router package).

Because Archetype 7 folds A2 and A6, a package or feature that conforms must satisfy the composed
archetype's own gates: the core satisfies the Archetype 2 universal gates; the router satisfies the
Archetype 6 universal + F-CLI gates. The `F-DEPLOY-*` gates below are additive.

## Uniform Adapter Contract

Every target adapter implements the same op set; a target implements the subset it supports:

| Op            | Meaning                                                                      |
| ------------- | ---------------------------------------------------------------------------- |
| `plan`/`emit` | Compute/emit the deployment artifact/plan without mutating the target.       |
| `up`          | Create or update the deployment. Aspire-driven adapters delegate to Aspire.  |
| `down`        | Tear the deployment down.                                                    |
| `status`      | Report current deployment state.                                             |
| `logs`        | Stream/fetch runtime logs.                                                   |
| `rollback`    | Revert to the previous good state (bare-metal: health-gated; cloud: native). |
| `secrets`     | Manage target secret material through the core, not per-target ad-hoc code.  |

## Rules (R-DEPLOY-N*)

| Rule       | Statement                                                                                                           | Gate       |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ---------- |
| R-DEPLOY-1 | Every target adapter implements the uniform 7-op contract (subset allowed; Aspire adapters delegate `up`/`plan`).   | F-DEPLOY-1 |
| R-DEPLOY-2 | No target-specific business logic in the command surface; the deploy router only parses and routes.                 | F-DEPLOY-2 |
| R-DEPLOY-3 | Convention-bearing primitives (health gating, OTEL, secrets, rollback) live in the core, shared across all targets. | F-DEPLOY-2 |
| R-DEPLOY-4 | Each target config member spreads `DeployTargetBaseSchema`; no per-target config base-class hierarchy (A5).         | F-DEPLOY-1 |
| R-DEPLOY-5 | The `OsServicePort`/cloud-adapter seam is justified by ≥ 2 foreseeable adapters (A11); no premature port.           | F-DEPLOY-1 |

## Fitness Gates

Archetype-specific gates, seeded **`reviewed`** until the deployment packages (#339–#343) exist,
then promoted to `gated`:

| Gate       | Asserts                                                                                                 | Detection           |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| F-DEPLOY-1 | Each registered target adapter implements the uniform 7-op contract (or an explicitly-declared subset). | AST + registry scan |
| F-DEPLOY-2 | The deploy command surface contains no target-specific business logic; conventions live in the core.    | import graph + AST  |

These extend (do not replace) the universal F-* family and the composed archetypes' gates (Archetype
2 universal gates on the core; Archetype 6 universal + F-CLI gates on the router).

## Skills to Activate

- `netscript-doctrine`
- `netscript-harness` (when the run is harnessed)
- `aspire` for Aspire-driven cloud adapters
- `jsr-audit` for any slice touching a package `mod.ts`, `deno.json` exports, or JSDoc

## Read First

1. `docs/architecture/doctrine/06-archetypes.md#archetype-7--deployment-target-adapter`.
2. `ARCHETYPE-2-integration.md` (the port/adapter core) and `ARCHETYPE-6-cli-tooling.md` (the
   router).
3. `@netscript/config` `deploy-schema.ts` — `DeployTargetBaseSchema` (the config-extension base).
4. The deployment epic #327 spec and the target adapter slice under implementation (#339–#343).
5. Relevant debt entries (the `deployment — Archetype-7 core-centralization + F-DEPLOY seed` entry
   and the existing `packages/cli — AP-1` command-registry/deploy-target-seams entry).

## Anti-Patterns to Watch For

- **AP-11** — a target-specific base class where an adapter behind the port suffices; premature port
  before a second adapter is foreseeable (here it always is: servy + systemd + cloud).
- **Thin-router violation** — target business logic leaking into the command surface (R-DEPLOY-2).
- **Convention duplication** — health/OTEL/secrets/rollback re-implemented per target instead of
  centralized in the core (R-DEPLOY-3).
- **Config base-class hierarchy** — inheriting target config instead of spreading
  `DeployTargetBaseSchema` (R-DEPLOY-4).

## Concept of Done

- The core exposes `OsServicePort` (+ cloud adapters) and a closed-on-key target registry;
- every target adapter implements the uniform 7-op contract (or a declared subset);
- the deploy command surface is a thin router with no target-specific business logic;
- health, OTEL, secrets, and rollback are centralized in the core;
- every target config member spreads `DeployTargetBaseSchema`;
- the composed Archetype 2 and Archetype 6 gates pass on the core and router respectively;
- `F-DEPLOY-1`/`F-DEPLOY-2` pass (or are `reviewed` with manual evidence while packages are
  unbuilt).
