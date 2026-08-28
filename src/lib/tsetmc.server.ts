// دریافت دیتای لحظه‌ای بازار از TSETMC (سمت سرور)
import { buildCallOptions, TSETMC_URLS } from "./tsetmc-parse";
import type { OptionRow } from "./sample-options";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/** آدرس واسط روی VPS ایران را به endpoint خام تبدیل می‌کند */
export function proxyEndpoint(base: string): string {
  const clean = base.trim().replace(/\/+$/, "");
  const withScheme = /^https?:\/\//i.test(clean) ? clean : `http://${clean}`;
  return /\/tsetmc(\/|$)/.test(withScheme) ? withScheme : `${withScheme}/tsetmc`;
}

async function fetchFrom(url: string, timeout = 9000): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.split("@").length < 4) throw new Error("پاسخ نامعتبر");
  return text;
}

async function fetchRaw(proxyBase?: string): Promise<string> {
  let lastErr = "";
  const urls = proxyBase ? [proxyEndpoint(proxyBase), ...TSETMC_URLS] : TSETMC_URLS;
  for (const url of urls) {
    try {
      return await fetchFrom(url, url === urls[0] && proxyBase ? 15000 : 9000);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`دسترسی به TSETMC ممکن نشد (${lastErr})`);
}

/** دریافت لیست اختیار خرید‌های بازار به همراه اطلاعات دارایی پایه */
export async function fetchCallOptions(proxyBase?: string): Promise<OptionRow[]> {
  return buildCallOptions(await fetchRaw(proxyBase));
}
