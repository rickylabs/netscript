# Deno fixture rendering alongside npm node_modules

After npm ci creates tools/fresh-ui-browser/node_modules, run render-variant-cases.mjs
with `--config deno.json --node-modules-dir=none --frozen --import-map
tools/fresh-ui-browser/variant-parity.imports.json` from the repository root. Otherwise
Deno picks the browser package.json and expects Preact SSR in that seven-package npm
installation. The explicit config/global-cache mode renders all188 variants without
changing any manifest or lock. S6a render-components.ts adds77 real contract fixtures.
