import { createServerFn } from "@tanstack/react-start";
import type { OptionRow } from "./sample-options";

export interface LiveMarketResult {
  rows: OptionRow[];
  fetchedAt: string;
  error: string | null;
}

export const getLiveCallOptions = createServerFn({ method: "GET" })
  .inputValidator((input: { proxyBase?: string } | undefined) => ({
    proxyBase: typeof input?.proxyBase === "string" ? input.proxyBase.slice(0, 300) : undefined,
  }))
  .handler(async ({ data }): Promise<LiveMarketResult> => {
    try {
      const { fetchCallOptions } = await import("./tsetmc.server");
      const rows = await fetchCallOptions(data.proxyBase);
      return { rows, fetchedAt: new Date().toISOString(), error: null };
    } catch (e) {
      return {
        rows: [],
        fetchedAt: new Date().toISOString(),
        error: e instanceof Error ? e.message : "خطای ناشناخته در دریافت داده",
      };
    }
  });
