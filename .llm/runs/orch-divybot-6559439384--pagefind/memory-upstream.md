# Native serialization diagnosis

Lume 2.5.4 `deps/pagefind.ts` imports npm:pagefind@1.3.0, and its plugin adds HTML sequentially through the Node API. Pagefind #1124 (merged 2026-08-15) fixes the remaining randomized filter-name/value serialization and entry language map ordering using sorted vectors/BTreeMap. The 1.5.2 trial predates this fix. Newly released 1.6.0 includes #1124; the repo deps/latest.ts wrapper reports 1.6.0 as stable.

Pagefind #1395 is distinct: native page IDs depend on ingestion order. The API caller can provide stable URL order before indexing; this is not binary postprocessing. Qualify #1124 against real docs and preserve all browser behavior before removing the CI allowance.

The new release is younger than Deno's 24-hour dependency age policy. Use only an explicit version and a one-command minimum-age bypass for qualification/lock generation; do not weaken global config. Committed/frozen resolution must subsequently work without the bypass.
