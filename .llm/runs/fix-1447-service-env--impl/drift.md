# Drift — fix-1447-service-env--impl

Append-only.

## 2026-08-11 — lane override: Claude implements this slice (severity: minor)

`CLAUDE.md` makes WSL Codex the default implementation lane for harness slices and reserves Claude
for coordination. The run brief assigned implementation of #1447 to this Claude session directly.
Authorization: explicit owner/run-supervisor instruction in the run brief. Mirrored in
`supervisor.md` § Recorded lane/eval overrides. IMPL-EVAL still runs in a separate session.

## 2026-08-11 — issue title vs. actual defect (severity: minor)

#1447 is titled "generated service resources drop `Services[].Env`". The generator does not drop it:
`ServiceEntry` has no environment field, so Zod strips `Env` during `parseAppSettings` before any
generator sees it. The fix therefore spans the contract and the generator, not the generator alone.
Recorded because it changes the shape of the fix and the acceptance evidence (a schema-only or
generator-only patch would look correct and change nothing).

## 2026-08-11 — pre-existing oddity left untouched (severity: minor)

`preservePluginEnvironment`
(`packages/cli/src/kernel/adapters/service/workspace-mutator.ts:181-197`) re-reads `Environment`
from the raw `appsettings.json` after `parseAppSettings` has already parsed it, for `Plugins` only.
It is redundant on the parsed path and has no services counterpart, so services rely purely on
schema parsing (which this run fixes). Not touched: out of scope for a P0 fix, and changing it risks
the plugin regeneration path. Deferred, no debt entry filed — it is a redundancy, not a doctrine
violation.

## 2026-08-11 — IMPL-EVAL cycle 1 `FAIL_FIX`: precedence rule amended for `PORT` (severity: significant)

`plan.md` D2 documented `PORT` as "Aspire wins because endpoint allocation supplies it", with the
declared value emitted and expected to lose. Cycle-1 finding F2 required a falsifiable both-directions
test for that category, and building it exposed the flaw in the decision: the endpoint binding and
`withEnvironment` are **two different mechanisms** writing the same key, and their relative order is
internal to Aspire. The documented rule was therefore unverifiable, and if the order ran the other way
a consumer declaring `PORT` would get a process listening where nothing proxies — configured-looking
and unreachable.

Amended: the generator now **refuses** a declared `PORT`, naming it in a generated comment (silent
stripping is the #1447 failure mode itself). The rule is then true by construction rather than by
race, and it is asserted at both levels — no `withEnvironment` call for `PORT` while the endpoint
still carries `env: 'PORT'` (unit), and the declared literal absent from the running process's
environment while Aspire's own value is present (E2E). README § Resource environment documents the
category separately with the reason.

## 2026-08-11 — archetype correction: `packages/cli` is A6, not A4 (severity: significant)

Cycle-1 finding F4. `plan.md` recorded ARCHETYPE-4 for `packages/cli`; the governing profile is
`.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`. Consequence, not just bookkeeping: A6 adds
F-CLI-2 (hard 500-LOC cap outside `kernel/assets/`) and F-CLI-25 (≤ 12 immediate children). Measuring
against A6 found `service-environment-runtime_test.ts` at 536 lines — over the cap and introduced by
this run. Trimmed to 499 rather than recorded as debt. Also measured and **recorded** rather than left
silent: `packages/aspire/config.ts` 812 → 855 lines (new entry `aspire-config-length-1447`).

## 2026-08-11 — process-level evidence is Linux-only (severity: minor)

`behavior.service-env` reads `/proc/<pid>/environ` to prove the AppHost-started process observed the
declared values. There is no portable equivalent that is not weaker, so the gate throws by name on a
platform without `/proc` instead of degrading to a check that cannot fail. Accepted because the CLI
E2E suites run on `ubuntu-latest` in CI and under WSL locally. Recorded here so a future Windows or
macOS E2E lane knows this gate is a deliberate platform gap, not an oversight.

## 2026-08-11 — Deno refuses `/proc` to anything but full access (severity: significant)

The `behavior.service-env` gate was registered with `--allow-read`, on the stated assumption that
bare `--allow-read` is unscoped and therefore covers `/proc/<pid>/environ`. It is unscoped, and it
does not cover it. Deno gates every `/proc` access on `check_all` — the whole-program "all
permissions" state — because `/proc/<pid>/environ` would otherwise hand a program holding only
`--allow-read` both its own and other processes' environments, defeating `--allow-env`.

Measured on Deno 2.9.5 rather than inferred: `--allow-read`, `--allow-read=/proc`, every individual
`--allow-*` flag, and `--allow-all` combined with *any* `--deny-*` are all refused with
`NotCapable: Requires all access to "/proc"`. Granting all eight units unscoped works and is
precisely what `--allow-all` means. Leave-one-out shows every one of the eight is load-bearing, and
scoping any one — including the `--allow-run=aspire` the gate already carried — loses `/proc` again.

Consequence for the plan: the gate carries `--allow-all`, and that is the narrowest set that exists
for this evidence, not a relaxation. The `/proc` read itself is untouched — it remains the only
proof that the declared value reached the started process rather than the resource model.

Second-order drift, and the more general lesson: a gate's permission set was a claim no test made.
Every unit test of the `/proc` reader passed because `deno test` runs under `--allow-all`, so the
gate's own permissions were never the thing under test, and the mismatch could not fail until the
full `scaffold.runtime` suite had built and started an AppHost. `service-env-gates_test.ts` closes
that class for both #1447 gates by executing the real flags against the real reader.
