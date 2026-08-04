# Research

## Current baseline

- Live issue #1294 has four close-gated acceptance boxes and requires exactly seven independently named verdicts.
- `e2e-cli-prod.yml` installs the exact published JSR CLI, then runs only `scaffold.runtime`.
- The semantic E2E runner already provides ordered, independently reported gates, per-command deadlines, timeout classification, JSON/NDJSON reporting, and exact-JSR minimum-age handling.
- `scaffold.runtime` initializes with a service and therefore cannot detect the post-init `service add` failure from #1290.
- `docs/site/quickstart.vto` currently initializes with `--service`; it does not yet document the post-init service add, DB workflow, project check, or example-service probe required by #1294.
- Aspire restore/start gates use the shared command timeout, whose default is 900 seconds. A purpose-built walk must set a materially smaller bound and attach the #1227 classification to timeout failures.
- The existing generated-service health probe resolves its live endpoint from `aspire describe`; no fixed port should be invented.
- `deno.lock` was already modified before this branch was created; opening diff SHA-256 is `4a543c6d3787122ba8a524a23cfc2ee544d53a9ed7daf34da74ab5a6657de280` and is outside scope.

## Doctrine and shape

Archetype 6 applies because this extends a CLI/tooling suite and its production workflow. A14 makes the seven semantic gates the contract. The implementation should reuse the existing gate runner, command adapter, reporters, JSR command factory, cleanup, and live service probe rather than introduce another runner.

## Open questions resolved

- The docs and suite will share a checked command manifest through a parser-based drift test: changing either side alone fails.
- The seven issue bullets define verdict boundaries; combined commands (Aspire restore/start and DB init/generate/seed) remain one verdict each while retaining command-specific failure text.
- The suite will default to published JSR source and reject local source at construction, while the canary workflow passes the exact version explicitly.

