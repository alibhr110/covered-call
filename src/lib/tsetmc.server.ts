// دریافت و پردازش دیتای لحظه‌ای بازار از TSETMC (معادل کد پایتون کاربر)
import { parseJalaliCompact } from "./jalali";
import type { OptionRow } from "./sample-options";

const MARKET_MAP: Record<string, string> = {
  "311": "calloption",
  "309": "yellowIFB",
  "303": "secondryIFB",
  "305": "funds",
  "300": "Bourse_symbols",
  "306": "Finance&bounds",
  "320": "IFB_calloptions",
  "208": "sokook",
  "312": "putoption",
  "706": "MorabeheDolati",
  "301": "CityMosharekat",
  "701": "Saffron",
  "307": "RealState",
  "327": "CementKala",
  "321": "IFB_putoptions",
  "380": "Funds_Kala",
  "404": "IFB_paaye_Advanceright_hagh",
  "304": "future",
  "206": "GAMbounds",
  "400": "Advanceright_hagh",
  "403": "IFB_Advanceright_hagh",
  "313": "bourseKala_other",
  "308": "boursekala_self",
  "600": "Tabaee_put",
};

const CALL_TYPES = new Set(["calloption", "IFB_calloptions"]);
const STOCK_TYPES = new Set([
  "yellowIFB",
  "secondryIFB",
  "funds",
  "Bourse_symbols",
  "Funds_Kala",
]);
const FUND_TYPES = new Set(["funds", "Funds_Kala"]);

const AR_MAP: Record<string, string> = {
  "ك": "ک",
  "ى": "ی",
  "ي": "ی",
};

function normalize(s: string): string {
  return s.replace(/[كىي]/g, (c) => AR_MAP[c] ?? c).trim();
}

const SYMBOL_FIX: Record<string, string> = {
  "دارا یکم": "ص_دارا",
  "پتروآگاه": "ص_آگاه",
  "حآفرین": "حافرین",
  "های وب": "های_وب",
  "هم وزن": "هم_وزن",
  "بهین رو": "بهین_رو",
};

const URLS = [
  "https://old.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
  "http://old.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
  "https://main.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
];

async function fetchRaw(): Promise<string[]> {
  let lastErr = "";
  for (const url of URLS) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          Accept: "*/*",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        continue;
      }
      const text = await res.text();
      const parts = text.split("@");
      if (parts.length > 3) return parts;
      lastErr = "پاسخ نامعتبر از سرور بورس";
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`دسترسی به TSETMC ممکن نشد (${lastErr})`);
}

interface Instrument {
  id: string;
  symbol: string;
  name: string;
  last: number;
  close: number;
  yesterday: number;
  volume: number;
  type: string;
  openInterest: number;
  ask: number;
  bid: number;
}

const n = (v: string | undefined) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

function parseMarket(parts: string[]): Map<string, Instrument> {
  const book = new Map<string, { ask: number; bid: number }>();
  for (const line of (parts[3] ?? "").split(";")) {
    const f = line.split(",");
    if (f.length < 8 || f[1] !== "1") continue;
    book.set(f[0]!, { bid: n(f[4]), ask: n(f[5]) });
  }

  const out = new Map<string, Instrument>();
  for (const line of (parts[2] ?? "").split(";")) {
    const f = line.split(",");
    if (f.length < 23) continue;
    const id = f[0]!;
    const b = book.get(id);
    out.set(id, {
      id,
      symbol: normalize(f[2] ?? ""),
      name: normalize(f[3] ?? ""),
      last: n(f[7]),
      close: n(f[6]),
      yesterday: n(f[13]),
      volume: n(f[9]),
      type: MARKET_MAP[f[22] ?? ""] ?? "",
      openInterest: n(f[24]),
      ask: b?.ask ?? 0,
      bid: b?.bid ?? 0,
    });
  }
  return out;
}

function baseSymbolFromName(name: string): string {
  const tokens = name.match(/[\u0600-\u06FF]+/g) ?? [];
  return tokens.slice(1).join("_");
}

/** دریافت لیست اختیار خرید‌های بازار به همراه اطلاعات دارایی پایه */
export async function fetchCallOptions(): Promise<OptionRow[]> {
  const parts = await fetchRaw();
  const all = parseMarket(parts);

  const underlying = new Map<string, Instrument>();
  for (const inst of all.values()) {
    if (!STOCK_TYPES.has(inst.type)) continue;
    const key = SYMBOL_FIX[inst.symbol] ?? inst.symbol;
    underlying.set(key, inst);
  }

  const rows: OptionRow[] = [];
  for (const inst of all.values()) {
    if (!CALL_TYPES.has(inst.type)) continue;
    const segs = inst.name.replace(/\//g, "").split("-");
    if (segs.length < 3) continue;
    const strikePrice = Number(segs[1]);
    const expiryDate = parseJalaliCompact(segs[segs.length - 1] ?? "");
    if (!Number.isFinite(strikePrice) || !expiryDate) continue;

    const baseSymbol = baseSymbolFromName(segs[0] ?? inst.name);
    const base = underlying.get(baseSymbol);
    if (!base) continue;

    rows.push({
      id: inst.id,
      symbol: baseSymbol.replace(/_/g, " "),
      optionSymbol: inst.symbol,
      ask: inst.ask,
      bid: inst.bid,
      last: inst.last,
      volume: inst.volume,
      strikePrice,
      expiryDate,
      contractSize: 1000,
      underlyingPrice: base.last || base.close,
      underlyingAsk: base.ask || base.last,
      underlyingBid: base.bid || base.last,
      underlyingRef: base.yesterday || base.close,
      sigmaPct: 45,
      assetType: FUND_TYPES.has(base.type) ? "fund" : "stock",
      openInterest: inst.openInterest,
    });
  }
  return rows;
}
