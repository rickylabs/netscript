NetScript has an independent Windows report that appears to be the same incomplete
`nodeModulesDir: auto` materialization class, though its capture does not prove concurrency as the
trigger: https://github.com/rickylabs/netscript/issues/1246

Environment and evidence:

- Windows, Deno 2.9.4, `nodeModulesDir: "auto"`
- project-local file missing:
  `node_modules/.deno/@babel+core@7.29.7/node_modules/@babel/core/lib/transformation/file/file.js`
- the same file was present in Deno's shared npm cache
- a bare `deno eval "import('npm:@babel/core@7.29.7')"` reproduced outside Aspire and Vite
- copying the cache file into the local materialization immediately unblocked Babel/Vite, with no
  application source change

This extends the directly observed version set here from 2.9.1/2.9.3 to 2.9.4. NetScript is adding
a fail-closed cache-vs-local preflight and recommending its existing 2.9.0 CI pin as a temporary
pre-window fallback: https://github.com/rickylabs/netscript/pull/1264
