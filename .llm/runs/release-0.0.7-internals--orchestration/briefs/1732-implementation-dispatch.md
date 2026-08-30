use harness

## SKILL

Load `netscript-harness`, `netscript-doctrine`, `netscript-cli`, `netscript-tools`,
`netscript-deno-toolchain`, `netscript-pr`, and `rtk`. Read `.llm/harness/gates/static-gates.md`.

# Brief — #1732 background reference-name validation / source safety

## Standing

Branch `fix/aspire-reference-name-validation`, worktree `/home/agent/projects/netscript/worktrees/007-leaf-1732`, base `13878a80a50c55b9662099fed64555f2310ae4a3` (current `main`).
Issue **#1732**, p1, milestone `0.0.7`.

## The defect, already reproduced — do not re-derive it

`ServiceReferences` / `PluginReferences` are `z.array(z.string())` at `packages/aspire/config.ts`
around line 466, with **no pattern constraint**. Names are interpolated raw into generated AppHost
TypeScript, so a quote, backslash, or backtick produces unparseable source:

- `ServiceReferences: ["it's"]` → emitted `_services.get('it's')` and identifier `it'sEndpoint` → `SyntaxError: Expected ')'`
- `["back\\slash"]` → `Expected unicode escape`

The same raw interpolation applies to the **processor name** in `addExecutable('${name}', …)` and to
the emitted env key. Confirmed pre-existing; PR #1728 escaped only the *error message*.

## The decision you must make explicitly — do not make it silently

Acceptance box 1 offers two routes: **lock the grammar at the config parse boundary**, or **use a
source-safe representation with an explicit compatibility decision**. They are not equivalent:

- **Grammar lock** rejects names at parse. Deterministic and simple, but it is a **public
  configuration contract change**: an `appsettings.json` that works today can start failing. That
  needs a stated compatibility position, not an assumption.
- **Source-safe emission** (`JSON.stringify` every interpolated literal, plus a
  guaranteed-valid identifier derivation) breaks nothing and handles any name, but leaves genuinely
  odd names working.

Research finding to save you time: **there is no existing name-validation convention in
`packages/aspire` or `packages/cli`** — no `z.string().regex`, no name pattern anywhere. So there is
no precedent to follow, and whatever you choose sets one.

**Research first, then stop and report your recommendation before implementing** if the grammar you
propose would reject any name that Aspire itself accepts, or any name a current scaffold can
produce. That is the case where this stops being mechanical and needs a plan gate. Otherwise proceed
under the narrowed policy with `PLAN-EVAL: N/A` recorded and a stated rationale.

Check what Aspire/DCP actually accepts for a resource name before proposing a grammar — a rule
stricter than the platform's is a self-inflicted breaking change.

## Required tests — RED first

Cover, for **both** reference kinds **and** the processor name: single quote, backslash, backtick,
hyphen, underscore, and an ordinary name. Record the failing output before implementing.

- Invalid names must fail **deterministically before source generation**, identifying the processor,
  the reference kind, and the rejected name.
- **Hyphenated names must keep working** and must preserve the raw `services__<ref>__http__0` key
  contract exactly — that key shape was runtime-verified in #1371 and must not move.
- Generated AppHost source must remain parseable for every accepted name.

## Gates — static only

**No runtime lease.** Do not start Aspire, Docker, a browser, `scaffold.runtime`, or `e2e:cli`.
Focused test and check over changed files; `deno task check`; `deno task test`; `deno task lint`;
`deno task fmt:check`; `quality:scan` (**`allowCount` stays 7**); `arch:check`; and
`check:assets-barrel` with canonical regeneration only if a generated asset moves.

## Delivery

Slice commits with RED visible; atomic clean explicit push; **draft PR** with `Closes #1732`, labels
`type:fix`, `area:cli`, `area:aspire`, `priority:p1`, exactly one `status:` label, milestone
`0.0.7`, and a DoD checklist. **Leave it draft** — marking it ready is this repo's IMPL-EVAL
dispatch trigger.

