import { createServerFn } from "@tanstack/react-start";
import type { OptionRow } from "./sample-options";

export interface LiveMarketResult {
  rows: OptionRow[];
  fetchedAt: string;
  error: string | null;
}

export const getLiveCallOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveMarketResult> => {
    try {
      const { fetchCallOptions } = await import("./tsetmc.server");
      const rows = await fetchCallOptions();
      return { rows, fetchedAt: new Date().toISOString(), error: null };
    } catch (e) {
      return {
        rows: [],
        fetchedAt: new Date().toISOString(),
        error: e instanceof Error ? e.message : "خطای ناشناخته در دریافت داده",
      };
    }
  },
);
