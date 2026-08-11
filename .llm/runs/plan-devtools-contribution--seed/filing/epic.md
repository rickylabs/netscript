# Epic filing draft — DevTools contribution architecture

> **DRAFT — not filed. No GitHub mutation has occurred.**

Run `plan-devtools-contribution--seed` · draft PR #1450 · baseline `main` @ `2256a67bf` ·
RFC `docs/architecture/rfc/rfc-0002-devtools-contribution.md`.

Every `gh` invocation behind this draft was a read. Nothing below creates, edits, closes, retitles,
re-milestones, labels, or comments on any issue or PR. Filing happens only after the owner ratifies
`decision-brief.md`.

---

## Filing metadata

| Field | Value |
| --- | --- |
| **Title** | `Epic: DevTools contribution architecture` |
| **Type** | `type:umbrella` |
| **Epic label** | `epic:devtools-contribution` — **DOES NOT EXIST** in `.github/labels.yml`. See *Label verification* below. |
| **Area** | `area:cli`, `area:plugins`, `area:fresh`, `area:tooling` |
| **Priority** | `priority:p2` |
| **Status** | `status:plan` (exactly one `status:`) |
| **Flags** | `rfc` |
| **Milestone** | **`MILESTONE: OWNER-DECISION`** — see *Milestone* below |
| **Closing keyword** | **none, anywhere** — an epic closes by hand once every child is done |

### Label verification (checked against `.github/labels.yml`)

Verified present: `type:umbrella`, `status:plan`, `priority:p2`, `area:cli`, `area:plugins`,
`area:fresh`, `area:tooling`, `rfc`, `epic:dev-dashboard`, `epic:frontend-contrib`.

**Not present — do not invent it.** There is no `epic:devtools`, `epic:devtools-contribution`, or
`epic:devtools-host` label in `.github/labels.yml`. Creating one is a board mutation the owner has
not authorized, and `netscript-pr` requires the label be added to `.github/labels.yml` *first*. Two
options, owner's call:

- **(a)** add `epic:devtools-contribution` to `.github/labels.yml` in this PR, then create it at
  filing time — keeps this epic's children distinguishable from #400's 28 `epic:dev-dashboard`
  children;
- **(b)** reuse the existing `epic:dev-dashboard`, accepting that the DevTools family and the
  Dev Dashboard tranche then share one epic label on the board.

Recommendation: **(a)**, because F-10 keeps #400 alive as a distinct artifact set and a shared slug
would re-fuse two boards the supersession map deliberately keeps apart.

### Milestone

`MILESTONE: OWNER-DECISION`. Stated plainly because the run cannot resolve it without ratifying a
fork:

- Per drift **D-8**, the `epic:dev-dashboard` children sit on **`0.0.15`** by the owner-ratified
  **2026-07-19 train** ("the dev dashboard ships after everything else"), and epic **#400 sits on
  `Backlog / Triage`** by that same comment plus Backlog/Triage's stated rule for umbrellas. That is
  deliberate placement, **not drift** — fork **F-9** recommends *no* re-milestoning.
- Applying the default in this brief ("new DevTools issues take the epic's milestone") therefore
  yields **`Backlog / Triage`** for this umbrella, matching #400's ratified placement, with the
  implementation children defaulting to **`0.0.15`**.
- The reason this is still owner-gated rather than settled: the supersession map's
  *Recommended milestone home* item 4 places only the **RFC tracking issue** on `0.0.6`
  ("RFC ratification"), and says nothing about a **new implementation epic**. Whether this epic is
  the `0.0.15` train's umbrella, or a `0.0.6` ratification artifact, or supersedes #400's umbrella
  slot entirely, is exactly the schedule question fork F-9 reserves to the owner.

**Recommended default if the owner does not rule otherwise: `Backlog / Triage`** (umbrella) with
children on `0.0.15`. Do not file until this is confirmed.

---

## Proposed issue body

<!-- everything below this line is the literal body text proposed for the epic -->

## Thesis

