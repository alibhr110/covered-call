import { useMemo, useState } from "react";
import { Plus, Trash2, Calculator, ArrowUp, ArrowDown, FilterX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  formatPercent,
  formatPrice,
  fromPersianDigits,
  toPersianDigits,
  todayISO,
} from "@/lib/format";
import { useLocalStorage } from "@/lib/storage";
import { SAMPLE_OPTIONS, type OptionRow } from "@/lib/sample-options";
import {
  DAILY_LIMIT_PCT,
  FUND_LIMIT_PCT,
  annualize,
  blackScholesIran,
  ccReturnPct,
  daysToExpiry,
  scenarioAnnualPct,
} from "@/lib/pricing";

interface ScanConfig {
  dropPct: number;
  stockLimitPct: number;
  fundLimitPct: number;
  riskFreePct?: number;
}

interface Metrics {
  days: number;
  moneynessPct: number;
  askReturnPct: number;
  askAnnualPct: number;
  bidReturnPct: number;
  bidAnnualPct: number;
  lastReturnPct: number;
  lastAnnualPct: number;
  toBuyQueuePct: number;
  toSellQueuePct: number;
  bsPrice: number;
  delta: number;
  dropAnnualPct: number;
  dropDeltaPct: number;
}

function computeMetrics(r: OptionRow, cfg: ScanConfig): Metrics {
  const limit = r.assetType === "fund" ? cfg.fundLimitPct : cfg.stockLimitPct;
  const days = daysToExpiry(r.expiryDate);
  const moneynessPct = ((r.underlyingPrice - r.strikePrice) / r.strikePrice) * 100;

  const upper = r.underlyingRef * (1 + limit / 100);
  const lower = r.underlyingRef * (1 - limit / 100);
  const toBuyQueuePct = ((upper - r.underlyingPrice) / r.underlyingPrice) * 100;
  const toSellQueuePct = ((r.underlyingPrice - lower) / r.underlyingPrice) * 100;

  const askReturnPct = ccReturnPct(r.underlyingAsk || r.underlyingPrice, r.strikePrice, r.ask);
  const bidReturnPct = ccReturnPct(r.underlyingAsk || r.underlyingPrice, r.strikePrice, r.bid);
  const lastReturnPct = ccReturnPct(r.underlyingAsk || r.underlyingPrice, r.strikePrice, r.last);

  const bs = blackScholesIran({
    spot: r.underlyingPrice,
    strike: r.strikePrice,
    days,
    sigmaPct: r.sigmaPct,
    distToBuyQueuePct: toBuyQueuePct,
    distToSellQueuePct: toSellQueuePct,
    riskFreePct: cfg.riskFreePct ?? RISK_FREE * 100,
    limitPct: limit,
  });

  const base = r.underlyingAsk || r.underlyingPrice;
  const dropAnnualPct = scenarioAnnualPct(base, r.strikePrice, r.ask, cfg.dropPct, days);

  return {
    days,
    moneynessPct,
    askReturnPct,
    askAnnualPct: annualize(askReturnPct, days),
    bidReturnPct,
    bidAnnualPct: annualize(bidReturnPct, days),
    lastReturnPct,
    lastAnnualPct: annualize(lastReturnPct, days),
    toBuyQueuePct,
    toSellQueuePct,
    bsPrice: bs.adjusted,
    delta: bs.delta,
    dropAnnualPct,
    dropDeltaPct: dropAnnualPct - annualize(askReturnPct, days),
  };
}

type Entry = { row: OptionRow; m: Metrics };

type ColKind = "text" | "price" | "percent" | "int" | "decimal";

interface Col {
  key: string;
  label: string;
  short?: string;
  kind: ColKind;
  get: (e: Entry) => string | number;
  tone?: (e: Entry) => string;
}

