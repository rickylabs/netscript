# Zod dependency boundary

NetScript workspace code resolves `zod` from one npm catalog entry in the root `deno.json`. Member
packages use `"zod": "catalog:"`; they must not pin a local npm range or import the separate JSR Zod
module. Source using oRPC's converter or coercion helpers imports `@orpc/zod/zod4` explicitly.

This aligns the schema-bearing AI/MCP paths on npm Zod 4. In particular, `@anthropic-ai/sdk`,
`@modelcontextprotocol/sdk`, `openai`, and `zod-to-json-schema` resolve through `npm:zod@4.4.3`;
none of their Zod 4 peer requirements resolve to v3.

## Known residual Zod 3 boundary

The 0.0.5 graph intentionally retains one npm Zod 3 instance, owned only by these upstream hard
dependencies:

- `@ag-ui/core@0.0.52` declares `zod: ^3.22.4` and is pulled by `@tanstack/ai@0.39`.
- `jsr:@olli/kvdex@3.6.7` declares `npm:zod@^3.24.0`; 3.6.7 is its latest stable release.

Do not force Zod 4 through either incompatible range. Do not upgrade the TanStack AI cluster to 0.43
while it requires a canary AG-UI build. The full single-instance collapse is tracked by #1320 for
0.0.6 and is unblocked only when AG-UI accepts Zod 4, a stable TanStack line avoids canary AG-UI, or
the project makes a kvdex replacement/fork/removal decision.

The required dependency guard (`deno task deps:check:zod`) verifies all of the following together:

- workspace manifests use the root catalog;
- no workspace manifest, source import, or generated manifest uses JSR Zod;
- the AI/MCP packages above bind to npm Zod 4;
- the only remaining v3 parents are the two exact dependencies documented here;
- all source imports of `@orpc/zod` select `/zod4`.

Any additional Zod instance or v3 parent fails CI instead of silently expanding this boundary.
