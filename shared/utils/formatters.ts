import { DAYS_OF_THE_WEEK, MONTHS_LONG, MONTHS_SHORT } from "./constants";

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

export const formatNaira = (
  raw: string | number | null | undefined,
): string => {
  if (raw === null || raw === undefined) return "";

  const str = typeof raw === "string" ? raw.trim() : raw;
  if (str === "") return "";

  const n = Number(str);
  return Number.isFinite(n) ? n.toLocaleString("en-NG") : String(raw);
};

export interface FormatRelativeTimeOptions {
  addSuffix?: boolean;
  justNowThresholdSeconds?: number;
  short?: boolean;
  style?: "long" | "short" | "narrow";
  numeric?: "always" | "auto";
  rounding?: "floor" | "round" | "ceil";
  now?: Date | string | number;
}

const INTERVALS = [
  { label: "year", seconds: 31_536_000, short: "yr", narrow: "y" },
  { label: "month", seconds: 2_592_000, short: "mo", narrow: "mo" },
  { label: "week", seconds: 604_800, short: "wk", narrow: "w" },
  { label: "day", seconds: 86_400, short: "day", narrow: "d" },
  { label: "hour", seconds: 3_600, short: "hr", narrow: "h" },
  { label: "minute", seconds: 60, short: "min", narrow: "m" },
  { label: "second", seconds: 1, short: "sec", narrow: "s" },
] as const;

type UnitLabel = (typeof INTERVALS)[number]["label"];

function pluralize(
  label: string,
  count: number,
  style: "long" | "short" | "narrow",
): string {
  if (style === "narrow") {
    const map: Record<UnitLabel, string> = {
      year: "y",
      month: "mo",
      week: "w",
      day: "d",
      hour: "h",
      minute: "m",
      second: "s",
    };
    return map[label as UnitLabel] ?? label;
  }

  if (style === "short") {
    const map: Record<UnitLabel, [string, string]> = {
      year: ["yr", "yrs"],
      month: ["mo", "mos"],
      week: ["wk", "wks"],
      day: ["day", "days"],
      hour: ["hr", "hrs"],
      minute: ["min", "mins"],
      second: ["sec", "secs"],
    };
    const [singular, plural] = map[label as UnitLabel] ?? [label, `${label}s`];
    return count === 1 ? singular : plural;
  }

  return count === 1 ? label : `${label}s`;
}

function applyRounding(
  value: number,
  method: "floor" | "round" | "ceil",
): number {
  switch (method) {
    case "round":
      return Math.round(value);
    case "ceil":
      return Math.ceil(value);
    default:
      return Math.floor(value);
  }
}

export function formatRelativeTime(
  timeAgo: Date | string | number,
  options: FormatRelativeTimeOptions = {},
): string {
  const {
    addSuffix = true,
    justNowThresholdSeconds = 0,
    short = false,
    style,
    numeric = "always",
    rounding = "floor",
    now,
  } = options;

  const resolvedStyle: "long" | "short" | "narrow" =
    style ?? (short ? "short" : "long");

  const date = new Date(timeAgo);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  const nowDate = now != null ? new Date(now) : new Date();
  if (Number.isNaN(nowDate.getTime())) return "Invalid date";

  const diffMs = nowDate.getTime() - date.getTime();
  const absDiffMs = Math.abs(diffMs);
  const diffInSeconds = Math.floor(absDiffMs / 1000);
  const isFuture = diffMs < 0;

  if (diffInSeconds <= justNowThresholdSeconds) return "just now";

  for (const interval of INTERVALS) {
    const rawCount = absDiffMs / 1000 / interval.seconds;
    const count = applyRounding(rawCount, rounding);

    if (count < 1) continue;

    if (numeric === "auto" && interval.label === "day") {
      if (count === 0) return "today";
      if (count === 1) return isFuture ? "tomorrow" : "yesterday";
    }

    const unit = pluralize(interval.label, count, resolvedStyle);
    const core =
      resolvedStyle === "narrow" ? `${count}${unit}` : `${count} ${unit}`;

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
  const digits = phoneNumber.replace(/\D/g, "");

  const nationalNumber = digits.replace(/^2340?/, "").replace(/^0/, "");

  if (nationalNumber.length !== 10) {
    return phoneNumber;
  }

  return `+234 ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`;
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
