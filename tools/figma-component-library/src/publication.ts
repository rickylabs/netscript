/** Write an already fully validated flat output set, refusing existing destinations and rolling back IO failure. */
export async function writePublication(
  output: string,
  files: Readonly<Record<string, string>>,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const names = Object.keys(files);
  if (
    !names.length ||
    names.some((name) => !/^[a-z][a-z0-9.-]*\.(?:json|ts)$/.test(name) || name.includes('..'))
  ) {
    throw new Error('Invalid publication filenames');
  }
  // Nonrecursive mkdir fails atomically on an existing file/directory/link; never overwrite it.
  await Deno.mkdir(output);
  try {
    for (const name of names.sort()) {
      signal.throwIfAborted();
      await Deno.writeTextFile(`${output}/${name}`, files[name], { createNew: true });
    }
  } catch (error) {
    await Deno.remove(output, { recursive: true });
    throw error;
  }
}
