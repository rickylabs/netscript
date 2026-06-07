# Drift — Wave 2b Data Adapters

Append any divergence from `.llm/tmp/run/feat-package-quality-wave2-adapters--adapters/plan.md`,
the nested per-unit authority, or doctrine.

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-07 | note | `aspire` skill unavailable in this session | Available skill list and tool discovery did not expose an Aspire-specific skill. | Treat Aspire package work as already completed in 2a and out of scope for 2b. |
| 2026-06-07 | note | Removed root `PrismaPg` re-export from `@netscript/database` | `deno doc --lint` followed the upstream `@prisma/adapter-pg` class and failed on private/undocumented upstream types; internal consumer search found CLI templates import `@prisma/adapter-pg` directly and no package/plugin imports the database root re-export. | Keep package-owned structural driver adapter return types and do not expose upstream Prisma adapter classes from the root package. |
| 2026-06-07 | note | Narrowed `@netscript/prisma-adapter-mysql` root exports to package-owned adapter surface | `deno doc --lint` failed when root exports exposed conversion/error helpers and the connected implementation class because their signatures referenced private Prisma driver utility types. Internal consumer search found no package/plugin consumers of those helper exports. | Keep conversion/error helpers internal; root exports the factory, capability helper, and package-owned public adapter/config types. |
