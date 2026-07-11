"use client";

import * as React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "grid grid-cols-[2rem_minmax(9rem,1fr)_2rem] items-center gap-x-1 gap-y-4",
        month_caption:
          "col-start-2 flex h-8 items-center justify-center text-sm font-medium",
        caption_label: "min-w-32 text-center text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous:
          "col-start-1 inline-flex size-8 items-center justify-center border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        button_next:
          "col-start-3 inline-flex size-8 items-center justify-center border border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        month_grid: "col-span-3 w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "w-9 text-[0.8rem] font-normal text-[var(--muted-foreground)]",
        week: "mt-2 flex w-full",
        day: "size-9 p-0 text-center text-sm",
        day_button:
          "inline-flex size-9 items-center justify-center border border-transparent text-sm outline-none hover:border-[var(--border)] hover:bg-[var(--muted)] focus-visible:border-[var(--foreground)]",
        selected:
          "[&>button]:border-[var(--foreground)] [&>button]:bg-[var(--foreground)] [&>button]:text-[var(--background)]",
        today: "[&>button]:border-[var(--border)] [&>button]:font-medium",
        outside:
          "text-[var(--muted-foreground)] opacity-50 [&>button]:text-[var(--muted-foreground)]",
        disabled: "opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) =>
          orientation === "left" ? (
            <CaretLeft
              className={cn("size-4", iconClassName)}
              weight="regular"
              {...iconProps}
            />
          ) : (
            <CaretRight
              className={cn("size-4", iconClassName)}
              weight="regular"
              {...iconProps}
            />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
