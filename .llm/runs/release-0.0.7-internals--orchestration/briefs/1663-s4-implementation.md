# Brief — #1663 slice S4 (integrated gates, publish, docs, JSR — final slice)

You are the preserved Codex author, thread `01a004ec-86a6-7c21-8886-81c09de099f5`. Resume your own
thread.

## S3 is signed off

Tier-A **PASSED** S3 at `fd508978c743b864e5d07f510d971178b376ccbc`. I reproduced the decisive delta:
widening `closeScoreGap` `0.5 → 5` now exits 1 where it was **silently undetected** at baseline, and
narrowing to `0.4` — tighter than my own `0.01` probe — also exits 1, so the value is pinned at
precisely `0.5`. `guidance-index.ts` restored byte-exact after both mutations. The dyadic score
choice and the alphabetically-early `pages/00-outside` slug are what make both directions
observable; that design is sound. MCP tests 136/0, `quality:scan` `allowCount` still 7.

All three implementation slices are landed and signed off. **S4 is the final slice.**

## S4 scope — evidence only

**No new product or config files.** S4 changes run artifacts and evidence only. If S4 uncovers a
defect that needs a product edit, **stop and report** rather than fixing it inside S4 — that is a
new slice decision, and a fourteenth path would be rescope.

## Gates to run, commit-bound at the integrated head

Fire durable evidence through `.llm/tools/gates/run-gate.ts` with unique IDs and the actual branch
head. A receipt proves only its command. Compare `deno.lock` and `git status` against ground truth
before and after every gate.

1. **check** — root/task structured check plus the scoped doctor-directory check. Passing condition
   includes the cycle-3 guard: all five `Check` lines, or the scoped wrapper reporting exactly
   `filesSelected:5, failedBatches:0`. **A warning-only or omitted file is failure, not green.**
2. **test** — structured targeted tests, MCP package tests, then the exact
   `deno task --cwd packages/cli test`. No ignore or skip added.
3. **quality-job** — `deno task ci:quality` plus `deno task quality:gate`. Root `fmt:check` must
   select the four healthy TS files and no task-level parent-family exclusion may remain.
   `quality:scan` `allowCount` must still be **7**.
4. **generated-asset freshness** — `deno task gen:assets-barrel` then `deno task check:assets-barrel`.
   The generated delta must be limited to `agent-tools.generated.ts`, including embedded lint text
   and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`. No hand edit.
5. **docs-source-format** — scoped formatter over the two read-only docs sources, the three CLI TS
   files, the MCP policy/test files, and both wrapper implementation/test pairs. Never a directory
   containing receipts. Every intended set non-empty, zero findings, marker still plain text,
   malformed JSON still byte-identical.
6. **docs-accuracy** — `deno task docs:accuracy`, exit 0, sources unchanged.
7. **publish-dry-run / JSR** — root and member publish dry-runs, full export-map doc-lint, per-member
   JSR audits, exact-pin and release-preflight scans.

## JSR obligations per member — the honesty requirement

- **`@netscript/cli`** — confirm the six `@netscript/*` imports remain exact `0.0.6`; run
  `check:netscript-jsr-specifiers`. Inspect the published file list and state the delta **honestly**:
  the embedded `run-deno-lint.ts` tool text and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` change, and
  upgrading consumers receive the marker-aware, nearest-config-batched lint selection semantics.
  There is **no** export/API or binary-command change. Report the existing
  `isolatedDeclarations: false` and doc-completeness debt as **baseline** — do not silently convert
  it to green and do not claim debt closure. No new diagnostic is permitted.
  Verify the generated constant is still the only delivery mechanism: no runtime filesystem read, no
  import attribute, no top-level `import.meta`.
- **`@netscript/mcp`** — `audit-jsr-package.ts --root packages/mcp`, full export-map doc-lint,
  targeted root isolated-declaration check, member and root publish dry-run, published file-list
  inspection. Static scan of the changed published source must show no `import.meta`, `fromFileUrl`,
  `Deno.read*`, or runtime asset dependency — the S3 delta is a comment, so the published surface is
  otherwise untouched. The S2 module-relative reads must remain confined to publish-excluded
  `packages/cli/e2e/**`.

Reject new slow types, self-bare imports, upstream re-exports, dependency ranges, runtime asset
reads, or publish-list drift. **A dry-run is necessary but not sufficient.**

## `scaffold.runtime`

Record it truthfully as **`n/a` by coordinator waiver** — not `NOT_RUN`, not pending, not a lease
request. Do not invoke Aspire, Docker, or `e2e:cli`. The focused semantic coverage landed in S1–S3
is the applicable proof.

## Hard bounds

- No product or config edit. No fourteenth path.
- Do not touch the three preserved `plan-eval*` files, S1–S3 landed paths, `deno.lock`, or caches.
- No merge, ready flip, relabel, issue-checkbox mutation, acceptance-evidence block, central-state
  edit, or lease. The close gate and draft→ready are coordinator-owned, not yours.
- Report any gate that cannot be run, and why, rather than omitting it. An unrun gate reported as
  green is the exact failure this leaf exists to eliminate.

## Output

Commit S4 as one slice, push with `git push origin HEAD:refs/heads/fix/package-gate-honesty`, post a
`[PHASE: IMPL]` comment on #1663 with the full gate matrix and receipt ids, then **stop**. The
supervisor performs the final Tier-A slice review, after which a separate-session IMPL-EVAL is
mandatory. Report your thread id, commit SHA, and head.
