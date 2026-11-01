# Sagas read-model seams

SagaInstance Prisma read model has only an indexed (sagaName, correlationId) pair,
not a unique selector; use findFirst with exact predicate and no ordering for a
single bounded query. Canonical runtime correlation does have a unique selector.
KV projection and canonical durable backend are independent; direct GET must use
the configured store's findByCorrelation/load, not raw duplicated key strings.
Canonical envelopes do not contain lastMessageType (optional on the API).
