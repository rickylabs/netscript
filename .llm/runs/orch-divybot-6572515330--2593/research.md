# Research

Baseline `6766130bbafbe78a9bb5870f704987cb0743c5e6`; comparison `f4aa307b5340bd3de8029c11778a38bbca451ba1` fetched by full SHA. Issue #2593 and all comments read; no existing matching PR or orchid-triage duplicate.

MCP `find_guidance` then `search_docs` consulted for published Fresh scaffold/client boundaries. Guidance points to generated-web-surface ownership; source and published graph are authoritative for this defect. Read prior browser-scaffold, environment, and Fresh validation memory.

The plain no-database published canary scaffold Vite build passes. Production fixture additionally installs the AI plugin and AI UI collection before its build. The new scaffold capability module uses import.meta.glob to load app-owned AI runtime files. Investigating their path into Vite before choosing the smallest owner fix. No evidence yet that render-ui's type-only AI import is responsible.

JSR surface scan: avoid new public exports and slow-type risks; preserve explicit named exports, version pins, publish inclusion and existing lock. Use a pre-publish graph check with a negative control. Full e2e-cli CI and next-canary production pair remain separate proof.

## Diagnosis verified against canary delta

The new `packages/cli/src/kernel/assets/app/lib/scaffold-plugin-capabilities.ts.template` globs app-owned `ai/ai.ts`; its Anthropic registration imports the published provider adapter with inline `npm:@tanstack/ai@0.68.0`. Previous canary1 has no such capability loader. The CI failure happens in SSR after the client build succeeds. The UI renderer's AI references are type-only, so Fresh UI is untouched.

The auth glob in `scaffold-service-context.ts.template` loads the generated BFF, whose runtime imports are cookie helpers, focused SDK discovery/client, auth contracts and bearer contribution. It does not import AI adapters or authentication provider implementations. Existing request-context tests exercise that boundary; no speculative auth refactor is included.

The GitHub compare API confirms the intervening scaffold redesign landed as `20ba1729ba7b809d90fd4570a82893e5838da807` (#2586), followed by `6766130bbafbe78a9bb5870f704987cb0743c5e6` (#2589). The target template is absent at the canary1 SHA and present at canary2 with the two glob edges. This verifies the source delta independently of the issue's unverified leads.
