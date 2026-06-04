const INDIA_FISCAL_YEAR_PATTERN = /^FY\s+(\d{4})\/(\d{2})$/;
const CALENDAR_YEAR_PATTERN = /^\d{4}$/;

export type FiscalYearBranch = {
  fiscalYearType?: string | null;
  calendarSystem?: string | null;
} | null | undefined;

export type FiscalYearRange = {
  startDate: Date;
  endDate: Date;
};

function createUtcDate(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function getFiscalYearExclusiveEndDate(range: FiscalYearRange) {
  const exclusiveEndDate = new Date(range.endDate);
  exclusiveEndDate.setUTCDate(exclusiveEndDate.getUTCDate() + 1);

  return exclusiveEndDate;
}

function formatIndiaFiscalYear(startYear: number) {
  const endYearSuffix = String((startYear + 1) % 100).padStart(2, "0");

  return `FY ${startYear}/${endYearSuffix}`;
}

function getCalendarYearOptions() {
  const currentYear = new Date().getFullYear();

  return Array.from({ length: 4 }, (_, index) =>
    String(currentYear - 2 + index),
  );
}

function getCalendarYearRange(calendarYearLabel: string): FiscalYearRange {
  const year = Number(calendarYearLabel);

  return {
    startDate: createUtcDate(year, 0, 1),
    endDate: createUtcDate(year, 11, 31),
  };
}

export function getIndiaFiscalYearRange(
  fiscalYearLabel: string,
): FiscalYearRange {
  const match = fiscalYearLabel.trim().match(INDIA_FISCAL_YEAR_PATTERN);

  if (!match) {
    throw new Error(`Invalid India fiscal year label: ${fiscalYearLabel}`);
  }

  const startYear = Number(match[1]);
  const expectedEndYearSuffix = String((startYear + 1) % 100).padStart(2, "0");

  if (match[2] !== expectedEndYearSuffix) {
    throw new Error(`Invalid India fiscal year label: ${fiscalYearLabel}`);
  }

  return {
    // Database dates remain AD/Gregorian. These ranges should be used as AD
    // boundaries when a later phase wires fiscal-year filtering into queries.
    startDate: createUtcDate(startYear, 3, 1),
    endDate: createUtcDate(startYear + 1, 2, 31),
  };
}

export function getCurrentIndiaFiscalYear(today = new Date()) {
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const fiscalYearStart = monthIndex >= 3;
  const startYear = fiscalYearStart ? year : year - 1;

  return formatIndiaFiscalYear(startYear);
}

export function getNepalFiscalYearOptions() {
  return ["FY 2081/82", "FY 2082/83", "FY 2083/84", "FY 2084/85"];
}

export function getIndiaFiscalYearOptions() {
  return ["FY 2024/25", "FY 2025/26", "FY 2026/27", "FY 2027/28"];
}

export function getFiscalYearOptionsForBranch(branch: FiscalYearBranch) {
  if (branch?.fiscalYearType === "NEPAL_BS_FY") {
    return getNepalFiscalYearOptions();
  }

  if (branch?.fiscalYearType === "INDIA_AD_FY") {
    return getIndiaFiscalYearOptions();
  }

  return getCalendarYearOptions();
}

export function getFiscalYearDateRangeForBranch(
  fiscalYearLabel?: string,
  branch?: FiscalYearBranch,
): FiscalYearRange | null {
  const normalizedFiscalYearLabel = fiscalYearLabel?.trim();

  if (!normalizedFiscalYearLabel) {
    return null;
  }

  if (branch?.fiscalYearType === "NEPAL_BS_FY") {
    // TODO: Apply Nepal BS fiscal-year filtering only after adding a reliable
    // BS-to-AD conversion library or explicit BS FY to AD date mapping.
    // Persisted database dates remain AD/Gregorian.
    return null;
  }

  if (branch?.fiscalYearType === "CALENDAR_YEAR") {
    return CALENDAR_YEAR_PATTERN.test(normalizedFiscalYearLabel)
      ? getCalendarYearRange(normalizedFiscalYearLabel)
      : null;
  }

  if (
    branch?.fiscalYearType === "INDIA_AD_FY" ||
    branch?.fiscalYearType === undefined ||
    branch?.fiscalYearType === null
  ) {
    try {
      return getIndiaFiscalYearRange(normalizedFiscalYearLabel);
    } catch {
      return null;
    }
  }

  return null;
}

export function getFiscalYearLabelForDate(
  date: Date,
  branch: FiscalYearBranch,
) {
  if (branch?.fiscalYearType === "INDIA_AD_FY") {
    return getCurrentIndiaFiscalYear(date);
  }

  if (branch?.fiscalYearType === "NEPAL_BS_FY") {
    // TODO: Add exact BS fiscal-year labeling with a reliable Nepali date
    // library or explicit BS FY to AD date mapping. Persisted dates stay AD.
    return "BS FY pending";
  }

  return String(date.getFullYear());
}
