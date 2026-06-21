# Drift — S1 Auth Contract Seam

No scope drift.

Notes:
- `deno doc --lint` required standalone subpath re-exports for public types referenced by `ports`, `contracts/v1`, `streams`, and `testing`; these are JSR surface fixes within §5 scope.
- `deno publish --dry-run` produced a `deno.lock` package-import hunk for `@orpc/server`; the hunk was removed per slice lock-hygiene requirements. Source changes keep `packages/plugin-auth-core/deno.json` updated for package-local publishability.
