# Drift Log: S5 Hono context typed seam

Drift is append-only. Record facts that diverge from the brief, plan, doctrine, or current-state documentation.

## 2026-06-20 — README already existed with requested auth content

- **What:** The brief said to add `packages/service/README.md` with auth quick start and response-shape docs.
- **Expected:** A new README might need to be created.
- **Actual:** `packages/service/README.md` already exists on this branch and already contains the requested auth quick start, prefix defaults, provider-router `allowAnonymous` example, and 401/403 response shape from the prior auth seam.
- **Severity:** minor
- **Action:** accept; no README churn added.

## 2026-06-20 — oRPC public router aliases are not root-doc-lint-compatible

- **What:** Replacing `ServiceRouter = Record<string, unknown>` with oRPC `AnyRouter`/`Router` removed adapter casts but made root `deno doc --lint` fail with private-type references and broke the empty-router compatibility test.
- **Expected:** Local builder types should align with upstream types where possible.
- **Actual:** The public `ServiceRouter` remains package-owned and structural; an internal guard in `src/primitives/orpc-router.ts` narrows it for oRPC handler construction without type assertions.
- **Severity:** minor
- **Action:** accept; package-wide zero-cast proof passes and public compatibility is preserved.
