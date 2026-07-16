# Drift — beta.10 orchestrator

## D-1 — `design:sync` converter cannot bundle the current fresh-ui registry (2026-07-13)

**Filed plan says:** the design-sync system is production-grade and idempotent against the fresh-ui
registry; the plan's Drift Watch anticipated "fresh-ui registry changes on main during the run", and
the risk register anticipated "registry→React conversion edge cases (signals-heavy islands)".

**Observed:** the very first `deno task design:sync` of this run fails hard:

```
conversion errors:
  ! mcp-ui-widget: unmapped preact value import "h" in islands/McpUiWidget.tsx
error: deno bundle failed: No matching export in "__ds/preact-compat.ts" for import "h"
```

The registry has since gained an `mcp-ui-widget` island that imports `h` from `preact` as a **value**
(not type-only). The converter's synthetic `preact-compat` shim
(`tools/design-sync/src/convert.ts:192`, `:334`) does not export `h`, so the emitted synthetic
package does not bundle. Stream A cannot seed the design system until this is fixed — the sync is the
gate on "Design generates against real, current components".

**Impact:** blocks Stream A slice "sync current registry into NS One". Does **not** block Stream B.
Does not change any locked decision (LD-1…LD-7 stand); it is a converter completeness gap, not a
design-direction change.

**Action (D-1):** dispatched as a WSL Codex implementation slice (`tools/design-sync/` is tier-2 repo
tooling, not framework source, but it is still code — the orchestrator coordinates, it does not
implement). Fix must (a) map `h` (and the rest of the preact value surface the registry actually
uses) in the compat shim, (b) not special-case a single component, and (c) re-run to green with the
parity + trap checks intact.

## D-2 — the platform's design-system context contradicts NS One's runtime contract (2026-07-13)

**Observed:** `get_claude_design_prompt(design_system_id=ec262e10…)` returns a
`<design-system-context>` block that instructs the canvas agent to:

```html
<script src="_ds/<folder>/_ds_bundle.js"></script>
```
```js
const { Button, Card } = window.NetScriptNSOne_ec262e;
```

NS One's own `README.md` — which the same response reproduces verbatim two paragraphs later, inside
`<design-system-guide>` — says the **opposite**, explicitly:

> Do NOT load `_ds_bundle.js` — that path is platform-generated (compiled from the .tsx sources; it
> has no ReactDOM and sets no window globals) and is not the prototype runtime.

The real contract is `_ns_runtime.js` → `window.React` / `window.ReactDOM` / `window.NSOne`, plus
`_ns_styles.css` for the style closure.

**Why it matters:** a canvas agent that follows the platform's generic instructions (the default
behaviour) loads a bundle with no ReactDOM that sets no window globals, and the prototype mounts
nothing. The failure is silent at author time and only shows at render. Both instructions arrive in
the same system prompt, so the agent must be told which one wins.

**Impact:** does not block the sync; it blocks *correct canvas output*. It is a foot-gun for every
future NS One prototype, not just this run's.

