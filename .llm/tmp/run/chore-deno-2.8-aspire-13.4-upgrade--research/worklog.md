# Worklog — Deno 2.8 + Aspire 13.4 toolchain upgrade

## Design

The upgrade is decomposed into four sequenced phases so `main` is green at every merge and a broken
`netscript init` is never emitted:

- **Phase T (Deno 2.8)** is the foundation — workspace config + CI only, plus the one publish-blocking
  `packages/aspire` barrel fix folded in (LD-1). It is independent of Aspire entirely.
- **Phase P (JSR alpha.0)** is cut after Phase T Slice 0 because 2.8's publish-clean surface
  (`isolatedDeclarations`, `deno doc --lint`) is what makes a clean publish possible. It withholds
  `@netscript/cli` (decision #7) so the production scaffold path can be tested before the CLI ships.
- **Phase A (Aspire 13.4)** is a *thin* scaffold-constant bump. The key design insight from research
  discrepancies D-1/D-2 is that **the Aspire upgrade is a CLI edit, not a `dotnet/` edit**:
  `AppHost.csproj` and `global.json` are *generated* by `netscript init`, so the version pins live in
  `packages/cli/src/kernel/constants/scaffold-versions.ts`. We edit the leaf constant, not the CLI
  structure (AP-1 stays owned by Wave 6).
- **Slice 2/3** are joint-with-Wave-6 / post-13.5 and explicitly not launch gates.

### Key design decisions

1. **Decoupled default (LD-6).** Deno and Aspire ship as separate PRs. The only coupling is
   type-system (the 13.4 SDK's TS shape needs the compiler that 2.8 bundles). The coupled Slice 1b is
   a *fallback only* if 13.4 is still preview when 2.8 lands — gated by E-12.
2. **Preview guard (LD-7 / E-12).** A new `check-scaffold-versions.ts` asserts the pinned Aspire
   versions carry no `-preview`/`-beta` suffix, so we never default a preview SDK into scaffolds.
3. **Single-file ownership (LD-8).** This run owns `scaffold-versions.ts` + `copilot-setup-steps.yml`;
   Wave 6 owns `scaffold-files.ts` + the apphost-path realignment. This prevents the two parallel
   programs from colliding.
4. **lib.node as capability, not escape hatch (LD-9).** 2.8 turns `lib.node` on by default; we exploit
   it but never add `"node"` to `compilerOptions.lib`, preserving the `no-node-globals` lint guard for
   the multi-runtime library packages.
5. **Carve-outs are debt, not defaults (LD-5).** The four heavy-generic packages
   (`contracts`,`triggers`,`service`,`plugin`) get per-package `--allow-slow-types` each paired with a
   `DEBT_ACCEPTED` arch-debt row so the JSR-score cost is recorded, never a workspace default.

### What this run deliberately does NOT do

- No CLI restructure (AP-1 is Wave 6's).
- No `apphost.mts`/`.aspire/modules/` GA path realignment (Wave 6).
- No 13.5 native-Deno-apphost flip (post-GA, stubbed only).
- No real `deno publish` (that is Phase P, a separate plan).
