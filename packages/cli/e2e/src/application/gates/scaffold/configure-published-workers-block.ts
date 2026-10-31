import { resolve } from '@std/path';

/** Source-relative service export used by both the local import map and launch validation. */
export const workersServiceSource = 'plugins/workers/services/src/main.ts';

/** Rewrites a published workers block to use the flow-B config and dependency-age bypass. */
export function configurePublishedWorkersBlock(workersBlock: string): string {
  const configuredBlock = configureWorkersDenoConfig(workersBlock);

  return configuredBlock.includes("'--minimum-dependency-age=0'")
    ? configuredBlock
    : configuredBlock.replace(
      /(\[\s*(?:'run'|"run")\s*,)/,
      "$1 '--minimum-dependency-age=0',",
    );
}

/** Preserve a generated local service path or resolve the legacy published launch through its alias. */
export function configureLocalWorkersBlock(
  workersBlock: string,
  sourceRoot: string,
  resolveServicePath: typeof resolve = resolve,
): string {
  const serviceEntrypoint = resolveServicePath(sourceRoot, workersServiceSource);
  const configuredBlock = configureWorkersDenoConfig(workersBlock).replace(
    /(['"])jsr:@netscript\/plugin-workers@[^'"]+\/services\1/,
    "'@netscript/plugin-workers/services'",
  );
  const entrypoints = [
    "'@netscript/plugin-workers/services'",
    '"@netscript/plugin-workers/services"',
    JSON.stringify(serviceEntrypoint),
    `'${serviceEntrypoint.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`,
  ];
  if (!entrypoints.some((entrypoint) => configuredBlock.includes(entrypoint))) {
    throw new Error('workers-api resource did not contain the expected service entrypoint');
  }
  return configuredBlock;
}

/** Change only the config value across compact and formatted Deno argument arrays. */
function configureWorkersDenoConfig(workersBlock: string): string {
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

  return configuredBlock;
}
