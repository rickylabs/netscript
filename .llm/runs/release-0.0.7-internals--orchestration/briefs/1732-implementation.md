use harness

## SKILL

Load `netscript-harness`, `netscript-doctrine`, `netscript-cli`, `netscript-tools`,
`netscript-deno-toolchain`, `netscript-pr`, and `rtk`. Read `.llm/harness/gates/static-gates.md`.

# Brief — #1732 background reference-name validation / source safety

## Standing

Branch `fix/aspire-reference-name-validation`, worktree `<WORKTREE>`, base `<BASE>` (main).
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
