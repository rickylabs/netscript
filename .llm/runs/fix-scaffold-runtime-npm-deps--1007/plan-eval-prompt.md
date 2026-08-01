# PLAN-EVAL request

You are the separate formal evaluator for NetScript harness run
`fix-scaffold-runtime-npm-deps--1007`. Do not call tools: all material evidence is embedded below.

The task is issue #1007: generated Fresh apps omit runtime npm dependencies, and the published
canary.5 production E2E artifact shows Vite SSR failing to find
`npm:@tanstack/preact-query@^5.101.0`. Evaluate the plan for correctness, minimality, testability,
doctrine alignment, lock hygiene, and whether its evidence can distinguish a cold published app
from a warm monorepo/cache false pass.

Do not modify files. Return exactly one verdict, `PASS` or `FAIL`, followed by concise findings. A
FAIL must identify blocking plan changes; non-blocking suggestions must not turn a sound plan into
a failure.

## Evidence and proposed plan

- Production Actions run 30677734061 passed 55 steps and failed only `behavior.app-home`. Its
  uploaded report records Vite 7.2.2 `fetchModule` failing to find
  `npm:@tanstack/preact-query@^5.101.0` imported from the published
  `@netscript/fresh/query/query-island.tsx`.
- The generated dashboard imports currently include Fresh, Preact, signals, Fresh/Vite,
  Tailwind/Vite, Tailwind, and Vite, but omit the TanStack runtime imports.
- `packages/fresh/tests/package-manifest_test.ts` already defines the runtime subset as
  `@preact/signals`, `@tanstack/preact-query`, `@tanstack/query-core`, `@tanstack/react-db`, and
  `vite`, asserting each is an npm import in the published Fresh manifest.
- Root `deno.json` catalog values are respectively `2.9.2`, `^5.101.0`, `^5.101.0`, `^0.1.86`,
  and `7.2.2`. The Fresh manifest contains matching npm imports.
- A local published-canary service scaffold first failed because DB-generated Zod files were
  absent; after DB init/generate/seed its warm generated node_modules already contained TanStack,
  masking the production cold-install defect. This drift is explicitly recorded.
- Proposed source change: add constants and emitted npm imports for the four missing runtime
  packages (signals and Vite already exist), using exact root-catalog ranges.
- Proposed regression contract: in the CLI test suite, load root catalog and Fresh manifest;
  iterate the existing runtime subset and assert exact consistency with scaffold catalog/imports.
  Also retain generated-dashboard config assertions.
- Proposed gates: focused tests; scoped check/lint/fmt wrappers rooted at `packages/cli`;
  `quality:gate`; CLI JSR doc/publish audit; a pristine external generated service app restored
  and started with Aspire whose home returns 200 non-empty HTML; and the one-pass
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Non-scope: no upgrades, exports, runtime implementation, canary publication, merge, or full
  Fresh import-map copy.
- Lock hygiene: retain the pre-existing `deno.lock` additions from the already-landed Fresh/SDK
  manifest declarations only if validation confirms them; do not allow unrelated churn.
