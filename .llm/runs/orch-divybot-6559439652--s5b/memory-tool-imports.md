# Tools dependency resolution

Deno 2.9.7 rejects a direct source import `npm:zod@catalog:` with Invalid package specifier. This tools directory is not a workspace member and root deno.json has no imports map. Existing tools/figma-plugin uses npm:zod@^4.6.5, exactly the current root catalog range; use that established range without changing versions, workspace, dependencies or locks. Catalog-based import-map cleanup stays with its owning workstream. Native frozen wrappers prove resolution.

# Native component-plugin build

- The public registry validator imports compressed carrier modules with top-level await/Blob/Response/DecompressionStream. A native IIFE cannot consume those directly. build.ts evaluates the existing carrier in Deno and redirects only that carrier URL to synchronous generated JSON exports with an import map. Canonical schemas/contracts are unchanged.
- The native sandbox need not provide crypto/TextEncoder/AbortController. NativeContext accepts the minimal cancellation shape and a digest port. plugin/main routes SHA-256 to the iframe via bounded RPC; the browser uses native WebCrypto. No second hash implementation or dependencies.
- Embed bundled scripts into HTML with a replacement callback, never a replacement string: JavaScript dollar-replacement sequences can reinsert the placeholder or other document text. The bundle test verifies placeholder removal and runs the native entry in a VM without browser globals. This remains compatibility proof only, not editor evidence.
- Node VM arrays/objects have different prototypes; compare serialized transport values across that boundary, not same-realm object prototypes.

# CI manifest freshness

Adding a dated .llm/YYYY lesson that mentions Aspire adds a tracked manifest path even though .llm/runs and .llm/tmp are excluded. Check check:aspire-version-parity after such additions; use the canonical aspire-surface-manifest.ts generator. The manifest stores path/class/owner/disposition, not content hashes. Do not change pins or exclusions to green a freshness failure.
