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
- Sagas publisher (#1365): `SagaPublisherResult` becomes a discriminated result; no `127.0.0.1:8092`
  fallback; sample job + docs updated.
- Plugin API resource host-port pinning becomes opt-in like #952 did for app/service (#979);
  `check:aspire-host-ports` extended to plugin registrations.
- `packages/cli/e2e/src/application/gates/scaffold/*` gates that live-probe 8091–8094: resolve the
  URL from `aspire describe` (`urls[].url`) per resource name.

## Boundaries

No health-check registration (S6) and no resource commands (S8). Do not touch `_aspire-compat.mts`.

## Acceptance

- [ ] `rtk grep -rnE '809[1-4]|4437|127\.0\.0\.1:80' plugins packages/cli/src packages/cli/e2e`
      returns nothing outside tests that assert the _absence_ of literals.
- [ ] `deno task check:aspire-host-ports` covers plugin resources and passes.
- [ ] Two concurrent `aspire start --isolated` of the same generated project both reach healthy
      plugin resources (receipt in PR).
- [ ] `scaffold.runtime` green on both tiers; `scaffold.plugins` green.
- [ ] `Closes #1365`, `Closes #1370`, `Closes #979` in the PR body.

## Tests / gates

Plugin unit tests; `scaffold.runtime`; `scaffold.plugins`; scoped wrappers; `quality:scan`
(hard-coded plugin-name/host-side coupling check); `arch:check`; `jsr-audit` skill if any plugin
public surface changes.

## Docs / static asset regeneration

`deno task gen:assets-barrel` (generated helpers snapshot), `gen:publish-assets` if plugin READMEs
change; `check:publish-assets`.

## Related

Part of #<epic>. Depends on S4. Blocks S6. Related closed: #952, #977, #980.
