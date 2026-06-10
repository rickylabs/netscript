# Webhooks

Webhook triggers are HTTP ingress triggers.

The plugin service receives webhook requests.

The core ingress boundary verifies and persists accepted events.

The processor handles accepted events after acknowledgement.

## Manifest Health

```ts
import { assertEquals } from 'jsr:@std/assert@^1';
import { TRIGGERS_API_SERVICE_NAME, triggersPlugin } from '../../mod.ts';

assertEquals(TRIGGERS_API_SERVICE_NAME, 'triggers-api');
assertEquals(triggersPlugin.contributions.services?.[0]?.name, 'triggers-api');
```

## Scaffold

Use the CLI to create a webhook trigger file.

```sh
ns-triggers add webhook orders-created --path=/webhooks/orders-created --secret-env=ORDERS_SECRET
```

The scaffolded file should import `defineWebhook` from core builders.

The handler should return trigger actions.

The service returns `202` after acceptance.

Invalid signatures fail before event persistence.

## Verification

Use HMAC verification for production webhooks.

Use memory verification for tests.

Keep secret lookup in the plugin or host layer.

Do not put secret lookup into core definitions.
