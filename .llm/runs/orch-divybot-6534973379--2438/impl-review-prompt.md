## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools, netscript-deno-toolchain and jsr-audit rubric. Do not read or follow profiles/ files.

## Independent implementation / slice review

Read-only, blockers only. Do not edit, commit, push or post messages. This is implementation round 1 in the same independent Claude evaluator session; final exact pushed-head review will follow after the sign-off commit. Review the complete uncommitted diff against HEAD, including new .llm/tools/testing/locked-fixture.ts and its tests, normalizer fixture config/lock/README/probe, root/Fresh UI locks and telemetry dependency/import change. Read .llm/runs/orch-divybot-6534973379--2438/{plan,worklog,drift,gate-summary,fixture-inventory}. Do not confuse historical rejected API plan with final bounded-instrumentation choice.

Owner authorized either API 1.10 or instrumentation <0.300. Native SDK peer evidence required switching to the latter. Existing SDK/API remains coherent; public oRPC module explicitly imports the catalog-bound instrumentation so publication retains the pin. Prisma 7.10 CLI was already invoked in tests and is now a declared frozen test dependency. Root/Fresh UI existing package versions/integrities are unchanged; CLI dependency closure is added. Existing stale adapter7.8 fixture literals now use the existing workspace7.10 mapping. No scaffold generator output or production runtime wiring changed.

Verify safety/correctness of native adaptation and recorded-version/hash validation, multiple-version npm overrides and exact JSR mappings, generated-client source rewrites and nested saga --frozen child. Local command-postgres passes all 5 outer tests, fixture suite14, telemetry66, check308, lint/fmt12, arch/deps gate, framework quality and full workspace publish dry-run. Full quality has unchanged main docs unsafe cast; doc lint has exactly the same7 findings on archived clean main. See gate-summary.json. Those known baseline failures remain unclaimed. Main acceptance cannot be proven until coordinator merge; owner explicitly requires keep draft and report unchecked facts.

Return PASS for slice sign-off or actionable blocking findings only. Do not self-implement. No need for a final exact-head verdict line yet; that is next after commit/push.
