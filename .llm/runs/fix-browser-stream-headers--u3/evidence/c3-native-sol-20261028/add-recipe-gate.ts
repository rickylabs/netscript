const directory = '.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3';
const original = await Deno.readTextFile(`${directory}/run-gate.ts`);
const end = original.indexOf(';\nconst selected =');
const commands = JSON.parse(original.slice(original.indexOf('=') + 1, end));
commands.recipe = ['run', '--frozen', '-A', `${directory}/check-reader-recipe.ts`];
await Deno.writeTextFile(`${directory}/run-supporting-gate.ts`, `const commands: Record<string, string[]> = ${JSON.stringify(commands, null, 2)}` + original.slice(end), { createNew: true });
