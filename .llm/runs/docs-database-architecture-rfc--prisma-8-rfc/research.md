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
   Aspire-coupled. Executing `generateDatabaseDenoJson` for PostgreSQL, SQLite, MySQL, and MSSQL at
   the baseline produces 42 `db:*` task keys in every generated engine workspace.
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
9. NetScript's service/Hono surface already implements preset → public factory → native framework
   plus NetScript primitives; SDK and Fresh preserve the same inferred lower-layer values through
   progressively lower adoption surfaces.
10. Market evidence separates source definition, resolved manifest, executable plan, provider
    ledger, and immutable receipt. It supports partial/unknown outcome recovery and rejects a local
    reinvention of hosted RBAC, fleet, registry, and continuous-drift products.
11. Pinned Prisma separates compile-time `TContract` from runtime `contractJson` (including a
    phantom contract type on the emitted path). App-owned contracts can therefore prefer an erased
    source-native `typeof definition` binding while runtime consumes only manifest/artifact values.
    Root `isolatedDeclarations` still requires an automatic atomic declaration fallback when exact
    types cross a publish or artifact-only boundary.

## Corrections and conflict resolutions

- Root Prisma catalog entries are caret ranges `^7.8.0`; generated templates still use `^7.4.2`.
- Qwen finding F3 incorrectly “corrected” the current-state report's accurate “more than twenty”
  wording to exactly 30 tasks by omitting twelve computed provider-specific task keys. The PLAN-EVAL
  evaluator executed `generateDatabaseDenoJson` for all four providers and verified 42 `db:*` keys
  for each. Qwen's report remains immutable independent audit evidence; its count is explicitly
  superseded here. The same copied 30-task premise propagated into the immutable Opus review and
  model briefs and is likewise non-authoritative. Mutable synthesis and plan records use the
  executed-generator result.
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
- `OWNER-DX-01` supersedes the earlier universal-generated-binding assumption after PLAN-EVAL. The
  current model-first Prisma builder remains schema authority, while NetScript adopts its
  established L1 preset/recipe → L2 public factories → L3 native Prisma plus primitives/ports
  progression. This permits orchestration layers but still forbids a mirrored Prisma
  model/field/relation/query DSL, re-export, copied overloads, private types, or inference widening.
- The prospective JSR audit's generated-app-binding statement was planning evidence, not an executed
  impossibility proof. Source-native app inference is now the default; a same-compile,
  launcher-integrated declaration is the bounded fallback for publish/artifact-only boundaries and
  must be proved in W3.
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
| [layered-dx-api-audit.md](./research/layered-dx-api-audit.md)                                     | `OWNER-DX-01` repository-grounded service/Hono, SDK, Fresh, pinned-Prisma type-flow audit and proposed three-layer adoption API.                            |
| [qwen-prisma-risk-review.md](./research/qwen-prisma-risk-review.md)                               | Independent adversarial minimum-kernel, provider-contingency, risk, conformance, and kill review; factual conflicts corrected above.                        |
| [claude-opus-architecture-review.md](./research/claude-opus-architecture-review.md)               | Independent package/archetype, identity, runtime, control, contribution, cutover, waves, and conformance architecture review.                               |
| [planned-jsr-audit.md](./research/planned-jsr-audit.md)                                           | Prospective JSR verdict `PASS-AS-PLANNED`; explicitly not actual publish readiness because packages do not exist.                                           |
| [architecture-plan-synthesis.md](./research/architecture-plan-synthesis.md)                       | Final decision-grade reconciliation and source for the formal Plan-Gate.                                                                                    |

## Research verdict

PLAN-EVAL cycle 2 passed with no must-resolve-now architecture decision. `OWNER-DX-01` is a later,
explicit owner override, not a new evaluator cycle. The exact Prisma RC/GA import spelling, provider
lock mechanism, signature/key custody, and other implementation details remain classified by wave;
the Opus author/editor pass will choose the exact layered API and state the W3 type-boundary proof
while consolidating the RFC to at most 10,000 words. The namespace mismatch continues to withhold a
capability claim rather than blocking the provider-neutral architecture. No further PLAN-EVAL will
run.
