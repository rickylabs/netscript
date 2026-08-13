const result = await new Deno.Command('git', {
  args: ['status', '--porcelain'],
  stdout: 'piped',
  stderr: 'piped',
}).output();
if (!result.success) {
  await Deno.stderr.write(result.stderr);
  Deno.exit(result.code);
}
const status = new TextDecoder().decode(result.stdout);
if (status.length > 0) {
  console.error(`Gate dirtied the worktree:\n${status}`);
  Deno.exit(1);
}
console.log('git status --porcelain is empty.');
