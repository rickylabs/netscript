# Drift

## D-1 — generated-project policy candidate rejected

The initial candidate assumed the generated root `minimumDependencyAge` policy could govern the
inner resolution. Deno 2.9.3 reproduction showed the `deno x` JSR re-run ignores both discovered
and explicit config. The plan therefore uses a direct `deno run` URL so the explicit flag governs
the single resolver. No doctrine drift results.
