import * as combobox from "@zag-js/combobox";
import { normalizeProps, useMachine } from "@zag-js/preact";
import { useId, useMemo } from "preact/hooks";

interface City {
  label: string;
  value: string;
}

const cities: City[] = [
  { label: "Basel", value: "basel" },
  { label: "Bern", value: "bern" },
  { label: "Lausanne", value: "lausanne" },
  { label: "Zurich", value: "zurich" },
];

export default function ZagComboboxSpike() {
  const id = useId();
  const collection = useMemo(
    () =>
      combobox.collection<City>({
        items: cities,
        itemToString: (item: City) => item.label,
        itemToValue: (item: City) => item.value,
      }),
    [],
  );
  const service = useMachine(combobox.machine, {
    id,
    collection,
    defaultValue: ["zurich"],
  });
  const api = combobox.connect(service, normalizeProps);

  return (
    <section {...api.getRootProps()} aria-label="City selector">
      <label {...api.getLabelProps()}>City</label>
      <div {...api.getControlProps()}>
        <input {...api.getInputProps()} />
        <button {...api.getTriggerProps()}>Toggle cities</button>
      </div>
      <div {...api.getPositionerProps()}>
        <ul {...api.getContentProps()}>
          {api.collection.items.map((item) => (
            <li
              key={item.value}
              {...api.getItemProps({ item })}
              data-testid={`city-${item.value}`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      <output id="selected-city">{api.valueAsString || "none"}</output>
    </section>
  );
}