const buildCols = (dropPct: number): Col[] => [
  { key: "optionSymbol", label: "نماد آپشن", kind: "text", get: (e) => e.row.optionSymbol },
  { key: "symbol", label: "دارایی پایه", kind: "text", get: (e) => e.row.symbol },
  { key: "ask", label: "پرمیوم ask", kind: "price", get: (e) => e.row.ask },
  { key: "bid", label: "پرمیوم bid", kind: "price", get: (e) => e.row.bid },
  { key: "last", label: "آخرین معامله", kind: "price", get: (e) => e.row.last },
  { key: "volume", label: "حجم معاملات", kind: "int", get: (e) => e.row.volume },
  { key: "days", label: "روز تا سررسید", kind: "int", get: (e) => e.m.days },
  { key: "strikePrice", label: "قیمت اعمال", kind: "price", get: (e) => e.row.strikePrice },
  {
    key: "moneynessPct",
    label: "وضعیت سود/زیان",
    kind: "percent",
    get: (e) => e.m.moneynessPct,
    tone: (e) => (e.m.moneynessPct >= 0 ? "text-accent" : "text-destructive"),
  },
  { key: "askAnnualPct", label: "سالانه (ask)", kind: "percent", get: (e) => e.m.askAnnualPct },
  { key: "askReturnPct", label: "تا سررسید (ask)", kind: "percent", get: (e) => e.m.askReturnPct },
  { key: "bidAnnualPct", label: "سالانه (bid)", kind: "percent", get: (e) => e.m.bidAnnualPct },
  { key: "bidReturnPct", label: "تا سررسید (bid)", kind: "percent", get: (e) => e.m.bidReturnPct },
  { key: "lastAnnualPct", label: "سالانه (آخرین)", kind: "percent", get: (e) => e.m.lastAnnualPct },
  { key: "underlyingAsk", label: "ask پایه", kind: "price", get: (e) => e.row.underlyingAsk },
  { key: "underlyingBid", label: "bid پایه", kind: "price", get: (e) => e.row.underlyingBid },
  {
    key: "toBuyQueuePct",
    label: "فاصله تا صف خرید",
    kind: "percent",
    get: (e) => e.m.toBuyQueuePct,
  },
  {
    key: "toSellQueuePct",
    label: "فاصله تا صف فروش",
    kind: "percent",
    get: (e) => e.m.toSellQueuePct,
  },
  { key: "bsPrice", label: "بلک‌شولز (ایران)", kind: "price", get: (e) => e.m.bsPrice },
  { key: "delta", label: "دلتا", kind: "decimal", get: (e) => e.m.delta },
  {
    key: "dropAnnualPct",
    label: `بازده سالانه با ریزش ${toPersianDigits(dropPct)}٪`,
    kind: "percent",
    get: (e) => e.m.dropAnnualPct,
    tone: (e) => (e.m.dropAnnualPct >= 0 ? "text-accent" : "text-destructive"),
  },
];

/** فیلتر عددی: «>10» «<5» «5-20» «=3» یا عدد ساده (حداقل) */
function numericMatch(value: number, raw: string): boolean {
  const q = fromPersianDigits(raw).replace(/[,،\s٪%]/g, "");
  if (!q) return true;
  const range = q.match(/^(-?\d*\.?\d+)-(-?\d*\.?\d+)$/);
  if (range) return value >= Number(range[1]) && value <= Number(range[2]);
  const op = q.match(/^(>=|<=|>|<|=)?(-?\d*\.?\d+)$/);
  if (!op) return true;
  const n = Number(op[2]);
  switch (op[1]) {
    case "<":
      return value < n;
    case "<=":
      return value <= n;
    case "=":
      return Math.abs(value - n) < 1e-9;
    case ">=":
      return value >= n;
    case ">":
    default:
      return value >= n;
  }
}

function renderCell(col: Col, e: Entry) {
  const v = col.get(e);
  if (col.kind === "text") return String(v);
  if (col.kind === "percent") return formatPercent(v as number);
  if (col.kind === "decimal") return toPersianDigits((v as number).toFixed(2));
  return formatPrice(v as number);
}

