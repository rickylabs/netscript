# Drift

## Health-check implementation boundary

The issue is larger than its root-cause summary implies. Switching scaffolded Deno KV from
`External` to its existing container generator resolves the parameter and URL, but the pinned
Deno KV Connect 0.11.0 image exposes authenticated POST protocol routes only. It has no HTTP
health endpoint. Aspire 13.4's TypeScript AppHost supports HTTP resource probes but explicitly
does not support registering custom AppHost health checks. A generated `/health` probe was
tested at the source-generator level and rejected because it would never succeed against the
production image.

SQLite is a file-backed library rather than a running service. Making it a truthful graph node
with a real readiness check likewise needs a deliberate probe-resource design, not a cosmetic
parameter node.

Per lane instructions, implementation stopped rather than shipping a unit-test-only health claim.

## Owner rescope

The blocked health-check row moved to #1280 for milestone 0.0.6. The remaining #1251 rows are
deliverable without making a health claim, so PR #1266 resumed. The research above remains as the
two-part proof for #1280; no false `/health` probe was added.
