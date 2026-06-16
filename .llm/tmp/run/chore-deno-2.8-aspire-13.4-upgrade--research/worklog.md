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

## Implementation log

### IMPL-1 — type foundation green-up (2026-06-15)

Deno 2.8 ships TS 6.0.3, which enforces the repo's pre-existing `isolatedDeclarations: true`
strictly. On first `deno task check` under 2.8 this surfaced a wave of TS90xx
explicit-return-type gaps plus one genuine `TS2322`. These are **publish-surface annotation
debt, not regressions** — the code was already correct; 2.8 simply requires the types be
written explicitly. Resolved without suppressions:

- `db11fb7` triggers, `212189a` workers, `ac4ee94` plugins (stream + saga checks),
  `b64dea1` fresh builder fixtures, `f44c2da` fresh-ui — explicit-type annotations only.
- `939bbe9` fresh: the one real bug — SSE keepalive timer typed `number` but assigned a
  `setInterval` handle (`TS2322`). Fixed with an exported `SSEIntervalId =
  ReturnType<typeof setInterval>` alias threaded through `SSEClock`. No `@ts-ignore`.
- `2d5e7ac` cli + cli/e2e: `isolatedDeclarations: false` carve-out (LD-10) — see drift
  IMPL-D-2. CLI publish surface is Wave 6's; annotating here would collide with A6-v2.
- `03838d1` `deno fmt` of the 8 annotated files.
- `f16b31f` (T0): aspire public-barrel value/type export split (LD-1 publish prerequisite).

End state: `deno task check` = 0, `deno task lint` clean (340 files), `deno task fmt --check`
clean. `deno.lock` untouched. No `.md` edited by the generator.

### IMPL-2 — generator resumes here (handoff)

Remaining Phase-T slices, resequenced: **T1** (CI pin `v2.8.x`) → **T2** (`catalog:` +
28-member rewrite) → **T4** (four `--allow-slow-types` carve-outs + debt rows + 28-member
`publish:dry-run`) → **T5 last** (`deno ci` + per-fn coverage + `--parallel`, and the
APPROVED `deno audit` `@orpc/client` bump — the only slice permitted to move `deno.lock`).
Phase A (A1–A4) stays gated on Aspire 13.4 GA (LD-7), out of this resume's scope. The
generator runs as a supervised Codex session in WSL (`/home/codex/repos/netscript-deno28-upgrade`).

### R1 — subpath pins + dax normalization (2026-06-16)

- `104bfc5`: aligned `packages/fresh` and `packages/fresh-ui` inline Preact
  subpath specifiers with the root catalog (`preact ^10.29.2`,
  `preact-render-to-string ^6.7.0`) and normalized inline `@david/dax` pins to `^0.48`.
  Evidence: `deno task deps:latest --filter "preact*"` = 0 behind / 2 total;
  `deno task deps:latest --filter "@david/*"` = 0 behind / 1 total; targeted
  `deno check --no-lock --unstable-kv` passed for Fresh/Fresh UI entrypoints.

### R2 — plugin dead import-map prune (2026-06-16)

- `3e7368f`: removed only the import-map entries that `deps:why` reported as
  `likelyDeadImport=true` / `fullyRemovable=true` from `plugins/workers/deno.json` and
  `plugins/sagas/deno.json`.
- Removed evidence:
  - `@hono/hono` (workers + sagas): `sourceUsed=false`, `sourceHitCount=0`,
    `transitivelyPresent=false`, `likelyDeadImport=true`, `fullyRemovable=true`.
  - `@netscript/plugin-workers-core/presets` (workers): `sourceUsed=false`, `sourceHitCount=0`,
    `transitivelyPresent=false`, `likelyDeadImport=true`, `fullyRemovable=true`.
  - `@netscript/plugin-workers-core/schemas` (workers): `sourceUsed=false`, `sourceHitCount=0`,
    `transitivelyPresent=false`, `likelyDeadImport=true`, `fullyRemovable=true`.
  - `@netscript/plugin-sagas-core/integration/publisher` (sagas): `sourceUsed=false`,
    `sourceHitCount=0`, `transitivelyPresent=false`, `likelyDeadImport=true`,
    `fullyRemovable=true`.
  - `@netscript/plugin-sagas-core/streams` (sagas): `sourceUsed=false`, `sourceHitCount=0`,
    `transitivelyPresent=false`, `likelyDeadImport=true`, `fullyRemovable=true`.
- Kept candidate evidence: `hono` (`sourceUsed=true`, `sourceHitCount=13`), `zod`
  (`sourceUsed=true`, `sourceHitCount=104`), `@tanstack/db` (`sourceUsed=true`,
  `sourceHitCount=1`), and `@durable-streams/client` (`sourceUsed=true`, `sourceHitCount=2`).
- Re-sweep evidence: all other `imports` members were checked with `deps:why`; only the four
  additional entries above returned `fullyRemovable=true`.
- Gates: scoped check passed with
  `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/workers --root plugins/sagas --ext ts,tsx`
  (wrapper command: `deno check --quiet --unstable-kv <files>`, 127 files, 2 batches,
  0 occurrences); scoped lint passed with
  `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/workers --root plugins/sagas --ext ts,tsx`
  (127 files, 0 occurrences).
