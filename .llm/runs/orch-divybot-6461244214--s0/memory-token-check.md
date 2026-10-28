# Token pipeline memory

On current main, `deno task --cwd packages/fresh-ui tokens:build` exits 1: path-scurry 2.0.2 imports named LRUCache but the private lock gives it lru-cache 6.0.0. The initial older dispatcher checkout had a different, working lock, so always establish current main before relying on reproduction. The builder is `packages/fresh-ui/scripts/build-tokens.ts`, imports Style Dictionary directly, and generates three files under registry/theme. Current tokens:check rebuilds then git-diffs; this can overwrite hand edits before noticing them.