**Action:** the revamp brief must pin the runtime contract explicitly and override the platform
default (`_ns_runtime.js` / `window.NSOne`; never `_ds_bundle.js`). Add it to the trap checks the
plan already encodes (LD-7's "six traps") so it is enforced, not remembered. Candidate upstream
follow-up: NS One's README is already correct — the contradiction is on the platform side, so the
durable mitigation on our side is the brief + a render smoke that asserts `window.NSOne` is defined.

## D-3 — the sender-ownership lease has no daemon-restart recovery path (2026-07-13)

**Filed design:** `launch-codex-slice.ts` acquires a durable sender lease per worktree
(`~/.config/netscript-agentic/runtime/senders/<sha256(worktree)>.json`) so two `send-message-v2`
calls cannot fork rival agents over one git index. Once a thread id is published, a second launcher is
**blocked** and told to *resume* instead. That rule is correct and it did its job.

**The hole:** `decideSenderOwnership` computes `sessionActive: Boolean(existing.sessionId)`
(`launch-codex-slice.ts:380`). A recorded session id makes the lease **permanently blocking**,
independent of whether that thread still exists. But the sanctioned recovery — `codex exec resume` —
spawns a **standalone process the app-server daemon does not manage**: Desktop-sync only, never
mobile-visible (`codex-wsl-remote` § Launch model).

So after an app-server daemon restart (which kills in-flight threads — see worklog "Action 3a"), the
worktree is left in a state where:

- a fresh `send-message-v2` is **blocked** by the lease (stale session id), and
- the only permitted alternative, `resume`, **cannot restore mobile visibility**.

The operator's only exit is to release the lease by hand. Observed live: owner pid `7660` dead, thread
`019f5877…` dead with the old daemon, lease still `state: "active"` and blocking. Archived the record
to `slices/design-sync-preact-compat/stale-sender-lease.json` and released it.

**Impact:** operational, not correctness — but it silently costs mobile supervision, which is the
whole point of the WSL Codex lane. It cost this run one wasted turn: the resume "worked" (real edits
landed) while being invisible to the owner, which is the worst failure mode — it looks like success.

**Proposed fix (follow-up issue, not this run):** liveness must be *observed*, not inferred from the
presence of a session id. `sessionActive` should be derived from the thread actually being live —
e.g. the rollout's last record is not `task_complete` **and** the managed daemon still knows the
thread — so a lease whose thread died with its daemon classifies as `stale` and is reclaimable by the
existing `decision.kind === 'stale'` branch, which already exists and already does the right thing
(`await ownership.release(...)`). Additionally, `codex-resume.ts` should refuse (or loudly warn) when
the thread it is resuming is not registered with the current managed daemon, since that resume is
guaranteed to be invisible to mobile.

## D-1 resolution evidence — converter slice (2026-07-13)

The D-1 fix stayed within the approved `tools/design-sync/` boundary. The registry-wide value audit
found `h` and `createContext` from `preact`, six React-compatible hooks from `preact/hooks`, and
`useSignal` from `@preact/signals`; no `fresh-ui` source change was required. Conversion now fails
before bundle invocation for unmappable value imports, with component/unit, file, and symbol in the
diagnostic. The real bundle regression test and two unchanged-registry sync runs passed; the two
sync tree hashes matched exactly, and `design:sync check` reported parity green, all six trap checks
intact, and idempotence PASS. The new bundle test requires read/write/run permissions, so its gate
invocation is recorded as `deno test --allow-all tools/design-sync/` rather than the no-permission
bare command.

## D-4 — GLM 5.2 "reasoning unsupported" is a client gap, not a model gap (2026-07-13)

**Canary reports:** `capability_unsupported — "reasoning compatibility is unsupported; fan-out is
blocked"` for `claude-openrouter` / `z-ai/glm-5.2` / `xhigh`.

**That label is wrong.** The model and the transport both support reasoning; **Claude Code never
requests it.** Proven by isolating the layers (owner's hypothesis — "probably wrong params" — was the
right instinct; the answer is one layer up):

| Test | Result |
| --- | --- |
| OpenRouter **Anthropic-messages** skin (`POST /api/v1/messages`) + explicit `thinking:{type:enabled,budget_tokens:1500}` | **`thinking` block returned, 171 thinking tokens** ✅ |
| OpenRouter **chat/completions** + `reasoning:{enabled:true,effort:"high"}` | **reasoning returned, 231 reasoning tokens** ✅ |
| `claude -p --model z-ai/glm-5.2 --effort xhigh` (what the canary does) | 0 thinking blocks ❌ |
| …same + `MAX_THINKING_TOKENS=8000` | 0 thinking blocks ❌ |
| …same + Z.ai's documented alias (`ANTHROPIC_DEFAULT_OPUS_MODEL=z-ai/glm-5.2`, `--model opus`) — model resolves correctly to `z-ai/glm-5.2` | 0 thinking blocks ❌ |

Corroborating docs: OpenRouter's GLM 5.2 page states *"Reasoning efforts `high` and `xhigh` are
supported; `xhigh` maps to max reasoning"* — so our effort value is valid — and *"Use the `reasoning`
parameter in your request to **enable** reasoning"*, i.e. it is **opt-in**. The model's activity chart
shows 4.76B reasoning tokens in the wild, with Claude Code as its #2 app.

**Conclusions:**

1. Our config is **not** wrong: `OPENROUTER_ANTHROPIC_BASE_URL = https://openrouter.ai/api` correctly
   resolves `/v1/messages` (the extended-thinking endpoint), and `xhigh` is a supported effort.
2. **Claude Code does not emit a `thinking` block for a non-Anthropic model slug**, and exposes no
   env/flag we found that forces it. The reasoning capability is therefore unreachable *through this
   transport*, though fully available through the API.
3. The canary's diagnostic is **misleading and should be reworded**: `capability_unsupported`
   ("the model cannot") vs the truth, "the client did not request reasoning". As written it points a
   future engineer at the wrong layer. **Follow-up issue** — reword the diagnostic and, if we want
   observable GLM reasoning, add a direct-API verification path rather than routing it through
   `claude-print`.

**Impact on the design-verification pass: none that blocks it.** Tools and streaming both work, which
is what a single-turn verification needs. But the honest claim in any gate write-up is *"GLM 5.2,
tools+streaming, **no reasoning trace — the client does not request one**"* — never "GLM 5.2 · xhigh
reasoning". `effort: xhigh` on this preset is **inert** through Claude Code.

## D-1 review remediation — raw NUL source bytes (2026-07-13)

Orchestrator review found two raw `0x00` bytes in `tools/design-sync/mod.ts`. They were replaced by
the source escape ``\0`` without changing runtime delimiter semantics. The parent baseline also
contained two raw bytes, so `*.ts` now explicitly carries the Git `diff` attribute in addition to
its existing text/LF policy; this makes the repaired transition reviewable in ordinary Git stats.
Final evidence: source NUL count `0`, textual numstat `13/10`, full sync/parity/trap/idempotence gate
PASS, amended commit `0d7d2055507e35334096c7d7aa96b6e34f62da25` pushed only to the explicit
`fix/design-sync-preact-compat` ref.

The review brief predicted the idempotence hash would change, but it remained `f0714aeb10ab` on both
builds. This is expected from the requested equivalence: the parser evaluates raw NUL and ``\0`` to
the same runtime character. The exact bare test command also exposes a pre-existing command/fixture
permission mismatch (`NotCapable`); the accepted real-bundle test passes with `--allow-all` and was
not weakened to make the bare invocation appear green.

## D-4 — the brief's named "ratified IA" is two ratifications stale (2026-07-13, Stream A)

**Filed plan says:** the Stream-A design brief must embed, verbatim, the §IA of
`.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md`, and honour **LD-1** from
`.llm/runs/feat-dashboard-design-prototype--design/plan.md`: *full E2E breadth = shell + **7 panels** +
4 per-capability sections, light/dark*. The seven panels are Stack Map · Service Catalog + API Explorer ·
**Flow/Trace Waterfall** · Run Inspector · Plugin Control · **Logs** · **Resource Control**.

**Observed:** three of those seven panels were **killed by a later owner ratification**, and the panel
table itself was explicitly superseded. Two runs land between the plan and today:

1. **`dashboard-rescope--seed` (2026-07-06, owner: "yes to all, proceed" — 32 board mutations executed
   and verified live).** It closed **#421 (Logs panel)** and **#422 (Resource Control panel)** as *not
   planned*, and rewrote **#418** from "trace waterfall" to **"S13 Live Flow — causal seam chain"**. The
   rewritten epic #400 body carries the heading *"Authoritative screen set (**supersedes the pass-1 DDX
   panel list**)"* — S1–S13 — and three **acceptance lines that gate every slice**, of which line 1
   forbids, as an *owned* surface: an OTLP trace waterfall / span gantt, a log tail, a metrics chart, a
   resource start/stop panel, or an API try-it console; and line 3 says **"Flow ≠ waterfall … ever"**.
