# S10 Phase-B fix — `aspire describe --follow` NDJSON shape (same thread, same branch)

You are the S10 implementer (thread `01a052a5-21d9-7d80-b4b1-c267be7e112a`, worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s10`, branch
`test/aspire-13-5-s10-e2e-gate-upgrades` @ `a46ea16d0`). Do not launch evaluators, do not write
`evaluate*.md`, do not start Aspire/Docker on this host, do not dispatch CI.

## Evidence (first real execution of your Phase-B code, off-host CI)

GitHub Actions run 33326591443 (`e2e-cli.yml`, sha `9303daf61` = main + S1 + #1736 + S10 + S3 + S7
+ S9), jobs `scaffold-runtime` and `scaffold-runtime-sqlite`: 36 gates PASSED, then
`runtime.aspire-start` FAILED after ~10–15 s in both tiers with:

```
Uncaught (in promise) Error: describe line 1 omitted resources[]
  at resources (packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/describe-follow.ts:182:37)
  at parseDescribeFollow (…describe-follow.ts:34:28)
  at evaluateDescribeFollow (…describe-follow.ts:45:5)
  at captureDescribeFollow (…)
```

`aspire start --format Json` succeeded; the failure is your parser's shape assumption.

## Root cause (Aspire CLI 13.5.3 source, `src/Aspire.Cli/Commands/DescribeCommand.cs`)

- `aspire describe --format json` (no `--follow`) → `ResourcesOutput { Resources: ResourceJson[] }`
  → one pretty-printed object with top-level `resources[]`.
- `aspire describe --follow --format json` → NDJSON, **one bare `ResourceJson` object per line**
  (`JsonSerializer.Serialize(resourceJson, …Ndjson.ResourceJson)`), camelCase, nulls omitted,
  **no `resources` wrapper**.

`resources()` in `describe-follow.ts:180-184` requires `resources[]` on every line, so line 1 of
every follow stream throws. This is deterministic, not flaky.

## Required change (minimal, contract-first)

1. `resources(value, lineIndex)` must accept both shapes: a line that is a record with an array
   `resources` → that array; a line that is a bare resource record (has any of
   `displayName`/`name`/`resourceName`) → `[value]`. Anything else keeps a precise error naming
   the line. Keep `resource()` name/state/health extraction unchanged unless the real DTO forces
   a rename — if you find the `ResourceJson` property names differ from what `resource()` reads,
   cite the Aspire source line in the commit body.
2. Unit tests for `parseDescribeFollow`/`evaluateDescribeFollow` covering: bare-object NDJSON
   lines (the 13.5.3 follow shape), the wrapped `{resources:[…]}` shape, and the last-seen
   convergence semantics. Put them next to the existing e2e unit tests for this evidence module.
3. Audit `resource-command.ts` and `listener-readiness.ts` for the same wrapper assumption on
   any `--follow` stream and fix identically if present.
4. Validate with the wrappers only (no runtime): `run-deno-check.ts` / `run-deno-lint.ts` /
   `run-deno-fmt.ts --ext ts,tsx` scoped to `packages/cli/e2e`, plus
   `run-deno-test.ts -- --allow-all <test files>`.
5. Commit on the S10 branch (conventional message, cite run 33326591443 and the Aspire source),
   push with the explicit refspec `git push origin HEAD:refs/heads/test/aspire-13-5-s10-e2e-gate-upgrades`,
   and report the new head SHA plus the exact validation commands and their exit codes.
   Do not rebase, do not touch `.github/workflows`, do not touch other slices' files.
