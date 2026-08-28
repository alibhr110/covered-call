// دریافت دیتای لحظه‌ای بازار از TSETMC (سمت سرور)
import { buildCallOptions, TSETMC_URLS } from "./tsetmc-parse";
import type { OptionRow } from "./sample-options";

async function fetchRaw(): Promise<string> {
  let lastErr = "";
  for (const url of TSETMC_URLS) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          Accept: "*/*",
        },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        continue;
      }
      const text = await res.text();
      if (text.split("@").length > 3) return text;
      lastErr = "پاسخ نامعتبر از سرور بورس";
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`دسترسی به TSETMC ممکن نشد (${lastErr})`);
}

/** دریافت لیست اختیار خرید‌های بازار به همراه اطلاعات دارایی پایه */
export async function fetchCallOptions(): Promise<OptionRow[]> {
  return buildCallOptions(await fetchRaw());
}
