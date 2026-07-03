**[ADVERSARIAL REVIEW] [VERDICT: PASS]**

Slice #337 (`deploy.targets.*` config contract), commits `07cb41e9`, `217116e5`, `3acd114b`,
`681c92df` on top of `56ea68b2`. Read/reason pass only — no type-check or e2e run (that is the
separate IMPL-EVAL gate). No blocking defects found. Two nice-to-haves.

## Findings

### 1. [NICE-TO-HAVE] Rename completeness — CLEAN (verified, no action required)
Grepped all of `packages/` + `plugins/` for `WindowsDeployConfig` / `WindowsDeployConfigSchema`.
Zero surviving references to the old input-config names. The only `*WindowsDeployConfig*` symbol
left is `ResolvedWindowsDeployConfig` (`packages/cli/src/kernel/domain/resolved-config.ts:180,267`
and its import/use in `deploy-config-resolvers.ts:22,258`), which L-4/L-7 explicitly keep
windows-shaped this slice. `packages/config/types.ts:7` wildcard-re-exports
`config-section-types.ts`, so the renamed `DeployTargetBase`/`WindowsDeployTarget` flow through all
four barrels (`src/domain/mod.ts` wildcard, `src/public/mod.ts:26/35/47/80`, root `mod.ts:85/118`,
`src/merge/mod.ts:46`) with no dangling re-export. Clean break holds.

### 2. [NICE-TO-HAVE] JSR slow-type annotations (L-8) — CLEAN (verified)
Both new exported schemas carry explicit `z.ZodType<…>` annotations matching their derived types
exactly: `deploy-schema.ts:109` `DeployTargetBaseSchema: z.ZodType<DeployTargetBase>` and
`deploy-schema.ts:116` `WindowsDeployTargetSchema: z.ZodType<WindowsDeployTarget>`; the container
`DeployConfigSchema: z.ZodType<DeployConfig | undefined>` (`:134`) is likewise annotated. The
`DeployTargetBase` interface (`config-section-types.ts:357-414`) matches `deployTargetBaseShape`
field-for-field, including `docker.denoBaseImage: string` / `dotnetBaseImage: string` (required in
the output type, correctly matching the `.default(...)` runtime fills). Annotation style is
identical to the pre-existing convention, so no new inferred slow type is introduced.

### 3. [KEY FINDING — resolved CLEAN] Test honesty on the lenient/passthrough schema
This is the finding that mattered most, and it comes out honest — NOT false confidence.
`defineConfig` (`packages/config/define-config.ts:35`) actually runs `NetScriptConfigSchema.parse`,
so the schema tests exercise real Zod behavior rather than an identity passthrough. The schema is
lenient (no `.strict()`), so Zod *silently strips* unknown keys — and the tests assert the correct
post-condition of that stripping rather than a vacuous "parse succeeded":
- `netscript_config_test.ts:58` "does not honor the legacy deploy.windows shape (clean break)"
  asserts `config.deploy?.targets === undefined`. Because `DeployConfigSchema` only knows `targets`,
  a legacy `{ deploy: { windows: {...} } }` is stripped to `deploy = {}`, so `targets` is undefined.
  This meaningfully proves the legacy shape does NOT resolve to a target — it is a real assertion,
  not "assert the parse threw / succeeded". The test comment honestly characterizes the semantics as
  drop-not-throw.
- `netscript_config_test.ts:78` "drops unknown deploy.targets keys" asserts
  `Object.keys(targets) === ['windows']` after feeding a stray `linux` member — meaningfully proves
  inner-map stripping.
- `netscript_config_test.ts:40` accepts a valid `targets.windows` and reads `.mode`/`.servicePrefix`
  back, so the positive path is covered too.
Verdict: the suite honestly proves the clean break. No must-fix here.
(Optional strengthening: the clean-break test could ALSO assert `config.deploy?.windows === undefined`
to nail that the stray key was stripped, not merely that `targets` is absent — but the current
assertion is already meaningful, so this is cosmetic.)

### 4. [NICE-TO-HAVE] Missed consumers — CLEAN (verified)
Only `resolveWindowsDeploy` read the input path; re-keyed to `userDeploy?.targets?.windows`
(`deploy-config-resolvers.ts:259`). Grepped `deploy.windows` / `.windows` across `packages/`:
every remaining hit is either a corrected comment/JSDoc (`constants/windows.ts:6,177`,
`compile-config.ts:48`, `resolved-config.ts:178`, `deploy-config-background.ts:156`) or a test
string on the new `targets.windows` path. `build-windows-strategy.ts`, `servy-cli.ts`,
`deploy-group.ts`, `servy-command.ts`, `build-windows-cli.ts` read the RESOLVED config
(`ResolvedWindowsDeployConfig`, still windows-shaped) — confirmed unchanged and correct, not merely
assumed. No plugin reads the deploy config (`plugins/` grep: no matches).

### 5. [NICE-TO-HAVE] `denoBaseImage` re-pin — CLEAN (verified)
Applied in BOTH places: schema default `deploy-schema.ts:99` (`.default('denoland/deno:2')`) and
resolver fallback `deploy-config-resolvers.ts:295` (`?? 'denoland/deno:2'`). Grep for
`deno:2.5`/`2.6`/`2.7` across `packages/`: zero remaining literals.

### 6. [NICE-TO-HAVE] Merge-granularity test — CLEAN (verified meaningful)
`merge/mod.ts:184` spreads `deploy` exactly one level
(`{ ...base.deploy, ...contribution.deploy }`), so a contribution replaces the entire `targets` map
wholesale. `merge_test.ts:31` asserts precisely this: contribution `windows.mode='script'` wins
(`:53`), base-only `servicePrefix` is gone (`:55`, proving whole-map replacement not deep merge),
and base is not mutated (`:57`). The test asserts real behavior, not a vacuous expectation.

### 7. [NICE-TO-HAVE] Type soundness / public surface — CLEAN
No production `any` or unsafe cast introduced. The two `as unknown as Parameters<typeof
defineConfig>[0]` casts (`netscript_config_test.ts:66,84`) are legitimate test-only casts to feed
deliberately-invalid input into a typed API. Public-surface changes are exactly the intended
rename + two additions (`DeployTargetBase`, `DeployTargetBaseSchema`); no unintended export.

## Summary
PASS — no blocking defects. Rename is complete (only the intentionally-retained
`ResolvedWindowsDeployConfig` survives), both new Zod exports carry matching `z.ZodType<…>`
annotations, `denoBaseImage` re-pinned in both default and fallback, and — the key concern — the
schema tests are HONEST: `defineConfig` really parses, and the "reject old shape" test asserts the
meaningful post-condition (`targets === undefined`) of the lenient schema's silent strip rather than
giving false confidence. Merge test guards the real wholesale-`targets`-replacement granularity.
