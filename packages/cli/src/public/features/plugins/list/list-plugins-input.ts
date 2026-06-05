/** Parsed options accepted by `netscript plugin list`. */
export interface ListPluginsInput {
  readonly projectRoot?: string;
}

/** One rendered plugin list row. */
export interface PluginListEntry {
  readonly name: string;
  readonly displayName: string;
  readonly type: string;
  readonly enabled: boolean;
  readonly workdir: string;
  readonly service: string;
  readonly port: string;
  readonly contributionAxis: string;
  readonly contributions: number;
}
