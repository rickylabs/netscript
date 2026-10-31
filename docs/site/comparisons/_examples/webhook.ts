import { defineWebhook, enqueueJob } from '@netscript/plugin-triggers-core';
import { defineJob } from '@netscript/plugin-workers-core';
import { z } from 'zod';

const Shipment = z.object({ deliveryId: z.string(), orderId: z.string() });
const recordShipment = defineJob('record-shipment')
  .payload(Shipment)
  .entrypoint('./workers/jobs/record-shipment.ts')
  .build();

export default defineWebhook((event) => {
  const payload = Shipment.parse(event.payload.body);
  return Promise.resolve([
    enqueueJob(recordShipment, {
      payload,
      idempotencyKey: `shipment:${payload.deliveryId}`,
    }),
  ]);
}, {
  id: 'shipment-received',
  path: '/webhooks/shipment',
  verifier: 'hmac-sha256',
  secretEnv: 'SHIPMENT_WEBHOOK_SECRET',
});
