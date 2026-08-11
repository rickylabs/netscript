# [devtools W1-b] Typed deep-link helper (`resolveDevToolsLink`)

> **DRAFT — not filed. No GitHub mutation has occurred.**

**Title:** `[devtools W1-b] Typed deep-link helper`

| Field | Value |
| --- | --- |
| Labels | `type:feat`, `area:plugins`, `priority:p2`, `status:plan`, `epic:dev-dashboard` |
| Milestone | `0.0.15` |

All labels verified present in `.github/labels.yml` and live.

Part of #<epic>

## Context

RFC-0002 §11 fixes the Aspire / Scalar / DevTools boundary (**L10**) as an evidence-backed table
that states **which capabilities are actually deep-linkable**, with deep-link grammars verified from
Aspire's own `.razor` sources. §11 also records an honest degradation: filtered Aspire views are
**not** deep-linkable. This slice turns that grammar into a typed helper so panels out-link instead
of duplicating Aspire's UI.

## Scope

Files / roots, verbatim from RFC-0002 §14:

- `packages/devtools-core/contracts/v1/links.ts`

Introduces (verbatim): `DevToolsLink`, `resolveDevToolsLink()`.

## Out of scope

- Rendering the `link` kind in the host — that is W4-b.
- Any embedding of Aspire or Scalar UI (RFC-0002 §11 non-duplication boundary; `plan.md` Non-Scope).
- Contribute-into-Scalar, which is **declined**, not deferred (fork F-17, RFC-0002 §15.3).
- Hardcoding any base URL.

## Acceptance

- [ ] `packages/devtools-core/contracts/v1/links.ts` exports `DevToolsLink` and
      `resolveDevToolsLink()` with an explicit return type.
- [ ] Unit tests cover the Aspire and Scalar grammars documented in RFC-0002 §11, **including a
      case asserting `?filters=` is unrepresentable** (RFC-0002 §14 proving gate, verbatim).
- [ ] A test asserts the link base is read from config and **never hardcoded** (RFC-0002 §14).
- [ ] `deno test` for the new tests exits 0, and `deno doc --lint packages/devtools-core/mod.ts`
      stays clean (no slow types introduced).
- [ ] Every exported symbol carries a JSDoc one-liner and the helper carries a worked `@example`
      (RFC-0002 §13.2 symbol-docs row).

## Dependencies

- Depends on: **W1-a** (RFC-0002 §14).
- Blocks: **W4-b** (`link` kind wiring).
