# Plan — plugin-runtime-wiring (#959, #962, #961)

## 1. The shared cause

**The generator holds the whole install decision and emits artefacts that carry only part of it.**

Every one of these three issues is the same shape: at generation time the CLI *knows* the answer —
which instance name, which package id, which KV backend, which cache backend — and the artefact it
writes does not encode that answer where the runtime will look for it.

| Issue | What the generator knew | What it emitted | Where the runtime looked |
| --- | --- | --- | --- |
| #959 | instance name ≠ package id | package refs under one name, samples under another, manifest under a third | doctor / registry / config, which disagree |
| #962 | Redis was selected as the KV backend | a runtime entrypoint with no adapter import | `@netscript/kv/redis` side-effect registration |
| #961 | a cache backend was selected | a scaffold with no cache import | `@netscript/sdk/cache` side-effect registration |

And the check that should have caught it — `plugin sync` — validates against the **root import map**
while Deno resolves through **workspace members**. It is checking a different graph from the one
that runs, so it rejects valid imports and accepts invalid glue. That is why #959 cost Fable ~90
minutes: a validator that disagrees with its own runtime gives the developer no reason to suspect
the validator.

The fix is therefore one thing, not three: **make backend/identity selection a value that flows
into emission, and make the validator resolve through the graph Deno actually uses.**

## 2. The contract change

Three surfaces change meaning. Each must be stated explicitly in the PR body.

**(a) Plugin identity becomes two fields, not one.** `--instance-name` (mutable, user-chosen, the
workspace directory and the runtime registry key) is separated from the immutable plugin package
id. Today they are conflated, which is what produces `plugin-rehearsal-worker` references beside
`workers/` samples. After this change every writer — package refs, `netscript.config.ts` manifest,
runtime registry, samples path — derives from the same identity record, and `remove` deletes
exactly the identity `install` created.

**(b) Install and remove become transactional.** A partial failure must not leave a half identity.
Either every writer commits or none does. This is what stops ghost workspaces from accumulating,
and it means the doctor's own invariants can be run *before* install reports success.

**(c) `plugin sync` validation resolves through workspace members.** The set of specifiers
`plugin sync` accepts widens to whatever Deno resolves. This is a strict relaxation for existing
workspaces — nothing that passes today starts failing — but it is a real change in what the
command *means*: it now answers "will this resolve at runtime?" rather than "is this in the root
import map?".

**(d) Selected backends become emitted imports.** When install selects Redis KV, the generated
runtime entrypoint carries `import "@netscript/kv/redis";`. When the scaffold selects a cache
backend, it carries `import "@netscript/sdk/cache";`. And the `setCacheProvider` error is brought
up to the standard the KV error already sets at `packages/kv/application/shared.ts:223` — it names
the exact import to add. The good version already exists in this codebase; this is levelling one
error up to another, not inventing a pattern.

## 3. Compatibility story for existing workspaces

- **Existing installs keep working.** Where instance name and package id happen to be equal today
  (the common case — installs under the official name), the split is a no-op and the derived paths
  are byte-identical.
- **Half-identities already on disk** must not become hard errors. The doctor should *report* them
  as repairable and say what to run; install/remove must not crash when it meets a manifest entry
  with no matching workspace, or a workspace with no matching manifest entry. Detect, name, offer
  the repair — do not throw.
- **`plugin sync` only relaxes.** Any specifier accepted today is still accepted.
- **Adding a side-effect import to generated files is additive** and idempotent — regeneration over
  a workspace that already has the import must not duplicate it.
- No existing configuration key changes name or type. If the identity split needs a new field in
  `netscript.config.ts`, it is optional with the package id as default, so an untouched config
  still parses.

## 4. Required regression guard

Not one guard — the fix has three observable consequences and each needs its own failing test.
All three must be proven *fails-before*: break the fix, watch the guard fail, restore it, watch it
pass. Report that evidence in the PR body.

1. **Identity round-trip.** Install under a non-default `--instance-name`, assert that every
   writer (package refs, manifest, registry, samples path) names the same identity, remove it, and
   assert nothing is left behind — no orphan manifest entry, no ghost workspace. This must fail
   before the fix, since today removal leaves the manifest entry.
2. **Emission carries the selection.** Given an install that selects the Redis KV backend, the
   generated runtime entrypoint contains the `@netscript/kv/redis` import; given a scaffold with a
   cache backend, it contains `@netscript/sdk/cache`. Assert on emitted content, not on a flag —
   a test that only checks the option was recorded proves nothing about the artefact.
3. **Validator agrees with the resolver.** A specifier that resolves through a workspace member but
   is absent from the root import map must be accepted by `plugin sync`. This is the guard that
   directly encodes the ~90-minute finding, and it is the one most worth having.

A fourth, cheap and worth it: assert the `setCacheProvider` error message contains the literal
`@netscript/sdk/cache`, so the error can never silently regress to not naming its fix.

## 5. Gate evidence

Root `deno task lint` / `fmt:check` exclude `packages/cli` by their own exclude regex, and this
slice changes `packages/cli` and `packages/sdk`. Gate evidence MUST be re-run scoped per package:

```
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root packages/cli --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
```

(and the same for `packages/sdk`, plus any other package actually touched). A green root wrapper is
not evidence for these files.

## 6. Verify the framing first

Assume each issue is wrong in some way — every round-one fix agent found its issue understated or
misframed, and one described a component that did not exist. Before fixing, confirm against the
code: that `plugin sync` really validates against the root import map, that the identity really is
conflated rather than merely mis-derived in one writer, and that the scaffold really omits the
cache import rather than emitting it under a condition that never fires. Where an issue is wrong,
correct it with `gh issue comment` on the issue — not only in the PR body.
