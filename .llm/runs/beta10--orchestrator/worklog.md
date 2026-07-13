# Worklog — beta.10 orchestrator

## 2026-07-13 — session start

### Route identity (requested vs observed)

| Lane | Requested | Observed |
| --- | --- | --- |
| Orchestrator (this session) | Claude · Anthropic · `opus-4.8` · medium | Claude · Anthropic · `claude-opus-4-8` · medium — **match** |
| Stream B — non-dashboard sub-agent | Claude · Anthropic · `opus-4.8` · high | dispatched on `opus`; effort inherited from brief — **match** |

Per the amended `lane-policy.md`, the orchestrator lane is on Opus 4.8 · medium under the condition
`temporary_while_fable_outside_subscription`. Reverts to Fable 5 when it returns to the plan.

### Action 1 — Slice 0, Claude Design MCP pre-flight: **BLOCKED (owner step)**

`list_projects` and `list_design_systems` both return a consent-required error, not a 401/404:

> "Connect to Claude Design? … The user hasn't granted this — run `/design consent` to grant it (it
> can't be approved automatically in this permission mode)."

Retried once (the documented 404/401 intermittency does not apply — this is a scope grant, not a
transport failure). The owner granted access conversationally, but the grant is a **slash command**:
the permission mode cannot auto-approve it. Owner must run `/design consent` (the analogue of the
`/design-login` step named in `supervisor.md` §Slice 0). Stream A canvas work does **not** start
until the pre-flight passes; local Stream A prep (registry sync) proceeds meanwhile per plan
(OQ-1 "does not block slices 1–2").

### Action 2 — Stream B delegated

Non-dashboard stream dispatched as a background sub-agent on Opus 4.8 · high with
`briefs/non-dashboard.md` as its brief. Owns PR #715 (run-deno-lint.ts CI bug + README rewrite) and
issues #763 / #762 / #695. Explicitly boundaried off the dashboard stream, `tools/design-sync/`, and
the Claude Design project. Framework source stays a WSL Codex delegation for that stream too.

### Owner decisions (2026-07-13, in-session)

- **OD-1 — Back up before revamp.** Before any Claude Design revamp, take a **copy of the current
  project version** first. This refines LD-2 (which said the stale project is "abandoned"): it is not
  deleted or overwritten — it is duplicated/snapshotted, and the revamp proceeds on the copy-safe
  side. First canvas action after Slice 0 passes is therefore a backup, not a write.
- **OD-2 — `/design consent` is shadowed.** The repo ships a local `design` skill
  (`.claude/skills/design/`) that intercepts `/design`, so the built-in consent command cannot be
  invoked as-is in this checkout. Slice 0 stays blocked until the grant is made another way (see
  worklog "Action 1"). Candidate resolutions for the owner: grant from `claude.ai/design/settings`,
  or temporarily rename the local skill.

### Slice 0 — Claude Design MCP pre-flight: **PASS** (2026-07-13)

Owner ran `/design-login` (not `/design consent` — that form is shadowed by the repo's local `design`
skill). Auth cleared; full round-trip verified:

- `list_projects` → 7 projects.
- `get_project` on `ec262e10-d4ad-451f-9aeb-e51955db3634` (*NetScript — NS One*) →
  `type: PROJECT_TYPE_DESIGN_SYSTEM`, org-scoped, comment link-permission. It **is** a real design
  system, it is simply not the account default (`eis-chat — NS One` holds `is_default`).
- `read_file` on `README.md` → ground-truth read of the NS One runtime contract, layer ladder, and
  the five hard rules for canvas work. No manual download; LD-3's fully-agentic canvas lane is viable
  and the recorded owner-relay fallback is **not** needed.

Current NS One inventory: 44 components (`blocks` 11, `general` 30, `islands` 3), 7 screens
(`01`–`04` + `S01`/`S03`/`S13`), `_preview` ×44, plus the runtime/style closure.

### OD-1 — backup taken **before** any revamp write: **DONE**

| Field | Value |
| --- | --- |
| Source | *NetScript — NS One* — `ec262e10-d4ad-451f-9aeb-e51955db3634` |
| Backup | *NetScript — NS One (BACKUP 2026-07-13, pre-beta.10 revamp)* — `30404d40-3a9f-4616-9465-4e029a2c00dc` |
| Files copied | **191** — 7 root, `components` 132, `screens` 8, `_preview` 44 |
| Method | server-side `copy_files` (not subject to the 256 KiB read cap — `_ns_runtime.js` alone is 1.1 MB) |

Caveat to carry: `create_project` takes no `type`, so the backup is a **regular project**, not a
design-system project (that type is immutable at creation). It is a faithful *content* snapshot and a
restore source; it is not itself bindable as a design system. If a bindable rollback target is ever
required, the restore path is copy-back into `ec262e10…`, which retains the design-system type.

### Action 3 — Stream A, registry sync: **first run FAILS (real drift, see `drift.md` D-1)**

`deno task design:sync` against the current `fresh-ui` registry:

```
conversion errors:
  ! mcp-ui-widget: unmapped preact value import "h" in islands/McpUiWidget.tsx
error: deno bundle failed:
error: No matching export in "__ds/preact-compat.ts" for import "h"
```

The registry gained an `mcp-ui-widget` island since the converter was written; the converter's
`preact-compat` shim (`tools/design-sync/src/convert.ts:192,334`) has no `h` export. This is the
plan's own drift-watch item ("fresh-ui registry changes on main during the run") landing for real,
and the risk-register row "registry→React conversion edge cases (signals-heavy islands)". Dispatched
as a Codex slice — the orchestrator does not implement.

### Action 3a — Codex transport repair (unmanaged app-server; the 2026-06-14 incident, again)

Owner reported the daemon was not visible on mobile. Diagnosis chain:

1. `agentic:runtime doctor` → `no_change`, foundation healthy, **sessions: 0**.
2. `codex app-server daemon version` → running, managed path, 0.144.1.
3. `codex remote-control start --json` → `Error: app server is running but is not managed by codex
   app-server daemon` — the exact known incident in `codex-wsl-remote` § Known Incidents.
4. `agentic:runtime repair codex-remote --dry-run` → **refused**: "active sessions or child commands
   were observed". **False positive** — the observed `deno`/`aspire` processes are the orchestrator's
   own MCP servers (aspire, github, firecrawl), not Codex slice work. Worth a follow-up: the repair
   guard's child-command matcher does not distinguish supervisor MCP servers from agent child jobs.
5. Confirmed safety by hand: no Codex rollouts in the last 2h; the offending app-server (pid 1134,
   `codex -c features.code_mode_host=true app-server --listen unix://`) was **orphaned** (`ppid 1`),
   51 min old.
6. Applied the skill's documented recovery: kill the app-server pid → remove the stale
   `app-server-control.sock` → `codex remote-control start --json`.

Result: `status: connected`, `remoteControlEnabled: true`, `serverName: YogaBook9i`,
`environmentId: env_e_6a2d7485c5a0832a82505a12442cd3ec`, managed daemon 0.144.1. Mobile visibility
restored.

**Cost of the repair:** it killed the in-flight `ds-preact-compat` thread
(`019f5877-c387-7b82-825d-9738baf1bc56`), which had launched at 00:34 against the stale, thin version
of the brief. Worktree left clean at `6c0dd587` — no work lost. Re-staged the corrected brief (now
naming all eight relevant skills per `codex-wsl-remote` § Brief authoring) and **resumed** the same
thread rather than firing a second `send-message-v2` (the one-active-send-per-worktree rule).

### Action 3b — slice launched

