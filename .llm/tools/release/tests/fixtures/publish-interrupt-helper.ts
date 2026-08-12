import { type PublishMode, publishWorkspace } from '../../publish-workspace.ts';

const [modeArgument, sourceRoot, handshakePath] = Deno.args;
if (!modeArgument || !sourceRoot || !handshakePath) {
  throw new Error('Expected <mode> <source-root> <handshake-path>.');
}

const mode = parseMode(modeArgument);
await publishWorkspace({
  mode,
  root: sourceRoot,
  commandRunner: async (request) => {
    const handshake = {
      args: request.args,
      cwd: request.cwd,
      serviceManifest: await Deno.readTextFile(
        `${request.cwd}/packages/service/deno.json`,
      ),
    };
    const temporaryPath = `${handshakePath}.tmp`;
    await Deno.writeTextFile(temporaryPath, JSON.stringify(handshake));
    await Deno.rename(temporaryPath, handshakePath);
    const interruptLatch = new Int32Array(new SharedArrayBuffer(4));
    Atomics.wait(interruptLatch, 0, 0);
    throw new Error('Interrupt helper resumed unexpectedly.');
  },
});

function parseMode(value: string): PublishMode {
  if (value === 'publish' || value === 'preflight') {
    return value;
  }
  throw new Error(`Unsupported publish mode: ${value}`);
}
