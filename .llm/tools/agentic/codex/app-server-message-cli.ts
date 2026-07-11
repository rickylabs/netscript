import { sendAppServerMessage } from './app-server-message.ts';

function value(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] ?? null : null;
}

if (import.meta.main) {
  const model = value(Deno.args, '--model');
  const effort = value(Deno.args, '--effort');
  const cwd = value(Deno.args, '--cwd');
  const message = value(Deno.args, '--message');
  const profile = value(Deno.args, '--profile') ?? undefined;
  if (!model || !effort || !cwd || !message) {
    console.error('Usage: app-server-message-cli --model M --effort E --cwd PATH --message TEXT');
    Deno.exit(2);
  }
  Deno.exit(await sendAppServerMessage({ model, effort, cwd, profile }, message));
}
