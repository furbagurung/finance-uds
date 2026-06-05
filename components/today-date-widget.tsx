import { CalendarDays } from "lucide-react";
import NepaliDate from "nepali-date-converter";

const NEPAL_TIME_ZONE = "Asia/Kathmandu";

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

const NEPALI_MONTHS = [
  "बैशाख",
  "जेठ",
  "असार",
  "साउन",
  "भदौ",
  "असोज",
  "कार्तिक",
  "मंसिर",
  "पुष",
  "माघ",
  "फागुन",
  "चैत",
];

const NEPALI_WEEKDAYS = [
  "आइतबार",
  "सोमबार",
  "मंगलबार",
  "बुधबार",
  "बिहीबार",
  "शुक्रबार",
  "शनिबार",
];

function toNepaliNumerals(value: string | number) {
  return String(value).replace(/\d/g, (digit) => NEPALI_DIGITS[Number(digit)]);
}

function formatAdDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
    timeZone: NEPAL_TIME_ZONE,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("day")} ${getPart("month")} ${getPart("year")}, ${getPart(
    "weekday",
  )}`;
}

function getBsDateDetails(date: Date) {
  try {
    const bsDate = NepaliDate.fromAD(date);
    const bsYear = bsDate.getYear();
    const bsMonthIndex = bsDate.getMonth();
    const bsDay = bsDate.getDate();
    const bsWeekdayIndex = bsDate.getDay();

    return {
      bsDate: `${toNepaliNumerals(bsYear)} ${NEPALI_MONTHS[bsMonthIndex]} ${toNepaliNumerals(
        bsDay,
      )}, ${NEPALI_WEEKDAYS[bsWeekdayIndex]}`,
    };
  } catch {
    return {
      bsDate: "BS date unavailable",
    };
  }
}

export function TodayDateWidget() {
  const today = new Date();
  const { bsDate } = getBsDateDetails(today);

  return (
    <section
      aria-label="Today"
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm sm:w-auto sm:min-w-[230px] dark:border-white/10 dark:bg-slate-900/80"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-orange-50 p-2 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Today
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
            {formatAdDate(today)}
          </p>
          <p className="font-nepali mt-0.5 text-base font-semibold leading-6 text-orange-700 dark:text-orange-300">
            {bsDate}
          </p>
        </div>
      </div>
    </section>
  );
}
