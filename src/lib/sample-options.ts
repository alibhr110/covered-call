// نمونه داده‌های اختیار خرید برای اسکنر (قابل ویرایش/افزودن توسط کاربر)
export interface OptionRow {
  id: string;
  symbol: string; // نماد دارایی پایه
  optionSymbol: string; // نماد اختیار
  ask: number; // قیمت اولین فروشنده اختیار (پرمیوم)
  bid: number; // قیمت اولین خریدار اختیار
  last: number; // آخرین معامله اختیار
  volume: number; // حجم معاملات اختیار
  strikePrice: number;
  expiryDate: string; // YYYY-MM-DD
  contractSize: number;
  underlyingPrice: number; // آخرین قیمت دارایی پایه
  underlyingAsk: number; // صف اول فروشندگان پایه
  underlyingBid: number; // صف اول خریداران پایه
  underlyingRef: number; // قیمت مرجع (پایانی دیروز) برای محاسبه دامنه نوسان
  sigmaPct: number; // نوسان سالانه تخمینی (٪)
  /** نوع دارایی پایه: سهام یا صندوق اهرمی (برای دامنه نوسان) */
  assetType?: "stock" | "fund";
  openInterest?: number;
  /** پرمیوم پیش‌فرض برای ماشین‌حساب */
  premium?: number;
}

const inMonths = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
};

const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const SAMPLE_OPTIONS: OptionRow[] = [
  {
    id: "1",
    symbol: "فولاد",
    optionSymbol: "ضفلا۷۰۲۵",
    ask: 340,
    bid: 310,
    last: 320,
    volume: 3200,
    strikePrice: 6000,
    expiryDate: inMonths(1),
    contractSize: 1000,
    underlyingPrice: 5800,
    underlyingAsk: 5810,
    underlyingBid: 5795,
    underlyingRef: 5750,
    sigmaPct: 45,
    openInterest: 12500,
  },
  {
    id: "2",
    symbol: "خودرو",
    optionSymbol: "ضخود۷۰۳۰",
    ask: 195,
    bid: 170,
    last: 180,
    volume: 2100,
    strikePrice: 3200,
    expiryDate: inMonths(2),
    contractSize: 1000,
    underlyingPrice: 2950,
    underlyingAsk: 2955,
    underlyingBid: 2940,
    underlyingRef: 2900,
    sigmaPct: 60,
    openInterest: 8400,
  },
  {
    id: "3",
    symbol: "شستا",
    optionSymbol: "ضستا۷۰۵۰",
    ask: 105,
    bid: 90,
    last: 95,
    volume: 1800,
    strikePrice: 1500,
    expiryDate: inDays(12),
    contractSize: 1000,
    underlyingPrice: 1420,
    underlyingAsk: 1425,
    underlyingBid: 1418,
    underlyingRef: 1400,
    sigmaPct: 40,
    openInterest: 5600,
  },
  {
    id: "4",
    symbol: "فملی",
    optionSymbol: "ضملی۷۰۸۰",
    ask: 440,
    bid: 405,
    last: 420,
    volume: 2900,
    strikePrice: 8500,
    expiryDate: inMonths(2),
    contractSize: 1000,
    underlyingPrice: 8200,
    underlyingAsk: 8210,
    underlyingBid: 8180,
    underlyingRef: 8100,
    sigmaPct: 42,
    openInterest: 9800,
  },
  {
    id: "5",
    symbol: "شپنا",
    optionSymbol: "ضپنا۷۰۱۰",
    ask: 395,
    bid: 365,
    last: 380,
    volume: 2400,
    strikePrice: 7000,
    expiryDate: inDays(25),
    contractSize: 1000,
    underlyingPrice: 6700,
    underlyingAsk: 6720,
    underlyingBid: 6690,
    underlyingRef: 6650,
    sigmaPct: 48,
    openInterest: 7100,
  },
  {
    id: "6",
    symbol: "وبملت",
    optionSymbol: "ضملت۷۰۴۰",
    ask: 235,
    bid: 210,
    last: 220,
    volume: 1500,
    strikePrice: 4000,
    expiryDate: inDays(5),
    contractSize: 1000,
    underlyingPrice: 4150,
    underlyingAsk: 4160,
    underlyingBid: 4145,
    underlyingRef: 4100,
    sigmaPct: 50,
    openInterest: 6300,
  },
];
