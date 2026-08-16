import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LineChart, Calculator as CalcIcon, ScanLine, TrendingUp } from "lucide-react";
import { CoveredCallCalculator } from "@/components/CoveredCallCalculator";
import { OpportunityScanner } from "@/components/OpportunityScanner";
import type { OptionRow } from "@/lib/sample-options";
import type { CoveredCallInputs } from "@/lib/covered-call";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "داشبورد استراتژی کاوردکال — بورس ایران" },
      {
        name: "description",
        content:
          "ماشین‌حساب و اسکنر فرصت‌های استراتژی کاوردکال (Covered Call) برای اختیار معامله سهام در بورس تهران.",
      },
    ],
  }),
  component: Dashboard,
});

type Tab = "scanner" | "calculator";

function Dashboard() {
  const [tab, setTab] = useState<Tab>("scanner");
  const [calcInitial, setCalcInitial] = useState<Partial<CoveredCallInputs>>();

  const sendToCalculator = (row: OptionRow) => {
    setCalcInitial({
      symbol: row.symbol,
      underlyingPrice: row.underlyingAsk || row.underlyingPrice,
      strikePrice: row.strikePrice,
      premium: row.ask,
      contractSize: row.contractSize,
      expiryDate: row.expiryDate,
    });
    setTab("calculator");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero text-primary-foreground shadow-card">
              <LineChart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight sm:text-lg">
                داشبورد کاوردکال
              </h1>
              <p className="text-xs text-muted-foreground">
                استراتژی فروش اختیار خرید پوششی — بورس تهران
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
            داده‌های شما در مرورگر ذخیره می‌شود
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
          <TabBtn active={tab === "scanner"} onClick={() => setTab("scanner")}>
            <ScanLine className="h-4 w-4" />
            اسکنر فرصت‌ها
          </TabBtn>
          <TabBtn
            active={tab === "calculator"}
            onClick={() => setTab("calculator")}
          >
            <CalcIcon className="h-4 w-4" />
            ماشین‌حساب
          </TabBtn>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {tab === "scanner" ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">اسکنر فرصت‌های کاوردکال</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                نمادها بر اساس بازده سالانه‌شده در صورت اعمال مرتب شده‌اند. روی
                دکمه ماشین‌حساب کنار هر ردیف بزنید تا جزئیات کامل را ببینید.
              </p>
            </div>
            <OpportunityScanner onSendToCalculator={sendToCalculator} />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">ماشین‌حساب کاوردکال</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                هزینه، بازده و حاشیه ایمنی پوزیشن کاوردکال خود را پیش از ورود
                محاسبه کنید.
              </p>
            </div>
            <CoveredCallCalculator initial={calcInitial} />
          </div>
        )}
      </main>

      <footer className="mt-8 border-t border-border py-6 text-center text-xs text-muted-foreground">
        ساخته شده برای معامله‌گران بازار اختیار بورس تهران
      </footer>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
      {active && (
        <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
      )}
    </button>
  );
}
