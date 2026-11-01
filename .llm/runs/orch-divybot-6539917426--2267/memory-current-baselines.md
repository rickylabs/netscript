# Baseline currency

At main `3d83caf1ca50695a0064529113ea00eab52426dd`, `deno task quality:gate`
passes (including dependency alignment and architecture checks). Older run notes
about a failing docs markdown fixture are stale for this baseline. Full-export
`deno task doc:lint --root packages/kv` also passes: four entrypoints, zero
diagnostics. Never carry old red-gate claims into a new run without rechecking.
