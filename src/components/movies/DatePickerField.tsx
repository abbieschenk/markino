"use client";

import { CalendarBlank } from "@phosphor-icons/react";
import { format, isValid, parse } from "date-fns";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerFieldProps = {
  id: string;
  name: string;
  required?: boolean;
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
  required = true,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [month, setMonth] = useState(new Date());
  const selectedDate = useMemo(() => parseEnteredDate(value), [value]);

  function handleInputBlur() {
    if (selectedDate) {
      setValue(format(selectedDate, "yyyy-MM-dd"));
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
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={handleInputBlur}
            placeholder="YYYY-MM-DD"
            inputMode="numeric"
            autoComplete="off"
            required={required}
            aria-invalid={value !== "" && !selectedDate}
            className="rounded-none border-r-0 font-mono tabular-nums"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
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
              setValue(date ? format(date, "yyyy-MM-dd") : "");
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