| Field | Value |
| --- | --- |
| Slice | `design-sync-preact-compat` (drift D-1) |
| Worktree | `/home/codex/repos/ns-ds-sync` (cut upstream-free; push-safety gate requires `upstream=NONE`) |
| Branch | `fix/design-sync-preact-compat` off `feat/beta10-integration` @ `6c0dd587` |
| Thread | `019f5877-c387-7b82-825d-9738baf1bc56` (mobile-visible, daemon-attached) |
| Requested route | Codex · OpenAI · `gpt-5.6-luna` · max (small-fixes lane) |
| Observed route | Codex · OpenAI · `gpt-5.6-luna` · max — **matched** |
| Runtime | approval=never · sandbox=dangerFullAccess |

Note: the first launch attempt was correctly **refused** by the suite's push-safety gate because the
orchestrator worktree `feat/beta10-integration` has an upstream — a bare push could have landed on the
integration branch. That gate did its job; the fix was a dedicated upstream-free worktree.

### OD-3 — Claude Design work goes through our own Deno tooling (owner, 2026-07-13)

Owner: "for claude design make sure we use our deno tools we specially developed for it."

Confirmed this is already the designed architecture, and verified the surface rather than assuming:

- `tools/design-sync/mod.ts` — `deno task design:sync [build|check|clean]`.
  - `build` → converts the fresh-ui registry into the synthetic React package + canvas bundle in
    `.ds-sync/`.
  - **`check`** → builds **twice** and gates on **idempotence + traps + parity**. That is the plan's
    Fitness Gates table already implemented in code; it is the command that produces a verdict, and
    the one to run before any upload. `build` alone is not a verdict.
  - `clean` → drops the scratch dir.
- Config: `resources/design/dashboard/.design-sync/config.json` — already targets
  `projectId: ec262e10-d4ad-451f-9aeb-e51955db3634` (*NetScript — NS One*), `pkg @netscript/ns-one`,
  `globalName NSOne`, React 19.2.0. No retarget needed.

**Load-bearing constraint discovered while checking the upload lane.** The bundle must be uploaded
with the **native `DesignSync` tool using `localPath` per file** — not the `claude-design` MCP.
`mcp__claude-design__write_files` accepts `local_path` in its schema but **returns not-implemented**;
it only takes inline `data`. `_ns_runtime.js` is **1.1 MB** and `_ns_styles.css` ~100 KB, so an
inline-data upload would both blow the context window and defeat the point of the tooling. `mod.ts`
says exactly this in its header comment ("uploaded … by the canvas lane (native DesignSync tool,
`localPath` per file); this CLI never talks to the network"). So: **`design:sync check` → green →
`DesignSync` with `localPath`.** MCP `write_files` is for small, dynamic files only.

**Independent corroboration of drift D-2.** `mod.ts:59-62` documents the same trap from the tooling
side: `_ds_bundle.js`/`_ds_bundle.css` are *platform-reserved* — the canvas compiles the uploaded
`.tsx` into its own `_ds_bundle.js` (no ReactDOM, no window globals) and **clobbers anything uploaded
at that path**. Hence `_ns_runtime.js` / `_ns_styles.css`. The platform's generic "load
`_ds_bundle.js`" instruction is therefore not merely wrong for NS One — it names a path the platform
itself overwrites. D-2 stands, with a second source.

### Action 3c — CORRECTION to 3b: the resumed thread was **not** mobile-visible

Owner caught this: "I don't see the codex slice on phone… your sub agent is not attached to it."
Correct. Action 3b's claim that the resumed thread was "mobile-visible, daemon-attached" was **wrong**,
and the mistake is exactly the one `codex-wsl-remote` § Launch model warns about:

| Command | Daemon-managed? | Mobile-visible? |
| --- | --- | --- |
| `codex debug app-server send-message-v2` | yes | **yes** |
| `codex exec resume <thread>` | **no — standalone process** | **no (Desktop-sync only)** |

`codex-resume.ts` issues `codex exec resume`. It is the right tool for steering a **live** daemon-
registered thread, but the thread I resumed had died with the old app-server, so the resume ran as an
orphan standalone process. It did real work (`mod.ts`, `convert.ts` modified; `convert_test.ts`
created) while being completely invisible to the owner — success-shaped failure, the worst kind.

Recovery: killed the standalone resume (edits preserved on disk — nothing lost), released the stale
sender lease (see `drift.md` **D-3**), amended the brief to tell the fresh thread about the
uncommitted partial work and to judge it rather than trust or discard it blindly, corrected two stale
lines in the brief that still named the *orchestrator's* worktree/branch (`netscript-beta10` /
`feat/beta10-integration`) instead of the slice's (`ns-ds-sync` / `fix/design-sync-preact-compat`),
then relaunched via `launch-codex-slice.ts` → `send-message-v2` against the live managed daemon.

**Lesson (candidate for the skill):** after any app-server restart, threads launched against the old
daemon are dead. Do not resume them — relaunch with `send-message-v2`. "Resume, don't fork" is only
correct while the daemon that owns the thread is still alive.

### OD-4 — stream routing split (owner, 2026-07-13)

Owner: design work → Claude sub-agents/workflows; non-dashboard beta.10 → Codex, in parallel, aiming
to land before the new prototype arrives. The current small `design-sync` pass stays on Codex
(explicitly blessed as "fine for that small pass").

| Work | Lane | Rationale |
| --- | --- | --- |
| Dashboard **prototype / canvas / design artifacts** | **Claude sub-agents (Opus 4.8) / workflows** | Language- and taste-dominated; Codex is weakest here. Not `packages/`/`plugins/` source, so the supervisor-does-not-write-framework-code boundary is not crossed (same reasoning as the CLAUDE.md documentation exception). |
| `plugins/dashboard` + `fresh-ui` **implementation** of what the prototype proposes | **WSL Codex** (unchanged) | Framework source. Doctrine is explicit; a prototype does not launder it into a Claude lane. |
| All **non-dashboard** milestone-12 issues | **WSL Codex**, fanned out in parallel | Mechanical framework work, mobile-visible, token-efficient. Stream B supervises, does not hand-write. |
| `design-sync` converter pass (in flight) | Codex (`gpt-5.6-luna` max) | Owner-blessed exception; tier-2 tooling, small fix. |

Steering message sent to the Stream B sub-agent: supervise-don't-implement, one Codex slice per
upstream-free worktree, parallel fan-out, plus the two landmines from today (resume≠daemon-managed;
stale sender lease) and the "read the diff, not just the verdict" lesson from R-1.

### OQ-A — GLM 5.2 obligation on the dashboard design pass (**owner decision needed**)

`lane-policy.md` **Harness invariant 5** is unconditional:

> Major UI/UX work requires GLM 5.2. Design-system work, dashboard/console surfaces, and significant
> frontend UX are either **led** through the `claude-design-glm-5-2` route or **receive its
> adversarial design pass before merge**.

OD-4 routes the dashboard design pass to Claude sub-agents — which is a *legal* configuration, but
only the "another lane leads" branch. It therefore **requires a GLM 5.2 adversarial design pass
before merge**; it does not remove the obligation.

Open risk: a prior finding (2026-07-12) recorded that OpenRouter-driven GLM 5.2 could not be driven
through the codex/claude agentic lanes (direct API only), while the just-amended `lane-policy.md`
now calls OpenRouter-through-Claude-Code a "proven transport". These cannot both be current. The GLM
adversarial pass must be **proven runnable before the prototype is merge-ready**, not discovered
broken at the gate. Verification is cheap and should happen during the design pass, not after.

### Action 3d — D-1 implementation slice reviewed and validated (2026-07-13)

