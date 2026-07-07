import { assertEquals } from '@std/assert';
import {
  createProviderRegistration,
  InstrumentationRegistry,
} from '../../src/application/registry/mod.ts';
import { clearProviderRegistration, isProviderRegistered } from '../../src/config/mod.ts';
import type { TracerProviderPort } from '../../src/ports/mod.ts';

function createRecordingProvider(): { events: string[]; provider: TracerProviderPort } {
  const events: string[] = [];
  const provider: TracerProviderPort = {
    descriptor: { id: 'fake', description: 'recording fake', supportsLinkAttributes: false },
    register: () => {
      events.push('register');
    },
    shutdown: () => {
      events.push('shutdown');
    },
  };
  return { events, provider };
}

Deno.test('provider registration flows through the InstrumentationRegistry seam', async () => {
  clearProviderRegistration();
  const { events, provider } = createRecordingProvider();
  const registry = new InstrumentationRegistry();

  try {
    registry.register(createProviderRegistration(provider));
    assertEquals(isProviderRegistered(), false);
    assertEquals(registry.resolve('telemetry-provider')?.name, 'telemetry-provider');

    await registry.setupAll({ serviceName: 'api' });
    assertEquals(events, ['register']);
    assertEquals(isProviderRegistered(), true);

    await registry.teardownAll({ serviceName: 'api' });
    assertEquals(events, ['register', 'shutdown']);
    assertEquals(isProviderRegistered(), false);
  } finally {
    clearProviderRegistration();
  }
});
