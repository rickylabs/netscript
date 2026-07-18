import { createDesktopServiceClient } from '@netscript/sdk/desktop';
import { desktopFixtureRouter } from './router.ts';

const client = createDesktopServiceClient({ contract: desktopFixtureRouter });
const evidence = await client.remote.probe(undefined);
await client.remote.acknowledge(evidence);

const output = document.querySelector('#evidence');
if (output === null) throw new Error('Desktop evidence element is missing.');
output.textContent = `${evidence.value} · ${evidence.version}`;
document.documentElement.dataset.desktopE2e = 'passed';