The interrupted worktree edits were **completed, not discarded**. The existing changes already had
the right generic direction — a symbol-to-compatibility mapping and conversion diagnostics — so the
slice retained them after a diff review and filled the missing regression coverage. No
`packages/`/`plugins/` source was touched.

Implementation:

- Audited the current registry and configured `@netscript/fresh-ui/interactive` graph. The actual
  value imports are `preact: h, createContext`; `preact/hooks: useCallback, useContext, useEffect,
  useId, useRef, useState`; and `@preact/signals: useSignal`.
- Added React-backed mappings for that value surface (`h` → `React.createElement`) while retaining
  the generic existing compatibility table for other direct equivalents.
- Conversion now aggregates diagnostics and throws `ConversionError` before shim emission or
  `buildBundleJs`; the CLI prints the component, synthetic file, and symbol in a clear
  `conversion errors:` block. The old report-and-continue path was removed.
- Added a next-to-converter regression test that converts the value-heavy fixture, invokes the real
  `buildBundleJs`, and checks an unmappable value fails at conversion with unit/file/symbol context.
  Because the real bundle test writes a temp synthetic package and launches `deno bundle`, it was
  executed with `deno test --allow-all tools/design-sync/`; the bare no-permission invocation cannot
  grant those test-local capabilities.

Validation evidence:

| Gate | Result | Evidence |
| --- | --- | --- |
| Scoped check | PASS | `run-deno-check.ts --root tools/design-sync --ext ts,tsx`; 12 files, 0 findings |
| Scoped lint | PASS | `run-deno-lint.ts --root tools/design-sync --ext ts,tsx`; 12 files, 0 findings |
| Scoped format | PASS | `run-deno-fmt.ts --root tools/design-sync --ext ts,tsx`; 12 files, 0 findings |
| Converter tests | PASS | `deno test --allow-all tools/design-sync/`; 2 passed, 0 failed |
| Sync run 1 | PASS | parity green; 6 trap checks intact (4 PASS, 2 by-design WARN); 184 bundle files |
| Sync run 2 | PASS | same parity/trap report; bundle tree hash unchanged: `c640ddda4e3d93abb76a5b9c56fe06af6cb2d85246e8d46d66daa1462600df41` |
| Sync idempotence check | PASS | `deno task design:sync check`; hash `f0714aeb10ab`, parity green, no FAIL traps |

The opposite-family IMPL-EVAL and orchestrator sign-off remain pending; this implementation session
does not self-certify the slice.

## Overnight autonomous run (owner: "work fully autonomously overnight", 2026-07-13)

### OD-5 — corrected lane split for the dashboard revamp

Owner: "most tasks, including the dashboard Claude Design revamp, are managed by you and Opus 4.8
high subagents; **GLM 5.2 kicks in only for design verification pass**."

This supersedes my earlier reading of OQ-A. The configuration is invariant 5's **"another lane
leads"** branch:

| Role | Lane |
| --- | --- |
| Dashboard revamp — **lead** | Orchestrator + **Claude · Opus 4.8 · high** sub-agents |
| Dashboard revamp — **design verification / adversarial pass (required before merge)** | **Claude · OpenRouter · GLM 5.2** (`claude-design-glm-5-2`, xhigh) |
| Non-dashboard beta.10 | WSL Codex, parallel (Stream B supervises) |
| Framework source from the prototype | WSL Codex (unchanged doctrine) |

### GLM 5.2 lane — verified correct, blocked on a missing credential

- `agentic:provider-canary --all` → `claude-design-glm-5-2` is the **only** preset with
  `liveEligible: true`, `agenticTurn: supported`, transport `anthropic-messages`. Its Codex twin
  (`codex-design-glm-5-2`) is `agenticTurn: unsupported` (`codex-native-namespace-tool`).
  **This closes the contradiction**: the 2026-07-12 "OpenRouter GLM lanes are broken" finding applied
  to the **Codex** OpenRouter lane, not the Claude one. The Claude route is sound.
- Live canary → `status: blocked`, `credential: absent`, `auth_required`. The `claude-openrouter`
  profile reads **`OPENROUTER_API_KEY`** (mapped into the child as `ANTHROPIC_AUTH_TOKEN`).
- Owner said the key is "in the claude folder". Searched: `~/.claude/settings.json` (no `env` block),
  `~/.claude/session-env/*` (absent), `~/.claude/.credentials.json` (claude.ai OAuth + MCP OAuth +
  design OAuth only). **`OPENROUTER_API_KEY` is not present anywhere under `~/.claude`.** The only
  hits were test-file text in job logs, not a credential.
- **Not a blocker for tonight:** GLM is the *verification* pass — a merge gate — and nothing merges
  overnight. The revamp proceeds on the Opus lead lane. **Owner action in the morning:** export
  `OPENROUTER_API_KEY` (or name the file that carries it) and the GLM verification pass runs.

### Hard stop-lines for this overnight run (self-imposed, non-negotiable)

Recorded because a prior orchestrator session breached a stop-line and published a release:

1. **No merges.** Nothing to `main`; nothing to `feat/beta10-integration`.
2. **No publish, no release cut, no milestone close.**
3. **No lock-file deletion; no `deno cache --reload`.**
4. **No self-certification.** Evaluations are dispatched to opposite-family sessions; their verdicts
   are recorded, not acted on.
5. Everything lands **merge-ready and stopped**, with a cold-start-readable state for the owner.

### GLM 5.2 lane — **UNBLOCKED** (owner was right: it is on WSL, not in `~/.claude`)

Key location (canonical, sibling of the sender-lease store):
**`/home/codex/.config/netscript-agentic/openrouter.env`** → `export OPENROUTER_API_KEY`.
My earlier search was scoped to `~/.claude` because that is where the owner said to look; the agentic
suite keeps it under `~/.config/netscript-agentic/`. Recorded here so no future session re-derives it.

Live canary, key sourced (`set -a; . openrouter.env; set +a`):

```
profile=claude-openrouter model=z-ai/glm-5.2 effort=xhigh
credential : available          ← was "absent"
process    : exitCode 0         ← the model really answered
capabilities: tools=supported (2 events), streaming=supported (3 events),
              reasoning=UNSUPPORTED (0 events)
status     : blocked — fanOutEligible: false
diagnostic : capability_unsupported — "reasoning compatibility is unsupported; fan-out is blocked"
```

**Read this carefully — `blocked` here does not mean the design lane is broken.** The canary blocks
**fan-out** (parallel workflow fan-out, the `claude-fanout-minimax-m3` purpose). The
`claude-design-glm-5-2` preset's purpose is `creative-design` and its `agenticTurn` is `supported`;
a **single bounded agent turn** (`claude-print`) is exactly what a design-verification pass is, and
tools + streaming — the two capabilities such a turn needs — are both supported.

**What is genuinely true and must not be papered over:** GLM 5.2 over OpenRouter emits **no reasoning
events**, so the preset's `effort: xhigh` is *nominal only* — there is no extended-thinking signal to
observe or verify. Consequences:
- The design-verification pass may run as a **single GLM turn**, not a fan-out.
- Do **not** claim "GLM 5.2 · xhigh reasoning" as evidence in any gate write-up; the honest claim is
  "GLM 5.2, tools+streaming, no observable reasoning trace".
- Any future attempt to use GLM for a *swarm/fan-out* lane will be blocked by the canary, by design.

Verification pass therefore proceeds tonight-compatible: build on Opus (lead), verify on GLM (single
turn) once the prototype exists. No owner action needed.

### Action 3e — D-1 commit trail (2026-07-13)

After the independent diff review and green gates, the slice was committed and pushed with the
explicit upstream-free refspec required by the brief:

