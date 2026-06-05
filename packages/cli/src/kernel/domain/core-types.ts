/**
 * Mode-agnostic primitive types for CLI workflows.
 */

/** Success-or-failure result returned by pure planning helpers. */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/** JSON primitive value. */
export type JsonPrimitive = string | number | boolean | null;

/** JSON object value. */
export type JsonObject = { readonly [key: string]: JsonValue };

/** JSON array value. */
export type JsonArray = readonly JsonValue[];

/** JSON-compatible value. */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** Repository-relative or absolute filesystem path. */
export type Path = string;

/**
 * Options for a single scaffold operation.
 */
export interface ScaffoldOptions {
  /** Absolute path to the template directory to walk. */
  readonly templatePath: string;

  /** Absolute path to the target output directory. */
  readonly targetPath: string;

  /** Template variables available for rendering. */
  readonly variables: Record<string, string>;

  /** Whether to overwrite existing files. */
  readonly overwrite?: boolean;

  /** Glob patterns for files to skip during scaffolding. */
  readonly ignore?: readonly string[];

  /** Whether to create the target directory if it does not exist. */
  readonly createTargetDir?: boolean;
}

/**
 * Result of a scaffold operation.
 */
export interface ScaffoldResult {
  /** Absolute paths of files created during scaffolding. */
  readonly filesCreated: string[];

  /** Absolute paths of directories created during scaffolding. */
  readonly directoriesCreated: string[];

  /** Absolute paths of files skipped because they already existed. */
  readonly filesSkipped: string[];

  /** Total number of filesystem operations performed. */
  readonly totalOperations: number;

  /** Duration of the scaffold operation in milliseconds. */
  readonly durationMs: number;
}

/** Metadata returned by filesystem stat operations. */
export interface FileInfo {
  /** Whether the path is a regular file. */
  readonly isFile: boolean;

  /** Whether the path is a directory. */
  readonly isDirectory: boolean;
}

/** Entry returned by non-recursive directory reads. */
export interface DirEntry {
  /** Basename of the entry. */
  readonly name: string;

  /** Whether the entry is a regular file. */
  readonly isFile: boolean;

  /** Whether the entry is a directory. */
  readonly isDirectory: boolean;
}

/** Entry yielded by recursive directory walks. */
export interface WalkEntry {
  /** Full path to the entry. */
  readonly path: string;

  /** Basename of the entry. */
  readonly name: string;

  /** Whether the entry is a regular file. */
  readonly isFile: boolean;

  /** Whether the entry is a directory. */
  readonly isDirectory: boolean;
}

/** A single filesystem operation recorded during dry-run. */
export interface DryRunOperation {
  /** Type of operation that would be performed. */
  readonly type: 'write' | 'mkdir' | 'copy' | 'remove';

  /** Absolute path of the target. */
  readonly path: string;

  /** Optional content for write operations. */
  readonly content?: string;
}
