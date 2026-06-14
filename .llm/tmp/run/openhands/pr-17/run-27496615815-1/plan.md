# Wave 5 — Doc & Final Structure Plan

**Run:** 27496615815-1  
**Previous Run:** 27493382997-1 (failed at 1000 iterations)  
**Focus:** Apply NetScript doctrine patterns to Apps Layer packages after sub-waves completed

---

## Current State Assessment

### Sub-Waves Status
All implementation sub-waves are **MERGED** and **PASSING** quality gates:

- ✅ **5a (sdk)** — Merged, doctrine-compliant
- ✅ **5b (service)** — Merged, basic subpath exports only
- ✅ **5c (fresh-ui)** — Merged, interactive/primitives split complete
- ✅ **5d (fresh)** — Merged, major restructuring complete

### Package Archetypes (as of Wave 5 completion)

| Package | Current Archetype | Doctrine Target | Status |
|---------|------------------|-----------------|--------|
| `@netscript/sdk` | Archetype 2 (Platform Adapter) | 2 | ✅ Compliant |
| `@netscript/service` | Archetype 4 (Builder) | 4 (with 2 subpaths) | ⚠️ Partial |
| `@netscript/fresh-ui` | Archetype 3 (Runtime/Behavior) | 3 | ✅ Compliant |
| `@netscript/fresh` | Archetype 3 (Runtime/Behavior) | 3 | ✅ Compliant |

### Architecture.md Files (Doctrine 03)

| Package | Status | Content |
|---------|--------|---------|
| sdk | ✅ Complete | Layered L0→L3, composability contract, type inference |
| service | ✅ Complete | Builder pattern, primitives, subpath rationale |
| fresh-ui | ⚠️ Partial | Interactive/primitives split documented, ADR-0001 added |
| fresh | ⚠️ Partial | Feature list present, runtime behavior underdocumented |

---

## Restructuring Plan

### Phase 1: LOC Violations (Critical — Blocks Doctrine Compliance)

Doctrine 04 (Module Size) requires files to stay under 500 LOC. The following files violate this:

#### 1.1 Split `page-compat.ts` (1,111 LOC)

**File:** `packages/fresh/builders/define-page/page-compat.ts`  
**Rationale:** Contains backward-compatible page builder types and helpers that have distinct concerns

**Proposed Split:**

```
packages/fresh/builders/define-page/
├── page-compat/
│   ├── mod.ts              (re-exports, ~50 LOC)
│   ├── types.ts            (type definitions, ~300 LOC)
│   ├── helpers.ts          (runtime helpers, ~400 LOC)
│   ├── adapters.ts         (adapter functions, ~200 LOC)
│   └── validators.ts       (validation logic, ~150 LOC)
└── page-compat.ts          (deprecated re-export for back-compat)
```

**Migration:**
- Keep `page-compat.ts` as a deprecated re-export shim for one wave
- Mark with `@deprecated` JSDoc and add TODO to remove in Wave 6
- Update internal imports to use subpath imports

**Estimated Effort:** 2-3 hours  
**Risk:** Low (isolated to define-page internal use)

#### 1.2 Review `mod.tsx` Consoliation (884 LOC)

**File:** `packages/fresh/builders/define-page/builder/mod.tsx`  
**Current State:** Consolidated page builder module (from 5d slice 16-17)

**Decision:** HOLD — This file is cohesive despite being large. It contains:
- Component definition logic (~400 LOC)
- Render strategy selection (~200 LOC)
- Type-safe builder API (~300 LOC)

**Rationale:** The module follows Single Responsibility Principle (page definition). Splitting would fragment a cohesive unit.

**Recommendation:**
- Add a future review trigger: split if maintenance burden increases or if the file exceeds 1,000 LOC
- Document the consolidation decision in `architecture.md`

**Estimated Effort:** 0 (no action needed)  
**Risk:** N/A

---

### Phase 2: Documentation Completion (High Priority — Doctrine 02)

Doctrine 02 (Package Documentation) requires comprehensive package-level documentation beyond just architecture docs.

#### 2.1 SDK Documentation

**Status:** Minimal — mostly JSDoc and architecture.md

**Required Additions:**

```
packages/sdk/docs/
├── guides/
│   ├── getting-started.md          (installation, first query setup)
│   ├── service-client-usage.md     (createServiceClient examples)
│   ├── query-factory-patterns.md   (createQueryFactory, TanStack integration)
│   ├── cache-integration.md        (CacheProvider, invalidation strategies)
│   └── error-handling.md           (typed errors, Result pattern)
├── recipes/
│   ├── pagination.md               (offset/curser pagination patterns)
│   ├── optimistic-updates.md       (queryClient.setQueryData)
│   ├── parallel-queries.md         (Promise.all, queryClient.fetchQuery)
│   └── testing.md                  (mocking services, test utilities)
└── reference/
    ├── api-index.md                (link to generated TypeScript API)
    ├── composability-contract.md   (expand architecture.md section)
    └── type-inference.md           (how ContractLike flows through layers)
```

