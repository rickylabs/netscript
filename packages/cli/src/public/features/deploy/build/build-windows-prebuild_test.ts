import { assertEquals } from '@std/assert';
import { buildVitePrebuildEnvironment } from './build-windows-prebuild.ts';

Deno.test('deploy prebuild emits Aspire-normalized browser keys', () => {
  const env = buildVitePrebuildEnvironment(
    {
      'sagas-api': { port: 7101 },
      'orders.api': { port: 7102 },
    },
    {
      'workers.api/v2': { enabled: true, port: 7201 },
      'disabled-api': { enabled: false, port: 7202 },
    },
  );

  assertEquals(env, {
    VITE_services__sagas_api__http__0: 'http://localhost:7101',
    VITE_SAGAS_API_URL: 'http://localhost:7101',
    VITE_services__orders_api__http__0: 'http://localhost:7102',
    VITE_ORDERS_API_URL: 'http://localhost:7102',
    VITE_services__workers_api_v2__http__0: 'http://localhost:7201',
    VITE_WORKERS_API_V2_URL: 'http://localhost:7201',
  });
});
