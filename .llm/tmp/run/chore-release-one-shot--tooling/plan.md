# plan.md — One-shot deterministic release automation

Run-id: `chore-release-one-shot--tooling`. Branch: `chore/release-one-shot` off **origin/main**.
Archetype: repo/harness tooling (no `packages/`/`plugins/` source). Lane: WSL Codex daemon-attached.
Scope: SCOPE-tools (CI workflows + `.llm/tools/` + a new skill). Folds #122, #123, #133, #146.

> **PLAN-EVAL cycle 1 = `FAIL_PLAN`** (OpenHands minimax-M3, run 28304587059). D1/D2/D4/D5/D6 +
> scope/lane/slices/gates **PASS**; sole blocker **D3** (text-import preflight): pattern set was both
> over-broad (flagged URL/path *constructors*, ~21 false positives) and under-broad (line-by-line scan
> misses the real cross-line break `openapi.ts:29 const url=new URL(...) → :155 Deno.readTextFile(url)`).
> **Cycle-2 revision below:** D3 narrowed to `Deno.readTextFile/readFile` only + a **two-pass cross-line**
> resolver + a positive fixture mirroring `openapi.ts:29→155`. Folded the 3 non-blocking clarifications
> (D4 artifact version handoff, D5 `agentic:sync-claude`, D2 exact file list).

## Goal

A release becomes: **read the release skill → run ONE gated command → merge → CI publishes + verifies
race-free**. No supervisor-improvised scripts, no manual root/lock edits, no publish/e2e trial-and-error.

## Design (LOCKED decisions)

### D1. `deno task release:cut -- <version>` — the one local command
New `.llm/tools/release/cut.ts`. Steps, in order, fail-fast:
1. Validate `<version>` (semver incl. prerelease, e.g. `0.0.1-alpha.12`); refuse if equal/older than
   current root version.
