# Plan

## Profile and baseline

- Archetype: 6 — CLI / Tooling; the owned surface is an E2E command builder.
- Overlay: none beyond mandatory harness artifacts; no product docs change is needed.
- Doctrine verdict: `@netscript/cli` remains **Restructure**; this narrow test-harness correction
  introduces no architecture or public surface.
- Relevant debt: none created. AP-4/AP-5/AP-11 are watched by keeping process construction in the
  existing gate adapter with no new abstraction or side effect.

## Locked decisions

1. Replace only the published AI lifecycle `deno x` path with a direct JSR CDN `cli.ts` URL under
   `deno run`, so Deno 2.9.3 applies `--minimum-dependency-age=0` to the actual graph resolver.
2. Do not write a trust-policy exception into generated user projects: the controlled experiment
   proves it is ignored for this Deno 2.9.3 JSR executable re-run and would unnecessarily weaken a
   product artifact.
3. Assert the entire command array, including version-derived URL and flag placement.
4. Record, but do not solve, the real-user Deno 2.9.x window in the PR body.

## Open-decision sweep

- Safe to defer: the shipped CLI mitigation and minimum supported Deno upgrade; beta.11 issue scope.
- Must resolve now: none. The harness transport is fixed by the causal experiment.

## Commit slice

1. **S1 — published AI lifecycle uses one age-aware resolver.** Change
   `plugin-install-gates.ts`, `scaffold-gates_test.ts`, and run artifacts. Prove with the focused
   builder test, scoped check/lint/fmt, changed-file quality scan, and architecture check.

## Risk register

- Direct URL could drift from the selected CLI version: derive it through the existing version
  parser and assert beta.9 in the unit test.
- URL execution could differ from the JSR executable mapping: beta.10 local reproduction proves
  the published `cli.ts` entry executes the same command successfully.
- The change could conceal a user-facing bug: make the 24-hour impact explicit in the PR body and
  keep product mitigation deferred.

## Deferred scope

- Shipped CLI/plugin dispatch and generated MCP configs.
- Deno upstream upgrade or backport.
- Product-generated `minimumDependencyAge` policy.