2. **`dashboard-design--orchestrator` (2026-07-12, umbrella PR #685).** Its `improvement-brief.md` is
   labelled *"owner axes, **binding for all passes**"* and restates the satellite doctrine as a standing
   constraint ("do not relitigate"). It also produced the **LOCKED routing hierarchy**
   (`analysis/routing-resort.md`), a v3 prompt set (`design-prompts/00–06`), and a **retire-list**:
   `ns-waterfall` and `ns-preview-tag` "are removed from the system — any screen that renders either is
   a defect".

**Why it matters:** LD-1's breadth clause, executed literally, produces three screens that are
**auto-reject surfaces under the epic's own acceptance lines**. The prototype would ship defects by
construction — and `PROPOSED-COMPONENTS.md` §3.1 (as it stood) specified `ns-waterfall` as a
*net-new component to build*, i.e. the stale plan had already propagated into the component contract.

**Action taken (authoring only — no canvas turn spent, no source touched):** the brief is authored
against the **newer owner-ratified authority**:

- IA = epic #400's authoritative screen set (S1–S13) + `/ai` + `/extensions`, on the locked route tree.
- The ratified proposal's **§9.1** (per-capability create→configure→monitor loop) and **§9.2**
  (`DashboardPanelContribution` seam vocabulary) are embedded **verbatim** — they were **not**
  superseded and remain live. Only **§3's 7-panel table** is marked superseded, with the pointer.
- `ns-waterfall` and `ns-preview-tag` are moved to a **Retired** section (drawing them is a defect);
  the flagship becomes `ns-journey` (causal seam chain); `ns-log-stream` (follow-mode tail) is rescoped
  to the bounded, out-linking `ns-logstrip`.
- **LD-2…LD-7 stand unchanged.** Only LD-1's breadth clause is affected.

**Not self-certified.** This reconciliation is **OQ-1** in
`resources/design/dashboard/OPEN-QUESTIONS.md`, marked BLOCKING: the orchestrator confirms the
authority chain before the first canvas turn. If the orchestrator instead wants LD-1 literally, that is
a rescope of the epic's acceptance lines, not a design-lane choice.

**Second-order:** the breadth also grew. The locked route tree is ~16 screen roots + ~22 entity/
sub-entity levels (light + dark), not 11 screens — LD-1's two-pass staging cannot hold it. A five-pass
staging is proposed in the brief §8 and is **OQ-2** (BLOCKING). And the component ask grew from DDX-0's
7 promoted blocks to **20 new units**, which is a #410 scope amendment (**OQ-10**) that should be filed
before the canvas draws components nobody has budgeted to implement.

## D-4 AMENDMENT — the missing reasoning is GLM-specific, NOT a blanket Claude Code gap (2026-07-13)

D-4 concluded that "Claude Code does not emit a `thinking` block for a non-Anthropic model slug".
**That generalization is wrong and I am correcting it before it becomes doctrine.** Smoke-tested the
other two open models on the *same* transport (`claude -p`, `ANTHROPIC_BASE_URL=https://openrouter.ai/api`):

| Model (via Claude Code + OpenRouter) | Responds | Thinking blocks |
| --- | --- | --- |
| `z-ai/glm-5.2` | yes | **0** |
| `minimax/minimax-m3` | yes | **1** |
| `qwen/qwen3.7-max` | yes | **1** |

So the transport *can* carry reasoning, and Claude Code *does* surface it for non-Anthropic slugs.
The zero-reasoning behaviour is specific to **GLM 5.2 over OpenRouter**, not to the client.

**Consequences:**

- The **evaluator lane** (OD-7a: Claude Code + OpenRouter, open model) gets a **real reasoning trace**
  on `minimax-m3` / `qwen3.7-max`. Reasoning is *not* nominal there — the earlier caveat I pushed into
  both agent briefs applies to **GLM only** and must be scoped down accordingly.
- The **design-verification lane** (GLM 5.2) genuinely has **no observable reasoning**; that half of
  D-4 stands. Never claim "GLM 5.2 · xhigh reasoning" as gate evidence.
- The canary's `reasoning: unsupported` diagnostic remains **misleading for GLM** (it says "the model
  cannot" when the truth is "this model+route yields none") and is simply **wrong as a general claim**.
  The follow-up issue should reword it per-model, not per-client.

Lesson: I inferred a client-wide rule from a single model's behaviour and stated it confidently. One
extra 90-second probe falsified it. Probe the second case before generalizing.

## D-5 — the evaluator lane returns an EMPTY verdict and reports SUCCESS (2026-07-13, 03:0x)

**The most dangerous finding of this run**, because it is *inside the mechanism that exists to catch
everything else*.

Dogfooding the newly-bound open-model evaluator lane (OD-7a) on the `b10-evaldoc` branch produced a
**1-byte verdict file**. I nearly recorded it as "no findings".

**What is actually happening.** `claude -p --model qwen/qwen3.7-max --output-format stream-json`:

```
tools used : ['Bash','Bash','Bash','Bash']   ← the lane genuinely works: real tool calls
is_error   : False
subtype    : success                          ← reports success
result     : ''                               ← EMPTY
```

The verdict **exists** — in the **assistant `text` content blocks**:

```
ASSISTANT text blocks : ['VERDICT: MD_ONLY']
result field          : ''
```

**Claude Code's `result` field is not populated on this model/transport.** A harness reading `result`
— the obvious, conventional field — receives an **empty string alongside `subtype: success` and
`is_error: false`.**

**The lane is sound; our extraction was wrong.** That distinction matters: the transport reasons,
drives tools, and renders a verdict. What fails is the assumption about *where the answer lives*.

**Why this is worse than every other false-green tonight:** an evaluator that returns nothing and
calls it a PASS **manufactures** the false confidence the generator≠evaluator rule exists to prevent.
Had Stream B run #715's cycle-2 re-eval naively, it would have received a blank verdict, read it as
"no findings", and cleared a `FAIL_FIX` PR on the strength of an empty page.

**Fixes (mandated to Stream B):**
1. Parse `assistant → message.content[].text`; **never** `result`.
2. **An empty evaluator output is a hard error, never a PASS.** This is the single most important
   assertion in the harness.
3. Assert the output contains an actual verdict token (`PASS` / `FAIL` / `FAIL_FIX`). A non-empty
   answer that renders no verdict is also a failure to evaluate.

**FALSE-GREEN #7.** The tally is now seven, and they are all one lesson:

> **An exit code, a `subtype: success`, or a green tick is not evidence. Evidence is output you can
> point at.** Assert on the **content**, never on the **status**. And a gate — or an evaluator — you
> have never seen **fail** is not a gate.
