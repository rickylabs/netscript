# H01 plan — instrumentation bound and frozen fixture resolution

Issue #2438, feature tier; baseline main `30c800958dbf512a4951d640f08748703a8b59e3`.
Archetype 2 dependency integration, with archetype 3/5 saga and plugin test consumers. No scaffold generator or runtime wiring changes.

## Final decisions

- Keep API 1.9.1 and the existing OpenTelemetry SDK stack. Declare instrumentation 0.223.0 in the root catalog and telemetry package dependency map; explicitly import it in the oRPC tracing module so the published graph retains the bounded peer. The already-approved API 1.10 alternative was rejected after native resolution exposed existing SDK peers requiring <1.10 and two API versions. No SDK/oRPC upgrades.
- Freeze both Prisma generation and test/check execution. The shared test policy uses recorded root/Fresh UI dependency graphs, plus a dedicated published normalizer reference when required. Native Deno adapts consumer metadata and peer IDs; temporary npm overrides and exact JSR mappings keep recorded versions. Every resulting npm/JSR version and integrity and every remote hash must be recorded before frozen execution can begin.
- Retain first-party file URL mappings. Replace stale provider adapter 7.8 literals with the existing workspace adapter mapping (7.10, matching generated clients).
- Declare the already-used exact Prisma CLI 7.10.0 as a database test devDependency. Root/Fresh UI lock changes freeze that previously unlocked CLI graph and keep workspace metadata synchronized. Retained package-version integrity hashes are unchanged. Native resolution moves driver-adapter-utils from debug 7.8 to debug 7.10, prunes debug 7.8, and changes client/better-auth peer contexts now that the Prisma CLI and its React peers are present. The complete native CLI closure and script metadata are disclosed in lock-delta.json.
- Keep all fixture configs inventoried. Database/saga, two streams probes, normalizer, and the crash-replay child use frozen resolution. Existing Flow-B/desktop frozen probes remain unchanged. Synthetic parser/CLI configs and npm tarball consumer installs retain their intended contracts.

## Slices and gates

1. Bootstrap plan and draft PR (done).
2. Dependency bound, shared fixture policy, provider source alignment, resolving fixture adoption, normalizer reference, and run evidence. Prove with the structured check/test/lint/fmt wrappers, full native command-postgres script, telemetry tests, clean consumer positive/negative controls, publish:dry-run, architecture/dependency checks and JSR audit. Full quality/doc-lint failures must be compared with baseline, never called green.
3. Independent review, commit/push, exact pushed-head final review and coordinator handoff. No label/milestone changes; keep draft. Final report via excluded Orchid file handoff. No merge/tag/release.

## Risks and scope

Consumer peers and JSR ranges can drift even without direct manifest changes; allow only committed package versions/hashes, then execute frozen. Existing test-generated metadata differs from root workspace metadata; delegate normalization to Deno. Type graphs reach Fresh UI and require its existing maintained lock. The generated normalizer intentionally exercises published packages and dotenv 16, so it has an explicit fixture authority and refresh recipe.

Acceptance on main is post-merge and cannot be proven by a draft leaf. CI state and global baseline failures are reported truthfully. Local scaffold.runtime is intentionally not run, per owner direction for this test/dependency-only change. No new architecture debt accepted. No unresolved implementation decision remains.

## Evaluation provenance

Round 1 FAIL_PLAN and round 2 PASS are preserved verbatim in plan-eval-round-1.md and plan-eval.md. The successful round-2 plan initially chose API 1.10; subsequent dependency evidence selected the brief's other authorized option. All material implementation differences are appended to drift.md and require independent implementation review.
