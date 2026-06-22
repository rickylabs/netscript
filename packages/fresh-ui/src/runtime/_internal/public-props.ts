/** Renderable child value accepted by the public interactive component props. */
export type FreshUiChild = object | string | number | bigint | boolean | null | undefined;

/** Renderable children accepted by the public interactive component props. */
export type FreshUiChildren = FreshUiChild | readonly FreshUiChild[];

/** Public event handler shape for pass-through DOM attributes. */
export type FreshUiEventHandler<TEvent extends Event = Event> = (event: TEvent) => void;

/** Public style value accepted by pass-through DOM attributes. */
export type FreshUiStyle =
  | string
  | Partial<Record<string, string | number | null | undefined>>;

/** Public attribute value accepted by pass-through DOM attributes. */
export type FreshUiAttributeValue =
  | FreshUiChildren
  | FreshUiEventHandler
  | FreshUiStyle
  | readonly string[];

/** Public pass-through DOM props shared by interactive components. */
export type FreshUiElementProps = {
  /** CSS class name forwarded to the rendered element. */
  class?: string;
  /** JSX-compatible CSS class name forwarded to the rendered element. */
  className?: string;
  /** Element identifier forwarded to the rendered element. */
  id?: string;
  /** ARIA or semantic role forwarded to the rendered element. */
  role?: string;
  /** Inline style forwarded to the rendered element. */
  style?: FreshUiStyle;
  /** Keyboard tab order forwarded to the rendered element. */
  tabIndex?: number;
  /** Advisory title forwarded to the rendered element. */
  title?: string;
  /** Additional DOM, data, ARIA, and event attributes forwarded to the rendered element. */
  [attribute: string]: FreshUiAttributeValue;
};
