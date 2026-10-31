# Changelog

## Unreleased

- Add inert `./service` exports for `startStreamsService` and `StreamsServiceOptions`, with required
  native auth and optional CORS/listener options. Use native `authn.protect` for raw stream paths;
  omitted factory origins inherit the workspace allowlist and protocol defaults remain supplied.
- Delegate the plural CLI entrypoint to that factory while retaining its start-on-import public and
  wildcard-origin policy, storage/proxy behavior and native shutdown hooks.
