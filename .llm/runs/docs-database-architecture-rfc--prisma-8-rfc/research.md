# Research — docs-database-architecture-rfc--prisma-8-rfc

## Re-baseline

- Carried-in sources: GitHub issue #313, its linked Prisma Next v0.14-era design assumptions, and
  related NetScript database issues discovered during research.
- Re-derived against `main` @ `cd720529333328bcba5e1a308ce7632f4350efdf` on 2026-08-13.
- Upstream target: Prisma 8.0.0 RC / Prisma Next, beginning with the official `v8.0.0-rc.1` release
  and then current source, PRs, issues, and official documentation.
- What changed versus the carried-in version:
  - #313 mandates an additive, backward-compatible Postgres pilot beside classic Prisma.
  - The owner now mandates a clean architectural break with **no backward-compatibility
    constraint**. #313 is evidence and problem inventory, not an inherited solution.
  - Prisma Next has advanced from the v0.14 Early Access surface recorded in #313 to the Prisma 8
    release-candidate line, so every upstream capability and gap must be re-verified.

## Research workstreams

1. Current NetScript database topology, generated assets, public APIs, adapters, CLI flows, CI,
   runtime scaffolds, and contributor extension seams.
2. Complete issue/PR history for #313 and the “Prisma Gaps” family, including later DB regressions
   and architectural debt.
3. Prisma 8 / Prisma Next release, docs, source tree, packages, generators, schema/migration engine,
   adapters, drivers, multi-schema/multi-database behavior, extension model, Deno compatibility, CI,
   open PRs/issues, roadmap signals, and agent-facing surfaces.
4. Market prior art: batteries-included meta-frameworks, ORM/toolkit ecosystems, database-agnostic
   frameworks, code-first/schema-first systems, migration systems, local-first/data layers, and
   plugin contribution models.
5. Fresh NetScript architecture: contracts, ports, adapters, DSL/factories, plugin contributions,
   capability negotiation, schema ownership, engine selection, deterministic generation,
   zero-manual-step automation, observability, testing, CI, migration, and parallel-branch rollout.

## Findings

| # | Finding                                                                                                                                          | How to verify                              |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 1 | #313's compatibility-first premise conflicts with the current owner directive.                                                                   | GitHub issue #313 body; current run prompt |
| 2 | This is decision-heavy, cross-package, multi-wave architecture work; PLAN-EVAL is mandatory.                                                     | `.llm/harness/workflow/run-loop.md` §4     |
| 3 | The canonical deliverable is a draft RFC under `rfcs/0000-*.md`; run artifacts preserve provenance but do not become the accepted design record. | `rfcs/README.md`                           |

## jsr-audit surface scan (package/plugin waves)

- Status: pending focused inventory of the database package, adapter packages, CLI/scaffold
  surfaces, and any proposed new package exports.
- This RFC is docs-only, but it specifies future published package/plugin surfaces, so the planned
  public API must receive the same slow-type, private-type-reference, upstream-re-export, and
  subpath-boundary scrutiny before Plan-Gate.

## Open questions

- Which Prisma 8 capabilities are stable enough to own directly, and which must remain behind a
  narrow NetScript port?
- What is the minimum durable NetScript database IR/contract that can serve Prisma without
  recreating an ORM or schema engine?
- Should database integrations be ordinary plugin contributions, a dedicated capability family, or a
  composition of schema/provider/runtime/migration contributions?
- How should one app express multiple logical schemas, databases, providers, tenants, and execution
  runtimes without generator ordering or import-path ambiguity?
- What fully automated lifecycle replaces today's manual generation, patching, adapter selection,
  migrations, seeding, registry wiring, and CI matrix maintenance?
- What implementation-wave boundaries preserve reviewability while explicitly avoiding a
  compatibility layer?
