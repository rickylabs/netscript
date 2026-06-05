# Concepts

## Service

The service starts `DurableStreamTestServer` and fronts it with Hono health
routes and proxy behavior.

## CLI

The CLI currently exposes stubs for stream verbs until walker and runtime CLI
integration land in later phases.

## Aspire

The Aspire contribution registers the streams Deno service resource.
