import { useMemo, useState } from "react";
import { Search, Plus, Trash2, ArrowUpDown, Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { calcCoveredCall } from "@/lib/covered-call";
import {
  formatPercent,
  formatPrice,
  fromPersianDigits,
  toPersianDigits,
  todayISO,
} from "@/lib/format";
import { useLocalStorage } from "@/lib/storage";
import { SAMPLE_OPTIONS, type OptionRow } from "@/lib/sample-options";

type SortKey = "ifCalled" | "static" | "annualized" | "downside" | "days";

export function OpportunityScanner({
  onSendToCalculator,
}: {
  onSendToCalculator: (row: OptionRow) => void;
}) {
  const [rows, setRows] = useLocalStorage<OptionRow[]>(
    "cc:options",
    SAMPLE_OPTIONS,
  );
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("annualized");
  const [showAdd, setShowAdd] = useState(false);

  const enriched = useMemo(() => {
    return rows.map((r) => {
      const c = calcCoveredCall({
        symbol: r.symbol,
        underlyingPrice: r.underlyingPrice,
        strikePrice: r.strikePrice,
        premium: r.premium,
        contractSize: r.contractSize,
        contracts: 1,
        expiryDate: r.expiryDate,
        commissionPct: 0.4,
      });
      return { row: r, calc: c };
    });
  }, [rows]);

  const filtered = useMemo(() => {
    const f = filter.trim();
    const list = !f
      ? enriched
      : enriched.filter(
          ({ row }) =>
            row.symbol.includes(f) || row.optionSymbol.includes(f),
        );

    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "ifCalled":
          return b.calc.ifCalledReturnPct - a.calc.ifCalledReturnPct;
        case "static":
          return b.calc.staticReturnPct - a.calc.staticReturnPct;
        case "downside":
          return b.calc.downsideProtectionPct - a.calc.downsideProtectionPct;
        case "days":
          return a.calc.daysToExpiry - b.calc.daysToExpiry;
        case "annualized":
        default:
          return b.calc.annualizedIfCalled - a.calc.annualizedIfCalled;
      }
    });
  }, [enriched, filter, sortKey]);

  const remove = (id: string) =>
    setRows((s) => s.filter((r) => r.id !== id));

  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="جستجوی نماد..."
              className="h-10 pr-10 text-right"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <SortBtn cur={sortKey} k="annualized" set={setSortKey}>
              بازده سالانه
            </SortBtn>
            <SortBtn cur={sortKey} k="ifCalled" set={setSortKey}>
              سود اعمال
            </SortBtn>
            <SortBtn cur={sortKey} k="static" set={setSortKey}>
              بازده ایستا
            </SortBtn>
            <SortBtn cur={sortKey} k="downside" set={setSortKey}>
              حاشیه ایمنی
            </SortBtn>
            <SortBtn cur={sortKey} k="days" set={setSortKey}>
              کوتاه‌ترین
            </SortBtn>
          </div>

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
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right font-medium">نماد</th>
                <th className="px-3 py-3 text-right font-medium">قیمت سهم</th>
                <th className="px-3 py-3 text-right font-medium">اعمال</th>
                <th className="px-3 py-3 text-right font-medium">پرمیوم</th>
                <th className="px-3 py-3 text-right font-medium">روز</th>
                <th className="px-3 py-3 text-right font-medium">سود اعمال</th>
                <th className="px-3 py-3 text-right font-medium">بازده ایستا</th>
                <th className="px-3 py-3 text-right font-medium">سالانه</th>
                <th className="px-3 py-3 text-right font-medium">حاشیه ایمنی</th>
                <th className="px-3 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    نتیجه‌ای یافت نشد
                  </td>
                </tr>
              )}
              {filtered.map(({ row, calc }) => {
                const itm = row.underlyingPrice > row.strikePrice;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-border/60 transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold">{row.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.optionSymbol}
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {formatPrice(row.underlyingPrice)}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        {formatPrice(row.strikePrice)}
                        {itm ? (
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px]"
                          >
                            ITM
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px]"
                          >
                            OTM
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {formatPrice(row.premium)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-muted-foreground">
                      {toPersianDigits(calc.daysToExpiry)}
                    </td>
                    <td className="px-3 py-3 tabular-nums font-medium text-accent">
                      {formatPercent(calc.ifCalledReturnPct)}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {formatPercent(calc.staticReturnPct)}
                    </td>
                    <td className="px-3 py-3 tabular-nums font-semibold text-foreground">
                      {formatPercent(calc.annualizedIfCalled)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-muted-foreground">
                      {formatPercent(calc.downsideProtectionPct)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="انتقال به ماشین‌حساب"
                          onClick={() => onSendToCalculator(row)}
                        >
                          <Calculator className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => remove(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground px-1">
        ⓘ این فهرست نمونه است؛ نمادها و قیمت‌ها را خودتان از سایت بورس به‌روزرسانی کنید. داده‌ها در مرورگر شما ذخیره می‌شوند.
      </p>
    </div>
  );
}

function SortBtn({
  cur,
  k,
  set,
  children,
}: {
  cur: SortKey;
  k: SortKey;
  set: (k: SortKey) => void;
  children: React.ReactNode;
}) {
  const active = cur === k;
  return (
    <button
      onClick={() => set(k)}
      className={`rounded-md px-2.5 py-1.5 transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
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
    underlyingPrice: 0,
    strikePrice: 0,
    premium: 0,
    expiryDate: todayISO(),
    contractSize: 1000,
  });

  const num = (v: string) =>
    Number(fromPersianDigits(v).replace(/[^\d.]/g, "")) || 0;

  return (
    <Card className="p-5 border-accent/30 shadow-card">
      <h3 className="mb-4 font-semibold">افزودن نماد جدید</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="نماد سهم">
          <Input
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            placeholder="فولاد"
            className="h-10 text-right"
          />
        </Field>
        <Field label="نماد اختیار">
          <Input
            value={form.optionSymbol}
            onChange={(e) =>
              setForm({ ...form, optionSymbol: e.target.value })
            }
            placeholder="ضفلا..."
            className="h-10 text-right"
          />
        </Field>
        <Field label="قیمت سهم">
          <Input
            value={form.underlyingPrice || ""}
            onChange={(e) =>
              setForm({ ...form, underlyingPrice: num(e.target.value) })
            }
            className="h-10 text-right tabular-nums"
          />
        </Field>
        <Field label="قیمت اعمال">
          <Input
            value={form.strikePrice || ""}
            onChange={(e) =>
              setForm({ ...form, strikePrice: num(e.target.value) })
            }
            className="h-10 text-right tabular-nums"
          />
        </Field>
        <Field label="پرمیوم">
          <Input
            value={form.premium || ""}
            onChange={(e) => setForm({ ...form, premium: num(e.target.value) })}
            className="h-10 text-right tabular-nums"
          />
        </Field>
        <Field label="اندازه قرارداد">
          <Input
            value={form.contractSize || ""}
            onChange={(e) =>
              setForm({ ...form, contractSize: num(e.target.value) })
            }
            className="h-10 text-right tabular-nums"
          />
        </Field>
        <Field label="تاریخ سررسید">
          <Input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            className="h-10"
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
        <Button
          onClick={() => onAdd(form)}
          disabled={!form.symbol || !form.strikePrice}
          className="bg-primary text-primary-foreground"
        >
          افزودن
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
