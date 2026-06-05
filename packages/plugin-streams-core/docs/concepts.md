# Concepts

## Stream Schema

A stream schema is an entity-oriented State Protocol contract created by
`defineStreamSchema`.

## Collection

A collection maps one entity type to a Standard Schema validator, durable
stream type discriminator, and primary key.

## Producer

`DurableStreamProducer` appends upsert and delete events to a durable stream
server.

## URL Resolution

`getStreamsUrl`, `getStreamsAuth`, and `buildStreamUrl` centralize environment
and Aspire service-discovery conventions.
