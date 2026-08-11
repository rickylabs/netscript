# Stage-D2 adjudication — Qwen 3.8 Max architecture pass

Lane: `openrouter/qwen/qwen3.8-max`, variant `max`, read-only worktree `ns-devtools-d2-qwen`,
findings-only. Owner route override, drift **D-15**; lane split, **D-16**. Advisory design
evidence — **not** a Plan-Gate verdict.

Reviewer verdict: **`DESIGN-FINDINGS: 1 critical, 5 major, 5 minor`**.

**Every finding dispositioned; every anchor verified in source before acceptance.**

| # | Sev | Finding | Disposition |
| - | --- | ------- | ----------- |
| **Q-C1** | **critical** | **The trust antecedent is contradicted by the RFC's own pipeline.** §9 claimed contributions are workspace packages "the developer already runs"; §10 pins `source = {kind:'jsr'}` and emits `import('jsr:@acme/plugin-trace@1.4.2/…')`, §6's worked example is `@acme/plugin-crons`, and §6 states the generator **imports the pointed-to export in-process** | **ACCEPTED — fixed, and it changed the design.** Verified all four anchors. The antecedent was **false**: third-party code both exists (JSR install) and executes (in-process generator import). §9 now splits it — the decline survives for **panel rendering** (a `UiNode` *data* tree; no contributed code reaches the browser in v1) and **does not survive** for generate-time import. Added **T-10** (the unmodelled execution surface), **INV-9** (read the envelope without executing contributor code in-process — static parse or scoped subprocess), and **G-10**. The restated justification is narrower and true: *installing a plugin already grants server code and a whole-filesystem scaffolder before DevTools exists; DevTools inherits that decision rather than making it* |
| **Q-M1** | major | **Two conflicting fully-qualified id formats** — anchors keyed `'<pluginKind>/<contributionId>'`, identity produces `<mountId>/<id>/v<apiMajor>`. **Anchors could never match** | **ACCEPTED — fixed.** This was a live bug in **my own** ordering rule: the anchor tier was silently dead, so tab order would have quietly fallen through to `(order, mountId, id)` with no signal. Anchors now use the identity form, and an anchor matching no contribution is a **generate-time warning**, never a silent no-op |
| **Q-M2** | major | **Home's "ranked problem feed" is a half-propagated relabel** — no ranking rule, no row schema, and two of six problem classes uncomputable in v1 | **ACCEPTED — substantially fixed** by §11.3.1 (added in the Kimi pass), which supplies the source set, per-source status, and the `all-clear`/`partial` rule. **Ranking rule and row schema remain open** and fold into the state-contract amendment. Qwen and Kimi found this independently from opposite directions — the strongest signal in either pass |
| **Q-M3** | major | **`DevToolsUiNode` cannot express the named v1 flagship** — string-only table cells, so the Workers console's per-row trace deep-link is unrepresentable | **ACCEPTED — already fixed** in the Kimi pass (cells are now `DevToolsCell` nodes). **Independent confirmation from a second lane**, which is why it is recorded here rather than merged away |
| **Q-M4** | major | **Zone contract versioning is specified but never applied** — descriptor says `'devtools.capability.panel/v1'`, the actual vocabulary has no suffix, and zone context types are comment-only `unknown` | **ACCEPTED — deferred** to the state-and-DX amendment. It shares a root with the panel-state and data-access items; patching versioning alone would leave the context types untyped, which is the more damaging half |
| **Q-M5** | major | **The state matrix omits `not-running`** — the adopted launcher design requires it, and only the Plugins row handles "no AppHost running" | **ACCEPTED — deferred** to the same amendment. Kimi's K-M3 is the same defect seen from the panel side; they merge |
| **Q-m1** | minor | **Identity-unification leftovers** — `DevToolsPanelId` referenced but **never defined**, plus pre-fix wording in four normative places | **ACCEPTED — fixed.** Another leftover from **my** identity fix. Removed the undefined type. This is now the second time a "complete" sweep of mine left residue that a reviewer found |
| **Q-m2** | minor | §5 H-2 lists a `traces/` host route §11 drops and AC-1 forbids | **ACCEPTED — already fixed** in the Kimi pass. Second independent confirmation |
| **Q-m3** | minor | **"8 trigger kinds" is wrong** — the canonical set is six | **ACCEPTED — fixed, verified at source.** `packages/plugin-triggers-core/src/domain/constants.ts:5-29` — `TRIGGER_RUNTIME_KINDS` (3) + `TRIGGER_RESERVED_KINDS` (3) = **6**. A plain factual error in a worked example, caught by a reviewer actually opening the file |
| **Q-m4** | minor | **The closed zone vocabulary has no home for the RFC's own worked third-party contributor** — `@acme/plugin-crons` has no zone to mount into | **ACCEPTED — deferred**, and sharp: it exposes that the closed vocabulary is currently sized for *first-party primitives only*. Folds into the zone-versioning amendment, where the answer is either a generic `plugin.detail` mount or an extension path for third-party kinds |
| **Q-m5** | minor | **The supersession map keeps `plugin-dashboard-core` alive** beside the new `packages/devtools-core` | **ACCEPTED — deferred to stage-H filing.** The map is draft text and #412's disposition changes with fork **F-1**; editing it before F-1 is ratified would bake in an unratified answer |

## Cross-lane confirmation

Three findings were reported **independently by both lanes** — the string-only table, the `traces/`
route contradiction, and the under-specified ranked feed. Independent convergence from an
architecture reviewer and a UX reviewer who could not see each other's output is the strongest
evidence either pass produced, and it is why the owner's lane split was worth the second run.

## What this pass says about my own work

Two of Qwen's findings — the dead anchor tier and the undefined `DevToolsPanelId` — are **residue
from my own identity-unification fix**, the one I reported as complete and backed with a cross-file
search returning zero. That search proved *the absence of the patterns I chose to search for*, not
the presence of consistency. An undefined type and an anchor format nothing emits do not match
`${string}/${string}/v${number}`.

**This is the second time a sweep of mine was reported clean and wasn't.** The lesson is concrete: a
grep sweep is a necessary check and never a sufficient one — type-level consistency needs a reader
who follows the references, which is exactly what these lanes did.

## Deferred, tracked, not dropped

Q-M4, Q-M5, Q-m4 join Kimi's K-M2/K-M3/K-M4/K-M5 in a **single state-and-DX amendment pass**: one
panel-state contract, typed zone contexts, a worked data-access example, and the ranking/row schema.
They share one root, and splitting them would produce a third vocabulary — the exact failure
PLAN-EVAL cycle 2 caught with identity and ordering.
