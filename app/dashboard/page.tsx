"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ResponsiveContainer,
} from "recharts";

type Payment = {
  id: string;
  rail: string;
  debtorName: string;
  debtorAcct: string;
  creditorName: string;
  creditorAcct: string;
  amount: string;     // Decimal string
  currency: string;
  remittance?: string | null;
  purpose?: string | null;
  createdAt: string;
};

const RAILS = ["ALL", "FEDNOW", "RTP", "SWIFT"] as const;
type RailFilter = (typeof RAILS)[number];

export default function DashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rail, setRail] = useState<RailFilter>("ALL");
  const [selected, setSelected] = useState<Payment | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`${origin}/api/payments`, { cache: "no-store" });
      const data = await res.json();
      setPayments(data.payments ?? []);
      setLoading(false);
    })();
  }, [origin]);

  const filtered = useMemo(
    () => (rail === "ALL" ? payments : payments.filter(p => p.rail === rail)),
    [payments, rail]
  );

  const toNumber = (v: string) => Number(v);
  const fmtMoney = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Pie: amounts by rail (ignores filter so you can see distribution)
  const byRail = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach(p => map.set(p.rail, (map.get(p.rail) ?? 0) + toNumber(p.amount)));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [payments]);

  // Bar: top debtors (RESPECTS filter)
  const topDebtors = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(p => map.set(p.debtorName, (map.get(p.debtorName) ?? 0) + toNumber(p.amount)));
    return Array.from(map, ([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filtered]);

  // Line: totals by day (RESPECTS filter)
  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(p => {
      const d = new Date(p.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + toNumber(p.amount));
    });
    return Array.from(map, ([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Payments Dashboard</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Rail</label>
          <select
            className="border rounded px-2 py-1"
            value={rail}
            onChange={(e) => setRail(e.target.value as RailFilter)}
          >
            {RAILS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <Link href="/compose" className="underline text-blue-600">Compose / View →</Link>
        </div>
      </header>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie: by rail (overall) */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h2 className="font-semibold mb-3">Amounts by Rail (overall)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byRail} dataKey="value" nameKey="name" outerRadius={100}>
                      {byRail.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <ReTooltip formatter={(v: any) => `$${fmtMoney(Number(v))}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar: top debtors (filtered) */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h2 className="font-semibold mb-3">Top Debtors (by total) — {rail}</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDebtors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ReTooltip formatter={(v: any) => `$${fmtMoney(Number(v))}`} />
                    <Bar dataKey="total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line: totals by day (filtered) */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h2 className="font-semibold mb-3">Totals by Day — {rail}</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={byDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ReTooltip formatter={(v: any) => `$${fmtMoney(Number(v))}`} />
                    <Line type="monotone" dataKey="total" dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Table: filtered payments with modal drill-down & XML export */}
          <section>
            <h2 className="text-xl font-semibold mt-4 mb-2">Payments — {rail}</h2>
            <div className="space-y-2">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="w-full text-left rounded border bg-white px-4 py-2 hover:bg-gray-50"
                >
                  <div className="font-medium">{p.rail} — {p.amount} {p.currency}</div>
                  <div className="text-sm text-gray-600">{p.debtorName} → {p.creditorName}</div>
                  <div className="text-xs text-gray-500">Created: {new Date(p.createdAt).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Details modal */}
          <Dialog.Root open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/30" />
              <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-5 shadow-xl">
                {selected && (
                  <>
                    <Dialog.Title className="text-lg font-semibold mb-2">Payment Details</Dialog.Title>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium">Rail:</span> {selected.rail}</div>
                      <div><span className="font-medium">Debtor:</span> {selected.debtorName} — {selected.debtorAcct}</div>
                      <div><span className="font-medium">Creditor:</span> {selected.creditorName} — {selected.creditorAcct}</div>
                      <div><span className="font-medium">Amount:</span> {selected.amount} {selected.currency}</div>
                      {selected.remittance && <div><span className="font-medium">Remittance:</span> {selected.remittance}</div>}
                      {selected.purpose && <div><span className="font-medium">Purpose:</span> {selected.purpose}</div>}
                      <div className="text-gray-500">Created: {new Date(selected.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <a
                        href={`/api/payments/${selected.id}/xml`}
                        className="rounded bg-black text-white px-3 py-2"
                        target="_blank"
                      >
                        Export ISO 20022 (pain.001)
                      </a>
                      <Dialog.Close className="rounded border px-3 py-2">Close</Dialog.Close>
                    </div>
                  </>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      )}
    </main>
  );
}