NetScript has no plugin→UI channel of any kind: a plugin cannot contribute a developer-facing
surface without a contributor hand-editing framework source, and three separate seams (#427, #890's
pointer axis, #734) already claim the one contribution axis. This epic implements
[RFC-0002](../architecture/rfc/rfc-0002-devtools-contribution.md): a **separate first-party DevTools
host process** — CLI-generated, own Vite process, own port, loopback-bound, structurally absent from
production builds — that hosts a versioned `{ family: 'devtools', major: 1 }` contribution family
over #890's pointer axis. v1 ships three kinds (`panel`, `link`, `diagnostic`), a host-owned closed
zone vocabulary with deterministic ordering, a transactional replace-set registry generator, and an
enumerated deny-by-default read contract with one-directional SSE. It is read-only by design, and it
duplicates nothing Aspire or Scalar already owns.

## Acceptance

Epic #400's three acceptance lines are inherited **verbatim** as the normative merge criteria for
every DevTools surface, first-party or contributed (RFC §11.1). Every child PR is checked against
them; this epic does not close until all three hold across the shipped surface set.

- [ ] **AC-1 — Non-duplication.** No DevTools screen renders, as an owned surface, an OTLP trace
      waterfall / span-bar gantt, a structured/console log tail, a metrics chart, a resource
      start/stop/restart panel, or an OpenAPI operation list / try-it console. Every merged panel
      passes **"why can't this just deep-link to Aspire/Scalar?"** with a NetScript-only answer
      recorded in its issue. Evidence: RFC §11.2's `DL?` column is the reviewer's test — a
      capability owned by Aspire or Scalar with `DL? = yes` cannot merge as an owned surface.
- [ ] **AC-2 — One generator, two callers.** Every DevTools mutation invokes the same contract route
      / CLI scaffolder the terminal does and renders its CLI-equivalent line (`netscript …`
      CodeBlock). No DevTools-only write paths, no forked codegen. (v1 is read-only per L8, so this
      line binds from the first staged action onward and is *not* satisfied vacuously.)
- [ ] **AC-3 — Flow ≠ waterfall.** The S13 flow surface renders a primitive-grouped causal chain
      with payloads at seams, assembled from NetScript's own seam events, joined on
      `netscript.correlation.id`. No span bars, no time-proportional gantt, no log tails in S13 —
      ever.
- [ ] **AC-4 — Every child is closed with its own gate green.** Each sub-issue's proving command
      (RFC §14) has run and its output is linked on the closing PR.

## Sub-issues

Filled with live issue numbers at filing time. One PR resolves each; each child body carries
`Part of #<this epic>` and each closing PR body carries `Closes #<child>`. This checklist is
progress tracking, not close-gate acceptance.

**Wave 0 — disposable probes (hard dependencies, not information).**

- [ ] `#___` **W0-a** — Probe: can a package ship island specifiers consumable under Deno
      resolution? Disposable branch; result recorded in `drift.md`.
- [ ] `#___` **W0-b** — Probe: second route/island root in one Vite process. Disposable branch.

**Wave 1 — contracts and preconditions.**

- [ ] `#___` **W1-a** — Contracts unit + gate wiring: `packages/devtools-core/` (Archetype 1) and
      **+2 `--root` entries on `deno.json`'s `arch:check`** (L13 — without this line every gate
      claim in the RFC is decorative).
- [ ] `#___` **W1-b** — Typed deep-link helper (`resolveDevToolsLink`), incl. a test asserting
      Aspire's `?filters=` is unrepresentable.
- [ ] `#___` **W1-c** — Containment invariant + generator scoping (INV-1 / INV-2, gates G-1/G-2).
- [ ] `#___` **W1-d** — Manifest schema-evolution precondition (drift D-6). **Blocked on fork F-3.**

**Wave 2 — generation and diagnosis.**

- [ ] `#___` **W2-a** — Transactional replace-set registry generator (stage → `deno check` → atomic
      swap; deterministic empty emission).
- [ ] `#___` **W2-b** — Doctor wiring + the five-state contribution taxonomy over the shipped
      `extraChecks` seam.

**Wave 3 — the host.**

- [ ] `#___` **W3-a** — CLI-generated DevTools host root + the `devtools` command group.
- [ ] `#___` **W3-b** — Dual production exclusion (structural absence **and** fail-safe
      `!== 'development'` refusal), gate G-5.