**Estimated Effort:** 3-4 hours  
**Risk:** Low (additive documentation)

#### 2.2 Service Documentation

**Status:** Moderate — architecture.md describes builder pattern

**Required Additions:**

```
packages/service/docs/
├── guides/
│   ├── define-service.md           (complete defineService() walkthrough)
│   ├── openapi-generation.md       (OpenAPI schema, Scalar docs)
│   ├── health-checks.md            (built-in health endpoint customization)
│   └── middleware-integration.md   (Hono middleware, authentication)
├── recipes/
│   ├── database-connection.md      (Prisma, Drizzle integration)
│   ├── rpc-handlers.md             (oRPC setup, type-safe calls)
│   └── testing-services.md         (supertest, mocked dependencies)
└── reference/
    ├── subpath-exports.md          (why ./builders, ./types, ./testing)
    └── runtime-boundary.md         (RunningService lifecycle)
```

**Estimated Effort:** 2-3 hours  
**Risk:** Low

#### 2.3 Fresh-UI Documentation

**Status:** Partial — ADR-0001 documents Zag decision

**Required Additions:**

```
packages/fresh-ui/docs/
├── guides/
│   ├── interactive-components.md   (hydration, Zag integration)
│   ├── primitive-components.md     (styled primitives, ARIA patterns)
│   └── theming.md                  (design tokens, CSS variables)
├── recipes/
│   ├── custom-components.md        (extending primitives)
│   └── accessibility.md            (keyboard nav, screen readers)
└── reference/
    ├── zag-integration.md          (how Zag state machines work)
    └── data-part-contract.md       (data-part, data-state, ARIA attrs)
```

**Estimated Effort:** 2-3 hours  
**Risk:** Low

#### 2.4 Fresh Documentation

**Status:** Incomplete — architecture.md has feature list but lacks usage patterns

**Required Additions:**

```
packages/fresh/docs/
├── guides/
│   ├── define-page.md              (page builder with forms, validation)
│   ├── define-route.md             (route definitions, middleware)
│   ├── deferred-rendering.md       (defer() pattern, streaming)
│   └── server-components.md        (Fresh 2 islands, islands architecture)
├── recipes/
│   ├── form-handling.md            (form schema, state machine)
│   ├── query-integration.md        (useQuery with Fresh pages)
│   ├── error-boundaries.md         (error display, retry patterns)
│   └── testing-pages.md            (render utilities, mocking)
└── reference/
    ├── runtime-behavior.md         (server vs client execution)
    ├── form-api.md                 (form schema, validation rules)
    └── routing-contract.md         (route manifest, matching algorithm)
```

**Estimated Effort:** 4-5 hours  
**Risk:** Low (largest package, most features to document)

---

### Phase 3: Subpath Exports (Medium Priority — Doctrine 08)

Doctrine 08 (Public Surface) requires packages to expose logical subpaths for granular imports.

#### 3.1 Service Subpath Exports

**Current State:** Only exports from `mod.ts`

**Proposed Subpaths:**

```json
{
  ".": "./src/mod.ts",
  "./builders": "./src/builder/mod.ts",
  "./types": "./src/types/mod.ts",
  "./testing": "./src/testing/mod.ts"
}
```

**Rationale:**
- `service/builders` — Users building custom service types without the preset
- `service/types` — Consumers needing type definitions for advanced scenarios
- `service/testing` — Test utilities for mocking services

**File Changes Required:**

1. Create `packages/service/src/builder/mod.ts` (re-exports)
2. Create `packages/service/src/types/mod.ts` (re-exports)
3. Create `packages/service/src/testing/mod.ts` (test utilities, may need stub)
4. Update `packages/service/deno.json` exports map

**Estimated Effort:** 1-2 hours  
**Risk:** Medium (new public surface, requires back-compat consideration)

#### 3.2 Fresh Subpath Exports

**Current State:** Exports feature entrypoints (fresh/route, fresh/page, fresh/defer, etc.)

**Decision:** HOLD — Current subpath strategy is appropriate. No changes needed.

**Rationale:**
- `fresh/route` — Routing primitives
- `fresh/page` — Page builder
- `fresh/defer` — Deferred rendering
- `fresh/form` — Form integration
- `fresh/query` — TanStack Query helpers
- `fresh/server` — Server utilities
- `fresh/interactive` — Client-side interactivity

These are logical feature boundaries. Adding more granular subpaths (e.g., `fresh/defer/types`) would create maintenance burden without clear benefit.

**Estimated Effort:** 0  
**Risk:** N/A

---

### Phase 4: Integration Validation (Low Priority — Quality Gate)

#### 4.1 E2E Scaffold Test

**Goal:** Verify a fresh NetScript scaffold can import and use all four Wave 5 packages without errors.

**Test Script:**

