# [aspire-13-5 S5] Remove every literal pre-randomization port from plugin contributions and E2E probes

> DRAFT TEXT ONLY. Labels: `type:fix`, `epic:aspire-13-5`, `area:plugins`, `area:aspire`,
> `area:cli`, `priority:p0`, `status:triage`. Milestone: `0.0.7` (OF-3: pull #979 forward). Closes
> #1365, #1370, #979.

## Summary

Plugin contributions (sagas/triggers/streams/workers), the generated browser consumer stub, and the
sagas publisher still publish or fall back to fixed ports (8091–8094, 4437, `127.0.0.1:8092`) that
predate `aspire start --isolated` randomization. On 13.5 the proxyless allocation timing also
changed (BC-5). Remove every literal, make the sagas publisher result a checked value, and move E2E
probes to `aspire describe --format Json` URLs.

## Scope

- `plugins/sagas/src/aspire/sagas-contribution.ts`, `plugins/triggers/src/aspire/*`,
  `plugins/streams/src/aspire/*`, `plugins/workers/src/aspire/*`: URLs and health probes derive from
  `ctx.port(...)`/`ctx.serviceReference(...)` results only (#1370).
- Sagas publisher (#1365): `SagaPublisherResult` is **already**
  `SagaPublisherReceipt |
  SagaPublisherRejected`
  (`@netscript/plugin-sagas-core/integration/publisher`, re-exported by
  `@netscript/plugin-sagas/runtime`) and `SagaPublisherRejected.reason` is `string` — so
  `resolveServiceUrl` (`plugins/sagas/src/runtime/saga-publisher.ts:295-307`) returns
  `{ published: false, reason: 'no-endpoint', retryable: false }` instead of defaulting to
  `http://127.0.0.1:8092`; **no core type change**. Runtime readers of the default port go:
  `src/cli/adapters/runtime-api-client.ts:27`, e2e `probe-context.ts:3`, `scaffold.plugin.json`
  `servicePort`/`backgroundPort` (opt-in per #979); sample job + docs updated. **Public
  compatibility (D-14, locked):** `SAGAS_API_DEFAULT_PORT` (`src/constants.ts:11`) stays exported
  from root `mod.ts`, `./public`, `./runtime`, and `./aspire` with its value unchanged and a
  `@deprecated` JSDoc ("not a runtime fallback; removed in 0.0.8 — see <deprecation issue>").
  Pre-slice jsr-audit record: `research.md` §15.
- Plugin API resource host-port pinning becomes opt-in like #952 did for app/service (#979);
  `check:aspire-host-ports` extended to plugin registrations.
- `packages/cli/e2e/src/application/gates/scaffold/*` gates that live-probe 8091–8094: resolve the
  URL from `aspire describe` (`urls[].url`) per resource name.

## Boundaries

No health-check registration (S6) and no resource commands (S8). Do not touch `_aspire-compat.mts`.

## Acceptance

- [ ] `git grep -nE '809[1-4]|4437|127\.0\.0\.1:80' -- plugins packages/cli/src packages/cli/e2e`
      returns hits **only** in `plugins/sagas/src/constants.ts` (the deprecated constant) and in
      tests asserting the deprecation/absence; any hit in a runtime path fails.
- [ ] `SAGAS_API_DEFAULT_PORT` still exported from all four entry points (export-map test) with
      `@deprecated` visible in `deno doc --json`; a 0.0.8 deprecation-removal issue is referenced.
- [ ] `deno task check:aspire-host-ports` covers plugin resources and passes.
- [ ] Two concurrent `aspire start --isolated` of the same generated project both reach healthy
      plugin resources (receipt in PR).
- [ ] `scaffold.runtime` green on both tiers; `scaffold.plugins` green.
- [ ] `Closes #1365`, `Closes #1370`, `Closes #979` in the PR body.

## Tests / gates

Plugin unit tests; `scaffold.runtime`; `scaffold.plugins`; scoped wrappers; `quality:scan`
(hard-coded plugin-name/host-side coupling check); `arch:check`; **jsr-audit gates (mandatory,
research §15):** `deno publish --dry-run --allow-dirty` for `plugins/sagas` (no new slow-type or
dynamic-import warnings beyond the three pre-existing), `deno doc --lint plugins/sagas/mod.ts` adds
no error beyond the pre-existing `private-type-ref` (#1708, not pulled into this wave),
consumer-import gate on canary B (`deps:prod-install` `@netscript/plugin-sagas@canary` + type-check
a fixture importing `SagaPublisherResult` and `SAGAS_API_DEFAULT_PORT` from `./runtime`), consumer
migration for `plugins/workers/src/cli/official-sample-configuration.ts` and the CLI tests pinning
8092.

## Docs / static asset regeneration

`deno task gen:assets-barrel` (generated helpers snapshot), `gen:publish-assets` if plugin READMEs
change; `check:publish-assets`.

## Rollback

Revert + `gen:assets-barrel`; the runtime 8092 fallback returns. The public constant never changed
value or export path, so consumers are unaffected either way.

## Related

Part of #<epic>. Depends on S4. Blocks S6. Related closed: #952, #977, #980.
