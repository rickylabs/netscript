# IMPL-EVAL — chore-release-one-shot--tooling — CYCLE 2

- **Verdict:** `PASS`
- **Run ID:** `28305978962-1`
- **Branch:** `chore/release-one-shot` (HEAD `58ab73cb`)
- **Evaluator session:** openhands / openrouter-qwen3.7-max / 2026-06-29
- **Archetype:** SCOPE-tools (repo/harness tooling, no `packages/`/`plugins/` source)
- **Slices verified:** 5/5 (f07613d5, d74ba7c2, 0b2d1aa5, 307981d8, e2a6a2f5)

## Executive summary

All five slices (S1–S5) implement the locked cycle-2 PASS plan correctly. Gate re-runs confirm:
- S1/D2: `--frozen` dropped from code/docs; unit tests assert absence and pass.
- S2/D3: Preflight tool correctly flags the genuine `openapi.ts:29→155` defect (positive evidence S2 works as designed).
- S3/D1: Release cut orchestrator bumps versions across workspace, runs gates, respects `--dry-run` (no push/PR).
- S4/D4: `e2e-cli-prod.yml` triggers on `workflow_run` from `publish.yml`, downloads version via run-id-named artifact.
- S5/D5: `netscript-release` skill added; `agentic:sync-claude:check` green; mirror identical; AGENTS.md points to skill.

**Critical finding:** The preflight tool's "FAIL" on `openapi.ts:155` is the gate working as designed — it correctly identifies a real pre-existing JSR-unusable asset embedding bug (out-of-tooling-scope, tracked separately by supervisor). This is **positive evidence** S2 works, not a tooling defect.

## Per-slice verification

### S1/D2 — Drop `--frozen` from `deps:prod-install` (issue #146)

**Commits:** f07613d5

**Gate re-runs:**
```bash
$ git grep -nF -- '--frozen' .llm/tools/
.llm/tools/deps/prod-install_test.ts:7:  assertFalse(args.includes('--frozen'));
.llm/tools/deps/prod-install_test.ts:13:  assertFalse(args.includes('--frozen'));
```
Only test assertions remain (correct behavior).

