# Capability integration — 2026-11-01

The actual service add command requires `--name`, not a positional name:
`netscript service add --name records --with-client`. Its flag is verified in
`public/features/services/add/add-service-command.ts`.

Generated auth is OAuth via same-origin POST `/auth/signin`; there is no password
login contract in the BFF. `/auth/session` returns safe identity only. Reuse the
root `auth/bff.ts` request-context client for guarded service reads.

Theme metadata already lives in generated `lib/theme.ts`: `appTheme().label` reads
theme-preset.json at runtime and therefore reflects presets applied after init.
