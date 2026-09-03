import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { QUICKSTART_DOCUMENTED_COMMANDS } from '../../suites/quickstart/quickstart-walk-suite.ts';

const QUICKSTART_PATH = fromFileUrl(
  new URL('../../../../../docs/site/quickstart.vto', import.meta.url),
);

Deno.test('Quickstart executable commands stay aligned with quickstart.walk', async () => {
  const page = await Deno.readTextFile(QUICKSTART_PATH);
  const marked = page.match(/<!-- quickstart-walk:start -->([\s\S]*?)<!-- quickstart-walk:end -->/);
  if (!marked) throw new Error('Quickstart walk command markers are missing.');
  const commands = [...marked[1].matchAll(/```bash\n([\s\S]*?)```/g)]
    .flatMap((match) => match[1].split('\n'))
    .map((line) => line.replace(/\s+#.*$/, '').trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line.replace('jsr:@netscript/cli{{ releaseSpecifier }}', 'jsr:@netscript/cli@<version>')
    );
  assertEquals(commands, [...QUICKSTART_DOCUMENTED_COMMANDS]);
});
