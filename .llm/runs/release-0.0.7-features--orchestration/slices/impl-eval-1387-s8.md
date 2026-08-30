use harness

# IMPL-EVAL — #1387 Slice 8 (MCP/agent access projection)

You are a **separate evaluator session**, opposite family to the author (Codex authored; you are
Claude). You certify or reject; you do not fix, do not commit, do not push, do not comment on GitHub,
and do not move any head.

| Field | Value |
| --- | --- |
| Repo | detached worktree, already checked out at the evidence head |
| **Content head** | `ce9bd3e8b5b7e06dd21785dfe452efb94a909bf3` |
| **Evidence head** | `34796d147c0ecd1d391e884b02fe20f421ad3a51` |
| Base | `edb3831b6` |
| PR | rickylabs/netscript **#1762**, draft, `Refs #1387 — partial` |
| Plan | `.llm/runs/feat-service-principal-procedure-policy--1387/plan.md` § Slice 8; research findings 11–13 and the "Generated surfaces" MCP/agents paragraph |
| Tier-A | `.llm/runs/feat-service-principal-procedure-policy--1387/tier-a-slice-8.md` |
| Receipts | `.llm/runs/feat-service-principal-procedure-policy--1387/receipts/` |

## SKILL

`netscript-harness`, `netscript-doctrine`, `netscript-tools`, `rtk`.

## What to judge

1. **Ceiling.** Five of seven authorized files touched (`operation-index.ts` and
   `no-db-generated-openapi.json` untouched). Confirm this is correct — verify the raw operation
   really was already reachable without changes to `operation-index.ts` — not a shortfall that
   silently skipped required work. `deno.lock` byte-identical.
2. **The reverse mapping, exact.** Read `deriveOperationAccessSummary` line by line against the four
   cases: no `security` key → `undefined`; `security: []` → `none`; an empty-object alternative
   present → `optional`; no empty alternative → `required`. Verify `scopes`/`securitySchemes`/`roles`
   extraction is correct for each, and that the function is defensive against malformed input (a
   `security` array containing non-object entries, or `x-netscript-roles` containing non-string
   entries) rather than throwing or silently corrupting.
3. **Absence is genuine, not synthesized.** Both flows conditionally spread `access` only when
   defined. Verify a truly undeclared operation gets no `access` key at all in the result — check the
   test uses `Object.hasOwn`, not an equality/undefined check, for this claim.
4. **Curl guidance is genuinely distinct per state and handles no secrets.** Verify the four states
   produce four different `curlExample`/`authNote` strings by reading the code, not by trusting the
   test's `Set.size` assertion. Verify the `required` state's placeholder (`Bearer <credential>`) is
   not a real-looking fabricated token, and that the undeclared/default case is **byte-for-byte
   unchanged** from the pre-Slice-8 behavior (same `OPENAPI_CURL_AUTH_NOTE`, same curl format with no
   added comment).
5. **Corpus/lock.** Both unchanged from Slice 7's end state. Confirm that's correct — this slice
   populates existing optional fields with real values; it exports no new type.
6. **Evidence integrity.** Seven receipts, each `gitHead == actualGitHead` at the content head.
   Verify by `argv` and `durationMs`, never `exitCode` alone. Confirm Slices 1–7's archived receipt
   sets are intact and untouched, and the top level holds only Slice 8's set.

## Verdict

Return exactly one of `PASS`, `ACCEPTED_WITH_FINDINGS`, `FAIL_FIX`, `FAIL_PLAN`, naming the exact head
you certify. Findings must be concrete: file, line, what breaks. State plainly anything you could not
verify.

**Do not run `e2e:cli`, Aspire, Docker, or any browser gate.** No runtime lease is held by this lane
and none may be acquired.
