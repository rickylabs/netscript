# PLAN-EVAL — quality-q752-fresh--codex

- Plan evaluator session: Claude Opus 4.8 (opposite-family), high effort — 2026-07-12
- Run: `quality-q752-fresh--codex`
- Surface / archetype: `@netscript/fresh` — Archetype 4 (Public DSL / Builder)
- Scope overlays: `frontend`

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` exists; rejected carried-in commit `cb538f4` explicitly re-baselined against current `main` HEAD `3b3d615b` (§Re-baseline). Base commit exists in tree; `sha256sum deno.lock` = `da85900f…1ec1f5` matches the recorded baseline. Load-bearing finding spot-checked live: scanner reports **exactly 25 findings / 0 allowances** (`ok:false`), matching Finding #1. |
| Decisions locked                        | PASS   | `plan.md` §Locked Decisions D1–D6, each with rationale (factory-owns-relationship, z.input/z.output variance, explicit prop construction, runtime guards, upstream-derived-or-adapt, zero-allowance default). |
| Open-decision sweep                     | PASS   | `plan.md` §Open-Decision Sweep marks helper/type names + browser run "safe to defer" and resolves allowance survival "now." Evaluator re-sweep (below) found no deferred decision that forces rework. |
| Commit slices (< 30, gate + files each) | PASS   | `worklog.md` §Commit Slices: 4 ordered slices (route/builder → form/Zod → query → streams+full gates); each names proving gate and file globs. 4 < 30. |
| Risk register                           | PASS   | `plan.md` §Risk Register: 5 risks (inference change, invariant upstream, Zod layout, silent runtime change, slow-types/private-type-ref) each with mitigation. |
| Gate set selected                       | PASS   | `plan.md` §Fitness Gates selects F-1–F-19 + F-6/F-7, code-quality scanner `--max-allow 6`, frontend contract (consumer typecheck), browser N/A — consistent with `archetype-gate-matrix.md` Arch 4 column + frontend overlay. |
| Deferred scope explicit                 | PASS   | `plan.md` §Non-Scope + `worklog.md` §Deferred Scope: broader Arch-4 restructure, PageBuilder-legacy compat, and visual/browser checks explicitly deferred with owners. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §jsr-audit surface scan covers all **14** exports (confirmed live in `packages/fresh/deno.json`), doc-lint, and package-local publish dry-run; names `private-type-ref` / slow-type / signature-preservation risks. Each named risk maps to a decision (D1, D5, AP-14) and a proving gate (validation steps 6–7). |

## Open-decision sweep (evaluator-run)

No deferred decision would force rework:

- **TanStack/StreamDB derive-vs-adapt (D5)** is a bounded fork — both branches are pre-authorized
  and the "upstream invariant" branch is in the risk register; neither forces a re-plan.
- **Allowance survival** is resolved to zero-default with a member-level-proof bar (D6); the
  `--max-allow 6` scanner ceiling is a bounded safety valve, not a deferred decision, and drift-watch
  flags any nonzero allowance.
- **Browser/visual verification** is deferred with a valid rationale (pure type-erasure; no rendered
  behavior/styling change; route/form/query tests + consumer typecheck are the frontend contract
  evidence), consistent with the frontend overlay and Arch-4 "browser = subtype".

## Verdict

`PASS`

Implementation may begin. The four ordered type slices may proceed without pre-authorized
allowances; the zero-allowance default, no-PR local-evidence override, and JSR risk coverage are all
satisfied.

## Notes

Non-blocking observations (for the implementer / IMPL-EVAL, not plan-gate failures):

1. **File-count wording.** `research.md` Finding #1 says "across nine Fresh files," but scanner
   findings span **8** files. The 9th named file (`query/query-types.ts`) is a support type file that
   needs edits but carries no scanner finding. Imprecise phrasing, not material — the 25/0 baseline
   itself is exact.
2. **Debt reference is stale-but-harmless.** The plan's Arch-Debt row cites `packages/fresh — AP-1 /
   doctrine verdict Restructure`; that AP-1 entry (`arch-debt.md:581`) is already **RESOLVED**
   (builders/mod.ts split, 2026-06-14). The still-open broader item is the doctrine *Restructure*
   verdict (subpath exports) at `10-codebase-verdict-and-handoff.md:39`. The plan's action ("none —
   do not deepen") is correct against either.
3. **Release-gate class.** Not explicitly marked in the plan; it is correctly **n/a** — the run
   changes no scaffold output, plugin scaffolding, DB wiring, Aspire helpers, or published
   CLI/plugin shape (it must *preserve* the published type surface).
4. **IMPL-EVAL watch item.** The `--max-allow 6` scanner ceiling passes the automated gate without
   enforcing D6's per-survivor justification. IMPL-EVAL must verify every surviving allowance carries
   a concrete failed-typing attempt + member-level upstream incompatibility in the worklog; the
   automated gate alone is insufficient to distinguish justified from unjustified survivors. Zero
   remains the target.
5. **Load-bearing source spot-check confirmed** the scanner targets `as unknown as` double casts:
   `zod-internals.ts:61,66` are flagged while the single-cast `:55` (`schema._def as
   ZodDefWithInner`) is correctly not, validating D4's "narrow without double assertion" approach.
