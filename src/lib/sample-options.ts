// نمونه داده‌های اختیار خرید برای اسکنر (قابل ویرایش/افزودن توسط کاربر)
export interface OptionRow {
  id: string;
  symbol: string; // نماد سهم پایه
  optionSymbol: string; // نماد اختیار
  underlyingPrice: number;
  strikePrice: number;
  premium: number; // قیمت اختیار (پرمیوم)
  expiryDate: string; // YYYY-MM-DD
  contractSize: number;
  openInterest?: number; // موقعیت‌های باز
  volume?: number;
}

const inMonths = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d.toISOString().slice(0, 10);
};

export const SAMPLE_OPTIONS: OptionRow[] = [
  {
    id: "1",
    symbol: "فولاد",
    optionSymbol: "ضفلا۷۰۲۵",
    underlyingPrice: 5800,
    strikePrice: 6000,
    premium: 320,
    expiryDate: inMonths(1),
    contractSize: 1000,
    openInterest: 12500,
    volume: 3200,
  },
  {
    id: "2",
    symbol: "خودرو",
    optionSymbol: "ضخود۷۰۳۰",
    underlyingPrice: 2950,
    strikePrice: 3200,
    premium: 180,
    expiryDate: inMonths(2),
    contractSize: 1000,
    openInterest: 8400,
    volume: 2100,
  },
  {
    id: "3",
    symbol: "شستا",
    optionSymbol: "ضستا۷۰۵۰",
    underlyingPrice: 1420,
    strikePrice: 1500,
    premium: 95,
    expiryDate: inMonths(1),
    contractSize: 1000,
    openInterest: 5600,
    volume: 1800,
  },
  {
    id: "4",
    symbol: "فملی",
    optionSymbol: "ضملی۷۰۸۰",
    underlyingPrice: 8200,
    strikePrice: 8500,
    premium: 420,
    expiryDate: inMonths(2),
    contractSize: 1000,
    openInterest: 9800,
    volume: 2900,
  },
  {
    id: "5",
    symbol: "شپنا",
    optionSymbol: "ضپنا۷۰۱۰",
    underlyingPrice: 6700,
    strikePrice: 7000,
    premium: 380,
    expiryDate: inMonths(1),
    contractSize: 1000,
    openInterest: 7100,
    volume: 2400,
  },
  {
    id: "6",
    symbol: "وبملت",
    optionSymbol: "ضملت۷۰۴۰",
    underlyingPrice: 3850,
    strikePrice: 4000,
    premium: 220,
    expiryDate: inMonths(1),
    contractSize: 1000,
    openInterest: 6300,
    volume: 1500,
  },
];
