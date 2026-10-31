# Research

Tracker #2412 has closed S1/#2414 and S2/#2415; active S3 PRs #2488/#2538 own component contracts. #2464 is an unassigned, uncommented 0.0.9 follow-up to merged S1, and GitHub search finds no existing PR covering it. This is the next independent ready leaf.

The current graph test walks only routes manually excluding the design group, so it cannot detect removal of Vite's actual ignore setting. It must assert the production ignore boundary and retained dev-only layout import. cleanAppTokens compares the preset filename literally despite TOKEN_PRESET_FILE already owning it. designTheme selects any known preset without checking whether optional static/presets CSS was installed.

Research probe with the pinned Vite 7.2.2 successfully SSR-loads a module with import.meta.glob('/static/presets/*.css', { query: '?url', import: 'default' }). No preview files produces an empty map; installing one stylesheet produces its exact filesystem key. The glob is lazy: no stylesheet is imported or HTTP-probed to establish availability. This avoids filesystem calls and failed HTTP requests in generated app code.

Upstream references: [Vite glob imports](https://vite.dev/guide/features#glob-import), [publicDir](https://vite.dev/config/shared-options.html#publicdir). The repo pins 7.2.2 and the actual probe, rather than latest documentation alone, proves behavior against that pin.

Existing memory consulted: scoped wrappers include --unstable-kv by default; root lint excludes CLI/tooling, so explicit CLI config is needed; draft jobs skip core CI; consumers are embedded, so generator-owned carriers must be refreshed and checked after source commits. No new dependency or published API planned. Archetype 6, existing layering retained.
