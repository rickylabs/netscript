# Drift

- Specific owner process overrides generic dispatcher boilerplate: draft remains draft; Refs #2579, no closing keyword or labels; Cockpit merges. No session identifiers or absolute paths in public run artifacts.
- RTK not installed; invoke underlying tools. No cache/lock deletion or reload.

- The generated contracts aggregate deliberately exposes schema names through type-only exports. The generated Prisma adapter imports its runtime entity validator from the concrete generated v1 contract module via a deterministic project-relative path. This is a generated application workspace dependency, with no framework package boundary change; the existing contract package alias continues to own the shared types. Live SQLite Prisma/Zod generation and 133 emitted-file checks validate that path.
- Independent slice review identified duplicate id ORDER BY (SQL Server), dropped table query parameters, client-writable unique references, and raw detail status display. All four are repaired before the implementation sign-off commit. References remain server-generated on create/update; seed writes are unaffected.

- CI build on `4689292` found the documentation service compile fixture missing the new sample module. Extend the write surface to `.llm/tools/docs/service-scaffold-support.ts` to materialize the canonical sample dependency, with no fence exemptions or checker changes. The scaffold-static gate also exposed an unsafe property access in the new emitted domain test; narrow the union before reading the amount field. Both are generator/fixture repairs within the original acceptance scope.

- Full CI runtime on `44491ca` passed 42 gates but stopped at generated.quality-negative: the pre-existing example routes emitted literal boolean ternaries rejected by Deno 2.9.7 lint. Bind the existing scaffold service choice to a named constant in those two templates, preserving rendered behavior and all lint rules. Also insert database samples chronologically so the generic CRUD page's unchanged ID-descending first page contains the latest sample; the 40-row expansion otherwise pushes the representative Seed row beyond its ten-row default page.
## Owner-requested main integration

After test-only delivery 48905de, the owner requested fetching and merging the latest main.
Main advanced from 4cb0298 to 4a2dae3 via plugin-to-linked-app delivery PR #2582. The merge
conflicts only in four example-template/test files plus the generated embedded carrier.
Main replaces our named-boolean lint workaround with scaffold-time serviceExampleHref and
serviceExampleEntries values. Take main's four files after verifying their entire diff is
only that same lint/optional-route concern; retain our model, contracts, seed, projections
and fixture repairs. Regenerate the carrier canonically from the merged maintained source.
This intentional reconciliation changes production relative to the old runtime proof, so
rerun focused semantics/route tests, wrappers and carrier checks, independent review and
full CI runtime at the merged head. No rebase, force-push, manual merge or page redesign.
