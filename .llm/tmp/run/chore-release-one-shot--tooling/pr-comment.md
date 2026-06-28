**[PHASE: PLAN-EVAL] [VERDICT: APPROVED]**

PLAN-EVAL cycle 2 — `chore/release-one-shot--tooling` — verdict **PASS** (run 28305083715-1).

The cycle-2 revision correctly addresses all three required cycle-1 fixes (D3 pattern narrowing,
D3 two-pass cross-line resolver + positive fixture, D3 risk register entry) and folds all three
optional clarifications (D4 artifact version handoff, D5 `agentic:sync-claude`, D2 exact edit
sites). No regression on cycle-1 PASS items.

### D3 re-assessment (the load-bearing decision)

- **Pattern set NARROWED** — match ONLY `Deno.readTextFile(` / `Deno.readFile(` call sites.
  `fromFileUrl(`, `import.meta.resolve(`, bare `new URL(..., import.meta.url)` are explicitly
  excluded (URL/path constructors, not reads). The ~21 constructor hits on `main` are out of scope.
- **Two-pass cross-line resolver PINNED** — Pass 1 collects `const <name> = new URL(<literal>,
  import.meta.url)` (and direct `fromFileUrl(new URL(..., import.meta.url))`). Pass 2 flags
  `Deno.readTextFile(<name>)` / `Deno.readFile(<name>)` AND inline `Deno.readTextFile(new
  URL(..., import.meta.url))`. Catches `openapi.ts:29 → 155` (`scalarJsUrl` → read) correctly.
- **POSITIVE fixture** mirrors `openapi.ts:29 → 155` (URL declared one line, read another) — tool
  MUST flag it. **NEGATIVE fixture** covers bare URL for HTTP/module-id composition + text-import
  `with { type: 'text' }` read — tool must NOT flag. Correct test design.
- **Allowlist TIGHT** — inline `// preflight-allow: <reason>` annotation per line. No broad
  ignore globs. The narrowed pattern set should make the allowlist nearly empty.
- **Wiring DOUBLE-GATED** — BOTH `cut.ts` (step 4) AND `publish.yml` (a step before
  "Publish dry-run"). No single point of failure.
- **Risk register POPULATED** — D3 cross-line miss class (multi-hop indirection, fixture coverage
  is the guardrail) + D3 false-positive drift (tighten the resolver, don't widen broad globs) +
  alpha.12 follow-up (live verification of D1 + D4).

### Clarifications folded correctly

- **D4 artifact handoff** — `publish.yml` writes `version.txt` and `actions/upload-artifact`s it;
  `e2e-cli-prod.yml` `actions/download-artifact`s from the triggering run via
  `github.event.workflow_run.id`. Non-racy by construction. `workflow_dispatch` path keeps
  `inputs.published-version`. ✓
- **D5 `agentic:sync-claude`** — explicit `deno task agentic:sync-claude` + gated by
  `deno task agentic:sync-claude:check` (NEVER hand-edit `.claude/skills/`). Both tasks exist in
  `deno.json:51-52`. ✓
- **D2 exact edit sites** — `.llm/tools/deps/prod-install.ts:28` (arg array) + the rationale
  comment at `prod-install.ts:6–7` + `.llm/tools/README.md:99`. Minor line-ref drift on `:6–7`
  (explicit `--frozen` mentions are on lines 4 and 11; the block ref is approximately right and
  IMPL-discoverable). ✓

### Spot-checks against current `main`

- `openapi.ts:29` — `const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url);` ✓
- `openapi.ts:155` — `const scalarJs = scalarJsCache ?? await Deno.readTextFile(scalarJsUrl);` ✓
- `prod-install.ts:28` — `const cmdArgs = ['ci', '--prod', '--frozen'];` (D2 fix → `['ci', '--prod']`) ✓
- `README.md:99` — `--frozen` mention present (D2 fix removes it) ✓
- `agentic:sync-claude` + `agentic:sync-claude:check` tasks exist in `deno.json:51-52` ✓
- Publishable members (excl. e2e): cli, fresh, fresh-ui, aspire, config, database, plugin,
  runtime-config, service, watchers, triggers ✓

### Scope / lane / slices / gates

- **Scope**: harness tooling only (SCOPE-tools). No `packages/`/`plugins/` framework code.
  WSL Codex implementation lane is correct.
- **Slices**: 5 total, independently committable. S2 expanded to enumerate fixtures and pattern
  narrowing.
- **Gates**: run-deno-check + lint + fmt + unit tests + `release:cut --dry-run` proof + actionlint
  + IMPL-EVAL.
- **No regressions** on cycle-1 PASS items.

### IMPL notes (not blocking, but worth flagging)

1. `entry.md:59-60` also has `--frozen` mentions (per-script detail page). Plan does not list it.
   The IMPL session should `git grep -nF -- '--frozen' .llm/tools/` after the slice to confirm zero
   remaining mentions.
2. "Source `.ts`/`.tsx` only" is interpretable as files reachable from `exports:`, files outside
   `tests/`, or all `.ts`/`.tsx`. Pick the option that excludes test fixtures with inline-form
   `Deno.readTextFile(new URL(...))` (e.g., `readme-examples_test.ts:3`).
3. Multi-hop indirection (`const x = new URL(...); const y = x; readTextFile(y)`) is the documented
   risk-register limit; one-hop covers the production defect class.
4. Consider a versioned artifact name like `netscript-published-version-<run-id>` for D4.

### Next

- Run progresses to **IMPL** lane. IMPL session: Codex daemon-attached, WSL, with the 5 slices
  (S1 smallest first, S2 second). Each slice ends with its named proving gate. Final gate is the
  IMPL-EVAL session (qwen3.7-max, separate from this evaluator session).