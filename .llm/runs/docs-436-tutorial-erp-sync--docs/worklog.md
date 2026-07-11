# Worklog — docs/436-tutorial-erp-sync (C3)

Issue #436 — rewrite erp-sync track (VIF→CSB import pipeline). Branch from
`9be23cce2cf65179df6aea39371f25cbddb55bcb`.

## Plan

1. **Premise re-grounding (all 6 files, slugs preserved):** replace the stakes-free
   "supplier drops a CSV" premise with the VIF→CSB migration narrative from the design source
   (`design/CD-docs/proposal.md` §3.2: "ground in eis-chat's real VIF→CSB import pipeline —
   file-drop → import job → transform → queue/cron"). VIF = legacy in-house ERP still the system
   of record; CSB = its replacement; the sync service keeps CSB fed from VIF's file exports
   during the parallel-run. Stakes: a missed/duplicated/mis-transformed file silently diverges
   CSB's catalog from production reality.
2. **Ch3 `03-polyglot-transform` — read-not-run → runnable (the C3 structural change):**
   rebuild as an exercise-first chapter around the **sandboxed `deno` task runtime**:
   - transform script `plugins/workers/scripts/normalize-vif.ts` (argv+env in, JSON last
     stdout line out, writes normalized CSV to `.data/staging/`),
   - task definition `defineTask('normalize-vif')` with explicit `.permissions(...)`,
   - runner via `createDefaultTaskExecutor()` → literal checkpoints (terminal output,
     `cat .data/staging/...`, `deno task check`).
   - Python step retained as a **clearly-caveated forward capability** (not sandboxed,
     interpreter must exist on host) pointing at `/how-to/run-a-polyglot-task/`.
   - Fix stale `/capabilities/polyglot-tasks/` link → `/background-processing/polyglot-tasks/`
     (post-#433 pillar path). Keep the
     `arch-debt:workers-non-deno-task-sandbox-boundary` caveat comment.
3. **Ch2 sample data becomes VIF-shaped** (`art_no,designation,price_centimes`) so ch3's
   transform normalizes the exact file ch2 imported — one continuous pipeline. Ch2's job code is
   header-agnostic, so only the sample CSV + expected result change.
4. **Ch4 `WORKER_CONCURRENCY` footgun:** keep as a note (not a fix) per issue — "note (not fix)
   ... for a separate Codex side-fix".
5. **Ch1 plugin-install commands** aligned to the canonical `netscript plugin install ...` form
   used by the rewritten storefront track (replacing the repo-dev `packages/cli/bin/netscript-dev.ts`
   invocation, wrong for a JSR-installed reader).
6. Validate with `deno task verify` in `docs/site` (build → check:links → check:caveats).

## API grounding (traced before writing)

Local `packages/plugin-workers-core` is version `0.0.1-beta.7` — the published surface (JSR
fetch of the pin is blocked by the environment's minimum-dependency-date; local source at the
pinned SHA is the identical publish payload).

- `deno doc packages/plugin-workers-core/src/executor/mod.ts --filter createDefaultTaskExecutor`
  → `createDefaultTaskExecutor(options: MultiRuntimeTaskExecutorOptions = {}): TaskExecutor`
  (options defaulted — zero-arg call is valid).
- `deno doc ... --filter TaskResult` → readonly `{ taskId, status, exitCode, stdout, stderr,
  duration, success, error, result, startedAt, completedAt, attempt }`.
- `deno doc packages/plugin-workers-core/src/builders/mod.ts --filter defineTask` →
  typestate `TaskBuilder`.
- `src/executor/adapters/permission-flags.ts`: no permissions → `['--allow-all']`;
  `true` → `--allow-<name>`; non-empty array → `--allow-<name>=a,b`.
- `src/executor/adapters/argv-builder.ts` (`buildDenoCommand`): spawn =
  `deno run <permission flags> <entrypoint> <args>`; Python = `python3 -u` (or pinned
  venv/`py`); entrypoint resolves via `options.cwd || task.cwd`, else relative to the
  process cwd (`dax-process-runner.ts` uses `Deno.cwd()` fallback) — so running the runner
  from the workspace root resolves workspace-relative paths.

## Evidence

### `deno task verify` (docs/site) — GREEN

- build: `🍾 Site built into _site — 500 files generated in 9.39 seconds`
- check:links: `23014 internal links across 162 pages — all resolve`
- check:caveats: `27 caveat markers across 22 pages — all references resolve`

### Chapter-3 code executed for real (not just type-plausible)

1. **Script under the exact compiled sandbox flags** — extracted
   `normalize-vif.ts` verbatim from the chapter and ran
   `deno run --allow-read=.data --allow-write=.data/staging --allow-env=STAGING_DIR
   normalize-vif.ts --input .data/incoming/products/products_2024.csv`
   → exit 0, stderr diagnostic `normalize-vif: 2 rows in, 2 written`, JSON result line
   `{"input":…,"output":…,"read":2,"written":2,"skipped":0}`, and
   `.data/staging/products_2024.normalized.csv` containing exactly
   `sku,name,price / WID-1,Widget,9.99 / GAD-2,Gadget,19.99` — byte-identical to the
   chapter's checkpoint blocks.
2. **Full executor path** — ran the chapter's Step-2 task definition + Step-3 runner
   (`defineTask(...).permissions(...)` + `createDefaultTaskExecutor().execute(...)`)
   against the workspace `@netscript/plugin-workers-core` (version `0.0.1-beta.7`):
   exit 0, `[normalize:err]` / `[normalize]` stream lines and the multi-line
   `normalized { … } in 93ms` result render match the chapter's expected output.

### CLI command grounding

- `packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts`
  `BARE_PLUGIN_PACKAGE_ALIASES` includes both `worker`/`workers` and
  `trigger`/`triggers` → ch1's public-form
  `netscript plugin install worker --name workers --samples` is valid (and
  `--samples` is a shared framework-level install flag per `cli-reference.md`),
  matching the rewritten storefront track's command form.

## C-common bar self-check

- Exercise-first: ch3 now closes every step on a literal checkpoint (terminal output,
  JSON result, `cat` of the produced file, `deno task check`); the old
  "Verify your understanding" comprehension checklist is gone. Chapters 1/2/4/5 keep
  their existing literal checkpoints.
- Stakes: VIF→CSB migration premise (legacy ERP still system of record; missed file =
  invisible catalog day; untransformed row = 100x price error; burst = delayed re-sync).
- Slugs: all five chapter slugs + index unchanged; `_data.ts` untouched
  (`erp-sync/03-polyglot-transform` hub anchor intact).
- Python step: caveated forward capability ("read-now, run-on-your-own-host"),
  `arch-debt:workers-non-deno-task-sandbox-boundary` caveat marker preserved.
- `WORKER_CONCURRENCY` footgun: kept as a note; wording now says "tracked for a
  framework-side fix" (no framework source touched).
- Stale `/capabilities/polyglot-tasks/` link fixed to
  `/background-processing/polyglot-tasks/` (post-#433 pillar path).
- Positioning law: no honesty framing, no throughput claims, no competitor comparison
  added, no unshipped-capability claims (all symbols traced above).
- Extra file touched: `docs/site/tutorials/index.md` — one featureGrid card body updated
  so the hub no longer describes ch3 as define-only (same grid C6 will add a lane to;
  disjoint items).
