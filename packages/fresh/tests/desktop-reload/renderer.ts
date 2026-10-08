import { createDesktopServiceClient } from '@netscript/sdk/desktop';
import { reloadRouter } from './contract.ts';

try {
  const client = createDesktopServiceClient({ contract: reloadRouter });
  const value = await client.ping(undefined);
  const response = await fetch('/ack', {
    method: 'POST',
    body: JSON.stringify({ epoch: performance.timeOrigin, value }),
  });
  if (!response.ok) throw new Error('Native host rejected the document receipt');
} catch (error) {
  await fetch('/error', { method: 'POST', body: String(error) });
}
