# Research — fix-1015-sagas-registry-path--dependency-mode

## Re-baseline

- Carried-in source: issue #1015 reproduction and cause leads in the user brief.
- Re-derived against `origin/main` at `3ab64720f` on 2026-08-01.
- The supplied cause matches the source: both service init and runner fallback resolve a relative
  registry path against their published package module URL; generated glue already resolves from
  the consumer project; Aspire does not declare `SAGAS_REGISTRY_MODULE`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `services/src/init.ts` hard-codes `../../../../.netscript/...` and passes `new URL(..., import.meta.url).href`; it bypasses runner option/env precedence. | `plugins/sagas/services/src/init.ts` |
| 2 | `saga-runner.ts` reads explicit option then `SAGAS_REGISTRY_MODULE`, but its fallback is relative and `resolveModuleSpecifier` anchors leading-dot values to `import.meta.url`. | `plugins/sagas/src/runtime/saga-runner.ts` |
| 3 | No producer sets `SAGAS_REGISTRY_MODULE`; Aspire `declareEnv` omits it. | `rg "SAGAS_REGISTRY_MODULE" plugins/sagas` |
| 4 | Generated `sagas/runtime.ts` glue already produces an absolute project-owned `file://` URL from `Deno.cwd()` and passes it explicitly. | `plugins/sagas/src/adapter/resources/glue/runtime.stub.ts` |
| 5 | Project-root convention is `NETSCRIPT_PROJECT_ROOT ?? Deno.cwd()`. | `packages/config/loader.ts` |
| 6 | Published exports include `./runtime`, `./services`, and `./aspire`; the helper can remain internal to `./runtime` while being re-exported only if generated glue needs it. | `plugins/sagas/deno.json` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `plugins/sagas/deno.json` exports and publish include list.
- Slow-type / surface risks: avoid a new public export; keep explicit return types/JSDoc on any
  exported seam. The new internal source is already covered by `src/**/*.ts` in the publish list.
- No export-map, metadata, or package-file-list change is planned.

## Open questions

- None. Keep generated glue text unchanged: it remains a second project-edge implementation, while
  service and runner share one plugin runtime helper. This satisfies the prohibition on triplicated
  helper bodies without triggering the user-directed glue-text decision stop.
