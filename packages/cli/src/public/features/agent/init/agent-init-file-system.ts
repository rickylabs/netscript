import { dirname } from "@std/path";

/** Filesystem operations consumed by the agent installer. */
export interface AgentInitFileSystem {
  readText(path: string): Promise<string | undefined>;
  writeText(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

/** Deno filesystem adapter used by the public CLI composition. */
export class DenoAgentInitFileSystem implements AgentInitFileSystem {
  async readText(path: string): Promise<string | undefined> {
    try {
      return await Deno.readTextFile(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return undefined;
      throw error;
    }
  }

  async writeText(path: string, content: string): Promise<void> {
    await Deno.mkdir(dirname(path), { recursive: true });
    await Deno.writeTextFile(path, content);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return false;
      throw error;
    }
  }
}
