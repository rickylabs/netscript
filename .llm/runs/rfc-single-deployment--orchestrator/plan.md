# Plan — RFC: single deployment (issue #820) — rev 10 (self-contained; final eval to be run BY THE OWNER)

> **§J AUTHORITY BANNER — post-rev-10 owner ratification (2026-07-17 evening, Turn 2).** The owner
> ratified a revised direction and the board was FILED (`FILING-LOG.md`): the single-runtime
> product is its own epic **#823** (Nitro v3; seed **#824**; #451/#453/#454/#455 re-homed there —
> this plan's beta.11 "single-runtime lane" framing in §A.1/§E.2 is SUPERSEDED); the desktop
> singleton-graph epic is **#830** at new milestone **beta.14**; installer authoring is the
> first-class .NET Aspire integration **#825** (ATS-exported NuGet — OF-D resolved); ratified
> shipping order: **PM #510 (beta.12) → unified #823 (beta.13) → desktop graph #830 (beta.14)**.
> **GitHub and `rfc.md` rev 11 win over this document on sequencing/milestones/board shape.** The
> engineering designs in §§B–D (installer state machines, update transaction, containment,
> composition contract) remain the normative spec the filed issues reference.

Run `rfc-single-deployment--orchestrator` · generator Fable 5 · high · 2026-07-17.
Seed/RFC run: this plan **is** the RFC design and **stands alone** (no reference to prior revs is
normative). No implementation follows from this run; board changes stay drafts until stage-H
owner ratification. The owner's in-session authorization (2026-07-17, "authorized proceed — it's
a complex topic") authorizes the revision/eval loop to continue; it is **not** design
ratification or filing consent. Posting to #820 remains gated on PLAN-EVAL `PASS` + the kickoff's
deliverable order. Evidence: `research.md` (POC forensics @ eis-chat `aeaf2df`; board/repo
verification; Part 0 re-baseline @ `origin/main` `47cc2fa9` incl. debt reconciliation). Cycle
dispositions: cycle 1 → rev 2, cycle 2 → rev 3, cycle 3 → rev 4, cycle 4 → rev 5, cycle 5 →
rev 6, cycle 6 → rev 7, cycle 7 → rev 8, cycle 8 → rev 9, cycle 9 → this rev (§H table). Rev 10
folds cycle 9's surface-classification residual; per the owner's 2026-07-17 instruction
("proceed with the revision, I'll take care of the final eval myself"), the generator does not
launch further eval cycles — the staged evaluator brief covers cycle 10 for an owner-launched
run.

