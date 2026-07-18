# IMPL-EVAL — PR #810 (p0 publish hotfix: registry-safe README embedding + preflight import-attribute ban)

- Evaluator: Claude Fable 5 (low) — separate session from Codex Sol generator (route review_codex)
- Date: 2026-07-17
- Subject: worktree `/home/codex/repos/b10-textimport`, branch `fix/mcp-readme-text-import` @ `ad0e5d54`, base `main` @ `a5adb706`
- Commits: `7c17a6d1` (generated-constant embedding), `ad0e5d54` (preflight import-attribute ban)
- Inputs: evaluator protocol + verdict definitions, PR #810 body, supervisor lineage comment (06:17Z), OWNER CORRECTION comment (06:23Z — ban is conditional with denoland/deno#35546 sunset criterion), PLAN-EVAL PASS comment, S2/S3 phase comments.

## VERDICT: FAIL_FIX

The mechanism is correct and every automated gate was independently re-witnessed green and red-on-seed.
But the OWNER CORRECTION (posted 06:23Z, before S2 landed at 06:33Z) was not encoded anywhere:
neither the preflight failure message nor the release/jsr-audit skill prose carries the
denoland/deno#35546 sunset criterion or the #138/#142/#143 lineage. The dispatch marks omission of
the sunset from the failure message as blocking. Plan remains valid; fix is narrow (message text +
skill prose + mirror regen).

## Probe evidence (all executed by this evaluator in the worktree)

| # | Probe | Result | Evidence |
|---|-------|--------|----------|
| 1a | Zero real `with { type: }` in publishable source | PASS | grep across `packages/**`+`plugins/**`: remaining hits are (i) a string payload inside `packages/cli/src/kernel/assets/embedded.generated.ts` (inert template text, not import syntax), (ii) `plugins/*/verify-plugin.ts` — absent from every plugin `publish.include` list, (iii) `packages/mcp/tests/fixtures/**` — `tests/` is publish-excluded. Publish rules verified in each `deno.json`. |
| 1b | Generated constant + regeneration task + freshness | PASS | `gen:publish-assets` / `check:publish-assets` exist; `deno task check:publish-assets` exit 0; seeded drift into `packages/mcp/src/publish-assets.generated.ts` → exit 1 naming the stale file with remediation; restored → exit 0. |
| 2a | `release:preflight` green on fixed tree | PASS | exit 0; four sub-checks PASS (text-imports, import-attributes 0 findings, file-url-import-meta, self-imports). |
| 2b | Seeded attribute → preflight fails naming it | PASS (mechanically) | seeded `with { type: "json" }` into `packages/mcp/src/version.ts` → exit 1, finding `packages/mcp/src/version.ts:2`; restored, green again. Scanner tests: 7/7 pass. |
| 2c | Failure message carries the #35546 sunset criterion | **FAIL — blocking** | Message is "Import attributes are not JSR registry-safe in publishable source; embed the asset as a generated TypeScript constant." `grep -rn 35546\|sunset\|canary` over `.llm/tools/` and both skill trees: zero hits. It does not say "permanent" (good), but the owner-mandated sunset condition + upstream link are absent. |
| 3 | MCP dry-run / tests / stdio smoke | PASS | `packages/mcp` `publish:dry-run` Success; 45/45 tests pass; stdio smoke: initialize OK (`@netscript/mcp` 0.0.1-beta.9), tools/list returns the 13 tools, `search_docs`/`list_docs` serve the embedded generated-constant README corpus (`mcp` slug, count 1 — matches documented default). No regression vs #809 mechanism. |
| 4 | Suppressions / quality / arch | PASS | Diff contains zero new `deno-lint-ignore` / `as unknown as` / `@ts-ignore`; changed-file `quality:scan` ok:true, findings:[] (7 pre-existing allowances untouched); `arch:check` exit 0 (warnings pre-existing). |
| 5 | Release-skill prose updated + mirror sync, citing lineage + sunset | **PARTIAL — blocking** | `.agents` ↔ `.claude` mirrors byte-identical for netscript-release and jsr-audit; prose does document the generated-constants doctrine and "registry can reject even when dry-run passes". But NO citation of #138/#142/#143 lineage, NO denoland/deno#35546 reference, NO sunset condition. This is exactly the "rule gets simplified away" failure mode both supervisor comments were written to prevent. |

