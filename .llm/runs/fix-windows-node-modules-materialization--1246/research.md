# Research — #1246 Windows `node_modules/.deno` incomplete materialization

## Specification evidence

Issue [rickylabs/netscript#1246](https://github.com/rickylabs/netscript/issues/1246) captures an
independent Windows incident on Deno 2.9.4 with `nodeModulesDir: "auto"`:

- `@babel/core@7.29.7/lib/transformation/file/file.js` was absent under project-local
  `node_modules/.deno` but present in Deno's shared npm cache.
- A bare Deno npm import reproduced the failure outside Aspire and Vite.
- Copying the missing cache file into the local materialization unblocked Babel and Vite without a
  NetScript source change.

This narrows ownership to Deno's npm materialization layer. NetScript selects auto mode and must
mitigate the resulting developer experience, but it does not implement the shared-cache-to-local
hardlink/junction copy.

## Upstream tracker and version window

- [deno/deno#35804](https://github.com/denoland/deno/issues/35804) is open and reports corrupt or
  incomplete Windows `node_modules` materialization in `nodeModulesDir: auto`, including missing npm
  entrypoints and `.deno` tree failures. The initial report is Deno 2.9.1; follow-up reproductions
  cover 2.9.3.
- [deno/deno#16062](https://github.com/denoland/deno/issues/16062) documents that Windows local npm
  materialization uses hardlinks into the shared npm cache and junction/symlink structure, matching
  the two-tree evidence in #1246.
- Official releases place [2.9.0](https://github.com/denoland/deno/releases/tag/v2.9.0) before the
  first upstream report, followed by [2.9.1](https://github.com/denoland/deno/releases/tag/v2.9.1),
  [2.9.2](https://github.com/denoland/deno/releases/tag/v2.9.2),
  [2.9.3](https://github.com/denoland/deno/releases/tag/v2.9.3), and the NetScript incident's
  [2.9.4](https://github.com/denoland/deno/releases/tag/v2.9.4).

Direct evidence exists for 2.9.1, 2.9.3, and 2.9.4. The unresolved operational risk window is
therefore 2.9.1–2.9.4; this does **not** claim a direct 2.9.2 reproduction. NetScript CI already pins
2.9.0, making it the pre-window, repository-proven mitigation baseline. Native Windows validation
of that baseline remains a separate acceptance item.

## Classification

**Verdict: upstream Deno defect; NetScript mitigation responsibility.** The strongest causal proof
is that Deno alone reproduced the missing file while the authoritative shared cache remained intact.
The related upstream concurrency report may not be the only trigger—the #1246 capture did not prove
concurrency—but it is the same failed Windows auto-materialization class and spans the same release
line. We will link the independent 2.9.4 evidence to #35804 rather than file a duplicate.

## Repository findings

- Root generated `deno.json` explicitly sets `nodeModulesDir: "auto"`.
- Generated Fresh app `dev` tasks invoke Vite directly, so corruption currently surfaces as an
  opaque downstream Babel/Vite module error.
- Generated projects have a `.netscript` helper directory only when Aspire is enabled; the verifier
  must be generated for both Aspire and `--no-aspire` projects.
- All current GitHub workflows are Ubuntu-hosted; #1246's native Windows CI criterion cannot be
  claimed by a WSL-only slice.
- Existing CLI architecture debt is unrelated and is not expanded by a bounded named generator.
- `deno.lock` was dirty before the run and is outside scope.

## Sources selected for implementation

- `packages/cli/src/kernel/templates/workspace/deno-json.ts`
- `packages/cli/src/kernel/templates/workspace/generate-readme.ts`
- `packages/cli/src/kernel/application/scaffold/plan-init.ts`
- `packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts`
- `packages/cli/src/kernel/adapters/scaffold/fresh-adapter.ts`
- colocated generator and scaffold tests
