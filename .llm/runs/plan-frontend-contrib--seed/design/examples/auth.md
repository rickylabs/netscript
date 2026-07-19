# Worked example — Auth UI (draft, rev 2)

> **Draft — design document only.** Rev 2 integrates adversarial finding S-13: rev 1 designed an
> org/member console against `auth.org.*` procedures that **do not exist** in the v1 auth
> contract. The v1 example now uses only the real backend surface; org management is explicitly
> a future capability with a named backend prerequisite.

## Today

Mature backend, zero frontend. The **complete** v1 auth contract is five procedures:
`signin`, `callback`, `signout`, `session`, `me`
(`packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:410-459`). Session claims are a
generic claims record (`:74-88`) — no typed `orgId`. Adapters: better-auth (org/admin as
*backend* better-auth plugins — no NetScript contract surface yet), workos, kv-oauth. No `.tsx`
anywhere.

## Contribution declaration (v1 — real surface only)

```ts
// plugins/auth/frontend/mod.ts
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  contract: { family: 'app', major: 1 },
  pluginKind: 'auth',
  base: '/auth',
  routes: [
    // LIVE: the signed-in account page — session + profile + sign-out. Driven entirely by
    // session/me/signout.
    { kind: 'route', id: 'account', path: '/account', module: './routes/account.tsx' },
  ],
  islands: [{ kind: 'island', id: 'session-menu', module: './islands/SessionMenu.tsx' }],
  zones: [
    // Session widget in the app topbar the moment auth is installed: SSRs signed-in/out state
    // from the principal port; SessionMenu island provides the dropdown + sign-out action.
    { kind: 'zone', id: 'session', zone: 'app.topbar.end', module: './components/SessionWidget.tsx' },
  ],
  requires: { procedures: ['auth.session', 'auth.me', 'auth.signout'] },
});
```

## The sign-in page is a SCAFFOLDED STARTER (unchanged from rev 1)

Sign-in is the page every product restyles; auth ships it as a starter resource
(`05-scaffolding-and-cli.md §3`):

```
netscript plugin resource add auth signin --app .
  → routes/auth/signin.tsx     (app-owned; drives signin → provider redirect)
  → routes/auth/callback.tsx   (redirect landing → callback procedure)
```

Both generated files call only the real contract (`signin`/`callback`); styling is app tokens;
`plugin update` reports drift, never overwrites. **Starter scope law (S-13):** starters compose
existing backend procedures — a starter never fabricates backend functionality.

## What a live page looks like (account, v1)

```tsx
// plugins/auth/frontend/routes/account.tsx
import { definePluginPage } from '@netscript/fresh/plugins';
import { createAuthClient } from '@netscript/plugin-auth/contracts/v1';

export default definePluginPage(async (ctx) => {
  if (!ctx.host.principal) return ctx.redirect('/auth/signin');
  const client = createAuthClient(ctx.host.serviceUrl('auth-api'));
  const me = await client.me();
  return ( /* profile card + session facts + <SessionMenu client={ctx.client}/> */ );
});
```

## Org/member management — future capability, named prerequisite

The org console rev 1 sketched requires backend surface that must ship first: an
**`auth-org` capability** — versioned procedures (org get/list, members list/invite/remove,
role set) defined in `plugin-auth-core/contracts` and implemented per adapter (better-auth
`organization` plugin; workos organizations; kv-oauth: not supported → capability absent). Once
that contract exists, the frontend story is the one rev 1 showed: live routes `/auth/org`,
`/auth/org/members`, a `MemberTable` island, nav entry, **capability-degraded per adapter** via
`ctx.client.capabilities` — one frontend across all adapters, no sniffing. The frontend
contribution layer needs nothing new for it; it waits only on the backend contract. (This
sequencing is recorded as consumer-roadmap input, not part of the v1 dogfood.)

## After `netscript plugin install @netscript/plugin-auth`

`/auth/account` serves; the session widget appears at `app.topbar.end`; typed ref
`routes.plugins.auth.account.href()`. Sign-in appears when the user opts into the starter.
Nothing app-owned changed.
