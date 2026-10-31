"use client";

import { useState } from "react";
import MaterialIcon from "./MaterialIcon";

interface BrewCalendarProps {
  brewDates: string[];
}

const DAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export default function BrewCalendar({ brewDates }: BrewCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const brewDaySet = new Set(
    brewDates.map((d) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goBack = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goForward = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const hasBrew = (day: number) => brewDaySet.has(`${year}-${month}-${day}`);

  return (
    <div className="rounded-2xl bg-surface border border-espresso/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goBack}
          aria-label="الشهر السابق"
          className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk text-espresso/70"
        >
          <MaterialIcon icon="chevron_right" />
        </button>
        <h3 className="font-display text-lg">
          {MONTHS[month]} {year}
        </h3>
        <button
          onClick={goForward}
          aria-label="الشهر التالي"
          className="size-10 rounded-full flex items-center justify-center hover:bg-oat-milk text-espresso/70"
        >
          <MaterialIcon icon="chevron_left" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-espresso/60 py-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center py-0.5">
            {day !== null && (
              <span
                className={`size-9 flex items-center justify-center text-sm rounded-full tabular-nums ${
                  hasBrew(day) ? "bg-primary text-on-primary font-bold" : "text-espresso/70"
                } ${isToday(day) ? "ring-2 ring-crema font-bold" : ""}`}
              >
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
