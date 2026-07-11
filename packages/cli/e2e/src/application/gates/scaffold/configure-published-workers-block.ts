/** Rewrites a published workers block to use the flow-B config and dependency-age bypass. */
export function configurePublishedWorkersBlock(workersBlock: string): string {
  const configuredBlock = workersBlock.replace(
    "'--config', 'deno.json'",
    "'--config', '.netscript-flow-b-deno.json'",
  );

  return configuredBlock.includes("'--minimum-dependency-age=0'")
    ? configuredBlock
    : configuredBlock.replace(
      "['run',",
      "['run', '--minimum-dependency-age=0',",
    );
}