**Every receipt at the final pushed head, and quote SHAs exactly as `git log` prints them** — a
prior leaf in this lane cited two commit SHAs whose first nine characters were right and whose
remaining thirty-one were invented. Copy, do not retype.

## Bounds

Input-name validation and source safety only. Do **not** widen into #1728's resolved fail-fast
behaviour, #1365, apps registration, or `packages/sdk`. Do not merge, flip readiness, close the
issue, publish, take a runtime lease, or self-certify.

---

## Dispatch addendum (supervisor, at launch)

### Resolved standing

- Worktree `/home/agent/projects/netscript/worktrees/007-leaf-1732`, already created, clean, branch
  `fix/aspire-reference-name-validation` at **`13878a80a50c55b9662099fed64555f2310ae4a3`** — the live
  `main`, re-fetched at dispatch. Old `/home/codex/repos/...` paths no longer exist.
- The branch has **no upstream by design**. Push only with an explicit refspec:
  `git push origin HEAD:refs/heads/fix/aspire-reference-name-validation`. Never a bare `git push`.
- No PR exists yet — you open it, as a **draft**.

### The defect surface is live at this base — I checked, so you needn't re-derive it

- `packages/aspire/config.ts:466-467` — `ServiceReferences` / `PluginReferences` are
  `z.array(z.string()).optional()` with **no pattern constraint**.
- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts:424`
  interpolates a name raw into a **single-quoted TypeScript string literal**:
  `builder.addExecutable('${name}', …)`. Line 388 derives an identifier from `${id}` the same way.
- There is still **no `z.string().regex` anywhere in `packages/aspire` or `packages/cli`** — zero
  hits at this base. The "no existing name-validation convention" finding holds, so whatever you
  choose sets the precedent. That is exactly why the compatibility decision is explicit and not
  yours to make silently.

### One label caveat, so you do not trip over it

Issue #1732 is currently labelled `status:triage`. **Leave it alone** — relabelling is outside this
lane's authority and is not part of your slice. Label your **PR** correctly per the brief; the issue
label is someone else's to move.

### Host conditions — read this before you run any gate

This machine currently carries roughly **7,700 PID-1-owned zombie processes** that no agent can
reap. They exhaust per-process file descriptors and PID slots.

- **Do not run the full root `deno task test`.** It is not a usable signal here right now: two
  `.llm/tools/agentic/**` modules (`codex-follow_test`, `hybrid-launcher_test`) fail from host
  resource exhaustion, not from anyone's code. Running it again only adds load.
- Prove your change with **focused** gates over your changed files, plus `deno task check`,
  `deno task lint`, `deno task fmt:check`, `quality:scan` (**`allowCount` stays 7**), and
  `arch:check`.
- If a gate does go red for host reasons, **record it red with the evidence** and say plainly that it
  is outside your scope diff. Do not report it green, and **do not stop or kill any process you did
  not start** — other lanes are running on this host.

### Receipt discipline

- Every receipt **at the final pushed head**. An exit code from an intermediate commit is not
  evidence for the head you ask to be evaluated.
- **Quote SHAs exactly as `git log` prints them — copy, never retype.** A leaf in this lane cited two
  SHAs whose first nine characters were right and whose remaining thirty-one were invented; it cost a
  Tier-A finding and a public correction table.
- A command that did not fire is **NOT FIRED**, not a pass. An empty-selection wrapper exit is a
  refusal, not a green.
- Prefer the structured wrappers (`.llm/tools/run-deno-check.ts`, `run-deno-test.ts`,
  `run-deno-lint.ts`, `run-deno-fmt.ts`); wrap `deno task` runs in `rtk proxy`.

### Report back

In your run-dir `worklog.md`: the final head, **which of the two routes you chose and why**, what you
found Aspire/DCP actually accepts as a resource name, whether any currently-scaffoldable name would
be rejected by your rule, the full gate table, and anything you deliberately did not touch.
