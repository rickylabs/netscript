import { createLockedViteCommand } from './vite-runtime.ts';

/** Start a Fresh Vite fixture server through the exact locked workspace toolchain. */
export function startLockedVite(cwd: string, port: number): Deno.ChildProcess {
  return createLockedViteCommand({
    args: [
      '--config',
      'vite.config.ts',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    cwd,
    stdout: 'null',
    stderr: 'null',
  }).spawn();
}

/** Run one command against the repository-provisioned Playwright CLI session. */
export async function runPlaywright(
  args: readonly string[],
  cwd: string,
  check = true,
): Promise<string> {
  let output: Deno.CommandOutput;
  try {
    output = await new Deno.Command('playwright-cli', {
      args: [...args],
      cwd,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
  } catch (error) {
    if (!check && error instanceof Deno.errors.NotFound) return '';
    throw error;
  }

  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);

  if (check && (!output.success || stdout.startsWith('### Error'))) {
    throw new Error(
      `playwright-cli ${args.join(' ')} failed (${output.code})\n${stdout}\n${stderr}`,
    );
  }

  return stdout;
}

/** Reserve and release an ephemeral loopback port for a browser fixture. */
export function reservePort(): number {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const { port } = listener.addr as Deno.NetAddr;
  listener.close();
  return port;
}

/** Wait until a Vite fixture responds or report its early process exit. */
export async function waitForServer(url: string, child: Deno.ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const status = await Promise.race([
      child.status,
      new Promise<undefined>((resolve) => setTimeout(resolve, 50)),
    ]);
    if (status) {
      throw new Error(`Vite browser fixture exited before startup (${status.code})`);
    }

    try {
      const response = await fetch(url);
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // The server has not bound its port yet.
    }
  }

  throw new Error('Timed out waiting for the Vite browser fixture');
}

/** Stop a Vite fixture without failing when it exited before cleanup. */
export async function stopVite(child: Deno.ChildProcess): Promise<void> {
  try {
    child.kill('SIGTERM');
  } catch {
    // The fixture process already stopped; cleanup can continue.
  }
  await child.status;
}
