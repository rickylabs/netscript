# Research — chore-aspire-13-5-s4-generator-revalidation--impl

## Re-baseline

- Carried-in source: issue #1716, epic #1712, and the ratified research/plan on
  `origin/research/aspire-13.5-0.0.7`.
- Re-derived against `origin/main` @ `8b1e42f725919457c64781d5973fd419017fab13` on 2026-08-30.
- What changed vs the carried-in version:
  - #1371 is already closed by #1728, whose commit is the branch baseline.
    `generate-register-background_test.ts` now executes the emitted module and proves the raw
    `services__<ref>__http__0` key, positive service/plugin injection, and fail-fast unresolved
    references. S4 verifies that coverage and does not close or re-implement #1371.
  - S2 V9 proves CommunityToolkit Deno projection after restore; S12 still owns adoption.
  - S2 V12 proves only `aspire destroy` exposes `--yes`; publish/deploy do not.

## Findings

| # | Finding                                                                                                                                                            | How to verify                                                                                                                                |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Every Aspire SDK member emitted by the scoped generators remains present in the 13.5.1 TypeScript reference.                                                       | `member-table.md`; official `aspire.dev/reference/api/typescript/**/<member>.md` pages                                                       |
| 2 | The API-reference renderer flattens several option objects into positional parameters; the restored 13.5.3 SDK projection is authoritative for emitted TypeScript. | S2 `01-restored-module-grep.raw.txt` proves `withHttpHealthCheck(options?: WithHttpHealthCheckOptions)` and the emitted options-object calls |
| 3 | CommunityToolkit 13.5.0 projects `addDenoApp` and `addDenoTask`, but first-party Aspire Deno hosting is targeted at 13.6.                                          | S2 `03-v9-deno-projection-grep.raw.txt`; research C24/C25 and D-4                                                                            |
| 4 | `publish`, `deploy`, and `destroy` all expose `--apphost`, `--output-path`, `--environment`, and `--non-interactive`; only `destroy` exposes `--yes`.              | S2 `03-v12-{publish,deploy,destroy}-help.raw.txt`                                                                                            |
| 5 | The current cloud adapter already emits `--yes --non-interactive` for Aspire destroy, but its focused test suite does not pin that argv.                           | `aspire-cloud-deploy-target.ts`; no AppHost-backed `down()` assertion in its `_test.ts`                                                      |
| 6 | The config default still points to the removed legacy C# AppHost path.                                                                                             | `packages/config/src/domain/schemas/aspire-schema.ts`                                                                                        |
| 7 | The two stale comments and the matching debt entry still assert the disproven 13.3-era Deno projection state.                                                      | `generate-aspire-config.ts`, `_aspire-compat.ts.template`, and `arch-debt.md`                                                                |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/mod.ts`, `packages/cli/maintainer.ts`, and the published
  `AspireConfigSchema` exported through `packages/config`.
- Planned surface change: no export-map, symbol-name, parameter, or return-type change. The schema
  keeps its explicit `z.ZodType<AspireConfig | undefined>` annotation; only a documented default
  value changes.
- Slow-type / surface risks: none introduced. Final evidence uses the repository JSR audit and
  doc-lint surfaces; no publish/version mutation is in scope.

## Open questions

None. The issue, D-4/D-15, S2 receipts, and current baseline resolve all implementation choices.
PLAN-EVAL is therefore `N/A` for this bounded re-validation slice.
