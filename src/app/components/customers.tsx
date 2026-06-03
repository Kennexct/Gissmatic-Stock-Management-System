import React, { useState } from "react";
import {
  UserPlus, Mail, Phone, MapPin, Globe, Calendar, ShoppingCart,
  ChevronDown, ChevronUp, AlertTriangle, Search,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { useAuth } from "./auth-context";
import { useCrudProgress } from "./crud-progress";
import { Customer } from "../../lib/types";
import { toast } from "sonner";

export function Customers() {
  const { customers, outgoingSales, addCustomer, deleteCustomer } = useAuth();
  const crud = useCrudProgress();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", country: "" });

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCustomerStats = (customerId: string) => {
    const sales = outgoingSales.filter((s) => s.customerId === customerId);
    return { count: sales.length, sales };
  };

  const totalMovements = outgoingSales.length;

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Name, email and phone are required"); return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { toast.error("Enter a valid email address"); return; }
    const opId = crud.startOperation("create", `Adding "${formData.name}"…`);
    try {
      await addCustomer(formData);
      crud.completeOperation(opId, `Customer "${formData.name}" added`);
    } catch { crud.failOperation(opId, "Failed to add customer"); }
    setIsAddModalOpen(false);
    setFormData({ name: "", email: "", phone: "", address: "", country: "" });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ color: "#0a1565" }}>Customers</h1>
          <p className="text-slate-500 text-sm mt-0.5">{customers.length} registered customer{customers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="rounded-xl gap-2 text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}>
          <UserPlus className="w-4 h-4" />Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: "Total Customers", value: customers.length, Icon: UserPlus, iconBg: "#0a156515", iconColor: "#0a1565" },
          { title: "Total Movements", value: totalMovements, Icon: ShoppingCart, iconBg: "#fff7ed", iconColor: "#e05a00" },
        ].map((stat) => (
          <Card key={stat.title} className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">{stat.title}</p>
                  <p className="font-semibold text-xl mt-0.5" style={{ color: "#0a1565" }}>{stat.value}</p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: stat.iconBg }}>
                  <stat.Icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, email, phone or country…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl bg-white border-slate-200 h-10"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>{searchQuery ? `No customers matching "${searchQuery}"` : "No customers yet. Add your first customer."}</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const stats = getCustomerStats(customer.id);
            const isExpanded = expandedCustomer === customer.id;
            return (
              <div key={customer.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0a156515" }}>
                    <span className="font-semibold text-base" style={{ color: "#0a1565" }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 truncate">{customer.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-sm text-slate-500 truncate">{customer.email}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-sm text-slate-600">{customer.phone}</p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-sm text-slate-500">{customer.country || "—"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Since {formatDate(customer.createdAt)}
                      </p>
                      {customer.address && (
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {customer.address}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{stats.count} movement{stats.count !== 1 ? "s" : ""}</p>
                      </div>
                      {stats.count > 0 && (
                        <Badge variant="success" className="rounded-lg shrink-0">Active</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {stats.count > 0 && (
                      <button
                        onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-sm font-medium"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        History
                      </button>
                    )}
                    <button
                      onClick={() => setCustomerToDelete(customer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium border border-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Movement History (expanded) */}
                {isExpanded && stats.sales.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 sm:px-5 py-4">
                    <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-slate-400" />
                      Stock Movement History
                    </p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white border-b border-slate-100 hover:bg-white">
                            <TableHead className="text-slate-500 font-medium text-xs py-2">Date</TableHead>
                            <TableHead className="text-slate-500 font-medium text-xs py-2">Product</TableHead>
                            <TableHead className="text-slate-500 font-medium text-xs py-2">Part Number</TableHead>
                            <TableHead className="text-slate-500 font-medium text-xs py-2">Type</TableHead>
                            <TableHead className="text-slate-500 font-medium text-xs py-2 text-right">Qty / SNs</TableHead>
                            <TableHead className="text-slate-500 font-medium text-xs py-2">Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.sales.map((sale) => (
                            <TableRow key={sale.id} className="border-b border-slate-100 hover:bg-white transition-colors">
                              <TableCell className="text-xs text-slate-600 py-2.5">{formatDate(sale.timestamp)}</TableCell>
                              <TableCell className="text-xs font-medium text-slate-900 py-2.5">{sale.productName}</TableCell>
                              <TableCell className="text-xs font-mono text-slate-500 py-2.5">{sale.partNumber}</TableCell>
                              <TableCell className="text-xs py-2.5">
                                <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
                                  style={{ background: sale.trackingType === "SN" ? "#f0f5ff" : "#f0fff4", color: sale.trackingType === "SN" ? "#0a1565" : "#0d6604" }}>
                                  {sale.trackingType}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-right font-semibold text-slate-900 py-2.5">
                                {sale.trackingType === "SN"
                                  ? <span className="font-mono">{sale.serialNumbers.length} SN</span>
                                  : sale.quantity}
                              </TableCell>
                              <TableCell className="text-xs text-slate-500 py-2.5 max-w-xs truncate">
                                {sale.note || <span className="text-slate-300">—</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <span className="text-sm text-slate-500 bg-white rounded-xl px-4 py-2 border border-slate-200">
                        {stats.count} movement{stats.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Register a new customer to track stock movements</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {[
              { id: "c-name", label: "Full Name *", key: "name", placeholder: "Jane Doe", type: "text" },
              { id: "c-email", label: "Email Address *", key: "email", placeholder: "jane@example.com", type: "email" },
              { id: "c-phone", label: "Phone Number *", key: "phone", placeholder: "+1-555-0000", type: "tel" },
              { id: "c-addr", label: "Address", key: "address", placeholder: "123 Main Street, City", type: "text" },
              { id: "c-country", label: "Country", key: "country", placeholder: "United States", type: "text" },
            ].map((f) => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={f.id}>{f.label}</Label>
                <Input
                  id={f.id}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(formData as any)[f.key]}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setIsAddModalOpen(false); setFormData({ name: "", email: "", phone: "", address: "", country: "" }); }}>Cancel</Button>
            <Button className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={handleAddCustomer}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />Remove Customer
            </DialogTitle>
            <DialogDescription>
              Remove <span className="font-semibold text-slate-900">{customerToDelete?.name}</span>? Their movement history will remain in the records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setCustomerToDelete(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={() => {
              if (customerToDelete) {
                const opId = crud.startOperation("delete", `Removing "${customerToDelete.name}"…`);
                deleteCustomer(customerToDelete.id);
                crud.completeOperation(opId, `Customer "${customerToDelete.name}" removed`);
              }
              setCustomerToDelete(null);
            }}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
