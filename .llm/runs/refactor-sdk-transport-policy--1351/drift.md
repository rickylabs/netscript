# Drift Log: #1351 SDK transport policy

No design or implementation drift from the approved plan has been recorded.

The final `scaffold.runtime` gate failed twice outside the changed surface after 38 passing steps:
Aspire returned `404 NotFound` for the generated Postgres executable during `database.init`.
Cleanup passed and the harness leak reporter found zero survivors. This is recorded as an external
validation blocker, not used to widen #1351 into CLI/Aspire source.
