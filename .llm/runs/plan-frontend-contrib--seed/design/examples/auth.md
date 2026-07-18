# Worked example — Auth UI (draft)

> **Draft — design document only.** Demonstrates BOTH delivery models on one plugin.

## Today

Mature backend, zero frontend: oRPC `signin/callback/signout/session/me`
(`packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:437-459`); better-auth adapter with
`organization/admin` plugins (`packages/auth-better-auth/src/better-auth.ts:56,132-138`); workos
(`organizationId`) and kv-oauth adapters. No `.tsx` in any auth package.

## Contribution declaration

```ts
// plugins/auth/frontend/mod.ts
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  contract: 'v1',
  plugin: 'auth',
  base: '/auth',
  routes: [
    // LIVE: the plugin owns account/org management — ships and evolves with the package.
    { kind: 'route', id: 'account', path: '/account', module: './routes/account.tsx' },
    {
      kind: 'route',
      id: 'org',
      path: '/org',
      module: './routes/org.tsx',
      nav: { label: 'Organization', icon: 'users', group: 'main' },
    },
    { kind: 'route', id: 'org-members', path: '/org/members', module: './routes/org/members.tsx' },
  ],
  islands: [
    { kind: 'island', id: 'session-menu', module: './islands/SessionMenu.tsx' },
    { kind: 'island', id: 'member-table', module: './islands/MemberTable.tsx' },
  ],
  zones: [
    // Session widget appears in the app topbar the moment auth is installed.
    { kind: 'zone', id: 'session', zone: 'app.topbar.end', module: './components/SessionWidget.tsx' },
  ],
  requires: { procedures: ['auth.session', 'auth.me', 'auth.signout', 'auth.org.*'] },
});
```

```ts
// plugins/auth/src/public/mod.ts — one added builder call
.withFrontend({ export: './frontend', framework: 'fresh', contract: 'v1' })
```

## The sign-in page is a SCAFFOLDED STARTER, not a live route

Sign-in is the page every product restyles — brand, copy, layout. Serving it live would fight the
user; so auth ships it as a starter resource through the existing scaffolder engine
(`05-scaffolding-and-cli.md §3`):

```
netscript plugin resource add auth signin --app .
  → routes/auth/signin.tsx        (app-owned from now on; posts to the auth contract)
  → routes/auth/callback.tsx      (provider redirect landing — kv-oauth handleCallback / better-auth)
```

The generated `signin.tsx` is ordinary app code: fresh-ui-token styling, typed
`createAuthClient(...)` calls against `signin`/`callback` — the user edits it freely; `plugin
update` reports drift, never overwrites (`ui registry` posture).

**Rule of thumb applied:** user-owned surface (sign-in) → scaffolded; plugin-owned surface
(org/member console, session widget) → live.

## What a page looks like (live org console)

```tsx
// plugins/auth/frontend/routes/org/members.tsx
import { definePluginPage } from '@netscript/plugin-frontend-core';
import { createAuthClient } from '@netscript/plugin-auth/contracts/v1';
import { MemberTable } from '../../islands/MemberTable.tsx';

export default definePluginPage(async (ctx) => {
  if (!ctx.host.session) return ctx.redirect('/auth/signin');   // starter page, if scaffolded
  const client = createAuthClient(ctx.host.serviceUrl('auth-api'));
  const members = await client.org.members({ org: ctx.host.session.orgId });
  return <MemberTable initial={members} />;   // island refreshes via pluginApi('auth') proxy
});
```

`SessionWidget` (zone component) SSRs the signed-in state from `ctx.host.session` (populated by
the auth middleware the plugin's service wiring already provides) and imports `SessionMenu`
island for the dropdown/sign-out action.

## What appears in the app after `netscript plugin install @netscript/plugin-auth`

- `/auth/org`, `/auth/org/members`, `/auth/account` serve (typed refs:
  `routes.plugins.auth.org.href()`).
- "Organization" appears in the topbar nav; the session widget appears at `app.topbar.end`.
- Nothing app-owned changed. Sign-in appears only when the user opts into the starter.

## Adapter note

Org/member management renders capability-degraded per backend: better-auth `organization` plugin
and workos organizations expose management procedures; kv-oauth has none → the org routes render
the empty-capability state (procedure presence is discoverable through the auth contract, not
sniffed in UI code). This keeps one frontend across all three adapters — harmonized-ports law.
