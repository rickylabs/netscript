# Agent Docs Index

Curated, agent-facing documentation for the NetScript repo. This index points
**into** canonical sources — it does not duplicate them.

> For package/plugin architecture decisions, load `.agents/skills/netscript-doctrine/SKILL.md`.
> For harnessed runs, say `use harness`.

---

## Start here

| Doc | Why you'd read this |
|-----|---------------------|
| [Architecture Overview](docs/architecture/DOCS-STRUCTURE.md) | How the repo is organized and where docs live. |
| [Getting Started](docs/architecture/STANDARDS.md) | Coding standards and conventions used across the codebase. |
| [Public Surface Patterns](docs/architecture/PUBLIC-SURFACE-PATTERNS.md) | How to design exports, `mod.ts`, and READMEs for JSR. |

---

## Architecture deep dives

| Doc | Why you'd read this |
|-----|---------------------|
| [Doctrine — Thesis and Axioms](docs/architecture/doctrine/01-thesis-and-axioms.md) | Foundational assumptions (A1–A14) that shape every package. |
| [Doctrine — Public Surface](docs/architecture/doctrine/02-public-surface.md) | Rules for exports, entry points, and published boundaries. |
| [Doctrine — Base and Derived Classes](docs/architecture/doctrine/03-base-and-derived-classes.md) | Stub-only bases, inheritance limits, composition rules. |
| [Doctrine — Modules and Helpers](docs/architecture/doctrine/04-modules-and-helpers.md) | When helpers are justified; Web Platform and `@std/*` first. |
| [Doctrine — Folder Structure](docs/architecture/doctrine/05-folder-structure.md) | Role vocabulary, layering rules, file shape. |
| [Doctrine — Archetypes](docs/architecture/doctrine/06-archetypes.md) | The six package archetypes and selection order. |
| [Doctrine — Composition and Extension](docs/architecture/doctrine/07-composition-and-extension.md) | Composition roots, constructor injection, extension axes. |
| [Doctrine — Runtime, State, Failure](docs/architecture/doctrine/08-runtime-state-failure.md) | Stateful runtimes, supervision, cancellation, crash boundaries. |
| [Doctrine — Anti-Patterns and Fitness Functions](docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md) | AP-1..AP-20 and F-1..F-18 gate catalog. |
| [Doctrine — Codebase Verdict and Handoff](docs/architecture/doctrine/10-codebase-verdict-and-handoff.md) | Current verdict per package and debt seed. |

> The doctrine is append-only. New decisions become ADRs; existing files are not
> rewritten.

---

## Reference

| Doc | Why you'd read this |
|-----|---------------------|
| [Agent Rules](.agents/rules/) | `.mdc` rule files for CLI tooling, package architecture, public surface, JSR release, platform helpers, and harness workflow. |
| [Skills Cluster](.agents/skills/README.md) | Router + scope table for all agent skills. |
| [Skill Authoring Guide](.agents/skills/DEVELOPING.md) | How to write a new skill for this cluster. |
| [Harness v2](.llm/harness/README.md) | The agent operating system for doctrine-aware work. |
| [Archetype Gate Matrix](.llm/harness/gates/archetype-gate-matrix.md) | Required gates per archetype. |
| [Architecture Debt Registry](.llm/harness/debt/arch-debt.md) | Persistent debt entries with owners and closing gates. |

---

## Working with AI agents

| Doc | Why you'd read this |
|-----|---------------------|
| [Harness Activation](.llm/harness/workflow/activation.md) | Bootstrap reading list and mandatory artifacts. |
| [Run Loop](.llm/harness/workflow/run-loop.md) | The 8-phase model: Bootstrap → Research → Plan & Design → Plan-Gate → Implement → Gate → Evaluate → Close. |
| [Plan-Gate](.llm/harness/gates/plan-gate.md) | Checklist for the PLAN-EVAL pass before implementation. |
| [Supervisor Workflow](.llm/harness/workflow/supervisor.md) | Multi-group supervisor runs. |
| [Skills — Doctrine](.agents/skills/netscript-doctrine/SKILL.md) | Navigate the architecture doctrine. |
| [Skills — Harness](.agents/skills/netscript-harness/SKILL.md) | Orchestrate harness-mode runs. |
| [Skills — JSR Audit](.agents/skills/jsr-audit/SKILL.md) | Audit packages for JSR readiness. |

---

## OSS posture

| Doc | Why you'd read this |
|-----|---------------------|
| [Governance](docs/architecture/DOCS-STRUCTURE.md) | *(stub)* Decision-making and contribution policies. |
| [Supply Chain](docs/architecture/DOCS-STRUCTURE.md) | *(stub)* License validation, provenance, dependency audit. |
| [Versioning](docs/architecture/DOCS-STRUCTURE.md) | *(stub)* Release procedure and supported versions. |
| [Telemetry](docs/architecture/DOCS-STRUCTURE.md) | *(stub)* What the CLI collects and how to opt out. |

> OSS posture docs are stubs pointing to existing material. Do not fabricate
> policy. Expand these only when real policy is ratified.
