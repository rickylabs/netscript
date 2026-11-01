# Capability integration — 2026-11-01

The actual service add command requires `--name`, not a positional name:
`netscript service add --name records --with-client`. Its flag is verified in
`public/features/services/add/add-service-command.ts`.

Generated auth is OAuth via same-origin POST `/auth/signin`; there is no password
login contract in the BFF. `/auth/session` returns safe identity only. Reuse the
root `auth/bff.ts` request-context client for guarded service reads.

Theme metadata already lives in generated `lib/theme.ts`: `appTheme().label` reads
theme-preset.json at runtime and therefore reflects presets applied after init.

Plugin command groups are not top-level `netscript workers/streams/ai` commands in
the current public/maintainer CLI. Installed empty states use the supported
`netscript plugin info @netscript/plugin-<kind>` dispatch, and diagnostics use
`netscript plugin doctor` (no positional plugin argument). Missing features retain
the verified `plugin install <kind> --name <kind>` command.

Public init injects JsrImportResolver; changing the older kernel import-resolver
map alone does not cover public scaffolds. Register new direct imports in public
and maintainer adapters too. The installed-auth public fixture catches omissions.
Scoped lint/fmt wrappers take --config directly; only the check wrapper takes
--deno-arg. Local rg in this session returned no matches even for present literals;
Python focused reads were used as fallback.

Service add --with-client emits a memory contract even in database workspaces.
The scaffold connection hook runs only for that known new-client path and compares
the complete formatted absent loader before replacing it. Arbitrary authored or
already-connected loaders are preserved. Actual fresh post-init app check:101files.
