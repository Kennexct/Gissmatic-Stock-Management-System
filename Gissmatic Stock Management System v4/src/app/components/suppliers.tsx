import React, { useState } from "react";
import { Plus, Mail, Phone, MapPin, Globe, Calendar, Truck, Search, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { useAuth } from "./auth-context";
import { useCrudProgress } from "./crud-progress";
import { Supplier } from "../../lib/types";
import { toast } from "sonner";

type SupplierForm = { name: string; phone: string; email: string; address: string; country: string };
const emptyForm: SupplierForm = { name: "", phone: "", email: "", address: "", country: "" };

const SUPPLIER_FIELDS = [
  { id: "s-name", label: "Supplier Name *", key: "name", placeholder: "ABC Distributors Inc", type: "text" },
  { id: "s-phone", label: "Phone Number *", key: "phone", placeholder: "+1-555-0123", type: "tel" },
  { id: "s-email", label: "Email Address *", key: "email", placeholder: "contact@supplier.com", type: "email" },
  { id: "s-addr", label: "Address", key: "address", placeholder: "123 Main Street, City", type: "text" },
  { id: "s-country", label: "Country", key: "country", placeholder: "United States", type: "text" },
];

// ── Defined OUTSIDE Suppliers to prevent remounting on every render ──
function SupplierFormFields({ data, onChange, idPrefix = "" }: {
  data: SupplierForm;
  onChange: (d: SupplierForm) => void;
  idPrefix?: string;
}) {
  return (
    <div className="space-y-4 py-3">
      {SUPPLIER_FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={`${idPrefix}${f.id}`}>{f.label}</Label>
          <Input
            id={`${idPrefix}${f.id}`}
            type={f.type}
            placeholder={f.placeholder}
            value={(data as any)[f.key]}
            onChange={(e) => onChange({ ...data, [f.key]: e.target.value })}
            className="rounded-xl"
          />
        </div>
      ))}
    </div>
  );
}

export function Suppliers() {
  const { suppliers, addSupplier, updateSupplier } = useAuth();
  const crud = useCrudProgress();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<SupplierForm>(emptyForm);
  const [editForm, setEditForm] = useState<SupplierForm>(emptyForm);

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateForm = (form: SupplierForm) => {
    if (!form.name || !form.phone || !form.email) {
      toast.error("Please fill in required fields (Name, Phone, Email)"); return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { toast.error("Enter a valid email address"); return false; }
    return true;
  };

  const handleAddSupplier = async () => {
    if (!validateForm(formData)) return;
    const opId = crud.startOperation("create", `Adding "${formData.name}"…`);
    try {
      await addSupplier(formData);
      crud.completeOperation(opId, `Supplier "${formData.name}" added`);
    } catch { crud.failOperation(opId, "Failed to add supplier"); }
    setIsAddModalOpen(false);
    setFormData(emptyForm);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditForm({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      country: supplier.country,
    });
  };

  const handleEditSupplier = async () => {
    if (!editingSupplier) return;
    if (!validateForm(editForm)) return;
    const opId = crud.startOperation("update", `Updating "${editForm.name}"…`);
    try {
      await updateSupplier(editingSupplier.id, editForm);
      crud.completeOperation(opId, `Supplier "${editForm.name}" updated`);
    } catch { crud.failOperation(opId, "Failed to update supplier"); }
    setEditingSupplier(null);
    setEditForm(emptyForm);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2" style={{ color: "#0a1565" }}>
            <Truck className="h-7 w-7" style={{ color: "#16c60c" }} />
            Suppliers
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} registered</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-xl gap-2 text-white"
          style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
        >
          <Plus className="w-4 h-4" />Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, email or country…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl bg-white border-slate-200 h-10"
        />
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center text-slate-400">
            <Truck className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>{searchQuery ? `No suppliers matching "${searchQuery}"` : "No suppliers found. Add your first supplier."}</p>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, #0a156515, #16c60c15)" }}
                    >
                      <span className="font-bold" style={{ color: "#0a1565" }}>
                        {supplier.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{supplier.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{formatDate(supplier.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(supplier)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:shadow-sm border"
                    style={{ background: "#f0f5ff", color: "#0a1565", borderColor: "#c7d5ff" }}
                    title="Edit supplier"
                  >
                    <Pencil className="w-3 h-3" />Edit
                  </button>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-600 truncate">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-600">{supplier.phone}</span>
                  </div>
                  {supplier.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-600 truncate">{supplier.address}</span>
                    </div>
                  )}
                  {supplier.country && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-600">{supplier.country}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Supplier Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Enter supplier details to add to your system</DialogDescription>
          </DialogHeader>
          <SupplierFormFields data={formData} onChange={setFormData} idPrefix="add-" />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setIsAddModalOpen(false); setFormData(emptyForm); }}>
              Cancel
            </Button>
            <Button className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={handleAddSupplier}>
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Modal */}
      <Dialog open={!!editingSupplier} onOpenChange={() => { setEditingSupplier(null); setEditForm(emptyForm); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#0a156515" }}>
                <Pencil className="w-4 h-4" style={{ color: "#0a1565" }} />
              </div>
              Edit Supplier
            </DialogTitle>
            <DialogDescription>Update supplier information for <span className="font-semibold">{editingSupplier?.name}</span></DialogDescription>
          </DialogHeader>
          <SupplierFormFields data={editForm} onChange={setEditForm} idPrefix="edit-" />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setEditingSupplier(null); setEditForm(emptyForm); }}>
              Cancel
            </Button>
            <Button className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={handleEditSupplier}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
