# Research — fix-aspire-reference-name-validation--1732-source-safety

## Re-baseline

- Carried-in source: issue #1732 brief and dispatch addendum.
- Re-derived against `main` @ `13878a80a50c55b9662099fed64555f2310ae4a3` on 2026-08-30.
- The reported interpolation and unvalidated-reference findings remain present. No implementation
  was started because the required compatibility-stop condition was reached.

## Findings

| # | Finding                                                                                                                                                                                                                                                                            | How to verify                                                                                                                                                                                                                                                                                                                                                                                                                      |
| - | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `ServiceReferences` and `PluginReferences` remain unconstrained `z.array(z.string())` fields.                                                                                                                                                                                      | `packages/aspire/config.ts:466-467`                                                                                                                                                                                                                                                                                                                                                                                                |
| 2 | Background processor/reference names remain raw in generated single-quoted literals, including resource lookups, executable/map names, and discovery environment keys. Derived identifiers already use `safeIdentifier(...)`, and error messages already use `JSON.stringify`.     | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts:79-111,219-231`                                                                                                                                                                                                                                                                                                                         |
| 3 | Aspire 13.x default resource names are limited to 64 characters, start with an ASCII letter, contain only ASCII letters/digits/hyphens, and may not contain consecutive hyphens or end in a hyphen.                                                                                | Microsoft Aspire `DistributedApplicationBuilder.ValidateResourceName` and `ModelName`; [upstream builder source](https://github.com/microsoft/aspire/blob/main/src/Aspire.Hosting/DistributedApplicationBuilder.cs), [13.2 release note confirming the 64-character limit](https://github.com/microsoft/aspire/releases), [maintainer confirmation of the DNS-derived rule](https://github.com/microsoft/aspire/discussions/10757) |
| 4 | Underscores are not accepted by Aspire's default resource policy; the platform reports that only ASCII letters, digits, and hyphens are allowed.                                                                                                                                   | [Aspire discussion #10757](https://github.com/microsoft/aspire/discussions/10757)                                                                                                                                                                                                                                                                                                                                                  |
| 5 | The generated AppHost pins Aspire packages at 13.4.6, so the researched 13.x default policy is the relevant platform contract.                                                                                                                                                     | `packages/cli/src/kernel/templates/aspire/generate-aspire-config_test.ts:70-84`                                                                                                                                                                                                                                                                                                                                                    |
| 6 | The current scaffold validates project/app/service names with `/^[a-z][a-z0-9-]*$/`. That is a lowercase subset of Aspire's character set but permits platform-invalid consecutive/trailing hyphens such as `a--b` and `a-`; service names also have no separate 64-character cap. | `packages/cli/src/kernel/constants/scaffold/scaffold-validation.ts:10`; `packages/cli/src/kernel/application/scaffold/validate-init.ts:101-112`                                                                                                                                                                                                                                                                                    |
| 7 | Therefore an exact Aspire grammar lock would reject names a current scaffold can produce. Those names are not runnable Aspire resource names today, but rejecting them earlier is still an observable public configuration/scaffold compatibility change.                          | Evaluate the scaffold regex against `a--b`, `a-`, and a 65-character leading-letter string; compare with finding 3.                                                                                                                                                                                                                                                                                                                |
| 8 | `rtk` is unavailable on this host despite the requested skill (`command not found`).                                                                                                                                                                                               | `rtk rg ...` exited 127 during research.                                                                                                                                                                                                                                                                                                                                                                                           |

## JSR / published-surface position

`packages/aspire/deno.json` exports `./constants` from `./constants.ts`, so adding an exported rule
there would be a permanent public symbol in a JSR-published package. The initial plan's proposal to
put the rule in that file contradicted its claim that no published symbol was planned.

The corrected plan keeps the rule module-private under
`packages/aspire/src/domain/aspire-resource-name.ts` and imports it relatively from `config.ts`. The
platform rule is an internal parsing invariant, not a demonstrated consumer extension point, so it
is not worth enlarging the public API. No export map or public constants change is planned.

Pre-change baselines captured at `13878a80a50c55b9662099fed64555f2310ae4a3`:

- `deno task doc:lint --root packages/aspire --pretty` exits 1. It reports zero missing JSDoc and
  zero combined publish errors, with existing private-type-reference findings on exported
  entrypoints.
- `audit-jsr-package.ts --root packages/aspire --text` exits 1 with four existing F-JSR-2
  missing-`@module` failures and one F-JSR-7 slow-types warning; its publish dry-run is OK.

These are red baselines, not passes. The implementation must add no export and no new finding.

## Recommendation

Use both defenses in order: **source-safe emission first as the load-bearing property**, then an
exact grammar lock at the config parse boundary. The order matters because the grammar was derived
from upstream source, release documentation, and maintainer discussion rather than executed against
Aspire in this no-runtime-lease leaf. Escaping ensures a loose documentation-derived rule can never
leave the original generated-source syntax defect reachable.

The grammar and compatibility position are:

- accept 1–64 ASCII characters matching the platform rules (leading ASCII letter; remaining ASCII
  letters, digits, or hyphens; no consecutive or trailing hyphen);
- reject single quote, backslash, backtick, and underscore before source generation;
- keep ordinary and hyphenated names working, including the raw `services__<ref>__http__0`
  environment-key shape;
- classify newly rejected scaffoldable values (`a--b`, `a-`, over 64 characters) as an intentional
  fail-fast correction because Aspire 13.4.6 rejects them anyway, not as removal of working Aspire
  behavior;
- use source-safe literal emission and valid identifier derivation as defense in depth, without
  widening accepted names beyond Aspire's default policy.

The config lock meets the deterministic pre-generation error requirement; source-safe emission
provides the independent safety floor. The owner approved rejection of currently scaffoldable but
Aspire-invalid `a--b`, `a-`, and over-64-character names as an observable fail-fast correction, not
as removal of working Aspire behavior.

## Open questions

- None at plan scope. Formal PLAN-EVAL remains pending and blocks implementation.
