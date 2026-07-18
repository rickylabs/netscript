# Plan: fresh-ui desktop components (#843)

## Run Metadata

| Field          | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g5-843-ui`                                             |
| Branch         | `feat/desktop-frontend-843-ui`                                                          |
| Phase          | `plan`                                                                                  |
| Target         | `packages/fresh-ui`, scaffold design-gallery consumer, and desktop frontend how-to docs |
| Archetype      | `4 - Public DSL / Builder`                                                              |
| Scope overlays | `frontend`                                                                              |

## Archetype

Archetype 4 is authoritative because `@netscript/fresh-ui` publishes a declarative component and
registry vocabulary. The native capability wrapper is an adapter-shaped implementation detail, not a
new package archetype. The frontend overlay adds accessibility, hydration, and real-browser proof.

## Current Doctrine Verdict

**Keep — confirm runtime registry shape.** Preserve the copy-source registry and generated embed;
add one explicit desktop collection/entrypoint without broadening the root barrel.

## Axioms in Play

| Axiom | Why it matters                                                                                |
| ----- | --------------------------------------------------------------------------------------------- |
| A2    | Browser/Aspire and desktop modes differ by capability, so feature detection must be explicit. |
| A5    | Host policy such as exit-on-quit must stay outside reusable components.                       |
| A6    | #841/#842 and Web Platform APIs are existing seams to compose, not recreate.                  |
| A8    | Stable public types and event vocabulary precede implementation.                              |
| A9    | L2 manifest metadata is authoritative registry data.                                          |
| A11   | Every desktop branch needs a deterministic web-mode test.                                     |
| A12   | JSR-doc and consumer-render evidence must accompany the new public surface.                   |

## Goal

Publish a browser-safe `@netscript/fresh-ui/desktop` surface plus L2 registry components for
tray/menu declarations, native dialogs and notifications, truthful window chrome, desktop gating,
and the #841 update-ready UX; demonstrate them in the generated design gallery and document the
NetScript desktop frontend composition path.

## Scope

- Add a documented `./desktop` export with local structural capability types, declarative menu/tray
  contracts, explicit active/disabled lifecycle results, event dispatch, native dialog/notification
  helpers, window actions, and cleanup.
- Add L2 `desktop-window-chrome` and `desktop-update-prompt` registry items plus a desktop-gated
  island; register them in a `desktop` collection and regenerate registry content.
- Consume `AutoUpdateReadyEvent` for exhaustive automatic/manual rendering and use #842's binding
  seam for desktop presence without ambient globals.
- Add deterministic package tests and a real scaffold design-gallery consumer that renders/no-ops in
  normal browser mode; regenerate CLI embedded assets.
- Add “Building a desktop frontend the NetScript way” to the docs navigation.

## Non-Scope

- Native desktop smoke, installer validation, and checking #843's #457 box.
- Minimize/maximize buttons: Deno's documented API does not supply those operations.
- A general desktop RPC contract or replacement for #842.
- Updater scheduling/download logic, already owned by #841.
- Existing `./interactive` JSR documentation debt or unrelated registry cardinality refactors.
- Publish, tag, release cut, merge, issue closure, or milestone closure.

## Hidden Scope

- The L2 consumer loop requires the scaffold design-gallery templates and regenerated embedded
  assets.
- CSS must use only `--ns-*` tokens/color mixing, declare parts/states, and honor reduced motion.
- Desktop globals need narrow injected structural seams so tests never depend on ambient Deno
  desktop types and web builds remain lint-clean.
- Documentation must show app-owned RPC contracts bound with `@netscript/fresh/desktop` and called
  with `@netscript/sdk/desktop`, rather than a fresh-ui transport abstraction.

## Locked Decisions

| ID | Decision                                                                                                                                                                           | Rationale                                                                                                       |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| D1 | Publish only from `@netscript/fresh-ui/desktop`; do not widen the root barrel.                                                                                                     | Keeps environment-specific code explicit and JSR-auditable.                                                     |
| D2 | `createDesktopChrome(options)` returns `DesktopChromeActive                                                                                                                        | DesktopChromeDisabled`; options accept a narrow injected capability for tests and otherwise detect`globalThis`. |
| D3 | Menu items are a discriminated declaration union and callbacks are keyed by action ID; tray/menu replacement is explicit.                                                          | Matches upstream semantics without leaking event-listener plumbing into consumers.                              |
| D4 | The controller exposes gated dialog, notification, title, show/hide/focus/close/reload, and `dispose`; it never exits the process.                                                 | Uses documented upstream operations and leaves policy to the host.                                              |
| D5 | There is no speculative port interface. The injected structural capability is a test seam; a second adapter would justify a port later.                                            | Avoids AP-2 and follows the adapter profile's one-implementation rule.                                          |
| D6 | `DesktopUpdatePrompt` consumes the #841 ready-event union directly: automatic says “Update ready — restart to apply”; manual renders a safe installer link from `manualUpdateUrl`. | Contract-first exhaustiveness prevents platform-string inference.                                               |
| D7 | Window chrome is visual/action-emitting and labels only documented actions; no fake minimize/maximize semantics.                                                                   | Prevents an attractive but nonfunctional API.                                                                   |
| D8 | Desktop gating checks #842's binding seam through local structural types; SSR and ordinary browser/Aspire output is null/disabled.                                                 | Reuses the merged contract and avoids ambient augmentation or `any`.                                            |
| D9 | L2 items remain self-contained and are proven through the scaffold design gallery, not a synthetic-only fixture.                                                                   | Satisfies the Fresh UI horizontal authority chain.                                                              |

## Open-Decision Sweep

| Decision                        | Status        | Notes                              |
| ------------------------------- | ------------- | ---------------------------------- |
| Public entrypoint and lifecycle | resolved now  | D1–D4                              |
| Port boundary                   | resolved now  | D5                                 |
| Update-ready content            | resolved now  | D6                                 |
| Window action set               | resolved now  | D7                                 |
| Registry/consumer integration   | resolved now  | D8–D9                              |
| Native desktop smoke outcome    | safe to defer | Owned by #457; never claimed here. |

## Risk Register

| Risk                                         | Mitigation                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Deno desktop API changes or partial globals  | Structural feature detection per capability; disabled result with reason; injected fakes.   |
| Web SSR invokes a native dialog/notification | Gate before every native call and cover absent/partial globals.                             |
| L2 item imports another L2 item              | Manifest/test assertion plus focused source review.                                         |
| Manual URL creates unsafe markup             | Render a normal escaped anchor and require the discriminated manual event.                  |
| Generated registry/CLI embeds drift          | Run the checked-in assets generator and require clean diff after regeneration.              |
| Existing JSR warnings obscure regressions    | Audit `./desktop` independently and compare package rubric output to the recorded baseline. |
| Gallery proof is mistaken for native smoke   | Label it browser/Aspire consumer evidence; keep #457 explicitly NOT_RUN.                    |

## Anti-Patterns to Resolve or Avoid

| AP                                  | Status | Plan                                                                    |
| ----------------------------------- | ------ | ----------------------------------------------------------------------- |
| AP-2 abstraction-first architecture | risk   | Use a structural injection seam, no port until a second adapter exists. |
| AP-4 barrel inflation               | risk   | Add explicit `./desktop` export only.                                   |
| AP-5 import-direction erosion       | risk   | Desktop entrypoint may consume SDK contracts; SDK never imports UI.     |
| AP-14 fake browser proof            | risk   | Exercise the scaffold design-gallery route in a real browser.           |
| AP-25 hidden runtime behavior       | risk   | No implicit exit, update start, RPC binding, or window creation.        |

## Fitness Gates

| Gate                              | Required | Expected evidence                                                |
| --------------------------------- | -------- | ---------------------------------------------------------------- |
| F-4 public type surface           | yes      | `deno doc --lint` scoped to `./desktop`, exported contract tests |
| F-7 browser-safe runtime boundary | yes      | SSR/web no-op tests plus design-gallery Playwright evidence      |
| F-9 registry integrity            | yes      | manifest/generated-content tests and clean generation diff       |
| F-12 dependency direction         | yes      | `arch:check` and focused import review                           |

## Arch-Debt Implications

| Entry                                     | Action | Notes                                                                                                                                                       |
| ----------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/architecture/doctrine/arch-debt.md` | none   | The plan introduces no known debt. Existing fresh-ui audit findings are bounded baseline; any regression blocks the slice rather than creating silent debt. |

