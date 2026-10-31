# Catalog-backed test dependencies

Deno 2.9.7 rejects direct source imports like npm:vite@catalog:. Use a package-local package.json devDependencies entry with vite:catalog: and a bare vite test import. A root deno.json alias leaks into isolated reference fixture resolution and fails when its catalog lacks vite; do not use that experimental approach.

The existing root catalog owns the Vite pin. Native deno install --lockfile-only --frozen=false records CLI packageJson metadata, and Fresh UI lock:update mirrors it. All npm/JSR resolution and integrity maps remain unchanged. Published CLI files exclude the test and its development package.json.