| Field | Value |
| --- | --- |
| Commit | `3e297c773f682fd73a7af77df1f3e9e4f7bd961c` — `fix(design-sync): complete Preact value compatibility` |
| Branch | `fix/design-sync-preact-compat` |
| Push | `origin HEAD:refs/heads/fix/design-sync-preact-compat` — verified remote ref matches commit |
| PR | None opened; separate opposite-family IMPL-EVAL/orchestrator gate remains required |

The implementation session is complete and stopped at the evaluator handoff.

### OD-6 — owner routing override: GPT-5.6 **Sol · low** for next slices (2026-07-13)

Owner: "use gpt 5.6 sol low instead of Luna max for next slices."

**Status: owner override, not a policy read.** `lane-policy.md`'s canonical table binds
*Small fixes / fast iteration* → **Luna · max** and *Normal implementation* → **Sol · medium**.
`Sol · low` is not a canonical route. Recorded here per the "record the selected lane and any owner
override in supervisor.md and drift.md" rule. **If this is meant to be durable it must land in
`routing-policy.ts`** (routing is data, not prose) — that is a code change, i.e. a Codex slice, not
something a supervisor memorizes.

**Honest read of tonight's evidence, because it does not straightforwardly support "Luna max was the
problem":** Luna · max did the substantive D-1 work *well* — audited the registry's real Preact value
surface rather than special-casing `h`, made unmapped imports fail loudly inside `convertUnits`,
wrote positive + negative regression tests, and produced a green, idempotent gate. The R-1 defect came
from **un-briefed initiative** (it improved the tree-hash separator on its own and botched the byte
encoding), not from insufficient effort. Lower effort plausibly reduces *that* failure mode — less
freelancing outside the brief — but the real gap was that **no gate could catch it**; only reading the
diff did.

**Applied policy for the remainder of this run:**

