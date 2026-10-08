/** Execute the documented setup order against credential-aware command fixtures. @module */
import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';

Deno.test('auth recipe configures and exports credentials before starting Aspire and migrating', async () => {
  const recipe = await Deno.readTextFile(
    new URL(
      '../../../../../../../docs/site/identity-access/how-to/add-authentication.md',
      import.meta.url,
    ),
  );
  const setup = recipe.slice(0, recipe.indexOf('## Step 5'));
  // Include early inline start instructions: they are executable steps in the original recipe.
  const inlineStarts = Array.from(
    setup.matchAll(/<code>(cd aspire &amp;&amp; aspire start)<\/code>/g),
    (match) => match[1].replaceAll('&amp;', '&'),
  );
  const blocks = Array.from(setup.matchAll(/```sh\n([\s\S]*?)```/g), (match) => match[1])
    .filter((block) => !block.includes('WORKOS_API_KEY'));
  assert(blocks.some((block) => block.includes('netscript plugin auth provider set')));
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(join(root, 'aspire'));
    const marker = crypto.randomUUID();
    const fixture = `
      netscript() {
        case "$*" in
          'plugin auth secret generate kv-oauth-key') printf '%s' '${marker}' ;;
          'plugin auth provider set'*) printf "NETSCRIPT_AUTH_KV_OAUTH_KEY='%s'\\n" "$NETSCRIPT_AUTH_KV_OAUTH_KEY" > .env ;;
          db*) test -f "$RECIPE_ROOT/started" || return 21; printf 'migrated\\n' >> "$RECIPE_ROOT/events" ;;
        esac
      }
      aspire() {
        [ "$NETSCRIPT_AUTH_KV_OAUTH_KEY" = '${marker}' ] || return 22
        printf 'started\\n' >> "$RECIPE_ROOT/events"
        printf 'yes' > "$RECIPE_ROOT/started"
      }
    `;
    const script = fixture + [...inlineStarts, ...blocks].join('\n');
    const child = await new Deno.Command('sh', {
      args: ['-eu', '-c', script],
      cwd: root,
      clearEnv: true,
      env: {
        PATH: `${root}:${Deno.env.get('PATH') ?? ''}`,
        RECIPE_ROOT: root,
        NETSCRIPT_AUTH_CLIENT_ID: 'fixture',
        NETSCRIPT_AUTH_CLIENT_SECRET: 'fixture',
        NETSCRIPT_AUTH_REDIRECT_URI: 'http://localhost',
      },
    }).output();
    assertEquals(child.code, 0, new TextDecoder().decode(child.stderr));
    const events = (await Deno.readTextFile(join(root, 'events'))).trim().split('\n');
    assertEquals(events[0], 'started');
    assert(events.includes('migrated'));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
