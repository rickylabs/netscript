## PLAN-EVAL #2478: PASS

There are no correctness or acceptance blockers in the plan. I made no edits, ran no mutations, posted nothing and launched no subagents. Everything I ran was read-only: a runtime probe, check, lint, fmt-check and the repo-wide scan.

**What I checked against the proposed fix**
- **Cause:** I ran `deno task quality:scan:repo` at baseline `7907293`. It reports exactly one finding, `unsafe-cast` at `docs/site/_plugins/markdown-render-fixture.ts:48` (`as unknown as`), and all 7 allowances are within budget. Removing that line clears the repo gate's only finding.
- **Constructor:** `lume/deps/dom.ts`, which wraps deno_dom v0.1.49, exports `Element`. A parsed `article.ns-prose` is `instanceof` that export (`true`). The global `Element` is `undefined` at runtime in Deno. So importing it as `DOMElement`, from the same module as `DOMParser`, is both necessary and correct. Using the global would throw at runtime, and the alias stops it shadowing the browser `Element` type that `articleToMarkdown` needs.
- **Type soundness:** The predicate `(value: unknown): value is Element` contains no cast. The scanner's patterns (`as unknown as`, `as any`, `as never`, `: any`, `@ts-*`, `deno-lint-ignore no-explicit-any`) don't match it. Narrowing `DenoElement | null` through the predicate gives an intersection type that can be assigned to `Element`, so the return type and every caller stay the same. The existing error message ("Could not parse rendered fixture") also covers the null case.
- **Behavior:** The output is unchanged. The fixture path is the same one the root CI bridge (`markdown-render_test.ts`) and `test:source-format` already reach.
- **Negative control:** Breaking the guard, for example by making the predicate return false, makes every `article()` call throw, so the suite goes red. That meets the "breaking the guard makes them go red" requirement. Restoring the guard and rerunning the suite before commit is already in the plan.
- **Scope:** The change stays within `docs/site/**` plus the run records. No packages, plugins, workflows or scaffold output are touched, so skipping `scaffold.runtime` and the JSR, runtime and release gates is correct.

**Pre-existing CI trigger gap (not an implementation defect)**
The `pull_request.paths` filter in `.github/workflows/code-quality.yml` covers `packages/**`, `plugins/**`, `.llm/tools/**` and `deno.json`, but not `docs/site/**`. So:
- The PR "Code quality" check will not run on this PR. That makes the issue's "green on the PR" requirement unprovable within the approved scope.
- Even if the check did run, the PR job only scans changed files. The repo-wide job (`code-quality-repo`) runs only on pushes to main and on the schedule.
- This same gap is how #2469 got onto main without being caught.

The plan handles this correctly: it runs the exact `quality-scan-repo` gate locally through `run-gate.ts` and reports PR-check absence as unproven rather than editing the workflow. Green on main after merge stays with the coordinator. This doesn't block the plan. I'd suggest a separate follow-up issue for the path filter.

**Non-blocking note**
Run check, lint and fmt with `--config docs/site/deno.json`. `docs/site` is not a member of the root workspace, so the `lume/` import is only mapped in the site config. At baseline, `deno check`, `deno lint` and `deno fmt --check` with that config all pass on the fixture.

PASS
