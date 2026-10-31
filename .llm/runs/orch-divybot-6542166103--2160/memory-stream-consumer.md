# Saga projection consumers

SagaInstance JSON has two readers: HTTP v1-helpers and the durable stream startup
reconciler in streams/producer.ts. Updating only the HTTP mapper leaves startup
stream snapshots wrapped differently from live transition upserts. Both now use
parseSagaInstanceReadModel for projectionVersion 2; business state/status remain
separate. A new reconciliation regression and reverted-mapper negative control
protect that consumer. Preserve legacy rows explicitly, not by guessing nested keys.
