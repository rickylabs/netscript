Deno.test('doctrine records owner-approved BFF topology and its composition boundaries', async () => {
  const decision = (await Deno.readTextFile(
    new URL(
      '../../../docs/architecture/doctrine/07-composition-and-extension.md',
      import.meta.url,
    ),
  )).replace(/\s+/g, ' ');
  for (
    const required of [
      '## Browser authentication topology (0.0.8, owner decision)',
      'https://github.com/rickylabs/netscript/issues/1386',
      'https://github.com/rickylabs/netscript/issues/2103',
      'The Fresh app owns sign-in, callback,',
      'Its server forwards a bearer to services',
      'Workers, sagas and triggers operate with a service identity',
    ]
  ) {
    if (!decision.includes(required)) throw new Error(`Missing topology decision: ${required}`);
  }
});

Deno.test('CORS breaking migration records exact environment and preset option snippets', async () => {
  const readme = await Deno.readTextFile(new URL('../README.md', import.meta.url));
  const changelog = await Deno.readTextFile(new URL('../CHANGELOG.md', import.meta.url));
  for (
    const required of [
      '## CORS migration (breaking in 0.0.8)',
      "export NETSCRIPT_CORS_ORIGINS='https://app.example,https://admin.example'",
      "cors: { origin: ['https://app.example'] }",
    ]
  ) {
    if (!readme.includes(required)) throw new Error(`Missing migration: ${required}`);
  }
  if (!changelog.includes('**Breaking (0.0.8):** CORS')) {
    throw new Error('Missing breaking changelog');
  }
});
