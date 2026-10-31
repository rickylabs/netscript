/** Scenario content and the exact checked source rendered by the comparison pages. */
export interface Scenario {
  key: string;
  title: string;
  problem: string;
  setup: string;
  tabs: { label: string; lang: string; filename: string; code: string }[];
  alternative: string;
  why: string;
  sources: { label: string; href: string }[];
  href: string;
  hrefLabel?: string;
}

function example(filename: string) {
  return {
    label: filename,
    lang: filename.endsWith('.json') ? 'json' : filename.endsWith('.tsx') ? 'tsx' : 'ts',
    filename,
    code: Deno.readTextFileSync(new URL(`./_examples/${filename}`, import.meta.url)),
  };
}

export const backendScenarios: Scenario[] = [
  {
    key: 'orders',
    title: 'An order backend with delayed payment and shipping events',
    problem: 'Keep an order’s state across restarts and reject forged shipment notifications.',
    setup:
      'Definition excerpts for a workspace with sagas, triggers, workers and streams installed. Register the saga, webhook and record-shipment job, then run netscript generate. Implement the named job entrypoint to store each shipment once. Payment workers publish PaymentReceived or PaymentFailed with the same order correlation key. The state transition below does not charge or refund a card. T1 persistence needs a durable configured store. The HMAC sender uses the default x-netscript-signature header.',
    tabs: [example('orders.ts'), example('webhook.ts')],
    alternative:
      'Nest provides durable workflows as well as queue integrations. An existing Nest app can keep its workflow and queue providers; its webhook controller still needs signature verification and an explicit handoff to the work. Hono can serve the ingress while a chosen queue or workflow engine owns durability.',
    why:
      'For a Deno workspace already running these plugins, persisted state, verified ingress and named job dispatch use generated registries and resource wiring. You avoid designing those joins for each integration. Retries still require idempotent business effects, and cancellation is not a payment refund.',
    sources: [{
      label: 'Nest durable workflows',
      href: 'https://docs.nestjs.com/reliability/workflows',
    }, { label: 'Nest queues', href: 'https://docs.nestjs.com/application/queues' }],
    href: '/tutorials/storefront/04-checkout-saga/',
  },
  {
    key: 'sync',
    title: 'A scheduled ERP sync with a Python normalization step',
    problem: 'Run an existing Python transform every night and retain the job’s outcome.',
    setup:
      'Definition excerpt: register the sync job and scheduled trigger in a workers/triggers workspace. Provide workers/scripts/normalize.py; it reads the input argument and prints a JSON object as its last stdout line. Relative paths resolve from the worker’s working directory. Python must be installed and allowed by the host. It inherits the worker’s OS access; Deno permission flags do not sandbox it. Production imports must handle retries without duplicating writes.',
    tabs: [example('sync.ts')],
    alternative:
      'A Nest schedule can enqueue a queue job, and that processor can spawn Python. The team owns the subprocess adapter, exit/result protocol and connection to the queue’s execution record. A managed batch scheduler is also a sound choice when the transform is already deployed there.',
    why:
      'NetScript supplies the task runtime adapter and result protocol alongside the scheduled trigger and job result. Keeping an existing transform in its own language is cheaper than rewriting it solely to fit a TypeScript handler. You still operate the interpreter, data files and retry-safe import.',
    sources: [{
      label: 'Nest scheduling',
      href: 'https://docs.nestjs.com/application/task-scheduling',
    }, { label: 'Nest queues', href: 'https://docs.nestjs.com/application/queues' }],
    href: '/tutorials/erp-sync/03-polyglot-transform/',
  },
  {
    key: 'agents',
    title: 'An agent investigating a failing multi-service app',
    problem: 'Find the live service and operation schema before inspecting a failed request.',
    setup:
      'Run netscript agent init in the workspace and connect its MCP server. These are tool-call recipes, executed in order rather than as a JSON-RPC batch. Replace each placeholder with the exact name or operation id returned by the preceding discovery call. Start unfamiliar API work with find_guidance and search_docs. After inspection, use the generated typed SDK client for application calls; these discovery tools do not invoke a business operation.',
    tabs: [example('mcp.json')],
    alternative:
      'Encore has a local MCP server, Next has a development MCP endpoint, and Nest Observe exposes observability through MCP. If your application already uses one of those stacks, use its native tools. Tool coverage and the resources represented differ; MCP itself is not unique to NetScript.',
    why:
      'In a NetScript workspace, one server can connect service discovery, operation schemas, runtime health and correlated telemetry to the same app vocabulary. The agent can inspect the declared service instead of guessing a port or endpoint. Diagnostics still depend on the running resources and available telemetry.',
    sources: [{ label: 'Encore local MCP', href: 'https://encore.dev/docs/mcp' }, {
      label: 'Next MCP',
      href: 'https://nextjs.org/docs/app/guides/mcp',
    }, {
      label: 'Nest observability MCP',
      href: 'https://docs.nestjs.com/observability/mcp-server',
    }],
    href: '/ai/agent-tooling/',
  },
];

