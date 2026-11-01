# Reuse these recipes

Deno 2.9.7 is installed; RTK is absent in this worker. Existing #2451 and S7 memory notes gave the native docs build and full browser matrix. Run `deno task --cwd docs/site build`; the strict checker runs it twice. The docs site is a separate Deno workspace; `deps:latest` is a root task whose discovery excludes docs/site. For a transitive Lume pin, invoke the existing latest.ts wrapper against a tiny external probe deno.json containing that exact transitive specifier. Keep its manifest/output outside Git.

Use `deno info --no-lock` for remote module inspection from the root: without it, inspecting Lume's graph adds unrelated root-lock entries. Inspected and restored that command's own additive root-lock delta before any commit. Do not delete locks/caches.
