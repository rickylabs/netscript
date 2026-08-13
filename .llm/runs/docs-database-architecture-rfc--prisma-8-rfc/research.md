# Research Index: NetScript Database Architecture and Prisma 8

## Rebaseline and evidence policy

- Repository: `rickylabs/netscript`
- Current-main baseline: `origin/main@cd720529333328bcba5e1a308ce7632f4350efdf`
- Research date: 2026-08-13
- Upstream Prisma pins: RC1 tag `v8.0.0-rc.1@a76a6c5`; post-RC comparison object
  `71e2e0d9ee1f306b5a11435cd1973023cb33866a`
- Carried issue: #313 is rebaselined as historical problem evidence only. Its compatibility-first
  solution is superseded by the owner's explicit clean-break directive.

Evidence classes used by the reports:

- **Current source fact:** directly inspected NetScript baseline or pinned Prisma source.
- **Primary external fact:** official source, release, ADR, issue, PR, or product documentation.
- **Exploratory evidence:** the owner/Prisma-maintainer exchange; directional, not an upstream
  commitment.
- **Inference:** reconciliation of facts; not presented as an implemented capability.
- **Proposal:** future architecture to be gated by the RFC and conformance suite.
- **Conditional/unproven:** provider or release capability withheld until implementation evidence.

The detailed synthesis is
[research/architecture-plan-synthesis.md](./research/architecture-plan-synthesis.md). This index is
the harness-required current research entrypoint; it does not duplicate the reports.

## Load-bearing rebaseline findings

1. NetScript currently has five overlapping database systems with no canonical join point:
   appsettings/Aspire resources, a fixed CLI operation runner, generated engine workspaces, runtime
   wrappers, and install-time plugin schema copying.
2. Target identity collapses into provider/engine paths. Two same-provider databases share
   `database/<engine>`; operation target resolution ignores `PrimaryDatabase`; pure generation is
   Aspire-coupled; the generated workspace has exactly 30 `db:*` tasks.
3. Plugin schema is inferred from files and regex collisions rather than versioned ownership,
   capability, migration history, provenance, or retention policy.
4. Prisma 8 is an architectural change: canonical contract data and declaration artifacts,
   programmatic control, provider runtimes, migration graphs/markers/ledgers, and contract spaces.
   RC1 is Early Access and PostgreSQL is the sole intended 8.0 GA database.
5. The current Prisma TypeScript authoring API is model-first `defineContract(scaffold, callback)`.
   The screenshot's older target/table/column fluent API was real but was replaced and removed.
6. Prisma's canonical contract can support a bounded runtime Standard Schema interpreter, but it
   does not retain the complete create/update/filter/nested-write/result type universe. Unsupported
   operation/result/codec metadata must fail when a schema is constructed.
7. Prisma codecs distinguish application runtime, driver wire, and contract/database JSON. The
   public validation representations are `runtime` and `json`; driver wire is adapter-internal.
8. Prisma runtime lowering supports namespaces, but RC1 and the inspected post-RC source flatten
   namespaces in type maps. Sound multi-namespace E2E typing is an upstream-blocked capability, not
   a current product claim.
9. NetScript's `isolatedDeclarations` and doctrine slow-type boundary require application-specific
   inferred Prisma bindings to remain generated app-local values rather than published framework
   exports.
10. Market evidence separates source definition, resolved manifest, executable plan, provider
    ledger, and immutable receipt. It supports partial/unknown outcome recovery and rejects a local
    reinvention of hosted RBAC, fleet, registry, and continuous-drift products.

## Corrections and conflict resolutions

- Root Prisma catalog entries are caret ranges `^7.8.0`; generated templates still use `^7.4.2`.
- `@prisma/orm-postgres` has 138 audited top-level export keys, not the approximate 275 in the Qwen
  independent report.
- The AP-17 `interfaces/` rename debt for `packages/database` is stale because `ports/` exists; its
  composition-root question remains relevant.
- A live `DatabaseGraph` is rejected. Graphs may be internal compiler IR; the durable public join
  point is a plain, content-addressed `DatabaseManifest`.
- Qwen's three minimum public responsibilities and the market audit's five artifact categories are
  compatible: definition/manifest, operation protocol, and contribution record produce separate
  definition, manifest, plan, ledger, and receipt values.
- Opus's broad runtime validation recommendation is narrowed by the pinned-source validation audit.
- Qwen's generated-validator recommendation is superseded by runtime interpretation plus optional
  corpus-equivalent AOT.
- Opus's provider re-export sketch is rejected. Applications and controlled plugin authoring may
  import Prisma's public builder directly; NetScript wraps the resulting native value and never
  pretends to own or vendor the builder.
- Plugin removal is not solved by contract spaces alone. Detach-and-retain is the initial guaranteed
  lifecycle; archive/drop remain conditional.
- The kernel is provider-neutral while the first adapter is Prisma 8 PostgreSQL-only. Unsupported
  targets fail explicitly; no Prisma 7 fallback remains.

## Report index

| Report                                                                                            | Evidence class and role                                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [netscript-current-state.md](./research/netscript-current-state.md)                               | Current NetScript source/history/debt rebaseline and failure taxonomy.                                                                                      |
| [prisma-8-deep-dive.md](./research/prisma-8-deep-dive.md)                                         | Pinned RC/current source, release, scorecard, issue/PR, runtime/control/migration/agent analysis.                                                           |
| [market-analysis.md](./research/market-analysis.md)                                               | Official-source comparison across seventeen framework, ORM, migration, IaC, control-plane, and mature-framework products.                                   |
| [market-gap-audit.md](./research/market-gap-audit.md)                                             | Independent correction for Flyway, Liquibase, Terraform, Pulumi, Bytebase, ZenStack, and hosted/local scope.                                                |
| [runtime-validation-maintainer-exchange.md](./research/runtime-validation-maintainer-exchange.md) | Owner-supplied exploratory primary evidence for runtime-derived validation direction.                                                                       |
| [runtime-validation-source-audit.md](./research/runtime-validation-source-audit.md)               | Pinned-source proof of bounded validation algebra, missing operation metadata, codec representations, cache identity, and fail-closed cases.                |
| [typescript-schema-orpc-audit.md](./research/typescript-schema-orpc-audit.md)                     | Historical/current Prisma builder evolution, native fragment/space composition, oRPC transfer, extension bundles, namespace blocker, and artifact boundary. |
| [qwen-prisma-risk-review.md](./research/qwen-prisma-risk-review.md)                               | Independent adversarial minimum-kernel, provider-contingency, risk, conformance, and kill review; factual conflicts corrected above.                        |
| [claude-opus-architecture-review.md](./research/claude-opus-architecture-review.md)               | Independent package/archetype, identity, runtime, control, contribution, cutover, waves, and conformance architecture review.                               |
| [planned-jsr-audit.md](./research/planned-jsr-audit.md)                                           | Prospective JSR verdict `PASS-AS-PLANNED`; explicitly not actual publish readiness because packages do not exist.                                           |
| [architecture-plan-synthesis.md](./research/architecture-plan-synthesis.md)                       | Final decision-grade reconciliation and source for the formal Plan-Gate.                                                                                    |

## Research verdict

Research supports proceeding to PLAN-EVAL with no must-resolve-now architecture decision. The exact
Prisma RC/GA import spelling, provider lock mechanism, signature/key custody, and other
implementation details are classified by wave and cannot force a package-boundary rewrite. The
Prisma namespace type/runtime mismatch is a capability block: it withholds a claim rather than
blocking the provider-neutral architecture.

No canonical RFC may be authored until the separate evaluator returns `PASS`.