## Validation Plan

| Order | Gate                  | Command or check                                                                                            | Expected result                                                                                 |
| ----- | --------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1     | focused tests         | `deno test -A packages/fresh-ui/tests/desktop packages/fresh-ui/tests/registry`                             | Full named directories pass; web/partial-global behavior and L2 manifest contract covered.      |
| 2     | consumer render       | `deno test -A packages/fresh-ui/tests/consumer-render.test.tsx`                                             | Published and copied desktop components render.                                                 |
| 3     | scoped check/lint/fmt | repo wrappers over `packages/fresh-ui` and changed CLI/docs TS/TSX                                          | No diagnostics or formatting drift in changed source.                                           |
| 4     | JSR rubric            | audit script plus `deno doc --lint` for `./desktop` and raw package dry-run                                 | New export has zero doc/private-type findings; package dry-run succeeds; baseline not worsened. |
| 5     | generated assets      | `deno task gen:assets-barrel` then clean generated diff check                                               | Fresh UI registry and CLI embeds are current.                                                   |
| 6     | slice quality         | `rtk proxy deno task quality:scan`                                                                          | PASS.                                                                                           |
| 7     | architecture          | `rtk proxy deno task arch:check`                                                                            | PASS.                                                                                           |
| 8     | browser consumer      | generate the scaffold consumer, start its browser/Aspire path, inspect `/design/components` with Playwright | Desktop examples render or intentionally no-op with no console/page errors.                     |
| 9     | scaffold regression   | `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                | Full runtime suite passes because scaffold assets changed; this is not native desktop smoke.    |
| 10    | native desktop smoke  | #457                                                                                                        | NOT_RUN / not claimed by this PR.                                                               |

## Dependencies

- Merged #841: `@netscript/sdk/auto-update`.
- Merged #842: `@netscript/fresh/desktop` and `@netscript/sdk/desktop`.
- Deno desktop tray/menu/dialog/notification/window APIs.
- Existing Fresh UI registry generator and CLI scaffold design gallery.

## Drift Watch

- Any need for ambient declarations, `any`, a new RPC protocol, undocumented window operations, or
  L2→L2 imports is architectural drift and requires Plan-Gate rescope.
- Record if the real consumer cannot be the scaffold design gallery or if generated assets require
  scope beyond the named CLI templates.
- Record any change to the current JSR baseline or doctrine verdict.
