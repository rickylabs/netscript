# Research

Issue #2579 and all comments were read live. No orchid-triage comment or existing covering PR was found. Baseline is the SHA in supervisor.md.

Inspected dashboard-light.png and orders-light.png in `.llm/runs/design-system-s4--language-review/figma-library/review/screens/utility/`. Data needs: human references, owner name/email, semantic status, amount, period totals/deltas, recent records and activity. Page design remains Astra's follow-up.

The database scaffold shares one Prisma model template for postgres/mysql/sqlite/mssql. Its placeholder Zod must match generated Prisma Zod. CRUD already supports filterSchema; the repository currently counts without filters. The memory service uses a different list envelope and instance-owned records. Page adapters already preserve error categories, but only return one page of rows. The projection loader must traverse pages and fail closed on partial reads.

Carrier chain is prose → export corpus → CLI assets → publish assets. Assets-barrel checks git diff, so its final check must run after committing carriers. Deno 2.9.7 is installed; RTK is absent, so commands run directly. Consulted prior tracked memory for carriers, draft CI policy, browser setup, and generated project execution. No external memory service is exposed.

CLI is Archetype 6 (keep existing kernel/surface split). No new package export, dependency, registry axis, spine, or abstraction. Existing typed client derives its surface from the contract.
