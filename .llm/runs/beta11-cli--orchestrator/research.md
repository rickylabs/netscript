# Research — beta11-cli--orchestrator

Fetched 2026-07-17. Sources: live GitHub milestone 13 (API, verified this session — see
`issue-bodies.md` for full bodies), PR #822 RFC record + `.llm/runs/rfc-single-deployment--orchestrator/`,
kickoff.md, lane-policy.md.

## Re-baseline

- `origin/main` @ `ca72db14` (docs(release): recovery patterns #819). Recent train: #812 canary
  channel, #817 e2e single-process fix — the release machinery the wave depends on is on main.
- Current checkout branch is `plan/rfc-single-deployment` (RFC record — untouched). All work
  branches re-baseline from `origin/main`.
- Live milestone 13 (`0.0.1-beta.11`, MS number 13): **15 open issues, 5 closed** — verified via
  API this session. The kickoff-named set is confirmed live; the milestone ALSO carries strays the
  kickoff did not enumerate: #818 (min-dep-age exposure), #814/#815/#816 (docs quality track,
  ordered #814+#815 → #816), #804 (`--dry-run` writes files), #802 (phantom `ns-<plugin>` help
  text). GitHub is the single source of truth → these are in scope for the run plan.

## Findings — board composition (each verifiable in `issue-bodies.md`)

1. **Epic #840 Desktop Frontend** (Option A, owner-ratified 2026-07-17): native-first — lean on
   `deno desktop` native packaging formats + native `Deno.autoUpdate()`; thin-client product story
   (window on consumer machines, services in vendor cloud via `services__*` remote URLs). Sub-issues
   #452, #456, #457, D1 #841, D2 #842, D3 #843.
2. **#841 SDK auto-update wrapper**: typed seam over `Deno.autoUpdate` isolating upstream churn
   (`Deno.desktop` namespace PR denoland/deno#35939); Windows staged-not-applied honesty
   (denoland/deno#35269); Ed25519 publicKey pinning; rollback telemetry. Gates: unit tests incl.
   `Deno.desktopVersion === null` no-op; e2e via #457; jsr rubric.
3. **#842 oRPC MessagePort bindings**: port shim over the bind channel + oRPC RPCHandler/RPCLink;
   fresh wires window side desktop-gated. Gates: typed round-trip + error mapping + Uint8Array;
   per-window isolation; browser/Aspire no-op parity; jsr rubric.
4. **#843 fresh-ui desktop components**: tray/menus/dialogs/notifications/window chrome; update-UX
   blocks consuming #841; docs page. Gates: web-mode no-op; desktop smoke via #457; fresh-ui L2;
   jsr rubric.
5. **#452 generator desktop app type**: 4th `desktop` branch in
   `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`; extends
   PUBLIC `@netscript/aspire` `./types` (`AppType`/`AppEntry` + `"desktop"`) → full jsr rubric +
   consumer-compile gate. Build-order gate, `--backend cef`, discovery injection without
   `withHttpEndpoint`, `Enabled:false` default. Folds #375 (resolving PR carries `Closes #375`).
6. **#456 native packaging + release server** (Option-A re-scope): native formats pipeline via
   #452's hook; release server serving native `latest.json` + bsdiff + Ed25519 envelope (one
   lineage with beta.14 graph manifest); auto-update wiring through #841. Snapshot-updater
   machinery deferred to #834/#825 (beta.14). Deps: #452, #841. Windows = manual-fallback posture.
7. **#457 thin-client e2e** (Option-A re-scope): native install (Win MSI + Linux pkg; macOS
   best-effort) → auto-update apply + failed-launch rollback on macOS/Linux → Windows
   staged-detection/manual path → remote-services discovery smoke. Deps: #456, #841.
8. **#826 aggregate-health fix**: exclude unconfigured adapters from aggregate health
   (eis-chat#150 evidence: unused MySQL adapter poisons SQLite-only app health). Gates:
   per-adapter-class unit tests; consumer-compile; `scaffold.runtime` health-path assertion.
   Independent of the desktop wave — can land first.
9. **#824 unified-runtime seed run**: planning sub-run per `workflow/seed-run.md` (stages A–I);
   Nitro v3 validation corpus, composition contract, epic decomposition, supersession map for
   #451/#453/#454/#455 + #349. **Drafts-only until owner ratifies in-turn** (stage-H boundary).
10. **Docs track**: #814 (`@netscript/mcp` README, Fable 5 high) and #815 (all-package READMEs,
    Fable high/low by class) land BEFORE #816 (main README, 4-lane pipeline: agy research → Opus
    swarm → Fable high redaction → Sol xhigh adversarial). Doc-audit profile applies
    (`workflow/doc-audit.md`). CLAUDE.md documentation-authoring exception permits Claude lanes for
    these — validation stays opposite-family.
11. **CLI fixes**: #804 `--dry-run` writes real files (temp-dir regression test required); #802
    phantom `ns-<plugin>` shorthand in help text (options a/b/c, source-side only); #818
    min-dep-age user exposure (direction to decide: prefer (a) lockstep-only
    `--minimum-dependency-age=0` + docs; never blanket-disable).

## Upstream facts (kickoff-verified; re-verify only if load-bearing during implementation)

- Windows `Deno.autoUpdate` apply unsupported — patches staged, launcher does not swap
  (denoland/deno#35269).
- Desktop APIs moving under `Deno.desktop` namespace (denoland/deno#35939) — #841's seam exists to
  absorb this.
- `Deno.cron.persistent` scaffold upstream (denoland/deno#33965) — background context for #824.

## jsr-audit surface scan (plan-relevant)

Wave touches public surfaces: `@netscript/aspire` `./types` (#452), new SDK surface (#841, #842),
`@netscript/fresh` (#842), `@netscript/fresh-ui` (#843). Every one of these groups carries the jsr
rubric + consumer-compile gate in its issue acceptance; `quality:scan` + `arch:check` are mandatory
per slice (harness law — the #745 lesson). Text-import doctrine applies (string constants — JSR
lineage memory): no `with { type: "text" }` imports in published packages.

## Open questions the plan must close

- OQ1: Group ordering/parallelism across the desktop wave given deps (#452, #841 → #456 → #457)
  and independent lanes (#826, #842, #843-partial, docs, CLI fixes). → resolved in plan.md (DAG).
- OQ2: Integration branch vs direct-to-main PRs. → resolved in plan.md (hybrid).
- OQ3: #818 direction (a/b/c) — issue says "prefer (a)+docs"; is that decision ours? → treat (a) as
  the working direction per issue body; record as safe-to-proceed, owner can veto on the PR.
- OQ4: #457 platform coverage in CI (Windows MSI install e2e needs a Windows runner). → plan
  resolves: Windows legs run on the owner's Windows host via the existing deploy-e2e harness
  (#393/#394 pattern); Linux legs in CI. False-closed-checkbox discipline applies.
- OQ5: Whether #816 fits beta.11 at all (blocked by #814+#815, heavy 4-lane pipeline). → plan
  sequences it last; if the window closes, it slips to beta.12 with owner note (safe to defer).
