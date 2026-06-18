# PLAN-EVAL — docs-user-site--diataxis (cycle 1)

## Summary

**Verdict: PASS** for `docs-user-site--diataxis` (Group 3, external/user docs) on the
`docs/user-site` branch of the `release/jsr-readiness` umbrella. The plan satisfies every
Plan-Gate checklist box (`research current`, `decisions locked`, `open-decision sweep`,
`commit slices < 30`, `risk register`, `gate set selected`, `deferred scope explicit`,
`jsr-audit` N/A for docs). Hard evidence in `research.md` and `doc-lint-census.md` confirms
US-5 (denominator = 26, `cli-e2e` excluded) and US-6 (single lint-debt unit
`@netscript/fresh-ui`, 7 `error[private-type-ref]`, source-fixable in TypeScript not
Markdown). US-7 (Lume `location` for project subpath) is correctly locked with the
`workflow`-scoped token flagged user-gated and non-blocking for PLAN-EVAL. The
off-limits guardrail passes — the only framework-code change is the fresh-ui Codex slice
(7 `*.tsx` exports of `*Namespace` types); `packages/aspire/src/public/mod.ts`,
`packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, version pins, and
`catalog:` are untouched. Three remaining open items (reference depth per unit-class,
README generated-vs-authored, workflow-token) are properly slotted to Design/user — none
would force rework when deferred. Implementation may begin; no slice was committed
during this read-only evaluator session. Cycle 1 of 2 before escalation.

## Changes

- `/.llm/tmp/run/docs-user-site--diataxis/plan-eval.md` — new PLAN-EVAL deliverable
  following `templates/plan-eval.md` with checklist results, spot-check evidence
  (US-5 / US-6 / US-7), boundary / off-limits confirmation, and the PASS verdict.
- No other files created or modified. This was a read-only evaluator session.

## Validation

- Read `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`,
  `.llm/harness/evaluator/verdict-definitions.md`, `.llm/harness/archetypes/SCOPE-docs.md`.
- Read `.llm/tmp/run/docs-user-site--diataxis/{research.md, plan.md, worklog.md}`.
- Verified US-5 spot-check: `packages/cli/e2e/deno.json` has `"publish": false` (excluded);
  `packages/cli/deno.json` has `name`+`exports`+`publish` block (26th, F-wave). 22 packages +
  4 plugins = 26 publishable members; the "25 simulated" framing matches the E-wave.
- Verified US-6 spot-check: `deno doc --lint packages/fresh-ui/interactive.ts` produces
  exactly 7 `error[private-type-ref]` diagnostics on `Accordion/Dialog/Drawer/Popover/
  Sheet/Tabs/Tooltip`; each names the corresponding private `*Namespace` type. Fix is
  `type XNamespace` → `export type XNamespace` in 7 `*.tsx` files (source/TS, not Markdown).
- Verified US-7 spot-check: plan locks Lume `location` to `https://rickylabs.github.io/netscript/`
  and flags the `workflow`-scoped token user-gated (non-blocking for PLAN-EVAL).
- Verified gates are concrete: Fitness Gates table (5 rows) + Validation Plan
  (5 ordered checks with commands and expected evidence).
- Verified boundary: Non-Scope explicitly excludes internal docs (Group 4) and framework
  changes; only framework-code touch is the fresh-ui Codex slice.
- Verified off-limits guardrail: `packages/aspire/src/public/mod.ts`,
  `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, version pins, and
  `catalog:` are NOT in the plan's slice surface.

## Responses to review comments or issue comments

- No PR/issue comment was posted by this evaluator (the workflow owns GitHub comments).
- The workflow will commit `plan-eval.md` back to the branch and emit the status comment.

## Remaining risks

- The `workflow`-scoped token for Pages CI YAML must be supplied by the user before the
  deploy slice (correctly flagged user-gated, non-blocking for PLAN-EVAL).
- Reference depth per unit-class (fold `*-core` substrate vs full pages) and
  README generated-vs-authored remain open for Design; both are presentation-only and
  do not force rework when deferred.
- The fresh-ui Codex slice is the only framework-code touchpoint; supervisor does not
  write `packages/` code, so this slice must be handed to a Codex agent (SCOPE-frontend),
  not the supervisor.