```typescript
// tests/e2e/wave5-smoke.test.ts

import { createServiceClient } from "@netscript/sdk";
import { defineServices } from "@netscript/sdk/preset";
import type { ServiceClient } from "@netscript/sdk/types";

import { defineService } from "@netscript/service";

import { definePage, defineRoute } from "@netscript/fresh";
import { defer } from "@netscript/fresh/defer";

import { Button, Input } from "@netscript/fresh-ui";
import { useButton } from "@netscript/fresh-ui/interactive";

// Type checks
type TestContract = {
  getUser: (id: string) => Promise<{ name: string }>;
};

const client: ServiceClient<TestContract> = createServiceClient({
  baseURL: "http://localhost:8000",
});

const service = defineService({
  name: "test",
  routes: [],
});

const page = definePage({
  name: "TestPage",
  route: "/test",
  component: () => <div>Test</div>,
});

const route = defineRoute({
  name: "test",
  path: "/test",
  handler: () => new Response("OK"),
});

console.log({ client, service, page, route });
```

**Validation Steps:**

1. Create scaffold project: `deno run -A scripts/scaffold.ts test-smoke`
2. Install Wave 5 packages from local workspace
3. Run `deno check tests/e2e/wave5-smoke.test.ts`
4. Verify no type errors, missing exports, or import failures

**Estimated Effort:** 1 hour  
**Risk:** Medium (cross-package integration, may reveal hidden issues)

---

## Prioritized Execution Order

### Immediate (This Run — If Time Permits)

1. **Split page-compat.ts** (Phase 1.1) — Critical LOC violation
2. **Add service subpath exports** (Phase 3.1) — Improves package flexibility

### Next Run (200-iteration follow-up)

3. **Complete SDK documentation** (Phase 2.1)
4. **Complete service documentation** (Phase 2.2)
5. **Complete fresh-ui documentation** (Phase 2.3)

### Final Run (if needed)

6. **Complete fresh documentation** (Phase 2.4) — Largest effort
7. **E2E smoke test** (Phase 4.1) — Integration validation

---

## Estimated Total Effort

| Phase | Tasks | Hours | Iterations (est.) |
|-------|-------|-------|-------------------|
| 1 — LOC Fixes | page-compat split | 2-3 | 30-50 |
| 2 — Documentation | guides/recipes/reference | 11-15 | 150-200 |
| 3 — Subpaths | service exports | 1-2 | 20-30 |
| 4 — Integration | E2E smoke test | 1 | 20-30 |
| **Total** | **All phases** | **15-21** | **220-310** |

**Recommendation:** Split into two follow-up runs:
- **Run A (200 iterations):** Phase 1 + Phase 3 + partial Phase 2
- **Run B (150 iterations):** Complete Phase 2 + Phase 4

---

## Decision Points

### Q1: Split `mod.tsx` (884 LOC)?

**Decision:** HOLD  
**Rationale:** Cohesive module, follow SRP. Split only if >1,000 LOC or maintenance burden increases.  
**Document in:** `packages/fresh/docs/architecture.md`

### Q2: Add `./builders`, `./types`, `./testing` to service?

**Decision:** YES (Phase 3.1)  
**Rationale:** Aligns with doctrine 08, improves flexibility for advanced users.  
**Back-compat:** All existing imports from `mod.ts` continue to work.

### Q3: Split documentation across multiple runs?

**Decision:** YES (Run A + Run B)  
**Rationale:** Fresh documentation is large (4-5 hours). Quality > speed.  
**Handoff:** Run A documents sdk, service, fresh-ui. Run B documents fresh.

---

## Acceptance Criteria

Wave 5 is "complete" (not "merged") when:

- [ ] All files <500 LOC or documented consolidation decisions
- [ ] All packages have `docs/guides/getting-started.md`
- [ ] All packages have `docs/recipes/` with ≥2 recipes
- [ ] Subpath exports align with doctrine 08
- [ ] E2E scaffold test passes from fresh install
- [ ] All architecture.md files updated with subpath rationale

**Current Progress:** 50/100 (sub-waves merged, gates pass, structure ~95% complete)

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| page-compat split breaks back-compat | Low | Medium | Keep re-export shim for one wave |
| Documentation examples outdated | Medium | Low | Use typedoc-style examples from code |
| Service subpath exports create maintenance burden | Medium | Medium | Document rationale, review in Wave 6 |
| E2E test reveals missing exports | Low | High | Fix and backport to sub-waves |
| Fresh documentation incomplete due to time | High | Medium | Split across two runs |

---

## References

- Doctrine files: `docs/architecture/doctrine/`
- Sub-wave artifacts: `.llm/tmp/run/openhands/pr-17/run-*/`
- Run summary: `.llm/tmp/run/openhands/pr-17/run-27496615815-1/summary.md`
- Research: `.llm/tmp/run/openhands/pr-17/run-27496615815-1/research.md`
