# Native serialization diagnosis

Lume 2.5.4 `deps/pagefind.ts` imports npm:pagefind@1.3.0, and its plugin adds HTML sequentially through the Node API. Pagefind #1124 (merged 2026-08-15) fixes the remaining randomized filter-name/value serialization and entry language map ordering using sorted vectors/BTreeMap. The 1.5.2 trial predates this fix. Newly released 1.6.0 includes #1124; the repo deps/latest.ts wrapper reports 1.6.0 as stable.

Pagefind #1395 is distinct: native page IDs depend on ingestion order. The API caller can provide stable URL order before indexing; this is not binary postprocessing. Qualify #1124 against real docs and preserve all browser behavior before removing the CI allowance.

The new release is younger than Deno's 24-hour dependency age policy. Use only an explicit version and a one-command minimum-age bypass for qualification/lock generation; do not weaken global config. Committed/frozen resolution must subsequently work without the bypass.

Native `deno install --lockfile-only` adds the new graph but retains obsolete lock entries. After proving remapped graph uses only1.6.0, prune only the seven obsolete1.3.0 specifier/npm records and run native install again; compare common package nodes and integrity hashes (unchanged). Do not delete or recreate the lock. Deno fmt ignores .lock paths; preserve existing compact os/cpu array formatting on surgical edits.

Post-change deps:latest reads actual site import map and confirms1.6.0 stable. deps:why's native child returns no graph for the npm package here, despite source usage and successful runtime indexing; do not interpret that incomplete wrapper output as a dead import. The native generated entry explicitly reports1.6.0 and the reviewed site lock contains no1.3.0 nodes.

Baseline non-search comparison:804 outputs byte-identical; catalog.json differs only in the existing inputHash over docs/site/deno.json. Reconstructing the previous config fingerprint exactly reproduces baseline catalog SHA-256. Final same-source strict proof still compares every byte with no special cases.

A new empty DENO_DIR + copied exact site manifest/lock + `deno ci` succeeds without age bypass and leaves copied lock byte-identical. Deno2.9.7 ci does not accept a redundant --frozen flag; ci is inherently frozen. This validates fresh-runner consumption of the qualified newly released pin.
