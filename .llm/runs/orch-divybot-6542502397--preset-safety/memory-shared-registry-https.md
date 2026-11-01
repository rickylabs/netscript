# Shared registry HTTPS rule

`domain/ui/ui-config.ts` owns `uiRegistryUrl`, used for direct items, configured registries, files, and transitive dependencies. Putting the HTTP restriction only in preset resolution misses `ui:add` and dependency fetches. Share links remove their local query/hash only for shared URL-policy validation, then decode the original link without fetching. Credentials remain rejected before diagnostics can echo a URL.
