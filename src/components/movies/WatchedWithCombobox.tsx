"use client";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";

type WatchedWithComboboxProps = {
  id: string;
  name: string;
  options: string[];
  portalContainer?: HTMLElement | null;
  value: string[];
  onValueChange: (value: string[]) => void;
};

export function WatchedWithCombobox({
  id,
  name,
  options,
  portalContainer,
  value,
  onValueChange,
}: WatchedWithComboboxProps) {
  return (
    <>
      {value.map((selected) => (
        <input key={selected} type="hidden" name={name} value={selected} />
      ))}
      <Combobox
        items={options}
        multiple
        value={value}
        onValueChange={onValueChange}
      >
        <ComboboxChips
          id={id}
          className="min-h-9 rounded-none border-[var(--border)] bg-[var(--background)] px-2 py-1 shadow-none"
        >
          <ComboboxValue>
            {value.map((item) => (
              <ComboboxChip key={item}>{item}</ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput />
        </ComboboxChips>
        <ComboboxContent
          container={portalContainer}
          className="min-w-(--anchor-width) rounded-none border border-[var(--border)]"
        >
          <ComboboxEmpty>No handles found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </>
  );
}
