"use client";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Box, ClipboardList, Package, Plus, Search, Shield, Sparkles, Users, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, Product } from "@/lib/api";
import { addMoney, festivalPrice, formatMoney } from "@/lib/catalog";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const NEXT_STATUSES: Record<string, string[]> = {
  placed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
type Order = { oid: number; total: number; status: string; created_at?: string };
type Stats = { revenue: number; orders: number; customers: number; products: number; low_stock: { pid: number; name: string; stock: number }[]; top_products: { name: string; sold: number }[] };
const blank = { name: "", description: "", category: "general", price: "", stock: "" };

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("Overview");
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => Promise.all([api<Stats>("/admin/stats"), api<Order[]>("/admin/orders"), api<Product[]>("/products?size=100")]).then(([nextStats, nextOrders, nextProducts]) => { setStats(nextStats); setOrders(nextOrders); setProducts(nextProducts); setError(""); }).catch((err) => setError(err instanceof Error ? err.message : "Couldn't load the dashboard.")), []);
  useEffect(() => { void load(); }, [load]);
  const act = (fn: () => Promise<unknown>) => fn().then(load).catch((err) => setError(err instanceof Error ? err.message : "Action failed."));
  const filtered = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const orderTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        day: date.toLocaleDateString(undefined, { weekday: "short" }),
        orders: 0,
        revenue: 0,
      };
    });
    const byDate = new Map(days.map((day) => [day.key, day]));
    for (const order of orders) {
      if (!order.created_at) continue;
      const date = new Date(order.created_at);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const day = byDate.get(key);
      if (!day) continue;
      day.orders += 1;
      if (order.status !== "cancelled") day.revenue = addMoney(day.revenue, order.total);
    }
    return days;
  }, [orders]);

  if (error && !stats) return <div className="mx-auto min-h-[65vh] max-w-3xl px-5 pb-16 pt-20"><div className="panel p-7"><span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><Shield size={19} /></span><h1 className="font-display mt-4 text-2xl font-bold">Admin access</h1><p className="mt-2 text-sm text-[#a1a0ad]">{error === "Not authenticated" ? "Sign in with an administrator account to manage the NEXORA store." : error}</p><Link className="button-primary mt-5" href="/login?next=%2Fadmin">Sign in <ArrowRight size={15} /></Link></div></div>;
  if (!stats) return <div className="mx-auto min-h-[60vh] max-w-6xl px-5 pb-12 pt-20"><div className="h-8 w-48 rounded bg-white/[.06]" /><div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{[1,2,3,4].map((item) => <div className="h-24 rounded-2xl bg-white/[.06]" key={item} />)}</div></div>;

  const cards = [
    { label: "Total sales", value: formatMoney(stats.revenue), change: "All paid-order revenue", icon: Wallet },
    { label: "Orders", value: stats.orders.toLocaleString(), change: "Orders placed", icon: ClipboardList },
    { label: "Customers", value: stats.customers.toLocaleString(), change: "Registered shoppers", icon: Users },
    { label: "Low stock", value: stats.low_stock.length.toLocaleString(), change: "Products need a look", icon: AlertTriangle },
  ];
  const maxSold = Math.max(1, ...stats.top_products.map((item) => item.sold));
  const navigation = [{ name: "Overview", icon: BarChart3 }, { name: "Products", icon: Box }, { name: "Orders", icon: ClipboardList }, { name: "Inventory", icon: Package }];
  return <section className="page-frame mx-auto max-w-[1480px] px-5 pb-12 pt-20 sm:px-8 lg:px-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">NEXORA / OPERATIONS</p><h1 className="display-heading mt-3 text-5xl">Store operations.</h1><p className="mt-3 text-sm text-[#a1acbd]">Your store, all in one clear view.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/[.06] px-3.5 py-2.5 text-[10px] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> PostgreSQL connected</span></div>
    <div className="grid gap-6 lg:grid-cols-[190px_1fr]">
      <aside className="panel h-fit p-3 lg:sticky lg:top-24">{navigation.map(({ name, icon: Icon }) => <button key={name} onClick={() => { setSection(name); document.getElementById(name.toLowerCase())?.scrollIntoView({ behavior: "auto", block: "start" }); }} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs ${section === name ? "bg-accent/12 font-semibold text-accent" : "text-[#a09eab] hover:bg-white/[.05] hover:text-white"}`}><Icon size={15} />{name}</button>)}<Link href="/" className="mt-2 flex items-center gap-3 border-t border-white/[.08] px-3 pt-4 text-xs text-[#9997a4] hover:text-white"><ArrowRight className="rotate-180" size={15} /> View storefront</Link></aside>
      <div className="min-w-0 space-y-5">
        <div id="overview" className="grid scroll-mt-24 grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(({ label, value, change, icon: Icon }, index) => <div key={label} className="panel p-4 sm:p-5"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent"><Icon size={17} /></span>{index % 2 === 0 ? <ArrowUpRight size={15} className="text-blue-300" /> : <ArrowDownRight size={15} className="text-[#7f8291]" />}</div><p className="font-display mt-5 text-2xl font-extrabold">{value}</p><p className="mt-1 text-[11px] font-medium text-[#c1bfcb]">{label}</p><p className="mt-1 text-[9px] text-[#80828f]">{change}</p></div>)}</div>
        <section aria-labelledby="sales-trend-heading" className="panel p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="sales-trend-heading" className="font-display text-sm font-bold">Store activity</h2>
              <p className="mt-1 text-[10px] text-[#868894]">Orders and non-cancelled order value · last 7 days</p>
            </div>
            <div className="flex gap-4 text-[10px] text-[#a6aaa7]">
              <span><i className="mr-1.5 inline-block size-2 rounded-full bg-accent" />Order value</span>
              <span><i className="mr-1.5 inline-block size-2 rounded-full bg-sky-300" />Orders</span>
            </div>
          </div>
          <div className="h-56 w-full" role="img" aria-label="Seven-day order and revenue trend chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderTrend} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2583ff" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#2583ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#858a87", fontSize: 10 }} />
                <YAxis yAxisId="revenue" axisLine={false} tickLine={false} tick={{ fill: "#858a87", fontSize: 9 }} tickFormatter={(value: number) => formatMoney(value)} />
                <YAxis yAxisId="orders" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "#858a87", fontSize: 9 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#111512", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, fontSize: 11 }}
                  labelStyle={{ color: "#f5f5f5", marginBottom: 4 }}
                  formatter={(value, name) => [name === "Order value" ? formatMoney(Number(value)) : value, name]}
                />
                <Area isAnimationActive={false} yAxisId="revenue" type="monotone" dataKey="revenue" name="Order value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#adminRevenueFill)" />
                <Area isAnimationActive={false} yAxisId="orders" type="monotone" dataKey="orders" name="Orders" stroke="#7dd3fc" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <section className="panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-sm font-bold">Top products</h2><p className="mt-1 text-[10px] text-[#868894]">Units sold, all time</p></div><BarChart3 size={17} className="text-accent" /></div>{stats.top_products.length ? <div className="mt-6 space-y-4">{stats.top_products.map((item) => <div key={item.name}><div className="mb-2 flex justify-between text-[11px]"><span className="text-[#d6d4df]">{item.name}</span><span className="text-[#a09eaa]">{item.sold} sold</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[.07]"><div style={{ width: `${Math.max(4, (item.sold / maxSold) * 100)}%` }} className="h-full rounded-full bg-accent" /></div></div>)}</div> : <p className="py-12 text-center text-xs text-[#818390]">Sales insights will appear as orders come in.</p>}</section>
          <section id="inventory" className="panel scroll-mt-24 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-sm font-bold">A little heads-up</h2><p className="mt-1 text-[10px] text-[#868894]">Stock getting low</p></div><AlertTriangle size={17} className="text-amber-200" /></div>{stats.low_stock.length ? <div className="mt-4 space-y-2">{stats.low_stock.map((product) => <div key={product.pid} className="flex items-center justify-between rounded-xl border border-white/[.06] px-3 py-2.5"><span className="truncate pr-2 text-[11px]">{product.name}</span><span className="shrink-0 rounded-full bg-amber-200/10 px-2 py-1 text-[10px] text-amber-100">{product.stock} left</span></div>)}</div> : <p className="mt-8 text-center text-xs text-[#818390]">Your shelves are looking good.</p>}</section>
        </div>
        <section id="orders" className="panel scroll-mt-24 p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-sm font-bold">Recent orders</h2><p className="mt-1 text-[10px] text-[#868894]">The latest activity in your store</p></div><span className="rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] text-[#aaa8b5]">{orders.length} total</span></div>{orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-[11px]"><thead className="text-[9px] uppercase tracking-wider text-[#828491]"><tr><th className="py-3">Order</th><th>Total</th><th>Status</th><th className="text-right">Update</th></tr></thead><tbody>{orders.slice(0, 12).map((order) => <tr key={order.oid} className="border-t border-white/[.06]"><td className="py-3 font-semibold">#{order.oid}</td><td>{formatMoney(order.total)}</td><td><span className="rounded-full bg-accent/10 px-2 py-1 capitalize text-accent">{order.status}</span></td><td className="text-right">{NEXT_STATUSES[order.status].length ? <select aria-label={`Update order ${order.oid}`} className="field !w-auto !py-1.5 !text-[10px]" value={order.status} onChange={(event) => void act(() => api(`/orders/${order.oid}/status`, { method: "PATCH", body: JSON.stringify({ status: event.target.value }) }))}><option value={order.status} className="bg-[#12141d]">{order.status}</option>{NEXT_STATUSES[order.status].map((status) => <option key={status} className="bg-[#12141d]">{status}</option>)}</select> : <span className="text-[10px] capitalize text-[#858795]">{order.status === "delivered" ? "Complete" : "Closed"}</span>}</td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-xs text-[#818390]">New orders will show up here.</p>}</section>
        <section id="products" className="panel scroll-mt-24 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-sm font-bold">Product collection</h2><p className="mt-1 text-[10px] text-[#868894]">Edit the things you offer</p></div><button onClick={() => setAdding(!adding)} className="button-secondary !py-2 !text-[10px]">{adding ? <><X size={13} /> Close</> : <><Plus size={13} /> Add a product</>}</button></div>
          {adding && <div className="overflow-hidden"><form onSubmit={(event) => { event.preventDefault(); void act(async () => { await api("/products", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }) }); setForm(blank); setAdding(false); }); }} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3"><input required className="field !text-xs" placeholder="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><input className="field !text-xs" placeholder="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /><input className="field !text-xs" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><label className="block text-[10px] text-[#aaa8b5]">Price (INR ₹)<input required min="0" step="0.01" className="field mt-1 !text-xs" type="number" placeholder="e.g. 1499" aria-label="Price in Indian rupees" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label className="block text-[10px] text-[#aaa8b5]">Quantity in stock<input required min="0" step="1" className="field mt-1 !text-xs" type="number" placeholder="e.g. 25" aria-label="Quantity in stock" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label><button className="button-primary !py-2 !text-xs"><Plus size={14} /> Save product</button></form></div>}
          <div className="relative mt-4"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858795]" /><input className="field !pl-9 !text-xs" placeholder="Search products" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="mt-3 divide-y divide-white/[.06]">{filtered.map((product) => <div key={product.pid} className="flex items-center justify-between gap-3 py-3 text-xs"><div className="min-w-0"><p className="truncate font-medium">{product.name}</p><p className="mt-1 text-[10px] capitalize text-[#858795]">{product.category} · {product.stock} in stock</p></div><div className="flex shrink-0 items-center gap-3"><span className="text-right"><span className="block font-semibold">{formatMoney(festivalPrice(product))}</span><span className="block text-[10px] text-muted line-through">{formatMoney(product.price)}</span></span><button onClick={() => void act(() => api(`/products/${product.pid}`, { method: "DELETE" }))} aria-label={`Delete ${product.name}`} className="text-[#828491] hover:text-rose-200"><X size={15} /></button></div></div>)}</div>
          {error && <p role="alert" className="mt-3 text-xs text-rose-200">{error}</p>}
        </section>
        <div className="flex items-center gap-2 pb-3 text-[10px] text-[#9aa8ba]"><Sparkles size={13} /> Inventory, orders, and products are live from your NEXORA database.</div>
      </div>
    </div>
  </section>;
}
