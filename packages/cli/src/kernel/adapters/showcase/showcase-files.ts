import { TEMPLATE_KEYS, type TemplateKey } from '../../assets/manifest.ts';

/** Additive application files emitted by the Northwind recipe. */
export function showcaseFiles(
  app: string,
  engine: string,
): readonly (readonly [string, TemplateKey])[] {
  return [
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
    ['Export records', 'Export orders'],
    ['Back to records', 'Back to orders'],
    ['Record details', 'Order details'],
    ['Record not found', 'Order not found'],
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
