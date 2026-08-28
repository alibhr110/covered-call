// دریافت داده مستقیماً از مرورگر کاربر (برای زمانی که سرور به TSETMC دسترسی ندارد)
import { buildCallOptions, TSETMC_URLS } from "./tsetmc-parse";
import type { OptionRow } from "./sample-options";

const PROXIES: ((u: string) => string)[] = [
  (u) => u,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
];

/** آدرس واسط روی VPS ایران را به endpoint خام تبدیل می‌کند */
export function proxyEndpoint(base: string): string {
  const clean = base.trim().replace(/\/+$/, "");
  const withScheme = /^https?:\/\//i.test(clean) ? clean : `http://${clean}`;
  return /\/tsetmc(\/|$)/.test(withScheme) ? withScheme : `${withScheme}/tsetmc`;
}

/** تلاش برای دریافت داده از مرورگر؛ در صورت شکست خطا پرتاب می‌شود. */
export async function fetchCallOptionsFromBrowser(proxyBase?: string): Promise<OptionRow[]> {
  let lastErr = "";
  const direct: string[] = proxyBase ? [proxyEndpoint(proxyBase)] : [];

  for (const url of direct) {
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      url.startsWith("http://")
    ) {
      lastErr =
        "VPS: مرورگر اجازه نمی‌دهد صفحه https به آدرس http وصل شود (Mixed Content). برای VPS گواهی SSL بگیرید یا از سرور استفاده کنید.";
      continue;
    }
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text.split("@").length < 4) throw new Error("پاسخ نامعتبر از VPS");
      return buildCallOptions(text);
    } catch (e) {
      lastErr = `VPS: ${e instanceof Error ? e.message : String(e)}`;
    }
  }


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
