# IMPL-EVAL — PASS

GLM 5.3 Flash · `max` · head `eefe776e8` · base `ec848e6b0`.
Its (A) attack was defeated empirically and needed no change. Its (B) CI-wiring judgement and its
(A) hardening nit were both acted on in `ef608b0b3`; its (D) documentation note likewise.

---

All evaluation work is complete and the worktree is clean at the evaluated head.

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

Head confirmed: `eefe776e8` (`eefe776e846184d73665ccb56734dca94ca5ce9c`), one commit over trusted base `ec848e6b0`, worktree clean after all probes.

## Numbers reproduced — every one, none failed

| Claim | Reproduced | How |
|---|---|---|
| 36 READMEs | ✓ | independent scanner (my own fence parser, not the repo's) |
| 166 fences / 71 TS-like | ✓ | same independent scanner |
| 1 syntax-invalid | ✓ | gate census + `packages/mcp/README.md:277` |
| 70 checked | ✓ | 71 − 1 excluded |
| 31 type errors | ✓ | my own regex over the gate's raw diagnostics |
| 6 failing READMEs | ✓ | `packages/service` (8), `packages/fresh` (8), `packages/ai` (8), `packages/fresh-ui` (5), `packages/sdk` (1), `packages/prisma-adapter-mysql` (1) |
| TS2304 ×21 / TS2307 ×5 / TS18046 ×5 | ✓ | sums to 31 |

**Abort trap (2):** confirmed. A naive single pass over all 71 modules reports **type_errors=0, failing_readmes=1** — `deno check` emitted exactly one `SyntaxError: Expected ';', '}' or <eof> at file://packages/mcp/README.md:281:7` and stopped. The `packages/mcp/README.md:277` fence opens at line 276 with four backticks, swallows prose (line 281: "Every tool flow depends on a port interface…") plus a nested fence, and closes at 305 — prose tagged as TypeScript, exactly as claimed. A naive ratchet would read 0 ≤ 31 and 1 ≤ 6: false clean confirmed.

**Ratchet bites (3):** injecting `import … from '@netscript/definitely-not-a-package'` into the clean `packages/cli` README → exit 1 naming **both** crossed ceilings (`failing readmes 7 > 6`, `type errors 32 > 31`). Reverted cleanly.

**Anti-shrink (4):** all three fail — delete a README → `readmes 35 < 36`; retag `ts`→`text` → `ts-like fences 70 < 71` + `checked 69 < 70`; exclude via `no-check:` marker → `checked 69 < 70`. All exit 1.

**Nothing lost (5):** 143→144 tasks; additions exactly `docs:readme-fences`. 50→51 gate ids; additions exactly `readme-fences`. Nothing removed.

## The four adversarial judgments

**(A) Exclusion loop — defeated, empirically.** The attack is doubly guarded. Breaking a type-erroring fence syntactically (both an in-body error and an EOF-style unterminated template were tried) excludes the block but decrements `checked`, so `checked 69 < 70` **and** `syntax-invalid fences 2 > 1` both fire. Even compensating by adding a fresh clean ts fence — which restores `checked=70` and isolates the ceiling as the only guard — still fails: `syntax-invalid fences 2 > 1`. The census never improved: type_errors stayed 31, failing_readmes stayed 6 in every attack. So yes, `maximumSyntaxInvalid: 1` is sufficient. One hardening nit, not a constructible hole: `result.code` is never consulted, and an unattributable syntax error (`if (!victim) break`) would pass silently — I could not construct it from README content (the line map clamps into the block range; both realistic error shapes attributed correctly), but I'd require `code !== 0` with zero newly-attributed failures to fail rather than pass.

**(B) Not wired into ci.yml — the one real debt.** Factually confirmed: zero references in `.github/`, and unlike `docs:snippets` (which at least deploy-blocks in `pages.yml`) this gate is run by nothing. Precedent exists — 7 of 34 catalog gates are also unwired — but the deferral's stated rationale is weaker than claimed: the gate **passes at baseline** (verified exit 0), so wiring it into the quality job today cannot break required CI, and lowering ceilings after future fixes never turns a green gate red. A ratchet that nothing runs decays. I judge this conservative rather than sound engineering — but it is a scoping choice, honestly disclosed, not a correctness defect, so it does not block. I would require: wire `--gate readme-fences` into the ci.yml quality job (or `pages.yml` beside `docs:snippets`) as a named fast-follow, before the first ceiling is lowered.

**(C) Reuse claim — verified.** `check-readme-fences.ts` imports and calls `extractFencedBlocks` and `compileSnippetAnalysis`; no second compiler or extractor exists. New logic is exactly README discovery, the exclusion loop, and the ratchet policy. No duplicated policy: the sibling `check-snippets.ts` hard-fails any non-zero compile (no exclusion loop), and `analyzeSnippetSite` can't be reused for discovery because it couples docs/site walking to Tier-1 page policy. Nit: `analysisFor` re-implements ~10 lines of census counting from `snippet-policy.ts` — a thin, acceptable adapter.

**(D) Ceilings honest — verified.** Every ratchet value equals its measured census with zero slack: 36=36, 71=71, 70=70, syntax-invalid 1=1, failing 6=6, errors 31=31; the policy test asserts equality-passes / +1-fails. Two reported-but-unguarded values, both defensible: `exempt` is covered transitively by the checked floor (probe 4), and `fences=166` has no floor — non-TS fences can be deleted without failing this gate. That is outside the gate's stated TS-fence scope, but say so in the policy doc rather than leaving it implicit.

## Delta from the first dispatch

`git diff 0be2fba52 HEAD` is exactly the one hunk: the `as unknown as` + `String()` + `?? ''` replaced by `result.diagnostics`. `SnippetCompilationResult.diagnostics` is a required `string` (`snippet-compiler.ts:18`, always produced by `mapDiagnostics`), so the cast described a looser shape than reality — **no behavior change on any reachable path**. No `as unknown as` / `as any` / `as never` remains in any of the three new files.

Validation: policy tests 5/5 pass; `deno check --unstable-kv` clean on both new files; baseline gate exit 0; seven mutation probes each reverted; final worktree clean.