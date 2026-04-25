import React, { useState } from "react";
import {
  Search, Plus, Package2, AlertTriangle, Pencil, X, ImageOff, Clock, ChevronDown, ChevronUp,
  FileSpreadsheet, Download, AlertCircle, CheckCircle2, Trash2,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { useAuth } from "./auth-context";
import { useQuickActions } from "./global-actions";
import { Product } from "../../lib/types";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ── Add New Product Modal ───────────────────────────────────────────
function AddNewProductModal({ onClose }: { onClose: () => void }) {
  const { addProduct, addAuditLog, currentUser, categories, suppliers, products } = useAuth();
  const [form, setForm] = useState({ name: "", pn: "", category: "", supplierName: "" });
  const [addSnInput, setAddSnInput] = useState("");
  const [addSnList, setAddSnList] = useState<string[]>([]);
  const [addQty, setAddQty] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);

  const isSnMode = addSnList.length > 0 || addSnInput.trim() !== "";
  const isQtyMode = addQty.trim() !== "";

  const handleAddSn = () => {
    const sn = addSnInput.trim();
    if (!sn) return;
    if (addSnList.includes(sn)) { toast.error(`SN "${sn}" already staged`); return; }
    setAddSnList([...addSnList, sn]);
    setAddSnInput("");
  };

  const handleSave = () => {
    if (!form.name || !form.pn || !form.category) {
      toast.error("Please fill in all required product details"); return;
    }
    const trackingType = isSnMode ? "SN" : "QTY";

    if (trackingType === "SN" && addSnList.length === 0) {
      toast.error("Add at least one serial number, or clear the SN input to use Quantity tracking."); return;
    }
    if (trackingType === "QTY" && (!addQty || parseInt(addQty) <= 0)) {
      toast.error("Enter a valid quantity"); return;
    }
    if (products.find((p) => p.partNumber.toLowerCase() === form.pn.trim().toLowerCase())) {
      toast.error("Part number already exists in inventory"); return;
    }

    const qty = trackingType === "SN" ? addSnList.length : parseInt(addQty);
    addProduct({ partNumber: form.pn.trim().toUpperCase(), name: form.name.trim(), category: form.category, trackingType, quantity: qty, serialNumbers: trackingType === "SN" ? [...addSnList] : [], supplierName: form.supplierName });
    addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Created", itemName: form.name.trim(), changeDetail: trackingType === "SN" ? `+${addSnList.length} SNs` : `+${qty} QTY` });
    toast.success(`"${form.name.trim()}" created successfully`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0a1565]">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Create New Product
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Part Number *</Label>
            <Input placeholder="e.g. PN-12345" value={form.pn} onChange={(e) => setForm({ ...form, pn: e.target.value.toUpperCase() })} className="rounded-xl font-mono uppercase" />
          </div>
          <div className="space-y-1.5">
            <Label>Product Name *</Label>
            <Input placeholder="Enter product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label>Category *</Label>
              <button 
                type="button" 
                onClick={() => { setIsCustomCategory(!isCustomCategory); setForm({...form, category: ""}); }} 
                className="text-xs font-semibold text-[#0a1565] hover:underline"
              >
                {isCustomCategory ? "Pick Existing" : "+ New Category"}
              </button>
            </div>
            {isCustomCategory ? (
              <Input placeholder="Type new category..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl" autoFocus />
            ) : (
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label>Supplier</Label>
              <button 
                type="button" 
                onClick={() => { setIsCustomSupplier(!isCustomSupplier); setForm({...form, supplierName: ""}); }} 
                className="text-xs font-semibold text-[#0a1565] hover:underline"
              >
                {isCustomSupplier ? "Pick Existing" : "+ New Supplier"}
              </button>
            </div>
            {isCustomSupplier ? (
              <Input placeholder="Type new supplier name..." value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} className="rounded-xl" autoFocus />
            ) : (
              <Select value={form.supplierName} onValueChange={(v) => setForm({ ...form, supplierName: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select supplier (optional)" /></SelectTrigger>
                <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-sm font-medium mb-3 text-slate-800">Initial Stock Level (Choose SN or Quantity)</p>
            <div className="space-y-4">
              {!isQtyMode && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Track by Serial Number</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Enter SN..." value={addSnInput} onChange={(e) => setAddSnInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSn(); } }} className="rounded-xl font-mono flex-1" />
                    <Button type="button" variant="outline" className="rounded-xl shrink-0" onClick={handleAddSn}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {addSnList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {addSnList.map((sn) => (
                        <span key={sn} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono" style={{ background: "#f0fff4", color: "#0d6604", border: "1px solid #bbf7d0" }}>
                          {sn}<button onClick={() => setAddSnList(addSnList.filter((s) => s !== sn))}><X className="w-3 h-3 ml-0.5 hover:text-red-500" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isSnMode && !isQtyMode && (
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">Or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
              )}

              {!isSnMode && (
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Track by Quantity</Label>
                  <Input type="number" min="1" placeholder="Enter starting quantity..." value={addQty} onChange={(e) => setAddQty(e.target.value)} className="rounded-xl" />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
          <Button className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={handleSave}>
            <Plus className="w-4 h-4 mr-1.5" />Create Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Product Modal ──────────────────────────────────────────────
function EditProductModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { updateProduct, deleteProduct, addAuditLog, currentUser, categories, auditLogs } = useAuth();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || "");
  const [imageUrl, setImageUrl] = useState(product.imageUrl || "");
  const [category, setCategory] = useState(product.category);
  const [supplierName, setSupplierName] = useState(product.supplierName);
  const [imgError, setImgError] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const productLogs = auditLogs
    .filter((l) => l.itemName.toLowerCase() === product.name.toLowerCase())
    .slice(0, 20);

  const actionColors: Record<string, { bg: string; text: string }> = {
    "Stock-In":  { bg: "#f0fff4", text: "#0d6604" },
    "Stock-Out": { bg: "#fff7ed", text: "#9a3a00" },
    "Frozen":    { bg: "#e0f2fe", text: "#0369a1" },
    "Released":  { bg: "#f0fff4", text: "#0d6604" },
    "Cancelled": { bg: "#f8fafc", text: "#475569" },
    "Created":   { bg: "#faf5ff", text: "#6b21a8" },
    "Updated":   { bg: "#f0f9ff", text: "#0369a1" },
    "Deleted":   { bg: "#fff1f2", text: "#991b1b" },
    "Adjustment":{ bg: "#f0f5ff", text: "#0a1565" },
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Product name is required"); return; }
    if (!category.trim()) { toast.error("Category is required"); return; }
    updateProduct(product.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      category: category.trim(),
      supplierName: supplierName.trim(),
    });
    addAuditLog({
      userName: currentUser?.name || "Unknown",
      userEmail: currentUser?.email || "",
      action: "Updated",
      itemName: name.trim(),
      changeDetail: "Product details updated",
    });
    toast.success(`"${name.trim()}" updated successfully`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#0a156515" }}>
              <Pencil className="w-4 h-4" style={{ color: "#0a1565" }} />
            </div>
            Edit Product
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image preview + URL */}
          <div className="space-y-2">
            <Label>Product Image <span className="text-slate-400 font-normal">(URL, optional)</span></Label>
            <div className="flex gap-3 items-start">
              <div className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
                {imageUrl && !imgError ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <ImageOff className="w-7 h-7 text-slate-300" />
                )}
              </div>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => { setImageUrl(e.target.value); setImgError(false); }}
                className="rounded-xl flex-1"
              />
            </div>
          </div>

          {/* Part number (read-only) */}
          <div className="space-y-1.5">
            <Label>Part Number <span className="text-slate-400 font-normal">(read-only)</span></Label>
            <div className="px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 font-mono text-sm text-slate-500">
              {product.partNumber}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Product Name *</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              placeholder="Enter product name"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description <span className="text-slate-400 font-normal">(optional)</span></Label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this product..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0a1565]/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-cat">Category *</Label>
            <Input
              id="edit-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl"
              placeholder="Enter category"
            />
          </div>

          {/* Supplier */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-sup">Supplier</Label>
            <Input
              id="edit-sup"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="rounded-xl"
              placeholder="Enter supplier name"
            />
          </div>

          {/* Tracking info (read-only) */}
          <div className="rounded-xl p-3 border border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Tracking Type</p>
              <p className="text-sm font-medium text-slate-700">
                {product.trackingType === "SN" ? "Serial Number" : "Quantity"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Current Stock</p>
              <p className="text-sm font-semibold" style={{ color: "#0a1565" }}>
                {product.trackingType === "SN" ? `${product.serialNumbers.length} SNs` : `${product.quantity} units`}
              </p>
            </div>
          </div>

          {/* Product Log toggle */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <button
              onClick={() => setShowLog(!showLog)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Product Activity Log</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{productLogs.length}</span>
              </div>
              {showLog ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showLog && (
              <div className="border-t border-slate-100 max-h-48 overflow-y-auto">
                {productLogs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No activity recorded yet</p>
                ) : (
                  productLogs.map((log) => {
                    const cfg = actionColors[log.action] || { bg: "#f8fafc", text: "#475569" };
                    const date = new Date(log.timestamp);
                    return (
                      <div key={log.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-0.5"
                          style={{ background: cfg.bg, color: cfg.text }}
                        >
                          {log.action}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-slate-600 break-all">{log.changeDetail}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {log.userName} · {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
            {(currentUser?.role === 'superadmin') && (
              <Button
                variant="destructive"
                className="rounded-xl px-4"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${product.name}"? This action is permanent.`)) {
                    deleteProduct(product.id);
                    onClose();
                    toast.success("Product deleted successfully");
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-1.5" />Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2 justify-end">
            <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
            <Button
              className="rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
              onClick={handleSave}
            >
              <Pencil className="w-4 h-4 mr-1.5" />Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Import Products Modal ──────────────────────────────────────────
function ImportProductsModal({ onClose }: { onClose: () => void }) {
  const { addProduct, updateProduct, deleteProduct, addAuditLog, currentUser, categories, suppliers, products } = useAuth();
  const [importData, setImportData] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<{valid: boolean; reason?: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadTemplate = () => {
    const templateData = [
      ["Part Number", "Product Name", "Category", "Supplier", "Tracking Type", "Stock (QTY or SNs)"],
      ["PN-QTY-001", "Example QTY Product", categories[0] || "General", suppliers[0]?.name || "N/A", "QTY", "10"],
      ["PN-SN-001", "Example SN Product", categories[0] || "General", suppliers[0]?.name || "N/A", "SN", "SN1001; SN1002; SN1003"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Inventory_Import_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      validateData(data);
    };
    reader.readAsBinaryString(file);
  };

  const validateData = (data: any[]) => {
    const results = data.map((row: any) => {
      const pn = String(row["Part Number"] || "").trim();
      const name = String(row["Product Name"] || "").trim();
      const cat = String(row["Category"] || "").trim();
      const sup = String(row["Supplier"] || "").trim();
      const type = String(row["Tracking Type"] || "").trim().toUpperCase();
      const stock = String(row["Stock (QTY or SNs)"] || "").trim();

      if (!pn || !name || !cat || !type) return { valid: false, reason: "Missing required fields" };
      if (type !== "SN" && type !== "QTY") return { valid: false, reason: "Invalid Tracking Type (use SN or QTY)" };

      // Strict Option A: Check category/supplier
      if (!categories.includes(cat)) return { valid: false, reason: `Category "${cat}" not found` };
      if (sup && sup !== "N/A" && !suppliers.some(s => s.name === sup)) return { valid: false, reason: `Supplier "${sup}" not found` };

      // Check PN duplication logic
      const existing = products.find(p => p.partNumber.toUpperCase() === pn.toUpperCase());
      if (existing) {
        // If existing, check SN duplicates
        if (existing.trackingType === "SN" && type === "SN") {
          const newSns = stock.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
          const dups = newSns.filter(sn => existing.serialNumbers.includes(sn));
          if (dups.length > 0) return { valid: false, reason: `Duplicate SNs found: ${dups.join(", ")}` };
        }
        if (existing.trackingType !== type) return { valid: false, reason: `Conflict: Existing product is ${existing.trackingType}, import is ${type}` };
      }

      return { valid: true };
    });

    setImportData(data);
    setValidationResults(results);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    let successCount = 0;

    for (let i = 0; i < importData.length; i++) {
      if (!validationResults[i].valid) continue;
      const row = importData[i];
      const pn = String(row["Part Number"]).trim().toUpperCase();
      const name = String(row["Product Name"]).trim();
      const cat = String(row["Category"]).trim();
      const sup = String(row["Supplier"]).trim();
      const type = String(row["Tracking Type"]).trim().toUpperCase() as "SN" | "QTY";
      const stock = String(row["Stock (QTY or SNs)"]).trim();

      const existing = products.find(p => p.partNumber.toUpperCase() === pn);
      if (existing) {
        // Stock-In logic
        if (type === "SN") {
          const newSns = stock.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
          updateProduct(existing.id, { 
            serialNumbers: [...existing.serialNumbers, ...newSns],
            quantity: existing.quantity + newSns.length
          });
          addAuditLog({ 
            userName: currentUser?.name || "System", 
            userEmail: currentUser?.email || "", 
            action: "Stock-In", 
            itemName: existing.name, 
            changeDetail: `Bulk Import: +${newSns.length} SNs` 
          });
        } else {
          const qty = parseInt(stock) || 0;
          updateProduct(existing.id, { quantity: existing.quantity + qty });
          addAuditLog({ 
            userName: currentUser?.name || "System", 
            userEmail: currentUser?.email || "", 
            action: "Stock-In", 
            itemName: existing.name, 
            changeDetail: `Bulk Import: +${qty} units` 
          });
        }
      } else {
        // Create new logic
        const qty = type === "SN" ? stock.split(/[;,]+/).filter(Boolean).length : (parseInt(stock) || 0);
        const sns = type === "SN" ? stock.split(/[;,]+/).map(s => s.trim()).filter(Boolean) : [];
        addProduct({ 
          partNumber: pn, 
          name, 
          category: cat, 
          supplierName: sup || "N/A", 
          trackingType: type, 
          quantity: qty, 
          serialNumbers: sns 
        });
        addAuditLog({ 
          userName: currentUser?.name || "System", 
          userEmail: currentUser?.email || "", 
          action: "Created", 
          itemName: name, 
          changeDetail: `Bulk Import (${type})` 
        });
      }
      successCount++;
    }

    toast.success(`Successfully imported ${successCount} items`);
    setIsProcessing(false);
    onClose();
  };

  const validRows = importData.filter((_, i) => validationResults[i]?.valid);
  const errorCount = importData.length - validRows.length;
  const canConfirm = validRows.length > 0 && !isProcessing;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0a1565]">
              <FileSpreadsheet className="w-4 h-4 text-white" />
            </div>
            Bulk Import Products
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Step 1: Template */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">1. Download Template</p>
              <p className="text-xs text-slate-500">Use this format to ensure successful import.</p>
            </div>
            <Button onClick={downloadTemplate} variant="outline" className="rounded-xl gap-2 bg-white">
              <Download className="w-4 h-4" />Download .xlsx
            </Button>
          </div>

          {/* Step 2: Upload */}
          <div className="space-y-3">
            <p className="font-semibold text-slate-900">2. Upload File</p>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#0a1565] transition-colors relative">
              <input 
                type="file" 
                accept=".xlsx,.csv" 
                onChange={handleFileUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">Click or drag your CSV/Excel file here</p>
            </div>
          </div>

          {/* Step 3: Preview */}
          {importData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">3. Preview & Validation</p>
                <div className="flex items-center gap-2">
                  {errorCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                      {errorCount} errors will be skipped
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${errorCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                    {validRows.length} rows ready
                  </span>
                </div>
              </div>
              <div className="border rounded-xl overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.map((row, idx) => (
                      <TableRow key={idx} className={validationResults[idx]?.valid ? "" : "bg-red-50"}>
                        <TableCell className="text-xs text-slate-400">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{row["Part Number"]}</TableCell>
                        <TableCell className="text-xs font-medium">{row["Product Name"]}</TableCell>
                        <TableCell>
                          {validationResults[idx]?.valid ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-600 font-medium" title={validationResults[idx]?.reason}>
                              <AlertCircle className="w-3 h-3" /> {validationResults[idx]?.reason}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {errorCount > 0 && `Note: ${errorCount} rows with errors will be ignored.`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button 
              onClick={handleImport}
              disabled={!canConfirm}
              className="rounded-xl text-white min-w-[140px]"
              style={{ background: canConfirm ? "linear-gradient(135deg, #0a1565, #1229b3)" : "#e2e8f0" }}
            >
              {isProcessing ? "Processing..." : `Import ${validRows.length} Items`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Inventory Component ───────────────────────────────────────
export function Inventory() {
  const { products, currentUser, getUserPermissions } = useAuth();
  const quickActions = useQuickActions();

  const isSuperAdmin = currentUser?.role === "superadmin";
  const perms = currentUser ? getUserPermissions(currentUser.id) : null;
  const canAdd = isSuperAdmin || (perms?.canAddStock ?? false);
  const canEdit = isSuperAdmin || (perms?.canStockIn ?? false); // use canStockIn as proxy for edit access
  const canImport = isSuperAdmin || (perms?.canImportProducts ?? false);

  const [searchQuery, setSearchQuery] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.serialNumbers.some((sn) => sn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStock = products.reduce((a, p) => a + p.quantity, 0);

  return (
    <div className="space-y-6 pt-14 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ color: "#0a1565" }}>Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {products.length} part{products.length !== 1 ? "s" : ""} · {totalStock.toLocaleString()} total units
          </p>
        </div>
        <div className="flex gap-2">
          {canImport && (
            <Button
              onClick={() => setIsImportOpen(true)}
              variant="outline"
              className="rounded-xl gap-2 border-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4" />Import Products
            </Button>
          )}
          {canAdd && (
            <Button
              onClick={() => setIsAddOpen(true)}
              className="rounded-xl gap-2 text-white"
              style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
            >
              <Plus className="w-4 h-4" />Add New Product
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, part number, S/N or category…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl bg-white border-slate-200 h-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-slate-100" style={{ background: "#f8fbff" }}>
              <TableHead className="text-slate-500 font-medium">Product</TableHead>
              <TableHead className="text-slate-500 font-medium">Part Number</TableHead>
              <TableHead className="text-slate-500 font-medium hidden md:table-cell">Category</TableHead>
              <TableHead className="text-slate-500 font-medium hidden lg:table-cell">Supplier</TableHead>
              <TableHead className="text-slate-500 font-medium">Tracking</TableHead>
              <TableHead className="text-slate-500 font-medium text-right">Stock</TableHead>
              <TableHead className="text-slate-500 font-medium">Status</TableHead>
              <TableHead className="text-slate-500 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                  <Package2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p>{searchQuery ? `No results for "${searchQuery}"` : "No products found — add your first product"}</p>
                  {canAdd && !searchQuery && (
                    <button
                      onClick={() => setIsAddOpen(true)}
                      className="mt-3 text-sm font-medium hover:underline"
                      style={{ color: "#0d9904" }}
                    >
                      + Add New Product
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const isOutOfStock = product.quantity === 0;
                return (
                  <TableRow key={product.id} className="border-b border-slate-50 hover:bg-[#f8fbff] transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" style={{ background: "#f0f5ff" }}>
                            <Package2 className="w-4 h-4" style={{ color: "#0a1565" }} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate max-w-36">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-slate-400 truncate max-w-36">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-mono text-sm text-slate-700">{product.partNumber}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium" style={{ background: "#0a156510", color: "#0a1565" }}>
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 max-w-28 truncate hidden lg:table-cell">{product.supplierName}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
                        style={{
                          background: product.trackingType === "SN" ? "#f0f5ff" : "#f0fff4",
                          color: product.trackingType === "SN" ? "#0a1565" : "#0d6604",
                        }}
                      >
                        {product.trackingType === "SN" ? "Serial No." : "Qty"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold" style={{ color: isOutOfStock ? "#dc2626" : "#0a1565" }}>
                        {product.trackingType === "SN" ? `${product.serialNumbers.length} SN` : product.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#fff1f2", color: "#991b1b" }}>
                          <AlertTriangle className="w-3 h-3" />Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#f0fff4", color: "#0d6604" }}>
                          In Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setEditProduct(product)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border hover:shadow-sm"
                        style={{ background: "#f0f5ff", color: "#0a1565", borderColor: "#c7d5ff" }}
                        title="Edit product"
                      >
                        <Pencil className="h-3 w-3" />Edit
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Serial Numbers preview rows */}
      {filteredProducts.some((p) => p.trackingType === "SN" && p.serialNumbers.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold mb-3" style={{ color: "#0a1565" }}>Serial Number Registry</p>
          <div className="space-y-3">
            {filteredProducts
              .filter((p) => p.trackingType === "SN" && p.serialNumbers.length > 0)
              .slice(0, 5)
              .map((p) => (
                <div key={p.id} className="flex items-start gap-3">
                  <span className="text-xs font-medium text-slate-500 w-32 shrink-0 pt-1 truncate">{p.name}</span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {p.serialNumbers.slice(0, 8).map((sn) => (
                      <span key={sn} className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-mono" style={{ background: "#f0f5ff", color: "#0a1565", border: "1px solid #c7d5ff" }}>
                        {sn}
                      </span>
                    ))}
                    {p.serialNumbers.length > 8 && (
                      <span className="text-xs text-slate-400 self-center">+{p.serialNumbers.length - 8} more</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <EditProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
        />
      )}
      
      {/* Add New Product Modal */}
      {isAddOpen && (
        <AddNewProductModal onClose={() => setIsAddOpen(false)} />
      )}

      {/* Import Products Modal */}
      {isImportOpen && (
        <ImportProductsModal onClose={() => setIsImportOpen(false)} />
      )}
    </div>
  );
}