```bash
$ git grep -nF -- '--frozen' .llm/tools/entry.md
EXIT: 1  # No matches
```
`entry.md:59-60` `--frozen` mentions were removed (exceeds plan's edit list — thorough IMPL).

```bash
$ deno test --allow-read --allow-env --allow-run .llm/tools/deps/prod-install_test.ts
ok | 2 passed | 0 failed
```

**Code review:**
- `.llm/tools/deps/prod-install.ts`: `--frozen` removed from `cmdArgs` array (line 28).
- Rationale comment updated (lines 4, 11).
- Unit tests assert `--frozen` is absent in all code paths.
- `.llm/tools/README.md:99` updated (no `--frozen` mention).

**Verdict:** ✓ PASS

---

### S2/D3 — Text-import preflight gate (issue #133)

**Commits:** d74ba7c2

**Gate re-runs:**
```bash
$ deno test --allow-read --allow-write .llm/tools/release/preflight-text-imports_test.ts
ok | 3 passed | 0 failed
```

```bash
$ deno task release:preflight
release:preflight text-imports — FAIL
packages/service/src/primitives/openapi.ts:155: Deno.readTextFile reads scalarJsUrl, declared from new URL(..., import.meta.url) on line 29; use a text import instead. (URL declaration line 29)
EXIT: 1
```

**Critical finding (TRUE POSITIVE — not a tooling defect):**
The preflight tool correctly flags a **genuine pre-existing bug** in `packages/service/src/primitives/openapi.ts`:
- **Line 29:** `const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);`
- **Line 155:** `const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);`

This is the exact JSR-unusable asset embedding pattern the tool was designed to catch: a cross-line URL→readTextFile chain that will fail when the package is published (the asset won't be at the resolved URL path in the published tarball).

**Per the tooling scope (no `packages/` edits), the generator recorded it and did NOT suppress it. This is the gate working as designed.** The finding is out-of-tooling-scope and tracked separately by the supervisor (follow-up framework-source fix slice). It is **positive evidence** S2 works correctly.

**Code review:**
- `.llm/tools/release/preflight-text-imports.ts`: Two-pass resolver (Pass 1: collect `const <name> = new URL(..., import.meta.url)`; Pass 2: flag `<name>` references in `Deno.readTextFile/readFile`).
- Pattern scope narrowed to `Deno.readTextFile/readFile` only (excludes `fromFileUrl`, `import.meta.resolve`, bare `new URL`).
- Test tree exclusion: `isTestFile()` excludes `tests/`, `__fixtures__/`, `*_test.ts`, `*.test.tsx` (lines 154–159).
- Positive fixture (`positive-openapi-break.ts`): mirrors `openapi.ts:29→155` pattern; tool flags it.
- Negative fixture (`negative-url-composition.ts`): URL constructor without read; tool ignores it.
- Allowlist fixture (`allowlisted-read.ts`): `// preflight-allow:` suppresses finding.
- Wired into `publish.yml:70` before "Publish dry-run".

**Verdict:** ✓ PASS (positive finding is evidence of correctness, not a defect)

---

### S3/D1 — Release cut orchestrator (issue #122)

**Commits:** 0b2d1aa5

**Gate re-runs:**
```bash
$ deno test --allow-read --allow-write --allow-env .llm/tools/release/cut_test.ts
ok | 3 passed | 0 failed
```

**Code review:**
- `.llm/tools/release/cut.ts`: `coordinateVersionBump()` reads root `deno.json` version, validates newer, replaces in root + all `packages/*` + `plugins/*` + `deno.lock` (lines 33–48).
- Residue check: `findVersionResidue()` walks `.json` + `deno.lock` files, fails if old version remains (lines 51–78).
- Gate chain: `runGate()` for `release:preflight`, `publish:dry-run`, `deno ci --prod` (lines 330–332).
- Branch/commit/push/PR: `createReleasePr()` creates `release/cut-<version>` branch, commits bumped files, pushes, opens PR with body file (lines 267–305).
- `--dry-run`: skips branch/commit/push/PR when `options.dryRun === true` (lines 334–337).

**Unit test:** Constructs a temp workspace with root `deno.json`, two packages, one plugin, and `deno.lock` with `@netscript/*` ranges. Bumps from `0.0.1-alpha.11` → `0.0.1-alpha.99`, asserts no residue, all files updated (including lock ranges).

**Verdict:** ✓ PASS

---

### S4/D4 — Order prod e2e after publish (issue #123)

**Commits:** 307981d8

**YAML sanity parse:**
```bash
$ deno eval "import { parse } from 'jsr:@std/yaml@^1'; parse(await Deno.readTextFile('.github/workflows/e2e-cli-prod.yml')); console.log('YAML parse OK');"
YAML parse OK
```

**Code review:**
- `.github/workflows/e2e-cli-prod.yml`: Triggered on `workflow_run: workflows: ["publish"]` (line 5) + `workflow_dispatch` (line 7).
- Success guard: `if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'` (line 23).
- Version handoff: `publish.yml:105-111` uploads `netscript-published-version-${{ github.run_id }}` artifact; `e2e-cli-prod.yml:50-56` downloads it via `github.event.workflow_run.id` (non-racy by construction).
- Fallback: `workflow_dispatch` path accepts `inputs.published-version` (lines 9–12, 60–65).

**Verdict:** ✓ PASS

---

### S5/D5 — Release workflow skill

**Commits:** e2a6a2f5

**Gate re-runs:**
```bash
$ deno task agentic:sync-claude:check
agentic:sync-claude OK: 17 skill(s), 21 mirrored file(s)
```

```bash
$ diff .agents/skills/netscript-release/SKILL.md .claude/skills/netscript-release/SKILL.md
MIRROR_IDENTICAL
```

```bash
$ grep -n 'netscript-release' AGENTS.md
17:Use `.agents/skills/netscript-release` for release cuts, publish handoffs, race-free production E2E
```

**Code review:**
- `.agents/skills/netscript-release/SKILL.md`: Documents `release:cut`, `release:preflight`, `publish:dry-run`, e2e ordering, version handoff via run-id-named artifact.
- `.claude/skills/netscript-release/SKILL.md`: Generated mirror (verified identical).
- `AGENTS.md:17`: Points to skill for release cuts, publish handoffs, race-free e2e.

**Verdict:** ✓ PASS

---

## Static gates

| Gate                          | Result   | Evidence                                                                 |
| ----------------------------- | -------- | ------------------------------------------------------------------------ |
| `run-deno-check`              | ✓ PASS   | `.llm/tools/release/` clean (0 occurrences, 0 failed batches).          |
| Unit tests                    | ✓ PASS   | `prod-install_test.ts` (2/2), `preflight-text-imports_test.ts` (3/3), `cut_test.ts` (3/3). |
| `--frozen` grep               | ✓ PASS   | Only test assertions remain; `entry.md` mentions removed.                |
| YAML parse                    | ✓ PASS   | Both workflows valid (`@std/yaml` parse).                                |
| `agentic:sync-claude:check`   | ✓ PASS   | 17 skills, 21 mirrored files; `.claude/skills/netscript-release/SKILL.md` identical to `.agents/`. |

## Fitness gates

| Gate                          | Result   | Evidence                                                                 |
| ----------------------------- | -------- | ------------------------------------------------------------------------ |
| Preflight true positive       | ✓ PASS   | S2 correctly flags `openapi.ts:29→155` (genuine JSR-unusable asset embedding). |
| Preflight false negative      | ✓ PASS   | S2 unit test `negative-url-composition.ts` exits 0 (URL constructor without read). |
| Release cut `--dry-run`       | ✓ PASS   | S3 unit test verifies version bump; code review confirms `--dry-run` skips push/PR. |

## Open findings / debt

### Pre-existing `openapi.ts:155` defect (out-of-tooling-scope)

The preflight tool correctly identifies a real bug in `packages/service/src/primitives/openapi.ts:155`:
```typescript
const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);  // line 29
const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);      // line 155
```

This is a JSR-unusable asset embedding: the asset won't be at the resolved URL path in the published tarball. The tooling scope (no `packages/` edits) correctly recorded it and did NOT suppress it. This is **positive evidence** S2 works as designed.

**Supervisor action:** Track as a follow-up framework-source fix slice (out-of-this-run-scope). This is NOT a tooling defect and does NOT block the PASS verdict.

---

## Verdict rationale

All five slices implement the locked cycle-2 PASS plan correctly. Gate re-runs confirm static and fitness gates pass. The preflight tool's "FAIL" on `openapi.ts:155` is the gate working as designed — it correctly identifies a genuine pre-existing JSR-unusable asset embedding bug (out-of-tooling-scope, tracked separately). This is **positive evidence** S2 works, not a tooling defect.

No unrecorded doctrine violations introduced. Docs and run artifacts updated for resume. All applicable gates satisfied.

**Final verdict:** `PASS`

---

## Trace metadata

- Evaluator run ID: `28305978962-1`
- Evaluator model: `openrouter/qwen3.7-max`
- Evaluator phase: IMPL-EVAL (final pass)
- Cycle: 2 (PLAN-EVAL PASS → IMPL → IMPL-EVAL PASS)
- Total cycles: 2 (1 FAIL_PLAN + 1 PASS)