## Numbered findings

1. **[BLOCKING] Sunset criterion absent from the preflight failure message.** Owner correction requires the message to state: lift only when denoland/deno#35546 is fixed, merged, released, and verified by a green authenticated canary publish of a text-import probe. `.llm/tools/release/preflight-text-imports.ts` contains no such text (grep for `35546|sunset|canary`: 0 hits).
2. **[BLOCKING] Lineage + sunset absent from skill prose.** `.agents/skills/netscript-release/SKILL.md` and `.agents/skills/jsr-audit/SKILL.md` (and mirrors) omit the #138/#142/#143 → beta.10 → denoland/deno#35546 lineage and the conditional-ban sunset. Timeline note: the correction (06:23Z) predates both implementation commits (06:33/06:34Z), so it was in scope for S2/S3.
3. **[minor] Corpus is single-document.** `list_docs` count = 1 (`mcp` README slug). Consistent with documented default behavior (`--docs-root` overrides), so not a regression — recorded for awareness.
4. **[minor] PR body DoD checkboxes for S2/S3 not ticked** despite landed evidence comments; tidy before ready-merge.
5. **[process, non-blocking] PLAN-EVAL provenance drift**: PR body says OpenHands evaluator; the OpenHands run failed (VERDICT NONE) and PLAN-EVAL PASS came from a local Claude+OpenRouter/Qwen session. Fallback appears recorded in the phase comment; ensure `drift.md` carries it.

## Required fix (narrow)

- Add the sunset condition + `denoland/deno#35546` link to the import-attributes failure message (and a comment block in the scanner citing lineage).
- Add lineage + sunset paragraphs to netscript-release and jsr-audit skill prose; regenerate `.claude` mirrors.
- Re-run: scanner tests, seeded-attribute red proof, skill mirror check. No other gates need re-running.

## Cycle 2 — VERDICT: PASS

Generator pushed `03a1111f` ("fix(release): document import-attribute sunset"). Worktree fetched and
hard-reset to that tip. All four coordinator probes re-executed by this evaluator:

| Probe | Result | Evidence |
|-------|--------|----------|
| (a) Preflight message + test | PASS | Message now reads "Import attributes are conditionally banned ... Lift this ban only when https://github.com/denoland/deno/issues/35546 is fixed, merged, and released, and an authenticated canary publish of a text-import probe is green." Scanner comment block carries the #138/#142/#143 lineage. Test asserts both the #35546 URL and the canary phrase (`preflight-text-imports_test.ts:13-14`); 7/7 tests pass. Seeded `with { type: "json" }` -> exit 1 emitting the full sunset message with file:line; clean tree -> all four preflight sub-checks PASS, exit 0. |
| (b) Skill prose + mirrors | PASS | Both `.agents/skills/netscript-release/SKILL.md` (l.19-23) and `.agents/skills/jsr-audit/SKILL.md` (l.574-577) carry the #138/#142 half-publish lineage, #143 string-constant recovery, beta.10, the denoland/deno#35546 link, and the conditional lift criterion. `diff -rq` source vs `.claude` mirrors: IN SYNC for both skills. |
| (c) PR body + drift.md | PASS | All DoD boxes ticked except S4/IMPL-EVAL (legitimately open pending this verdict). `drift.md` has a dated "PLAN-EVAL fallback lane" entry documenting the OpenHands failure (missing `fastapi`) and the local Claude+Qwen canary that produced the PASS. |
| (d) Commit scope | PASS | `03a1111f` touches only: 2 skill sources + 2 mirrors, run `drift.md`, scanner + scanner test. No product source. |

Evaluator note (own artifact, not a PR finding): the Cycle-1 seeded probe accidentally created an
untracked `packages/mcp/src/version.ts` (the `>>` seed) that `git checkout` could not remove; it was
detected and deleted this cycle, and preflight re-verified green on the clean tree. The Cycle-1 mcp
dry-run incidentally ran with that seeded file present and still passed — live confirmation that
dry-run does not catch this class, which is the premise of the whole fix.

Both Cycle-1 blocking findings are resolved. Findings 3-5 were minor/process and are addressed or
acceptably open (S4 box). **PASS.**
