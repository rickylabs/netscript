/** Stream topic contributed by a plugin. */
export interface StreamTopicContribution {
  /** Logical topic name. */
  readonly name: string;
  /** Stream subject or routing key. */
  readonly subject: string;
}
