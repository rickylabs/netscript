# Research — fix-aspire-declared-reference-fail-fast--1371

## Re-baseline

- Carried-in source: issue #1371 admitted design and verification comment `5462080110`.
- Re-derived against `main` @ `3b32d1628584749af4dd6e97fd331c24e84f0b9e` on 2026-08-29.
- The branch is clean at the stated base. The generator still silently guards both service and plugin endpoint bindings and registers the processor afterward.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Both declared reference kinds use the raw `services__<ref>__http__0` key. | `generate-register-background.ts` reference blocks |
| 2 | Missing map entries and unresolved `http` endpoints currently produce no throw and no env assignment. | Optional chaining plus truthy guards in the same blocks |
| 3 | `createServerServiceEnvKey('workers-api')` returns `services__workers-api__http__0`; hyphens are preserved by the consumer. | `packages/sdk/src/discovery/service-url.ts` |
| 4 | The slotted background helper template owns the function shell only; per-reference emission comes from the generator slot. | `generate-register-background-1.ts.template` |
| 5 | Focused emitted-module tests can be built in one new test file with local temporary SDK/compat/infrastructure doubles. | Existing `service-environment-runtime_test.ts` pattern |

## jsr-audit surface scan

- Surface scanned: `packages/cli/deno.json` exports and the changed internal generator/test surface.
- Slow-type / surface risks: none introduced; no public export or package metadata changes are planned.
- Existing CLI per-member audit WARN output is treated as baseline and will be disclosed, not represented as warning-free.

## Open questions

- None. The deterministic error text is locked in `plan.md` and asserted by tests.
