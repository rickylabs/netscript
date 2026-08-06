const context = readContext();
const createdFiles = [
  'plugins/fixture/generated.txt',
  'plugins/fixture/deno.json',
  'plugins/fixture/services/src/main.ts',
  'plugins/fixture/bin/combined.ts',
];
const modifiedFiles = ['deno.json'];

if (!context.dryRun) {
  await Deno.mkdir(`${context.workspaceRoot}/plugins/fixture`, { recursive: true });
  await Deno.writeTextFile(
    `${context.workspaceRoot}/plugins/fixture/generated.txt`,
    `plugin=${context.options.pluginName}\n`,
  );
  await Deno.mkdir(`${context.workspaceRoot}/plugins/fixture/services/src`, { recursive: true });
  await Deno.mkdir(`${context.workspaceRoot}/plugins/fixture/bin`, { recursive: true });
  await Deno.writeTextFile(
    `${context.workspaceRoot}/plugins/fixture/deno.json`,
    `${JSON.stringify({ name: '@acme/plugin-fixture-runtime', version: '1.0.0' }, null, 2)}\n`,
  );
  await Deno.writeTextFile(
    `${context.workspaceRoot}/plugins/fixture/services/src/main.ts`,
    `const port = Number(Deno.env.get('PORT') ?? '8080');\n` +
      `Deno.serve({ port }, (request) => {\n` +
      `  const path = new URL(request.url).pathname;\n` +
      `  if (path === '/health') return Response.json({ status: 'ok' });\n` +
      `  if (path === '/ping') return Response.json({ plugin: '@acme/plugin-fixture', ok: true });\n` +
      `  return new Response('Not found', { status: 404 });\n` +
      `});\n`,
  );
  await Deno.writeTextFile(
    `${context.workspaceRoot}/plugins/fixture/bin/combined.ts`,
    `const port = Number(Deno.env.get('PORT') ?? '8081');\n` +
      `Deno.serve({ port }, () => Response.json({ status: 'ok' }));\n`,
  );
}

console.log(JSON.stringify({
  status: context.dryRun ? 'planned' : 'applied',
  createdFiles,
  modifiedFiles,
  databaseMigrationsAdded: true,
}));

function readContext(): {
  readonly workspaceRoot: string;
  readonly dryRun: boolean;
  readonly options: { readonly pluginName: string };
} {
  const index = Deno.args.indexOf('--context-json');
  if (index < 0) {
    throw new Error('Missing --context-json.');
  }
  return JSON.parse(Deno.args[index + 1]);
}
