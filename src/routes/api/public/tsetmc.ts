import { createFileRoute } from "@tanstack/react-router";

// وقتی کل داشبورد روی سرور داخل ایران اجرا می‌شود، مرورگر می‌تواند
// داده خام بازار را از همین آدرس (هم‌مبدأ) بگیرد؛ بدون CORS و بدون Mixed Content.
export const Route = createFileRoute("/api/public/tsetmc")({
  server: {
    handlers: {
      GET: async () => {
        const { TSETMC_URLS } = await import("@/lib/tsetmc-parse");
        const UA =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
        let lastErr = "unknown";
        for (const url of TSETMC_URLS) {
          try {
            const res = await fetch(url, {
              headers: { "User-Agent": UA, Accept: "*/*" },
              signal: AbortSignal.timeout(12000),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            if (text.split("@").length < 4) throw new Error("پاسخ نامعتبر");
            return new Response(text, {
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-store",
                "Access-Control-Allow-Origin": "*",
              },
            });
          } catch (e) {
            lastErr = e instanceof Error ? e.message : String(e);
          }
        }
        return new Response(`TSETMC unreachable: ${lastErr}`, { status: 502 });
      },
    },
  },
});
