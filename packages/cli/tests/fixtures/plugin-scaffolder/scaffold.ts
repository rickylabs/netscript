const context = readContext();
const createdFiles = ['plugins/fixture/generated.txt'];
const modifiedFiles = ['deno.json'];

if (!context.dryRun) {
  await Deno.mkdir(`${context.workspaceRoot}/plugins/fixture`, { recursive: true });
  await Deno.writeTextFile(
    `${context.workspaceRoot}/plugins/fixture/generated.txt`,
    `plugin=${context.options.pluginName}\n`,
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