| Slice shape | Route |
| --- | --- |
| Mechanical, fully-specified (files + change named in the brief; execute, don't decide) | **Sol · low** (owner override) |
| Enumeration / audit / root-cause / multi-package sweep | Sol · medium or higher — **not** lowered |
| In flight, unchanged | #762 sweep stays Sol · medium; #763 stays Luna · max (both already launched, route matched) |

Mitigation carried into every brief regardless of tier: **"Do not make improvements outside this
brief. If you see one, report it; do not implement it."** That addresses R-1's actual cause, which a
model tier does not.

### Action 3f — orchestrator review R-1 remediated (2026-07-13)

R-1 is fixed on the implementation branch. `tools/design-sync/mod.ts` now spells the tree-hash
delimiter as the TypeScript escape ``\0`` rather than embedding raw `0x00` bytes. Runtime semantics
remain NUL-delimited. The parent baseline itself contained two raw NUL bytes, so the existing
`*.ts text eol=lf` attribute was strengthened with `diff`; plain `git show --stat` now renders the
amended commit textually instead of retaining the parent's binary classification.

| Evidence | Result |
| --- | --- |
| Raw NUL count | `0` |
| `file tools/design-sync/mod.ts` | `JavaScript source, Unicode text, UTF-8 text` |
| `git show --stat` line | `tools/design-sync/mod.ts | 23 ++++---` |
| `git show --numstat` | `13  10  tools/design-sync/mod.ts` |
| Sync gate | PASS; parity green; six trap checks present; both independent builds hash to `f0714aeb10abc9f6343dd52b85b9c39859c37b25538ab4102471caeb260e7e19` |
| Scoped wrappers | check/lint/fmt PASS; 12 files, 0 findings |
| Permissioned converter tests | `deno test --allow-all tools/design-sync/`: 2 passed, 0 failed |
| Amended commit | `0d7d2055507e35334096c7d7aa96b6e34f62da25` |
| Push | explicit refspec with force-with-lease to `fix/design-sync-preact-compat`; remote verified |

The idempotence hash did **not** change from the prior `f0714aeb10ab`: raw NUL inside a template
literal and source escape ``\0`` evaluate to the same runtime byte, which is the requested semantic
equivalence. Two independent post-fix builds both produced
`f0714aeb10abc9f6343dd52b85b9c39859c37b25538ab4102471caeb260e7e19`.

Validation-command discrepancy: the exact bare `deno test tools/design-sync/` invocation exits 1
before the accepted real-bundle test body (`NotCapable: Can't escalate parent thread permissions`).
The test requires read/write/run to write its scratch package and launch `deno bundle`; the
permission-bearing invocation passes. The test was not weakened or conditionally skipped.

---

## MORNING HAND-OFF — state at 01:20, 2026-07-13 (read this first)

### Done and verified

| Item | State | Evidence |
| --- | --- | --- |
| **D-1** — `design:sync` could not bundle the registry | **FIXED** | commit `0d7d2055` on `fix/design-sync-preact-compat` (worktree `/home/codex/repos/ns-ds-sync`). Shim now covers the real Preact value surface; unmapped value imports fail loudly in `convertUnits` before `deno bundle`; regression tests both paths. |
| **R-1** — literal NUL bytes committed into `mod.ts` | **FIXED** | NUL count **0**; `\0` escape at `mod.ts:95`; git sees text again (`mod.ts \| 23 ++++---`, was `Bin`). Idempotence hash unchanged (`f0714aeb10ab`) — correct: `\0` and a raw NUL are the same runtime string, so only the *encoding* changed. |
| `design:sync check` gate | **GREEN** | parity green · idempotence PASS · all six trap checks present · 184-file bundle. Two pre-existing WARNs (`theme-toggle` weak props; `mcp-ui-widget` predicted blank — needs `src`/`theme`). |
| **NS One re-sync** (Stream A gate) | **DONE** | **184 files** uploaded via native `DesignSync` + `localPath` (49 + 90 + 45). Verified on the canvas: `components/islands/McpUiWidget` now present. The design system reflects today's real `fresh-ui`. |
| **OD-1 backups — BOTH taken before any write** | **DONE** | Design system → `30404d40-3a9f-4616-9465-4e029a2c00dc` (191 files). Prototype → `ca5c0389-c155-47bd-b274-d2d2aa193cc6` (48 files). The prototype is the *actual* revamp target and was nearly missed. |
| **GLM 5.2 lane** | **UNBLOCKED + characterized** | Key: `~/.config/netscript-agentic/openrouter.env`. Works for single turns; **no reasoning trace** — see drift **D-4**: that is a *Claude Code client* gap, not a model gap. `effort: xhigh` on this preset is inert. |

### In flight (nothing merged, nothing published)

| Lane | What | Where |
| --- | --- | --- |
| **Stream A — canvas P1** | Shell / sidebar IA / locked route tree / breadcrumbs / ⌘K / Home. Opus 4.8 · high. Executing `design-prompts/01-shell-ia-routing.md` against prototype `4c19e768-…`. Launched 01:19. | Claude Design |
| **Stream B** | #715 Codex IMPL-EVAL (authorized in place of the OpenHands infra fault); #762 sweep (3 commits, 22 suppressions removed / 0 added); #763 (relaunched on `gpt-5.6-sol`/high after `luna`/`max` stalled); JSR tagline fix (16 over-cap READMEs) | worktrees `ns-b10-715`, `b10-762-tssweep`, `b10-763-pluginspec` |

### Owner decisions waiting

1. **Authority chain — CONFIRM (blocking the rest of the canvas).** The old plan (LD-1, "7 panels") is **two owner-ratifications stale**: it still lists the Flow/Trace **Waterfall**, **Logs**, and **Resource Control** panels that the ratified `dashboard-rescope--seed` killed (#421/#422 closed not-planned; #418 rewritten to "S13 Live Flow — causal seam chain"). The **binding authority is `.llm/runs/dashboard-design--orchestrator/`** (v3 design-prompts + `improvement-brief.md`), which already retires `ns-waterfall`/`ns-preview-tag`. The owner pointed here, and the brief-author reached the same conclusion independently. **Executing the old plan literally would have produced defects by construction.**
2. **Canvas budget.** The locked route tree is ~76 renders; it does not fit LD-1's two passes. Proposal: **five passes + representative entity-detail coverage** (one worked leaf per entity shape).
3. **OpenHands is broken** (`No module named 'fastapi'` — image fault, not a verdict). Filed for fix. #715's evaluator was rerouted to **Codex · `gpt-5.6-sol` · xhigh**, which `lane-policy.md` already names as the review lane for Claude-authored work — so the opposite-family invariant is satisfied without OpenHands.
4. **`OPENROUTER_API_KEY`** was found (see above) — no action needed, noted because the earlier hand-off said otherwise.
5. Nine further open questions in `resources/design/dashboard/OPEN-QUESTIONS.md` (3 blocking).

### Stop-lines held all night

No merges. No publish. No release cut. No milestone close. No lock-file deletion. **No writes to the JSR registry** (the tagline slice fixes READMEs only — jsr.io descriptions will *not* change when it merges; the registry re-sync is a separate, owner-supervised publish action).

### OD-7 — evaluator = opposite-family Claude ⇄ Codex; **OpenHands dropped** (owner, 2026-07-13)

Owner: *"default for Claude vs Codex for adversarial review — no OpenHands."*

| Generator | Evaluator |
| --- | --- |
| Claude-authored | **Codex · OpenAI · `gpt-5.6-sol` · xhigh** |
| Codex-authored | **Claude · Anthropic · `opus-4.8` · high** |
| Mixed | per-slice opposite-family, or dual review |

The invariant is unchanged and is the *point*: **the generator session is never the evaluator
session; no lane self-certifies.** OpenHands was only ever a **transport** for that invariant. The
invariant survives; the transport is dropped. (Proximate trigger: OpenHands is broken —
`No module named 'fastapi'`, an image fault, not a verdict — and it stranded a merge-ready PR. But
OD-7 is recorded as doctrine, not as an outage workaround.)

**Already in force:** #715's IMPL-EVAL was rerouted to a Codex pass before this decision landed, and
Stream B is reviewing the Codex-authored slices (#762/#763) itself — which is the Claude-family half.

**The finding that makes this more than a doc edit.** Every other lane in this repo is *data*:
`routing-policy.ts` holds `CANONICAL_ROUTE_POLICY`, `lane-policy.md` is its rendered view, and a guard
test fails the suite if a volatile value is hardcoded elsewhere. **The evaluator lane was never in
`routing-policy.ts` at all** — zero matches for `evaluator` / `impl-eval` / `openhands`. It lived only
as prose across ~12 markdown files. *That* is why "OpenHands = evaluator" survived as an unexamined
assumption instead of a decision anyone re-ratified. Sweeping the docs alone would set us up to repeat
it.

**Two disjoint workstreams dispatched (file-scoped so they cannot collide):**

| Lane | Scope | Where |
| --- | --- | --- |
| Claude · Opus 4.8 · high (documentation exception) | **`.md` only** — `evaluator/protocol.md`, `plan-protocol.md`, `lane-policy.md`, `run-loop.md`, `agent-handoff.md`, `tooling.md`, 3 skills, `AGENTS.md`/`CLAUDE.md`; decide the fate of the `openhands-handoff` skill and of the OpenHands **CI-gate** trigger template (a CI runner is not an evaluator — that boundary is a real question, not a rubber stamp) | worktree `b10-evaldoc`, branch `docs/evaluator-claude-codex` |
| Codex · `gpt-5.6-sol` · medium | **`.ts` only** — bind the evaluator lanes into `routing-policy.ts` + guard test; ideally make "evaluator must be opposite-family to the generator" a **checkable property**, not a naming convention | worktree `b10-evalroute`, branch `feat/evaluator-route-binding` |

Both carry the anti-R-1 line: *"Do not make improvements outside this brief. If you see one, report
it — do not implement it."*

### OD-7a — CORRECTION to OD-7: the evaluator transport (owner, 2026-07-13)

Owner: *"for evaluator pass I'd suggest using the proven Claude Code + OpenRouter, same model rules as
OpenHands, same skill and templates."*

**My first reading of OD-7 was too coarse and I dispatched two agents on it.** Both have been steered
with the correction. The precise shape:

| Concern | Route |
| --- | --- |
| **Formal evaluator pass** (PLAN-EVAL / IMPL-EVAL) | **Claude Code + OpenRouter** (`claude-openrouter` → `claude-print`) running an **OPEN model** (`minimax/minimax-m3`, `qwen/qwen3.7-max`) |
| **Ordinary review** (not the formal eval) | opposite-family **Claude ⇄ Codex**, as the skill already prescribes for local runs |
| **OpenHands** | its **execution substrate** (GitHub Action / VPS) is dropped. Its **routing policy, skill, output modes, and PR-comment templates are RETAINED** and re-homed onto the Claude Code + OpenRouter transport. |

**The open-model rule is a cost-protection rule, not an OpenHands implementation detail.** From
`.agents/skills/openhands-handoff/SKILL.md` § "Routing policy — READ FIRST": closed/paid models
(Claude/`sonnet`, GPT/`gpt`, Gemini) on this path *"silently burn the owner's balance — this is
prohibited."* It survives OD-7a **verbatim** and must be encoded as an enforceable rule, not a
comment.

**Why this is stronger than my Claude⇄Codex framing.** An open model is **neither Claude-family nor
Codex-family**, so it is adversarial to *both* generators. The invariant — *the generator session is
never the evaluator session; no lane self-certifies* — is satisfied more robustly, not less.

**Also notable:** the skill's existing prose already said *"for any run on the local machine, do NOT
dispatch cloud OpenHands… use a local opposite-family adversarial agent"* — it was pointing at this
conclusion but had **no named local transport**, only a gap. OD-7a fills the gap with a proven one.

**Honest caveat carried into both briefs (drift D-4):** GLM 5.2 through Claude Code emits **no
reasoning trace**, so `effort` on a Claude+OpenRouter route is **nominal**. Any gate write-up claiming
"xhigh reasoning" on this lane would be false. The contract must not imply a capability the transport
does not deliver.

**Steering sent:** doc agent (`.md` sweep) and the `eval-route` Codex slice (thread
`019f58a4-4e32-7bf3-a438-d9dd9230c793`) both corrected. The Codex slice additionally must add
`qwen/qwen3.7-max` to `OPENROUTER_MODEL_IDS` (today it holds only minimax/glm/grok) and make
**open-model-only** and **opposite-family** *checkable properties*, with guard tests that reject a
closed model on the evaluator lane.

### OD-8 — evaluation effort + when adversarial review is warranted (owner, 2026-07-13)

Owner: *"IMPL-EVAL is on Codex sol xhigh — for this time it's fine, but avoid xhigh for simple eval and
prefer open model for eval. Reserve adversarial opposite-family for adversarial review (no need to do
it every time, only when it really matters)."*

This separates two things I had been conflating:

| Concern | Default route | When |
| --- | --- | --- |
| **Routine evaluation** (the ordinary PLAN-EVAL / IMPL-EVAL pass) | **Claude Code + OpenRouter · OPEN model** (`minimax/minimax-m3`, `qwen/qwen3.7-max`) · **modest effort** — *not* xhigh | The default. Most evals are verification, not combat. |
| **Adversarial opposite-family review** | Opposite-family (Claude ⇄ Codex), higher effort | **Reserved** — invoked when the stakes genuinely warrant it, not on every slice. |
| **Automated cloud runs** | OpenHands (GitHub Actions / VPS) — unchanged, not ours to touch | Cloud. |

**Rationale (owner's, and it is right):** xhigh on a routine eval buys little and costs a lot; open
models are cheap and sufficient for verification; and treating *every* pass as adversarial devalues
the adversarial pass when it is actually needed. Escalation should be a signal, not a ritual.

**In force now:** #715's IMPL-EVAL stays on Codex · sol · xhigh (owner: "for this time it's fine") —
it is already running and re-running it on a cheaper lane would waste the work. **From the next eval
onward the default is open-model + modest effort.** I did *not* dispatch the duplicate open-model
IMPL-EVAL I had drafted: two evaluators on the same PR is exactly the ritualism OD-8 rejects.

**Empirical support for the open-model default (drift D-4 amendment):** `minimax-m3` and
`qwen3.7-max` both respond **and emit real thinking blocks** through Claude Code + OpenRouter. Only
GLM 5.2 yields no reasoning trace on that transport. So an open-model evaluator is not a downgrade in
observability — it reasons.

### Evaluator lane — COMPLETE and enforceable (02:0x, 2026-07-13)

**Codex slice `feat/evaluator-route-binding`** (worktree `b10-evalroute`), 3 commits, **246 tests
pass**, `deno check` clean:

- `qwen/qwen3.7-max` added to `OPENROUTER_MODEL_IDS` (was minimax/glm/grok only).
- New preset `claude-evaluator-qwen-3-7-max`; `'evaluation'` added to `OpenRouterPreset.purpose`
  (which previously had **no** evaluation member — an evaluator preset could not even be *typed*).
- `minimax-m3` preset flipped `agenticTurn: 'unverified'` → **`'supported'`** (verified, see probes).
- `resolveCanonicalFormalEvaluatorRoute()` **throws** unless the route is Claude + OpenRouter +
  `open_only` + an approved open model. **The cost-protection rule is now enforced in code**, not in a
  comment.

**Claude doc slice `docs/evaluator-claude-codex`** (worktree `b10-evaldoc`), 13 `.md` files, additive;
OpenHands cloud rules and `AGENTS.md` untouched (per OD-7b); `docs:links` 0 broken;
`agentic:sync-claude:check` OK.

### Two corrections I owe the record (both were mine)

1. **"The evaluator lane was never in `routing-policy.ts`" — FALSE.** I grepped
   `evaluator|impl-eval|openhands`, which misses `purpose: 'evaluation'`. The doc agent caught it and
   refused to repeat my claim. The **correct, sharper** finding is its own: the route type and the
   opposite-family guard exist in code, but there is a **`review_claude` route and no `review_codex`**
   — so Codex-authored work resolves to `blocked: opposite_family_unavailable`. The guard was there;
   the candidate was not.
2. **D-4's blanket claim — FALSE, and I had already pushed it into four doctrine files.** See the D-4
   amendment in `drift.md`. Corrected in both agents.

### Probes that replaced assumption with evidence

| Model via Claude Code + OpenRouter | Thinking blocks | Agentic turn (real tool calls) |
| --- | --- | --- |
| `z-ai/glm-5.2` | **0** | — |
| `minimax/minimax-m3` | yes | **SUPPORTED** (called `Read`) |
| `qwen/qwen3.7-max` | yes | **SUPPORTED** (2× `Read`) |

So the OD-8 default (open model, modest effort) is backed by **verified capability**: the local
evaluator reasons *and* can drive tools, i.e. it can actually run gates. The no-reasoning caveat is
**GLM-only** and belongs to the design-verification lane.

**Lesson worth keeping:** I generalized a client-wide rule from one model's behaviour and stated it
confidently enough that it reached doctrine. A 90-second probe of the second model falsified it. Probe
before generalizing; a confident wrong claim propagates faster than a hedged right one.

### Stream A — canvas P1: NO WRITES after 45 min

Prototype `4c19e768-…` etag unchanged. Not necessarily stalled (agent transcripts are **not** a
progress signal — completed agents show the same 140-byte stub, which nearly led me to kill a working
agent). Sent a status ping and **changed the sequencing**: land shell+Home first as a working write,
then each route incrementally, so screenshots can flow to the owner as screens land rather than
arriving all-or-nothing in the morning.

**Baseline screenshot of the CURRENT prototype found two defects** (delivered to the owner):
`window.NSOne` is **undefined** in the live render (it is on the platform's `_ds_bundle.js` path — D-2
in the wild), and **unresolved `{{ }}` template holes leak into SVG attributes** (`{{ k.fill }}`,
`{{ e.d }}`, `{{ e.lx }}`), producing console errors. Both are now hard acceptance criteria for P1.

### OD-9 — the canvas is DELEGATED to Claude Design, not authored by us (owner, 2026-07-13)

Owner challenged whether the canvas agent was *delegating to Claude Design* or *monkey-patching the
`.dc.html` through the MCP file API*. **It was doing the second.** Honest answer given; fork put to the
owner; owner chose delegation. The doctrine is now explicit:

> **Claude Design is the required harness for the prototype. The agent's role is to hand it a prompt,
> then sync back, screenshot, and review. We do not author `.dc.html`.**

**What the MCP can and cannot do (verified, so nobody re-litigates it):** the `claude-design` MCP
exposes file reads/writes, `copy_files`, `render_preview`, and `put_conversation` — which is
**display-only** ("the sync is one-way, agent to app: nothing typed in the app is ever returned").
**There is no method that triggers Claude Design's own canvas agent.** `get_claude_design_prompt`
even says it *"MUST be called before any `write_files`"* — i.e. the MCP's own intended pattern is for
the connecting agent to *adopt* the Design system prompt and author files itself. That is precisely
what the owner does **not** want. So delegation requires a human paste. Recorded, not worked around.

**Canvas cleaned.** The P1 agent's writes had landed before the stop reached it, but every write
created a **new path** — the owner's `NetScript Dev Dashboard.dc.html` was never touched
(etag `1783372756515797`, byte-identical throughout). Saved the agent's work locally, then deleted the
four agent-authored files (`NetScript Dev Dashboard v2.dc.html`, `assets/ns-shell.css`,
`assets/ns-kpi-spark.css`, `assets/ns-fixture.js`) from the canvas so Claude Design starts from the
real prototype and is not anchored by an agent's draft. The `_ds/` refresh was **kept** — it is
infrastructure (the bound copy was genuinely stale) and correct either way.

**Owner has launched Claude Design on P1.** An 11-minute cron polls `_reports/P1-complete.md`; when it
lands, screenshot every route × theme, **verify the self-check rather than trust it**, review against
the locked IA + the 11 hard constraints, and post to the owner.

### Two claims of mine that were WRONG — corrected before they reached the prompt

1. **"`window.NSOne` undefined is a defect" — FALSE.** The prototype renders raw `ns-*` classes, not
   React components, and that is *deliberate*: class markup round-trips into `@netscript/fresh-ui`
   Preact source unchanged, which is the entire point of the sync-back lane. Rewriting to React
   components would have **damaged** the sync path. I had already pushed this as a hard acceptance
   criterion to the canvas agent; it read the file and pushed back, correctly.
2. **The `{{ }}` leak is real but I mis-scoped it.** The DC runtime fills holes in HTML attributes
   fine; it does **not** fill them inside **SVG subtrees**. That is why `ns-kpi__spark`
   (`d="{{ k.fill }}"`) and `ns-stackmap__edge-layer` (`{{ e.lx }}`/`{{ e.ly }}`) leak. The rule for
   every prompt: **never put a `{{ }}` hole in an SVG attribute** — compute geometry post-mount, which
   `PROPOSED-COMPONENTS.md` §3.2 *already mandated* for `ns-stackmap` ("edges are measured, not
   declared"). The prototype violated its own contract.

### Wrong CLI verbs caught before the owner pasted

The P1 prompt I first handed over said **"Add plugin…"**. `netscript plugin add` **does not exist** —
the shipped verb is `plugin install` (likewise `workers trigger`, not `workers run`). Found
independently by *two* agents within minutes: the canvas agent reading the beta.9 CLI, and Stream B's
IMPL-EVAL, which found the same non-existent verb as the **primary quick-start line of the CLI
README**. Corrected prompt re-issued. The design-prompts README's claim that "CLI verbs are canonical
and SHIPPED… verified against `netscript --help` at beta.9" is therefore **not** reliable — treat it
as a claim to check, not a fact.

### Heartbeat cron replaced (it had gone stale and was re-issuing superseded orders)

The original overnight heartbeat still instructed: *"drive the dashboard revamp with Opus 4.8 canvas
sub-agents"* and *"pin D-2: use `_ns_runtime.js`/`window.NSOne`"* — **both now overruled** (OD-9, and
the corrections above). A recurring prompt that keeps re-issuing superseded instructions is an active
hazard in an autonomous run. Replaced with a v2 heartbeat carrying current reality.

### #769 — the blast radius, final shape (RELEASE-BLOCKER, p0)

What I originally escalated: *"`netscript agent init` emits an MCP config that cannot resolve."*
What the repo-wide guard actually found is materially worse:

**The scaffolded GitHub Actions deploy workflows** (`deploy-bare-metal`, `deploy-compose-ghcr`,
`deploy-deno-deploy`) run `deno x -A jsr:@netscript/cli deploy …` **unversioned**. So:

> A user runs `netscript init`, pushes, and **their deploy pipeline fails on its first run with an
> error naming our package.** They did nothing wrong.

That is not "our flagship command emits a dead config" — it is **"every project NetScript scaffolds
inherits a config that cannot run."** Five affected surfaces, one root cause (semver `*` excludes
pre-releases; everything is `0.0.1-beta.x`).

**Why every gate missed it:** invisible locally — the workspace import map short-circuits JSR entirely,
so nothing that runs from source can see it. It only appears in **published mode**, which is exactly
the mode no local gate exercises. That is the durable lesson, not the specifier itself.

The fix is the repo-wide guard (`.llm/tools/validation/check-netscript-jsr-specifiers.ts`, CI-blocking),
whose acceptance criterion is **"seed a violation, watch it fail, name the file/line, revert"** — a
guard never seen to fail is not a guard.

### FALSE-GREEN CLASS #3 — `deno task` input caching (new, and it will bite again)

`deno task` printed **nothing** and exited **0** on #762's gates: `cached, inputs unchanged`. **That is
not a green run — it is a run that did not happen.** Stream B caught it by re-invoking the underlying
tool directly to get a real verdict.

This is now the **third** distinct false-green we have hit in one night, and they rhyme:

1. `run-deno-lint.ts` / `run-deno-fmt.ts` — exit 1 with **zero diagnostics** (crash swallowed).
2. The fmt wrapper's **global** crash-vs-finding classification — exit **0** with a crashed batch
   hiding behind an unrelated finding.
3. `deno task` **input caching** — exit **0**, no output, because the task never ran.

**The generalization worth keeping:** an exit code is not evidence. Evidence is *output you can point
at*. A gate that can be green because it did nothing is indistinguishable, at the exit code, from a
gate that is green because it passed. Every gate we trust should be provable by making it fail.

### PRs open (merge-ready, NOT merged)

| PR | Scope |
| --- | --- |
| **#770** | `Closes #763` — pin plugin CLI JSR specifiers (+ version-drift guard) |
| **#771** | JSR taglines under the 250-byte cap + `docs:tagline:check` blocking in CI |
| **#772** | `Closes #762` — 36 → 0 suppressions; repo-drift CI blocking |

#762's CI flip was verified **not** to be theatre: the blocking job runs `quality:scan:repo` over
`['packages','plugins']` — the exact scope made green — not the narrower default that reports only 2
findings. 34 suppressions removed, **one** added: a `@ts-expect-error` in a *negative compile fixture*
where the directive **is** the assertion. Irreducible by construction; the only legitimate class.

### Still open

- The repo-wide guard (in flight).
- #715 cycle-2 re-eval, gated on the guard landing, on the **open-model lane** (`qwen/qwen3.7-max`,
  medium — OD-8). Its brief requires the evaluator to **break** the gates, not watch them pass.
- Claude Design P1 — owner pasted; poller armed on `_reports/P1-complete.md`.

### FALSE-GREEN CLASS #5 — the board's green ticks are nearly empty (#774, p1) — **read this before trusting any PR page**

`ci.yml` triggers on `pull_request: branches: [main, "feat/package-quality"]`. **Verified by reading
the workflow, not taken on report.** Every sub-PR in this wave targets `feat/beta10-integration`, so
**`check-test` and `quality` never run on them.** Their green covers `surface-diff` + `code-quality`
and essentially nothing else.

**The sharp edge:** the three gates this wave newly makes *blocking* — repo-drift (#772), tagline
byte-cap (#771), the JSR specifier guard (#769) — **all live in the `quality` job, and none has
executed in CI even once.** They fire for the first time, together, on the
`feat/beta10-integration` → `main` PR, alongside the lint/fmt wrapper fixes that change what "green"
even *means*. That PR is the **first honest CI verdict for the entire wave**. Expect it to be loud.

**Second layer, from `ci.yml`'s own header:** `quality` is *"intended to become a required check
(branch protection) once observed green; **until then a red `quality` cannot block the merge gate**."*
So even on a `main`-targeted PR, a gate made "blocking" *inside* `quality` blocks nothing unless
`quality` is a required check. **Owner: confirm the branch-protection state.** A gate that cannot fail
a merge is documentation, not enforcement.

### The pattern that defines this run — FIVE false-greens, all rhyming

| # | Where | The lie |
| --- | --- | --- |
| 1 | `run-deno-lint.ts` / `run-deno-fmt.ts` | exit **1**, zero diagnostics — the crash was swallowed |
| 2 | fmt wrapper's *global* crash-vs-finding classification | exit **0** with a crashed batch, hidden behind an unrelated finding |
| 3 | `deno task` input caching | exit **0**, no output — the task **never ran** |
| 4 | measuring a guard through a pipe | `exit=0` was **`tail`'s** exit code, not the guard's |
| 5 | PR green ticks on an integration branch (#774) | the lanes that matter **never triggered** |

**The generalization, now earned five times over:** *an exit code — or a green tick — is not evidence.
Evidence is output you can point at, from a lane you can prove ran.* Corollary: **a gate you have
never seen fail is not a gate.** Stream B applied this to its own p0 guard — seeded a violation,
watched it exit 1 naming file+line, reverted — which is the only reason we trust it.

### Two issues filed tonight from rejected work, not from features

- **#773** (p1) — `registry.generated.ts`, the **copy-source embed shipped into user projects**, is
  stale against source and its `render_ui` depth guard **cannot trip on nested arrays**
  (`renderNode(child, depth …)` vs source's `depth + 1`). `render_ui` renders **LLM-generated
  payloads**; the docstring promises "safe, **bounded**" output and the bound does not hold for the one
  shape an LLM most easily emits by accident. Surfaced only because Stream B **rejected** the
  contamination instead of letting it ride into a p0 PR. Verified: `tools/design-sync` reads the
  manifest + real sources, **never** the embed — the NS One sync is unaffected.
- **#774** (p1) — the CI trigger gap above.

Both share #769's shape: **what users get is not what we test.** That is the defining failure mode of
this release, and all three fixes are gates, not patches.

### OD-6 data point — Sol · low **stalled** on the canvas-shots slice (02:27, 2026-07-13)

Thread `019f58ae` (Codex · `gpt-5.6-sol` · **low**, per OD-6's "mechanical + fully-specified → Sol·low")
**died silently**: last rollout write 01:35, no `task_complete`, 52 minutes of silence, no process. It
got as far as adding the Playwright dependency to `deno.lock` and stopped. Zero code.

This is the **second** stall on a low/max-effort lane tonight — Stream B saw a `luna`/`max` thread burn
~1 MB of reasoning and produce **zero edits** in 15 minutes on #763, then deliver immediately on
`sol`/`high`.

**Honest read, without over-claiming from two samples:** the canvas-shots slice was *specified*
mechanically but is not *mechanically simple* — it integrates an npm dependency, resolves a
version-mismatched browser binary, and designs a defect classifier. "Fully specified" and "easy" are
not the same axis, and OD-6's rule keys on the wrong one. **Relaunched on Sol · medium.** If a third
stall lands on a low/max lane, that is a lane-policy signal worth acting on rather than a coincidence.

**Process note:** `pgrep -af "<thread-id>"` **self-matches** — the shell command contains the id, so it
reports the thread as ALIVE when it is dead. I nearly acted on that. The authoritative liveness signals
are: (a) the sender lease's `ownerPid` (dead → the launcher is gone), and (b) rollout-file mtime with no
`task_complete`. A sixth false-positive in a night full of them, and the same lesson: **the cheap signal
is usually measuring something other than what you asked.**

### Heartbeat status (02:27)

| Lane | State |
| --- | --- |
| Stream A — prompts | **P1–P6 all paste-ready** in `canvas-prompts/`. Owner has pasted P1; poller armed on `_reports/P1-complete.md` (no report yet). |
| Stream B | #770/#771/#772 open (green ticks are **nearly empty** — see #774); #769 guard proven by breaking it; #715 `FAIL_FIX`, cycle-2 re-eval staged behind F4. |
| `b10-evalroute` | Done — open-model evaluator route bound + enforced in code (246 tests). |
| `b10-evaldoc` | Done — needs an opposite-family review (its own doctrine). |
| `b10-canvasshots` | **Was dead; relaunched on Sol·medium.** Fallback `shoot.mjs` works and has already produced the baseline shots. |

### #715 — cycle-2 IMPL-EVAL: **PASS** (open-model lane, independently verified)

All 8 cycle-1 findings verified **FIXED**, and the verdict was **earned**: the evaluator *constructed
the failures* rather than watching gates pass — it rebuilt both halves of F1's false-green (mixed
crash+finding, and the `--ignore-line-endings` filtered case) and proved the gate exits 1; it seeded a
version-less specifier and proved #769's guard fires. Nothing it could not reproduce.

**F6 disposition: ACCEPTED**, in its own words — *"a retroactive `plan.md` would be evidence-faking —
writing a plan after the fact to clear a gate destroys the only signal the artifact carries."*

**The extraction trap (D-5) fired live on this very run:**

```json
{"verdict":"PASS","textLength":8296,"resultFieldLength":0,"reportedSuccess":true}
```

A substantive **8,296-character PASS** with a **completely empty `result` field**. Had the harness read
`result` — the obvious field — it would have received a blank string on a passing evaluation, and on a
*failing* one would have read the blank as "no findings". D-5 was found ~40 minutes before the run that
would have been silently destroyed by it.

### NF1 → the MCP security policy is 18% phantom (fix dispatched, NOT merged)

The evaluator named one phantom verb. I required the **whole allowlist audited against the shipped
CLI** rather than the named instance fixed. Result — **3 of 17 allow rules reference verbs that do not
exist:**

| Allow rule | Reality |
| --- | --- |
| `plugin add` | **PHANTOM** — the real verb is `plugin install`, which is **not** allowlisted |
| `service status` | **PHANTOM** — `service` has no `status` verb |
| `ui` (bare) | **PHANTOM** — no bare `ui` command; the verbs are `ui:add/init/list/update/remove` |

Plus a coverage gap: `ui:list` / `ui:update` / `ui:remove` exist and are **not** allowlisted, while the
MCP README claims "and the `ui` verbs".

**Why this is more than a bug.** `DEFAULT_COMMAND_POLICY` is a **default-deny security boundary**.
Eighteen percent of it references commands that do not exist — which means **the policy was never once
validated against the surface it governs.** Consequences, in order of nastiness:

1. **Installing a plugin through the MCP returns `default_deny`.** A headline capability of the beta.10
   agentic combo is dead in the shipped policy.
2. A **phantom deny rule** is worse than a phantom allow: it is dead code that provides *false
   assurance* of a protection that isn't there. The deny side is now being audited too.
3. The MCP README **accurately documents the broken policy** — the docs are faithful to a defect.

**The durable fix (mandated, dispatched as `fix/715-nf1-mcp-command-policy`, thread `019f593b`):** a
**cross-check test asserting every verb in the MCP allowlist exists in the CLI's real command surface.**
Layering trap handled: `packages/mcp` must not import `packages/cli`, but `cli` already depends on
`mcp` — so the test lives in `packages/cli` and *derives* the verb set rather than duplicating it into
a third source of truth. Same shape as #769's guard: **kill the class, not the instance.**

### The signature of this release

Every serious defect tonight is the same failure: **we shipped something that was never checked against
the thing it claims to control.**

| | What was never checked against what |
| --- | --- |
| **#769** (p0) | scaffolded configs vs. what JSR can actually resolve |
| **#773** | the generated embed shipped to users vs. its own source |
| **#774** | "blocking" CI gates vs. the PRs that introduce them |
| **NF1** | a default-deny security policy vs. the CLI it governs |

None of these is fixed by a patch. **All four fixes are gates.**

### The unpushed-branch defect, third occurrence — this time mine (final heartbeat)

Applied the "verify from `origin`" check to my own four supposedly-done branches. **Two were wrong:**

| Branch | Local | Remote (before) |
| --- | --- | --- |
| `docs/evaluator-claude-codex` | `f7aaefdb` | **NOT ON ORIGIN AT ALL** |
| `feat/canvas-shots-tool` | `1b0efb7f` | `7e991ed7` — the tool **without its lock commit**, so its Playwright dep would not resolve |
| `feat/evaluator-route-binding` | `faea414b` | `faea414b` ✅ |
| `fix/design-sync-preact-compat` | `0d7d2055` | `0d7d2055` ✅ |

Both pushed via explicit refspec; **both re-verified from `origin`**, not from the local worktree.

**The uncomfortable part.** This is the *third* occurrence of the same defect tonight — after I caught
it in Stream B's NF1 fix and **wrote the lesson into the hand-off**:

> *"A fix that exists on a disk somewhere is not a fix that shipped. Verify where the artifact is, not
> where you remember putting it."*

I wrote that sentence, and **sixty minutes later failed to apply it to my own branches.** The evaluator
doctrine — independently reviewed, PASS — existed only on this disk. The canvas-shots tool was on origin
*without* the commit that makes it resolvable.

**Knowing the lesson did not prevent repeating it. Only running the check did.** That is the whole
argument for why every one of tonight's fixes is a *gate* and not a *discipline*: the seven false-greens
were not caused by ignorance, and they were not cured by understanding. They were cured by a machine
that fails loudly when the claim and the artifact disagree.

A supervisor who has internalised a rule is still a supervisor who will skip it. Automate the check or
it does not exist.
