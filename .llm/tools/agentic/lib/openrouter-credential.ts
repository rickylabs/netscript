import { OPENCODE_TOOL } from '../config/versions.ts';

export type Environment = Readonly<Record<string, string | undefined>>;

/** Parses only the OpenRouter key assignment from a shell-style env file. */
export function parseOpenRouterApiKey(source: string): string | undefined {
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?OPENROUTER_API_KEY\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[1].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"')))
    ) {
      value = value.slice(1, -1);
    }
    return value || undefined;
  }
  return undefined;
}

/** Resolves the OpenRouter credential without logging or persisting its value. */
export async function resolveOpenRouterApiKey(
  env: Environment = Deno.env.toObject(),
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
): Promise<string> {
  if (env.OPENROUTER_API_KEY?.trim()) return env.OPENROUTER_API_KEY.trim();
  const home = env.HOME?.trim();
  if (!home) throw new Error('OPENROUTER_API_KEY is missing and HOME is unavailable');
  const path = `${home.replace(/\/$/, '')}/${OPENCODE_TOOL.openRouterEnvRelativePath}`;
  let source: string;
  try {
    source = await readTextFile(path);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`OPENROUTER_API_KEY is missing and ${path} could not be read: ${detail}`);
  }
  const key = parseOpenRouterApiKey(source);
  if (!key) throw new Error(`OPENROUTER_API_KEY is missing from ${path}`);
  return key;
}

/** Copies an environment and supplies its resolved OpenRouter credential. */
export async function environmentWithOpenRouterApiKey(
  env: Environment = Deno.env.toObject(),
  readTextFile: (path: string) => Promise<string> = Deno.readTextFile,
): Promise<Record<string, string>> {
  const result = Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  result.OPENROUTER_API_KEY = await resolveOpenRouterApiKey(env, readTextFile);
  return result;
}
