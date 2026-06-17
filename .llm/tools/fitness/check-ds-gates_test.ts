Deno.test('ds no raw hex gate fails on a fixture raw color', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-ds-raw-hex-' });
  try {
    await Deno.writeTextFile(`${root}/bad.css`, '.bad { color: #fff; }\n');
    const result = await runGate('check-ds-no-raw-hex.ts', root);
    if (result.code === 0) {
      throw new Error('Expected ds-no-raw-hex to fail for a raw hex fixture.');
    }
    if (!result.output.includes('ds-no-raw-hex: FAIL')) {
      throw new Error(`Expected failure output, got:\n${result.output}`);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('ds color utilities gate fails on a fixture stock palette utility', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-ds-color-utility-' });
  try {
    await Deno.writeTextFile(
      `${root}/bad.tsx`,
      "export const Bad = () => <div class='bg-red-500' />;\n",
    );
    const result = await runGate('check-ds-color-utilities.ts', root);
    if (result.code === 0) {
      throw new Error('Expected ds-color-utilities to fail for a stock color utility fixture.');
    }
    if (!result.output.includes('ds-color-utilities: FAIL')) {
      throw new Error(`Expected failure output, got:\n${result.output}`);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

async function runGate(
  scriptName: string,
  root: string,
): Promise<{ code: number; output: string }> {
  const script = new URL(`./${scriptName}`, import.meta.url).href;
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '--allow-read', script, '--root', root],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: result.code,
    output: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
  };
}
