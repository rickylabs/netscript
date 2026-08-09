const [projectRoot, appName] = Deno.args;
if (!projectRoot || !appName) {
  throw new Error('generated project root and app name are required');
}

const port = 5199;
const appRoot = `${projectRoot}/apps/${appName}`;
const child = new Deno.Command(Deno.execPath(), {
  args: [
    'task',
    '--cwd',
    appRoot,
    'dev',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  cwd: projectRoot,
  stdin: 'null',
  stdout: 'inherit',
  stderr: 'inherit',
}).spawn();

async function stopChild(): Promise<void> {
  try {
    child.kill('SIGTERM');
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  await child.status.catch(() => undefined);
}

try {
  const deadline = Date.now() + 60_000;
  let lastError = 'server did not answer';
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) {
        console.info(`Fresh dev server answered ${response.status} with hostile parent tsconfig`);
        ready = true;
        break;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (ready) {
    // The finally block owns process cleanup before this probe returns success.
  } else {
    const status = await Promise.race([
      child.status,
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 50)),
    ]);
    throw new Error(
      `Fresh dev server failed under hostile parent tsconfig: ${lastError}; status=${
        status?.code ?? 'running'
      }`,
    );
  }
} finally {
  await stopChild();
}
