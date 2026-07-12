# IMPL-EVAL — mcp-skills--orchestrator / S7

- Evaluator session: final separate opposite-family IMPL-EVAL (Claude / Opus 4.8), 2026-07-12,
  reviewing Codex-authored implementation.
- Run: mcp-skills--orchestrator / S7 — CLI integration (`agent mcp` + `agent init`).
- Surface / archetype: Archetype 6 — CLI/Tooling (`@netscript/cli`); MCP composition folded into the
  CLI application layer.
- Scope overlays: none. Release-gate class: `n/a` (S7 adds an `agent` group; scaffold output, DB
  wiring, Aspire helpers, and publish shape are unchanged). Close-gate: `n/a` (issue #731 left open,
  no closing keyword, no PR per the slice brief).
- Commits under review: `5d588ac6` (embed agent skill installer), `ef39b332` (compose agent MCP
  adapters).

## Checklist results

| Item | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before impl (protocol §2) | PASS | `plan-eval.md` verdict `PASS`, opposite-family (Opus 4.8), dated before impl; recorded in `worklog.md` §Evidence. |
| Design checkpoint present, slices follow it (§3) | PASS | `worklog.md` §Design (public surface, domain vocabulary, ports/side-effects, constants/composition, contributor path); 3 plan slices realized in the two impl commits. |
| Slice 1 — embedded skill contract + installer | PASS | `init-agent.ts` (content-aware atomic writes, marker-bounded AGENTS edit, host selection, `verifyBundle` SHA-256), `skills.generated.ts`, generator extension. Focused init tests pass. |
| Slice 2 — real MCP composition + additive group | PASS | `run-agent-mcp.ts` composes real `PublicCliCommandCatalog`, `SpawnCommandExecutor`, `CliProjectDoctor`; `agent-group.ts` thin group; root registers one additive `agent` factory (diff = 1 import + 1 register block). |
| Slice 3 — merge-readiness evidence | PASS | Independently reproduced below. |
| Focused CLI agent + all `packages/mcp` tests (§4/§5) | PASS | `deno test -A --no-lock packages/cli/.../agent packages/mcp/tests` → **43 passed, 0 failed** (reproduced). |
| Scoped check (cli + mcp) | PASS | `run-deno-check.ts --root packages/cli --root packages/mcp` → 669 files, 0 findings (reproduced). |
| `arch:check` (F-CLI / universal) | PASS | `deno task arch:check` exit 0; only pre-existing warnings (F-16 `src/ports`; `export default` in `chat-route.stub`, `scaffold.ts`, `cli.ts`) — none in S7-authored files (reproduced). |
| Published-asset behavior (JSR-safe embedding) | PASS | `skills.generated.ts` is pure TS string literals; **0** `Deno.read*`/`open` in the generated barrel and in `init-agent.ts`. `deno task gen:assets-barrel` reproduces the barrel with **no diff** → deterministic hash `894bf315…e2f5`. |
| Doctrine — Archetype 6 | PASS | Thin presentation (commands parse flags / call injected ops, `showHelp` fallback), adapter-owned IO (`DenoAgentInitFileSystem`, `SpawnCommandExecutor`), batteries-included composition in app layer, declarative additive root registration. No new abstract; only CLI imports MCP (no cycle). |
| Agent briefs carry `## SKILL` (§13) | PASS | `implement.md`, `slice-review-prompt.md`, `plan-eval-prompt.md`, `impl-eval-prompt.md` each have a `## SKILL` chapter. `supervisor.md`/`context-pack.md` are logs/state, not briefs. |
| Debt delta | PASS | No new debt planned or introduced; `arch-debt.md` unchanged. |
| Fresh UI output restored (supervisor requirement) | PASS | Neither impl commit touches `packages/fresh-ui/registry.generated.ts`; HEAD state clean. (Evaluator's own `gen:assets-barrel` re-run reproduced the multi-output side effect and reverted it — confirms the supervisor's restoration was correct and that the shared generator is the source of the byproduct.) |
| Supervisor-owned brief restored (`implement.md`) | PASS | `implement.md` tracked only by supervisor commit `17b09240`; absent from both impl commits' diffs. |
| Working-tree hygiene | PASS | `git status` clean except the untracked evaluator prompt `impl-eval-prompt.md`; no stray source churn. |

## Gate infrastructure drift (recorded, not blocking)

The required scoped **lint/fmt wrappers** exit 1 before diagnostics because Deno 2.9 rejects the
branch's pre-existing root workspace array (`invalid type: string "packages/*", expected
WorkspaceConfig`). This is documented in `drift.md` (2026-07-12) as significant, **pre-existing, and
outside S7 scope**; the generator remained JSR-safe, focused `deno lint` and `deno fmt --no-config`
of owned files passed, and scoped `deno check` (the type verdict) succeeded. Correctly not expanded
into a root-config migration. This does not block the pass: it is a repo-wide infrastructure defect,
not an S7 regression, and the substantive intent of the lint/fmt gate (owned files clean) was met by
the recorded fallbacks.

## Verdict

`PASS`

## Notes

- Publish dry-run for both packages is recorded exit-0 in `worklog.md`; the evaluator independently
  confirmed the load-bearing publishability property (no runtime FS read; string-literal embedding;
  named exports on new S7 symbols) statically rather than re-running the two dry-runs.
- Slice-review (A1) blocker is transparently logged in `drift.md`: after two failed launches the
  supervisor performed the substantive check-in, required restoration of the Fresh UI byproduct and
  `implement.md`, and re-ran focused gates before sign-off. The escalation path was honored and the
  resulting tree is clean, so the process gap is resolved rather than open.
- No source or non-`evaluate.md` artifacts were modified by this evaluation.
