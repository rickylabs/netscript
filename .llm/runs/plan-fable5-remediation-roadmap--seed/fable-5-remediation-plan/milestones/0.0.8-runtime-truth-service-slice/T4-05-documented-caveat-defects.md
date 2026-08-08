# fix(plugins): two defects shipped as documented caveats — WORKER_CONCURRENCY never reaches the runtime, and @netscript/plugin-streams root exports always throw — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T4-05 · **Proposed milestone:** 0.0.8 (new — "Runtime truth + service slice") ·
**Labels:** `type:fix` `area:plugins` `area:docs` `area:aspire` `priority:p2` `status:triage` ·
**Depends on:** none

## Summary

Two live defects were resolved by writing prose that documents the broken behavior instead of fixing
it. (1) Aspire metadata and the generated `.env` emit `WORKER_CONCURRENCY`; the workers runtime reads
`WORKERS_CONCURRENCY` and defaults to `1`, so the declared concurrency of `2` is never applied — and
five separate documentation passages tell the reader to work around it. (2) The package a user
installs by name, `@netscript/plugin-streams`, re-exports `defineStreamProducer`/`defineStreamConsumer`
whose runtime operations always throw, with the docs pointing users at a differently-named package
for the API that works. Both are cheap to fix and both currently teach that a documented caveat is a
closed defect.

## Evidence

- Corpus: `research/repo-audit/runtime-plugins.md` §3.3, §4.3, §8 ledger rows 10-11, and the
  cross-cutting observation naming commit `26b851529` ("docs: reframe architectural debt caveats as
  design boundaries") as the pattern; `SYNTHESIS.md` §6 (T4 pack, "env-name mismatches" — no
  existing owner).

**(1) Concurrency name mismatch.**

- Emitters (singular): `plugins/workers/src/aspire/workers-contribution.ts:59`
  (`concurrencyEnvVar: 'WORKER_CONCURRENCY'`) and `:72` (`WORKER_CONCURRENCY: '2'`);
  `plugins/workers/scaffold.plugin.json:43`;
  `packages/cli/src/kernel/adapters/windows/environment/env-file-content.ts:228,235`;
  `packages/aspire/tests/_fixtures/appsettings.json:161`.
- Reader (plural): `plugins/workers/bin/runtime.ts:96` and `:140` —
  `parseInt(Deno.env.get('WORKERS_CONCURRENCY') ?? '1')`.
- Tests already disagree with the emitters:
  `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-background-app_test.ts:162`
  asserts `withEnvironment('WORKERS_CONCURRENCY', …)`.
- Documented as a caveat in five places: `docs/site/orchestration-runtime/how-to/deploy.md:202`;
  `docs/site/orchestration-runtime/how-to/author-a-plugin.md:137`;
  `docs/site/background-processing/workers.md:237`;
  `docs/site/background-processing/how-to/tune-worker-runtime.md:210-227`;
  `docs/site/tutorials/erp-sync/04-queue-and-cron.md:112-115`.

**(2) Always-throwing streams root exports.**

- `plugins/streams/src/public/stream-api.ts:19-38` — `StreamUnsupportedOperationError` and
  `unsupportedStreamOperation(...)`; the manifest-layer producer/consumer handles reject or throw it.
- Re-exported from the package root at `plugins/streams/src/public/mod.ts:4-5,13` and `:87-88`.
- Documented rather than fixed at `docs/site/durable-workflows/streams.md:126-133` ("they fail loud,
  by design"), redirecting users to `@netscript/plugin-streams-core`.

## Current surface

A user who follows the Aspire metadata gets concurrency 1 while the dashboard shows a declared 2;
the only way to get the declared value is to set an env var by hand that no generated artifact
writes. A user who installs `@netscript/plugin-streams` and imports its advertised producer/consumer
helpers gets a compiling program that throws at first use. In both cases the documentation is
accurate about the breakage, which has made the breakage durable.

## Target contract

1. **One concurrency name.** The emitted metadata name and the runtime-read name are the same
   identifier. Whichever name is chosen, the other is accepted for one deprecation window with a
   warning, and a test fails if metadata and runtime ever diverge again.
2. **The five caveat passages are deleted, not reworded.** Each doc location states the single
   correct variable with no "but the runtime honors…" clause.
3. **The streams root surface is truthful.** Either the manifest-layer helpers gain a working
   implementation over the core runtime, or they are removed from the package root export map and
   the package documents that runtime primitives live in `@netscript/plugin-streams-core`. A
   compiling import that always throws at runtime is not an acceptable third option.
4. **A general rule is recorded.** The remediation program adopts and cites the rule that a
   documented caveat is not a closed defect (`runtime-plugins.md` §8), so this class stops
   reappearing.

## Acceptance

- [ ] The Aspire-emitted concurrency env name and the workers runtime read name are identical.
- [ ] A test fails if the emitted metadata name and the runtime-read name diverge.
- [ ] The generated `.env` writer emits the canonical name.
- [ ] The declared concurrency value takes effect in a scaffolded project without manual env edits.
- [ ] All five documentation passages state one variable with no workaround clause.
- [ ] `@netscript/plugin-streams` root exports either work at runtime or are removed from the export
      map.
- [ ] `docs/site/durable-workflows/streams.md:126-133` matches the shipped export surface.
- [ ] A negative test proves an always-throwing runtime helper cannot be exported from a plugin
      package root.
- [ ] An export-drift or doc-lint gate fails if either caveat wording is reintroduced.

## Boundaries

- **T4-03** owns the streams durability decision and **#1329** owns the SSE envelope; this issue
  touches only the root export map and the concurrency name.
- **T4-06** owns the hardcoded ports in the same contribution files; keep the two changes in
  separate PRs so each has an independent verdict.
- **#1093** owns third-party plugin discovery; **#829** owns official plugins shipping compile-able
  `./services` entrypoints. Neither is re-filed here.
- **#1278** (type soundness, epic-of-record) owns public-surface type unsoundness generally; the
  always-throwing export is a *runtime* honesty defect, referenced there at most as an example.
- Renaming the `@netscript/plugin-streams` package, or merging it with `plugin-streams-core`, is out
  of scope — that is a publish-surface change requiring an RFC.

## Docs/consumer proof

The five caveat passages disappear from the docs site, and a docs test asserts that the
worked-around variable name no longer appears with workaround phrasing. Consumer proof: a scaffolded
project started from generated metadata runs the declared worker concurrency, verifiable from the
worker telemetry attribute `netscript.worker.concurrency`
(`packages/telemetry/src/attributes/worker.ts:6`) without setting any env var by hand.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. All emitter/reader line
citations and the five documentation locations re-verified against worktree baseline `fac9e339042c`.
