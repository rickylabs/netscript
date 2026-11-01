# Tools dependency resolution

Deno 2.9.7 rejects a direct source import `npm:zod@catalog:` with Invalid package specifier. This tools directory is not a workspace member and root deno.json has no imports map. Existing tools/figma-plugin uses npm:zod@^4.6.5, exactly the current root catalog range; use that established range without changing versions, workspace, dependencies or locks. Catalog-based import-map cleanup stays with its owning workstream. Native frozen wrappers prove resolution.
