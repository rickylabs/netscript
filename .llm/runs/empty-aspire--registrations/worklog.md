# Empty Aspire registration repair

Issue #1997, part of #1335. A zero-contribution native scaffold now emits lint-clean plugin and
background registration helpers. Their function arity and Promise-of-map contract remain intact;
each call returns a fresh empty map without reading any builder/config/resource argument.
Populated registration paths are unchanged.

## Scope and authority

Baseline `8ba53bc50ca02aab29e99ba5362728839b8f1713`; isolated branch
`fix/empty-aspire-registrations`. This is a bounded Archetype 6 CLI/template repair. Source changes
are two generator branches, one shared template/manifest entry, regenerated asset barrel and
regression tests. No generated consumer file is hand-edited. No release, live provider-account
change or application feature is included.
[observed - docs/architecture/doctrine/06-archetypes.md; netscript-cli skill;
packages/cli/src/kernel/adapters/templates/template-asset.ts]

The public 0.0.7 CLI produces 23 unused-symbol/require-await findings for zero plugins/background
processors; `service generate --force` reproduces the failure. Both source generators previously
rendered the populated template for empty input. Emitting only type imports and a Promise-returning
empty implementation removes the unused work rather than ignoring lint rules.
[observed - #1335 comment5569591353; generate-register-plugins.ts and
generate-register-background.ts at baseline]

## Verification

- Wrapper-driven entire helpers test directory: 280 passed, zero failed; receipt `tests.json`.
  Added tests lint and execute the emitted empty modules, check arity/Promise shape/fresh maps,
  and fail if any argument is inspected. Existing populated behavior tests remain in the suite.
- Check wrapper: 34 selected files, zero failed batches.
- Lint wrapper: 34 processed files, no dropped files or findings. The root configuration excludes
  the entire CLI from lint/format, so a temporary explicit config retained recommended lint rules
  and root formatting settings without that exclusion. Initial all-excluded wrapper refusals were
  not accepted as passes. `quality-config.json` records the config used.
- Format wrapper over the six changed authored TypeScript files: PASS. A broader exploratory
  format scan reports existing differences in five untouched files; none were reformatted.
- `deno task quality:gate`: exit 0, existing warnings retained.
- `deno task gen:assets-barrel`: exit 0; generated barrel changed only through this command.
- Native maintainer `service generate --project-root <consumer> --force` regenerated the consumer's
  13 helpers; only the two empty helper files differ. Consumer root lint, test and format pass,
  including 14 behavioral tests and actual MCP verification. Consumer AppHost TypeScript passes,
  but its Deno check batch fails because the init-seeded PrismaClient has no `operation` delegate.
  The same four TS2339 errors are present in the pre-repair check receipt. An earlier summary
  incorrectly read the last successful AppHost batch as overall PASS; the full JSON has `ok:false`.
  This is a source-generator lint repair, not a full consumer build or published-release PASS.

Independent evaluation is still required before merge. The intended consumer review could not run:
OpenCode Go reported provider-rate-limited; the guarded OpenRouter route reached the provider but
was rejected by its key credit limit. No evaluation PASS is claimed. Full scaffold.runtime remains
unverified: remote Docker is reachable, PostgreSQL accepts connections inside the container, but
the host health check times out against a port bound to loopback on the remote daemon.