2. **Workspace-coordinated bump (#122):** set version in root `deno.json`, every
   `packages/*/deno.json`, every `plugins/*/deno.json`, and rewrite `deno.lock` `@netscript/*` ranges
   to the new version. Reuse the existing per-member `deno bump-version` where it already works;
   ADD the root-`deno.json` write + the `deno.lock` `@netscript/*` in-place range rewrite (the two
   gaps). No `deno cache --reload`; no lock deletion.
3. **Residue check:** `git grep -nE '<old-version>'` across `*.json` + `deno.lock` must be empty;
   abort otherwise.
4. **Gates (reuse + new):** run, in order — `release:preflight` (text-import scan, D3),
   `publish:dry-run` (existing per-member), `deno ci --prod` (D2 fix). Any non-zero → abort, no branch.
5. Create branch `release/cut-<version>`, stage ONLY the bumped version files by explicit path,
   commit `chore(release): cut <version>`, push `HEAD:refs/heads/release/cut-<version>`, open PR via
   `gh pr create --body-file`. Print the PR URL + the post-merge instructions.
6. `--dry-run` flag: do everything except branch/commit/push/PR (for tests + the eval).

### D2. Fix `deps:prod-install` (#146)
Remove `--frozen` from the args (`['ci','--prod']`). Deno 2.9 `deno ci` is already frozen and rejects
the flag. Exact edit sites: `.llm/tools/deps/prod-install.ts:28` (the arg array) + the rationale
comment at `prod-install.ts:6–7`, and `.llm/tools/README.md:99` (drop the `--frozen` mention). Add/
repair the wrapper's unit test to assert the arg list has no `--frozen`.

### D3. Text-import preflight gate (#133) — REVISED cycle 2
New `.llm/tools/release/preflight-text-imports.ts` + `deno task release:preflight`. Static scan of
publishable members (name set, `publish !== false`; source `.ts`/`.tsx` only) that flags **bundled-asset
reads** — i.e. `Deno.readTextFile(<arg>)` / `Deno.readFile(<arg>)` whose argument resolves to an
`import.meta`-relative path. Encodes the locked rule "JSR-safe asset embedding = text imports".

- **Pattern set (NARROWED):** match ONLY `Deno.readTextFile(` and `Deno.readFile(` call sites. Do
  **NOT** flag `fromFileUrl(`, `import.meta.resolve(`, or bare `new URL(..., import.meta.url)` — those
  are URL/path **constructors**, not reads (~21 legitimate hits in `packages/`+`plugins/`: openapi HTTP
  URL composition, fresh route module IDs, test-fixture path constants). Flagging them is pure noise.
- **Two-pass cross-line resolver (the real defect class):** the historical prod-CLI break is
  `packages/service/src/primitives/openapi.ts:29` `const scalarJsUrl = new URL('../../assets/scalar.min.js', import.meta.url)`
  → `:155` `await Deno.readTextFile(scalarJsUrl)` — the URL is declared on one line and read on another,
  so a line-by-line scan misses it. **Pass 1:** within each file, collect identifiers assigned from
  `new URL(<literal>, import.meta.url)` (and direct `fromFileUrl(new URL(..., import.meta.url))`).
  **Pass 2:** flag any `Deno.readTextFile(<id>)` / `Deno.readFile(<id>)` whose `<id>` is in that set,
  AND any inline `Deno.readTextFile(new URL(..., import.meta.url))`. Report `file:line` of the READ
  (and the URL-decl line). Exit non-zero on any flag.
- **Fixtures:** a POSITIVE fixture mirroring `openapi.ts:29→155` (URL declared one line, read another) —
  the tool MUST flag it; a NEGATIVE fixture with `new URL(...,import.meta.url)` used for HTTP/module-id
  composition (never read) and a text-import (`with { type: 'text' }`) read — the tool must NOT flag.
- **Allowlist:** legitimate non-asset FS reads in publishable surface use an explicit inline annotation
  (`// preflight-allow: <reason>` on the read line). Keep it tight; the narrowed pattern set should make
  the allowlist nearly empty (no broad ignore globs).

Wire into BOTH `cut.ts` (step 4) AND `publish.yml` (a step before "Publish dry-run").

### D4. e2e-cli-prod ordering (#123)
`.github/workflows/e2e-cli-prod.yml`: REPLACE the concurrent `on: release: published` with
```yaml
on:
  workflow_run:
    workflows: ["publish"]
    types: [completed]
  workflow_dispatch:
    inputs: { published-version: ... }   # keep manual path
```
Add a job-level guard `if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}`.
**Version handoff (REVISED cycle 2 — pin it, don't parse refs):** `publish.yml` writes the published
version to `version.txt` and `actions/upload-artifact`s it; `e2e-cli-prod.yml` `actions/download-artifact`s
that artifact from the triggering run (`github.event.workflow_run.id`) and reads the version — a
deterministic, non-racy lookup instead of inferring from `head_branch`/tag. The `workflow_dispatch` path
keeps reading `inputs.published-version`. Net effect: e2e-cli-prod runs only AFTER publish succeeds, on
exactly the version it published — no JSR race, no ref-parse fragility. Validate YAML with `actionlint`.

### D5. Release skill
New `.agents/skills/netscript-release/SKILL.md`, then **regenerate the mirror with
`deno task agentic:sync-claude`** and gate it with `deno task agentic:sync-claude:check` (NEVER
hand-edit `.claude/skills/` — it is generated). Documents end-to-end: pre-reqs, the single
`release:cut` command, what each gate proves, the merge → tag/GitHub-Release → publish.yml(OIDC) →
race-free e2e-cli-prod verify flow, the #122/#123/#133/#146 rationale, and rollback. Cross-link
`netscript-deno-toolchain` (toolchain map) and `netscript-pr`. AGENTS.md "release work" pointer
updated to name this skill.

### D6. Non-goals
- Do NOT move publishing into a local `deno publish` (keep the GitHub-Release-triggered OIDC model).
- Do NOT auto-create the tag/Release from `release:cut` (merge gates the Release; a follow-up may add
  an optional `release:tag` helper, out of scope here).
- No new type casts; only 2 accepted repo-wide casts unchanged.

## Slices (commit-by-slice)
- S1: D2 prod-install `--frozen` removal + test. (smallest, unblocks the gate)
- S2: D3 preflight-text-imports tool (two-pass cross-line resolver, narrowed `readTextFile/readFile`
  pattern) + task + positive(`openapi.ts:29→155`-style)/negative fixtures + publish.yml wiring.
- S3: D1 release:cut orchestrator (bump coordinator: root+members+lock) + task + unit test + `--dry-run`.
- S4: D4 e2e-cli-prod workflow_run gating.
- S5: D5 release skill + AGENTS.md pointer + .claude mirror.

## Gates (per slice + final)
- `.llm/tools/run-deno-check.ts --root .llm/tools --ext ts` (+ `--unstable-kv` if workspace types).
- New unit tests: bump coordinator (root+members+lock all updated; residue empty), preflight
  (positive+negative fixtures), prod-install arg-list.
- `deno task release:cut -- 0.0.1-alpha.99 --dry-run` proves bump+residue+gates path without push.
- `deno run ... run-deno-lint.ts` + `run-deno-fmt.ts` on changed files (ts only).
- `actionlint .github/workflows/e2e-cli-prod.yml publish.yml` (if available) for D4.
- #123 live proof deferred to the next real cut (alpha.12).

## Evaluator
- PLAN-EVAL: OpenHands minimax-M3 (separate session), reads research.md + plan.md + this Design.
  Hard gate — no Codex slice before PASS.
- IMPL-EVAL: OpenHands qwen3.7-max (separate session) after all slices.

## Risks / debt / follow-ups
- **D3 cross-line miss class** (e.g. `openapi.ts:29 → 155`): mitigated by the two-pass scan + the
  cross-line positive fixture. If a future read indirects through more than one assignment hop, the
  resolver may miss it — fixture coverage is the guardrail; record any escape as debt.
- **D3 false-positive risk**: narrowed pattern set keeps the allowlist near-empty; if CI noise appears,
  tighten the read-arg resolution, do NOT widen broad ignore globs.
- The first cut AFTER this lands (alpha.12) is the live verification of D1 (no manual edits) + D4
  (no race, artifact version handoff). Record the outcome.
