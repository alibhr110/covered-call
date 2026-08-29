// اجرای داشبورد ساخته‌شده روی Node (برای VPS ایران)
// استفاده: node vps/serve.mjs   (پیش‌فرض PORT=8080)
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(process.cwd(), "dist");
const clientDir = join(root, "client");
const handler = (await import(join(root, "server", "index.mjs"))).default;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function staticFile(pathname) {
  if (pathname.includes("..")) return null;
  const p = join(clientDir, decodeURIComponent(pathname));
  if (existsSync(p) && statSync(p).isFile()) return p;
  return null;
}

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const file = staticFile(url.pathname);
    if (file) {
      res.writeHead(200, {
        "Content-Type": MIME[extname(file)] || "application/octet-stream",
        "Cache-Control": url.pathname.startsWith("/_build/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=0, must-revalidate",
      });
      createReadStream(file).pipe(res);
      return;
    }

    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await new Promise((ok) => {
            const chunks = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", () => ok(Buffer.concat(chunks)));
          });

    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body,
    });

    const env = { ASSETS: { fetch: () => new Response("Not found", { status: 404 }) } };
    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
    const response = await handler.fetch(request, env, ctx);

    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      const reader = response.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Server error");
  }
}).listen(port, host, () => {
  console.log(`Dashboard running on http://${host}:${port}`);
});
