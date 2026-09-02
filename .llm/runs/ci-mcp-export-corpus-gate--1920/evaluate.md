# IMPL-EVAL — PR #1929 (ci(mcp): enforce export-corpus freshness in quality)

- **Evaluator:** OpenHands · GLM 5.3 Flash (OpenRouter), fresh session — separate from the
  generator (Codex Sol) and from the supervisor IMPL-EVAL packet (Claude Fable).
- **Head:** `8c028d820fb174c55af7567c69774f38e88dbaa2` · **Base:** `37452f11f5045f0f5a98e07d802bcc2a2e94333b`
- **Plan:** `ci-mcp-export-corpus-gate--1920` · **PLAN-EVAL:** N/A (recorded and justified —
  mechanical, fully specified two-file change; see supervisor.md/worklog.md)
- **Mode:** read-only evaluation. No source, commit, or push changes made by this session.

## Verdict

**PASS** — no findings of any severity.

## Verification (real exit codes, reproduced independently at head)

| Check | Result |
| --- | --- |
| GREEN: exact CI invocation `run-gate.ts --gate mcp-export-corpus --id quality-mcp-export-corpus --output .llm/tmp/gate-receipts/quality/mcp-export-corpus.json` | `REAL_EXIT=0`, receipt `outcome: PASS`, payload sha256 `81d49c6c…76214df`, 273 subpaths, 7,809 symbols (byte-matches committed provenance) |
| RED teeth (plan D4): stale corpus at base in detached throwaway worktree | `REAL_EXIT=1` — `MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus` |
| CI run 33635076831 at exact head | `quality` job `success`; step **MCP export corpus freshness** present and `success`; receipt path matches gate-receipts upload glob (`if-no-files-found: error`) |
| Step structure from parsed YAML (`@std/yaml`), not grep | name / `if: env.RUN_DENO == 'true'` / `--gate/--id/--output` all exact; gate catalogued at `.llm/tools/gates/catalog.ts:40` |
| Corpus diff hygiene | generator output only: provenance `658a3a56…` → `81d49c6c…`, 272→273 subpaths, 7,803→7,809 symbols (traces to #1915 `plugin-auth-core` merged between cut base and integrated main); no hand edits |
| `deno task quality:scan` (packages touched) | `REAL_EXIT=0`, findings `[]`, all 7 allowances pre-existing (#1276) |
| `deno task arch:check` | `REAL_EXIT=0` (pre-existing WARNs only) |
| Public surface | generated corpus not exported from `packages/mcp/mod.ts`; no new public surface |
| Scope/lock hygiene | diff = ci.yml step + regenerated corpus + run artifacts; `deno.lock` unchanged |
| PR state | OPEN, not draft, milestone `0.0.7`, `Closes #1920` in body, no open review threads, all 6 labels are real `.github/labels.yml` entries |
| Commit trail | `1ad32bc02` (S1 plan) → `8da9c60f8` (S2 gate+corpus) → `92ae7df42` (merge main) → `8c028d820f` (S3 evidence) — matches plan S1–S3 |
| Run artifacts | supervisor/research/plan/worklog/evidence/context-pack/drift all present; evidence records baseline RED, determinism (byte-identical regenerations), post-integration stats |
| Debt posture | no new `arch-debt.md` entries required; pre-existing MCP debt unrelated; matches plan "none implied" |

## Findings

None (blocking/major/minor: 0/0/0).

## Remaining risks (informational, not defects)

- The gate shells out to `deno doc`; a future Deno version bump can redden the gate on `main`
  with no diff. Mitigated by the `2.9.5` pin in ci.yml — a bump edits ci.yml → `needs_deno=true`
  → the gate runs and fails at the bump, not silently later. Consider an arch-debt note if the
  pin ever floats.
- `RUN_DENO=false` change classes skip the gate. Supervisor's 13-case derivation plus this
  evaluator's catalog check found no staleness-relevant input class in that lane today — latent
  classifier coupling, not a defect of this PR.

OPENHANDS_VERDICT: PASS
