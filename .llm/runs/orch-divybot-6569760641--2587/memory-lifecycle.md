# Seed lifecycle — 2026-11-02

The installed workers starter is emitted by `plugins/workers/src/adapter/resources/job/`,
with id `health-check`; it is not the older CLI `workers-health-check` template or
plugin-owned `workers-plugin-health-check`. Mark only the generated starter as a sample.
The worker supports `JobMessage.idempotencyKey` already. Its trigger vocabulary uses
`manual`, not `seed`; put seed provenance in payload/correlation. Durable acceptance
receipts prevent normal restart/reseed dispatch, with the same key retained on retry.

Record activity should inspect the producer write receipt's completion, not just flush:
rejection/unknown-delivery is an explicit terminal outcome, not necessarily a throw.
