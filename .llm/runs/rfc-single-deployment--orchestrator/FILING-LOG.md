# FILING-LOG — RFC #820 board filing (owner-ratified + owner-authorized, 2026-07-17)

Executed once from the committed manifest `.llm/tmp/rfc820/file-board.ts` (raw result:
`filing-log.json`). All operations succeeded.

## Created

| Draft id | Live | Title (short) | Milestone |
| --- | --- | --- | --- |
| — | milestone **16** | `0.0.1-beta.14` — desktop singleton-graph wave | — |
| — | label | `epic:unified-runtime` (parity added to `.github/labels.yml` in this PR) | — |
| U | **#823** | epic: Unified Single-Runtime Deployment (Nitro v3) | 0.0.1-beta.13 |
| US | **#824** | plan: unified-runtime seed run | 0.0.1-beta.11 |
| PKG | **#825** | NetScript.Aspire.Packaging — .NET ATS-exported hosting integration | 0.0.1-beta.11 |
| NS-H1 | **#826** | fix(service): aggregate health excludes unconfigured adapters | 0.0.1-beta.11 |
| PM-A | **#827** | pm: graph adoption & reconcile contract | 0.0.1-beta.12 |
| PM-B | **#828** | pm: supervised-child runtime helper (pipe-EOF) | 0.0.1-beta.12 |
| NS-P1 | **#829** | plugins: compile-able `./services` entrypoints | 0.0.1-beta.12 |
| SDE | **#830** | epic: Desktop Singleton-Graph Deployment | 0.0.1-beta.14 |
| SD-2 | **#831** | PackagingModel + manifest compiler + Aspire publish step | 0.0.1-beta.14 |
| SD-1 | **#832** | desktop supervisor host | 0.0.1-beta.14 |
| SD-3 | **#833** | installers: scopes, ACLs, journaled ops, port registry | 0.0.1-beta.14 |
| SD-4 | **#834** | graph update transaction | 0.0.1-beta.14 |
| SD-5 | **#835** | first-run provisioning phase | 0.0.1-beta.14 |
| SD-6 | **#836** | end-user health surface widget | 0.0.1-beta.14 |
| SD-7 | **#837** | composition-modes doctrine + conformance suite | 0.0.1-beta.14 |
| SD-8 | **#838** | graph deploy e2e + fault suite | 0.0.1-beta.14 |
| SD-H | **#839** | Linux OS containment backstop | 0.0.1-stable |

## Adjusted

| Issue | Action |
| --- | --- |
| #456 | retitled + re-scoped: single-artifact substrate (bootstrap/journal/Windows apply/trust); graph → SD-4 #834; deps #452/#454/#825 |
| #457 | retitled + re-scoped: single-artifact e2e (Win+Linux); graph e2e → SD-8 #838 |
| #452 | re-scope note: dev resource + packaging hook; graph → SD-2 #831; public `./types` jsr gate |
| #451 #453 #454 #455 | re-homed to unified epic #823 (comment + label `epic:unified-runtime`; milestone → Backlog/Triage pending seed #824) |
| #512 (PM-1) | amendment: `tcp` + `process-lingering` probe kinds (public types, jsr) |
| #516 (PM-5) | amendment: `clearEnv` + strip list (public `RuntimeCommandSpec` extension) |
| #526 (PM-15) | amendment: `KillMode`/`Requires`/`Type=oneshot`/`RemainAfterExit` knobs (internal; re-decided at PM-20) |
| #543 (PM-32) | amendment: Windows-caveat acceptance line superseded by #456's apply path |
| #458 | milestone → 0.0.1-stable |
| #349 | **closed** — superseded by unified epic #823 (comment) |
| #510 (PM epic) | body: PM-A #827 + PM-B #828 added; PM-first shipping note |
| #327 (deploy epic) | body: restructure note — children #823/#825/#830; ratified shipping order |

## Supersession map

`KEEP` (re-homed): #451 #453 #454 #455 → epic #823 pending seed #824. `CLOSE` (superseded, with
pointer): #349 → #823. Everything else: adjusted in place, nothing deleted.

**After this filing, GitHub is the single source of truth**; run docs carrying stale milestone/
sequencing claims (plan.md rev 10 §A.1/§E.2 beta.11 single-runtime-lane framing) are historical —
authority banner: GitHub wins on conflict.

## Option-A pass (same day, owner-ratified — native-first thin-client)

| Item | Live | Notes |
| --- | --- | --- |
| Desktop Frontend epic | **#840** | beta.11 — "the full frontend as a desktop app, the NetScript way"; children #452/#456/#457 + D1/D2/D3 |
| D1 SDK auto-update wrapper | **#841** | typed `Deno.autoUpdate` mechanism; isolates `Deno.desktop` churn (denoland/deno#35939); Windows staged-detection + manual UX (upstream apply tracked: denoland/deno#35269) |
| D2 type-safe bindings | **#842** | port shim over the bind channel + oRPC MessagePort adapter — contract-first window RPC (replaces manual `bindings.d.ts`) |
| D3 fresh-ui desktop components | **#843** | tray/menus/dialogs/notifications/window chrome, desktop-gated |
| label | `epic:desktop-frontend` | + labels.yml parity |
| #456 / #457 / #452 | re-scoped | native-first: native formats + release server (native `latest.json` lineage) + wrapper wiring; e2e = macOS/Linux apply+rollback proof + Windows manual path; labeled into #840 |
| #825 | milestone → **beta.14** | .NET/ATS packaging integration becomes load-bearing at the full-stack single-output tier (#833/#834); converges for free if upstream Windows apply lands |
| #327 | body addendum | Option-A tiering + new child #840 |

## Hybrid-tier pass (same day, owner-directed)

| Item | Live | Notes |
| --- | --- | --- |
| PM-C Task Scheduler adapter | **#844** | beta.13, Part of #510 — cron-policy processes compile to Scheduled Tasks; wraps `schtasks` now; adopts `Deno.cron.persistent` (denoland/deno#33965 — verified: API scaffold open, backends pending) when upstream lands |
| Windows hybrid tier | **#845** | beta.13, Part of #327 — window app + sidecars as Servy services & Scheduled Tasks; prosumer CLI install v1 (no .NET dep); consumer MSI variant folds into #833/#825 @ beta.14 |
| #510 / #327 | body addenda | PM-C + hybrid-tier entries |
