# Scope Overlay — Service

Use this overlay for `services/`, background services, API handlers, Aspire
resource wiring, database integration, or service-to-service contract work.

## Doctrine Boundary

Services consume the doctrine-owned packages and plugins. If service work
changes `packages/`, `plugins/`, contracts, or public builders, apply the
affected archetype profile first.

## Additional Read First

- `.claude/04-services.md`
- `.claude/06-infrastructure.md`
- service contracts in `contracts/versions/v1/`
- service handlers, middleware, clients, and database access touched by the work
- Aspire topology and logs when runtime behavior matters

## Additional Gates

| Gate | Requirement |
|------|-------------|
| Contract check | Affected contract/schema/client types pass |
| Service check | Narrowest service slice typecheck passes |
| Runtime health | Aspire resources are running/healthy when runtime behavior changes |
| Trace/log review | No new startup errors, request failures, or hidden retries |
| Consumer check | Frontend/background/plugin consumers still compile or run |

## False-Done States

- Handler compiles but contract clients or generated types are stale.
- Service starts but dependent resources are unhealthy.
- Runtime error appears only in Aspire logs, not static output.
- Package/plugin changes are treated as service-only work.

## Rescope Triggers

- Contract shape changes across multiple services.
- Database or resource topology must be redesigned.
- A service fix requires package/plugin doctrine remediation.
