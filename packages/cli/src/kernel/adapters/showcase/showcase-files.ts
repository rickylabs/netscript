import { TEMPLATE_KEYS, type TemplateKey } from '../../assets/manifest.ts';

/** Additive application files emitted by the Northwind recipe. */
export function showcaseFiles(
  app: string,
  engine: string,
): readonly (readonly [string, TemplateKey])[] {
  return [
    ['ai/showcase/chat.ts', TEMPLATE_KEYS.showcaseChat],
    ['ai/showcase/contracts.ts', TEMPLATE_KEYS.showcaseChatContract],
    ['ai/showcase/orders.ts', TEMPLATE_KEYS.showcaseChatOrders],
    ['ai/showcase/provider.ts', TEMPLATE_KEYS.showcaseChatProvider],
    ['ai/showcase/runtime.ts', TEMPLATE_KEYS.showcaseChatRuntime],
    ['ai/showcase/stream-policy.ts', TEMPLATE_KEYS.showcaseChatStreamPolicy],
    ['ai/showcase/thread-store.ts', TEMPLATE_KEYS.showcaseChatStore],
    ['ai/showcase/wire.ts', TEMPLATE_KEYS.showcaseChatWire],
    ['showcase/stream-secret.ts', TEMPLATE_KEYS.showcaseChatSecret],
    ['showcase/streams-host.ts', TEMPLATE_KEYS.showcaseChatStreamsHost],
    [`apps/${app}/lib/showcase-ai.ts`, TEMPLATE_KEYS.showcaseChatLoader],
    [`apps/${app}/routes/ai.tsx`, TEMPLATE_KEYS.showcaseChatPage],
    [`apps/${app}/islands/NorthwindChat.tsx`, TEMPLATE_KEYS.showcaseChatIsland],
    [`apps/${app}/routes/api/showcase/chat.ts`, TEMPLATE_KEYS.showcaseChatThreadsRoute],
    [`apps/${app}/routes/api/showcase/chat/[sessionId].ts`, TEMPLATE_KEYS.showcaseChatSessionRoute],
    [`apps/${app}/routes/api/showcase/mcp.ts`, TEMPLATE_KEYS.showcaseChatMcpRoute],
    [`apps/${app}/assets/showcase-ai.css`, TEMPLATE_KEYS.showcaseChatCss],
    ['showcase/setup.ts', TEMPLATE_KEYS.showcaseSetup],
    ['showcase/README.md', TEMPLATE_KEYS.showcaseReadme],
    ['showcase/resources/fulfil-order.ts', TEMPLATE_KEYS.showcaseWorker],
    ['showcase/resources/order-saga.ts', TEMPLATE_KEYS.showcaseSaga],
    ['showcase/resources/order.config.ts', TEMPLATE_KEYS.showcaseSagaConfig],
    ['showcase/resources/order-webhook.ts', TEMPLATE_KEYS.showcaseWebhook],
    ['contracts/commerce.contract.ts', TEMPLATE_KEYS.showcaseContract],
    ['services/orders/src/commerce.ts', TEMPLATE_KEYS.showcaseService],
    [`database/${engine}/scripts/seed-commerce.ts`, TEMPLATE_KEYS.showcaseSeed],
    [`apps/${app}/lib/northwind.ts`, TEMPLATE_KEYS.showcaseLoader],
    [`apps/${app}/routes/(_components)/order-workflow.tsx`, TEMPLATE_KEYS.showcaseWorkflow],
    [`apps/${app}/routes/(_components)/catalogue.tsx`, TEMPLATE_KEYS.showcaseCatalogue],
    [`apps/${app}/assets/northwind.css`, TEMPLATE_KEYS.showcaseCss],
  ];
}

/** Apply commerce copy to the canonical Utility views without a second page template set. */
export function northwindVocabulary(source: string): string {
  const copy = [
    ["'Records'", "'Orders'"],
    ["'Record'", "'Order'"],
    ["'Owner'", "'Customer'"],
    ['>Records<', '>Orders<'],
    ['>Records {', '>Orders {'],
    ['Records by week', 'Orders by week'],
    ['Weekly record counts', 'Weekly order counts'],
    ["unit=' records'", "unit=' orders'"],
    ['>Record information<', '>Order information<'],
    ['>Record timeline<', '>Order timeline<'],
    ['>Owner<', '>Customer<'],
    ['Records, amounts and activity', 'Orders, revenue and customer activity'],
    [
      'Owners, amounts and status across your workspace.',
      'Fulfilment, payments and refunds across every sales channel.',
    ],
    ['All records ', 'All orders '],
    ['Recent records', 'Recent orders'],
    ['View all records', 'View all orders'],
    ['Open Records', 'Open Orders'],
    ['Export records', 'Export orders'],
    ['Back to records', 'Back to orders'],
    ['Record details', 'Order details'],
    ['Record not found', 'Order not found'],
    ['Record search', 'Order search'],
    ['Search records, pages and actions', 'Search orders, pages and actions'],
    ['Pages · Records · Actions', 'Pages · Orders · Actions'],
    ['Matching records', 'Matching orders'],
    ['real service records', 'live orders'],
    [
      'Choose records and download a CSV from the records table.',
      'Choose orders and download a CSV from the orders table.',
    ],
    ['Available records from the current page.', 'Available orders from the current page.'],
    ["label: 'Workspace'", "label: 'Commerce'"],
    ['Studio Utility', 'Northwind commerce'],
    ['Record created', 'Order created'],
    ['Latest record changes', 'Latest order changes'],
    [
      'Latest events from the record activity stream.',
      'Latest events from your order activity stream.',
    ],
    ['Total amount ·', 'Net revenue ·'],
    ['Average amount ·', 'Average order value ·'],
    ["'record' : 'records'", "'order' : 'orders'"],
    ['The latest records across your workspace.', 'The latest orders across every sales channel.'],
  ] as const;
  return copy.reduce((result, [before, after]) => result.replaceAll(before, after), source);
}
