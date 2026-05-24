"use client";

import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerFieldProps = {
  id: string;
  name: string;
};

function parseStoredDate(value: string) {
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function DatePickerField({ id, name }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const selectedDate = useMemo(() => parseStoredDate(value), [value]);

  return (
    <div className="grid gap-1.5">
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "h-9 justify-start rounded-none border-[var(--border)] bg-[var(--background)] px-3 text-left text-sm font-normal shadow-none hover:bg-[var(--background)]",
              !selectedDate && "text-[var(--muted-foreground)]",
            )}
          >
            <CalendarIcon className="size-4" />
            {selectedDate ? format(selectedDate, "PPP") : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setValue(date ? format(date, "yyyy-MM-dd") : "");
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
