# Drift Log: remove residual slow-type publish carve-outs

## 2026-07-12 — D1 PLAN-EVAL owner waiver

- **What:** Implementation may proceed after the plan is recorded without a separate PLAN-EVAL.
- **Source:** Owner slice brief: “PLAN-EVAL owner-waived (carried drift D1)”.
- **Expected:** Harness normally requires a separate-session PASS.
- **Actual:** Owner explicitly waived that pass for this bounded slice.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `plan.md` and the pre-implementation `## Design` in `worklog.md`.

## 2026-07-12 — D2 slow-type diagnostics already clean

- **What:** The four packages require no new explicit annotations on the required baseline.
- **Source:** Package-local Deno 2.9 publish analysis.
- **Expected:** The brief anticipated slow-type diagnostics followed by source annotations.
- **Actual:** Each `deno publish --dry-run --allow-dirty` exits 0 and reports `Success Dry run complete`.
- **Severity:** significant
- **Action:** accept; narrow implementation to stale task/debt cleanup
- **Evidence:** `packages/{service,plugin-triggers-core,plugin,contracts}` dry-run results.

## 2026-07-12 — D3 no PR surface

- **What:** No draft PR or per-slice PR comment will be created.
- **Source:** Owner slice brief: “Do NOT open PRs.”
- **Expected:** Harness normally uses the draft PR as commit trail.
- **Actual:** The committed worklog/context pack and pushed branch are the available trail.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` owner override.

## 2026-07-12 — D4 workspace publisher carried an unlisted global waiver

- **What:** The root dry-run and real publish helper appended `--allow-slow-types` workspace-wide.
- **Source:** `.llm/tools/release/publish-workspace.ts` `baseArgs` and the first root dry-run output.
- **Expected:** The brief identified exactly four package-task residues and requires the root task
  clean with no allowances.
- **Actual:** Four package tasks were the visible residues, but the shared runner independently
  retained a global waiver.
- **Severity:** significant
- **Action:** fix in the same acceptance slice
- **Evidence:** Remove the argument, then rerun `deno task publish:dry-run` to exit 0 without the
  generic slow-types waiver warning.

## 2026-07-12 — D5 doc-lint baseline differs from the JSR skill census

- **What:** Full-export doc lint is not zero-diagnostic for three of the four packages.
- **Source:** `deno task doc:lint --root <package> --pretty` on the required baseline.
- **Expected:** The JSR skill's dated census says only fresh-ui currently carries doc-lint debt.
- **Actual:** Service is clean; triggers core has 2, plugin 13, and contracts 12 combined
  `private-type-ref` diagnostics on oRPC-bound surfaces. Each wrapper process exits 0, so verdicts
  must be read from structured counts rather than exit status.
- **Severity:** significant
- **Action:** accept/report; do not redesign public surfaces in this bounded slow-types slice
- **Evidence:** Exact package/entrypoint counts in `worklog.md`.
