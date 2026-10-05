import { DAYS_OF_THE_WEEK, MONTHS_LONG, MONTHS_SHORT } from "@/utils/constants";

export function formatPrice(
  amount: number | string,
  options: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {},
): string {
  const {
    currency = "NGN",
    locale = "en-NG",
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num) || num < 0) {
    return "₦0";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
}

export interface FormatRelativeTimeOptions {
  addSuffix?: boolean;
  justNowThresholdSeconds?: number;
}

const INTERVALS = [
  { label: "year", seconds: 31_536_000 },
  { label: "month", seconds: 2_592_000 },
  { label: "week", seconds: 604_800 },
  { label: "day", seconds: 86_400 },
  { label: "hour", seconds: 3_600 },
  { label: "minute", seconds: 60 },
  { label: "second", seconds: 1 },
] as const;

export function formatRelativeTime(
  timeAgo: Date | string | number,
  options: FormatRelativeTimeOptions = {},
): string {
  const { addSuffix = true, justNowThresholdSeconds = 0 } = options;

  const date = new Date(timeAgo);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  const diffMs = Date.now() - date.getTime();
  const diffInSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const isFuture = diffMs < 0;

  if (diffInSeconds <= justNowThresholdSeconds) return "just now";

  for (const { label, seconds } of INTERVALS) {
    const count = Math.floor(diffInSeconds / seconds);
    if (count < 1) continue;

    const unit = count === 1 ? label : `${label}s`;
    const core = `${count} ${unit}`;

    if (!addSuffix) return core;
    return isFuture ? `in ${core}` : `${core} ago`;
  }

  return "just now";
}

interface FormatPriceOptions {
  currency?: string;
  locale?: string;
  decimals?: number;
}

export function formatCompactPrice(
  price: number | null | undefined,
  options: FormatPriceOptions = {},
): string {
  if (price === null || price === undefined || isNaN(price)) return "—";

  const { currency = "NGN", locale = "en-NG", decimals = 1 } = options;

  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: currency,
    maximumFractionDigits: decimals,
  }).format(price);
}

export function formatPhoneNumber(phoneNumber: string): string {
  let result: string = "";
  if (phoneNumber.includes("+")) {
    result =
      phoneNumber.slice(0, 4) +
      " " +
      phoneNumber.slice(4, 7) +
      " " +
      phoneNumber.slice(7, 10) +
      " " +
      phoneNumber.slice(10);
  } else {
    result =
      phoneNumber.slice(0, 4) +
      " " +
      phoneNumber.slice(4, 7) +
      " " +
      phoneNumber.slice(7);
  }
  return result;
}

const DEFAULT_LOCALE = {
  monthsLong: MONTHS_LONG,
  monthsShort: MONTHS_SHORT,
  daysLong: DAYS_OF_THE_WEEK,
  daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

export interface FormatOptions {
  locale?: typeof DEFAULT_LOCALE;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function hours12(hours24: number): number {
  const h = hours24 % 12;
  return h === 0 ? 12 : h;
}

type TokenFn = (date: Date, locale: typeof DEFAULT_LOCALE) => string;

const TOKENS: Array<[string, TokenFn]> = [
  ["yyyy", (d) => String(d.getFullYear())],
  ["yy", (d) => pad(d.getFullYear() % 100)],

  ["MMMM", (d, l) => l.monthsLong[d.getMonth()]],
  ["MMM", (d, l) => l.monthsShort[d.getMonth()]],
  ["MM", (d) => pad(d.getMonth() + 1)],
  ["M", (d) => String(d.getMonth() + 1)],

  ["do", (d) => ordinal(d.getDate())],
  ["dd", (d) => pad(d.getDate())],
  ["d", (d) => String(d.getDate())],

  ["EEEE", (d, l) => l.daysLong[d.getDay()]],
  ["EEE", (d, l) => l.daysShort[d.getDay()]],
  ["EEEEE", (d, l) => l.daysLong[d.getDay()][0]],

  ["HH", (d) => pad(d.getHours())],
  ["H", (d) => String(d.getHours())],

  ["hh", (d) => pad(hours12(d.getHours()))],
  ["h", (d) => String(hours12(d.getHours()))],

  ["mm", (d) => pad(d.getMinutes())],
  ["m", (d) => String(d.getMinutes())],

  ["ss", (d) => pad(d.getSeconds())],
  ["s", (d) => String(d.getSeconds())],

  ["SSS", (d) => pad(d.getMilliseconds(), 3)],

  ["aaa", (d) => (d.getHours() < 12 ? "am" : "pm")],
  ["aa", (d) => (d.getHours() < 12 ? "AM" : "PM")],
  ["a", (d) => (d.getHours() < 12 ? "AM" : "PM")],
];

export function format(
  input: Date | string | number,
  pattern: string,
  options: FormatOptions = {},
): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  const locale = options.locale ?? DEFAULT_LOCALE;

  let result = "";
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === "'") {
      if (pattern[i + 1] === "'") {
        result += "'";
        i += 2;
        continue;
      }

      let j = i + 1;
      while (j < pattern.length && pattern[j] !== "'") j++;
      result += pattern.slice(i + 1, j);
      i = j + 1;
      continue;
    }

    let matched = false;
    for (const [token, render] of TOKENS) {
      if (pattern.startsWith(token, i)) {
        result += render(date, locale);
        i += token.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    result += char;
    i += 1;
  }

  return result;
}
