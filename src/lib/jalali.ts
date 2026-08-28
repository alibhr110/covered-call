// تبدیل تاریخ شمسی به میلادی (الگوریتم jalaali)
function div(a: number, b: number) {
  return Math.floor(a / b);
}

function jalCal(jy: number) {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 1701, 1796, 1883, 1929,
    1963, 2054, 2196, 2224, 2282, 2382, 2456, 2492, 2820, 2917, 3173, 3299, 3536,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0]!;
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i]!;
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div((n % 33) + 3, 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  return { march, gy };
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * ((gm + 9) % 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(j % 1461, 4) * 5 + 308;
  const gd = div(i % 153, 5) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** تبدیل تاریخ جلالی به رشته میلادی YYYY-MM-DD */
export function jalaliToISO(jy: number, jm: number, jd: number): string {
  const { march, gy } = jalCal(jy);
  const jdn =
    g2d(gy, 3, march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  const g = d2g(jdn);
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
