import { createContext } from 'preact';
import type { ComponentChildren, VNode } from 'preact';
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

function ComboboxRoot({ children, ...options }: ComboboxRootProps): VNode {
  const combobox = useCombobox(options);
  return (
    <ComboboxContext.Provider value={combobox}>
      <div {...combobox.getRootProps()}>{children as ComponentChildren}</div>
    </ComboboxContext.Provider>
  );
}

function ComboboxInput(props: ComboboxInputProps): VNode {
  const combobox = useComboboxContext('Combobox.Input');
  return <input {...combobox.getInputProps(props)} />;
}

function ComboboxContent({ children, ...props }: ComboboxContentProps): VNode {
  const combobox = useComboboxContext('Combobox.Content');
  return <div {...combobox.getContentProps(props)}>{children as ComponentChildren}</div>;
}

function ComboboxItem({ children, value, ...props }: ComboboxItemProps): VNode {
  const combobox = useComboboxContext('Combobox.Item');
  return <div {...combobox.getItemProps(value, props)}>{children as ComponentChildren}</div>;
}

function ComboboxEmpty({ children, ...props }: ComboboxEmptyProps): VNode {
  return <div data-part='empty' {...props}>{children as ComponentChildren}</div>;
}

export type ComboboxNamespace = Readonly<{
  Root: (props: ComboboxRootProps) => VNode;
  Input: (props: ComboboxInputProps) => VNode;
  Content: (props: ComboboxContentProps) => VNode;
  Item: (props: ComboboxItemProps) => VNode;
  Empty: (props: ComboboxEmptyProps) => VNode;
}>;

export const Combobox: ComboboxNamespace = {
  Root: ComboboxRoot,
  Input: ComboboxInput,
  Content: ComboboxContent,
  Item: ComboboxItem,
  Empty: ComboboxEmpty,
};
