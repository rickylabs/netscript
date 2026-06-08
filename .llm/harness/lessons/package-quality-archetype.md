# Lesson: Package-quality is architectural, not type/lint cleanup

## Context

Source runs:

- `.llm/tmp/run/feat-package-quality-wave2-adapters-2b--data` (kv · database · prisma-adapter-mysql)
- `.llm/tmp/run/feat-package-quality-wave2-adapters-2c--messaging` (queue · cron)

Across both A2 sub-waves, "make the package publishable" turned out to mean far
more than `deno check` + `deno lint` + 0 slow types. Every unit converged on the
same enterprise-grade shape, and the runs that treated the work as a structural
rethink (not a fix-the-errors pass) produced the clean PLAN-EVAL/IMPL-EVAL PASSes.

## The bar: what "enterprise-grade JSR alpha package" actually means

A package-quality slice list for an A2 (integration/adapter) unit is **done** only
when all of the following hold. Treat this as the default Concept of Done; drop an
item only with a recorded reason.

1. **Hexagonal folder vocabulary.** Role-named folders, not catch-alls:
   - `ports/` for the port-contract interfaces (renamed from `interfaces/`).
   - `adapters/` for concrete implementations of those ports.
   - `application/` for orchestration/use-case logic (renamed from `core/`).
   - `validation/` for input validation (renamed from `utils/`).
   - `internal/` is doctrine-allowed (F-11) for genuinely private composition;
     `utils/` and `interfaces/` are forbidden vocabulary.
   - F-16 folder-cardinality: each role folder needs ≥2 siblings or it should not
     exist as a folder.
2. **`./testing` port-contract entrypoint** for every multi-adapter unit: an
   in-memory adapter implementing the public port so consumers can test against
   the contract without real infrastructure. Reuse an existing memory adapter via
   a re-export barrel rather than duplicating (cron reused `MemoryCronAdapter`;
   queue had to author `MemoryQueueAdapter<T>` because none existed).
3. **Public-surface doc completeness.** Full-export `deno doc --lint` = 0 errors
   across *every* `exports` entrypoint (see `validation.md` — root-only undercounts
   massively). JSDoc on every exported symbol, including Deno-reported private
   class members. Private-type-ref errors are cleared by re-exporting the
   referenced type through the public barrel, not by widening visibility ad hoc.
4. **JSR publishability.** `deno publish --dry-run` = 0 slow types.
5. **Defensive I/O tests.** For any adapter that holds timers, sockets, or
   blocking clients: an `abort-cleanup_test.ts` proving abort/stop releases every
   resource (kv-polling timers, AMQP connection close, the Redis *blocking* client
   `brpoplpush`, scheduler intervals). This is where real adapter bugs hide.
6. **Doctests.** `tests/_fixtures/docs-examples_test.ts` that executes the exact
   flow shown in the README/docs, so documentation cannot rot silently.
7. **Docs scaffold** for the larger units: `docs/{README,architecture,concepts,
   getting-started}.md` plus `docs/recipes/` and `docs/reference/` where it earns
   its place; added to the publish `include`.
8. **Task hygiene (F-6).** `deno.json` carries `lint`, `fmt`, and
   `publish:dry-run` tasks, and `check` enumerates *every* exports entrypoint.

## Why this matters for splitting and scoping

The architectural rethink is what generates the slice list — not the other way
round. The 2c plan was 17 slices precisely because each item above is a
gateable, single-purpose commit:

- rename folders (`git mv` only) → retarget exports/tasks → retarget imports
  (three slices, because the middle states are intentionally transient — see
  `validation.md`),
- one doc-lint-to-zero slice per package,
- one `./testing` slice per package,
- one defensive-I/O slice per package,
- one task-hygiene slice, one doctest slice, one publish-verify slice,
- cross-cutting consumer gate + e2e merge-readiness as the final slices.

When you scope a future package-quality wave, derive the slices from this Concept
of Done, assign each a single named gate, and one commit per slice with a paired
doc-recording commit. That cadence is what made 2c auditable end-to-end.

## Alpha latitude

These were `0.0.1-alpha.0` units, so renames shipped with **no back-compat shims**
once a zero-external-consumer check confirmed safety (`deno doc`/grep for subpath
importers). Verify zero consumers, then rename cleanly. Do not carry shim debt
into an alpha.

## Promotion

Promoted because the same structural bar recurred across every unit in two
independent sub-waves and is the operative definition of "package quality" for all
remaining `packages/` and `plugins/` waves (Arch 2/5/6).
