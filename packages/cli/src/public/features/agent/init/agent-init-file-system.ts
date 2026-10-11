import { dirname } from '@std/path';
import type { ClaudeSkillMirrorFileSystem } from './hosts/claude-skill-mirrors.ts';

/** Filesystem operations consumed by the agent installer. */
export interface AgentInitFileSystem extends ClaudeSkillMirrorFileSystem {
  readText(path: string): Promise<string | undefined>;
  writeText(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

/** Deno filesystem adapter used by the public CLI composition. */
export class DenoAgentInitFileSystem implements AgentInitFileSystem {
  async entryKind(path: string): Promise<'file' | 'directory' | 'other' | undefined> {
    try {
      const info = await Deno.lstat(path);
      return info.isSymlink
        ? 'other'
        : info.isDirectory
        ? 'directory'
        : info.isFile
        ? 'file'
        : 'other';
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return undefined;
      throw error;
    }
  }

  entries(path: string): AsyncIterable<Deno.DirEntry> {
    return Deno.readDir(path);
  }

  async filesEqual(left: string, right: string): Promise<boolean> {
    using a = await Deno.open(left);
    using b = await Deno.open(right);
    if ((await a.stat()).size !== (await b.stat()).size) return false;
    const aBuffer = new Uint8Array(64 * 1024);
    const bBuffer = new Uint8Array(aBuffer.length);
    while (true) {
      const aSize = await readChunk(a, aBuffer);
      const bSize = await readChunk(b, bBuffer);
      if (aSize !== bSize) return false;
      for (let index = 0; index < aSize; index++) {
        if (aBuffer[index] !== bBuffer[index]) return false;
      }
      if (aSize === 0) return true;
    }
  }

  async removeDirectory(path: string): Promise<void> {
    await Deno.remove(path, { recursive: true });
  }

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

async function readChunk(file: Deno.FsFile, buffer: Uint8Array): Promise<number> {
  let size = 0;
  while (size < buffer.length) {
    const read = await file.read(buffer.subarray(size));
    if (read === null) break;
    size += read;
  }
  return size;
}
