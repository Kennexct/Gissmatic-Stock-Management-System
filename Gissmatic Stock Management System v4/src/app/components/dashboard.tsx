import React, { useState } from "react";
import {
  Package, AlertTriangle, TrendingDown, Boxes, Snowflake,
  Plus, ArrowUpRight, Clock, Package2, List, ChevronRight, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useAuth } from "./auth-context";
import { useQuickActions } from "./global-actions";
import { Skeleton } from "./ui/skeleton";
import { Product } from "../../lib/types";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

// ── Quick-view Modal for clicked stat card ────────────────────────
function StatDetailModal({
  title,
  items,
  onClose,
}: {
  title: string;
  items: { label: string; sublabel?: string; badge?: string; badgeColor?: string }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No items to display</p>
          ) : (
            items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  {item.sublabel && <p className="text-xs text-slate-400 font-mono">{item.sublabel}</p>}
                </div>
                {item.badge && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: item.badgeColor || "#f0f5ff", color: "#0a1565" }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { products, auditLogs, outgoingSales, customers, suppliers, categories, frozenStocks, currentUser, getUserPermissions, isLoading } = useAuth();
  const quickActions = useQuickActions();

  // ── Chart Data Calculations ─────────────────────────────────────
  
  // 1. Stock Distribution by Category (Pie Chart)
  const categoryData = categories.map(cat => {
    const count = products.filter(p => p.category === cat).length;
    return { name: cat, value: count };
  }).filter(c => c.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);

  const COLORS = ['#0a1565', '#16c60c', '#0ea5e9', '#7c3aed', '#f59e0b'];

  // 2. Movement Trend (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const trendData = last7Days.map(date => {
    const ins = (auditLogs || []).filter(l => l.timestamp.startsWith(date) && (l.action === "Stock-In" || l.action === "Created")).length;
    const outs = (outgoingSales || []).filter(s => s.timestamp.startsWith(date)).length;
    return { date: date.split('-').slice(1).join('/'), ins, outs };
  });

  const isSuperAdmin = currentUser?.role === "superadmin";
  const perms = currentUser ? getUserPermissions(currentUser.id) : null;
  const canAdd = isSuperAdmin || (perms?.showQuickAddStock ?? false);
  const canOut = isSuperAdmin || (perms?.showQuickOutStock ?? false);
  const canFreeze = isSuperAdmin || (perms?.canFreezeStock ?? false);

  const totalParts = products.length;
  const outOfStock = products.filter((p) => p.quantity === 0).length;
  const totalUnits = products.reduce((acc, p) => acc + p.quantity, 0);
  const recentMovements = outgoingSales.slice(0, 6);
  const lowStockProducts = products.filter((p) => p.quantity === 0 || p.quantity < 5).sort((a, b) => a.quantity - b.quantity);

  const [modalContent, setModalContent] = useState<{ title: string; items: any[] } | null>(null);

  const statCards = [
    {
      title: "Total Parts",
      value: totalParts,
      sub: "Unique part numbers",
      Icon: Package,
      iconBg: "#0a156515",
      iconColor: "#0a1565",
      onClick: () => setModalContent({
        title: "All Part Numbers",
        items: products.map((p) => ({
          label: p.name,
          sublabel: p.partNumber,
          badge: p.trackingType === "SN" ? `${p.serialNumbers.length} SN` : `${p.quantity} QTY`,
          badgeColor: p.quantity === 0 ? "#fff1f2" : "#f0f5ff",
        })),
      }),
    },
    {
      title: "Out of Stock",
      value: outOfStock,
      sub: "Zero stock items",
      Icon: AlertTriangle,
      iconBg: "#fff7ed",
      iconColor: "#e05a00",
      valueColor: outOfStock > 0 ? "#e05a00" : undefined,
      onClick: () => setModalContent({
        title: "Out of Stock Items",
        items: products.filter((p) => p.quantity === 0).map((p) => ({
          label: p.name,
          sublabel: p.partNumber,
          badge: "Empty",
          badgeColor: "#fff1f2",
        })),
      }),
    },
    {
      title: "Total Units",
      value: totalUnits.toLocaleString(),
      sub: "Available stock",
      Icon: Boxes,
      iconBg: "#f0fff4",
      iconColor: "#0d9904",
      onClick: () => setModalContent({
        title: "Stock by Product",
        items: [...products].sort((a, b) => b.quantity - a.quantity).map((p) => ({
          label: p.name,
          sublabel: p.partNumber,
          badge: p.trackingType === "SN" ? `${p.serialNumbers.length} SN` : `${p.quantity} units`,
          badgeColor: "#f0fff4",
        })),
      }),
    },
    {
      title: "Frozen Stock",
      value: frozenStocks.length,
      sub: "Awaiting release",
      Icon: Snowflake,
      iconBg: "#e0f2fe",
      iconColor: "#0369a1",
      valueColor: frozenStocks.length > 0 ? "#0369a1" : undefined,
      onClick: () => setModalContent({
        title: "Frozen Stock Items",
        items: frozenStocks.map((f) => ({
          label: f.productName,
          sublabel: f.partNumber,
          badge: f.trackingType === "SN" ? `${f.serialNumbers.length} SN` : `${f.quantity} QTY`,
          badgeColor: "#e0f2fe",
        })),
      }),
    },
  ];

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ color: "#0a1565" }}>Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAdd && (
            <Button
              onClick={() => quickActions?.openAddStock()}
              className="rounded-xl gap-2 text-white"
              style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
            >
              <Plus className="w-4 h-4" />Add Stock
            </Button>
          )}
          {canOut && (
            <Button
              onClick={() => quickActions?.openOutStock()}
              className="rounded-xl gap-2 font-semibold"
              style={{ background: "linear-gradient(135deg, #16c60c, #0d9904)", color: "#070e42" }}
            >
              <ArrowUpRight className="w-4 h-4" />Out Stock
            </Button>
          )}
          {canFreeze && frozenStocks.length > 0 && (
            <Button
              onClick={() => quickActions?.openFreezeList()}
              variant="outline"
              className="rounded-xl gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 relative"
            >
              <Snowflake className="w-4 h-4" />Freeze List
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center bg-purple-600 text-white">
                {frozenStocks.length}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats — clickable cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-12" /></div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : statCards.map((s) => (
          <button
            key={s.title}
            onClick={s.onClick}
            className="text-left rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all bg-white group"
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-slate-500 text-sm">{s.title}</p>
                  <p className="font-semibold text-xl" style={{ color: s.valueColor || "#0a1565" }}>{s.value}</p>
                  <p className="text-slate-400 text-xs">{s.sub}</p>
                </div>
                <div className="p-2.5 rounded-xl shrink-0" style={{ background: s.iconBg }}>
                  <s.Icon className="w-5 h-5" style={{ color: s.iconColor }} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium" style={{ color: "#16c60c" }}>View details</span>
                <ChevronRight className="w-3 h-3" style={{ color: "#16c60c" }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Movement Trend Chart */}
      <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold" style={{ color: "#0a1565" }}>Stock Activity Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-64 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorIns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0a1565" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0a1565" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOuts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16c60c" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#16c60c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="ins" stroke="#0a1565" strokeWidth={3} fillOpacity={1} fill="url(#colorIns)" name="Stock-In" />
              <Area type="monotone" dataKey="outs" stroke="#16c60c" strokeWidth={3} fillOpacity={1} fill="url(#colorOuts)" name="Stock-Out" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Stock Movements */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#0a1565" }}>
                <Clock className="w-4 h-4 text-slate-400" />
                Recent Stock Movements
              </CardTitle>
              {onNavigate && (
                <button onClick={() => onNavigate("reports")} className="text-sm hover:underline" style={{ color: "#0d9904" }}>View all</button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {recentMovements.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No movements yet — use Out Stock to get started</p>
                {canOut && (
                  <button onClick={() => quickActions?.openOutStock()} className="mt-3 text-sm font-medium hover:underline" style={{ color: "#0d9904" }}>
                    + Record first movement
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentMovements.map((sale) => (
                  <div key={sale.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-[#f8fbff] transition-colors gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fff7ed" }}>
                        <TrendingDown className="w-4 h-4" style={{ color: "#e05a00" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{sale.productName}</p>
                        <p className="text-xs text-slate-500">
                          {sale.customerName !== "—" ? `${sale.customerName} · ` : ""}
                          {sale.trackingType === "SN"
                            ? `${sale.quantity} SN${sale.quantity > 1 ? "s" : ""}`
                            : `${sale.quantity} unit${sale.quantity > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-slate-500">{sale.partNumber}</p>
                      <p className="text-xs text-slate-400">{new Date(sale.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* System overview — clickable items */}
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base" style={{ color: "#0a1565" }}>System Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Pie Chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1">
              {[
                { label: "Customers", value: customers.length, emoji: "👤", page: "customers" },
                { label: "Suppliers", value: suppliers.length, emoji: "🏭", page: "suppliers" },
                { label: "Categories", value: categories.length, emoji: "🏷️", page: "settings" },
                { label: "Total Movements", value: outgoingSales.length, emoji: "📦", page: "reports" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.page && onNavigate?.(item.page)}
                  className={`w-full flex items-center justify-between py-2 px-2 rounded-lg border-b border-slate-100 last:border-0 transition-colors ${item.page ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{item.emoji}</span>
                    <span className="text-sm text-slate-600">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm" style={{ color: "#0a1565" }}>{item.value}</span>
                    {item.page && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Frozen stock alert */}
          {frozenStocks.length > 0 && (
            <Card className="rounded-2xl shadow-sm" style={{ borderColor: "#bae6fd", background: "#e0f2fe" }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-sky-800">
                  <Snowflake className="w-4 h-4" />
                  Frozen Stock ({frozenStocks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {frozenStocks.slice(0, 4).map((f) => (
                  <div key={f.id} className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-sky-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate max-w-28">{f.productName}</p>
                      <p className="text-xs text-slate-400">{f.frozenBy}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
                      {f.trackingType === "SN" ? `${f.serialNumbers.length} SN` : `${f.quantity} QTY`}
                    </span>
                  </div>
                ))}
                {canFreeze && (
                  <button
                    onClick={() => quickActions?.openFreezeList()}
                    className="w-full text-center text-xs font-medium py-1.5 rounded-xl hover:bg-sky-100 transition-colors text-sky-700 mt-1"
                  >
                    <List className="w-3 h-3 inline mr-1" />View all frozen stock
                  </button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Low / out of stock alert */}
          {lowStockProducts.length > 0 && (
            <Card className="rounded-2xl shadow-sm" style={{ borderColor: "#fed7aa", background: "#fff7ed" }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#9a3a00" }}>
                  <AlertTriangle className="w-4 h-4" />
                  Low / Zero Stock ({lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-orange-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate max-w-28">{p.name}</p>
                      <p className="text-xs font-mono text-slate-400 truncate">{p.partNumber}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: "#fff7ed", color: "#9a3a00", border: "1px solid #fed7aa" }}>
                      {p.quantity === 0 ? "Empty" : `${p.quantity} left`}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base" style={{ color: "#0a1565" }}>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(products.map((p) => p.category))).map((cat) => {
              const items = products.filter((p) => p.category === cat);
              const pct = Math.round((items.length / products.length) * 100);
              const total = items.reduce((acc, p) => acc + p.quantity, 0);
              return (
                <button
                  key={cat}
                  onClick={() => onNavigate?.("inventory")}
                  className="bg-[#f8fbff] rounded-xl p-4 border border-slate-100 text-left hover:border-[#c7d5ff] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{cat}</span>
                    <span className="text-xs text-slate-400">{items.length} part{items.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #0a1565, #16c60c)" }} />
                  </div>
                  <p className="text-xs text-slate-400">{total.toLocaleString()} units · {pct}%</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stat detail modal */}
      {modalContent && (
        <StatDetailModal
          title={modalContent.title}
          items={modalContent.items}
          onClose={() => setModalContent(null)}
        />
      )}
    </div>
  );
}
