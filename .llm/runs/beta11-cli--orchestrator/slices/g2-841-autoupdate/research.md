# Research — G2 #841 SDK auto-update

## Re-baseline

- Carried-in sources:
  - PR #822 `rfc.md`, current owner-ratified Option-A text on `plan/rfc-single-deployment`.
  - `.llm/runs/rfc-single-deployment--orchestrator/plan.md` rev 10 at `11729a16`.
  - Parent run `.llm/runs/beta11-cli--orchestrator/plan.md` and G2 briefing at
    `plan/beta11-shipping-wave`.
- Re-derived against `feat/desktop-frontend` and `origin/main` at
  `ca72db14fbbfd42aa60e37c7aea730ed9a81585c` on 2026-07-17. Both refs were identical when the
  nested run started.
- What changed versus rev 10:
  - Rev 10 made the snapshot updater authoritative and said `Deno.autoUpdate()` must never be the
    authority. Owner-ratified Option A in live epic #840, issue #841, issue #456, issue #457, and
    the later RFC revision supersedes that for window-only thin clients: native `Deno.autoUpdate`
    is now the beta.11 mechanism, while the snapshot updater moved to #834/#825 in beta.14.
  - Rev 10's release lineage remains useful: per-channel/per-architecture release paths and a
    stable default, with the graph manifest later extending rather than forking the native format.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | Live #841 requires typed callbacks, per-arch URL wiring, launch/interval policies, channel config, app-config Ed25519 pinning, a plain-`deno run` no-op, Windows manual UX, and rollback telemetry. It also locks #841 as the sole consumer update seam. | [Issue #841](https://github.com/rickylabs/netscript/issues/841) |
| 2 | Owner-ratified Option A makes native auto-update the window-only beta.11 tier and defers combined-artifact snapshot updates to beta.14. | [Epic #840](https://github.com/rickylabs/netscript/issues/840), PR #822 `rfc.md` F4 / OF-L |
| 3 | The release lineage is per-channel and per-architecture. Rev 10 names `<channel>/<arch>/latest.json` and a stable-only v1; the current RFC keeps the server per-channel/per-arch and one manifest lineage. | `git show 11729a16:.llm/runs/rfc-single-deployment--orchestrator/plan.md` §C.2; PR #822 `rfc.md` §6.1 |
| 4 | Upstream PR #35939 is still open. It moves the API from top-level `Deno.autoUpdate` / `Deno.desktopVersion` to `Deno.desktop.autoUpdate` / `Deno.desktop.appVersion`; this is more than nesting because the version property is renamed. | [denoland/deno#35939](https://github.com/denoland/deno/pull/35939), live PR diff |
| 5 | Upstream `autoUpdate` is a fire-and-forget `void` API. It schedules the first check after one second, optionally owns an internal interval, stops that interval after staging, and exposes no cancellation handle. | `cli/rt/desktop.rs` at upstream PR #35939 head; captured PR #822 `resources__deno-desktop__auto_update.md` |
| 6 | Windows apply/rollback remains an open upstream platform gap: patches stage, but the launcher does not swap them in. The `onUpdateReady` callback is therefore the truthful staged-state signal on Windows. | [denoland/deno#35269](https://github.com/denoland/deno/issues/35269) |
| 7 | Plain `deno run` on this worktree's Deno 2.9.3 exposes neither old nor proposed desktop properties. Feature detection must treat missing, `undefined`, and `null` version shapes as disabled. | `deno eval` structural probe recorded 2026-07-17 |
| 8 | `@netscript/sdk` is doctrine Archetype 4 with verdict **Keep** and already curates focused subpaths. A new `./auto-update` subpath avoids inflating the large root barrel. | `deno doc packages/sdk/mod.ts`; `packages/sdk/deno.json`; doctrine file 10 |
| 9 | Existing SDK code already consumes `@netscript/telemetry/tracer`; `getTracer`, `withSpanSync`, and span events provide a package-native rollback reporting path. | `deno doc packages/telemetry/mod.ts`; `packages/sdk/src/client/http-client-link.ts` |
| 10 | Current SDK publish dry-run is green and reports no slow-type diagnostics. The structured JSR helper emits one false-positive banner warning; raw `deno publish --dry-run --allow-dirty` is authoritative. | Package dry-run exit 0 on 2026-07-17; `jsr-audit` skill slow-type rule |
| 11 | Full-export `doc:lint` has one pre-existing transitive `private-type-ref` in `packages/plugin-streams-core/src/application/create-durable-stream.ts`, reached through the SDK streams subpath. The new `./auto-update` surface must itself add zero diagnostics and must not deepen that unrelated baseline. | `deno task doc:lint --root packages/sdk --pretty` on 2026-07-17 |
| 12 | No SDK-specific open architecture-debt entry matches this change; new code must land debt-free. | `rg packages/sdk .llm/harness/debt/arch-debt.md` |

## jsr-audit surface scan (package wave)

- Current surface scanned: all ten `@netscript/sdk` export-map entrypoints plus the proposed
  `@netscript/sdk/auto-update` entrypoint.
- Baseline evidence:
  - `deno publish --dry-run --allow-dirty` from `packages/sdk` — exit 0, no actual slow-type warning.
  - `deno task doc:lint --root packages/sdk --pretty` — one unrelated transitive baseline
    `private-type-ref`; zero missing JSDoc.
  - `.llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text` — publishable; helper
    overcounts the literal "Checking for slow types" banner as one warning.
- Planned-surface risks and mandatory controls:
  - Every exported function, constant, and callback/result type needs an explicit declaration type
    and complete JSDoc so `isolatedDeclarations` and JSR stay fast.
  - The subpath entrypoint needs `@module` docs and a runnable example.
  - No ambient augmentation and no `any`; old/new upstream shapes are local structural types guarded
    from `unknown`.
  - No `with { type: "text" }`, runtime file reads, or generated text imports. All finite values
    (statuses, apply modes, telemetry names, stable default channel) are TypeScript constants with
    derived types.
  - Internal package imports remain relative; the only bare self-import is in an excluded consumer
    compile fixture, never production source.
  - Publish list must include only the new source and exclude tests as the current whitelist does.

## Open questions resolved by the plan

- **How does Windows get a trustworthy installer link?** From required `manualUpdateUrl` in the
  app's compiled release config, not from unsigned extra manifest metadata. #456 supplies/wires the
  real URL later without changing the SDK contract.
- **What is the release URL convention?** `<baseUrl>/<channel>/<Deno.build.os>-<Deno.build.arch>`,
  matching rev 10's channel/arch order and upstream's `os-arch` example.
- **What happens when `checkOnLaunch` is false?** A required interval delays the first installation
  of the upstream updater; after that, upstream owns its interval. The result is explicit that no
  cancellation handle exists because upstream exposes none.
- **How does Windows change when upstream apply ships?** One internal platform-capability constant
  controls event classification. No consumer API or call site changes.

