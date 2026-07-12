# Plan: #234 Phase 0/1 TLS opt-in re-baseline

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-234-h2-tls-optin--codex` |
| Branch | `feat/234-h2-tls-optin` |
| Phase | `implement/gate` |
| Target | `packages/service` |
| Archetype | `4 - Public DSL / Builder` (runtime gates added for listener materialization) |
| Scope overlays | `service` |

## Goal and locked decisions

- Re-prove the already-landed Phase 0/1 contract at the pinned baseline without duplicating code.
- Keep TLS opt-in and plain HTTP the default; do not change Aspire, scaffold, or Fresh/Vite behavior.
- Use the existing package-owned `ServiceTlsOptions` and direct `Deno.serve` TLS branch.
- Record real ALPN/curl and Deno-fetch evidence plus focused package gates.

## Open-decision sweep

All rollout decisions beyond inline TLS are safe to defer because they belong to Phase 2/3. No
decision needed for this evidence slice would force rework in the existing Phase 1 contract.

## Risks and mitigation

| Risk | Mitigation |
| --- | --- |
| Mistaking merged baseline code for new work | Record ancestor commit and no-op product diff as drift D2. |
| Claiming HTTP/2 from a stub-only test | Run a real TLS listener and capture curl ALPN/HTTP version plus Deno fetch success. |
| Lock churn or expensive orchestrator-owned gates | Do not modify `deno.lock`; do not run `e2e:cli` or `scaffold.runtime`. |

## Gate set

- Targeted TLS listener test and service package tests as proportionate runtime/consumer evidence.
- Scoped check, lint, and format wrappers for `packages/service`.
- Focused `deno doc` inspection for the public TLS surface.
- IMPL-EVAL and slice sign-off remain orchestrator-owned separate-session gates.

## Deferred scope

- TLS-by-default, Aspire dev-cert provisioning, service-discovery scheme changes, browser trust,
  Fresh/Vite HTTPS/HMR, production/mTLS, and full CLI E2E.
- Existing service debt entries are unchanged; no new architecture debt is introduced.