**Vocabulary.** *Single-runtime* = all logical services composed into one process (Tier-4 option
(c): #451/#453/#454). *Singleton-graph* = one installable desktop artifact containing a window +
supervised adjacent service graph (the eis-chat#150 POC shape). *Single deployment* = one
artifact, one install, one update — in either composition mode. *Release* = an immutable
versioned snapshot under `releases/<version>`. *Update authority* = the component owning the
update transaction (§C.3). *PackagingModel* = the typed source snapshot the manifest compiler
consumes (§B.4).

---

## §0 Design theses (locked)

- **L0.1 — The POC is evidence, not code** (research §1.8): NetScript adopts its seams
  (supervision need, dual-injection discovery, telemetry-at-compile, immutable release dirs,
  per-user data ownership) and none of its scripts.
- **L0.2 — PM is the foundation; the singleton-graph target consumes the PM engine** (prerequisite
  bar §A.3). Launch-only supervision is the POC's headline failure (research §1.1/§1.7-1).
- **L0.3 — One graph model end to end.** The generator's app model + typed deploy config are the
  only manifest inputs (§B.4); hand-maintained parallel maps are prohibited (research §1.2).
- **L0.4 — Installation and update expand the canonical deploy surfaces** (per
  `DEPLOY-ARCHETYPE-7-CORE-SEED`'s "never entrench a parallel surface"): installer = capability of
  the existing `DeployTargetPort` family + `OsServicePort` (§B.1); updater = extension of the
  shipped kernel deploy conventions. The Windows junction swap is remove-then-recreate,
  **non-atomic** (`service-activation-port.ts:16-20`): §C builds crash safety on a journaled
  transaction, never pointer atomicity.
- **L0.5 — Both composition modes are kept.** The single-runtime lane is PM-independent and
  completes install + update in beta.11 — including a tested Windows apply path (§C.1).
- **L0.6 — Enforcement is typed manifests + a cross-mode conformance suite** (§D); the transport
  seam selects transports only.
- **L0.7 — One update mechanism for everything NetScript packages.** The §C journaled
  release-snapshot transaction is the only apply mechanism from beta.11's single artifact to
  beta.13's graph. `Deno.autoUpdate()` (dylib-only; Windows stages-without-applying —
  `auto_update.md`) is never the authority; it is reserved only as a possible future bsdiff
  *transport* optimization via the manifest's optional per-artifact patches (TRACK).

---

## §A — PM-first sequencing

### A.1 Tier-4 split (final)

Live-board defect: Tier-4 (#451–#458) at beta.11 pre-dates the PM epic (beta.12) — research
§2.3-G1. Resolution by PM-dependency, preserving a **complete** beta.11 single-runtime story:

| Issue | Proposed action |
| --- | --- |
| #451 / #453 / #454 / #455 (single-runtime lane) | keep **beta.11**, unchanged |
| #452 desktop app type in generator | keep **beta.11**. Scope = the dev-stack desktop resource (extends the in-tree `buildTauriBlock` pattern) **plus the single-artifact packaging hook** (the `deno desktop` build invocation surface #456's own contract depends on). Only the *graph* packaging moves to SD-2 (beta.13). |
| #456 packaging + release/update server | **split (OF-C)**: `#456a` (**beta.11**, deps **#452 + #454** per the saved #456 contract) = single-artifact packaging (via #452's hook) + release server + the §C snapshot updater (stable bootstrap + release-resident worker, journal, Windows apply, sustained-health confirm, rollback, pinned trust key) + minimal first-run provisioning. Graph extension = **SD-4 (beta.13)**. |
| #457 desktop/single-process deploy-e2e | **split (OF-C)**: `#457a` (**beta.11**) = single-artifact deploy-e2e incl. the **Windows apply/rollback proof** (Linux leg begins closing `cli-deploy-linux-integration-untested`); graph e2e + fault injection = **SD-8 (beta.13)**. |
| #458 signing automation | **0.0.1-stable** (D4 posture) |
| #543 PM-32 console desktop packaging | **stays beta.12** (its contract is window-only console packaging on #456 mechanics + soft #451; #456a @ beta.11 satisfies the dependency without a move). |

### A.2 Adjustments to beta.12 PM sub-issues (acceptance-sized only)

1. **PM-1 #512:** readiness-probe vocabulary + `tcp` and `process-lingering` kinds
   (POC-validated; research §1.1). These probe types are **public contract surface** — jsr rubric
   applies (§I.2).
2. **PM-5 #516:** spawn supports `clearEnv` + a documented runtime-inherited-state strip list
   (`DENO_*` incl. `DENO_SERVE_ADDRESS`, `NODE_CHANNEL_FD`; Deno ≥ 2.9.3 floor,
   denoland/deno#35994).
3. **PM-A (new draft): graph adoption & reconcile contract** — durable process identity,
   PID/command validation, stale-registry behavior, ownership/restart authority, teardown
   semantics. Placement fork OF-G. PM-6/PM-9 untouched; in-process client transport belongs to
   #451/PM-11/SD-7.

### A.3 PM prerequisite bar + containment (locked)

| SD concern | Blocking PM slices |
| --- | --- |
| SD-1 supervisor host (all modes) | **PM-1..PM-14** (engine 1–6, control plane 9–13, log rotation 7, ordered teardown 8, subprocess telemetry 14) |
| Per-machine service modes (SD-3) | additionally PM-15/PM-16 (systemd knobs) + **PM-18** (#529 — wires the port-less registry descriptors; closes `DEPLOY-BAREMETAL-PUBLIC-WIRING`) |

**Containment (cross-platform, locked — covers EVERY manifest resource):** two layers.

1. **Parent-death detection, universal (v1, both platforms).** Every supervised resource is
   spawned with an inherited stdio pipe. Two realizations, one contract:
   - *NetScript sidecars:* the service entrypoint harness (NS-P1 / SD-1), in supervised mode
     (env flag), watches for pipe EOF and self-terminates within a bounded budget.
   - *Raw/external executables (Garnet-class tools, anything that cannot implement the
     contract):* the supervisor spawns them **through a generic guardian wrapper** — a tiny
     compiled NetScript process that holds the pipe, forwards signals, and on EOF kills its child
     via the PM-5 descendant-tree kill machinery, then exits. No manifest resource is exempt.
   Supervisor death (including hard kill) closes every pipe; the graph drains itself. Testable
   with a hard-kill fault gate that includes a **deliberately non-cooperative raw executable**
   (SD-8).
2. **OS-enforced backstops:** Windows Job Objects (kill-on-job-close) land **inside SD-1's
   acceptance at beta.13**. The Linux OS-enforced backstop (`PR_SET_PDEATHSIG` needs FFI;
   alternative: a cgroup/transient-scope spike) is **SD-H (stable)** — it defends the residual
   window where a guardian itself is hard-killed together with the supervisor.

**Containment is scoped per install mode (locked; evidence-honest):** the pipe/guardian contract
is the **per-user embedded-supervisor realization** — the supervised-mode flag is never set on
per-machine OS units (whose stdin closes immediately). **Per-machine realization, per platform:**

- *systemd:* the shipped unit renderer does **not** emit `KillMode` today
  (`kernel/adapters/linux/systemd/systemd-unit.ts`) — the app's rendered units therefore get an
  **explicit `KillMode=control-group`** via a new PM-15 renderer knob (within PM-15's ratified
  "extend the renderer" scope; byte-identical-when-unset preserved). systemd's cgroup kill is the
  documented OS guarantee once rendered.
- *Servy (Windows):* **no descendant-kill guarantee is traced** in the repo or corpus. v1
  realization therefore does not assume one: per-machine Windows workload units run their process
  under the **core Job-Object wrapper** (the same primitive SD-1's per-user mode uses,
  kill-on-job-close). If upstream Servy later proves tree-kill, dropping the wrapper is a
  cheap simplification (fork OF-K records the choice).

The child-side pipe-EOF liveness watcher + descendant-cleanup primitive is **core surface**, not
plugin-originated: it ships as a runtime helper in `@netscript/plugin-process-manager-core` (the
PM-16 `sd_notify`-helper pattern) via new draft **PM-B**; NS-P1 entrypoints and the guardian
consume it thinly (Archetype-5 thinness law respected). The realizations implement one
requirement — no manifest resource survives its supervisor/unit — asserted by SD-8's per-mode
containment gates, with the fallback ownership named (SD-3 owns the per-machine wrapper wiring).

**G1 closure statement (honest):** G1 closes at beta.13 with layer 1 (universal, guardian
included) on both platforms + the Windows Job-Object backstop. Until SD-H, the Linux residual
exposure is exactly: a guardian process killed in the same instant as the supervisor can orphan
its one child — documented, and the owner fork OF-H states this as the concrete ship
consequence. Process-group teardown (PM-5/PM-8) is orderly-shutdown machinery, **not**
parent-death containment, and is not claimed as such. In-process drain quality remains bounded by
the open `runtime-app-wide-shutdown-orchestrator` debt: §C budgets per-process stop timeouts.

---

## §B — Enterprise installation layer INSIDE the Aspire stack

### B.1 Port taxonomy (locked — no new axis)

Desktop/singleton targets are **`DeployTargetPort` adapters** in the existing registry honoring
the canonical verb map (`install→up`, `uninstall→down`, `build→plan/emit` —
`DEPLOY-ARCHETYPE-7-CORE-SEED`); `netscript deploy <target> build|install|uninstall|repair|
status|logs|upgrade|recover` route through the existing router. **Maintenance contract
(locked — `DeployTargetPort` is not fattened):** `repair`, `upgrade`, and `recover` are **CLI
application use-cases composed from the canonical target ops plus a narrow `MaintenancePort`**
in the injected `ServiceDeployTargetPorts` family (the PM-18 seam), advertised via the
PM-17-style capability descriptor (warn-and-omit where unsupported). The router maps verb →
use-case → canonical ops + maintenance capability; no new ops are added to `DeployTargetPort`
itself (AP-3 guarded). `repair` = manifest-hash re-verification + unit re-registration +
idempotent re-provisioning + authority-bootstrap re-materialization (§C.3). **Installer-artifact
adapters** (Windows MSI second pass, Linux deb/rpm second pass) are likewise injected ports in
that family — subordinate to the target, never siblings; OS-unit registration stays
**`OsServicePort`**. **Install/uninstall crash-safety (locked):** the §C.4 journal is
**operation-tagged** (`op: update | install | uninstall | repair | recover | purge`), and the
installer operations run full state machines with the same precondition/effect/recovery rigor as
§C.4 — §B.1a below. **Uninstall policy (locked):** retains data + secrets by default (prints
locations); purge requires `--purge-data`; ISSUE-167's designed-uninstall precedent honored.

### B.1a Installer operation state machines (journaled; same machinery as §C.4)

| Op / state | Precondition | Effect (journaled before acting) | Crash-recovery action |
| --- | --- | --- | --- |
| install `staged` | artifacts verified (sha256 + signature) in `releases/<v>`; `minBootstrapVersion` satisfied (§B.2) | record versions + scope + identity plan + **installed-graph digest** (§B.2a) | delete incomplete staging; re-stage |
| install `claiming` | staged | **machine-wide port reservation** (per-machine): take the exclusive `ports.lock`, write the claim (app id + install id + ports) to `ports.json`, journal the claim BEFORE the registry write; a second concurrent installer waits bounded on the lock then fails with diagnostics; conflict → refuse install (§B.3a) | journal-vs-registry reconcile: claim journaled but absent → rewrite; present but not journaled → remove (stale-claim rule) |
| install `provisioning` | claims held | **pre-registration** provisioning only: data dirs, secrets bootstrap, schema init via db verbs — every step idempotent | resume (re-run steps; idempotency gate) |
| install `registering` | provisioning done | per-machine: create the service account/broker OS group, apply the §B.3 least-privilege grants, register units + the **recovery unit** (§C.3a) via `OsServicePort`, shortcuts/uninstaller entries — **each durable effect journaled individually with its compensation (revoke/remove) recorded** | resume idempotent re-registration; on later `failed`, compensation replays the journaled effect list in reverse |
| install `starting` | registered | health-gated first start (PM probes) | resume; on failure → install `failed` |
| install `confirmed` | sustained-health grace (same rule as update §C.4) | append; install complete | terminal |
| install `failed` | **reachable from ANY state ≥ `claiming`** — an unrecoverable error in `claiming`, `provisioning`, `registering`, or `starting` transitions here (nothing is retained indefinitely) | **compensation replays the journaled effect list in reverse:** stop + deregister whatever units were registered, revoke granted grants, remove created accounts/groups, release held port claims; artifacts + journal retained for diagnosis; data dir retained; print status + next steps | terminal (re-run install resumes from `staged` verification); resume of an interrupted compensation replays the remaining reversed effects |
| repair (all states) | any | verify hashes → re-materialize bootstraps/artifacts → **reconcile durable effects against the journal** (re-apply missing grants/claims/units; remove registry claims with no owning install journal — the stale-claim repair) → restart → sustained-health confirm; **idempotent by construction** | resume at journaled step |
| uninstall `stopping` | lock held; quiescence rule (§C.5) applies | reverse-order stop | resume |
| uninstall `deregistering` | stopped | deregister units incl. the recovery unit, revoke grants, remove created accounts/groups, **release port claims from `ports.json` under `ports.lock`** (all idempotent) | resume |
| uninstall `removing` | deregistered | delete releases + install root; **the install-root journal file is the LAST thing deleted** — uninstall completion is defined by its absence after `removing`; every delete idempotent | re-run deletes (roll-forward) |
| purge (separate op; durable journal in the **canonical machine-state root** — §B.1b) | `--purge-data` was explicit | four explicit durable states: **`prepared`** (journal created BEFORE uninstall's `removing`, carrying the full data/secret target inventory) → **`barriered`** (irreversibility record, written after uninstall completes and BEFORE any data deletion) → **`purging`** (idempotent deletes) → **`complete`** (targets verified absent; the purge journal itself removed last) | one deterministic action per crash boundary: `prepared` found on recovery — **whether or not the install root still exists** — proceeds to `barriered` and onward (an explicit purge request is never silently forgotten; the durable inventory is the authority); `barriered`/`purging` → resume deletion, roll-forward only, never half-restore; `complete` → nothing to do |

### B.1b Canonical machine-state root (locked; resolves the cycle-8 path inconsistency)

ALL mutable machine-wide NetScript state — `ports.json`, `ports.lock`, purge journals, and any
future cross-install records — lives in exactly one root: **`%ProgramData%\NetScript\`** on
Windows and **`/var/lib/netscript/`** on Linux (the earlier `/etc/netscript` mention is
corrected — `/etc` is configuration, not mutable state), owned per ACL by the installer with
write grants to install-time actors. Per-user installs use the single user-level NetScript state
dir (`%LOCALAPPDATA%\NetScript\` / `$XDG_STATE_HOME/netscript/`). One root, one ownership rule,
asserted by SD-3's ACL gates.

Interrupted **install** and interrupted **purge** are first-class fault-gate cases (SD-3), not
inferred from the uninstall test. Concurrent-install (two installers racing `ports.lock`) and
crash-mid-`claiming` reconciliation are likewise SD-3 gates.

### B.2a Install-graph compatibility rule (locked; ratification fork OF-I)

Every release manifest carries the **installed-graph digest** it requires — a hash over
`services[]` realization, fixed ports, workload identity, and grants. At `staged`, the update
authority compares it to the digest journaled by the last install/repair. **Match ⇒ automatic
update proceeds. Mismatch ⇒ refuse with "installer/repair required"** — topology, port, identity,
or grant changes are applied only by the elevated installer path (op=repair/reinstall), never by
the unelevated updater. This keeps the updater's §B.3 least-privilege grant sound: it never needs
unit-definition or registry mutation authority. (Alternative — granting the updater narrowly
scoped reconfiguration authority — is OF-I's rejected-by-default branch.) Gates: SD-4
unchanged-graph update accepted + changed-graph update refused with the named remedy.

### B.2 Manifest + schema ownership across milestones (locked)

`InstallGraphManifest` + `ReleaseManifest`: Zod-authored, `schemaVersion` field, **additive-only
within a major**. Timeline (locked — **PM-20 is untouched**; its saved #531 scope is pure
extraction with new deploy features explicitly out): born **beta.11 (#456a)** in
`packages/cli/src/kernel/domain/deploy/` beside the shipped conventions
(`activation-convention.ts` etc. — the centralized deploy domain per
`DEPLOY-ARCHETYPE-7-CORE-SEED`), **internal to the CLI through beta.12** (not exported — §I.2);
**SD-2 (beta.13) moves them into `packages/deploy-core`** — which PM-20 has by then created by
moving the *existing* OS-service/convention/registry surfaces — and **publishes**
`./install`/`./release` there (CLI re-exports; the sanctioned AP-14 exception). The
single-runtime lane is never retrofitted — its beta.11 schema is the same schema, moved not
forked. **Update trust root (locked):** the Ed25519 public key (+ key id) is **pinned at install
time** by the installer into installed config, outside any downloaded manifest; v1 supports
exactly one pinned key and **no in-band rotation** (re-pin happens only via installer
upgrade/`repair` — an explicit, documented limitation; signed rotation is a stable follow-up).
Wrong-key/tampered-manifest downloads are refused before staging (gate: #456a trust tests).
**Freshness + compatibility (locked):** the manifest carries a **monotonic `sequence`**; the
journal stores the last-confirmed sequence; automatic update requires `sequence >
lastConfirmed` — a validly-signed older manifest is refused (replay/downgrade protection).
Intentional downgrade happens only through an explicit authorized `recover --to` transaction
(op=recover), never the automatic path. **Re-pin provenance:** a new trust key enters only via
the installer package or explicit operator input to installer/`repair` — never from any
downloaded manifest. **Bootstrap/journal compatibility:** the journal schema carries a
`journalVersion` the bootstrap validates (refusing newer-than-supported with "installer upgrade
required"), and the release manifest carries `minBootstrapVersion` — staging a release above the
installed bootstrap's version refuses at `staged` with instructions to run installer/`repair`
first. **Replay high-water (locked; epoch policy = fork OF-J):** the journal keeps TWO sequence
values — the **active release sequence** and an **ever-accepted high-water mark** (max sequence
ever staged-and-verified). Automatic update requires `sequence > highWater`. An authorized
`recover --to` changes the ACTIVE release but **never lowers the high-water** — previously
superseded signed manifests stay ineligible after a recovery. A trust re-pin preserves the
sequence namespace by default; an **epoch reset** exists only as an explicit installer/operator
action (`--reset-sequence-epoch`, journaled with its authorization source). Gates: #456a/SD-4
replay-after-recover + re-pin-continuity + authorized-epoch-reset tests, plus
replay/downgrade + re-pin-provenance + bootstrap-version refusal tests.

Manifest contents: `artifacts[]` (`{name, sha256, size}`, optional per-artifact bsdiff patches
reserved — L0.7), `services[]` (per-scope realization; units via shipped renderers),
`provisioning[]` (data dirs, schema init/migrations via db verbs, secrets bootstrap, health-gated
first start), `scope`, `identity` (§B.3), `signing`, `discovery` (per-scope discovery mode —
§B.3a; `buildViteEnvVarName` naming; double-build preservation invariant), `telemetry`
(OTEL-at-compile set), `migrations` + `snapshotTargets` + `rollbackBarrier` (§C.4).

### B.3 Scope × platform matrix (identity, privilege, auth — locked)

| | per-user | per-machine |
| --- | --- | --- |
| **Supervisor** | window embeds the PM engine (Win + Linux; `systemd --user` NOT used for desktop per-user v1 — PM-34 stays the headless story) | OS units via `OsServicePort` incl. the PM control-plane unit; windows are clients |
| **Update authority** | the **launcher bootstrap** + release-resident worker (§C.3) | pre-installed **updater unit** (bootstrap + release-resident worker) — a *named privileged authority* (§C.3) |
| **Write authority: `releases/`+`current`+journal** | the user's launcher authority (single-user prefix) | **updater identity ONLY**; workload account = read/execute on releases, write on its data root only; interactive users = read-only everywhere in the install root. ACLs set by the installer. Signed-artifact integrity holds because workload compromise cannot rewrite code |
| **Install / data roots** | user profile / per-user app-data | `%ProgramFiles%` + `%ProgramData%\<app>` / `/usr/lib/<pkg>` + `/var/lib/<app>` |
| **Workload identity** | interactive user | one machine-wide tenant (OF-F): dedicated low-priv service account; never LocalSystem/root |
| **Elevation** | none | installer + repair/uninstall only; the updater unit runs unelevated under its own identity (its privilege = the ACL grant, named in manifest `identity`) |
| **Updater least-privilege grants (installer-provisioned, locked)** | n/a (single-user prefix) | the installer grants the updater identity exactly: (a) **service control scoped to this app's units only** — Linux: a polkit/scoped-sudoers rule matching the exact `<app>-*` unit names; Windows: per-service SDDL ACEs granting start/stop on the app's services; (b) **data migration/restore authority** = read/write ACL on this app's data root only. Nothing machine-wide. Negative tests (SD-3): the updater identity attempting to control a foreign unit or touch a foreign data root MUST fail |
| **First-run actor** | first launch (the launcher authority runs `provisioning[]` idempotently) | elevated installer runs `provisioning[]` as the workload identity |
| **Control-plane client auth** | same-user bearer (PM-12 as shipped) | per-user **read** tokens minted over an OS-authenticated local channel (Windows named-pipe SID / Linux `SO_PEERCRED`), gated on an installer-created OS group; **mutations require the admin/updater identity**; PM-12 contract reused unchanged; broker = SD-1/SD-6 scope; per-platform IPC primitive = implementation detail |
| **Multi-user** | N users = N installs (endpoint isolation — §B.3a) | shared tenant; windows are clients; per-user *instance brokering* deferred (stable) |

### B.3a Per-user endpoint ownership (locked — resolves fixed-port collisions, research §1.7-4)

Per-user graphs use **dynamic loopback ports + a same-origin window proxy** for the browser
plane: sidecar ports are allocated at graph start and injected into the runtime `services__*` env
(process plane — dynamic is fine there); browser code talks only to the window's own origin,
which reverse-proxies `/_svc/<name>/*` to the live sidecar ports. The build-time VITE injection
compiles **port-free same-origin paths** (`VITE_services__<name>__http__0 = /_svc/<name>`) — this
respects the evidence-backed rule that `import.meta.env` is build-time while removing the port
dependence that made the POC's fixed map collide. N simultaneous per-user installs on one machine
therefore cannot collide. **Proxy authorization (locked):** the window's server binds loopback on
an ephemeral port and requires a **per-launch bearer token** generated by the window process and
injected into its own webview at navigation; requests without it are rejected, so another local
user or process cannot use the proxy even though loopback is host-shared. The proxy forwards —
never strips — application-level service auth (it is a network hop, not an auth boundary). Gate:
SD-8 adds a **negative cross-user/process access test** beside the multi-login test. Per-machine
(single machine-wide tenant) uses manifest-fixed ports, with an **install-time port-reservation
registry** (locked — two *different* NetScript per-machine apps must coexist or refuse cleanly):
the installer records claimed ports in a machine-wide NetScript registry file
(the §B.1b canonical machine-state root: `%ProgramData%\NetScript\ports.json` /
`/var/lib/netscript/ports.json`) and performs bind checks; a
conflict (another NetScript app's claim, or an OS-level squatter) **refuses the install with
actionable diagnostics** — naming the holder and the `deploy.targets.<member>.package` knob that
re-maps the port. Gate: SD-3/SD-8 two-app coexistence-or-clean-refusal case. Owners: SD-1
(proxy + token), SD-2 (per-scope discovery modes), SD-3 (reservation registry).

### B.4 PackagingModel + publish binding (locked — closes the derivation gap)

Evidence (cycle 3): runtime `AspireResource` carries only `name/kind/port?/untyped metadata`, and
PM-23 merely resolves that shape — neither is a sufficient packaging source. Therefore:

- **`PackagingModel`** (SD-2, typed, Zod): resources, endpoints, dependency edges,
  environment/discovery topology, and provenance — **emitted by the generator** from the same app
  model that generates `aspire/.helpers/register-*.mts` (the generator already holds
  services/plugins/apps/tools, ports, references — evidence:
  `packages/cli/src/kernel/templates/aspire/helpers/types.ts`). PM-23's `AspireResource[]`
  resolver remains a *runtime adoption* seam for the pm and is **not** a packaging input.
  **Ownership/export status (locked):** `PackagingModel` types live **internal to
  `@netscript/cli`** (the generator's kernel) — not published; deploy-core imports the manifest
  the compiler emits, never the generator model (§I.2 marks it internal with this reason).
- **Compiler:** pure `(PackagingModel, deployConfig) → InstallGraphManifest`, where
  `deployConfig` = a typed `package` sub-shape on the existing `deploy.targets.<member>` members
  (spreading `deployTargetBaseShape`, E1 pattern — no new top-level key; this is **public
  `@netscript/config` surface** — §I.2): scope, identity, signing, provisioning,
  migration/snapshot/barrier policy.
- **Invocation binding (locked — inside the Aspire publish stack, not TRACK):** the deploy
  target's **`build` verb (`build→plan/emit`)** is the reusable contract, and **SD-2 also
  delivers the named Aspire publish step**: a TS-AppHost pipeline step (`pipeline.addStep(...)`
  per #327's step-graph model) that invokes the same build verb, so `aspire publish` produces the
  installer artifacts as part of its step graph. The verb is the contract; the step is the
  Aspire-stack citizenship #820/#327 require — both ship in SD-2.
- **Gate:** SD-2's proof exercises **both boundaries**: the Aspire publish step-graph run (or its
  harness) AND the direct verb, each inspected for the emitted golden manifest + staged tree from
  a scaffolded app — not merely pure-function tests. Output carries a generated-with-banner; hand
  edits prohibited.

### B.5 Platform adapters + v1 boundary (inline, complete)

- **Windows:** combined MSI via a second-pass installer builder behind the §B.1 adapter seam
  (deno desktop's own MSI covers only the window bundle, per-machine only —
  `resources__deno-desktop__distribution.md`); `signtool` step hook (manual certs v1; automation
  #458 at stable); Start-menu shortcut + uninstaller registration.
- **Linux:** deb/rpm second pass; systemd units via the shipped renderer; AppImage optional
  (portable, no service registration — per-user only).
- **macOS:** out of v1 (PM OF-6 parity); the adapter seam leaves room.
- **v1 non-scope (binding):** MDM/GPO/fleet tooling, MSIX/app stores, license management,
  air-gapped mirror tooling (docs only), multi-host fleet (#345), per-user instance brokering on
  per-machine installs. Anything beyond = new owner fork.

---

## §C — Update lifecycle (one mechanism — L0.7)

### C.1 Beta.11 scope (#456a)

#456a ships the full §C transaction for the single-artifact case on all v1 platforms **including
Windows** (apply = directory-level release swap while stopped at relaunch — no in-place patching
of loaded binaries, so Windows' file-locking limitation is bypassed structurally). #457a proves
install → update → rollback on Windows + Linux. SD-4 extends the same journal/manifest to N
artifacts + service phases; no second mechanism ever exists.

### C.2 Layout (inline, complete)

`<install-root>/releases/<version>/…` (window bundle, sidecars, tools, config — immutable), a
`current` link (POSIX symlink via temp+rename; Windows junction via remove+recreate — non-atomic,
L0.4), the stable **launcher bootstrap** outside `releases/` (§C.3 — journal-first, then
`current`), the
**journal** + lock at the install root, and a disjoint user-data root (§B.3). Release manifest:
version, per-artifact `{name, sha256, size}` (+ optional bsdiff patches keyed by from-version),
migration descriptors, `snapshotTargets`, `rollbackBarrier`, Ed25519-signed envelope (the
deno-desktop signed-string model), per-arch manifests. Retention: current + previous (N=2),
pruned on confirm. The release server (#456a) serves `<channel>/<arch>/latest.json` (v1 =
stable channel only).

### C.3 Update authorities — one bootstrap pattern, cold-boot-safe (locked)

**Both authorities converge on the same two-piece pattern:**

- a **stable bootstrap** — a minimal installer-managed binary at the stable install root
  (per-user: the launcher `<app>` bootstrap; per-machine: the `updater-bootstrap` the unit's
  `ExecStart` points at). It contains only: journal preamble, release resolution, and worker
  hand-off. **It is never self-replaced by the update path.** It changes only via the elevated
  installer or the `repair` use-case — both non-running contexts — which stage-verify-swap it
  from the release's manifest-verified copy. This removes running-binary self-replacement from
  the design entirely (the rev-4 handshake machinery is retired; no running/locked file on
  Windows is ever renamed or overwritten by the transaction).
- **release-resident worker logic** — the real launcher/updater code, versioned inside each
  release, executed by the bootstrap.

**Release resolution is journal-first, `current`-second (cold-boot-safe):** the bootstrap parses
the journal BEFORE touching `current`. A non-terminal journal names the transaction's from/to
releases **by direct `releases/<version>` path**, so recovery (including the Windows
crash-after-junction-delete interval and a full machine reboot inside it) resolves and executes
the correct worker **without `current` existing at all**, completes or reverts the transaction
per §C.4, recreates `current`, and only then proceeds. A terminal journal + missing/damaged
`current` (outside any transaction) is repaired from the journal's last confirmed release. Gate:
#456a cold-reboot fault case at the exact unlink/recreate interval.

- **Per-user:** the bootstrap launches the window from the resolved release; no elevation ever.
- **Per-machine:** the updater unit is short-lived, on-demand (control-plane update verb or
  `netscript deploy <target> upgrade`), under the updater identity; its in-flight worker executes
  from the retained from-release image (open-file semantics both platforms; N=2 retention
  guarantees the backing files) while it stages/switches/confirms; the next invocation resolves
  the new release via the bootstrap. Its rollback is `current` repointing + journal preamble.
- **Exclusion (locked):** one lock file (owner pid + boot id + timestamp). While the journal is
  non-terminal, a launcher **waits bounded with visible "updating…" state, then fails with a
  clear message** — it never launches through a moving `current`. Stale lock (dead pid / boot-id
  mismatch) → takeover only after journal reconciliation. A second updater instance refuses.

### C.3a Per-machine reboot recovery unit (locked)

An on-demand updater is not automatically invoked after power loss. The reboot barrier is
realized **per platform with mechanisms the platform actually honors** (cycle-7 evidence: the
shipped renderer exposes `after`/`wants` but not `requires`; a Windows SCM dependency must be
*running* before its dependent starts — a short-lived dependency is not a barrier):

- **Linux (systemd):** the installer registers `<app>-recovery.service` as **`Type=oneshot` +
  `RemainAfterExit=yes`** (active-after-success — a valid running dependency), running the
  updater-bootstrap journal preamble; every workload/control-plane unit carries
  **`Requires=` + `After=`** on it. The `requires`/`oneshot`/`RemainAfterExit` renderer knobs are
  **owned by the PM-15 adjustment** (same extend-the-renderer scope as `KillMode`;
  byte-identical-when-unset) and SD-3 binds to them.
- **Windows (SCM/Servy):** no SCM barrier is assumed. Instead, **every app service's command
  wraps through the bootstrap**: the registered service command is
  `updater-bootstrap --preamble-then-exec <real command>` — the journal preamble runs in-line
  before each workload process starts, serialized by the §C.3 lock file (the first wrapper
  reconciles; others wait on the lock, then exec). No resident privileged barrier service, no
  reliance on SCM dependency semantics.

Either way a machine that lost power mid-transaction reconciles **unattended** — no control
plane, no manual `upgrade` invocation. The recovery actor runs under the updater identity (no
elevation); the unit topology / wrapped commands are part of the install-graph digest (§B.2a).

### C.3b Transaction phase ownership — no self-starting, one confirmer (locked; resolves the cycle-8 composition defect)

The boot-time recovery actor **never starts or waits on workload units** (a oneshot cannot
synchronously wait on units ordered `After=` itself; a service wrapper cannot reconcile the SCM
start it is inside). The transaction is split into phases with exactly one owner each:

| Phase | Owner | What it does |
| --- | --- | --- |
| Pre-start reconciliation (boot or transaction) | recovery actor (Linux oneshot / first Windows `--preamble-then-exec` wrapper, lock-held) | journal replay to **pointer-level consistency only**: complete or revert `staged`/`stopping`/`migrating`/`switching` toward the journal-determined target release; append the new durable state **`activated-pending-confirm`** naming that release; release the lock for start; never issues unit starts at boot |
| Graph start | the OS (systemd/SCM) at boot; the updater-unit worker in an explicit `upgrade` transaction (where it is not itself a workload) | units start normally once ordering/wrapping sees the journal ≤ `activated-pending-confirm` — later wrappers on Windows observe the terminal-or-pending journal under the lock and simply `exec`; no reentrancy, no cyclic activation |
| Sustained-health confirmation + rollback initiation | a short-lived **confirm-watcher run of the updater unit** (updater identity — the only journal writer), spawned by the recovery actor at hand-off (boot) or by the upgrade worker (explicit update); per-user: the launcher bootstrap itself (single-user prefix, single owner throughout) | polls graph health via the control plane's read surface for the §C.4 grace window; healthy → appends `confirmed`; unhealthy → runs `rolling-back` as a new pointer-level phase (stop units via `OsServicePort`, restore, repoint, re-request OS start, then re-arm one confirm watch toward the previous release) — `maintenance(rollback-failed)` terminal unchanged |

Lock hand-off is journaled (`lock-handoff` record naming the next owner), so reboot from
`starting`/`rolling-back`/`activated-pending-confirm` is deterministic: the recovery actor
re-establishes pointer-level consistency toward the journal's phase target, re-arms the confirm
watcher, and exits. Gates: SD-8 unattended-reboot proofs **on real systemd AND Windows SCM**
from `switching`, `starting`, AND `rolling-back`; a no-cyclic-activation assertion; a
single-confirmer assertion (exactly one `confirmed` writer under concurrent wrappers); PM-15
render tests prove the emitted `Requires=`/oneshot semantics.

### C.4 Crash-recoverable transaction (inline, complete)

**Journal:** append-only JSONL, one self-checksummed record per transition, fsynced per record,
directory fsync on create/rotate, plus an atomic-replace `state` snapshot (temp + fsync + rename
+ dir-fsync) for cheap reads. Torn tail = detectable (checksum), recovery resumes from the last
valid record. No in-place JSON rewrite exists. **Preamble:** every authority start parses the
journal FIRST; non-terminal → resume/revert per the table; unparseable beyond a torn tail →
fail safe with a named error (never boot an undefined release).

| State | Precondition | Effect (journaled before acting) | Crash-recovery action |
| --- | --- | --- | --- |
| `staged` | manifest signature + every artifact sha256 verified in `releases/<new>/` | record from/to versions; `current` + running graph untouched | delete incomplete staging; re-stage on next attempt |
| `stopping` | lock held; quiescence policy satisfied (§C.5) | reverse-dependency-order stop; per-process stop budget (no clean-drain assumption) | resume stopping (idempotent — dead processes are already stopped) |
| `migrating` | graph stopped | copy `snapshotTargets` into the **journal-owned transaction area** `<data-root>/update-transactions/<txn-id>/snapshots/` (fsynced; mutable, ACL'd to the update authority — releases stay immutable/hash-verifiable, §C.2), then run migration steps **with a per-step journal record (`migration-step <id> started/done`)**; the **`barrier-crossed` record is written BEFORE executing the first irreversible step** | crash mid-snapshot → re-run copy (source unchanged); crash with no `barrier-crossed` record → restore snapshots, go `rolling-back`; crash with `barrier-crossed` present (during or after the irreversible step) → `maintenance` — recovery always distinguishes before/during/after barrier from the journal alone |
| `switching` | migrations done | journal the intended `current` target, then repoint (Windows: remove+recreate — the missing-pointer interval is covered by the journaled target) | recreate `current` at the journaled target and continue |
| `activated-pending-confirm` | pointer-level consistency established toward the phase's target release (§C.3b) | recorded by the pre-start reconciliation owner before any workload runs; names the target release; lock hand-off journaled | recovery re-establishes pointer consistency toward the same target and re-arms the confirm watcher |
| `starting` | `current` = new; journal ≤ `activated-pending-confirm` | dependency-ordered, readiness-gated start (PM probes; trustworthy after NS-H1) — issued by the §C.3b start owner, never by the boot recovery actor | reboot here → recovery actor re-establishes pointer consistency, OS restarts the graph, confirm watcher re-armed |
| `confirmed` | graph healthy AND zero crash-restarts for the sustained-health grace window (default 60 s, tunable) — observed and written by the §C.3b confirm watcher (updater identity; per-user: the launcher), the single confirmer | append `confirmed`; prune N-2 releases AND delete the transaction area (snapshots gone only on confirm; retained through `maintenance`/`rolled-back` until their transaction closes) | terminal |
| `rolling-back` | start failed, no barrier crossed | stop new, restore snapshots, repoint `current` to previous, start previous, emit control-plane event + `netscript.process` telemetry | resume rollback per journal; **if the previous release fails to start or snapshot restore fails → `maintenance` with reason `rollback-failed`** (both releases + snapshots retained; `recover` verb is the exit) — rollback failure is a defined terminal, never a loop |
| `rolled-back` | previous healthy | append; the failed release stays on disk for diagnosis; **this transaction's snapshots are retained until the next `confirmed` transaction closes, then pruned** | terminal |
| `maintenance` | start failed after a barrier | graph stays stopped; previous release retained but NOT auto-activated (data is past the barrier); surfaced via exit status + control-plane event + SD-6 UI | stay; operator runs `netscript deploy <target> recover --to <release> [--restore-snapshots]` (executed by the same authority, same journal) |

After `confirmed`, "rollback" is only a new backward transaction (barrier rules apply).

### C.5 Downtime, quiescence, rollout (locked)

- **Per-user:** update applies at relaunch — no perceived downtime; the launcher's wait-or-fail rule
  covers a launch racing an explicit apply.
- **Per-machine quiescence (locked):** the control plane tracks attached client windows.
  `upgrade` default **refuses while clients are attached** (listing them); `--force` broadcasts a
  shutdown-notice event — clients show "restarting for update" and disconnect within a grace
  window — then the transaction proceeds. After the switch, a stale window (old bundle, still
  running) is rejected by the control-plane **version handshake** (contract version in the
  PM-9 `describe` route) and prompts relaunch — relaunch resolves through `current` and gets the
  new bundle. **No old-client/new-service compatibility window is promised in v1**; the
  handshake-refuse-relaunch path is the contract. Gate: SD-8 cross-session update test.
- **Rollout:** brief documented stop-swap-start window per-machine (single-instance graphs cannot
  roll); rings/channels deferred to stable (server already per-arch/per-channel shaped).

---

## §D — Composition contract (inline, complete; both modes KEPT)

Two composition modes of one app model (research §2.3-G7/§2.4).

**Shared contracts and their enforcement points:**

| Shared contract | Identical in both modes | Enforcement |
| --- | --- | --- |
| Client transport selection | `ServiceClientTransport` switch: HTTP loopback ↔ in-process link (#451); app/service code identical | the seam itself — enforces *only this row* |
| Discovery resolution | SDK resolves `services__*` env / in-process registry behind one API; `buildViteEnvVarName` naming; §B.3a per-scope modes; double-build preservation | manifest `discovery` schema (SD-2) + SD-7 conformance |
| Data layout & ownership | per-user app-data root convention; single-writer rules (relocated in-process #453, or delegated to the owning service) | manifest `provisioning`/data-root schema + SD-7 conformance |
| Packaging pipeline | one pipeline: deno desktop bundle + K compiled sidecars (K=0 single-runtime); OTEL-at-compile invariant | one implementation (SD-2 over #456a/#452 hook) + golden emitted-artifact tests |
| Release/update | one manifest family + one §C transaction; single artifact = degenerate case | one schema family (§B.2) + fault gates (#456a, SD-8) |
| First-run provisioning | one `provisioning[]` phase | schema + run-twice idempotency gate |
| Telemetry identity | per *logical* service: per-process `OTEL_SERVICE_NAME` (graph) / per-scope instrumentation + resource attrs (in-process) | manifest `telemetry` schema + SD-7 conformance assertion |

**The SD-7 cross-mode conformance suite** runs one reference app in BOTH modes and asserts every
row — that suite, not any single seam, prevents forking. **Legitimate divergence (documented):**
process supervision/restart/containment (graph only); shared cache/queue backing (Garnet-class,
graph only — in-memory in-process); update apply mechanics (graph stop/start phases vs
single-artifact relaunch); health aggregation shape (per-process probes vs in-process aggregate).
**Mode selection rule (doctrine entry, SD-7):** default single-runtime; choose singleton-graph on
native constraints — exclusive-lock data engines, external tool processes, crash/permission
isolation (eis-chat qualified via the tursodb lock + Garnet + workers isolation).

---

## §E — Proposed board adjustments (DRAFTS; prose bodies written post-gate per kickoff)

### E.1 Gap → owner map

| Gap | Owner | Subordinate / dependencies (not co-owners) |
| --- | --- | --- |
| G1 desktop-host embedding of PM engine | **SD-1** | contains the containment acceptance (pipe-EOF + Windows Job Objects); child-side watcher primitive = PM-B (core); Linux OS backstop = SD-H (stable, explicit); deps PM-1..14, PM-A, PM-B |
| G2 installation layer | **SD-3** | SD-5 = subordinate provisioning slice; deps SD-2, PM-15/16/18 |
| G3 combined update lifecycle | **SD-4** | incl. per-machine quiescence + updater-through-`current`; deps #456a, SD-2, SD-3, NS-H1 |
| G4 Aspire-model-derived packaging | **SD-2** | incl. `PackagingModel` + `build`-verb binding + per-scope discovery modes; deps NS-P1, PM-1, PM-20 |
| G5 plugin service entrypoints | **NS-P1** | incl. supervised-mode pipe-EOF watcher |
| G6 aggregate-health correctness | **NS-H1** | — |
| G7 composition contract | **SD-7** | deps #451, SD-2 |
| G8 end-user health surface | **SD-6** | deps SD-1 |

### E.2 Draft board (single source; `Depends on` = must land first; gates AUGMENT the archetype matrix, never replace it — §I.1)

| Draft | Title / bounded scope | Milestone | Depends on | Gap | Archetype / overlay | Proving gates (slice-specific, on top of the archetype set) |
| --- | --- | --- | --- | --- | --- | --- |
| NS-H1 | Aggregate health excludes unconfigured adapters | beta.11 | — | G6 | **Archetype 4** (`@netscript/service` per doctrine 10) + affected Archetype 2 adapters; runtime + consumer gates bound | per-adapter unit tests · consumer-compile check · `scaffold.runtime` health assertion |
| #452 re-scope | Generator desktop dev-resource + single-artifact packaging hook — **extends the PUBLIC `@netscript/aspire` `./types` surface (`AppType`/`AppEntry` gain `"desktop"`)** | beta.11 | — | — | Archetype 2 `packages/aspire` + Archetype 6 generator (F-CLI set) | generator golden tests · `scaffold.runtime` · **full jsr rubric on the `./types` change (§I.2) + consumer-compile gate** |
| #456a | Single-artifact packaging + release server + §C updater (stable bootstrap + release-resident worker, journal, Windows apply, confirm, rollback, pinned trust key) + minimal provisioning; schemas born CLI-kernel (internal) | beta.11 | #452, #454 | (G3 substrate) | Archetype 6 CLI (F-CLI set) + Archetype 3 runtime gates (journal state machine: fake clock, cancellation, failure injection) + SCOPE-service | #457a · fault set: torn-journal replay, crash-mid-swap, **cold-reboot at the unlink/recreate interval (journal-first resolution without `current`)** · **trust tests: wrong-key / tampered manifest refused** · `e2e-cli-prod` |
| #457a | Single-artifact deploy-e2e: install→update→rollback on Windows + Linux | beta.11 | #456a | — | gate:e2e | the suite (Windows apply proof; Linux systemd leg) |
| PM-1 adj | + `tcp`/`process-lingering` probe kinds (public contract types) | beta.12 | — | — | Archetype 2 contracts | schema unit tests · `deno doc --lint` · wrappers/`quality:scan`/`arch:check` · jsr rubric (§I.2) |
| PM-5 adj | + `clearEnv` + strip-list — **public `RuntimeCommandSpec` extension (§I.2)** | beta.12 | — | — | Archetype 2 engine + contract surface | spawn/env unit tests both platforms · wrappers/`quality:scan`/`arch:check` · **jsr rubric on the additive contract fields + consumer-compile gate** |
| PM-A | Graph adoption & reconcile contract | beta.12 (OF-G) | PM-3 | — | Archetype 2 pm-core + Archetype 3 runtime gates | adoption state machine under fake clock · failure/cancellation cases |
| PM-B | Supervised-child runtime helper in pm-core: pipe-EOF liveness watcher + descendant cleanup (the PM-16 sd_notify-helper pattern); consumed thinly by NS-P1 entrypoints + the guardian | beta.12 | PM-5 | (G1 core primitive) | Archetype 2 pm-core runtime helper | watcher unit tests (EOF → bounded self-termination) both platforms · jsr rubric (§I.2) |
| PM-15 adj | + renderer knobs: `KillMode=control-group`, `Requires=`, `Type=oneshot`, `RemainAfterExit` (within PM-15's ratified extend-the-renderer scope; byte-identical when unset) — **INTERNAL render mechanism; public knob surface = `deploy.targets` config; classification re-decided at PM-20 (§I.2)** | beta.12 | — | — | systemd renderer (internal) | render test per knob incl. emitted dependency semantics · byte-identical-unset check · internal-only export lint |
| NS-P1 | Plugin `./services` compile-able entrypoints, thinly consuming the PM-B watcher in supervised mode | beta.12 | **PM-B** | G5 | Archetype 5 (+ JSR) | full jsr rubric · per-plugin `deno compile` smoke · `scaffold.plugins` · publish dry-run |
| #543 (acceptance touch-up) | PM console desktop packaging (window-only). One acceptance line changes: the saved "Windows auto-update stages-but-does-not-apply caveat documented" criterion is **superseded by #456a's L0.7 apply path** — the console updates via the snapshot transaction; `Deno.autoUpdate` must not re-enter as a second authority | beta.12 | #456a, PM-29 | — | SCOPE-frontend (full overlay: loading/error/responsive/browser) | packaged-console smoke on 5 targets · console update-via-#456a proof |
| SD-2 | `PackagingModel` (generator-emitted, CLI-internal) + manifest compiler + `deploy <target> build` binding + **the named Aspire publish pipeline step** + per-scope discovery modes + `deploy.targets.<member>.package` config + **schema move into deploy-core + `./install`/`./release` publication** | beta.13 | **#456a (schema origin)**, NS-P1, PM-1, PM-20 (package exists) | G4 | Archetype 7 deploy-core + Archetype 6 glue (F-CLI set) + `packages/config` | **emitted golden artifact via BOTH the publish step-graph run and the direct verb** · `scaffold.runtime` · full jsr rubric on the deploy-core exports (this is the publishing slice) |
| SD-1 | Desktop supervisor host: embedded engine (per-user) / client mode (per-machine); same-origin `/_svc` proxy + per-launch token; OS-auth token broker; adoption via PM-A; containment = universal pipe-EOF (entrypoint harness + guardian wrapper for raw executables, both over PM-B) + the core Job-Object primitive — **entire host-side surface INTERNAL (§I.2); public consumption = #451/SD-6** | beta.13 | PM-1..14, PM-A, **PM-B**, SD-2 | G1 | Archetype 3 runtime behavior + SCOPE-service | embedding tests w/ failure injection + fake clock · **hard-kill containment incl. a non-cooperative raw executable (both platforms)** · proxy auth tests (positive + cross-user negative) · **non-export invariant lint** |
| SD-3 | Installs: MSI/deb-rpm adapters + `MaintenancePort` behind the target, repair/upgrade/recover use-case routing, elevation-once, ACL model + **updater least-privilege grants**, **installer-owned bootstrap replacement**, §B.1a state machines incl. **journaled port-claim/grant/account lifecycle + `ports.lock` transaction + stale-claim repair**, **recovery-unit registration (§C.3a)**, **per-machine Windows Job-Object wrapper wiring (§A.3 Servy realization; the primitive is SD-1's)**, **per-platform reboot-barrier registration (§C.3a: Requires/oneshot units on Linux; preamble-then-exec wrapping on Windows)**, uninstall retain/`--purge-data` + **state-dir purge journal** | beta.13 | **SD-1 (Job-Object primitive)**, SD-2, PM-15 (incl. KillMode + Requires/oneshot knobs), PM-16, PM-18, PM-B | G2 | Archetype 7 + Archetype 6 (F-CLI set) + SCOPE-service + SCOPE-docs (full: source-alignment/link/terminology/drift) | install/repair/uninstall matrix (Win+Linux runners) · **transition-complete fault injection for install AND purge (incl. early-effect-boundary failures in `claiming`/`provisioning`/`registering` → reverse compensation; purge crash AFTER the install root is gone incl. the root-gone-no-barrier `prepared` case, recovered from the state-dir journal; purge-barrier roll-forward; crash-mid-`claiming` reconcile)** · **concurrent-installer `ports.lock` race case** · effective-ACL + release-immutability/snapshot-ACL assertions · **least-privilege negative tests (foreign unit / foreign data root refused)** · **two-app port coexistence-or-clean-refusal** · interrupted-uninstall journal replay · **real Windows bootstrap replacement via installer/repair (non-running context)** · jsr rubric where surface grows |
| SD-5 | First-run provisioning phase (subordinate of SD-3) | beta.13 | SD-2, SD-3 | (G2) | Archetype 7 provisioning | run-twice idempotency · first-run e2e |
| SD-4 | Graph update transaction: N-artifact manifest, service phases, per-step migration records + barrier-before-irreversible, `rollback-failed` terminal, snapshots in the data-root transaction area, `maintenance`/`recover`, per-machine quiescence (refuse/`--force`/version handshake), updater-bootstrap + release-resident worker (journal-first cold-boot resolution), replay/downgrade + **high-water/epoch semantics (§B.2)** + `minBootstrapVersion` enforcement + **install-graph digest accept/refuse (§B.2a)** | beta.13 | #456a, **SD-1 (graph host + client mode)**, SD-2, SD-3, NS-H1 | G3 | Archetype 3 runtime gates (durable state machine) + Archetype 7 surface | fault suite: crash-mid-junction, **cold reboot with `current` absent**, power-loss replay, torn tail, snapshot restore + snapshot-ACL assertion, **barrier crash before/during/after cases**, **previous-release-start-failure → `maintenance(rollback-failed)`**, sustained-health rollback, **signed replay/downgrade rejection + replay-after-recover + re-pin continuity/epoch-reset + bootstrap-version refusal**, **unchanged-graph update accepted / changed-graph refused with remedy** · **cross-session update test** · jsr rubric where surface grows |
| SD-6 | End-user health widget (SDK client over #451/loopback; per-user read tokens) | beta.13 | SD-1, #451 | G8 | Archetype 4 SDK + SCOPE-frontend (full overlay) | contract-client conformance · UI states smoke · jsr rubric on the SDK surface |
| SD-7 | Composition-modes doctrine + cross-mode conformance suite (asserts all seven §D rows incl. provisioning + update in BOTH modes) | beta.13 | #451, #454, #456a, SD-1, SD-2, SD-4, SD-5 | G7 | SCOPE-docs + contract tests | conformance suite green on the reference app in both modes · `doc:lint` |
| SD-8 | Graph deploy e2e (both scopes) incl. SD-4 fault cases, **multi-login isolation + negative cross-user proxy access**, **hard-kill containment w/ a non-cooperative raw executable (per-user) + per-machine per-platform containment proof (systemd KillMode cgroup kill; Windows Job-Object wrapper)**, **cold-reboot at the unlink/recreate interval**, **unattended-reboot proofs on BOTH real systemd and Windows SCM from `switching`, `starting`, AND `rolling-back` + no-cyclic-activation + single-confirmer assertions (§C.3b — zero manual steps)**, cross-session update, two-app port policy; proves SD-5/SD-6 in flow | beta.13 | SD-1..SD-6, **SD-7** | — | gate:e2e | the suite · post-publish `e2e-cli-prod` |
| #458 | Signing automation | stable | SD-3 | — | Archetype 6 | signing pipeline e2e |
| SD-H | Linux OS-enforced containment backstop (PDEATHSIG FFI or cgroup-scope spike) | stable | SD-1 | (G1 hardening) | Archetype 3 platform adapter | hard-kill test with layer-1 disabled |
| SD epic | Child epic under #327 holding SD-1..8, SD-H | beta.13 | — | — | umbrella | children |

---

## §F — Owner forks (ratified at stage-H filing; "authorized proceed" ≠ ratification)

| # | Fork | Recommendation |
| --- | --- | --- |
| OF-A | SD child epic vs growing #327 Tier-4 in place | child epic |
| OF-B | Single-runtime lane milestone | keep beta.11 |
| OF-C | Ratify the #456/#457 splits + the mechanism lock (L0.7: snapshot updater from beta.11; `Deno.autoUpdate` never authority) + #452 keeping the packaging hook + #543 staying beta.12 | adopt |
| OF-D | **Architectural (before filing):** installer-artifact realization = second-pass adapter seam behind the target (recommended) vs waiting on an upstream deno-desktop packaging hook. **Implementation-deferred (after ratification):** the concrete builder backend behind the ratified seam (WiX/NSIS/pure-Rust MSI etc.) | seam now; upstream hook = TRACK |
| OF-E | Per-machine scope in v1 | ship per-user + per-machine (Win/Linux) in beta.13; macOS out |
| OF-F | Per-machine tenancy | machine-wide tenant + §B.3 identity/privilege model; brokering deferred |
| OF-G | PM-A placement | PM epic beta.12 |
| OF-H | Linux containment bar for beta.13 | accept universal layer-1 (entrypoint harness + guardian wrapper for raw executables) with the **precise residual**: a guardian hard-killed in the same instant as the supervisor can orphan its one child until SD-H's OS backstop (stable) — recommended; alternative: block beta.13 on a Linux OS backstop (FFI/cgroup) |
| OF-I | Per-machine install-graph compatibility (§B.2a) | digest-match-or-refuse (updater never mutates topology/identity/grants; installer path owns changes) — recommended; alternative: grant the updater narrowly scoped reconfiguration authority (rejected by default — breaks least-privilege) |
| OF-J | Sequence epoch policy (§B.2) | high-water never lowers; re-pin preserves the namespace; epoch reset only via explicit installer/operator `--reset-sequence-epoch` — recommended; alternative: re-pin implies epoch reset (rejected — silent replay window) |
| OF-K | Per-machine Windows containment realization (§A.3) | core Job-Object wrapper now (no reliance on unproven Servy tree-kill); drop the wrapper if upstream Servy proves the guarantee — recommended; alternative: spike Servy behavior first and block SD-3 on the outcome |

## §G — Risk register (each mitigation names its blocking draft + gate)

| Risk | Mitigation → blocking draft/gate |
| --- | --- |
| Windows junction swap non-atomic; crash/power-loss mid-swap | journaled intended target + replay (§C.4 `switching`) → #456a/SD-4 crash-mid-junction fault gates |
| Torn/unparseable journal | checksummed append-only JSONL + atomic snapshot + torn-tail recovery → #456a fault set |
| Launcher racing an in-flight update | lock + wait-or-fail (§C.3) → #456a e2e case |
| Damaged/failed stable bootstrap | bootstraps change only via installer/`repair` (manifest-hash-verified, non-running context); `repair` re-materializes from the current release → SD-3 bootstrap-replacement + repair tests |
| **Hard-kill orphans — incl. NON-cooperative raw executables (Garnet-class)** | universal layer-1: entrypoint harness + guardian wrapper (§A.3) → SD-1/SD-8 hard-kill gate with a deliberately non-cooperative executable; OS backstop SD-H (stable); precise residual disclosed in OF-H |
| **Multi-user port collisions (N per-user installs)** | §B.3a dynamic ports + same-origin proxy → SD-1 proxy tests + SD-8 multi-login gate |
| **Cross-user/process access to the `/_svc` proxy** | per-launch bearer token; proxy forwards (never strips) app-level auth (§B.3a) → SD-8 negative cross-user test |
| **Per-machine update vs live client windows** | §C.5 refuse-by-default/`--force`+grace + version-handshake refuse-relaunch → SD-4 scope + SD-8 cross-session gate |
| **Authority unlaunchable after crash with `current` absent (cold boot/reboot)** | §C.3 stable bootstrap + journal-first release resolution by direct path → #456a/SD-4 cold-reboot fault gates |
| **Running-binary replacement on Windows (shim/updater)** | eliminated by design: bootstraps are replaced only by installer/`repair` in non-running contexts; worker logic is release-resident (§C.3) → SD-3 real Windows bootstrap-replacement test |
| **Mutable snapshots inside immutable releases** | eliminated: snapshots live in the data-root transaction area, ACL'd to the authority (§C.4) → SD-3/SD-4 immutability + snapshot-ACL assertions |
| **Update trust-root substitution / tampered manifests** | install-time pinned Ed25519 key outside downloaded content; single-key v1, installer-only re-pin (§B.2) → #456a wrong-key/tamper refusal tests |
| **Interrupted install / uninstall / purge** | §B.1a full state machines (compensation on install `failed`; journal-last uninstall delete order; purge-barrier roll-forward) → SD-3 transition-complete fault injection for each op |
| **Crash ambiguity at a migration barrier** | per-step records + `barrier-crossed` written before the irreversible step (§C.4) → SD-4 before/during/after-barrier cases |
| **Previous release fails during rollback** | defined `maintenance(rollback-failed)` terminal, both releases + snapshots retained, `recover` exit (§C.4) → SD-4 gate |
| **Per-machine updater over-privilege** | installer-provisioned least-privilege grants scoped to this app's units + data root (§B.3) → SD-3 negative tests |
| **Two per-machine NetScript apps collide on fixed ports** | machine-wide port-reservation registry + refuse-with-diagnostics (§B.3a) → SD-3/SD-8 coexistence-or-refusal case |
| **Replay/downgrade of an older validly-signed manifest** | monotonic `sequence` rule; downgrade only via explicit `recover` (§B.2) → #456a/SD-4 replay tests |
| **Untrusted repair-time key re-pin** | re-pin provenance = installer package / operator input only, never a downloaded manifest (§B.2) → #456a re-pin provenance test |
| **Stable bootstrap vs newer journal/worker skew** | `journalVersion` validation + `minBootstrapVersion` staging refusal (§B.2) → #456a bootstrap-version cases |
| **Concurrent / stale / leaked machine-wide port claims** | `ports.lock` exclusive transaction + journal-before-registry-write + stale-claim `repair` reconciliation (§B.1a) → SD-3 concurrent-installer + crash-mid-`claiming` gates |
| **Automatic update crossing the installer-owned graph boundary** | §B.2a digest-match-or-refuse; topology/identity/grant changes only via the elevated installer path (OF-I) → SD-4 accept/refuse gates |
| **Reboot with a non-terminal journal and no recovery actor** | §C.3a installer-registered recovery unit ordered before all workload units → SD-8 unattended-reboot case |
| **Replay window after authorized recovery or key re-pin** | §B.2 ever-accepted high-water never lowers; epoch reset only explicit + journaled (OF-J) → SD-4 replay-after-recover + re-pin continuity gates |
| **Per-machine descendant containment assumption fails** | evidence-honest realization (§A.3): explicit `KillMode=control-group` render (PM-15 knob) + Windows Job-Object wrapper instead of unproven Servy tree-kill (OF-K); fallback owner SD-3 → SD-8 per-platform proof |
| **Purge recovery record lost with the install root** | purge journal lives in the machine/user NetScript state dir, created before uninstall `removing` (§B.1a) → SD-3 purge-crash-after-root-gone gate |
| **Early install failure (claiming/provisioning/registering) strands claims/grants** | `failed` reachable from any state ≥ `claiming`; reverse compensation replays the journaled effects (§B.1a) → SD-3 early-effect-boundary fault cases |
| **Reboot barrier unrealizable on a platform** | per-platform locked realizations with owned renderer knobs (PM-15) and `--preamble-then-exec` wrapping (§C.3a) → PM-15 emitted-semantics render tests + SD-8 real systemd/SCM reboot proofs |
| **Purge crash with root gone + barrier absent (overlapping recovery rules)** | eliminated: four explicit purge states; `prepared` deterministically proceeds (durable inventory is the authority — an explicit purge is never silently dropped) (§B.1a) → SD-3 root-gone-no-barrier fault case |
| **Boot recovery deadlocks or re-enters graph start** | §C.3b phase split: pointer-level reconcile only at boot, OS owns start, single confirm watcher owns confirm/rollback; journaled lock hand-off → SD-8 reboot-from-`starting`/`rolling-back` + no-cyclic-activation + single-confirmer gates |
| **Machine-state path divergence (`/etc` vs `/var/lib`)** | §B.1b single canonical state root per platform, installer-owned ACLs → SD-3 ACL + path assertions |
| Beta.11 Windows update promise | §C.1 snapshot updater in #456a → #457a Windows apply proof |
| Workload identity writing executable releases | §B.3 updater-only write authority → SD-3 effective-ACL assertions |
| Machine-wide client authorization gap | §B.3 read-token broker; mutations admin-only → SD-1/SD-6 gates |
| Privileged maintenance drift | repair/uninstall only via elevated installer path; updater grant named in manifest `identity` → SD-3 review + ACL tests |
| Interrupted/barriered migrations | snapshot-before-migrate + `maintenance` + `recover` (§C.4) → SD-4 barrier fault case |
| Shared-manifest migration across waves | §B.2 timeline (CLI-kernel internal → PM-20 move/re-export → additive) → SD-2 consumer-import gate |
| Linux lane never integration-exercised | #457a Linux leg + SD-8 real-systemd harness (closes `cli-deploy-linux-integration-untested`) |
| PM beta.12 slip cascades | §A.3 explicit bar; beta.11 lanes unaffected |
| deno desktop youth / Aspire dashboard Preview | pins in config; ports isolate; dashboard optional, never load-bearing |
| Installer scope explosion / n=1 generalization | §B.5 non-scope binding; #543 = second pipeline consumer (beta.12); SD-7 conformance |

## §H — Cycle-9 sweep dispositions

| Cycle-9 sweep item | Disposition |
| --- | --- |
| 1. PM-5 public-surface ownership | **Locked** §I.2 + §E.2: the `clearEnv`/strip-list additions are a PUBLIC additive extension of the published `RuntimeCommandSpec` contract; full rubric + consumer-compile gate bound inside PM-5's slice |
| 2. PM-15 renderer/config ownership | **Locked** §I.2 + §E.2: knobs are INTERNAL render mechanism at beta.12 (public knob surface = `deploy.targets` config via `@netscript/config`; callers never touch the renderer API); classification re-decided at the PM-20 move, where a published renderer would enter deploy-core's jsr/consumer gates |
| 3. SD-1 surface ownership | **Locked** §I.2 + §E.2: the entire host-side surface (supervisor host, token broker, proxy internals, Job-Object wiring) is INTERNAL with a non-export invariant lint; public consumption surfaces are exactly the #451 SDK transport seam + SD-6 client/widget exports |
| (artifact currentness) | Reconciled at the design-record closure and again at this rev: context-pack/supervisor/worklog/drift agree on rev 10, the cycle-1..9 verdict trail, six drift entries + the rev-10 authorization row, and the owner-run final-eval state |

### Cycle-8 sweep dispositions (retained)

| Cycle-8 sweep item | Disposition |
| --- | --- |
| 1. Purge preparation/barrier recovery + canonical state path | **Locked** §B.1a (four explicit purge states `prepared`/`barriered`/`purging`/`complete`; one deterministic recovery action per boundary — `prepared` always proceeds; root-gone-no-barrier is unambiguous) + §B.1b (one canonical machine-state root: `%ProgramData%\NetScript\` / `/var/lib/netscript/`; the `/etc/netscript` mention corrected) |
| 2. Boot recovery vs graph start | **Locked** §C.3b: three-phase ownership (pointer-level reconcile → OS-owned start → single confirm watcher under the updater identity, per-user launcher); `activated-pending-confirm` journal state + journaled lock hand-off; reboot deterministic from `switching`/`starting`/`rolling-back`; no self-starting oneshot, no reentrant wrapper; SD-8 gates cover all three reboot origins + no-cyclic-activation + single-confirmer |
| 3. Owner-fork resume state | **Fixed**: `worklog.md` Design and every `context-pack.md` resume section (Key Decisions + Open Questions) now carry OF-A..OF-K |
| (jsr regression) #452 public `./types` change | **Fixed** §I.2 + §E.2: the `AppType`/`AppEntry` `"desktop"` extension is enumerated as public surface with the full rubric + consumer-compile gate |

### Cycle-7 sweep dispositions (retained)

| Cycle-7 sweep item | Disposition |
| --- | --- |
| 1. Installer terminal/journal lifetime | **Locked** §B.1a: purge = a separate operation on its own durable journal in the machine/user NetScript **state dir** (beside `ports.json`), created before uninstall's `removing`, barrier-before-deletion, journal-removed-last completion — recovery works after the install root is gone; install `failed` is reachable from ANY state ≥ `claiming` with reverse compensation (no indefinitely retained claims/grants) |
| 2. Per-platform reboot barrier | **Locked** §C.3a: Linux = `Type=oneshot` + `RemainAfterExit=yes` recovery unit + `Requires=`/`After=` (renderer knobs owned by the PM-15 adjustment); Windows = `--preamble-then-exec` bootstrap wrapping of every app service command, lock-serialized — no reliance on SCM dependency semantics; both realizations in the install-graph digest; SD-8 proves both on real systemd + Windows SCM |
| 3. Fork-set + artifact reconciliation | **Fixed**: must-resolve sweep now names OF-A..OF-K; the retained cycle-5 disposition row explicitly retires the Servy-tree-kill wording; worklog Design + context-pack carry the full fork set and the superseded-claims note; board edges NS-P1←PM-B, SD-1←PM-B, SD-3←SD-1 added (E.1/E.2 consistent) |

### Cycle-6 sweep dispositions (retained)

| Cycle-6 sweep item | Disposition |
| --- | --- |
| 1. Installer-owned durable resources + global port registry | **Locked** §B.1a: `claiming` state with `ports.lock` transaction + journal-before-registry-write; grants/accounts/units/shortcuts journaled individually with recorded compensations; `failed`/`deregistering` replay them in reverse; `repair` owns stale-claim reconciliation; concurrent installers race the lock (wait-bounded-then-fail) |
| 2. Per-machine install-graph compatibility | **Locked** §B.2a: release binds an installed-graph digest; updater proceeds only on match, refuses with "installer/repair required" otherwise; ratification = OF-I |
| 3. Per-machine reboot recovery actor | **Locked** §C.3a: installer-registered recovery unit, `After=`/service-dependency ordering before every workload unit, updater identity, unattended-reboot gate in SD-8 |
| 4. Replay high-water across recovery/re-pin | **Locked** §B.2: active sequence ≠ ever-accepted high-water; `recover` never lowers the high-water; re-pin preserves the namespace; explicit journaled epoch reset only (OF-J) |
| 5. Containment ownership + proof | **Locked** §A.3 (evidence-honest): PM-15 `KillMode=control-group` knob for systemd; Windows Job-Object wrapper instead of the untraced Servy tree-kill (OF-K); child-side watcher primitive moved to pm-core via PM-B (NS-P1 consumes thinly); per-platform SD-8 proof + named fallback owner (SD-3) |

### Cycle-5 sweep dispositions (retained)

| Cycle-5 sweep item | Disposition |
| --- | --- |
| 1. Installer operation state machines | **Locked** §B.1a: full precondition/effect/recovery table for install/repair/uninstall/purge; provisioning split from registration and health-gated first start; install `failed` compensation defined; purge-barrier journaled before deletion (roll-forward-only); journal-file-deleted-last rule for uninstall completion |
| 2. Migration barrier + failed rollback | **Locked** §C.4: per-step migration records; `barrier-crossed` before the first irreversible step (before/during/after distinguishable from the journal alone); `maintenance(rollback-failed)` terminal; rolled-back snapshots retained until the next confirmed transaction closes |
| 3. Per-machine authority + containment scoping | **Locked** §B.3 (least-privilege grants row) and §A.3 — *the per-machine realization was superseded in rev 7 after the cycle-6 evidence check*: the current lock is the explicit PM-15 `KillMode=control-group` knob on systemd and the core Job-Object wrapper on Windows (OF-K); the earlier "Servy tree kill" wording in this historical row is RETIRED and must not be read as current design |
| 4. Per-machine endpoint ownership | **Locked** §B.3a: machine-wide port-reservation registry + bind checks; install refuses with actionable diagnostics; two-app coexistence-or-clean-refusal gate |
| 5. Update eligibility + durable trust | **Locked** §B.2: monotonic `sequence` (replay/downgrade refused; downgrade only via explicit `recover`); re-pin provenance = installer/operator input only; `journalVersion` + `minBootstrapVersion` compatibility refusals |

### Cycle-4 sweep dispositions (retained)

| Cycle-4 sweep item | Disposition |
| --- | --- |
| 1. Containment for every manifest resource | **Locked** §A.3: universal layer-1 (entrypoint harness + **guardian wrapper** for raw executables — no exemptions); non-cooperative hard-kill gate in SD-1/SD-8; OF-H updated with the precise Linux residual (guardian killed with supervisor) |
| 2. Cold-boot update authority | **Locked** §C.3: stable installer-managed bootstraps + **journal-first release resolution by direct `releases/<version>` path** — recovery never needs `current`; cold-reboot fault gates in #456a/SD-4 |
| 3. Windows shim replacement | **Eliminated by design** §C.3: bootstraps never self-replace (installer/`repair`-only, non-running contexts); worker logic is release-resident; SD-3 proves the real Windows replacement path |
| 4. Snapshot + trust roots | **Locked**: snapshots → data-root transaction area, ACL'd, deleted only on transaction close (§C.4); Ed25519 key pinned at install time outside downloaded content, single-key v1, installer-only re-pin, rotation = stable follow-up (§B.2); wrong-key/tamper gates in #456a |
| 5. Aspire publish ownership | **Locked** §B.4: `PackagingModel` internal to `@netscript/cli`; SD-2 delivers BOTH the reusable build verb AND the named TS-AppHost publish pipeline step; gate exercises both boundaries on emitted artifacts |
| 6. Maintenance operation contract | **Locked** §B.1: repair/upgrade/recover = CLI use-cases over canonical ops + a narrow `MaintenancePort` in `ServiceDeployTargetPorts` (no `DeployTargetPort` fattening); **operation-tagged journal** gives install/uninstall/purge their own crash-safe state subsets |
| 7. PM-20 boundary | **Fixed** §B.2: PM-20 untouched (pure extraction per its saved scope); schemas stay CLI-internal through beta.12; **SD-2 is the move-and-publish slice** |
| 8. Composition gate ordering | **Fixed** §E.2: SD-7 depends on the slices that exercise both modes (#451/#454/#456a/SD-1/SD-2/SD-4/SD-5); SD-8 depends on SD-7; #543's saved Windows-caveat acceptance line is explicitly superseded (no `Deno.autoUpdate` re-entry) |
| 9. Per-user proxy authorization | **Locked** §B.3a: per-launch bearer token injected into the window's own webview; proxy forwards app-level auth; SD-8 negative cross-user test |

**Safe to defer to implementation:** tunables (grace/prune/timeouts/ports), per-platform IPC
primitive for the token broker, the concrete installer builder behind OF-D's ratified seam,
manifest field names, ring design. **Must resolve before filing: OF-A..OF-K** (the complete fork
set — the ratification brief covers all eleven). Nothing else is open.

## §I — Doctrine state, gates, jsr-audit, debt, deferred scope

### I.0 Doctrine state of record

- Verdicts (doctrine 10): `@netscript/cli` **Restructure** (Archetype 6; AP-1 continuation — the
  deploy-core extraction is its recorded downstream continuation); `@netscript/sdk` Keep;
  `@netscript/service` Refactor; `@netscript/aspire` Keep; `@netscript/config` Refactor; plugins
  Keep/Refactor per table.
- **In-scope AP codes** (doctrine 09) this wave must actively guard: AP-1 (monolithic files — the
  cli deploy feature is inside a Restructure-verdict package), AP-3 (god interface — the `repair`
  op must extend the capability descriptor, not fatten `DeployTargetPort`), AP-9 (premature
  abstraction — installer adapters exist only for shipped targets), AP-12 (wall-clock in the
  update state machine — fake-clock gates mandatory), AP-14 (re-export — PM-20's CLI re-exports
  are the sanctioned exception, documented), AP-19 (permissions assumed silently — elevation +
  updater ACL grants must be declared), AP-21/AP-23 (command-surface shape for the new verbs),
  AP-24 (target dispatch stays registry-based, no kind-switches), AP-25 (installer side effects
  only at edges).
- **`F-DEPLOY-1`/`F-DEPLOY-2`:** `reviewed` today; promoted to `gated` at PM-20 (the debt entry's
  closing gate). SD-2..SD-5 land after promotion and are gated.
- Open debt in scope: `DEPLOY-ARCHETYPE-7-CORE-SEED` (closes @ PM-20),
  `DEPLOY-BAREMETAL-PUBLIC-WIRING` (closes @ PM-18), `cli-deploy-linux-integration-untested`
  (narrowed @ #457a, closed @ SD-8), `runtime-app-wide-shutdown-orchestrator` (open; §C budgets
  around it), `ISSUE-167-PLUGIN-REMOVE-UNINSTALL` (precedent honored in §B.1).

### I.1 Gates

The §E.2 gate column is **slice-specific augmentation on top of the full archetype gate set** —
it never replaces it. Every Archetype-6 row binds the complete F-CLI checklist from
`ARCHETYPE-6`'s profile (with `PENDING_SCRIPT` + manual evidence where a check has no script —
Phase-A rule); Archetype-2/3/4/5/7 rows bind their profiles' gate sets likewise; SCOPE overlays
bind their full checklists (frontend: loading/error/responsive/browser; docs:
source-alignment/link/terminology/drift). Universal per-slice: scoped wrappers, `quality:scan`,
`arch:check` (harness law). Run-level: this run's gate of record is PLAN-EVAL (Sol · max,
separate session; cycle 3+ owner-authorized). Post-publish authority for published shapes:
`e2e-cli-prod`. Generated-output changes: `scaffold.runtime`.

### I.2 jsr-audit — planned-surface scan (every planned entrypoint enumerated)

Full rubric per entrypoint = package metadata/description, README + runnable examples,
provenance/publish attestation, declared runtime compatibility, explicit export maps, `@module`
docs, per-symbol docs with params/returns + examples, explicit/fast types
(isolatedDeclarations-safe named aliases; no inline `z.infer` at export sites), ESM-only +
relative self-imports, portable embedded assets, documented permissions, exact publish
include/exclude, full-export-map `deno doc --lint`, publish dry-run, consumer-import gate.

| Planned surface | Status | Scan |
| --- | --- | --- |
| beta.11–beta.12 manifest/release/journal schemas (`packages/cli/src/kernel/domain/deploy/`) | **INTERNAL — N/A for JSR** (reason: consumed only by the CLI's own verbs + release server; the public shape deliberately waits for SD-2's reviewed move) | internal-only lint: no export from `@netscript/cli` mod surface; audited when SD-2 publishes |
| `@netscript/deploy-core` `./install` + `./release` (**published by SD-2**; SD-3/4/5 growth) | public @ SD-2 | full rubric **at SD-2** (the publishing slice) and re-run at every SD slice that grows it; named risks: inline-inference slow types; templates/fixtures excluded from publish list; elevation-adjacent APIs document OS permissions; CLI re-exports keep `deno doc --lint` clean on both packages; consumer gate = compile-against-published in `e2e-cli-prod` |
| `deploy.targets.<member>.package` config sub-shape (`@netscript/config`) | public @ SD-2 | full rubric: spread of `deployTargetBaseShape` (no re-declares); explicit named types; docs + example in the config reference; schema round-trip test |
| `PackagingModel` (generator kernel) | **INTERNAL — N/A** (reason: generator-side input contract; deploy-core consumes the emitted manifest, never this model — §B.4) | internal-only lint; revisit only if an external consumer appears (would be a new fork) |
| `MaintenancePort` + capability/op types (`ServiceDeployTargetPorts` family) | public @ SD-2/SD-3 | full rubric where exported from deploy-core; capability descriptor values documented with examples; AP-3 guard (narrow port, no god-interface) |
| `@netscript/plugin-process-manager-core` PM-1 probe-kind types | public @ PM-1 | full rubric within PM-1's gate (schema types named + documented + examples; export-map placement in `contracts/v1`) |
| PM-A adoption/reconcile contract types (`plugin-process-manager-core` `contracts/v1`) | public @ PM-A | full rubric: adoption states/records named + documented; no engine internals leaked; `deno doc --lint` on the export map |
| PM-B supervised-child runtime helper (`plugin-process-manager-core` runtime export) | public @ PM-B | full rubric: `@module` doc + runnable example (the PM-16 helper pattern); explicit types; no engine internals leaked; consumed by NS-P1 + the guardian |
| `@netscript/aspire` `./types` — `AppType`/`AppEntry` gain the `"desktop"` member (#452) | public @ #452 | full rubric on the changed union/interface: docs + example updated; explicit types (no widening beyond the new member); `deno doc --lint` on `./types`; publish dry-run; consumer-compile gate (existing consumers must compile unchanged — additive-only union growth) |
| PM-5's `RuntimeCommandSpec` additions (`clearEnv`, inherited-state strip list) | **public @ PM-5** — they extend the contract PM-5's saved scope already publishes (`RuntimeCommandSpec` is named surface of `plugin-process-manager-core`) | full rubric within PM-5's gate: additive-only fields with explicit named types; docs + a runnable supervised/compiled-host example; permissions note (env access); `deno doc --lint` on the export map; publish dry-run; consumer-compile gate (existing spec literals must compile unchanged) |
| PM-15 renderer knobs (`KillMode`, `Requires`, `Type=oneshot`, `RemainAfterExit`) | **INTERNAL — N/A for JSR at beta.12** (reason: the systemd renderer is `packages/cli` kernel mechanism; the PUBLIC knob surface is the `deploy.targets.<member>` config — callers never touch the renderer API. **Classification is re-decided at the PM-20 move**: if the extraction publishes the renderer inside deploy-core, these knobs enter that slice's jsr audit + consumer gates) | internal-only lint at beta.12 (no export from `@netscript/cli`); re-audited at PM-20 per the bound condition |
| SD-1 host-side types (desktop-supervisor host, token broker, `/_svc` proxy internals, Job-Object capability wiring) | **INTERNAL — N/A** (reason: composition-root implementation inside the packaged app + pm plugin; the public consumption surfaces are the #451 SDK transport seam and SD-6's client/widget exports — anything a third party legitimately needs, incl. the health surface, is SD-6's contract) | non-export invariant asserted by export-map lint in SD-1's gate; SD-6/#451 rows above carry the public rubric |
| NS-P1 plugin `./services` entrypoints (each official plugin) | public @ NS-P1 | full rubric per plugin: `@module` + runnable example; pure start functions (no config-time env side effects); `deno compile` smoke; no app-only types dragged into the public graph; portable (no bare local paths) |
| `@netscript/sdk` #451 `createInProcessClientLink` (+ SD-6 client/widget surface) | public @ #451 / SD-6 | full rubric: explicit types, zero `any`; transport switch must not widen existing public client types (named risk); SD-6 widget exports documented with examples; consumer gate via the SD-7 conformance app importing published shapes |

### I.3 Debt & deferred scope

Debt: none created; closures scheduled (`DEPLOY-ARCHETYPE-7-CORE-SEED` @ PM-20,
`DEPLOY-BAREMETAL-PUBLIC-WIRING` @ PM-18, `cli-deploy-linux-integration-untested` @ #457a/SD-8);
doctrine addition = composition modes (SD-7). Deferred: macOS (stable); rings (stable);
fleet/MDM/MSIX/stores (out); per-user instance brokering (stable); Linux OS containment backstop
(SD-H, stable — OF-H); PM-35 (backlog); serverless #349 (WATCH).
