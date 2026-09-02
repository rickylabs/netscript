# IMPL-EVAL — PASS

GLM 5.3 Flash · `max` · evaluated head `b00ff6f5f` · base `77ad823dc`.
Its Judgment 2 (the box-4 tests are a proxy, not a proof) was acted on: the end-to-end
regression test it specified landed as `a8bb620a3`, verified to fail under the old
`declare global` preamble. Delta over the evaluated head is that test file only.

---

**[PHASE: IMPL-EVAL] — PR #1914 (issue #1892), evaluated head `b00ff6f5f`, trusted base `77ad823dc`. All experiments run in scratch worktrees/probes, reverted cleanly; tree verified pristine at `b00ff6f5f`. No GitHub writes.**

## Verified by reproduction (not by accepting claims)

1. **The 7 dropped diagnostics were real — count reproduced exactly.** On a clean checkout of base `77ad823dc` the gate exits **0** (`deferredCensus={"unboundName":116,"typeError":14}`, enforced census empty) while the base program emits **7 TS2451s at `preamble.ts` locations no example module owns**: `resolveWorkspacePath` ×2 (preambles importing `@netscript/aspire/public` and `@netscript/plugin/adapter`, examples/107 & 252), `createParallelQueue` ×2 (284, 285), `defineService` ×3 (300, 301, 302). Compiler+policy are byte-identical between `0f7fefb6b` and `77ad823dc` (empty diff), so the PR body's "measured on main `0f7fefb6b`: 7" transfers. (My first capture returned 9 — my own artifact: I inserted the leak probe concurrently in the same worktree, which added a third `textArtifact` global → 2 extra collisions. Clean rerun: 7, `textArtifact` absent.)
2. **The enforcement bites.** Reintroducing the base-style `declare global` preamble at HEAD while siblings classified (deferredCensus 116/14): gate exits **1** and prints **`unattributed compiler diagnostics: 7`** listing the same 7 preamble paths. Reverted; tree clean.
3. **The leak is closed, not moved.** No `declare global` binding remains (the committed compiler's single occurrence is the doc comment explaining its removal); preambles are `export {};` only, so double-documented symbols cannot collide. Probe: a temporary `@example` on `textArtifact` referencing `artifactText` (documented by a different example) without importing it — at base: **exit 0, census unchanged 116/14** (silent false-pass via the leaked global); at head: **exit 1, `ratchet failure: deferred unboundName 117 > 116`**, and the probe example itself appears in the deferred output (`textArtifact · example 2 · TS2304`). Deferred-membership diff base→head: 130 entries, only 2 additive code annotations (`ShutdownContext` +TS7031, `withChildSpan` +TS7006) — **no example moved classes**; nobody in the corpus was silently leak-dependent.
4. **The repairs are faithful.** 7 example blocks gained imports, all specifier `@netscript/plugin/adapter` — a real entrypoint in `packages/plugin/deno.json` (`"./adapter": "./src/adapter/mod.ts"`), and all imported names are re-exported from it (`ScaffoldArtifact`, `ScaffoldArtifactBody`, `artifactText`, `textArtifact`, `StubSource`, `TokenValues`, `defineStub`, `substituteTokens`). No example imports an unused name; none of the repaired examples appears in the head deferred corpus. Nit: `void values;` in the `TokenValues` example is slightly unnatural, but it discards rather than silences.
5. **Census and ceilings.** Head gate: PASS, exit 0, `deferredCensus={"unboundName":116,"typeError":14}`, ratchet empty. `JSDOC_EXAMPLE_RATCHET` untouched at `maximumDeferredUnboundName: 116` / `maximumDeferredTypeError: 14`; `git diff 77ad823dc HEAD -- jsdoc-example-policy.ts` is empty.
6. **Scope.** Comment-stripped diff of both `packages/` files between base and head: only blank-line residue inside comment regions — **zero non-comment content change**. Unit tests: `deno task docs:jsdoc-examples:test` → **21 passed, 0 failed**.

## Judgment 1 — the issue #1892 self-edits: legitimate, none moved the goalposts

- **"116/20" → by-reference:** factually correct. PR #1756 contains `56b207e55 "fix(docs): tighten the deferred typeError ceiling from 20 to 14"`; the issue predates the merge (`0f7fefb6b`, 2026-09-02T06:39Z; issue filed 2026-09-01T18:02Z), so the literal was stale by merge time. Stating by reference was the honest fix, not a relaxation.
- **Unwrapping the two boxes:** `acceptanceCheckboxes` parses line-by-line (`body.split(/\r?\n/)`, `text = checkbox[4].trim()`), so a hard-wrapped box silently truncates at the wrap — the acceptance mirror literally cannot carry the full text. Unwrapping restores evidence fidelity; text otherwise unchanged per the body's own note.
- **Fourth box:** matches the 2026-09-01T20:10:44Z scope comment's two added checkboxes in substance, and it *adds* an acceptance obligation (strengthens the issue). One caveat: GitHub's REST API exposes no pre-edit body (no `edited` events), so I could not diff the original text directly; my judgment rests on the body's transparent self-note plus the external facts above — all of which check out.

## Judgment 2 — the unit tests are a proxy, not a proof of the property

`exampleSymbolImport` tests prove only the **generated binding string** is a module-scoped import with no `declare global`. The property "an example referencing another example's documented value fails" additionally depends on that import actually being injected into the example *module* (not the preamble), on `deno check` scoping, and on the TS2304→`unboundName`→census path failing the gate. The string could be identical while the property is false — e.g. if `materializeModules` stopped pushing it into the module header. What proves it is the materialize+check path: I exercised it manually (probe above, gate fails today), but **no test in the repo asserts it**. A genuine regression test would materialize two synthetic blocks (one documenting a value, one referencing it without import), run `compileJsdocExamples`, and assert exit ≠ 0 with the leaking example classified `unboundName`. Recommend codifying that as follow-up.

## Caveats (recorded, not verdict-changing)

- The leak's gate-level failure channel is the **deferred-class ceiling at exactly zero slack** (116=116). A new leaking example fails only while the ceiling sits at the census; the diagnostic itself is deferred, never enforced. Combined with `unattributedDiagnostics` (hard-fail for non-module diagnostics) the hole is closed, but box 4's "fails" is satisfied via ratchet, not via enforced error.
- `unattributedDiagnostics` requires the `at path:line:col` shape; a fatal diagnostic without it (config/lock abort) still evades it, though the zero-classified case remains covered by `unclassifiedCompilerFailure`.
- PR body says "measured on main `0f7fefb6b`"; the actual base is `77ad823dc` — loose labeling, immaterial (verified identical).

---

**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

Evaluated head `b00ff6f5f` against base `77ad823dc`. Every claimed number reproduced: 7 dropped base TS2451s (base gate exit 0), enforcement probe exit 1 with `unattributed compiler diagnostics: 7`, leak probe passing at base / failing at head (`unboundName 117 > 116`), head census `{"unboundName":116,"typeError":14}` with ratchet empty, ceilings 116/14 untouched, `jsdoc-example-policy.ts` unmodified, zero non-comment `packages/` changes, 21/21 unit tests. Issue self-edits judged legitimate housekeeping with verified factual basis; the fourth box's regression-test demand is currently met only by proxy — the property itself was verified true end-to-end by this evaluation's probe, and codifying that probe as an integration test is the recommended follow-up.