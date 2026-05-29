import { daysBetween, todayISO } from "./format";

export interface CoveredCallInputs {
  symbol: string;
  underlyingPrice: number; // قیمت فعلی سهم پایه
  strikePrice: number; // قیمت اعمال
  premium: number; // پرمیوم دریافتی (به ازای هر اختیار)
  contractSize: number; // اندازه هر قرارداد (معمولاً ۱۰۰۰)
  contracts: number; // تعداد قرارداد
  expiryDate: string; // YYYY-MM-DD
  commissionPct: number; // درصد کارمزد (مثلاً 0.4)
}

export interface CoveredCallResult {
  daysToExpiry: number;
  totalCost: number; // هزینه خرید سهم
  totalPremium: number; // درآمد فروش اختیار
  breakeven: number; // نقطه سربه‌سر
  maxProfit: number; // حداکثر سود (در صورت اعمال)
  maxProfitPct: number;
  staticReturn: number; // بازده در صورت ماندن قیمت = پرمیوم خالص
  staticReturnPct: number;
  ifCalledReturn: number; // بازده در صورت اعمال
  ifCalledReturnPct: number;
  annualizedIfCalled: number; // بازده سالانه در صورت اعمال
  annualizedStatic: number;
  downsideProtectionPct: number; // حاشیه ایمنی نزولی
  commissionCost: number;
}

export function calcCoveredCall(i: CoveredCallInputs): CoveredCallResult {
  const shares = i.contractSize * i.contracts;
  const totalCost = i.underlyingPrice * shares;
  const totalPremium = i.premium * shares;
  const commissionCost =
    (totalCost + totalPremium + i.strikePrice * shares) * (i.commissionPct / 100);

  const breakeven = i.underlyingPrice - i.premium;
  const ifCalledProfit =
    (i.strikePrice - i.underlyingPrice) * shares + totalPremium - commissionCost;
  const staticProfit = totalPremium - commissionCost;

  const days = Math.max(1, daysBetween(todayISO(), i.expiryDate));
  const ifCalledPct = (ifCalledProfit / totalCost) * 100;
  const staticPct = (staticProfit / totalCost) * 100;

  return {
    daysToExpiry: days,
    totalCost,
    totalPremium,
    breakeven,
    maxProfit: ifCalledProfit,
    maxProfitPct: ifCalledPct,
    staticReturn: staticProfit,
    staticReturnPct: staticPct,
    ifCalledReturn: ifCalledProfit,
    ifCalledReturnPct: ifCalledPct,
    annualizedIfCalled: (ifCalledPct * 365) / days,
    annualizedStatic: (staticPct * 365) / days,
    downsideProtectionPct: (i.premium / i.underlyingPrice) * 100,
    commissionCost,
  };
}

export const DEFAULT_INPUTS: CoveredCallInputs = {
  symbol: "",
  underlyingPrice: 0,
  strikePrice: 0,
  premium: 0,
  contractSize: 1000,
  contracts: 1,
  expiryDate: (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  })(),
  commissionPct: 0.4,
};
