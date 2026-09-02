# Research — S10 structured Aspire E2E gates

## Locked scope

- Issue #1722 owns structured doctor, describe-follow, exact-stop, and resource-command E2E gates.
- Epic #1712 is reference-only. #1372 is partially covered and must not close.
- The worktree is stacked on S8 head `9dd06647`; S8's typed `<db>-cli` commands are the command
  surface exercised here.
- Phase A is fixture-driven and static. No AppHost start, container creation, or runtime suite is
  authorized. D-42/D-43 make Phase B environment-blocked on this NAS.

## Existing architecture

`packages/cli/e2e` is Doctrine Archetype 6. Gate IDs live in `cli-surface.ts`, gate factories own
suite registration, runtime-edge modules own process/filesystem IO, and the injected command gate
runner records command evidence. The S6 listener health contract requires object-valued
`healthReports`; S8 supplies a single timeout policy through `ASPIRE_CLI_START_TIMEOUT`.

## Aspire 13.5.3 evidence

- Authorized static capture on 2026-08-30: pre/post `aspire ps` returned `[]`; pre/post
  `docker ps -a` was empty. `aspire doctor --format Json --non-interactive --nologo` reported five
  passes, three warnings, and zero failures. The verbatim JSON is the doctor fixture.
- `aspire describe --follow --format Json` is an NDJSON stream. Phase A uses a hand-built stream
  whose last-seen resource states converge and whose listener report preserves S6's object shape.
- Cleanup targets the exact AppHost: normal stop, then force stop only for `--cleanup`.
- S7's ownership contract is mirrored, not imported: mount label
  `com.microsoft.developer.usvc-dev.mountsLabel`, `ASPIRE_DCP_APPHOST_PATH`, exact `--apphost` argv,
  and Aspire identities `aspire-managed` / `dcp`. Authority:
  `origin/fix/aspire-13-5-s7-teardown-leak-check:.llm/tools/agentic/teardown/probes.ts:8-12,54-59,99-123,163-190`.

## JSR surface disposition

No `@netscript/cli` export, `deno.json` export map, JSDoc, or published package surface changes.
`@netscript/cli-e2e` remains `publish:false`; the planned files are internal E2E gates and tests.
The JSR audit rubric is therefore N/A beyond confirming no public-surface delta.
