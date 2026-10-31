# Changelog

## Unreleased

- Add inert `./service` exports for `startWorkersService` and `WorkersServiceOptions`, using native
  explicit auth, CORS and listener options. Explicit listener values take precedence over legacy
  context/environment port defaults. The plural entrypoint delegates with its existing public policy
  and bootstrap; host-owned KV and stream producers remain host-owned.
- Forward optional native reader headers through `createWorkersStreamDB`. Explicit records,
  including empty records, replace ambient producer authentication; omission preserves it.
