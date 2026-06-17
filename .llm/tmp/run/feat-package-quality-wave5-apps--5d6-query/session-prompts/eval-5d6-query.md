use harness, you are the separate IMPL-EVAL evaluator for NetScript Wave 5d6 query/server/final package surface.

Run only from this native WSL ext4 worktree:
/home/codex/repos/netscript-wave5-apps-5d6-query

Branch:
feat/package-quality-wave5-apps-5d6-query

PR:
https://github.com/rickylabs/netscript/pull/39

Critical protocol:
- You are the evaluator, not the implementation agent.
- Keep evaluation separate from implementation. Do not self-certify from the worklog alone.
- Read AGENTS.md, harness evaluator protocol, the approved 5d6 plan/design/research, worklog, drift, commits, and context-pack.
- Do not run full CLI E2E here. Reserve `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` for supervisor merge-readiness/full CLI E2E.
- Do not delete lock files or caches. Do not run `deno cache --reload`.
- If source changes are required, stop with FAIL_FIX and record exact fixes. Do not implement fixes in the evaluator session.
- Commit and push evaluator artifacts before returning. Comment PR #39 with a structured IMPL-EVAL summary.

Required checks:
- Verify working tree starts clean and branch is current with origin.
- Inspect implementation commit range enough to verify scope: query wrappers/types, query hydration components, server `defineFreshApp` seams, root wrapper inclusion, withForm error logging, and final artifacts.
- Verify no lockfile churn is present.
- Run these gates from `/home/codex/repos/netscript-wave5-apps-5d6-query`:
  - `(cd packages/fresh && deno task doc-lint)`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx`
  - `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx`
  - `deno test --allow-all --config packages/fresh/deno.json --unstable-kv packages/fresh`
  - `(cd packages/fresh && deno task dry-run)`
  - `deno task check`
  - `deno task fmt:check`
  - `deno task lint`
- Verify public surface doctrine: no raw upstream query hook re-exports, no public private-type refs in query/server/root, root task wrappers include `packages/fresh`, and public entrypoints remain curated.
- Review residual drift. `telemetry` reserved seam and full CLI E2E deferral are acceptable only if documented and non-blocking.

Artifacts to write:
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/evaluate.md` with verdict PASS, FAIL_FIX, FAIL_RESCOPE, or FAIL_DEBT.
- Append an evaluator entry to `.llm/tmp/run/feat-package-quality-wave5-apps--5d6-query/worklog.md`.

Commit and push:
- `git add` evaluator artifacts.
- `git commit -m "eval(5d6): record query verdict"`
- `git push origin feat/package-quality-wave5-apps-5d6-query`
- Comment PR #39 with verdict, commit, gates, residual risks, and note that full CLI E2E was skipped by protocol.
