import { createContext } from 'preact';
import type { ComponentChildren } from 'preact';
import { useContext } from 'preact/hooks';
import { useCombobox } from './use-combobox.ts';
import type {
  ComboboxContentProps,
  ComboboxEmptyProps,
  ComboboxInputProps,
  ComboboxItemProps,
  ComboboxRootProps,
  UseComboboxReturn,
} from './combobox.types.ts';

const ComboboxContext = createContext<UseComboboxReturn | null>(null);

function useComboboxContext(partName: string): UseComboboxReturn {
  const context = useContext(ComboboxContext);
  if (context === null) {
    throw new Error(`${partName} must be used within <Combobox.Root>`);
  }
  return context;
}

function ComboboxRoot({ children, ...options }: ComboboxRootProps): preact.VNode {
  const combobox = useCombobox(options);
  return (
    <ComboboxContext.Provider value={combobox}>
      <div {...combobox.getRootProps()}>{children as ComponentChildren}</div>
    </ComboboxContext.Provider>
  );
}

function ComboboxInput(props: ComboboxInputProps): preact.VNode {
  const combobox = useComboboxContext('Combobox.Input');
  return <input {...combobox.getInputProps(props)} />;
}

function ComboboxContent({ children, ...props }: ComboboxContentProps): preact.VNode {
  const combobox = useComboboxContext('Combobox.Content');
  return <div {...combobox.getContentProps(props)}>{children as ComponentChildren}</div>;
}

function ComboboxItem({ children, value, ...props }: ComboboxItemProps): preact.VNode {
  const combobox = useComboboxContext('Combobox.Item');
  return <div {...combobox.getItemProps(value, props)}>{children as ComponentChildren}</div>;
}

function ComboboxEmpty({ children, ...props }: ComboboxEmptyProps): preact.VNode {
  return (
    <div data-part='empty' data-scope='combobox' {...props}>{children as ComponentChildren}</div>
  );
}

/** Public compound combobox parts and their exact prop/result signatures. */
export type ComboboxNamespace = Readonly<{
  Root: (props: ComboboxRootProps) => preact.VNode;
  Input: (props: ComboboxInputProps) => preact.VNode;
  Content: (props: ComboboxContentProps) => preact.VNode;
  Item: (props: ComboboxItemProps) => preact.VNode;
  Empty: (props: ComboboxEmptyProps) => preact.VNode;
}>;

/** Compound accessible combobox with controlled or uncontrolled selection. */
export const Combobox: ComboboxNamespace = {
  Root: ComboboxRoot,
  Input: ComboboxInput,
  Content: ComboboxContent,
  Item: ComboboxItem,
  Empty: ComboboxEmpty,
};
