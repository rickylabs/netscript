# Browser setup on this host

Use `npm ci --ignore-scripts` in tools/fresh-ui-browser. Pinned Chromium153 is already
installed but needs shared libraries. The existing project-managed browser-baseline-policy
run supplies them; apply LD_LIBRARY_PATH only to Node browser commands, never to Deno
commands with narrow env permissions. Fixture generators are render-components.ts from
S6a and tools/fresh-ui-browser/render-variant-cases.mjs (with variant-parity.imports.json).
The output fixture arrays and baseline CSS belong in private project run output.
