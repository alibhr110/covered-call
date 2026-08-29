// تبدیل تاریخ شمسی به میلادی با کتابخانه استاندارد jalaali-js
import { toGregorian } from "jalaali-js";

/** تبدیل تاریخ جلالی به رشته میلادی YYYY-MM-DD */
export function jalaliToISO(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${g.gy}-${p(g.gm)}-${p(g.gd)}`;
}

/** پارس تاریخ سررسید از انتهای نام نماد اختیار: 14041020 یا 041020 */
export function parseJalaliCompact(raw: string): string | null {
  const s = raw.replace(/\//g, "").trim();
  if (!/^\d{6}$|^\d{8}$/.test(s)) return null;
  const jy = s.length === 8 ? Number(s.slice(0, 4)) : 1400 + Number(s.slice(0, 2));
  const jm = Number(s.slice(-4, -2));
  const jd = Number(s.slice(-2));
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
  return jalaliToISO(jy, jm, jd);
}
