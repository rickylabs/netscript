# PLAN-EVAL — fix-1009-release-publish-arg-separator--codex

- Plan evaluator session: OpenHands cloud agent (qwen/qwen3.7-max via OpenRouter) / 2026-08-01
- Run: fix-1009-release-publish-arg-separator--codex
- Surface / archetype: .llm/tools/release task entry points / 6 — CLI / Tooling (contract/gate subset)
- Scope overlays: none
- Workflow run: https://github.com/rickylabs/netscript/actions/runs/30715484303
- Replaces: invalid closed-model artifact (rejected per drift.md 2026-08-01 entry)

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` exists, re-baselined against main @ 3ab64720 on 2026-08-01. Spot-confirmed: `parseArgs` in `github-release.ts:295-351` and `preflight-text-imports.ts:619-639` lack `--` handling; siblings `cut.ts:45`, `canary.ts:38`, `publish-readiness.ts:446` already handle it; task wiring in `deno.json:95,99` matches target surface. |
| Decisions locked                        | PASS              | `plan.md` locked decisions D1 (early `if (arg === '--') continue;`), D2 (derive publish test cases from source `Usage:` lines), D3 (exercise preflight through real subprocess entry point). All with rationale. |
| Open-decision sweep                     | PASS              | `plan.md` open-decision sweep lists parser placement, test tokenization, and broader parser normalization. All marked "resolved now" or "safe to defer". No open decision would force rework when deferred. |
| Commit slices (< 30, gate + files each) | PASS              | `worklog.md` Design section enumerates two slices: (1) publish parser + doc-derived test, (2) preflight tolerance + end-to-end evidence. Each names proving gate and files. |
| Risk register                           | PASS              | `plan.md` risk register lists three risks with mitigations: separator acceptance weakening unknown-flag rejection, doc-derived test becoming tautology, end-to-end probe reaching network/token checks. |
| Gate set selected                       | PASS              | `plan.md` fitness gates select CLI contract, unknown-argument strictness, and static quality from archetype 6 gate matrix. |
| Deferred scope explicit                 | PASS              | `plan.md` non-scope explicitly defers tolerant siblings, non-task-wired scripts, and packages/plugins edits. `worklog.md` deferred scope section reinforces. |
| jsr-audit surface scan (pkg/plugin)     | N/A               | `research.md` and `plan.md` both mark N/A: only `.llm/tools/release/` infrastructure tooling changes; no package/plugin export, manifest, or JSDoc surface. |

## Open-decision sweep (evaluator-run)

None. The plan's open-decision sweep is complete and accurate. All decisions that would force rework when deferred are resolved. The two implementation slices are correctly sized and ordered.

## Verdict

`PASS`

## Notes

Independent evaluation by canonical OpenHands open-model evaluator (qwen/qwen3.7-max via OpenRouter). The previous closed-model artifact was rejected per `drift.md` 2026-08-01 entry. Research findings verified against tree: `parseArgs` in both target files currently reject bare `--` at their unknown-argument branches (`github-release.ts:349`, `preflight-text-imports.ts:635`); siblings already skip it; task wiring matches. Plan is complete, decisions locked, slices ordered, risks mitigated. Implementation may begin.

OPENHANDS_VERDICT: PASS

---

# PLAN-EVAL ADDENDUM — supervisor pass (owner-waived lane)

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

The owner waived the open-model Plan-Gate for the 0.0.3 fix train on 2026-08-01: implementation is
delegated to Codex (GPT family), so generator and evaluator are already different sessions and
different model families. This addendum records the supervisor's own independent pass. It does not
retract the OpenHands `qwen/qwen3.7-max` verdict above — that workflow run
(`30715484303`) was confirmed to exist and to have completed successfully — it stands alongside it.

I wrote the brief that shaped this plan, so the rows below weight hardest the parts I specified:
the AC4 sweep boundary and the "verify the cause first" instruction.

| Plan-Gate item | Result | Evidence |
| --- | --- | --- |
| Research present and current | PASS | `research.md`; independently re-confirmed: `cut.ts:45`, `canary.ts:38`, `publish-readiness.ts:446`, `verify-canary-pair.ts:12`, `surface-diff.ts:275` already skip `--`; only `github-release.ts` and `preflight-text-imports.ts` did not. |
| Cause verified, not assumed | PASS | Direct probe of `parseArgs(['--','v0.0.1-alpha.20','--notes-file','intro.md'])` on the baseline reproduced `Unknown argument: --`; the issue's stated cause is exact. |
| Decisions locked | PASS | `plan.md` D1–D3. D2 (derive test cases from the source `Usage:` lines rather than hard-coding them) is the decision that actually closes the drift, and it is locked with rationale. |
| Open-decision sweep | PASS | `plan.md` sweep; nothing deferred that would force rework. |
| Commit slices (< 30, gate + files each) | PASS | Two slices, each naming files and proving gate; realised as `830efa69b`, `7c7cfe0b4`/`b610b43d6`. |
| Risk register | PASS | `plan.md` names the real risk — that tolerating `--` could weaken unknown-flag rejection — and mitigates it with a retained strictness test. Independently probed: `--bogus` still throws. |
| Gate set selected | PASS | Archetype 6 CLI/tooling contract subset; proportionate. No scaffold/DB/Aspire surface, so `e2e:cli` correctly excluded. |
| Deferred scope explicit | PASS | `plan.md` non-scope defers non-task-wired scripts. Scrutinised because my brief drew that boundary: `preflight-release.ts` takes bare positionals and is not task-wired, and `run-publish.ts` is reached only via `publish:dry-run`; neither documents a `--` form, so AC4 is satisfied without them. |
| jsr-audit surface scan | N/A | `.llm/tools/` only; no package or plugin export surface. |

## Verdict — supervisor

`PASS`
