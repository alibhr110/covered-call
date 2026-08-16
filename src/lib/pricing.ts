// مدل قیمت‌گذاری بلک‌شولز بهینه‌شده برای بازار اختیار بورس تهران
import { daysBetween, todayISO } from "./format";

// نرخ بدون ریسک تقریبی بازار ایران (اوراق اخزا)
export const RISK_FREE = 0.3;
// دامنه نوسان روزانه سهام (٪)
export const DAILY_LIMIT_PCT = 5;

function normCdf(x: number): number {
  // تقریب Abramowitz-Stegun
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

export interface BsInput {
  spot: number;
  strike: number;
  days: number;
  sigmaPct: number; // نوسان سالانه به درصد
  /** فاصله تا صف خرید (٪) — برای جریمه نقدشوندگی */
  distToBuyQueuePct?: number;
  /** فاصله تا صف فروش (٪) */
  distToSellQueuePct?: number;
}

export interface BsResult {
  /** بلک‌شولز استاندارد */
  theoretical: number;
  /** قیمت منصفانه بهینه‌شده برای بازار ایران */
  adjusted: number;
  intrinsic: number;
  timeValue: number;
  delta: number; // تغییر قیمت اختیار به ازای هر ۱ ریال تغییر دارایی پایه
}

export function blackScholesIran(i: BsInput): BsResult {
  const S = Math.max(i.spot, 0.0001);
  const K = Math.max(i.strike, 0.0001);
  const T = Math.max(i.days, 0.5) / 365;
  const sigma = Math.max(i.sigmaPct, 1) / 100;
  const r = RISK_FREE;

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const nd1 = normCdf(d1);
  const theoretical = S * nd1 - K * Math.exp(-r * T) * normCdf(d2);

  const intrinsic = Math.max(0, S - K);
  let timeValue = Math.max(0, theoretical - intrinsic);

  // ۱) جریمه نقدشوندگی و یک‌طرفه بودن بازار (امکان فروش استقراضی وجود ندارد)
  timeValue *= 0.85;

  // ۲) محدودیت دامنه نوسان: اگر پایه در آستانه صف فروش باشد ارزش زمانی افت می‌کند
  const dSell = i.distToSellQueuePct ?? DAILY_LIMIT_PCT;
  const dBuy = i.distToBuyQueuePct ?? DAILY_LIMIT_PCT;
  const queueFactor =
    dSell < 1 ? 0.75 : dBuy < 1 ? 1.08 : 1; // صف فروش → کاهش، صف خرید → افزایش
  timeValue *= queueFactor;

  // ۳) پوسیدگی شدید ارزش زمانی در روزهای پایانی سررسید
  if (i.days <= 7) timeValue *= i.days / 10;

  // ۴) در روزهای آخر، اختیارهای در سود معمولاً زیر ارزش ذاتی معامله می‌شوند
  const discount = i.days <= 3 && intrinsic > 0 ? 0.97 : 1;

  const adjusted = Math.max(0, (intrinsic + timeValue) * discount);

  return { theoretical, adjusted, intrinsic, timeValue, delta: nd1 };
}

export function daysToExpiry(expiryDate: string): number {
  return Math.max(0, daysBetween(todayISO(), expiryDate));
}

/** بازده تا سررسید کاوردکال (٪) با فرض اعمال شدن */
export function ccReturnPct(
  underlyingPrice: number,
  strike: number,
  premium: number,
): number {
  const net = underlyingPrice - premium;
  if (net <= 0) return 0;
  return ((strike - net) / net) * 100;
}

export function annualize(pct: number, days: number): number {
  return (pct * 365) / Math.max(1, days);
}
