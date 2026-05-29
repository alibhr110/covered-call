// Persian number formatting helpers
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function fromPersianDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(d)),
    );
}

export function formatPrice(n: number, fractionDigits = 0): string {
  if (!isFinite(n)) return "—";
  const fixed = n.toLocaleString("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  });
  return toPersianDigits(fixed);
}

export function formatPercent(n: number, fractionDigits = 2): string {
  if (!isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return toPersianDigits(sign + n.toFixed(fractionDigits)) + "٪";
}

export function parseNumberInput(raw: string): number {
  if (!raw) return 0;
  const clean = fromPersianDigits(raw).replace(/[,،\s]/g, "");
  const n = Number(clean);
  return isFinite(n) ? n : 0;
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO).getTime();
  const b = new Date(toISO).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
