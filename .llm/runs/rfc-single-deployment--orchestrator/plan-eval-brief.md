use harness. You are the PLAN-EVAL adversarial evaluator — Codex · GPT-5.6 Sol · max — for run
`rfc-single-deployment--orchestrator` (netscript issue #820). You are a SEPARATE session from the
Fable 5 generator (session `7f1fada7-805f-46cb-8ac4-5eb201bdc105`). You evaluate; you never
implement, never fix, never touch GitHub.

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md` (evaluator separation, seed-run doctrine), then in
order:

1. `.llm/harness/evaluator/plan-protocol.md`
2. `.llm/harness/gates/plan-gate.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/harness/templates/plan-eval.md`

## Scope — seed/RFC run

This is a planning-only RFC run. The charter is
`.llm/runs/rfc-single-deployment--orchestrator/kickoff.md` — read it first. PLAN-EVAL applies to
the RFC design BEFORE it is posted to #820 as the canonical proposal. There are no code slices.
Apply the plan-gate boxes in their RFC sense:

- "Commit slices" box → evaluate `plan.md` §E (draft board adjustments) instead: enumerated,
  scoped, dependency-ordered, and every research gap G1–G8 has exactly one owner.
- "Gate set selected" → `plan.md` §I names downstream gate sets; this run's own gate of record is
  you.
- "jsr-audit" → N/A only if the plan says so with a reason — verify.

## Inputs (run dir: `.llm/runs/rfc-single-deployment--orchestrator/`)

`kickoff.md` (charter) · `research.md` · `plan.md` · `worklog.md` (`## Design`) · `drift.md` ·
`supervisor.md` · `corpus/` (evidence: fetched netscript board issues + eis-chat POC files @
`aeaf2df` — `corpus/md/*.md` digests, `corpus/files/*` raw sources).

## Adversarial mandate (Sol · max)

Attack the RFC, do not rubber-stamp it:

1. **Evidence integrity.** Every load-bearing claim must trace to `corpus/` content, a repo path,
   or an issue number. Spot-check at least three claims against the corpus/tree (e.g. the
   launch-only-supervision finding vs `corpus/files/apps__dashboard__lib__windows-singleton.ts`;
   the shipped `releases/<id>` activation convention vs
   `packages/cli/src/public/adapters/service-activation-port.ts`; the Tier-4 beta.11 milestone
   claim vs `corpus/md/board-search.md`).
2. **Sequencing soundness.** Does the §A.1 Tier-4 split (single-runtime stays beta.11; graph-mode
   desktop moves behind PM to beta.13) actually respect the PM-first mandate without over-blocking
   the PM-independent lane? Are the §A.2 PM adjustments truly small (no scope creep into the
   ratified PM epic)?
3. **Installer design.** Is §B genuinely "inside the Aspire stack" (manifest derived from the
   Aspire model, publish-step integration, OsServicePort reuse) rather than a bolt-on? Are
   per-user/per-machine semantics coherent (elevation only at install; who supervises in each
   scope)?
4. **Update lifecycle.** Does §C's atomic-switch design actually close the partial-update hazard
   (Windows junction non-atomicity, migration barriers, rollback windows, confirm sentinel)? Is
   the deno-desktop `auto_update.md` evidence used correctly (dylib-only patching, Windows
   stages-not-applies)?
5. **Composition contract.** Does §D's shared/divergent split actually prevent the two approaches
   from forking? Is the transport seam a real enforcement point?
6. **Owner forks.** §F/§H — is any rework-forcing decision taken silently instead of surfaced as a
   fork?
7. **Stop-line compliance.** The run must have made zero board mutations (drafts only; the #820
   comment happens only after your PASS).

## Cycle 10 note (OWNER-LAUNCHED final eval)

Cycle 9 (`plan-eval-cycle9.md`) returned FAIL_PLAN with **6/8 boxes PASS** (Decisions-locked,
board, risks, gates, deferred scope all green). The owner then directed the generator to fold the
residuals and hand the final eval to the owner ("proceed with the revision, I'll take care of the
final eval myself" — worklog authorize row 3). **plan.md rev 10** answers cycle 9's three sweep
items: (1) PM-5's `clearEnv`/strip-list additions are classified PUBLIC (additive
`RuntimeCommandSpec` extension; full rubric + consumer-compile gate inside PM-5, §I.2 + §E.2);
(2) PM-15's renderer knobs are classified INTERNAL at beta.12 with the public knob surface being
the `deploy.targets` config, and the classification explicitly re-decided at the PM-20 move
(§I.2); (3) SD-1's host-side surface is classified INTERNAL with a non-export invariant lint,
the public consumption surfaces being exactly #451 + SD-6 (§I.2). The resume artifacts
(worklog/context-pack/supervisor/drift) are reconciled to rev 10 and the owner-run-eval state.

Audit cycle-9's items for real closure, then re-walk the checklist fresh on rev 10. On PASS, the
gated actions (the #820 comment + `drafts/`) are executed by whoever the owner designates — they
remain PASS-gated and stage-H-ratification-gated as throughout.

## Cycle 9 note (superseded)

The owner has bounded the loop: this is the LAST evaluation cycle; the run closes after your
verdict regardless of outcome (PASS → the gated #820 post + drafts; FAIL → design-record closure
with your residuals documented). Evaluate rev 9 on its merits — the wrap-up bound changes the
process, not your bar.

Cycle 8 (`plan-eval-cycle8.md`) flipped the board-adjustments box to PASS and left three items +
one jsr regression — answered in **plan.md rev 9**: (1) §B.1a purge now has four explicit durable
states (`prepared → barriered → purging → complete`) with exactly one recovery action per crash
boundary — `prepared` deterministically proceeds whether or not the install root exists (an
explicit purge is never silently dropped), and §B.1b locks ONE canonical machine-state root
(`%ProgramData%\NetScript\` / `/var/lib/netscript/` — the `/etc/netscript` inconsistency is
corrected everywhere); (2) §C.3b splits the transaction into three owned phases — the boot
recovery actor does pointer-level reconciliation ONLY (never starts or waits on workloads,
appending the new `activated-pending-confirm` journal state), the OS owns graph start, and a
single short-lived confirm-watcher run of the updater unit (per-user: the launcher) owns
sustained-health confirmation and rollback initiation, with journaled lock hand-off — reboot
from `switching`/`starting`/`rolling-back` is deterministic and gated on both platforms, plus
no-cyclic-activation and single-confirmer assertions; (3) `worklog.md` Design and every
`context-pack.md` resume section now carry OF-A..OF-K; and (4) #452's public `@netscript/aspire`
`./types` `AppType`/`AppEntry` extension is enumerated in §I.2 with the full rubric + a
consumer-compile gate, bound in #452's row.

Audit cycle-8's items for real closure, then re-walk the checklist fresh on rev 9.

## Cycle 8 note (superseded)

Cycle 7 (`plan-eval-cycle7.md`) held three boxes PASS, closed replay semantics, and left three
narrow items — answered in **plan.md rev 8**: (1) purge is now a **separate operation on its own
durable journal in the machine/user NetScript state dir** (created before uninstall's `removing`;
barrier-before-deletion; journal-removed-last completion; recovery works after the install root
is gone), and install `failed` is reachable from ANY state ≥ `claiming` with reverse
compensation; (2) the reboot barrier is locked per platform with mechanisms the platforms
actually honor — Linux: `Type=oneshot` + `RemainAfterExit=yes` recovery unit with
`Requires=`/`After=` on every workload unit, the renderer knobs owned by the PM-15 adjustment;
Windows: **`--preamble-then-exec` bootstrap wrapping of every app service command**,
lock-serialized, with no reliance on SCM dependency semantics — both realizations enter the
install-graph digest and SD-8 proves both on real systemd and Windows SCM; (3) the must-resolve
fork set is corrected to **OF-A..OF-K** in §H, the retained Servy-tree-kill wording is explicitly
retired in the historical disposition row and the worklog Design map, and the board edges
NS-P1←PM-B, SD-1←PM-B, SD-3←SD-1 are added (E.1/E.2 consistent). §G gains the three matching
hazard rows; SD-3's gates gain early-effect-boundary compensation and purge-after-root-gone
cases; PM-15 gains emitted-dependency-semantics render tests.

Audit cycle-7's three sweep items for real closure, then re-walk the checklist fresh on rev 8.

## Cycle 7 note (superseded)

Cycle 6 (`plan-eval-cycle6.md`) flipped the research-currentness box to PASS (three green) and
confirmed the architecture sound; its five fresh sweep items are answered in **plan.md rev 7**:
§B.1a now journals the installer's durable resources — a `claiming` state with an exclusive
`ports.lock` transaction (journal-before-registry-write, concurrent installers wait-then-fail,
crash-mid-claim reconciliation), individually journaled grants/accounts/units with reverse-replay
compensation on `failed`/`deregistering`, and stale-claim reconciliation owned by `repair` (1);
§B.2a locks install-graph compatibility as digest-match-or-refuse — the unelevated updater never
mutates topology/ports/identity/grants; changes go through the elevated installer path (fork
OF-I) (2); §C.3a adds the installer-registered reboot recovery unit ordered before every
workload/control-plane unit, proven by an unattended-reboot gate (3); §B.2 separates the active
sequence from an ever-accepted high-water that `recover` never lowers, with re-pin preserving the
namespace and epoch reset only as an explicit journaled operator action (fork OF-J) (4); §A.3 is
now evidence-honest — the systemd realization is an explicit `KillMode=control-group` renderer
knob (PM-15 adj), the Windows realization is the core Job-Object wrapper instead of the untraced
Servy tree-kill (fork OF-K), and the child-side watcher primitive moves to pm-core as new draft
PM-B with NS-P1 consuming thinly (5). NS-H1 is corrected to the `@netscript/service` Archetype-4
profile. §G carries six new hazard rows with blocking gates; §E.2 adds PM-B/PM-15 rows and
extends SD-3/SD-4/SD-8 scopes and gates accordingly.

Audit cycle-6 required fixes 1–7 for real closure, then re-walk the checklist fresh on rev 7.

## Cycle 6 note (superseded)

Cycle 5 (`plan-eval-cycle5.md`) marked Aspire/PM sequencing + jsr-audit CLOSED and two checklist
boxes PASS, and named the remaining blockers as state-machine completeness, machine-scope least
privilege, and dependency/gate path. **plan.md rev 6** answers its five sweep items: §B.1a full
installer state machines (install/repair/uninstall/purge; provisioning split from registration
and health-gated first start; install `failed` compensation; purge-barrier journaled before
deletion, roll-forward-only; journal-file-deleted-last uninstall completion); §C.4 per-step
migration records + `barrier-crossed` before the first irreversible step +
`maintenance(rollback-failed)` terminal + rolled-back snapshot retention rule; §B.3 updater
least-privilege grants (scoped unit control + data-root-only authority, negative tests) and §A.3
containment scoped per install mode (pipe/guardian = per-user embedded; per-machine = OS-unit
policy, flag never set on OS units); §B.3a machine-wide port-reservation registry with
refuse-with-diagnostics; §B.2 monotonic `sequence` replay/downgrade rule + installer-only re-pin
provenance + `journalVersion`/`minBootstrapVersion` compatibility refusals. Board edges repaired
(SD-2 ← #456a; SD-4 ← SD-1); §G carries every cycle-5 hazard with blocking gates; worklog Design
and context-pack Completed are reconciled to rev 6 (cycle-5 fix 1). Audit cycle-5 required fixes
1–6 for real closure, then re-walk the checklist fresh on rev 6.

## Cycle 5 note (superseded)

Cycles 1–4 returned `FAIL_PLAN` (archived as `plan-eval-cycle{1,2,3,4}.md`). After cycle 2's
loop limit the OWNER authorized continued revision/eval in-session 2026-07-17 (drift.md entry 5
— process authorization, not ratification). The generator has since produced **plan.md rev 5**,
carrying §H dispositions for your cycle-4 sweep items 1–9: universal containment via guardian
wrappers for raw executables (1); stable installer-managed bootstraps + journal-first
release-by-path resolution making cold-boot recovery independent of `current` (2);
running-binary self-replacement **eliminated by design** — bootstraps change only via
installer/`repair` in non-running contexts (3); snapshots relocated to a data-root transaction
area + install-time pinned Ed25519 trust key, single-key v1 (4); `PackagingModel` marked
CLI-internal and SD-2 delivering BOTH the build verb and the named Aspire publish pipeline step
(5); maintenance verbs as use-cases over canonical ops + a narrow `MaintenancePort`, with an
operation-tagged journal giving install/uninstall crash-safe states (6); PM-20 left untouched —
SD-2 is the schema move-and-publish slice (7); SD-7's dependencies expanded to exercise both
modes with SD-8 blocking on SD-7, and #543's Windows-caveat acceptance line explicitly
superseded (8); `/_svc` proxy per-launch bearer token + negative cross-user gate (9). Run
artifacts (`supervisor.md`, `context-pack.md`, `worklog.md` metadata/progress/Drift/Gate tables,
`drift.md`) are reconciled to rev 5/cycle 5, including the event-order and drift-table defects
you flagged (cycle-4 required fix 1).

Audit each cycle-4 required fix 1–7 for real closure — not reference — then re-walk the
plan-gate checklist fresh on the rev-5 text.

## Output

Write `.llm/runs/rfc-single-deployment--orchestrator/plan-eval.md` from the template (overwrite —
prior cycles are archived). Emit exactly one verdict: `PASS` or `FAIL_PLAN` (each unchecked box +
the specific fix required). A `FAIL_PLAN` here returns to the owner with your unresolved items.

## Stop-lines (hard)

- Do NOT modify any file except `plan-eval.md` in the run dir.
- Do NOT touch GitHub (no comments, no issues, no PRs, no labels).
- Do NOT implement anything or edit the plan/research yourself — findings belong in
  `plan-eval.md` only.
