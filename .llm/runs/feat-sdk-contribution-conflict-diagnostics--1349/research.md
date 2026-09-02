# Research — feat-sdk-contribution-conflict-diagnostics--1349

## Re-baseline

- Carried-in source: `.llm/runs/chore-sdk-client-1349-acceptance-audit--1349/audit.md` from branch
  `chore/sdk-client-1349-acceptance-audit`.
- Re-derived against `main` @ `634b83d647c37f60f24a57839333f16c7cc61f12` on 2026-09-02.
- The audit's measured diagnostic gap remains present at the requested branch baseline. Its audited
  SHA `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` is an ancestor of the current baseline. Per owner
  direction, rows recorded SHIPPED were not re-audited or modified.

## Findings

| # | Finding                                                                                                                                   | How to verify                                                                                                           |
| - | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1 | The public diagnostic has only one optional `contributionId`; the error class and `toJSON()` mirror it.                                   | `deno doc --filter SdkClientContributionDiagnostic packages/sdk/src/client/mod.ts`; `packages/sdk/src/client/errors.ts` |
| 2 | Context and header owner maps already retain the earlier descriptor id, but conflict construction discards it.                            | `packages/sdk/src/internal/client-contributions/prepared-call.ts`                                                       |
| 3 | Version and closed-shape validation run before a descriptor id is retained; tuple overflow rejects before inspecting the 17th descriptor. | `packages/sdk/src/internal/client-contributions/prepared-call.ts`                                                       |
| 4 | Desktop rejects the presence of `contributions` without reading the supplied descriptor.                                                  | `packages/sdk/src/desktop/application/desktop-rpc-client.ts`                                                            |
| 5 | The existing validation suite covers all rejection families and redaction but pins only code/phase for construction failures.             | `packages/sdk/tests/client-contribution-validation_test.ts`                                                             |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `@netscript/sdk/client` via `packages/sdk/src/client/mod.ts`, plus
  `packages/sdk/deno.json` exports/publish filter.
- Planned surface change: one documented optional property on `SdkClientContributionDiagnostic`,
  mirrored on `SdkClientContributionError` and `toJSON()`.
- Slow-type / surface risks: none expected. The field uses the already-public
  `SdkClientContributionId`; no new export, entrypoint, dependency, runtime permission, or JSDoc
  example is introduced. Full-export `deno doc --lint` A/B and package dry-run remain required.

## Open questions

- None. The owner fixed the compatibility rule, six diagnostic cases, sibling boundaries, gate set,
  and acceptance-evidence disposition.