export const frontendScenarios: Scenario[] = [
  {
    key: 'operations',
    title: 'A live operations dashboard',
    problem: 'Show order changes without a separate polling loop in every widget.',
    setup:
      'The service publishes confirmed order changes after its business write. That write and the stream flush are not atomic; use an outbox when a missed update is unacceptable. Aspire supplies the producer’s streams reference and credentials. The shared State Protocol schema works with both the producer and Fresh StreamDB. Keep it in its own module so the island never imports or constructs the server producer. In a Fresh island, create one dashboard instance, await db.preload?.(), mount Orders, and call db.close?.() on disposal. streamsUrl is the authorized streams endpoint; use the URL Aspire prints. Expose only an appropriately authorized stream to the browser, never an internal producer credential. Handle db.status === failed with an explicit reload or recovery path: expired retained offsets do not replay automatically.',
    tabs: [example('schema.ts'), example('streams.ts'), example('dashboard.tsx')],
    alternative:
      'Next streams server-rendered regions and can read data in Server Components. A continuously changing operations board still needs a transport, client collection and reconnect policy, whether you choose SSE, WebSockets or a hosted realtime database. Those integrations may already be a better fit for an existing React app.',
    why:
      'When the backend already publishes NetScript durable streams, the dashboard consumes that same change protocol as typed reactive collections. Widgets can query local state instead of inventing their own pollers. This is a state feed with retention and failure states, distinct from streaming one HTML response.',
    sources: [{
      label: 'Next data fetching and streaming',
      href: 'https://nextjs.org/docs/app/getting-started/fetching-data',
    }],
    href: '/durable-workflows/streams/',
  },
  {
    key: 'contracts',
    title: 'A SaaS app consuming a versioned pricing service',
    problem: 'Change a shared pricing response without silently breaking its callers.',
    setup:
      'A public quote example with separate contract, server router and consumer modules: the service composition must mount this contract and router as pricing v2 before the client can call it. Keep v1 mounted for callers you have not migrated. apiVersion selects an existing server mount; it does not create one. Inside Aspire the SDK resolves pricing through service discovery. Outside Aspire, provide the SDK URL resolver with the URL Aspire prints. Protected operations also need backend authentication/authorization and the generated session-client contribution.',
    tabs: [example('contracts.ts'), example('pricing-router.ts'), example('pricing-client.ts')],
    alternative:
      'Hono RPC infers a typed client from the server’s route type. Encore also supplies typed service calls. Both avoid hand-maintained transport DTOs. With a separate service estate, your team still chooses how route versions, service addresses and consumer rollout are represented.',
    why:
      'NetScript lets each caller import a standalone contract object and select the matching API version through a discovery-aware SDK. That makes the migration boundary visible at the call site without importing a service implementation. Type checking covers callers you rebuild, not independently deployed old clients.',
    sources: [{ label: 'Hono RPC', href: 'https://hono.dev/docs/guides/rpc' }, {
      label: 'Encore TypeScript SDK',
      href: 'https://encore.dev/docs/ts',
    }],
    href: '/services-sdk/services/',
  },
  {
    key: 'admin',
    title: 'An internal admin form backed by an authenticated service',
    problem: 'Validate an invitation once, show field errors, and trace the service mutation.',
    setup:
      'Bind inviteMember to the generated auth/bff.ts typed session client on the server, passing browserSessionContext(request). The members service must enforce authentication and its members:write scope using its authenticator and contract authorizer. This UI never decides who may invite. The page builder owns server validation, CSRF, form state, redirect and span naming. Mount the built definition in the Fresh route; replace the minimal HTML controls with generated Fresh UI controls in your app.',
    tabs: [example('admin.tsx')],
    alternative:
      'Next Server Actions and SvelteKit form actions both support server-side form handling and progressive enhancement. In either stack you can validate with a schema and call an authenticated backend. Keep that setup when its routing, UI ecosystem and access model already fit the app.',
    why:
      'For an app already using NetScript services and telemetry, withForm declares validation, the typed mutation boundary and its trace name beside the route. The same RuntimeFormState supplies field values and accessible error props on a failed submission, including without browser JavaScript. Backend policy remains authoritative.',
    sources: [{ label: 'Next forms', href: 'https://nextjs.org/docs/app/guides/forms' }, {
      label: 'SvelteKit form actions',
      href: 'https://svelte.dev/docs/kit/form-actions',
    }],
    href: '/web-layer/form/',
  },
];