export function OpportunityScanner({
  onSendToCalculator,
}: {
  onSendToCalculator: (row: OptionRow) => void;
}) {
  const [rows, setRows] = useLocalStorage<OptionRow[]>("cc:options:v2", SAMPLE_OPTIONS);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>("askAnnualPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showAdd, setShowAdd] = useState(false);
  const [cfg, setCfg] = useLocalStorage<ScanConfig>("cc:config:v1", {
    dropPct: 20,
    stockLimitPct: DAILY_LIMIT_PCT,
    fundLimitPct: FUND_LIMIT_PCT,
  });

  const COLS = useMemo(() => buildCols(cfg.dropPct), [cfg.dropPct]);

  const entries = useMemo<Entry[]>(
    () => rows.map((row) => ({ row, m: computeMetrics(row, cfg) })),
    [rows, cfg],
  );

  const visible = useMemo(() => {
    const list = entries.filter((e) =>
      COLS.every((c) => {
        const raw = filters[c.key]?.trim();
        if (!raw) return true;
        const v = c.get(e);
        if (c.kind === "text")
          return String(v).includes(fromPersianDigits(raw).trim()) || String(v).includes(raw.trim());
        return numericMatch(v as number, raw);
      }),
    );
    const col = COLS.find((c) => c.key === sortKey);
    if (!col) return list;
    return [...list].sort((a, b) => {
      const av = col.get(a);
      const bv = col.get(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "fa");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [entries, filters, sortKey, sortDir, COLS]);

  const toggleSort = (key: string) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const activeFilters = Object.values(filters).filter((v) => v?.trim()).length;

  return (
    <div className="space-y-4">
      <Card className="grid gap-4 p-4 shadow-card sm:grid-cols-3">
        <CfgField
          label="سناریوی ریزش دارایی پایه (٪)"
          hint="بازده سالانه در این ریزش، در ستون آخر جدول نمایش داده می‌شود"
          value={cfg.dropPct}
          onChange={(v) => setCfg((c) => ({ ...c, dropPct: v }))}
        />
        <CfgField
          label="دامنه نوسان سهام (٪)"
          hint="پیش‌فرض ۳٪ — قابل تغییر توسط سازمان بورس"
          value={cfg.stockLimitPct}
          onChange={(v) => setCfg((c) => ({ ...c, stockLimitPct: v }))}
        />
        <CfgField
          label="دامنه نوسان صندوق اهرمی (٪)"
          hint="پیش‌فرض ۴٪"
          value={cfg.fundLimitPct}
          onChange={(v) => setCfg((c) => ({ ...c, fundLimitPct: v }))}
        />
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4 shadow-card">
        <p className="text-xs text-muted-foreground">
          در ردیف زیر عنوان هر ستون می‌توانید فیلتر بگذارید — برای ستون‌های عددی از
          الگوهای <span className="font-mono">&gt;۲۰</span>،{" "}
          <span className="font-mono">&lt;۵</span> یا{" "}
          <span className="font-mono">۱۰-۳۰</span> استفاده کنید.
        </p>
        <div className="flex items-center gap-2">
          {activeFilters > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setFilters({})}>
              <FilterX className="ml-1 h-4 w-4" />
              پاک‌کردن فیلترها ({toPersianDigits(activeFilters)})
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowAdd((s) => !s)}
            className="bg-gradient-accent text-accent-foreground hover:opacity-90"
          >
            <Plus className="ml-1 h-4 w-4" />
            افزودن نماد
          </Button>
        </div>
      </Card>

      {showAdd && (
        <AddRowForm
          onAdd={(row) => {
            setRows((s) => [{ ...row, id: crypto.randomUUID() }, ...s]);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <Card className="overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1900px] text-sm">
            <thead className="bg-secondary/60 text-xs text-muted-foreground">
              <tr>
                {COLS.map((c) => {
                  const active = sortKey === c.key;
                  return (
                    <th key={c.key} className="whitespace-nowrap px-3 py-2 text-right font-medium">
                      <button
                        onClick={() => toggleSort(c.key)}
                        className={`flex items-center gap-1 ${
                          active ? "text-foreground" : "hover:text-foreground"
                        }`}
                      >
                        {c.label}
                        {active &&
                          (sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </button>
                    </th>
                  );
                })}
                <th className="px-3 py-2" />
              </tr>
              <tr className="border-t border-border/60">
                {COLS.map((c) => (
                  <th key={c.key} className="px-2 pb-2 pt-1">
                    <Input
                      value={filters[c.key] ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, [c.key]: e.target.value }))
                      }
                      placeholder={c.kind === "text" ? "جستجو" : "مثلاً >۱۰"}
                      className="h-8 w-full min-w-[90px] bg-background text-right text-xs"
                    />
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={COLS.length + 1}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    نتیجه‌ای یافت نشد
                  </td>
                </tr>
              )}
              {visible.map((e) => (
                <tr
                  key={e.row.id}
                  className="border-t border-border/60 transition-colors hover:bg-secondary/40"
                >
                  {COLS.map((c) => (
                    <td
                      key={c.key}
                      className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${
                        c.tone ? c.tone(e) : ""
                      } ${c.key === "optionSymbol" ? "font-semibold" : ""}`}
                    >
                      {c.key === "moneynessPct" ? (
                        <span className="flex items-center gap-1.5">
                          {formatPercent(e.m.moneynessPct)}
                          <Badge
                            variant={e.m.moneynessPct >= 0 ? "secondary" : "outline"}
                            className="h-5 px-1.5 text-[10px]"
                          >
                            {e.m.moneynessPct >= 0 ? "در سود" : "در زیان"}
                          </Badge>
                        </span>
                      ) : (
                        renderCell(c, e)
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        title="انتقال به ماشین‌حساب"
                        onClick={() => onSendToCalculator(e.row)}
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setRows((s) => s.filter((r) => r.id !== e.row.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="px-1 text-xs text-muted-foreground">
        ⓘ قیمت بلک‌شولز با فرض‌های بازار ایران بهینه شده است: نرخ بدون ریسک ۳۰٪، جریمه
        نقدشوندگی و یک‌طرفه بودن بازار، اثر صف خرید/فروش در دامنه ±۵٪ و پوسیدگی شدید ارزش
        زمانی در روزهای پایانی. داده‌ها در مرورگر شما ذخیره می‌شوند.
      </p>
    </div>
  );
}

function AddRowForm({
  onAdd,
  onCancel,
}: {
  onAdd: (row: Omit<OptionRow, "id">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<OptionRow, "id">>({
    symbol: "",
    optionSymbol: "",
    ask: 0,
    bid: 0,
    last: 0,
    volume: 0,
    strikePrice: 0,
    expiryDate: todayISO(),
    contractSize: 1000,
    underlyingPrice: 0,
    underlyingAsk: 0,
    underlyingBid: 0,
    underlyingRef: 0,
    sigmaPct: 45,
    assetType: "stock",
  });

  const num = (v: string) => Number(fromPersianDigits(v).replace(/[^\d.]/g, "")) || 0;
  const setNum = (k: keyof OptionRow) => (v: string) =>
    setForm((f) => ({ ...f, [k]: num(v) }));

  return (
    <Card className="border-accent/30 p-5 shadow-card">
      <h3 className="mb-4 font-semibold">افزودن نماد جدید</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Field label="نماد اختیار">
          <Input
            value={form.optionSymbol}
            onChange={(e) => setForm({ ...form, optionSymbol: e.target.value })}
            placeholder="ضفلا..."
            className="h-10 text-right"
          />
        </Field>
        <Field label="نماد دارایی پایه">
          <Input
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            placeholder="فولاد"
            className="h-10 text-right"
          />
        </Field>
        <NumField label="پرمیوم ask" value={form.ask} onChange={setNum("ask")} />
        <NumField label="پرمیوم bid" value={form.bid} onChange={setNum("bid")} />
        <NumField label="آخرین معامله اختیار" value={form.last} onChange={setNum("last")} />
        <NumField label="حجم معاملات" value={form.volume} onChange={setNum("volume")} />
        <NumField label="قیمت اعمال" value={form.strikePrice} onChange={setNum("strikePrice")} />
        <Field label="تاریخ سررسید">
          <Input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            className="h-10"
          />
        </Field>
        <NumField
          label="آخرین قیمت پایه"
          value={form.underlyingPrice}
          onChange={setNum("underlyingPrice")}
        />
        <NumField label="ask پایه" value={form.underlyingAsk} onChange={setNum("underlyingAsk")} />
        <NumField label="bid پایه" value={form.underlyingBid} onChange={setNum("underlyingBid")} />
        <NumField
          label="قیمت مرجع پایه (پایانی دیروز)"
          value={form.underlyingRef}
          onChange={setNum("underlyingRef")}
        />
        <Field label="نوع دارایی پایه">
          <select
            value={form.assetType}
            onChange={(e) =>
              setForm({ ...form, assetType: e.target.value as "stock" | "fund" })
            }
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-right text-sm"
          >
            <option value="stock">سهام (دامنه سهام)</option>
            <option value="fund">صندوق اهرمی (دامنه صندوق)</option>
          </select>
        </Field>
        <NumField label="نوسان سالانه (٪)" value={form.sigmaPct} onChange={setNum("sigmaPct")} />
        <NumField
          label="اندازه قرارداد"
          value={form.contractSize}
          onChange={setNum("contractSize")}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
        <Button
          onClick={() =>
            onAdd({
              ...form,
              underlyingRef: form.underlyingRef || form.underlyingPrice,
              underlyingAsk: form.underlyingAsk || form.underlyingPrice,
              underlyingBid: form.underlyingBid || form.underlyingPrice,
            })
          }
          disabled={!form.symbol || !form.strikePrice}
          className="bg-primary text-primary-foreground"
        >
          افزودن
        </Button>
      </div>
    </Card>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 text-right tabular-nums"
      />
    </Field>
  );
}

function CfgField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        value={toPersianDigits(value)}
        onChange={(e) =>
          onChange(Number(fromPersianDigits(e.target.value).replace(/[^\d.]/g, "")) || 0)
        }
        className="h-10 text-right tabular-nums"
      />
      <p className="text-[11px] leading-4 text-muted-foreground">{hint}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
