// دریافت داده مستقیماً از مرورگر کاربر (برای زمانی که سرور به TSETMC دسترسی ندارد)
import { buildCallOptions, TSETMC_URLS } from "./tsetmc-parse";
import type { OptionRow } from "./sample-options";

const PROXIES: ((u: string) => string)[] = [
  (u) => u,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

/** تلاش برای دریافت داده از مرورگر؛ در صورت شکست خطا پرتاب می‌شود. */
export async function fetchCallOptionsFromBrowser(): Promise<OptionRow[]> {
  let lastErr = "";
  for (const base of TSETMC_URLS.slice(0, 2)) {
    for (const wrap of PROXIES) {
      try {
        const res = await fetch(wrap(base), {
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) {
          lastErr = `HTTP ${res.status}`;
          continue;
        }
        const text = await res.text();
        if (text.split("@").length < 4) {
          lastErr = "پاسخ نامعتبر";
          continue;
        }
        return buildCallOptions(text);
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }
  }
  throw new Error(lastErr || "دسترسی مستقیم مرورگر به TSETMC ممکن نشد");
}
