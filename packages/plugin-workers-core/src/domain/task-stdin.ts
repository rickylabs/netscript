/** JSON data accepted by a task's stdin channel (finite numbers and plain objects only). */
export type TaskStdinJson =
  | null
  | boolean
  | number
  | string
  | readonly TaskStdinJson[]
  | { readonly [key: string]: TaskStdinJson };

/** Bytes or JSON written once to subprocess stdin, then closed; maximum 1 MiB. */
export type TaskStdin = Uint8Array | TaskStdinJson;
