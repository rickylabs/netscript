# Context Pack — auth-kv-oauth backend boundary

## Current State

Branch: `feat/prime-time/auth-s3-kv-oauth`.

Implemented the S3 backend-boundary cleanup for `packages/auth-kv-oauth`:

- `createKvOAuthBackend()` now returns `Promise<KvOAuthBackend>`.
- `KvOAuthBackend` is a named interface extending `AuthBackendPort` and `KvOAuthFlow`.
- All cast expressions in `packages/auth-kv-oauth` source/tests were removed.
- Provider configuration now encodes issuer-discovery vs explicit-endpoint shape and client-secret
  requirements in types.
- `normalizePrincipal` returns the refined custom principal type.
- oauth4webapi custom fetch is typed at the option boundary.
- Crypto open/decode is validator-backed instead of `JSON.parse(...) as TValue`.
- Refresh reuse and refresh failures now throw typed `KvOAuthError` codes.
- Export entrypoints all have `@module` docs and pass `deno doc --lint`.

## Validation

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/auth-kv-oauth --ext ts,tsx --pretty` — PASS.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/auth-kv-oauth --ext ts,tsx --pretty` — PASS.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/auth-kv-oauth --ext ts,tsx --pretty` — PASS.
- `deno test --unstable-kv --allow-all packages/auth-kv-oauth` — PASS, 9/9.
- `deno doc --lint` over `mod.ts`, `./providers`, `./store`, `./crypto`, `./cookies`, `./flow`,
  `./backend`, `./errors` — PASS.
- `rtk proxy deno publish --dry-run --allow-dirty` from `packages/auth-kv-oauth` — PASS, no slow-type
  warnings.
- `rtk proxy deno task deps:latest --filter @panva/oauth4webapi` — PASS, 0 behind / 1 total.

## Caveats

- Direct `plugins/auth` consumer check is blocked by unrelated existing `AuthStreamSchema` /
  `AuthStreamSchemaResult` imports in `plugins/auth/streams/schema.ts`.
- JSR runtime compatibility is configured in JSR package settings, not in source metadata; no
  unsupported source marker was added.
- `deno.lock` is unchanged.

## Next

Commit this slice, append `commits.md`, push using:

```sh
git push origin HEAD:refs/heads/feat/prime-time/auth-s3-kv-oauth
```

Then hand off for IMPL-EVAL; do not self-certify.
