# `@netscript/plugin-frontend-core` — API reference

The contract package for the frontend contribution layer. It holds **serializable types, schemas,
and the `defineFrontend` validator only** — no Fresh, no Preact, no runtime helpers. Everything
that touches the framework (`definePluginPage`, `pluginApi`, the route-module normalizer, state
injection) lives in `@netscript/fresh/plugins`. Component references are module specifiers — data —
which is what keeps this package framework-free and the registry statically emittable.

| Entrypoint        | What it exports                                                        |
| ----------------- | ---------------------------------------------------------------------- |
| `.`               | `defineFrontend`, plus a re-export of `./contracts/v1`.                |
| `./contracts/v1`  | The versioned contract vocabulary documented on this page.             |
| `./testing`       | The host-fixture test kit every frontend-contributing plugin runs.     |

All schemas validate with Standard Schema and freeze on success. Payload schemas pass through
unknown fields, so adding an optional field to an existing kind is a minor contract change; adding
a kind or a discriminant is a new major of the family.

## `defineFrontend`

```ts
function defineFrontend(definition: FrontendDefinition): FrontendManifestEnvelope;
```

Validates the keyed authoring form against the envelope and the `app`-family payload schema, then
freezes the result. The default export of a plugin's `./frontend` module is the returned envelope.
A plugin that serves several hosts (the app and the dashboard) exports one envelope per family.

`FrontendDefinition` is the keyed form; it compiles to the versioned envelope:

| Field        | Type                                            | Required | Meaning                                  |
| ------------ | ----------------------------------------------- | -------- | ---------------------------------------- |
| `contract`   | `{ family: 'app'; major: 1 } \| FamilyRef`      | yes      | Family + major — the host handshake.     |
| `pluginKind` | `string`                                        | yes      | Canonical plugin kind (`'crons'`). Must match the installer manifest. |
| `base`       | `string`                                        | no       | Preferred mount base (`'/crons'`); the host may remap. |
| `routes`     | `readonly RouteContribution[]`                  | no       | Route contributions.                     |
| `islands`    | `readonly IslandContribution[]`                 | no       | Island contributions.                    |
| `zones`      | `readonly ZoneContribution[]`                   | no       | Zone contributions.                      |
| `theme`      | `readonly ThemeContribution[]`                  | no       | Theme contributions.                     |
| `requires`   | `FrontendRequires`                              | no       | Port and procedure grants.               |

```ts
import { defineFrontend } from '@netscript/plugin-frontend-core';

export default defineFrontend({
  contract: { family: 'app', major: 1 },
  pluginKind: 'crons',
  base: '/crons',
  routes: [{ kind: 'route', id: 'calendar', path: '/calendar', module: './routes/calendar.tsx' }],
  requires: { procedures: ['crons.list'] },
});
```

## `FrontendManifestEnvelope`

```ts
interface FrontendManifestEnvelope {
  readonly contract: { readonly family: 'app'; readonly major: 1 } | FamilyRef;
  readonly pluginKind: string;
  readonly base?: string;
  readonly contributions: readonly unknown[];
  readonly requires?: FrontendRequires;
}
```

