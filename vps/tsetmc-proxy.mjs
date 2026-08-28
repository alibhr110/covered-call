// واسط ساده TSETMC برای اجرا روی VPS ایران
// اجرا: node tsetmc-proxy.mjs   (پیش‌فرض پورت 8787)
import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const URLS = [
  "http://cdn.tsetmc.com/api/ClosingPrice/GetMarketWatch?market=0&paperTypes[0]=1&paperTypes[1]=2&paperTypes[2]=3&paperTypes[3]=4&paperTypes[4]=5&paperTypes[5]=6&paperTypes[6]=7&paperTypes[7]=8&paperTypes[8]=9&showTraded=false&withBestLimits=true",
  "http://old.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
  "http://www.tsetmc.com/tsev2/data/MarketWatchPlus.aspx?h=0&r=0",
];

let cache = { at: 0, body: "" };

async function fetchRaw() {
  if (Date.now() - cache.at < 5000 && cache.body) return cache.body;
  let lastErr = "";
  for (const url of URLS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "*/*" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        continue;
      }
      const text = await res.text();
      if (text.split("@").length > 3) {
        cache = { at: Date.now(), body: text };
        return text;
      }
      lastErr = "invalid payload";
    } catch (e) {
      lastErr = String(e);
    }
  }
  throw new Error(lastErr);
}

http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS") return res.writeHead(204).end();
    if (!req.url?.startsWith("/tsetmc")) return res.writeHead(404).end("not found");
    try {
      const body = await fetchRaw();
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end(body);
    } catch (e) {
      res.writeHead(502).end(String(e));
    }
  })
  .listen(PORT, () => console.log(`tsetmc proxy on :${PORT}`));
