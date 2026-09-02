# IMPL-EVAL cycle 2 — #1863 / PR #1865

**Provenance note (supervisor).** The evaluator session wrote its raw stream-JSON transcript to this
path (6.5 MB) instead of a verdict document, and correctly declined to overwrite what it found here.
The transcript was never committed. This file is the evaluator's own final report, extracted verbatim
from the terminal `result` record of that session; the transcript itself is discarded as noise.

Cycle 2 judges `ca9c25ec3` and is **corroboration** of the cycle-1 verdict recorded in `eval.md`,
not the gating verdict. See `eval.md` for cycle 1.

---

The pre-existing `impl-eval-verdict.md` contains 6.1MB of session-JSON noise, not a verdict scaffold — I didn't create it and won't overwrite it; flagging instead. All verification items are complete. Final report:

---

# IMPL-EVAL Report — #1863 / PR #1865 @ `ca9c25ec3`

## 1. CAUSE — CONFIRMED

- `git show 1f50c98ce` (#1837) on `generate-register-plugins.ts` shows the exact rename:
  `- lines.push(\`  // --- ${name} ---\`)` → `+ lines.push(\`  // --- plugin ${pluginIndex} ---\`)`. HEAD `generate-register-plugins.ts:64` emits the ordinal form.
- The old literal `'  // --- workers-api ---'` cannot match that output (no name-form comment is emitted anywhere in pass 1 or pass 2).
- `1f50c98ce`'s file list contains **no** `flow-b`/`prepare-flow-b-fixture` path — the consumer was not updated alongside #1837. Pre-fix consumer at `17349ab18:117-128` keyed on `indexOf('  // --- workers-api ---')` with a `'  // --- '` end bound.

## 2. LOCATOR SOUNDNESS — CONFIRMED (all four claims)

Verified by reading `locate-workers-resource-block.ts` and by a 41-case attack harness (`/tmp/eval-attacks/attack.ts`) run against it:

- **(a) same-identifier requirement** — identifier captured from the creation (line 44, group 1) and spliced into the registration pattern (line 58). Exercised: wrong-identifier registration rejected (G2), `set('streams-api', resource)` name-mismatch rejected (G3), `$`-identifier matched (I2), real background output binds `workers→workers` (B2).
- **(b) ambiguity rejected, not position-resolved** — `creations.length !== 1` throws (lines 48-53). Exercised: two creations → `found 2` (G1); duplicate registrations → `found 2` (G4).
- **(c) span holds exactly one creation + one registration** — literal-count guard (lines 77-82). Exercised: sibling created+registered inside the span → rejected (F1); real-output spans count 1/1 with no sibling bleed in both orders (A2/A3, C-*, B1-B4).
- **(d) quote-agnostic** — per-anchor `(['"])…\N` backreferences. Exercised: mixed double-creation/single-registration (H1), all-double (H2), plus real output in both quote styles (plugins `JSON.stringify` double vs background single — A4/B1).

## 3. TRY TO BREAK IT — CONFIRMED robust; one non-blocking limitation

40/41 harness cases behaved as required. Highest-value attack (both `workers` and `workers-api` in one registry) does **not** confuse them — closing-quote anchoring defeats prefix/substring matching in both directions, on **real generator output** (A1-A8, B1-B4, I3-I5) and hand-written variants. `plugins.get('workers-api')` references are never accepted as registrations (E1/E2, D0-D2 on real pass-2 output). Registry-name suffixing (`xplugins.set`) rejected (K2). Comment-lines never match (J3 — `^[ \t]*const` anchor).

- **Non-blocking limitation (F2):** the containment guard (lines 78-79) counts *literal* `builder.addExecutable(` / `plugins.set(`. A hypothetical generator that emits a sibling with a split method chain (`builder\n  .addExecutable(`) *and* interleaves it between the workers creation and registration would be swallowed silently. Not reachable from current generators (blocks are contiguous and single-line; the realistic interleaving is caught by F1). Worth a hardening note, not a blocker.
- Harness note: my one "failure" (J2) was my own wrong expectation — JS `$` matches before `\r`, so a CRLF variant of the *exact* statement is accepted; benign (all anchors still required).

## 4. TESTS NOT VACUOUS — CONFIRMED, with one acknowledged non-discriminator

Real-output claim verified: test 1 builds from `generateRegisterPlugins({streams-api, workers-api, sagas-api})` — workers-api genuinely between siblings, asserting the name marker is absent and `// --- plugin 1 ---` present (`locate-workers-resource-block_test.ts:31-50`); test 2 from `generateRegisterBackground({streams, workers, triggers})` (:52-72). I then ran the **old comment-keyed locator (verbatim `17349ab18:117-128` logic)** against each HEAD test's input (`/tmp/eval-attacks/vacuity.ts`):

| Test | On old implementation |
| --- | --- |
| T1 real plugins between siblings | **FAILS-ON-OLD** (throws marker-missing) — true discriminator |
| T2 real background output | **WOULD-PASS-ON-OLD** — non-discriminating, but explicitly acknowledged in the test's own comment (:74-80) and compensated by T3 |
| T3 renamed-background (#1837 simulation) | **FAILS-ON-OLD** — the background discriminator |
| T4 no-workers (negative) | Both throw; discriminates only via the `'found 0'` message substring |
| T5-T8 negatives | Both throw; discriminate only via asserted message substrings (`found 0` / `registration anchor` / `found 2`) |

So the only pure would-pass-on-old test is T2, which the PR and the test file both call out and cover with T3. Ambiguity (T7) and wrong-identifier (T8) hit **genuinely different code paths**: creation-count check (locator lines 47-53) vs registration-count check (lines 61-67), distinct messages confirmed by execution (G1 `found 2` vs G2 `registration anchor`).

## 5. BACKGROUND MIGRATION IS REAL — CONFIRMED

- `generate-register-background.ts:110-112` emits `const ${id} = builder.addExecutable('${name}', …)` and `:237` emits `backgroundProcessors.set('${name}', ${id});` — both anchors exist (id = `safeIdentifier('workers')` = `workers`). The PR's Correction section cites exactly `:111`/`:237`.
- `prepare-flow-b-fixture.ts:305` uses `locateWorkersBackgroundBlock(registerBackground)`; grep shows the file's only `// ---` occurrences are prose in the explanatory comment (:121-125) — **zero comment-keyed locator logic remains**.
- The earlier d74815c55 "coupling guard" test (which asserted the name comment must keep existing) is **removed**; replaced by the rename-simulation test.

## 6. RED IS GENUINE — CONFIRMED (one nuance)

- `git show --stat 1d045b04c`: 1 file, 91 insertions, test file only. Parent `17349ab18`, child `142d8ede0` (the product fix) — red committed alone against unchanged product code, and it is an ancestor of HEAD.
- Executed at that commit (tree extracted to `/tmp/eval-red-1d04` via `git archive`, repo untouched): **0 passed / 3 failed, exit 1**.
- Nuance: the red manifests as `Module not found …locate-workers-resource-block.ts` (the module didn't exist yet), and the red commit's three tests were later rewritten into the final real-generator-output tests. The shipped tests' behavioral red is nonetheless independently proven by the old-locator simulation (T1/T3 FAILS-ON-OLD above).

## 7. SWEEP HONESTY — CONFIRMED

Re-ran the sweep across `packages/cli` (all extensions): the only remaining string-literal comment consumer outside generators/tests is `prepare-readiness-fixture.ts:213` — exactly as the PR table states. The fourth row is real: `service-environment_test.ts` `pluginBlock()` keys on a semantic `plugins.set(…, resource)` end anchor plus `lastIndexOf('  // --- plugin ', …)` — migrated by #1837 (its stat shows that file). `prepare-readiness-fixture.ts` is genuinely **tolerant-leaning and fails loud**: it finds the app block by the semantic `APP_REGISTRATION_PATTERN` (`apps.set('name', id)`, :171-172) and uses `'  // --- app '` only for block extent; a comment redesign makes `lastIndexOf` return −1 → throws (:217), never silent mis-selection — and the current apps generator emits `  // --- app ${appIndex} ---` (:72), which the prefix matches. `package-backed-plugin-doctor-fixture.ts` (also reads `register-plugins.mts`) only checks file existence — correctly not listed. No missed consumers.

## 8. TIER-A — CONFIRMED (true numbers)

- `deno test --allow-all packages/cli/e2e/tests/`: **211 passed / 0 failed** (4s) at `ca9c25ec3`. (PR claims 210 at `8c9c02cc1`; my count at the exact judged head is 211 — all green either way.)
- `deno lint` on the three touched files: clean. `deno fmt --check` on the three: clean.
- `deno.lock` not in the diff.

## 9. HONESTY — CONFIRMED

- Diff vs merge-base `b66e52cbc`: exactly **3 source files** (locator +114 new, consumer 39 changed, test +191 new) plus 7 `.llm/runs/**` docs — no other product source, no lockfile.
- The PR body explicitly voids the `340afa724` receipt ("explicitly **not claimed**", body lines 93-98) — it does not carry it.
- `check:mcp-export-corpus` staleness independently reproduced: exit 1 ("MCP export-surface corpus is stale") on a clean `git archive` of `b66e52cbc` **and** at this head — pre-existing on main, as claimed.
- **Anomaly (surfaced, not acted on):** `.llm/runs/fix-flow-b-fixture-plugin-marker--1863/impl-eval-verdict.md` (untracked, pre-existing) contains ~6.1MB of harness session-init JSON rather than a verdict document. I did not overwrite it since I didn't create it and its contents contradict its purpose — the harness owner should inspect/reset it.

**Blocking findings: none.** Two non-blocking notes: the F2 literal-containment heuristic limitation (§3) and T2's acknowledged non-discrimination (§4). Consumer-level literal replaces inside the located block (`'run', '--config', 'deno.json',` and `backgroundProcessors.set('workers', workers);`) remain, but both are guarded by throw-on-no-op checks (`prepare-flow-b-fixture.ts:145-155, 340-345`) — fail-safe.

PASS_IMPL
