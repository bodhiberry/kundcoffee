import NepaliDate from "nepali-date-converter";

// Nepali month names in both languages
const NEPALI_MONTHS_EN = [
  "Baisakh", "Jestha", "Ashar", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
];

const NEPALI_MONTHS_NP = [
  "बैशाख", "जेठ", "असार", "श्रावण", "भाद्र", "आश्विन",
  "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुन", "चैत्र",
];

const NEPALI_DAYS_NP = [
  "आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार",
];

const NEPALI_DIGITS: Record<string, string> = {
  "0": "०", "1": "१", "2": "२", "3": "३", "4": "४",
  "5": "५", "6": "६", "7": "७", "8": "८", "9": "९",
};

/**
 * Convert a number to Nepali (Devanagari) digits
 */
export function toNepaliDigits(num: number | string): string {
  return String(num).replace(/[0-9]/g, (d) => NEPALI_DIGITS[d] || d);
}

/**
 * Get BS date components from a JS Date.
 */
export function getBSDate(date?: Date) {
  const d = date ? new NepaliDate(date) : new NepaliDate();
  return {
    year: d.getYear(),
    month: d.getMonth(),       // 0-indexed
    day: d.getDate(),
    monthNameEn: NEPALI_MONTHS_EN[d.getMonth()],
    monthNameNp: NEPALI_MONTHS_NP[d.getMonth()],
    dayNameNp: NEPALI_DAYS_NP[d.toJsDate().getDay()],
  };
}

/**
 * Get the Nepali fiscal year suffix for the invoice.
 * The Nepali fiscal year starts on Shrawan 1 (month index 3).
 * For BS year 2083 in the Shrawan-onward half, the fiscal year is 2083/84 → "8384".
 * For BS year 2084 in the Baisakh-Ashar half (month 0-2), the fiscal year is still 2083/84 → "8384".
 */
export function getFiscalYearSuffix(date?: Date): string {
  const bs = getBSDate(date);
  let fyStartYear: number;

  if (bs.month >= 3) {
    // Shrawan (3) through Chaitra (11) → fiscal year starts this BS year
    fyStartYear = bs.year;
  } else {
    // Baisakh (0) through Ashar (2) → fiscal year started last BS year
    fyStartYear = bs.year - 1;
  }

  const fyEndYear = fyStartYear + 1;
  // Take last 2 digits of each year
  const startSuffix = String(fyStartYear).slice(-2);
  const endSuffix = String(fyEndYear).slice(-2);
  return `${startSuffix}${endSuffix}`;
}

/**
 * Get the AD date of the start of the current Nepali fiscal year.
 * Nepali fiscal year starts on Shrawan 1.
 */
export function getFiscalYearStartAD(date?: Date): Date {
  const bs = getBSDate(date);
  let fyStartYear: number;

  if (bs.month >= 3) {
    fyStartYear = bs.year;
  } else {
    fyStartYear = bs.year - 1;
  }

  // Shrawan 1 of the fiscal year start
  const shrawan1 = new NepaliDate(fyStartYear, 3, 1);
  const jsDate = shrawan1.toJsDate();
  // Normalize to start of day in Nepal timezone (UTC+5:45)
  // Set to midnight UTC of that date
  jsDate.setUTCHours(0, 0, 0, 0);
  return jsDate;
}

/**
 * Format an invoice number with the custom format: INV{branchCode}{fiscalYear}-{number}
 * Example: INVGB8384-001
 */
export function formatInvoiceNumber(
  invoiceNumber: number,
  branchCode: string = "GB",
  date?: Date,
): string {
  const fySuffix = getFiscalYearSuffix(date);
  const paddedNumber = String(invoiceNumber).padStart(3, "0");
  return `INV${branchCode}${fySuffix}-${paddedNumber}`;
}

/**
 * Format a date for display showing both English and Nepali calendars.
 * Example: "Thursday, July 17, 2026 | बिहीबार, ४ श्रावण २०८३"
 */
export function formatDualCalendarDate(date?: Date): {
  english: string;
  nepali: string;
  nepaliFormatted: string;
} {
  const d = date || new Date();
  const bs = getBSDate(d);

  const englishOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const english = d.toLocaleDateString("en-US", englishOptions);

  const nepali = `${bs.dayNameNp}, ${toNepaliDigits(bs.day)} ${bs.monthNameNp} ${toNepaliDigits(bs.year)}`;
  const nepaliFormatted = `${bs.monthNameEn} ${bs.day}, ${bs.year} BS`;

  return { english, nepali, nepaliFormatted };
}
