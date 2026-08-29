# S4 Tier-A slice review — #1716 / PR #1738

- Reviewer: Fable 5 medium supervisor (this session); generator: GPT-5.6 Sol medium, thread
  `01a04fcc-8e30-7051-af89-a9e270ad7ce1` (continuation resumes ran at profile `high` — route drift,
  same class as S1/S2).
- Exact head reviewed: `c2cceba00` (branch `chore/aspire-13-5-s4-generator-revalidation`, base
  `origin/main` `13878a80a` after the child's rebase). Gates were executed at `f128e51e5`; the amend
  to `c2cceba00` touches only `context-pack.md` (`git diff --stat f128e51e5 c2cceba00`: 1 file,
  4/4 lines, zero `packages/`/`plugins/` lines), so every gate result below carries over.
- Review worktree: `/home/codex/repos/netscript-aspire-13-5-s4-eval` (detached, native ext4).

## Commit stack (post-rebase SHAs)

| Slice | SHA | Original | Scope |
| --- | --- | --- | --- |
| 1 | `ca80c26b4` | `079fbb0a2` | member table, 26 emitted members re-validated against 13.5.1 API pages |
| 2 | `ab2318fb2` | `ef102fd34` | `AspireConfigSchema.appHost` default `./aspire/apphost.mts` + test |
| 3 | `aec266d4e` | `84b1aa124` | stale anchors (aspire#15119/#16220/#15812) re-anchored; arch-debt entry rewritten in place |
| 4 | `eff0548a2` | `f382cce70` | deploy adapters: `--yes` only on `destroy`; new cloud `down` test; compose test renames |
| 5 | `c2cceba00` (amend of `f128e51e5`) | — | `embedded.generated.ts` regen; run-dir gate record |

The child rebased onto `13878a80a` before slice 5 and force-pushed; it posted the old→new SHA map as
a PR comment (2026-08-29T23:40Z). Drift finding below.

## Substantive review

- **Config default (slice 2).** `packages/config/src/domain/schemas/aspire-schema.ts` only changes
  the `appHost` default string and doc comment; `dashboardPort` untouched; no export-map change, so
  no `deno publish --dry-run` needed for `packages/config`. Test asserts the default exactly.
  Legacy `./dotnet/AppHost` remains accepted as a plain string (no validation tightening) — matches
  D-4.
- **Stale anchors (slice 3).** `git grep -nE 'aspire#15119|aspire#16220|aspire#15812'` over the
  template and asset trees → 0 hits at head. `generate-aspire-config.ts` doc block now states the
  13.5 CommunityToolkit projection + 13.6 first-party schedule (aspire#18627/#18628/#16218) and keeps
  `addExecutable` until S12 — consistent with D-7/D-13 and S2 V9. `_aspire-compat.ts.template`
  header changed only (3 lines). arch-debt: the CommunityToolkit entry is the only substantive edit
  (owner → S12, gate → S12 replacement + `scaffold.runtime`); the other hunks are `deno fmt`
  rewraps of unrelated entries (verified line-by-line: no wording change).
- **Deploy adapters (slice 4).** `aspire-cloud-deploy-target.ts` gains a doc comment only; the
  `down` argv (`destroy --apphost … --output-path … --yes --non-interactive`) was already emitted
  and is now pinned by a new test. `aspire-compose-deploy-target.ts` gains a comment; two tests
  renamed to state the 13.5 contract. Matches S2 V12 help receipts (`--yes` absent on
  `publish`/`deploy`, present on `destroy`). No behavioural change — the issue's "argv contract
  re-validated" acceptance is met by tests, not by code churn.
- **Regen (slice 5).** `embedded.generated.ts` diff is exactly the template_053/`_aspire-compat`
  header re-emission; `check:assets-barrel` clean at head. The `as unknown as
  CacheConsumerBuilder` string inside the re-emitted barrel line is **pre-existing on `origin/main`**
  (`_aspire-compat.ts.template` and the barrel both carry it) — not introduced by S4.
- **Member table.** 33 table rows, one 13.5.1 `aspire.dev/reference/api/typescript/aspire.hosting/*`
  page per member; `withHttpHealthCheck` row cites the S2 restored-module options-object grep.
- **Boundaries.** No pins, no `packages/fresh`, no skills/docs, no archival rows, no AppHost
  runtime, no host CLI change, no `deno.lock` change (`git diff origin/main..HEAD --stat` = 10
  files under `packages/`+`.llm/harness`).
- **PR hygiene.** Draft, `Closes #1716` / `Part of #1712`, explicit statement that #1371 is not
  closed here; labels `type:fix area:cli area:aspire priority:p1 epic:aspire-13-5 status:impl`,
  milestone 0.0.7; six per-slice comments incl. the rebase map.

## Gates executed by the reviewer (at `f128e51e5`, carried to `c2cceba00`)

| Gate | Result |
| --- | --- |
| stale-anchor grep (templates + assets) | 0 hits |
| new `deno-lint-ignore` / `as unknown as` / `: any` in diff | 0 new (1 pre-existing barrel string, see above) |
| `deno task check:assets-barrel` | PASS |
| `deno task quality:scan` | PASS — 0 findings, 7 pre-existing allowances |
| `deno task arch:check` | PASS — warnings only (pre-existing `export default` F-5/F-6) |
| `run-deno-test` on `packages/config/tests`, templates/aspire, adapters/aspire | 329/329 PASS |
| `run-deno-check` (74 files, `--unstable-kv`) | 0 diagnostics |
| scoped lint/fmt wrappers | 0 findings on the 34 non-excluded files; 40 `packages/cli` files dropped by root config exclusion (expected) |
| raw `deno lint --no-config` on the 5 touched `packages/cli` TS files | clean |
| raw `deno fmt --check --no-config --single-quote --line-width 100 --indent-width 2` on the same 5 files | clean |
| `deno task e2e:cli run scaffold.plugins --format pretty` | 17/17 PASS (no Aspire runtime) |

## Findings

1. **minor / drift-record** — the pre-slice-5 rebase (`8b1e42f72` → `13878a80a`) and force-push are
   recorded in `worklog.md` ("rerun after rebase") and as a PR comment, but not in the run's
   `drift.md`. Evaluator to confirm; supervisor notes it here so the trail is complete. Not
   blocking.
2. **minor / route** — continuation turns ran at Sol `high` (resume carries no `--effort`); same
   class as S1/S2, already recorded in the epic drift log (D-17b).
3. **process** — runner issued one continuation after the bare `DONE`; stopped by the supervisor
   (SIGTERM on the runner only) and steered via PR comment. No branch mutation resulted.

No blocking finding. **Tier-A verdict: sign-off to IMPL-EVAL at `c2cceba00`.**
