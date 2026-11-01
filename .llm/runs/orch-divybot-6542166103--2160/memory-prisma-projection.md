# Prisma saga projection format

New SagaInstance.state JSON contains the full separated read model plus
projectionVersion: 2. Its nested state is business data; JSON status stays the
runtime status at the existing list-filter path. API mapper checks the marker,
validates new rows and returns business state unchanged. Legacy rows stay verbatim;
no reader can recover data that the old writer already overwrote.
