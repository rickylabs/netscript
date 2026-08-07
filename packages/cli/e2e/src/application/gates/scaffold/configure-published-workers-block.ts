/** Rewrites a published workers block to use the flow-B config and dependency-age bypass. */
export function configurePublishedWorkersBlock(workersBlock: string): string {
  const configuredBlock = workersBlock.replace(
    /((?:'--config'|"--config")\s*,\s*)(?:'deno\.json'|"deno\.json")/,
    "$1'.netscript-flow-b-deno.json'",
  );
  if (
    configuredBlock === workersBlock &&
    !/(?:'--config'|"--config")\s*,\s*(?:'\.netscript-flow-b-deno\.json'|"\.netscript-flow-b-deno\.json")/
      .test(workersBlock)
  ) {
    throw new Error('workers-api resource did not contain the expected Deno config argument');
  }

  return configuredBlock.includes("'--minimum-dependency-age=0'")
    ? configuredBlock
    : configuredBlock.replace(
      /(\[\s*(?:'run'|"run")\s*,)/,
      "$1 '--minimum-dependency-age=0',",
    );
}
