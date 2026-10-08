/** POSIX comment and carriage-return rotation regressions. @module */
import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';
import { readAuthEnvBackend, reconcileAuthEnv } from './auth-env.ts';

async function source(content: string): Promise<Record<string, string>> {
  const root = await Deno.makeTempDir();
  try {
    const path = join(root, '.env');
    await Deno.writeTextFile(path, content);
    const child = await new Deno.Command('sh', {
      args: [
        '-c',
        'set -eu; set -a; . "$1"; exec "$2" eval "$3"',
        'auth-env-test',
        path,
        Deno.execPath(),
        'console.log(JSON.stringify({ secret: Deno.env.get("BETTER_AUTH_SECRET"), safe: Deno.env.get("SAFE") }))',
      ],
    }).output();
    assertEquals(child.code, 0, new TextDecoder().decode(child.stderr));
    return JSON.parse(new TextDecoder().decode(child.stdout));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('auth rotation ignores apostrophes in trailing shell comments and preserves neighbors', async () => {
  for (const suffix of [" # owner's key", "\t# owner's key"]) {
    const current = `BETTER_AUTH_SECRET='old'${suffix}\nSAFE=retained\n# user's setting\n`;
    assertEquals(readAuthEnvBackend(current), undefined);
    const updated = reconcileAuthEnv(current, { BETTER_AUTH_SECRET: 'new' });
    assert(updated.includes("SAFE=retained\n# user's setting\n"));
    assertEquals(await source(updated), { secret: 'new', safe: 'retained' });
  }
  // A # within a word or a quoted value is literal; its following quote must still be scanned.
  for (const value of ["'old#value'", "'old'#'value'"]) {
    const updated = reconcileAuthEnv(`BETTER_AUTH_SECRET=${value}\nSAFE=retained\n`, {
      BETTER_AUTH_SECRET: 'new',
    });
    assertEquals(await source(updated), { secret: 'new', safe: 'retained' });
  }
});

Deno.test('auth rotation removes CR and multiline credential assignments on repeated updates', async () => {
  for (const old of ['old\rvalue', 'old\r\ncontinuation']) {
    const initial = reconcileAuthEnv('SAFE=retained\n', { BETTER_AUTH_SECRET: old });
    const duplicated = initial + initial;
    const rotated = reconcileAuthEnv(duplicated, { BETTER_AUTH_SECRET: 'next\r\nvalue' });
    assertEquals(rotated.match(/^BETTER_AUTH_SECRET=/gm)?.length, 1);
    assertEquals(rotated.includes('old'), false);
    assertEquals(rotated.includes('continuation'), false);
    assertEquals(await source(rotated), { secret: 'next\r\nvalue', safe: 'retained' });
    const final = reconcileAuthEnv(rotated, { BETTER_AUTH_SECRET: 'final' });
    assertEquals(final.match(/^BETTER_AUTH_SECRET=/gm)?.length, 1);
    assertEquals(final.includes('next'), false);
    assertEquals(await source(final), { secret: 'final', safe: 'retained' });
  }
});
