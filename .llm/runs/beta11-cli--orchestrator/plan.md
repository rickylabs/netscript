# Plan — beta11-cli--orchestrator (milestone 13 · 0.0.1-beta.11)

Supervisor run per `workflow/supervisor.md`. Deliverable: milestone 13 shipped — the Desktop
Frontend wave (#840), #826, the #824 seed sub-run, the docs quality track, and the CLI fixes —
each phase group its own branch + draft PR + evaluator pass. GitHub milestone 13 is the single
source of truth; this plan is its execution map.

## Archetype & overlays

- Multi-archetype supervisor run. Per group: #841/#842 SDK surfaces (ARCHETYPE package lanes),
  #843 `SCOPE-frontend` (fresh-ui L2), #452/#456/#457 CLI/tooling + `SCOPE-service` where the
  release server lands, #826 service package, docs groups `SCOPE-docs`. Each group's nested run
  selects its exact archetype at group launch (group-level Plan-Gate re-verifies).
- Doctrine verdict: consult `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` at
  each group launch.

## Branch topology (LOCKED)

- **Integration branch** `feat/desktop-frontend` (off `origin/main` @ ca72db14) for the #840 wave.
  Groups branch `feat/desktop-frontend-<group>`, sub-PRs target the integration branch; one
  supervisor PR to `main` at wave close (Closes #840 sub-issues via sub-PR keywords).
- **Direct-to-main PRs** for independent lanes: `fix/826-aggregate-health`,
  `fix/804-dry-run-writes`, `fix/802-plugin-cli-help`, `fix/818-min-dep-age-lockstep`,
  `docs/814-mcp-readme`, `docs/815-package-readmes`, `docs/816-main-readme`.
- **Seed run** #824 on `plan/unified-runtime` (drafts-only until owner stage-H ratification).
- This plan itself lives on `plan/beta11-shipping-wave` (run-dir commits only — the supervisor's
  commit trail).

## Phase groups & DAG (LOCKED)

| Group | Issue(s) | Branch | Impl lane (lane-policy) | Deps |
| --- | --- | --- | --- | --- |
| G1 | #826 health fix | `fix/826-aggregate-health` | Sol · low (`light_implementation`) | — |
| G2 | #841 auto-update SDK | `feat/desktop-frontend-841-autoupdate` | Sol · high (`complex_implementation`) | — |
| G3 | #842 oRPC bindings | `feat/desktop-frontend-842-bindings` | Sol · high | — |
| G4 | #452 generator desktop type | `feat/desktop-frontend-452-generator` | Sol · medium (`normal_implementation`) | — |
| G5 | #843 fresh-ui desktop components | `feat/desktop-frontend-843-ui` | Sol · medium | G2 (update-UX blocks) |
| G6 | #456 packaging + release server | `feat/desktop-frontend-456-packaging` | Sol · high | G2, G4 |
| G7 | #457 thin-client e2e | `feat/desktop-frontend-457-e2e` | Sol · medium | G2, G6 |
| G8 | #824 seed run | `plan/unified-runtime` | seed-run stages per `seed-run.md` (Tier A/B/C per stage) | — (parallel) |
| G9 | #804 dry-run fix | `fix/804-dry-run-writes` | Sol · low | — |
| G10 | #802 help-text fix | `fix/802-plugin-cli-help` | Sol · low | — |
| G11 | #818 min-dep-age | `fix/818-min-dep-age-lockstep` | Sol · medium | — |
| G12 | #814 mcp README | `docs/814-mcp-readme` | Fable 5 · high (doc-authoring exception) + doc-audit pipeline | — |
| G13 | #815 package READMEs | `docs/815-package-readmes` | Fable high/low per class + per-batch Sol audit | G12 (voice/consistency) |
| G14 | #816 main README | `docs/816-main-readme` | 4-lane pipeline per issue body | G12, G13 |

Wave 1 (parallel): G1, G2, G3, G4, G9, G10, G8-kickoff. Wave 2: G5, G6, G11, G12. Wave 3: G7,
G13. Wave 4: G14 (slips to beta.12 if the window closes — safe to defer, owner notified).
Concurrency cap: ≤3 active Codex implementation groups at once (steering bandwidth + review debt).

## Review & eval routing (per lane-policy — no restated table)

- Effort-paired slice review: Sol·low → Opus·high; Sol·medium → Fable·low; Sol·high →
  Fable·medium. Tier-A (this session) substantively reviews every landed slice before sign-off.
- Formal PLAN-EVAL/IMPL-EVAL per group: separate session, `formal_evaluation` lane (OpenRouter
  Qwen open model) — never closed models on that transport. Supervisor triggers; sub-agents NEVER
  self-dispatch evals (memory: codex-self-arranged-evals).
- Docs groups: doc-audit profile (`docs_audit` Sol·medium/high changeset-scope, `docs_polish`
  Fable·medium).

## Architecture decisions LOCKED

1. **Native-first Option A** (owner-ratified in issue bodies) — no snapshot-updater work in this
   wave; #456 is native-formats + release server + #841 wiring only.
2. **#841 is the only consumer-facing update seam** — apps never touch `Deno.autoUpdate` directly;
   the seam absorbs the `Deno.desktop` namespace churn.
3. **One release-server lineage** — native `latest.json` + Ed25519 envelope now; beta.14 graph
   manifest is a superset. No second manifest format.
4. **Desktop gating pattern** — feature-detect via local structural types (POC `desktop-chrome.ts`
   pattern); no `any`, no ambient augmentation; web/Aspire builds no-op. Applies to #841/#842/#843.
5. **#818 direction (a)** — lockstep-only `--minimum-dependency-age=0` at CLI-internal shell-outs
   + docs; third-party age policy untouched. (Issue body already states "prefer (a)+docs".)
6. **#802 direction (c⁠→⁠b hybrid, decided at group plan-gate)** — group's own plan resolves a vs
   b vs c with evidence; safe to defer to group level.
7. **Windows e2e legs** run on the owner's Windows host via the #393/#394 deploy-e2e harness;
   Linux in CI; macOS best-effort. `gate:e2e` boxes only checked on green runs actually executed.

## Open-decision sweep

- #802 exact option (group-level, safe to defer — decision recorded at G10 plan-gate).
- #816 in/out of beta.11 (safe to defer; slip = owner note, no rework risk).
- Seed-run #824 board content (owner decides at stage H — hard boundary, not ours).
- All other decisions above are LOCKED; none forces rework if the deferred ones move.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Upstream `Deno.desktop` churn mid-wave | #841 seam isolates; pin Deno version in CI; drift.md on any API change |
| Windows e2e needs owner host availability | schedule G7 legs with owner; Linux leg lands first; never false-check the gate |
| Review debt from 6 parallel Codex groups | concurrency cap 3; effort-paired ladder; Tier-A review before every sign-off |
| beta-8 lesson: stop-line breach under bypassPermissions | stop-lines repeated verbatim in EVERY brief; no merge without CI green + opposite-family PASS; release/milestone-close = owner in-turn only |
| Codex limit re-exhaustion (3 resets remain) | Sol·low default; medium/high only where the plan says; no Fable swarms (memory: subagent-model-routing) |
| jsr slow-types / text-import regressions on new SDK surfaces | jsr rubric + `quality:scan` + `arch:check` per slice; string-constants doctrine |

## Debt implications

New public surfaces (#841/#842/#843/#452 types) must land debt-free or file entries in
`debt/arch-debt.md`. #456's deferred snapshot updater is not debt — it is scheduled scope (#834,
beta.14).

## Deferred scope

Snapshot updater + Windows real apply (#834/#825, beta.14); local graph/PM composition (#830,
beta.14; PM #510 beta.12); #454 in-process composition (re-homed via #824 seed run); graph-mode
e2e (SD-8 #838).

## Gate matrix (per group, from archetype matrix + issue acceptance)

Scoped check/lint/fmt wrappers + `quality:scan` + `arch:check` on every `packages/**`/`plugins/**`
slice; jsr rubric + consumer-compile on public-surface groups (G2/G3/G4/G5/G6); plugin/temp-dir
regression tests G9; `scaffold.runtime` health assertion G1; deploy-e2e G7; doc-audit gates
G12–G14; `deno task e2e:cli` at merge-readiness per group; release gates NOT run (no release in
this plan without owner in-turn sign-off).