The stable, versioned shape every host validates. The envelope is validated by the envelope
schema; `contributions` is validated by the **family's** registered payload schema — never by the
envelope — which is what lets new families (the dashboard's, for example) share discovery,
identity, and negotiation without widening this schema.

**Evolution rules.** New optional field on an existing kind: minor — payload schemas are
passthrough at the boundary. New kind or new discriminant: a new major of that family. Hosts
declare supported `(family, major)` windows in their `HostSurfaceDescriptor` and quarantine
contributions outside the window.

```ts
// What the keyed crons declaration compiles to (abridged):
{
  contract: { family: 'app', major: 1 },
  pluginKind: 'crons',
  base: '/crons',
  contributions: [
    { kind: 'route', id: 'calendar', path: '/calendar', module: './routes/calendar.tsx' },
  ],
  requires: { procedures: ['crons.list'] },
}
```

## `FamilyRef`

```ts
interface FamilyRef {
  readonly family: string;
  readonly major: number;
}
```

Identifies a contribution family and major version. The `app` family (major 1) is this package's
payload; other families register their own payload schemas with the hosts that support them.

```ts
const appV1: FamilyRef = { family: 'app', major: 1 };
```

## The `app` family payload — shared base

### `AppContributionBase`

```ts
interface AppContributionBase {
  readonly id: string;
  readonly title?: MessageRef;
  readonly icon?: string;
}
```

`id` is unique within `(plugin, family)` — duplicates are generate-time errors. `title` is a
host-localizable message reference; `icon` is a fresh-ui icon name.

### `MessageRef`

```ts
interface MessageRef {
  readonly id: string;
  readonly default: string;
}
```

A human-readable string as data: the `id` keys into the host's message catalog, the `default` text
is mandatory so every host renders something. Resolved through the host's message resolution.

```ts
const label: MessageRef = { id: 'crons.nav.calendar', default: 'Cron calendar' };
```

### `ComponentRef`

```ts
type ComponentRef = `./${string}`;
```

A package-relative module specifier. The generated registry turns each ref into a literal lazy
loader, and the staged type-check imports every referenced module — a ref that is absent from the
package export map is a generate-time error.

## The five kinds

### `RouteContribution`

```ts
interface RouteContribution extends AppContributionBase {
  readonly kind: 'route';
  readonly path: string;
  readonly module: ComponentRef;
  readonly nav?: NavSpec;
}
```

A Fresh route module mounted at `base + path` (Fresh pattern syntax: `/schedules/:id`). The
registry emits a literal lazy loader per route, normalized by `normalizeFreshRouteModule` at load
time. Plugin `_layout` modules are not supported and are rejected at generate time. `nav` is
shorthand for a nav contribution targeting this route.

```ts
const calendar: RouteContribution = {
  kind: 'route',
  id: 'calendar',
  path: '/calendar',
  module: './routes/calendar.tsx',
  nav: { label: { id: 'crons.nav.calendar', default: 'Cron calendar' }, icon: 'calendar', group: 'main' },
};
```

### `NavSpec`

The inline nav declaration on a route: `label` (a `MessageRef`), plus optional `icon` and `group`.
It compiles to a `NavContribution` whose target is `{ kind: 'route', routeId }` of the declaring
route — the base path is composed for you.

### `IslandContribution`

```ts
interface IslandContribution extends AppContributionBase {
  readonly kind: 'island';
  readonly module: ComponentRef;
}
```

One island component per file, registered by module specifier on both the Vite and dev-builder
paths. Props cross Fresh's serialization boundary: **serializable data only** — pass
`PluginClientContext`, never `PluginRequestContext`. The testing kit fails contributions whose
island props do not round-trip.

```ts
const calendarIsland: IslandContribution = {
  kind: 'island',
  id: 'cron-calendar',
  module: './islands/CronCalendar.tsx',
};
```

### `ZoneContribution`

```ts
interface ZoneContribution extends AppContributionBase {
  readonly kind: 'zone';
  readonly zone: string;
  readonly module: ComponentRef;
  readonly order?: number;
}
```

An SSR component injected into a host-published zone; it may import the plugin's islands. `zone`
is validated against the **target host's** `HostSurfaceDescriptor` — an unknown id is a
generate-time error, a known-but-unmounted zone is skipped with an informational diagnostic.
`order` sorts within the zone (ties break by mount id, then contribution id).

```ts
const nextFires: ZoneContribution = {
  kind: 'zone',
  id: 'next-fires',
  zone: 'app.dashboard.panels',
  module: './components/NextFiresCard.tsx',
  order: 10,
};
```

### `NavContribution`

```ts
interface NavContribution extends AppContributionBase {
  readonly kind: 'nav';
  readonly label: MessageRef;
  readonly target:
    | { readonly kind: 'route'; readonly routeId: string }
    | { readonly kind: 'href'; readonly href: string }
    | { readonly kind: 'external'; readonly href: string };
  readonly group?: string;
  readonly order?: number;
}
```

A navigation entry with a discriminated target. `route` targets a route id from the same plugin
(base path composed); `href` is a host-internal absolute path; `external` renders with
`rel="noopener noreferrer"` enforced by the host. `group` is validated against the host's nav
groups.

```ts
const docsLink: NavContribution = {
  kind: 'nav',
  id: 'docs',
  label: { id: 'crons.nav.docs', default: 'Cron documentation' },
  target: { kind: 'external', href: 'https://example.com/crons' },
  group: 'main',
  order: 40,
};
```

### `ThemeContribution`

```ts
interface ThemeContribution extends AppContributionBase {
  readonly kind: 'theme';
  readonly css: readonly ComponentRef[];
}
```

CSS overlays in the `--ns-*` token vocabulary only. Files are aggregated into the generated
stylesheet under the host-owned layer order and scoped by `[data-ns-plugin='<mountId>']` wrappers.

```ts
const theme: ThemeContribution = { kind: 'theme', id: 'theme', css: ['./theme.css'] };
```

### `AppContribution`

```ts
type AppContribution =
  | RouteContribution
  | IslandContribution
  | ZoneContribution
  | NavContribution
  | ThemeContribution;
```

The `app`-family payload union, discriminated on `kind`.

## `FrontendIdentity`

```ts
interface FrontendIdentity {
  readonly packageName: string;
  readonly pluginKind: string;
  readonly installationId: string;
  readonly mountId: string;
}
```

Four identities, each with one job — one string cannot serve provenance, URLs, CSS scoping, and
authorization:

| Field            | Assigned by          | Job                                                        |
| ---------------- | -------------------- | ---------------------------------------------------------- |
| `packageName`    | the plugin           | Immutable package/source identity (`'@acme/plugin-crons'`); provenance and version drift. |
| `pluginKind`     | the plugin           | Canonical capability kind (`'crons'`); stable across forks and aliases. |
| `installationId` | the host, at install | Instance id; equals `pluginKind` unless multi-instance.    |
| `mountId`        | the host, at install | **The** key for routes, CSS scope, gateway paths, and registry entries. |

All generated keys — base path, `data-ns-plugin` scope, gateway prefix, typed route-ref namespace —
derive from `mountId`, never from `packageName`.

## `HostSurfaceDescriptor`

```ts
interface HostSurfaceDescriptor {
  readonly host: string;
  readonly families: readonly FamilyRef[];
  readonly zones: readonly { readonly id: string; readonly capacity?: number }[];
  readonly navGroups: readonly string[];
  readonly reservedPaths: readonly string[];
}
```

The versioned surface a host publishes. Zones and nav groups are **host data, not schema
constants** — adding a zone to a host is a data change, which is what makes zone growth genuinely
additive. The registry validates contributions against the descriptor of the host it is generated
for; `reservedPaths` (such as `/_fresh` and the gateway prefix) participates in base-collision
checks.

```ts
// The scaffolded app's v1 descriptor (abridged):
{
  host: 'app',
  families: [{ family: 'app', major: 1 }],
  zones: [
    { id: 'app.topbar.end' },
    { id: 'app.dashboard.panels' },
    { id: 'app.home.cards' },
    { id: 'app.footer' },
  ],
  navGroups: ['main'],
  reservedPaths: ['/_fresh', '/api/plugins'],
}
```

## `PluginRequestContext`

```ts
interface PluginRequestContext {
  readonly identity: FrontendIdentity;
  readonly base: string;
  readonly serviceUrl: (service: string) => string;
  readonly principal: PrincipalPort | null;
  readonly csp: { readonly nonce?: string };
  readonly signal: AbortSignal;
}
```

**Server-only.** Injected under Fresh app state (`state.pluginHost`) by the mount middleware and
exposed to pages through `definePluginPage`. It may hold functions and ports — it must never cross
into an island. `serviceUrl` resolves a plugin service through the host's runtime configuration;
`principal` is supplied by the auth plugin when installed and is `null` on unauthenticated hosts;
`csp.nonce` passes through the Fresh CSP seam.

```ts
// Inside a definePluginPage handler:
const client = createCronsClient(ctx.host.serviceUrl('crons-api'));
if (!ctx.host.principal) { /* render the signed-out state */ }
```

## `PrincipalPort`

The authorization port shape owned by the base contract. The auth plugin supplies the
implementation; unauthenticated hosts carry `principal: null` and take no auth dependency. No
concrete claims type (such as session claims) appears in the base contract — those live with the
auth family.

## `PluginClientContext`

```ts
interface PluginClientContext {
  readonly mountId: string;
  readonly base: string;
  readonly locale: string;
  readonly direction: 'ltr' | 'rtl';
  readonly timeZone: string;
  readonly subject: { readonly signedIn: boolean; readonly display?: string } | null;
  readonly capabilities: readonly string[];
}
```

**Serializable** — the one context that may cross into islands, versioned with the family schema.
`capabilities` lists the granted `requires`, so a plugin degrades its UI cleanly when a host does
not provide something.

```tsx
// A zone component forwarding only the island-safe context:
<CronCalendar initial={entries} client={client} />
```

## `ZoneProps`

```ts
interface ZoneProps {
  readonly url: URL;
  readonly host: PluginRequestContext;
  readonly client: PluginClientContext;
}
```

The props a zone component receives server-side. Forward `client` — or slices of it — to islands;
never `host`.

```tsx
export default async function NextFiresCard({ host, client }: ZoneProps) {
  const fires = await createCronsClient(host.serviceUrl('crons-api')).crons.nextFires();
  return <NextFiresList initial={fires} client={client} />;
}
```

## `FrontendRequires`

```ts
interface FrontendRequires {
  readonly ports?: readonly string[];
  readonly procedures?: readonly string[];
}
```

The gateway's input, not prose. Each `procedures` entry names a procedure the plugin's **own**
contract exposes; the generated deny-by-default gateway derives the service owner, method, path
template, and streaming policy from the plugin's versioned contract metadata. Granted entries
surface on `PluginClientContext.capabilities`.

```ts
requires: { procedures: ['crons.list', 'crons.nextFires'] }
```

## `./testing` — the host-fixture test kit

A generated host fixture that runs the suite every frontend-contributing plugin ships green:

- schema and resolution checks against the contract and a host surface descriptor;
- island-props serialization round-trip;
- SSR render and hydration;
- browser smoke and accessibility (axe + keyboard);
- base-path composition;
- both delivery modes: local-source and JSR-installed.

Per-plugin **production budgets** — initial JS bytes, async chunk count, CSS bytes, island count,
zone SSR render deadline, data resolver deadline — are recorded in the plugin manifest and
asserted by the kit; exceptions are explicit host policy, not silent convention.

Import it from `@netscript/plugin-frontend-core/testing` in the plugin's test suite; the generated
fixture mounts the plugin's envelope against a synthetic host so failures name the contribution,
not a stack frame.
