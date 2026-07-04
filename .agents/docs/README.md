# NetScript — Agent Docs

Agent-facing documentation for the NetScript repo. These docs explain the system architecture,
conventions, and operating procedures that an AI agent needs to work effectively in this codebase.

> **Complement, don't duplicate.** The public-facing docs live in `docs/` (architecture doctrine,
> standards, public-surface patterns). The agent docs here focus on _how to operate_ the codebase —
> harness workflows, skill routing, package conventions, and gotchas.

---

## Start here

| Doc                                             | Why you'd read this                                         |
| ----------------------------------------------- | ----------------------------------------------------------- |
| [Architecture Overview](#architecture-overview) | High-level design, layering, and how the repo is organized. |
| [Getting Started](#getting-started)             | Build, test, and validation commands.                       |
| [Skill Router](#skill-router)                   | Which skill to load for which task.                         |

---

## Architecture Overview

NetScript is a modular framework for building Deno/TypeScript services with a doctrine-enforced
package structure. It is organized around three concerns:

1. **Framework core** — The harness, doctrine, and archetypes that govern how packages are shaped.
2. **Packages** — The 23 publishable units (`packages/*`) that provide runtime capabilities (KV,
   queues, sagas, workers, triggers, CLI, etc.).
3. **Plugins** — The 4 first-party plugins (`plugins/*`) that extend the framework.

### Guiding Principles

- **Doctrine-first** — Every package follows the 10-file architecture doctrine. New decisions become
  ADRs; existing doctrine is append-only.
- **Archetype-driven** — Each package selects one of six archetypes (Small Contract, Integration,
  Runtime/Behavior, DSL/Builder, Plugin, CLI/Tooling). The archetype determines the minimum viable
  shape and gate set.
- **Composition over inheritance** — Base classes are stub-only contracts; concrete classes
  delegate. Extension axes are named before abstraction.
- **Thin core, fat targets** — The harness and doctrine are the stable core; packages carry their
  own dialect-specific logic.
- **Feedback before execution** — The harness Plan-Gate catches planning errors before code is
  written; fitness gates catch structural violations before merge.

### Repo Layout

```
packages/
  shared/                # Foundation types, schemas, invariants
  contracts/             # Contract primitives, schemas, CRUD/query/transform helpers
  config/                # Typed project configuration schemas and loaders
  runtime-config/        # Runtime configuration resolution
  logger/                # Logging
  telemetry/             # OpenTelemetry instrumentation
  aspire/                # .NET Aspire integration
  kv/                    # Key-value storage
  database/              # Database ports and adapters
  prisma-adapter-mysql/  # Prisma MySQL adapter
  queue/                 # Message queuing
  cron/                  # Job scheduling
  plugin/                # Plugin runner and authoring SDK
  plugin-streams-core/   # Streams plugin core
  plugin-workers-core/   # Workers plugin core
  plugin-sagas-core/     # Sagas plugin core
  plugin-triggers-core/  # Triggers plugin core
  watchers/              # Resource watchers
  sdk/                   # SDK surface
  service/               # Service runtime
  fresh/                 # Fresh 2.x framework integration
  fresh-ui/              # Fresh UI components
  cli/                   # Command-line interface
plugins/
  streams/               # Streams plugin
  workers/               # Workers plugin
  sagas/                 # Sagas plugin
  triggers/              # Triggers plugin
docs/
  architecture/    # Public-facing architecture docs and doctrine
.agents/
  skills/          # Agent skills (doctrine, harness, JSR audit, etc.)
  rules/           # .mdc rule files
  docs/            # This directory — agent-facing docs
.llm/
  harness/         # Harness v3 (workflows, gates, evaluator protocols)
```

### Subsystems Index

| Subsystem         | Path                       | What it covers                             |
| ----------------- | -------------------------- | ------------------------------------------ |
| Foundation        | `packages/shared/`         | Foundation types, schemas, invariants      |
| Contracts         | `packages/contracts/`      | Contract primitives, CRUD/query/transform  |
| Configuration     | `packages/config/`         | Schema-driven config with validation       |
| Runtime config    | `packages/runtime-config/` | Runtime configuration resolution           |
| Logging           | `packages/logger/`         | Structured logging                         |
| Telemetry         | `packages/telemetry/`      | OpenTelemetry instrumentation              |
| KV store          | `packages/kv/`             | Key-value storage with TTL and namespacing |
| Database          | `packages/database/`       | Database ports and adapters                |
| Queuing           | `packages/queue/`          | Message queue abstractions                 |
| Scheduling        | `packages/cron/`           | Cron expression parsing and job scheduling |
| Plugin SDK        | `packages/plugin/`         | Plugin runner and authoring SDK            |
| Plugin cores      | `packages/plugin-*-core/`  | Streams, workers, sagas, triggers cores    |
| CLI               | `packages/cli/`            | Command-line scaffolding and tooling       |
| Fresh integration | `packages/fresh/`          | Fresh 2.x framework bindings               |

---

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) v2.x
- Git

### Build and test

```bash
# Format and lint
deno fmt
deno lint

# Type check all packages and plugins
deno task check

# Run tests
deno task test

# Discover available CLI E2E suites and gates
deno task e2e:cli suites
deno task e2e:cli gates scaffold.runtime

# Run the full CLI E2E smoke before merge
deno task e2e:cli

# Debug the explicit full suite with readable output
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

### Working with the harness

```bash
# Start a harnessed run
# (say "use harness" to the agent, or load .agents/skills/netscript-harness/SKILL.md)
```

The harness uses an 8-phase model: Bootstrap → Research → Plan & Design → **Plan-Gate** → Implement
→ Gate → Evaluate → Close.

See `.llm/harness/workflow/run-loop.md` for the full specification.

---

## Skill Router

When a prompt is vague, route it to the narrowest skill:

| Task                                   | Skill                 |
| -------------------------------------- | --------------------- |
| `packages/` or `plugins/` architecture | `netscript-doctrine`  |
| `use harness` or run orchestration     | `netscript-harness`   |
| JSR readiness or publish audit         | `jsr-audit`           |
| Fresh/Deno frontend                    | `deno-fresh`          |
| Anything else                          | Ask for clarification |

See `.agents/skills/README.md` for the full scope table.

---

## Working with AI Agents

| Doc                                                              | Why you'd read this                                   |
| ---------------------------------------------------------------- | ----------------------------------------------------- |
| [Harness Activation](../../.llm/harness/workflow/activation.md)  | Bootstrap reading list and mandatory artifacts.       |
| [Run Loop](../../.llm/harness/workflow/run-loop.md)              | The 8-phase model with Plan-Gate and dual evaluators. |
| [Plan-Gate](../../.llm/harness/gates/plan-gate.md)               | Checklist for the PLAN-EVAL pass.                     |
| [Supervisor Workflow](../../.llm/harness/workflow/supervisor.md) | Multi-group supervisor runs.                          |
| [Skill Authoring](../skills/DEVELOPING.md)                       | How to write a new skill.                             |

---

## Reference

| Doc                                                                           | Why you'd read this                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Architecture Doctrine](../../docs/architecture/doctrine/)                    | The 10-file specification (A1–A14, archetypes, AP-1..AP-20, F-1..F-18).              |
| [Public Surface Patterns](../../docs/architecture/PUBLIC-SURFACE-PATTERNS.md) | How to design exports, `mod.ts`, and READMEs for JSR.                                |
| [Agent Rules](../rules/)                                                      | `.mdc` rule files for CLI, architecture, public surface, JSR, platform, and harness. |
| [Archetype Gate Matrix](../../.llm/harness/gates/archetype-gate-matrix.md)    | Required gates per archetype.                                                        |
| [Architecture Debt](../../.llm/harness/debt/arch-debt.md)                     | Persistent debt entries with owners and closing gates.                               |

---

## OSS Posture

| Doc          | Why you'd read this                                        |
| ------------ | ---------------------------------------------------------- |
| Governance   | _(stub)_ Decision-making and contribution policies.        |
| Supply Chain | _(stub)_ License validation, provenance, dependency audit. |
| Versioning   | _(stub)_ Release procedure and supported versions.         |
| Telemetry    | _(stub)_ What the CLI collects and how to opt out.         |

> OSS posture docs are stubs. Expand only when real policy is ratified.
