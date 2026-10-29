# Docs content pass: integration tracker

| Lane | Branch | Head | Status | Notes |
|---|---|---|---|---|
| tutorials-b | docs/content-pass-tutorials-b | 80b5653f1 | done | Uses comp callout (keeps docs.spec.ts titles). Out-of-lane: packages/fresh/src/runtime/ai/README.md:183 claims createNetScriptMcpSandbox is exported (contradicts test) → follow-up issue; `.llm/tools/docs/fixtures/legacy-carrier-parity/digests.json` needs regeneration at integration. |
| start | docs/content-pass-start | 72ea34ce7 | done | −900 lines. Uses alerts in .md and comp callout in .vto. Needs the tree registration from the renderer. Possibly stale (verify at integration or file a follow-up): hard-coded :18888 dashboard port in 5+ pages vs runtime ports; :8094 in observability.md and plugin-system.md:229; triggers "raw Hono" vs oRPC contradiction (aspire.md, durability-model.md:218); quickstart step 3 aspire describe path after cd aspire; --host opencode missing in quickstart; glossary registry row (plugin list vs generate plugins); observability.md ctx.logger not on job context. Duplications for IA: db-needs-Aspire warning on 6 pages; explanation/index vs concepts.vto; compared.md vs comparisons/frontend.md. MCP fixture guidance-evaluation.json expects a plugin-system hit (terms kept). |
| build-a | docs/content-pass-build-a | ec68bf14b | done | −1,230 lines over 33 files; 26 card grids → 2. Embedded-docs search tests pass only after carrier regen. Open dups for IA: examples.md OrdersPanel ≈ interactive.md WidgetPanel (both snippet-gated); cache helpers query+examples; useLiveQuery defer+query; @netscript/fresh subpath map in server/fresh-ui/index; defineService vs createService. Possibly stale: sdk.md 'Migrating to 0.0.7' (removal candidate); testing.md layerData option missing; server-validated-form how-to (definePage import, ContactForm props, schema failure mode); interactive.md root exports vs DataGrid; query-bridge getIslandQueryClient note vs JSDoc; server.md FreshAppTelemetryOptions 'Reserved'; undocumented createStreamingResponse/renderToStream/StreamErrorBoundary. |
| build-c | docs/content-pass-build-c | 32196cd89 | done | 34 pages, +2730/−4537; 65 alerts, 1 protected comp callout (MCP guidance fixture ranks use-a-second-database text exactly). Removed wrong claims (0.0.7 unavailable, no auth telemetry, tool counts). Possibly stale: auth WorkOS 'stateless' vs KV tombstones; two callback URLs; model id mismatch; workers jobs dir path. Code guard script: (local guard script, not kept). |
| build-b | docs/content-pass-build-b | 407142836 | done | 5,387→4,285 lines; uses comp callout. Tree fences in a separate commit, ad5b051e9. Removed retired ports :8093/:8094/4437, the trigger-defer-throws and Docker 'schema only' claims, and old issue numbers. Possibly stale: author-a-plugin provider.kind table (bin/combined.ts, ingress category, port 8095); deploy.md bin/combined.ts; runtime-config next → /capabilities/ redirect stubs (links in add-a-plugin, deploy, publish-a-durable-stream); streams DurableStreamProducerOptions table; publish-a-durable-stream primary-key behaviour; sagas .onSignal 'deferred'. child-health.md is generated: fix the process wording in generate-child-health-docs.ts (follow-up). |
| tutorials-a | docs/content-pass-tutorials-a | 4b3c98ab9 | done | 23 pages; comp callout; fixed false saga claims in storefront/04 and /05 and live-dashboard/05 and /06; stray </content></invoke> removed from 7 pages. Possibly stale (tutorial correctness, needs code check): workspace auth route count 5 vs 6; workspace/04 jobs path and contributor install command; workspace/06 curl path; CLI install flag forms differ across tracks; storefront /api/rpc/_ vs *; /v1 projection contradiction; storefront/06 .items vs {data,pagination} and apps/storefront vs apps/dashboard; live-dashboard install forms. Dups for IA: three chapter-1 setups and three deploy chapters could point to shared how-tos. |

## Integration checklist
- [x] PR #2469 (`docs/file-tree-component`, merged head a4c8bc3) merged first: alerts and tree renderer, plus 8 tree conversions. Sent to Cockpit. Lanes then integrate on main.
- [x] Merge the lane branches; resolve tree-fence or info-string conflicts.
- [x] Apply the IA plan (`docs-ia-plan.md`).
- [ ] Regenerate the carriers once and the legacy-carrier-parity digests; run every `check:*`.
- [ ] Docs build, check:links, docs:links, docs:snippets, docs:readme-fences, docs.spec (via CI).
- [ ] One PR for Cockpit review.

## Site-wide accuracy fixes at integration (cross-lane)
- [x] **Fixed ports.** The dashboard `https://localhost:18888` and OTLP `http://localhost:4318` appear in ~49 files, but `generate-aspire-config.ts` binds both to port 0 (ephemeral). Replace them with "the URL Aspire prints" (verify in code first). Same for `:8093` triggers, `:8094` auth and `8091` workers.
- [x] Dashboard "login token printed" vs `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS=true`: verify, then state one truth.
- [ ] Remaining mentions of `createNetScriptMcpSandbox` (tutorials/chat/05-mcp.md:172 if still present; `packages/fresh/src/runtime/ai/README.md:183` is package-side, so file an issue).
- [x] Triggers "raw Hono" vs oRPC contract: verify, then unify.
- [x] **callout-types_test.ts** requires >100 `comp callout` uses site-wide. Lanes that converted to GitHub alerts lower that count, so at integration either count alerts too (preferred, now that #2469 renders them as the same component) or keep enough comp callouts. Run that test.
- [x] Links to the `/capabilities/*` redirect stubs (runtime-config `next`, add-a-plugin, deploy, publish-a-durable-stream) should point to their real targets.
- [ ] Follow-up issue: `generate-child-health-docs.ts` emits process wording and a 0.0.8 migration section into the public child-health page.
- [x] **Tutorial correctness pass** (verify against the scaffold before publishing): the tutorials-a items above. These are real bugs a reader hits, so verify by running the commands where feasible.
- [x] One canonical CLI install command and `--help` group list across quickstart and every tutorial chapter 1.

## Finish evidence (2026-10-29)

Renderer #2469 merged as 26a0bb7 after independent MERGE and green CI. Main integration is a merge commit (5f3f9d1). The finish run is `.llm/runs/docs-content-pass--docs-finish/`.

The current catalog scaffold already has typed notFound, repository/application handlers and data/page pagination. Corrected the tutorial accordingly, and kept the custom dashboard's items/offset contract distinct. Corrected the auth route count to six, moved job authoring to workers/jobs, used the public plugin install command, matched the default dashboard app path, corrected the RPC prefix, and replaced ordinary service curl calls with discovery plus typed clients. Current CLI help supplies one canonical group list including tokens and ui:init.

Focused tests and site verify pass. Prose generation preserves both upstream non-site context entries. The remaining generated carriers, broad checks and independent content evaluation are still pending. The frozen legacy parity fixture is intentionally unchanged.
