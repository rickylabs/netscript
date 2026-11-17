/** State and relationship attributes emitted by interactive component machines. */
export interface MachineDataAttributes {
  /** Identifier of the element controlled by this part. */
  'data-controls'?: string;
  /** Presence marks an unavailable part. */
  'data-disabled'?: string;
  /** Current expanded state exposed to styling. */
  'data-expanded'?: string;
  /** Presence marks the focused part. */
  'data-focus'?: string;
  /** Presence marks the highlighted collection item. */
  'data-highlighted'?: string;
  /** Resolved horizontal or vertical orientation. */
  'data-orientation'?: string;
  /** Stable component part identity. */
  'data-part'?: string;
  /** Resolved floating-surface placement. */
  'data-placement'?: string;
  /** Owning interactive component scope. */
  'data-scope'?: string;
  /** Presence marks a selected item. */
  'data-selected'?: string;
  /** Resolved machine state exposed to styling. */
  'data-state'?: string;
  /** Associated collection item value. */
  'data-value'?: string;
}
