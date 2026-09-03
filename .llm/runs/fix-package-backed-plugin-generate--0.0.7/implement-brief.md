use harness

## SKILL

- `netscript-harness` — run dir, worklog/drift, RED→GREEN discipline, separate-session eval.
- `netscript-cli` — `generate plugins` / `plugin doctor` command surface and project-root contract.
- `netscript-doctrine` — `packages/cli` + `plugins/workers` archetype gates before changing product code.
- `netscript-pr` — PR body/labels/milestone; `Closes #1966` only when acceptance is fully evidenced.
- `netscript-tools` — scoped validation wrappers; durable gate receipts via `.llm/tools/gates/run-gate.ts`.

# Implement brief — #1966 package-backed plugin generation omits workers registry (P0, Canary-8 fix-forward)

Branch `fix/package-backed-plugin-generate` (from `main` `79adb103b`), worktree `007-leaf-1966`.
Generator: Codex `gpt-5.6-sol` · high. Evaluator is a separate opposite-family session (not you).
Run dir: `.llm/runs/fix-package-backed-plugin-generate--0.0.7/`. Issue #1966 holds the canonical
evidence and acceptance list — read it first (`gh issue view 1966`).

## Situation (verified from the prod run log)

- Release `v0.0.7-canary.8`, head `21b952fe7`, child run 33697779870, job 100470315665: 90 PASS / 1 FAIL.
- Sole red gate: `behavior.package-backed-plugin-doctor`
  (`packages/cli/e2e/src/application/gates/scaffold/package-backed-plugin-doctor-fixture.ts`).
  The fixture builds a dedicated root with a `netscript.config.ts` declaring package-backed
  `jsr:@netscript/plugin-workers@0.0.7-canary.8` and `jsr:@netscript/plugin-streams@0.0.7-canary.8`,
  a `workers/jobs/package-backed-job.ts`, then runs the **published** CLI
  (`deno run -A --minimum-dependency-age=0 jsr:@netscript/cli@0.0.7-canary.8 generate plugins --project-root <root>`
  with `cwd: repoRoot`). `generate plugins` exits 0 but
  `.netscript/generated/plugin-workers/job-registry.ts` is never written.
- `plugin doctor` then (correctly) reports: workspace error "Generated registry does not exist …
  Missing generated entry for manifest-discovered source: workers/jobs/package-backed-job.ts" and
  three `@netscript/plugin-workers` registry errors. Doctor is truthful — do NOT weaken it.
- `behavior.live-db-endpoint` (#1962) passed in the same run; this is an independent defect.

## Task (acceptance mirrors #1966)

1. **Reproduce** with the exact published `0.0.7-canary.8` CLI against the fixture root. Build the
   root the same way the fixture does (reuse the fixture module or a copy under the run dir) and
   run the published CLI with `cwd` = repo root (as CI does) AND `cwd` = project root. Record exit
   codes, stdout/stderr, and the resulting `.netscript/generated/**` tree in `worklog.md`.
2. **Determine the truth**: does `generate plugins` resolve the wrong root/cwd (e.g. the resolver
   walks up from `cwd` and finds the repo's own `netscript.config.ts`/`deno.json` rather than
   honouring `--project-root`), or does it skip registry generation for package-backed (`jsr:`)
   plugin specifiers (no local `plugins/workers` workdir)? Start at
   `packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command.ts`,
   the `requireProjectRoot`/`ProjectRootResolver` path, and the workers registry compiler it
   delegates to. Compare against the local-source path that `scaffold.runtime` exercises (green).
   Confirm whether the same defect exists on `main` `79adb103b` source (run the local CLI
   entrypoint the same way) — say so explicitly either way.
3. **RED**: a deterministic regression that fails before the repair — a unit/integration test in
   `packages/cli` (preferred: drive the generate command against a temp project root whose
   `netscript.config.ts` uses package-backed specifiers, with `cwd` ≠ project root) and, if the
   fixture itself is at fault, a fixture-level assertion. One commit, raw failing output in the
   worklog.
4. **GREEN**: fix product or fixture according to the discovered contract. If the product is at
   fault, the fix lives in `packages/cli` (and only if unavoidable in `plugins/workers` CLI
   `compile-registry`). If the fixture is at fault (e.g. it relies on a cwd-relative path), fix the
   fixture and state why the published CLI is correct. Do not add `--project-root` workarounds that
   hide a real resolver bug.
5. Scoped gates at the exact head (see below); PR with `Closes #1966`, labels
   `type:fix area:cli area:plugins priority:p0 gate:e2e orchestrator:fixes status:impl ci:full`,
   milestone `0.0.7`, non-draft as soon as RED+GREEN are pushed so hosted tiers run. Post a
   phase summary comment; leave DoD boxes that need hosted/eval evidence unticked and say so.

## Ceiling

`packages/cli/**` (src + e2e + tests), `plugins/workers/**` only if the registry compiler is the
root cause, and the run dir. No `deno.json`/catalog/`deno.lock` changes, no `.github/` changes, no
release refs, no `plugin doctor` behaviour changes. Never run the hosted scaffold-runtime suite
locally (no runtime lease); unit/integration tests against temp roots are fine. Do not touch
`.llm/tmp/pwcli/`.

## Local gates before each push

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all <changed test paths>`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx`
- `deno task quality:gate`
- If `packages/cli/e2e` changed: `deno task e2e:cli suites` (registry only) and the e2e unit tests.

## Reporting

Keep `worklog.md` current after every slice (RED output, GREEN output, receipts, exact heads).
Record any scope drift in `drift.md`. End with the final head and the PR number.
