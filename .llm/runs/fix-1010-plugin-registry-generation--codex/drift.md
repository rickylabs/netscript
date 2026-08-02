# Drift Log — fix-1010-plugin-registry-generation--codex

## 2026-08-02 — owner waiver — supervisor evaluates rebase follow-up

The existing owner waiver applies to this rebase slice: the supervisor performs evaluation. This
session writes a plan and proceeds directly without launching an evaluator or changing
`plan-eval.md`.

## 2026-08-02 — expected generated conflict — regenerated from merged sources

Rebasing onto `origin/main@8b69d78f0` produced only the predicted conflict in
`packages/cli/src/kernel/assets/skills.generated.ts`. No side was selected and the generated file
was not hand-edited. `gen:assets-barrel` rebuilt it from main's expanded 0.0.3 skill sources plus
the branch's authoritative registry guidance; `check:assets-barrel` then passed. No non-generated
conflict appeared.

## 2026-08-02 — owner waiver — supervisor evaluates AI follow-up

The owner explicitly waived the open-model Plan-Gate for the AI chat-route follow-up and assigned
PLAN-EVAL/IMPL-EVAL to the supervisor. No evaluator tool is launched and no `plan-eval.md` is
fabricated or changed by this implementation session.

## 2026-08-02 — correction — AI tool survived; manifest admitted scaffold factory

The leading hypothesis included the possibility that authoritative regeneration dropped
`e2e-tool`. Reproduction refuted that branch: the generated registry imported `e2e-tool.ts` and
`echo.ts`, then failed on `skill-loader.ts`. The plugin compiler's default target excludes that
factory, but manifest-driven generation correctly uses the manifest target, whose exclusion list
had drifted. The fix aligns the published manifest with the existing canonical compiler target.

No public TypeScript export or `deno.json` entry changed. JSR review therefore stayed scoped to the
published `scaffold.runtime.json` asset; the plugin-specific publish dry-run included that asset and
completed successfully.

## 2026-08-01 — minor — sync context mechanism narrowed

The issue suspected that plugin sync loaded project configuration in the CLI context. Current source
already loads `netscript.config.ts` in a child Deno process with the project's `deno.json` and cwd.
The clean-room failure occurs afterward when `ModuleManifestResolver` dynamically imports configured
project modules in the parent CLI process, where the project's bare `zod` import is unavailable. The
plan therefore removes that duplicate sync analysis path by delegating sync to authoritative,
project-rooted runtime generation.

## 2026-08-01 — process override — PR lifecycle retained by owner

The user explicitly prohibited opening or pushing the PR. Local commits and run artifacts remain the
commit trail; draft-PR creation, per-slice pushes, and PR comments are intentionally omitted.

## 2026-08-01 — blocked evaluator launch — authentication

The first `claude-print` launch reached the native endpoint because the bare wrapper did not receive
the OpenRouter profile environment and returned `model_not_found` before evaluating. The canonical
live canary then reported `status=blocked`, `credential=absent`, diagnostic `auth_required` for
profile `claude-openrouter`, model `qwen/qwen3.7-max`, effort `high`. Closed-model substitution is
prohibited. OpenHands cannot be used without violating the owner's no-PR/no-upstream constraint.
PLAN-EVAL therefore has no verdict and the implementation hard stop remains active pending an
owner-authorized waiver or evaluator credential availability.

## 2026-08-01 — minor — unrelated full-runtime service health timeout

The required one-pass `scaffold.runtime` run passed 44 gates, including installed plugin generation,
generated-workspace checking, workers/sagas/triggers process readiness, and worker registry behavior.
Only `behavior.service-health` failed after 117796ms; `cleanup.aspire-stop` passed. This users-service
health timeout is outside registry generation/sync context and occurred after every registry-specific
gate had passed. Per the slice constraint, it is recorded without widening the diff or rerunning the
expensive one-pass command.

## 2026-08-01 — correction — canonical trigger registry exposed a latent manifest defect

The prior implementation made the canonical trigger registry authoritative, exposing that the
published manifest treated scaffold-only `triggers/runtime.ts` as a trigger. Before the PR, the
canonical registry was absent and the runtime silently fell back to the `triggers/mod.ts` barrel,
so webhook behavior passed accidentally. The fix keeps invalid trigger modules loud, excludes only
the known scaffold glue, and makes local-source scaffolds consume the workspace manifest before the
published fallback.

This changes the previous slice plan's published-only manifest resolution to workspace-first
resolution with the published path retained as fallback. The deviation is necessary because a
repository manifest fix otherwise cannot affect local-source CI until after a release is published.

## 2026-08-01 — test strategy deviation — integration suite replaced

The existing integration test was replaced instead of extended. It asserted emitted source text
only and used `{ id: "generic" }` as its trigger fixture, which is not a valid
`TriggerDefinition` because it lacks `kind` and `handler`. It therefore could not detect a generated
registry that throws during import. The replacement executes the real generators and imports the
resulting workers, sagas, and triggers registry modules before asserting resolved entries.

## 2026-08-01 — tooling incident — duplicate broad checks terminated

The broad check exceeded the command wrapper's first yield. Three recovery attempts unintentionally
started identical read-only checks without retaining their process session ids. Those duplicates
were terminated; one clean invocation was then run through its retained session to completion and
exited 0. No source, cache, or lockfile mutation resulted.

## 2026-08-02 — correction — workspace-first must include declared members

The first workspace-first resolver considered only local import-map values. The retained scaffold
proves that local plugin ownership is also expressed through `workspace: ["./plugins/*"]`: AI is a
local member without an `@netscript/plugin-ai` import, whereas workers and triggers happen to have
local runtime imports. Consequently the generic resolver is widened to declared workspace members,
still requiring an exact package `name` and retaining the published fallback. This corrects the
resolution model without adding an AI-specific identity or changing the loud registry validation.

## 2026-08-02 — correction — AI diagnostic attached to wrong gate

The prior diagnostic slice accidentally put the AI failure hint on durable CLI parity. Capture and
the hint are moved to `behavior.ai-chat-route`, with a gate-definition regression guarding their
placement. The behavior gate assertions themselves are unchanged.

## 2026-08-02 — integration method — merge replaces rebase

This follow-up explicitly requires merging current main to avoid replaying already-pushed history.
The only conflict was the forecast generated skills barrel; it was regenerated from merged sources.
No non-generated conflict or public-surface reconciliation occurred.

The prior request's local runtime pass was superseded mid-run and is not evidence. The new owner
instruction makes cloud runtime authoritative and prohibits another local pass. Three stopped
containers owned by the aborted run were removed by exact ID; foreign `fix-1025` containers were
preserved.

## 2026-08-02 — structural fix plus marked source authority

The published 0.0.2 generator cannot contain code authored in this PR, so changing only the AI
compiler would leave pre-release local-source CI executing stale JSR code. The scaffold already
records its originating checkout in `.netscript-source-root`; the adapter now treats an exact-name
package in that declared source workspace as authoritative before JSR. This is not an AI/name
special case, and a regression proves an unrelated source package cannot shadow a third-party
plugin.

Correctness also moves away from filename exclusions: the AI compiler selects tool modules by the
`AiToolDefinition` export shape before emission. The manifest exclusion remains an efficient
published convention, while the shape predicate prevents the next factory module from recreating
the failure. The emitted module's loud guard remains for post-generation shape drift.
