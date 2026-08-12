use harness

# Slice W2-H — package-backed plugin doctor truth (#1454)

**PLAN FIRST. Do not implement until PLAN-EVAL returns PASS.** Two phases; you stop between them.

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-w2-1454` |
| Branch | `fix/1454-plugin-doctor-package-backed` |
| Base | `origin/main@3c9dc1f39` |
| Route | Codex · OpenAI · GPT-5.6 Sol · **high** (`complex_implementation`) |
| Slice dir | `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/slices/w2-h-1454/` |
| PLAN-EVAL | **REQUIRED** — doctor semantics plus the shape of a new expensive gate |
| IMPL-EVAL | Normal automatic on draft → ready. Do not request a waiver. |

**Read `/home/codex/repos/netscript-006-fixes/.llm/runs/release-0.0.6-fixes--orchestration/context-pack.md` first.**

## SKILL

- `netscript-harness` · `netscript-cli` (**canonical on plugin install/doctor, the E2E suites, and
  what each gate proves**) · `netscript-doctrine` (**required before changing anything under
  `packages/**` or `plugins/**`** — archetype, public surface, gates, debt) · `netscript-tools` ·
  `netscript-pr` · `rtk`

## The defect

Found migrating a real consumer (EIS-Chat) to published NetScript 0.0.5 packages. `plugin doctor`
**conflates a direct in-process package installation with a conventional local plugin workdir**, and
published workers/streams manifests do not carry enough effective permission metadata for doctor to
validate the generated runtime.

The consequence is the part that matters: **the consumer is pushed to create fake `workers/` and
`streams/` directories and duplicate framework permission declarations purely to satisfy
diagnostics.** A tool that makes users fabricate structure to keep it quiet is reporting on the
fabrication, not the system.

This is a remaining gap after #1022, not a fresh regression.

## Expected behaviour (from the issue)

- Doctor distinguishes **package-backed / in-process** manifests from **local-workdir** plugins.
- A missing local plugin directory is **not** a defect when the configured plugin resolves from JSR.
- Workers/streams diagnostics validate the **effective generated registry and runtime permissions
  contributed by the published package**.
- A clean generated consumer using only published manifests has a truthful doctor result — **no fake
  directories, no duplicated metadata**.

## Why PLAN-EVAL is required

Three open design questions, none answered by the issue:

1. **How doctor determines package-backed vs local-workdir.** Manifest field? Resolution source?
   Presence of a JSR specifier? This is a semantic decision affecting a user-facing diagnostic.
2. **What permission metadata published packages must carry** for doctor to validate the effective
   runtime — and whether supplying it changes the published manifest surface, which is a public
   surface question and therefore a doctrine question.
3. **The shape of a new scaffold E2E** over published workers + streams packages. The issue requires
   one. It is a **new expensive gate**, and this repo has just spent a milestone learning that gates
   which cannot fail, or which report clean while doing nothing, are worse than no gate. Its
   negative case must be designed, not bolted on.

## Phase 1 — deliverable: a plan, and nothing else

Write `slices/w2-h-1454/plan.md` covering:

1. **Current behaviour, cited by file and line** — where doctor decides a plugin is a local workdir,
   and where workers/streams diagnostics read permissions.
2. **Your proposed discriminator** for package-backed vs local-workdir, and why it is robust rather
   than heuristic. State what happens for a plugin that is *both* configured from JSR and has a
   local directory.
3. **The permission-metadata answer**, explicitly flagging whether it changes any published manifest
   surface. If it does, name the doctrine implication — `netscript-doctrine` governs public surface,
   and this is exactly the kind of change that must be identified before it is written.
4. **The E2E design**, including **its negative case**: what break makes it fail, and how you will
   demonstrate that red before relying on it. A gate whose failure mode you have not executed is not
   a gate — that is the single most-repeated finding of this milestone.
5. **Cost and placement of that E2E.** `scaffold.runtime` is serialised and currently contended by
   five active lanes; a new expensive suite has a real scheduling cost. Say where yours belongs and
   roughly what it costs.
6. **What you will not do** — no fake directories in fixtures to make diagnostics pass, no widening
   of a check to make it quiet.

Then **push the branch, open a draft PR carrying the plan, and stop.** Report back. The orchestrator
applies the automatic PLAN-EVAL labels; you do not. Do not implement until the verdict is PASS and
the orchestrator says proceed.

## Phase 2 — implementation, only after PLAN-EVAL PASS

#1454 carries **no acceptance checkboxes**, so state acceptance explicitly in the PR body — for a
box-less issue `close-gate` reduces to the PR-body checklist with no issue-side cross-check. At
minimum:

- [ ] Doctor distinguishes package-backed/in-process manifests from local-workdir plugins
- [ ] A missing local plugin directory is not reported as a defect when the plugin resolves from JSR
- [ ] Workers/streams diagnostics validate the effective generated registry and runtime permissions
      from the published package
- [ ] A clean generated consumer using only published manifests gets a truthful doctor result and a
      correct exit code, with **no fake directories and no duplicated metadata**
- [ ] A scaffold E2E covers published workers + streams, generated registries, permission metadata,
      and doctor output/exit code
- [ ] The E2E's negative case is **demonstrated red** before it is trusted

## Gates

```
rtk proxy deno task check · test · lint · fmt:check
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
rtk proxy deno task quality:gate      # REQUIRED — packages/** and plugins/**
```

**`scaffold.runtime` is serialised across five active lanes. Ask the orchestrator before taking it.**
Your slice is the only one in this wave expected to need it, so you will most likely get it — but
ask, and expect to wait. Three concurrent runs in 0.0.4 produced two failures that were contention
rather than defects, and this lane has seen the same gate produce a non-verdict three different ways.

## Hazards

- **Do not add `deno-lint-ignore` / `as unknown as` / `@ts-ignore`.** `quality:gate` will not
  necessarily catch one (#1403, #1564); the orchestrator's diff scan will, and on #1539 that scan was
  the only thing in the pipeline that did.
- **Restore every deliberate break** used to demonstrate the negative case, and prove it — diff your
  fixtures against `origin/main` before committing.
- `deno fmt` rewraps and can silently undo a scripted edit — verify after formatting.
- **Do not commit `deno.lock`**; never `deno cache --reload`.
- Push via explicit refspec. Re-sync against `main` before draft → ready. Do not re-draft after ready.

## Deliverables

**Phase 1:** `plan.md`, a draft PR carrying it, a report back. Then stop.
**Phase 2 (after PASS):** the fix, `evidence.md` with untruncated gate output and the E2E negative
case shown red → green, `Closes #1454` in the PR **body**, labels
`type:fix`/`area:plugins`/`area:tooling`/`priority:p1`/one `status:`, milestone `0.0.6`, explicit
acceptance checklist, `acceptance-evidence` with **`box-index:`** keys. **Do not merge.**
