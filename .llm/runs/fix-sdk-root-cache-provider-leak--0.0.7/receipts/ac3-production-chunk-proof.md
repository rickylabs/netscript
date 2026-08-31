# AC3 receipt — production client bundle / chunk inspection

**Exact head:** `65f95b83` (converged onto `origin/main` `3e5cbabf`)
**Acceptance box:** *"Production client chunks contain no server KV adapter."*
**Verdict: SATISFIED — by a real production build, not by module-graph inference.**

## How the build was obtained

Earlier attempts to bundle the SDK root from a standalone Vite fixture failed in four placements —
`.llm/tmp/`, `packages/fresh/tests/fixtures/`, `packages/sdk/tests/`, with and without an alias —
because the SDK is not a workspace member and its npm specifiers are Deno-import-map-only, so
Rollup could not resolve `@orpc/openapi`. That blocker was reported rather than worked around.

The vehicle that does work is a **local-source scaffolded project**:

```
deno run -A packages/cli/bin/netscript-dev.ts init ac3proof --path <tmp> --db none --ci --yes --no-git --force
→ Created 169 files; "Copied 28 local packages"; monorepo root = this leaf
```

The copied SDK is **this leaf's** SDK, confirmed by its export map containing `./presets`, and the
generated app maps `@netscript/sdk` → `../../packages/sdk/mod.ts` — the local root, i.e. the shipped
root-import path.

Because the generated app imports only `/auto-update` and `/desktop` by default, the SDK **root** was
imported from a real client island (`islands/ui/ThemeToggle.tsx`) so the root path is exercised in
client output. The island chunk grew to 41,788 bytes, confirming the root entered the client graph.

```
deno task build → exit 0 · 665 modules transformed · ✓ built
client chunks emitted: 15
inspected chunk: _fresh/client/fresh-island__ThemeToggle.mjs
  sha256 2c0510ddfb1a13891707a282e29bf2ba993ece8b3b3d7c53fb2292d5c10bf9d9 · 41788 bytes
```

## Chunk scan — emitted client output

| Symbol / specifier | Present in client chunks? |
| --- | --- |
| `KvCacheStore` | **no** |
| `kv-cache-store` | **no** |
| `@netscript/kv` | **no** |
| `packages/kv` | **no** |
| `openKv` / `DENO_KV` | **no** |
| `hasCacheProvider` | **no** |
| `setCacheProvider`, `cacheQuery` | present **only inside a string literal** — see below |

Source maps were scanned too: `kv-cache-store`, `packages/kv`, `cache-query` appear in **0** map files.

### The one nuance, checked rather than glossed

`setCacheProvider` and `cacheQuery` do appear in the island chunk, but **only inside an error-message
template**:

> `[NetScript SDK] Cache provider not initialized in module ${import.meta.url}. Call
> \`setCacheProvider(cacheQuery)\` during server bootstrap. \`defineFreshApp()\` does this for
> NetScript-managed…`

That is guidance text, not an invocation. To distinguish identifier presence from an executed side
effect, every client chunk was re-scanned with template literals and quoted strings stripped, then
searched for `setCacheProvider(`:

```
executable registration calls found in client output: 0
```

So the server cache provider is **never registered** in client code, and no server KV adapter reaches
the bundle.

## Honest scope of this receipt

This is a **positive measurement at head**. Its red-before counterpart is the module-graph measurement
at base, where the SDK root reached **19** browser-unsafe edges including the `packages/kv` adapters,
two `node:` edges and five logger modules — versus **0** at this head. The chunk build was not
re-run against base, so this receipt does not itself constitute a red-before; that is stated rather
than implied.

The probe project was created under `.llm/tmp/` (gitignored) and removed after measurement.
