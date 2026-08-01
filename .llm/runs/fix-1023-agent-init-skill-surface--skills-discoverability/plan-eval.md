# PLAN-EVAL — fix-1023-agent-init-skill-surface--skills-discoverability

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Generator: Codex · gpt-5.6-sol · low (thread `019fbebf-43c0-7a10-b0f3-b950973588c5`).
Evaluator is a different session and a different model family; for the 0.0.3 fix train the owner
waived the open-model evaluator lane and assigned PLAN-EVAL/IMPL-EVAL to this supervisor.

**Corroborating run (not the authority).** The slice independently dispatched the repo-default
OpenHands evaluator — run
[30714594170](https://github.com/rickylabs/netscript/actions/runs/30714594170), OpenRouter
`qwen/qwen3.7-max`, comment
[#1034-5153029734](https://github.com/rickylabs/netscript/pull/1034#issuecomment-5153029734) — which
also returned `PASS`. I verified that run and that comment exist. It followed repo doctrine
(`CLAUDE.md`) rather than the owner's 2026-08-01 waiver, so it is recorded as corroboration; this
supervisor verdict is the authoritative one.

**Disclosure of evaluator bias.** I wrote the brief that shaped this plan. The rows below are
weighted hardest against the parts I specified — the file list, the test shape, the validation set —
because those are the ones I am least likely to question.

## Plan-Gate checklist

| # | Check | Verdict | Evidence |
| - | --- | --- | --- |
| 1 | Cause independently re-derived, not copied from the brief | PASS | `research.md` finding 3: manifest + generated barrel are the bundle authority, installer enumeration is unconstrained — re-verified against `skills/manifest.json`, `skills.generated.ts`, `init-agent.ts` at `3ab64720f`. |
| 2 | Reproduction actually executed | PASS, and it corrected me | `drift.md`: my brief's repro command was **wrong** — `packages/cli/src/main.ts` does not exist and `agent init` has no `--project-root` flag. The slice found the live entrypoint `packages/cli/bin/netscript-dev.ts`, ran it from a temp cwd, and reproduced the stated result exactly (three skills, 164 lines, dangling `aspire` routes). |
| 3 | Every issue acceptance box mapped to planned work | PASS | Boxes 1–2 → Scope 28–29 + D2/D3; box 3 → `skills/help.md`; box 4 → `AGENTS_SECTION`; box 5 → Scope 30 + Risk row 2; box 6 → D4 + Validation order 3. |
| 4 | Box 6's test is a real behavioural test, not a tautology | PASS with a condition | D4 claims the route-integrity test fails on current main. **Condition carried to IMPL-EVAL:** must be demonstrated red against pre-fix content, not merely asserted. |
| 5 | Discoverability — the real acceptance bar — is addressed, not just file count | PASS, with a stated limit | Scope 30 / Risk row 2 target the measured gap: `netscript plugin doctor`, invoked **0** times across five agent runs despite six mentions, is anchored nowhere in the drafts (`research.md` finding 6). **Limit, and it is my framing rather than the plan's failure:** a symptom-indexed document is a *structural proxy*. Nothing here measures whether an agent reaches the tool from a cold start; that needs another instrumented build round. The PR must not claim behavioural proof. |
| 6 | Non-scope bounded and correct | PASS | Non-Scope 36 (no installer control-flow change) matches finding 3. Non-Scope 37 correctly excludes `e2e:cli run scaffold.runtime` — no scaffold output, plugin scaffolding, DB wiring, or Aspire helper generation changes. |
| 7 | Dangling-route sweep covers the drafts themselves | PASS | D3 + Scope 29. The trap: the draft `deno/SKILL.md` frontmatter routed to `deno-fresh` and `netscript-deno-toolchain`, neither installed — adopting the drafts unedited would have shipped two *new* dangling routes while claiming to fix dangling routes. |
| 8 | Stale-barrel hazard identified and closed | PASS | Finding 5 + Risk row 3 + Validation order 4. `check:assets-barrel` omitted `skills.generated.ts`, so editing `skills/**` without regenerating passed CI. |
| 9 | Idempotency of the `AGENTS.md` upsert preserved | PASS | Risk row 4 keeps the markers and the existing second-run `changedFiles: []` assertion. |
| 10 | Validation plan is the smallest that proves the change | PASS | Orders 1–4 are the scoped set. Orders 5–6 are the slice's own additions beyond my brief and are proportionate — order 6 is the only end-to-end artefact evidence, which I had underspecified. |
| 11 | Open decisions resolved, not deferred | PASS | Both "must resolve now" rows answered inline: extractor bound to real frontmatter/table forms with `manifest.skills` as the resolution set; bundle version `0.1.0` → `0.2.0`. |
| 12 | Risk register names failure modes that would actually bite | PASS | Risk row 1 (extractor flagging command/code literals as skill names) is the correct primary risk for D4 — this is exactly what materialised and was fixed in slice 2 (see IMPL-EVAL). |

## Things I got wrong in the brief, recorded so IMPL-EVAL does not re-inherit them

1. The repro command was invented, not run — corrected by the slice.
2. I flagged `help.md`'s "no `netscript doctor` in 0.0.2" line for verification but did not verify it
   myself. Finding 7 did: the live CLI genuinely has no `netscript doctor`; only the version
   reference needed correcting.
3. I specified the discoverability bar without specifying how it could be evidenced. Validation
   order 6 is a better answer than my brief contained.

## Verdict

**PASS**

Approved to implementation, with one condition carried into IMPL-EVAL: the routing-integrity test
must be shown failing against pre-fix content. If it cannot be shown red, box 6 is not evidenced and
must not be ticked.
