"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import { format, isValid, parse } from "date-fns";
import { useMemo, useState } from "react";
import type { KeyboardEventHandler } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerFieldProps = {
  id: string;
  name: string;
  autoFocus?: boolean;
  disabled?: boolean;
  inputClassName?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onValueChange?: (value: string) => void;
  required?: boolean;
  value?: string;
};

const DATE_FORMATS = ["yyyy-MM-dd", "M/d/yyyy", "M/d/yy"] as const;

function parseEnteredDate(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  for (const dateFormat of DATE_FORMATS) {
    const parsed = parse(trimmedValue, dateFormat, new Date());

    if (isValid(parsed) && format(parsed, dateFormat) === trimmedValue) {
      return parsed;
    }
  }

  return undefined;
}

export function DatePickerField({
  id,
  name,
  autoFocus = false,
  disabled = false,
  inputClassName,
  onKeyDown,
  onValueChange,
  required = true,
  value,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const [month, setMonth] = useState(new Date());
  const fieldValue = value ?? internalValue;
  const selectedDate = useMemo(() => parseEnteredDate(fieldValue), [fieldValue]);

  function setFieldValue(nextValue: string) {
    if (onValueChange) {
      onValueChange(nextValue);
      return;
    }

    setInternalValue(nextValue);
  }

  function handleInputBlur() {
    if (selectedDate) {
      setFieldValue(format(selectedDate, "yyyy-MM-dd"));
      setMonth(selectedDate);
    }
  }

  return (
    <div className="grid gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <div className="flex">
          <Input
            id={id}
            name={name}
            autoFocus={autoFocus}
            value={fieldValue}
            disabled={disabled}
            onChange={(event) => setFieldValue(event.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={onKeyDown}
            placeholder="YYYY-MM-DD"
            inputMode="numeric"
            autoComplete="off"
            required={required}
            aria-invalid={fieldValue !== "" && !selectedDate}
            className={inputClassName ?? "rounded-none border-r-0 font-mono tabular-nums"}
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              aria-label="Choose date"
              className="h-9 w-9 rounded-none border-[var(--border)] bg-[var(--background)] p-0 shadow-none hover:bg-[var(--muted)]"
              onClick={() => {
                if (selectedDate) {
                  setMonth(selectedDate);
                }
              }}
            >
              <CalendarBlank className="size-4" weight="regular" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent align="start" className="w-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              setFieldValue(date ? format(date, "yyyy-MM-dd") : "");
              if (date) {
                setMonth(date);
              }
              if (date) {
                setOpen(false);
              }
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