**Wave 4 — contribution kinds.**

- [ ] `#___` **W4-a** — `panel` kind: `UiNode` render, per-contribution error boundary, zero client
      code in the baseline case.
- [ ] `#___` **W4-b** — `link` kind wiring, incl. disabled-with-reason.

**Wave 5 — the data plane.**

- [ ] `#___` **W5-a** — DevTools read contract + in-process MCP; enumerated deny-by-default
      procedures, no URL/origin/host/path-shaped input anywhere.
- [ ] `#___` **W5-b** — SSE promotion (`createSSEStream` to `@netscript/fresh`'s public surface) +
      live feed. Consumer gate: `deno task publish:dry-run`.

**Wave 6 — first real consumers.**

- [ ] `#___` **W6-a** — Workers console: the first real consumer, proving the family end to end.
- [ ] `#___` **W6-b** — Sagas / triggers / streams consoles; **streams asserts the permanently
      degraded contract-provenance state** (it has no oRPC surface).

## Wave structure

```
W0 (probes, parallel, disposable)
  └─> W1-a (contracts + arch:check roots)
        ├─> W1-b ──────────────────────────────> W4-b
        ├─> W1-c ──┐
        └─ W1-d ───┤ (F-3 gated)
                   └─> W2-a ─> W2-b ─> W3-a ─> W3-b
                                        ├─> W4-a ─────> W6-a ─> W6-b
                                        └─> W5-a ─> W5-b ─┘
```

W0's outcomes change W4-a's *files*, not just its plan: if W0-a fails, package-shipped islands give
way to copy-mode. That is why the probes are first and deliberately cheap.

## Dependency notes

These are inherited sequencing constraints, not invented ones. A child that trips one of them is
blocked, not merely slower.

- **Forks F-1 and F-3 block Wave 1 and Wave 2 outright.** F-1 (depend on #890's unbuilt spine vs a
  self-contained family) determines the public package home, the import specifiers, emitter
  ownership, and whether #922 needs re-baselining — a consumer importing `@netscript/devtools-core`
  versus a shared spine is a **breaking change, not a refactor**. It blocks **W1-a**, and therefore
  everything downstream. F-3 (manifest schema-evolution precondition) blocks **W1-d** and every
  manifest-visible pointer, because `@netscript/plugin`'s manifest schema is `.strict()` — an older
  CLI **hard-rejects** an unknown block, contrary to #890's claim. Do not open W1-a or W1-d before
  the owner rules on both.
- **The RFC-A chain blocks credentialed access.** `createServiceClient` cannot send
  `Authorization` / `x-api-key`, and the unblocking chain includes an **unfiled** metadata child.
  Any panel needing a credential-bearing typed client waits; v1 is staged principal-less
  (RFC §8, D-6.9). This is outside this epic's control.
- **#1446's A2b / A3b / A2d block automation reads.** Anything reading runtime-automation state
  waits on those slices, per #1446's own P-6 entry criterion. #1446 is an **open draft**
  (`status:plan-eval`) — its backend decisions are quotable as a constraint, not as board authority.
- **Wave 6 is gated on W4-a and W5-a**, not merely scheduled after them: a console with no kind and
  no read contract has nothing to render.

## Relationship to existing boards

- **Epic #922 (frontend contribution layer) and its children are UNTOUCHED.** Per fork F-10 and
  supersession-map conflict C2: #933/#944 are **app-family zone panels** mounted into the scaffolded
  userland app's declared zones (`0.0.9`/`0.0.11`); #428–#431 are **DevTools-host console screens**
  inside the DevTools shell. Subject overlap (workers/sagas/triggers/streams UI) is real; artifact
  overlap is not. This epic states the boundary; it does not re-scope another epic's children. If
  the owner instead wants one epic to own all capability UI, that is an owner fork — it is not
  drafted here.
- **Epic #400 is reconciled, not replaced,** per
  `.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md` — the
  authority for every disposition, at issue and file level. Summary: #400 **AMEND** (its ownership
  thesis, three acceptance lines, and killed-surfaces list survive verbatim; the invent-your-own-
  discovery premise and the dead screen list do not) · #427 **FOLD** into this epic's family
  definition · #734 **FOLD and close** (its fat-manifest placement loses to #890's pointer axis;
  its requirement is absorbed) · #424 **SUPERSEDE** (the board's one recorded outright
  contradiction on the URL scheme; re-filed against this RFC's URL contract) · #507 **CLOSE-LATER** ·
  15 KEEP / 13 AMEND across the rest. The killed surfaces (#421 logs, #422 resource control) stay
  dead and are restated as non-goals so they cannot creep back.
- **`CR-DDX-HOSTAGNOSTIC`** — a real owner change request on #400 since 2026-07-06, arriving from
  epic #510, **never resolved**. This RFC resolves it by **accepting** it: host-neutral descriptor
  plus host-provided context. That un-dangles #544, whose body edit belongs to epic #510's lane, not
  this one.
- **RFC #890 is merged design text with zero implementation** (24 children open, none started).
  Its pointer axis is the ratified seam; its `design/examples/dashboard.md` contradicts its own
  ratified sibling-payload decision and must not be copied.

## Outstanding before this epic may be filed

**The charter-mandated GLM 5.2 xhigh design pass was NOT delivered (drift D-10).** It was not
skipped — it is **unlaunchable**: `openrouter-run.ts` applies its evaluator-model guard
unconditionally, and GLM is correctly absent from that allowlist, while the design preset
`claude-design-glm-5-2` is bound to `major_ui_ux_design` in the routing policy. Policy declares a
lane the execution surface cannot launch. Both failed transcripts are preserved as evidence.

Substitute design scrutiny was obtained from the stage-F reviewer and is **explicitly labelled as
not the mandated pass** (it produced the run's sharpest design finding: the IA answered "what
exists?" instead of "what is broken?"). No fallback is authorized, and nothing was relabelled as
GLM's output.

**This epic must not be filed until the owner rules on decision-brief items D-0a and D-0b** — accept
the RFC with substitute scrutiny, or hold stage H until the design lane works; and whether the
launcher gap is filed as its own issue. Risk **R12** stays open until then.

## Harness

- Run dir: `.llm/runs/plan-devtools-contribution--seed/`
- RFC: `docs/architecture/rfc/rfc-0002-devtools-contribution.md`
- Owner brief: `.llm/runs/plan-devtools-contribution--seed/decision-brief.md`
- Supersession map: `.llm/runs/plan-devtools-contribution--seed/design/T9-supersession/supersession-map.md`
- Seed PR: #1450 (draft for the whole run)

<!-- end of proposed body -->

---

## Drafting notes (not part of the issue body)

1. **No closing keyword appears anywhere above.** Per `netscript-pr`, an epic never carries
   `Closes`/`Fixes`/`Resolves`; it closes by hand once every child is done. Children carry
   `Part of #<epic>`; their PRs carry `Closes #<child>`.
2. **Acceptance vs progress.** Only the four AC lines sit under `## Acceptance` — that heading is
   what the close-gate reads. The 16-slice checklist sits under `## Sub-issues` precisely so it does
   not gate merge on any child PR.
3. **Slice-count conflict, flagged not fixed.** RFC §14's prose calls this a roadmap of "small
   coherent PR slices" and the orchestrator brief describes a **15-slice** roadmap, but §14's table
   contains **16** rows (W0-a, W0-b, W1-a…d, W2-a/b, W3-a/b, W4-a/b, W5-a/b, W6-a/b). This draft
   lists all 16. The RFC prose should be corrected, or one slice merged, before filing.
4. **New-epic vs #400 conflict, flagged not resolved.** The supersession map dispositions #400 as
   **AMEND** — i.e. #400 survives as a rewritten umbrella. Filing this as a *new* epic puts two
   `type:umbrella` issues on the DevTools board simultaneously. Either (a) this epic is filed and
   #400's amendment explicitly re-scopes #400 to the Dev-Dashboard screen tranche under this epic,
   or (b) #400 is amended *into* this epic and no new umbrella is filed. **OWNER-DECISION**; the
   RFC does not settle it and this draft does not assume it.
