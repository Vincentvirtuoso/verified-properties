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

export function formatRelativeTime(timeAgo: Date | string | number): string {
  const date =
    timeAgo instanceof Date
      ? timeAgo
      : typeof timeAgo === "string"
        ? new Date(timeAgo)
        : new Date(timeAgo);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) {
    return "in the future";
  }

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);

    if (count >= 1) {
      return count === 1
        ? `1 ${interval.label} ago`
        : `${count} ${interval.label}s ago`;
    }
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
