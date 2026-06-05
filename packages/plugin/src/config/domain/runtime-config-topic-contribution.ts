/** Runtime config topic contributed by a plugin. */
export interface RuntimeConfigTopicContribution {
  /** Runtime config topic name. */
  readonly name: string;
  /** Optional path to the JSON schema for this topic. */
  readonly schemaPath?: string;
}
