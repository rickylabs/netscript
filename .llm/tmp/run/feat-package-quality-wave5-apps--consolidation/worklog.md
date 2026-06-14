# Worklog — Wave 5 Apps Consolidation

## Design

**Public surface (unchanged externally except `fresh` D6):**
- `@netscript/service`: `.` (root). No subpath change.
- `@netscript/sdk`: `.`, `./cache`, `./client`, `./collections`, `./discovery`, `./ports`,
  `./query`, `./query-client`, `./streams`, `./telemetry` — **keys stable**, targets repointed to
  `src/`.
- `@netscript/fresh-ui`: `.`, `./interactive`, `./primitives` — **keys stable**, targets to `src/`.
- `@netscript/fresh`: rationalized at D6 (drop `./utils`; fold `./error`/`./streams`/`./defer`
  → `./streaming`; finalize `./server`).

**Domain vocabulary (lifted to `src/domain/`):** service request/health types; sdk cached-entry /
query-utils / service-definition types; fresh cache-entry, form/route/page contract types; fresh-ui
token vocabulary.

**Ports (seams — interfaces, not base classes):** sdk `ServiceTransport`, `CacheStore`,
`ClientLinkFactory`, query ports (keep). fresh `FormSchemaAdapter` (co-locate with `ZodSchemaAdapter`
in `schema-adapters/`). service: no real seam → none added.

**Adapters (`src/adapters/`):** sdk `KvCacheStore`, `HttpClientLink`, `KvCachePersister`.

**Constants:** CLI `SCAFFOLD_PACKAGES` enum is the single source of subpath specifiers — updated
once at D6 to drive templates + generators.

**Commit slices:** A1–A2, B1–B3, C1–C2, D1–D6, E (close). Target ≤ ~18 commits. < 30 cap honored.

**Deferred scope:** RFC14 unified mode, ui-primitives, publishing, base classes (D1.1), new tests
beyond split needs.

**Contributor path:** see consolidation-plan.md §Contributor path.

> Base-class withholding is deliberate (D1.1): doctrine A4/A5 — ports+adapters realize seams; no
> package has ≥ 2 concrete subtypes, so no base class is introduced. Recorded here so the evaluator
> reads it as a design decision, not an omission.

## Implementation evidence

(Appended per slice as work proceeds.)
