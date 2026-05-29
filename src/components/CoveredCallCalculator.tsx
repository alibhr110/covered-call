import { useMemo, useState } from "react";
import { Calculator, TrendingUp, Shield, Calendar, Coins, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  calcCoveredCall,
  DEFAULT_INPUTS,
  type CoveredCallInputs,
} from "@/lib/covered-call";
import {
  formatPercent,
  formatPrice,
  fromPersianDigits,
  toPersianDigits,
} from "@/lib/format";
import { useLocalStorage } from "@/lib/storage";

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={value === 0 ? "" : toPersianDigits(value)}
          onChange={(e) => {
            const v = fromPersianDigits(e.target.value).replace(/[^\d.]/g, "");
            onChange(v === "" ? 0 : Number(v));
          }}
          placeholder="۰"
          className="h-11 text-right font-medium tabular-nums"
          step={step}
        />
        {suffix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between border-b border-border/60 py-2.5 last:border-0 ${
        highlight ? "font-semibold" : ""
      }`}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums ${
          highlight
            ? positive === false
              ? "text-destructive text-base"
              : "text-accent text-base"
            : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function CoveredCallCalculator({
  initial,
}: {
  initial?: Partial<CoveredCallInputs>;
}) {
  const [inputs, setInputs] = useLocalStorage<CoveredCallInputs>(
    "cc:calculator",
    { ...DEFAULT_INPUTS, ...initial },
  );

  // اگر از اسکنر داده‌ای پاس داده شد، در حافظه ذخیره کن
  useState(() => {
    if (initial) setInputs((s) => ({ ...s, ...initial }));
  });

  const r = useMemo(() => calcCoveredCall(inputs), [inputs]);

  const set = <K extends keyof CoveredCallInputs>(k: K, v: CoveredCallInputs[K]) =>
    setInputs((s) => ({ ...s, [k]: v }));

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <Card className="lg:col-span-3 p-6 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">ورودی‌های استراتژی</h2>
        </div>

        <div className="space-y-1.5 mb-4">
          <Label className="text-xs font-medium text-muted-foreground">
            نماد سهم پایه
          </Label>
          <Input
            value={inputs.symbol}
            onChange={(e) => set("symbol", e.target.value)}
            placeholder="مثلاً فولاد"
            className="h-11 text-right"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="قیمت فعلی سهم"
            value={inputs.underlyingPrice}
            onChange={(n) => set("underlyingPrice", n)}
            suffix="ریال"
          />
          <NumberField
            label="قیمت اعمال (Strike)"
            value={inputs.strikePrice}
            onChange={(n) => set("strikePrice", n)}
            suffix="ریال"
          />
          <NumberField
            label="پرمیوم اختیار"
            value={inputs.premium}
            onChange={(n) => set("premium", n)}
            suffix="ریال"
          />
          <NumberField
            label="اندازه قرارداد"
            value={inputs.contractSize}
            onChange={(n) => set("contractSize", n)}
            suffix="سهم"
          />
          <NumberField
            label="تعداد قرارداد"
            value={inputs.contracts}
            onChange={(n) => set("contracts", n)}
          />
          <NumberField
            label="کارمزد کل"
            value={inputs.commissionPct}
            onChange={(n) => set("commissionPct", n)}
            suffix="٪"
            step={0.01}
          />

          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              تاریخ سررسید
            </Label>
            <Input
              type="date"
              value={inputs.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-5 w-full"
          onClick={() => setInputs(DEFAULT_INPUTS)}
        >
          پاک کردن مقادیر
        </Button>
      </Card>

      {/* Results */}
      <Card className="lg:col-span-2 overflow-hidden p-0 shadow-elevated border-0">
        <div className="bg-gradient-hero p-6 text-primary-foreground">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
            <Target className="h-3.5 w-3.5" />
            حداکثر بازده در صورت اعمال
          </div>
          <div className="mt-2 text-4xl font-bold tabular-nums">
            {formatPercent(r.ifCalledReturnPct)}
          </div>
          <div className="mt-1 text-sm opacity-80">
            معادل {formatPercent(r.annualizedIfCalled)} سالانه
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              جریان نقدی
            </div>
            <ResultRow
              label="هزینه خرید سهم"
              value={formatPrice(r.totalCost) + " ریال"}
            />
            <ResultRow
              label="درآمد فروش اختیار"
              value={formatPrice(r.totalPremium) + " ریال"}
            />
            <ResultRow
              label="کارمزد تقریبی"
              value={formatPrice(r.commissionCost, 0) + " ریال"}
            />
            <ResultRow
              label="حداکثر سود ریالی"
              value={formatPrice(r.maxProfit, 0) + " ریال"}
              highlight
              positive={r.maxProfit >= 0}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              سناریوها
            </div>
            <ResultRow
              label="بازده ایستا (قیمت ثابت)"
              value={formatPercent(r.staticReturnPct)}
            />
            <ResultRow
              label="بازده سالانه ایستا"
              value={formatPercent(r.annualizedStatic)}
            />
            <ResultRow
              label="نقطه سربه‌سر"
              value={formatPrice(r.breakeven, 0) + " ریال"}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              ریسک
            </div>
            <ResultRow
              label="حاشیه ایمنی نزولی"
              value={formatPercent(r.downsideProtectionPct)}
            />
            <div className="flex items-baseline justify-between border-b border-border/60 py-2.5">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                روز تا سررسید
              </span>
              <span className="tabular-nums text-foreground">
                {toPersianDigits(r.daysToExpiry)} روز
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
