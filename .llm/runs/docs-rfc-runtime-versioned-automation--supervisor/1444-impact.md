# #1444 impact memo — control-plane / runtime split for plugin modules

From: RFC orchestrator run `docs-rfc-runtime-versioned-automation--supervisor` (Fable 5,
2026-08-11). Audience: the #1443/#1444 orchestrator. Scope: the immediate normative answer plus the
compatibility constraints #1444 must honor so the runtime-versioned-automation RFC is not
foreclosed. This memo does not ask #1444 to build anything beyond its current slices.

## 1. Normative answer — the split is correct; keep it exactly this shape

The owner's D-10 decision in
`.llm/runs/orchestrator-1443-plugin-ai-next-canary--supervisor/drift.md` is **ratified from the RFC
side**:

```text
workers/plugin.ts (configured module)  -> manifest-only, import-safe CONTROL PLANE
workers/mod.ts, workers/runtime.ts     -> application/runtime surface (unchanged)
workers/runtime/**                     -> versioned operator-managed definitions (unchanged)
```

Rationale the RFC will elaborate: a configured plugin manifest is _inventory metadata_ the control
plane (CLI, `generate runtime-schemas`, doctor, future cockpit/management API) must read **without a
running stack** — no DB, no Aspire env, no producers. Runtime initialization belongs to the barrel
the app imports. Every credible external analogue (K8s CRD vs controller, Terraform provider schema
vs apply, VS Code extension manifest vs activation) makes the same split: **declaration loads cold;
activation runs hot.** The legacy `netscript-start` design conflated the two, which is one of the
reasons its cockpit could not be made production-safe.

## 2. Child-process loader — required, keep it

Verdict: **the child-process loader remains required**, not a workaround. In-process `import()` from
the CLI cannot honor the _consumer's_ import map / compiler options; only a child
`deno run
--config <project>/deno.json` resolves the module the way the consumer's own runtime will.
`clearEnv:
true` is load-bearing: it is the executable proof of the "loads under empty environment"
contract — do not weaken it. The stdout marker-line protocol + JSON-serialized manifests is fine.

## 3. Compatibility constraints #1444 must honor now

C1. **Import-safety is a contract, not a convention.** The shared all-first-party contract test
(D-10 "required proof") must pin: empty env, exactly one exported `PluginManifest`, no runtime
construction at module scope. Keep it parameterized so future plugins are covered by default.

C2. **Manifests stay data.** The child protocol serializes manifests over JSON. Never add function
or class fields to `PluginManifest`; future capability declarations (e.g. "this plugin owns a
versioned runtime tree at `workers/runtime/**`") must be declarative fields. The RFC will likely add
such fields — see C3.

C3. **Leave the manifest schema additively extensible.** `manifest.ts` is `.strict()`. Strict is
fine for now, but version the schema (or reserve an optional namespaced extension field) so an older
CLI meeting a newer plugin manifest fails with a _versioned_ error, not a generic Zod strip/throw.
The RFC will propose `runtime` capability metadata on the manifest; #1444 does not need to add it —
it only needs to not make adding it a breaking change.

C4. **Do not couple identity to hardcoded names.** Installed-plugin identity must follow the
configured module's exported manifest (S5 direction is right). The accepted registered-spec set
(`plugins/<name>/plugin.ts`, `<name>/plugin.ts`, plus legacy `mod.ts` forms) is the migration bridge
for existing consumers — keep accepting the legacy `mod.ts` registration until a deprecation cycle
is declared, and surface a doctor hint instead of a hard failure when the configured module is
`mod.ts`-shaped.

C5. **`deno.jsonc` gap (flag, fix cheaply or record).** The loader branches on
`readOptionalTextFile(join(projectRoot, 'deno.json')) === null` → falls back to in-process
resolution. A consumer with `deno.jsonc` (valid for Deno) silently loses consumer-config resolution
and will get the old failure mode. Either probe both filenames or record it as a known limitation +
doctor check. (Scaffolded projects emit `deno.json`, so this is an edge, not a blocker.)

C6. **`generate runtime-schemas` stays control-plane-only.** It must depend on manifests + schema
metadata only — never on importing `mod.ts`/`runtime.ts` or on live services. That is what un-breaks
#1445 for every plugin and is a boundary the RFC will build on (schema generation for
operator-managed versioned documents will extend this path).

C7. **Do not touch `workers/runtime/**` / `triggers/runtime/**` semantics.** Preserved exactly as
scaffolded today, including the `current` pointer + versioned JSON documents consumed by
`@netscript/runtime-config`. The redesign (atomic promotion, DB/object-store sync, multi-instance
propagation, sandboxing, RBAC, cockpit) is this RFC's scope, not #1444's.

C8. **Permission surface of the child loader.** `--allow-read --allow-net` with `clearEnv` is
acceptable today (net is needed for cold jsr resolution). Note in the PR body that the loader
executes consumer-controlled code with network access at _control-plane_ time; the RFC's threat
model will formalize this (lockfile-pinned resolution, `--cached-only` fast path, and a future
capability prompt are candidate hardenings). No action required in #1444 beyond the note.

## 4. What #1444 must not absorb

Per D-10's scope boundary: no versioned-tree redesign, no cockpit work, no DB synchronization, no
sandbox/RBAC design, no static-config collapse, no deletion/neutering of runtime surfaces to green a
gate. Anything in that list discovered mid-slice: record it and hand it to this RFC run.

— End of memo. Full RFC (with evidence-backed legacy/current matrix) follows in
`rfcs/0000-runtime-versioned-automation.md` on branch `docs/rfc-runtime-versioned-automation`.
