# Drift Log: #1425 SDK JSDoc API-client path

## 2026-08-12 — Published desktop JSDoc sibling defect added to scope

- **What:** Extend the slice to replace the desktop subpath example's relative app contract import
  with the scaffolded project contract alias.
- **Source:** Independent adversarial review of PR #1526; orchestrator/user authorization.
- **Expected:** #1425 literally covers the stale `api-clients` module name in SDK JSDoc.
- **Actual:** `packages/sdk/src/desktop/mod.ts` has the same published-reader failure class via
  `./contracts/orders.ts`, although it is not the same stale name.
- **Severity:** significant
- **Action:** fix as an explicit scope extension; do not use it as evidence for a #1425 acceptance box.
- **Evidence:** `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:63` emits
  `@<projectName>/contracts`; `docs/site` generic examples use `@my-app/contracts`.
