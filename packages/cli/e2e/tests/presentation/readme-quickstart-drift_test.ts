import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import {
  parseReadmeQuickstartCommands,
  README_QUICKSTART_EXPECTED_COMMANDS,
} from '../../src/domain/readme-quickstart.ts';

const README_PATH = fromFileUrl(new URL('../../../../../README.md', import.meta.url));

Deno.test('root README executable commands stay aligned with readme.quickstart', async () => {
  const readme = await Deno.readTextFile(README_PATH);
  const commands = parseReadmeQuickstartCommands(readme);
  assertEquals(commands.map((entry) => entry.command), [...README_QUICKSTART_EXPECTED_COMMANDS]);
});
