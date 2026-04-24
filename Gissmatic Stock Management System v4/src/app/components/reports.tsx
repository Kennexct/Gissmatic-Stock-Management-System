import React, { useState, useMemo } from "react";
import {
  FileDown, BarChart3, Search, ScanLine, ArrowUpRight,
  ArrowDownToLine, Sliders, Snowflake, TrendingUp, TrendingDown,
  Calendar, Filter, RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { useAuth } from "./auth-context";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export function Reports() {
  const { auditLogs, products } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // ── Computed stats ─────────────────────────────────────────────
  const stockInEvents = auditLogs.filter((l) => l.action === "Stock-In");
  const stockOutEvents = auditLogs.filter((l) => l.action === "Stock-Out");
  const adjustmentEvents = auditLogs.filter((l) => l.action === "Adjustment");
  const frozenEvents = auditLogs.filter((l) => l.action === "Frozen");
  const releasedEvents = auditLogs.filter((l) => l.action === "Released");
  const cancelledEvents = auditLogs.filter((l) => l.action === "Cancelled");

  // ── Date helpers ───────────────────────────────────────────────
  const now = new Date();
  const getDateCutoff = () => {
    if (dateRange === "7d") return new Date(now.getTime() - 7 * 86400000);
    if (dateRange === "30d") return new Date(now.getTime() - 30 * 86400000);
    if (dateRange === "90d") return new Date(now.getTime() - 90 * 86400000);
    return null;
  };

  const formatTs = (ts: string) => {
    const d = new Date(ts);
    return {
      date: d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  // ── Filtered logs ──────────────────────────────────────────────
  const query = searchQuery.toLowerCase().trim();
  const cutoff = getDateCutoff();

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (cutoff && new Date(log.timestamp) < cutoff) return false;
      const matchesSearch = !query ||
        log.itemName.toLowerCase().includes(query) ||
        log.userName.toLowerCase().includes(query) ||
        (log.customerName || "").toLowerCase().includes(query) ||
        (log.note || "").toLowerCase().includes(query) ||
        (() => {
          const p = products.find((pp) => pp.name.toLowerCase() === log.itemName.toLowerCase());
          return p ? p.partNumber.toLowerCase().includes(query) : false;
        })();
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, query, actionFilter, cutoff, products]);

  // ── Chart data: last 7 days activity ──────────────────────────
  const chartData = useMemo(() => {
    const days: { day: string; in: number; out: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateStr = d.toDateString();
      days.push({
        day: label,
        in: auditLogs.filter((l) => l.action === "Stock-In" && new Date(l.timestamp).toDateString() === dateStr).length,
        out: auditLogs.filter((l) => l.action === "Stock-Out" && new Date(l.timestamp).toDateString() === dateStr).length,
      });
    }
    return days;
  }, [auditLogs]);

  // ── Top movers ─────────────────────────────────────────────────
  const topOutItems = useMemo(() => {
    const counts: Record<string, number> = {};
    stockOutEvents.forEach((l) => { counts[l.itemName] = (counts[l.itemName] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [stockOutEvents]);

  const topInItems = useMemo(() => {
    const counts: Record<string, number> = {};
    stockInEvents.forEach((l) => { counts[l.itemName] = (counts[l.itemName] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [stockInEvents]);

  const maxOut = topOutItems.length > 0 ? topOutItems[0][1] : 1;
  const maxIn = topInItems.length > 0 ? topInItems[0][1] : 1;

  // ── Action badge config ────────────────────────────────────────
  const actionConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
    "Stock-In":   { label: "Stock In",   dot: "#0d9904", bg: "#f0fff4", text: "#0d6604" },
    "Stock-Out":  { label: "Stock Out",  dot: "#e05a00", bg: "#fff7ed", text: "#9a3a00" },
    "Adjustment": { label: "Adjustment", dot: "#1229b3", bg: "#f0f5ff", text: "#0a1565" },
    "Frozen":     { label: "Frozen",     dot: "#0369a1", bg: "#e0f2fe", text: "#0369a1" },
    "Released":   { label: "Released",   dot: "#0d9904", bg: "#f0fff4", text: "#0d6604" },
    "Cancelled":  { label: "Cancelled",  dot: "#64748b", bg: "#f8fafc", text: "#475569" },
    "Created":    { label: "Created",    dot: "#6b21a8", bg: "#faf5ff", text: "#6b21a8" },
    "Updated":    { label: "Updated",    dot: "#0369a1", bg: "#f0f9ff", text: "#0369a1" },
    "Deleted":    { label: "Deleted",    dot: "#dc2626", bg: "#fff1f2", text: "#991b1b" },
  };

  const ActionBadge = ({ action }: { action: string }) => {
    const cfg = actionConfig[action] || { label: action, dot: "#64748b", bg: "#f8fafc", text: "#475569" };
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: cfg.bg, color: cfg.text }}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
        {cfg.label}
      </span>
    );
  };

  const ChangeBadge = ({ detail }: { detail: string }) => {
    const isPos = detail.startsWith("+");
    const isNeg = detail.startsWith("-");
    const bg = isPos ? "#f0fff4" : isNeg ? "#fff7ed" : "#f8fafc";
    const color = isPos ? "#0d6604" : isNeg ? "#9a3a00" : "#475569";
    return (
      <span className="font-mono text-xs px-2 py-1 rounded-lg font-semibold break-all" style={{ background: bg, color }}>
        {detail}
      </span>
    );
  };

  // ── Exports ────────────────────────────────────────────────────
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(10, 21, 101);
    doc.rect(0, 0, 220, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("GISSMATIC — Stock Movement Report", 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text("Summary", 14, 48);
    doc.setFontSize(9);
    doc.text(`Stock-In: ${stockInEvents.length} events`, 14, 56);
    doc.text(`Stock-Out: ${stockOutEvents.length} events`, 14, 62);
    doc.text(`Adjustments: ${adjustmentEvents.length} events`, 14, 68);
    doc.text(`Frozen: ${frozenEvents.length} events`, 14, 74);
    autoTable(doc, {
      startY: 82,
      head: [["Timestamp", "User", "Action", "Product", "Change", "Customer", "Reference/Note"]],
      body: filteredLogs.map((log) => {
        const { date, time } = formatTs(log.timestamp);
        return [`${date}\n${time}`, log.userName, log.action, log.itemName, log.changeDetail, log.customerName || "—", log.note || "—"];
      }),
      theme: "grid",
      headStyles: { fillColor: [10, 21, 101], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 22 }, 4: { fontStyle: "bold" } },
    });
    doc.save(`gissmatic-movements-${Date.now()}.pdf`);
  };

  const exportToExcel = () => {
    const data = filteredLogs.map((log) => {
      const { date, time } = formatTs(log.timestamp);
      return { Date: date, Time: time, User: log.userName, Email: log.userEmail, Action: log.action, Product: log.itemName, Change: log.changeDetail, Customer: log.customerName || "", "Reference/Note": log.note || "" };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Stock Movements");
    const summary = [
      ["GISSMATIC Stock Movement Report"], [""],
      ["Metric", "Value"],
      ["Total Parts", products.length],
      ["Stock-In Events", stockInEvents.length],
      ["Stock-Out Events", stockOutEvents.length],
      ["Adjustments", adjustmentEvents.length],
      ["Frozen Events", frozenEvents.length],
      ["Report Generated", new Date().toLocaleString()],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");
    XLSX.writeFile(wb, `gissmatic-report-${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2" style={{ color: "#0a1565" }}>
            <BarChart3 className="h-7 w-7" style={{ color: "#16c60c" }} />
            Reports & Analytics
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {auditLogs.length} total events · {products.length} active products
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" className="rounded-xl gap-2 border-slate-200 hover:border-[#0a1565] hover:text-[#0a1565]" onClick={exportToPDF}>
            <FileDown className="w-4 h-4" />PDF
          </Button>
          <Button className="rounded-xl gap-2 text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={exportToExcel}>
            <FileDown className="w-4 h-4" />Excel
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Stock-In",    value: stockInEvents.length,   sub: "Inbound movements", Icon: ArrowDownToLine, accent: "#0d9904", lightBg: "#f0fff4", darkBg: "#0d9904" },
          { title: "Stock-Out",   value: stockOutEvents.length,  sub: "Outbound movements", Icon: ArrowUpRight,   accent: "#e05a00", lightBg: "#fff7ed", darkBg: "#e05a00" },
          { title: "Frozen",      value: frozenEvents.length,    sub: `${releasedEvents.length} released · ${cancelledEvents.length} cancelled`, Icon: Snowflake, accent: "#0369a1", lightBg: "#e0f2fe", darkBg: "#0369a1" },
          { title: "Adjustments", value: adjustmentEvents.length, sub: "Manual changes", Icon: Sliders, accent: "#6b21a8", lightBg: "#faf5ff", darkBg: "#6b21a8" },
        ].map((s) => (
          <Card key={s.title} className="rounded-2xl border-0 shadow-sm overflow-hidden" style={{ background: s.lightBg }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: s.accent }}>{s.title}</p>
                  <p className="font-bold text-2xl mt-0.5 text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: s.darkBg }}>
                  <s.Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Chart + Top Movers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart: 7-day activity */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: "#0a1565" }}>
                <Calendar className="w-4 h-4 text-slate-400" />
                7-Day Activity
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#0d9904" }} />In</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#e05a00" }} />Out</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    cursor={{ fill: "#f8fbff" }}
                  />
                  <Bar dataKey="in" name="Stock-In" fill="#0d9904" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="out" name="Stock-Out" fill="#e05a00" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Out Movers */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "#0a1565" }}>
              <TrendingDown className="w-4 h-4 text-orange-400" />
              Top Out-Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topOutItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No stock-out events recorded</p>
            ) : (
              topOutItems.map(([item, count], i) => (
                <div key={item} className="flex items-center gap-2.5">
                  <span className="text-xs font-bold w-4 text-slate-400 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{item}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((count / maxOut) * 100)}%`, background: "#e05a00" }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold shrink-0 text-orange-600">{count}×</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Activity log table ── */}
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base" style={{ color: "#0a1565" }}>
                Movement Log
              </CardTitle>
              <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""}
              </span>
            </div>
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-2 pb-3 border-b border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search product, user, customer, note…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-xl border-slate-200 w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="rounded-xl w-36 border-slate-200 shrink-0">
                    <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="Stock-In">Stock-In</SelectItem>
                    <SelectItem value="Stock-Out">Stock-Out</SelectItem>
                    <SelectItem value="Frozen">Frozen</SelectItem>
                    <SelectItem value="Released">Released</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Adjustment">Adjustment</SelectItem>
                    <SelectItem value="Created">Created</SelectItem>
                    <SelectItem value="Updated">Updated</SelectItem>
                    <SelectItem value="Deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="rounded-xl w-32 border-slate-200 shrink-0">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ background: "#f8fbff" }}>
                  {["Date / Time", "By", "Action", "Product", "Change", "Customer", "Note"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-slate-400">
                      <ScanLine className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p>{query || actionFilter !== "all" ? "No records match your filters" : "No stock movements recorded yet"}</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const { date, time } = formatTs(log.timestamp);
                    const partNumber = products.find((p) => p.name === log.itemName)?.partNumber;
                    return (
                      <tr key={log.id} className="border-b border-slate-50 hover:bg-[#f8fbff] transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm font-medium text-slate-800">{date}</p>
                          <p className="text-xs text-slate-400">{time}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-800 whitespace-nowrap">{log.userName}</p>
                          <p className="text-xs text-slate-400 truncate max-w-28">{log.userEmail}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-800 max-w-36 truncate">{log.itemName}</p>
                          {partNumber && <p className="text-xs text-slate-400 font-mono">{partNumber}</p>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ChangeBadge detail={log.changeDetail} />
                        </td>
                        <td className="px-4 py-3">
                          {log.customerName ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold" style={{ background: "#16c60c20", color: "#0d6604" }}>
                                {log.customerName.charAt(0)}
                              </div>
                              <span className="text-sm text-slate-700 truncate max-w-24">{log.customerName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {log.note ? (
                            <span className="text-sm text-slate-600 truncate block max-w-32" title={log.note}>{log.note}</span>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Bottom analytics: Top In + Product activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Stock-In Items */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "#0a1565" }}>
              <TrendingUp className="w-4 h-4 text-green-500" />
              Top Stock-In Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topInItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No stock-in events recorded</p>
            ) : (
              topInItems.map(([item, count], i) => (
                <div key={item} className="flex items-center gap-2.5">
                  <span className="text-xs font-bold w-4 text-slate-400 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{item}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((count / maxIn) * 100)}%`, background: "#0d9904" }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold shrink-0 text-green-600">{count}×</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card className="rounded-2xl border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2" style={{ color: "#0a1565" }}>
              <Sliders className="w-4 h-4 text-slate-400" />
              Inventory by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from(new Set(products.map((p) => p.category))).map((cat) => {
              const items = products.filter((p) => p.category === cat);
              const units = items.reduce((s, p) => s + p.quantity, 0);
              const pct = products.length > 0 ? Math.round((items.length / products.length) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-slate-700 truncate">{cat}</p>
                      <span className="text-xs text-slate-400 shrink-0 ml-2">{items.length} part{items.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #0a1565, #16c60c)" }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 shrink-0 w-14 text-right">{units.toLocaleString()} u</span>
                </div>
              );
            })}
            {products.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No products in inventory</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
