import React, { createContext, useContext, useState } from "react";
import {
  Plus, ArrowUpFromLine, Snowflake, List, ChevronUp, ChevronDown,
  Package, AlertTriangle, X, Check, ArrowDownToLine, Trash2, ScanLine,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "./ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { useAuth } from "./auth-context";
import { toast } from "sonner";
import { Product, FrozenStock } from "../../lib/types";

interface QuickActionsContextType {
  openAddStock: () => void;
  openOutStock: (product?: Product) => void;
  openFreezeStock: (product?: Product) => void;
  openFreezeList: () => void;
}

const QuickActionsContext = createContext<QuickActionsContextType | null>(null);

export function useQuickActions() {
  return useContext(QuickActionsContext);
}

// ─── Shared Product Card ─────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-xl p-3 border" style={{ background: "linear-gradient(135deg, #f0f5ff, #eef9ff)", borderColor: "#c7d5ff" }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm" style={{ color: "#0a1565" }}>{product.name}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{product.partNumber}</p>
          <p className="text-xs text-slate-500 mt-0.5">{product.category} · {product.supplierName}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold"
            style={{ background: product.trackingType === "SN" ? "#f0f5ff" : "#f0fff4", color: product.trackingType === "SN" ? "#0a1565" : "#0d6604" }}>
            {product.trackingType === "SN" ? "Serial No." : "Qty"}
          </span>
          <p className="text-xs text-slate-500 mt-1">
            {product.trackingType === "SN"
              ? `${product.serialNumbers.length} SN${product.serialNumbers.length !== 1 ? "s" : ""} available`
              : `${product.quantity} units`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation Dialog ─────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  confirmStyle?: React.CSSProperties;
  icon?: React.ReactNode;
}
function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", confirmStyle, icon }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{icon}{title}</DialogTitle>
          <DialogDescription asChild><div className="text-sm text-slate-600">{description}</div></DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
          <Button className="rounded-xl text-white" style={confirmStyle || { background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Provider ────────────────────────────────────────────────────
export function GlobalActionsProvider({ children }: { children: React.ReactNode }) {
  const {
    products, suppliers, customers, categories,
    addProduct, addAuditLog, addSupplier, addCustomer, addOutgoingSale,
    updateProduct, addFrozenStock, releaseFrozenStock, frozenStocks,
    currentUser, addCategory, getUserPermissions,
  } = useAuth();

  const perms = currentUser ? getUserPermissions(currentUser.id) : null;
  const isSuperAdmin = currentUser?.role === "superadmin";
  const canAdd = isSuperAdmin || (perms?.showQuickAddStock ?? false);
  const canOut = isSuperAdmin || (perms?.showQuickOutStock ?? false);
  const canFreeze = isSuperAdmin || (perms?.canFreezeStock ?? false);

  const [isFabExpanded, setIsFabExpanded] = useState(false);

  // ── Add Stock ──
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addPn, setAddPn] = useState("");
  const [addFoundProduct, setAddFoundProduct] = useState<Product | null>(null);
  const [addSnInput, setAddSnInput] = useState("");
  const [addSnList, setAddSnList] = useState<string[]>([]);
  const [addQty, setAddQty] = useState("");
  const [addNote, setAddNote] = useState("");
  // New product fields (when PN not found)
  const [addIsNew, setAddIsNew] = useState(false);
  const [newProdForm, setNewProdForm] = useState({ name: "", category: "", trackingType: "QTY" as "SN" | "QTY", supplierName: "" });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomSupplier, setIsCustomSupplier] = useState(false);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);

  // ── Out Stock ──
  const [isOutOpen, setIsOutOpen] = useState(false);
  const [outPn, setOutPn] = useState("");
  const [outFoundProduct, setOutFoundProduct] = useState<Product | null>(null);
  const [outSelectedSns, setOutSelectedSns] = useState<string[]>([]);
  const [outSnInput, setOutSnInput] = useState("");
  const [outQty, setOutQty] = useState("");
  const [outCustomerId, setOutCustomerId] = useState("");
  const [outNote, setOutNote] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", address: "", country: "" });
  const [confirmOutOpen, setConfirmOutOpen] = useState(false);

  // ── Freeze Stock ──
  const [isFreezeOpen, setIsFreezeOpen] = useState(false);
  const [freezePn, setFreezePn] = useState("");
  const [freezeFoundProduct, setFreezeFoundProduct] = useState<Product | null>(null);
  const [freezeSelectedSns, setFreezeSelectedSns] = useState<string[]>([]);
  const [freezeSnInput, setFreezeSnInput] = useState("");
  const [freezeQty, setFreezeQty] = useState("");
  const [freezeCustomer, setFreezeCustomer] = useState("");
  const [freezeNote, setFreezeNote] = useState("");
  const [confirmFreezeOpen, setConfirmFreezeOpen] = useState(false);

  // ── Freeze List ──
  const [isFreezeListOpen, setIsFreezeListOpen] = useState(false);
  const [releasingFrozen, setReleasingFrozen] = useState<FrozenStock | null>(null);
  const [releaseAction, setReleaseAction] = useState<"confirm" | "cancel" | null>(null);

  // ─── Part number lookup helpers ───
  const lookupProduct = (pn: string) =>
    products.find((p) => p.partNumber.toLowerCase() === pn.toLowerCase().trim());

  const handleAddPnChange = (v: string) => {
    setAddPn(v);
    const found = lookupProduct(v);
    setAddFoundProduct(found || null);
    setAddIsNew(false);
    setAddSnList([]);
    setAddQty("");
  };

  const handleOutPnChange = (v: string) => {
    setOutPn(v);
    const found = lookupProduct(v);
    setOutFoundProduct(found || null);
    setOutSelectedSns([]);
    setOutSnInput("");
    setOutQty("");
  };

  const handleFreezePnChange = (v: string) => {
    setFreezePn(v);
    const found = lookupProduct(v);
    setFreezeFoundProduct(found || null);
    setFreezeSelectedSns([]);
    setFreezeQty("");
  };

  // ─── Reset helpers ───
  const resetAdd = () => { setAddPn(""); setAddFoundProduct(null); setAddSnInput(""); setAddSnList([]); setAddQty(""); setAddNote(""); setAddIsNew(false); setNewProdForm({ name: "", category: "", trackingType: "QTY", supplierName: "" }); };
  const resetOut = () => { setOutPn(""); setOutFoundProduct(null); setOutSelectedSns([]); setOutSnInput(""); setOutQty(""); setOutCustomerId(""); setOutNote(""); };
  const resetFreeze = () => { setFreezePn(""); setFreezeFoundProduct(null); setFreezeSelectedSns([]); setFreezeSnInput(""); setFreezeQty(""); setFreezeCustomer(""); setFreezeNote(""); };

  // ─── Open handlers ───
  const openAddStock = () => { resetAdd(); setIsAddOpen(true); };
  const openOutStock = (product?: Product) => {
    resetOut();
    if (product) { setOutPn(product.partNumber); setOutFoundProduct(product); }
    setIsOutOpen(true);
  };
  const openFreezeStock = (product?: Product) => {
    resetFreeze();
    if (product) { setFreezePn(product.partNumber); setFreezeFoundProduct(product); }
    setIsFreezeOpen(true);
  };
  const openFreezeList = () => setIsFreezeListOpen(true);

  // ─── Add SN to staged list ───
  const handleAddSn = () => {
    const sn = addSnInput.trim();
    if (!sn) return;
    if (addFoundProduct && addFoundProduct.serialNumbers.includes(sn)) {
      toast.error(`SN "${sn}" already exists in inventory`); return;
    }
    if (addSnList.includes(sn)) { toast.error(`SN "${sn}" already staged`); return; }
    setAddSnList([...addSnList, sn]);
    setAddSnInput("");
  };

  // ─── Toggle SN selection (Freeze) ───
  const toggleSn = (sn: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(sn) ? list.filter((s) => s !== sn) : [...list, sn]);
  };

  // ─── Scan SN to remove (Out Stock) ───
  const handleOutSnScan = () => {
    const sn = outSnInput.trim();
    if (!sn) return;
    if (!outFoundProduct) return;
    if (!outFoundProduct.serialNumbers.includes(sn)) {
      toast.error(`SN "${sn}" not found in this product's inventory`); return;
    }
    if (outSelectedSns.includes(sn)) {
      toast.error(`SN "${sn}" already staged for out`); return;
    }
    setOutSelectedSns([...outSelectedSns, sn]);
    setOutSnInput("");
  };

  // ─── Scan SN to freeze (Freeze Stock) ───
  const handleFreezeSnScan = () => {
    const sn = freezeSnInput.trim();
    if (!sn) return;
    if (!freezeFoundProduct) return;
    if (!freezeFoundProduct.serialNumbers.includes(sn)) {
      toast.error(`SN "${sn}" not found in this product's inventory`); return;
    }
    if (freezeSelectedSns.includes(sn)) {
      toast.error(`SN "${sn}" already staged to freeze`); return;
    }
    setFreezeSelectedSns([...freezeSelectedSns, sn]);
    setFreezeSnInput("");
  };

  // ─── CONFIRM Add Stock ───
  const executeAddStock = () => {
    if (addIsNew) {
      // Create new product
      if (!newProdForm.name || !newProdForm.category || !newProdForm.supplierName) {
        toast.error("Please fill in all product details"); return;
      }
      if (newProdForm.trackingType === "SN" && addSnList.length === 0) {
        toast.error("Add at least one serial number"); return;
      }
      if (newProdForm.trackingType === "QTY" && (!addQty || parseInt(addQty) <= 0)) {
        toast.error("Enter a valid quantity"); return;
      }
      const qty = newProdForm.trackingType === "SN" ? addSnList.length : parseInt(addQty);
      addProduct({ partNumber: addPn.trim(), name: newProdForm.name, category: newProdForm.category, trackingType: newProdForm.trackingType, quantity: qty, serialNumbers: newProdForm.trackingType === "SN" ? [...addSnList] : [], supplierName: newProdForm.supplierName });
      addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Created", itemName: newProdForm.name, changeDetail: newProdForm.trackingType === "SN" ? `+${addSnList.length} SNs` : `+${qty} QTY`, note: addNote });
      toast.success(`"${newProdForm.name}" created with initial stock`);
    } else {
      // Add to existing product
      if (!addFoundProduct) return;
      if (addFoundProduct.trackingType === "SN") {
        if (addSnList.length === 0) { toast.error("Add at least one serial number"); return; }
        const dup = addSnList.find((sn) => addFoundProduct.serialNumbers.includes(sn));
        if (dup) { toast.error(`SN "${dup}" already exists`); return; }
        updateProduct(addFoundProduct.id, {
          serialNumbers: [...addFoundProduct.serialNumbers, ...addSnList],
          quantity: addFoundProduct.quantity + addSnList.length,
        });
        addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Stock-In", itemName: addFoundProduct.name, changeDetail: `+${addSnList.length} SN${addSnList.length > 1 ? "s" : ""}: ${addSnList.join(", ")}`, note: addNote });
        toast.success(`+${addSnList.length} serial number(s) added to "${addFoundProduct.name}"`);
      } else {
        const qty = parseInt(addQty);
        if (isNaN(qty) || qty <= 0) { toast.error("Enter a valid quantity"); return; }
        updateProduct(addFoundProduct.id, { quantity: addFoundProduct.quantity + qty });
        addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Stock-In", itemName: addFoundProduct.name, changeDetail: `+${qty} QTY`, note: addNote });
        toast.success(`+${qty} units added to "${addFoundProduct.name}"`);
      }
    }
    setIsAddOpen(false);
    resetAdd();
  };

  // ─── CONFIRM Out Stock ───
  const executeOutStock = () => {
    if (!outFoundProduct) return;
    const customer = outCustomerId && outCustomerId !== "none" ? customers.find((c) => c.id === outCustomerId) : undefined;
    if (outFoundProduct.trackingType === "SN") {
      if (outSelectedSns.length === 0) { toast.error("Select at least one serial number"); return; }
      updateProduct(outFoundProduct.id, {
        serialNumbers: outFoundProduct.serialNumbers.filter((sn) => !outSelectedSns.includes(sn)),
        quantity: outFoundProduct.quantity - outSelectedSns.length,
      });
      addOutgoingSale({ customerId: customer?.id || "", customerName: customer?.name || "—", productId: outFoundProduct.id, productName: outFoundProduct.name, partNumber: outFoundProduct.partNumber, trackingType: "SN", serialNumbers: outSelectedSns, quantity: outSelectedSns.length, note: outNote });
      addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Stock-Out", itemName: outFoundProduct.name, changeDetail: `-${outSelectedSns.length} SN${outSelectedSns.length > 1 ? "s" : ""}: ${outSelectedSns.join(", ")}`, customerName: customer?.name, note: outNote });
      toast.success(`${outSelectedSns.length} SN(s) moved out from "${outFoundProduct.name}"`);
    } else {
      const qty = parseInt(outQty);
      if (isNaN(qty) || qty <= 0) { toast.error("Enter a valid quantity"); return; }
      if (qty > outFoundProduct.quantity) { toast.error(`Only ${outFoundProduct.quantity} units available`); return; }
      updateProduct(outFoundProduct.id, { quantity: outFoundProduct.quantity - qty });
      addOutgoingSale({ customerId: customer?.id || "", customerName: customer?.name || "—", productId: outFoundProduct.id, productName: outFoundProduct.name, partNumber: outFoundProduct.partNumber, trackingType: "QTY", serialNumbers: [], quantity: qty, note: outNote });
      addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Stock-Out", itemName: outFoundProduct.name, changeDetail: `-${qty} QTY`, customerName: customer?.name, note: outNote });
      toast.success(`${qty} unit(s) moved out from "${outFoundProduct.name}"`);
    }
    setIsOutOpen(false);
    resetOut();
  };

  // ─── CONFIRM Freeze Stock ───
  const executeFreezeStock = () => {
    if (!freezeFoundProduct) return;
    if (freezeFoundProduct.trackingType === "SN") {
      if (freezeSelectedSns.length === 0) { toast.error("Select at least one serial number"); return; }
      updateProduct(freezeFoundProduct.id, {
        serialNumbers: freezeFoundProduct.serialNumbers.filter((sn) => !freezeSelectedSns.includes(sn)),
        quantity: freezeFoundProduct.quantity - freezeSelectedSns.length,
      });
      addFrozenStock({ productId: freezeFoundProduct.id, productName: freezeFoundProduct.name, partNumber: freezeFoundProduct.partNumber, trackingType: "SN", serialNumbers: freezeSelectedSns, quantity: freezeSelectedSns.length, frozenBy: currentUser?.name || "Unknown", frozenByEmail: currentUser?.email || "", customerName: freezeCustomer || undefined, note: freezeNote || undefined });
      addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Frozen", itemName: freezeFoundProduct.name, changeDetail: `Frozen ${freezeSelectedSns.length} SN${freezeSelectedSns.length > 1 ? "s" : ""}: ${freezeSelectedSns.join(", ")}`, customerName: freezeCustomer || undefined, note: freezeNote });
      toast.success(`${freezeSelectedSns.length} SN(s) frozen from "${freezeFoundProduct.name}"`);
    } else {
      const qty = parseInt(freezeQty);
      if (isNaN(qty) || qty <= 0) { toast.error("Enter a valid quantity"); return; }
      if (qty > freezeFoundProduct.quantity) { toast.error(`Only ${freezeFoundProduct.quantity} units available`); return; }
      updateProduct(freezeFoundProduct.id, { quantity: freezeFoundProduct.quantity - qty });
      addFrozenStock({ productId: freezeFoundProduct.id, productName: freezeFoundProduct.name, partNumber: freezeFoundProduct.partNumber, trackingType: "QTY", serialNumbers: [], quantity: qty, frozenBy: currentUser?.name || "Unknown", frozenByEmail: currentUser?.email || "", customerName: freezeCustomer || undefined, note: freezeNote || undefined });
      addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Frozen", itemName: freezeFoundProduct.name, changeDetail: `Frozen ${qty} QTY`, customerName: freezeCustomer || undefined, note: freezeNote });
      toast.success(`${qty} unit(s) frozen from "${freezeFoundProduct.name}"`);
    }
    setIsFreezeOpen(false);
    resetFreeze();
  };

  // ─── Release frozen stock ───
  const executeRelease = () => {
    if (!releasingFrozen || !releaseAction) return;
    const action = releaseAction;
    const frozen = releasingFrozen;
    if (action === "confirm") {
      // Confirm as stock-out
      addOutgoingSale({ customerId: "", customerName: frozen.customerName || "—", productId: frozen.productId, productName: frozen.productName, partNumber: frozen.partNumber, trackingType: frozen.trackingType, serialNumbers: frozen.serialNumbers, quantity: frozen.trackingType === "SN" ? frozen.serialNumbers.length : frozen.quantity, note: frozen.note || "" });
      addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Released", itemName: frozen.productName, changeDetail: frozen.trackingType === "SN" ? `-${frozen.serialNumbers.length} SNs (released from freeze)` : `-${frozen.quantity} QTY (released from freeze)`, customerName: frozen.customerName, note: frozen.note });
      toast.success(`Stock confirmed out from frozen: "${frozen.productName}"`);
    } else {
      // Cancel — return to stock
      addAuditLog({ userName: currentUser?.name || "Unknown", userEmail: currentUser?.email || "", action: "Cancelled", itemName: frozen.productName, changeDetail: frozen.trackingType === "SN" ? `Returned ${frozen.serialNumbers.length} SNs to stock` : `Returned ${frozen.quantity} QTY to stock`, note: frozen.note });
      toast.success(`Frozen stock cancelled — returned to "${frozen.productName}"`);
    }
    releaseFrozenStock(frozen.id, action);
    setReleasingFrozen(null);
    setReleaseAction(null);
  };



  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email || !newCustomer.phone) { toast.error("Name, email and phone required"); return; }
    addCustomer(newCustomer);
    toast.success(`Customer "${newCustomer.name}" added`);
    setNewCustomer({ name: "", email: "", phone: "", address: "", country: "" });
    setIsAddCustomerOpen(false);
  };

  const canDoAddStock = () => {
    if (!addFoundProduct && !addIsNew) return false;
    if (addFoundProduct) {
      if (addFoundProduct.trackingType === "SN") return addSnList.length > 0;
      return !!(addQty && parseInt(addQty) > 0);
    }
    if (addIsNew) {
      if (!newProdForm.name || !newProdForm.category || !newProdForm.supplierName) return false;
      if (newProdForm.trackingType === "SN") return addSnList.length > 0;
      return !!(addQty && parseInt(addQty) > 0);
    }
    return false;
  };

  const canDoOutStock = () => {
    if (!outFoundProduct) return false;
    if (outFoundProduct.trackingType === "SN") return outSelectedSns.length > 0;
    return !!(outQty && parseInt(outQty) > 0 && parseInt(outQty) <= outFoundProduct.quantity);
  };

  const canDoFreezeStock = () => {
    if (!freezeFoundProduct) return false;
    if (freezeFoundProduct.trackingType === "SN") return freezeSelectedSns.length > 0;
    return !!(freezeQty && parseInt(freezeQty) > 0 && parseInt(freezeQty) <= freezeFoundProduct.quantity);
  };

  return (
    <QuickActionsContext.Provider value={{ openAddStock, openOutStock, openFreezeStock, openFreezeList }}>
      {children}

      {/* ═══ FAB ═══ */}
      {currentUser && (canAdd || canOut || canFreeze) && (
        <div className="fixed bottom-6 right-5 z-30 flex flex-col items-end gap-2">
          {isFabExpanded && (
            <div className="flex flex-col items-end gap-2 mb-1">
              {frozenStocks.length > 0 && (canFreeze || isSuperAdmin) && (
                <button
                  onClick={() => { setIsFreezeListOpen(true); setIsFabExpanded(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all whitespace-nowrap text-sm font-medium text-white relative"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
                >
                  <List className="w-4 h-4" />Freeze List
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center bg-red-500 text-white">{frozenStocks.length}</span>
                </button>
              )}
              {(canFreeze) && (
                <button
                  onClick={() => { setIsFreezeOpen(true); resetFreeze(); setIsFabExpanded(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all whitespace-nowrap text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}
                >
                  <Snowflake className="w-4 h-4" />Freeze Stock
                </button>
              )}
              {canOut && (
                <button
                  onClick={() => { setIsOutOpen(true); resetOut(); setIsFabExpanded(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all whitespace-nowrap text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #16c60c, #0d9904)", color: "#070e42" }}
                >
                  <ArrowUpFromLine className="w-4 h-4" />Out Stock
                </button>
              )}
              {canAdd && (
                <button
                  onClick={() => { setIsAddOpen(true); resetAdd(); setIsFabExpanded(false); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a1565] text-white shadow-lg hover:bg-[#070e42] transition-all whitespace-nowrap text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />Add Stock
                </button>
              )}
            </div>
          )}

          {/* Freeze list badge (always visible when frozen items exist) */}
          {!isFabExpanded && frozenStocks.length > 0 && (canFreeze || isSuperAdmin) && (
            <button
              onClick={() => setIsFreezeListOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl shadow-lg text-white text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
            >
              <Snowflake className="w-3.5 h-3.5" />
              {frozenStocks.length} Frozen
            </button>
          )}

          <button
            onClick={() => setIsFabExpanded(!isFabExpanded)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: isFabExpanded ? "linear-gradient(135deg, #0a1565, #070e42)" : "linear-gradient(135deg, #16c60c, #0d9904)" }}
            title="Quick Actions"
          >
            {isFabExpanded ? <ChevronDown className="w-6 h-6 text-white" /> : <ChevronUp className="w-6 h-6 text-white" />}
          </button>
        </div>
      )}

      {/* ═══ ADD STOCK MODAL ═══ */}
      <Dialog open={isAddOpen} onOpenChange={(v) => { if (!v) { setIsAddOpen(false); resetAdd(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}>
                <ArrowDownToLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Add New Product / Stock</DialogTitle>
                <DialogDescription>Enter part number to add incoming stock or create a new product</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Part Number */}
            <div className="space-y-1.5">
              <Label htmlFor="add-pn">Part Number *</Label>
              <Input
                id="add-pn"
                placeholder="e.g. PN-LAPTOP-HP-001"
                value={addPn}
                onChange={(e) => handleAddPnChange(e.target.value)}
                className="rounded-xl font-mono"
              />
            </div>

            {/* Not found → offer to create */}
            {addPn.trim().length > 3 && !addFoundProduct && !addIsNew && (
              <div className="rounded-xl p-3 border border-amber-200 bg-amber-50 flex items-center justify-between gap-3">
                <p className="text-sm text-amber-700">Part number not found in inventory.</p>
                <Button size="sm" variant="outline" className="rounded-lg text-xs shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setAddIsNew(true)}>
                  + Create New
                </Button>
              </div>
            )}

            {/* Existing product card */}
            {addFoundProduct && !addIsNew && (
              <>
                <ProductCard product={addFoundProduct} />
                {/* SN input */}
                {addFoundProduct.trackingType === "SN" && (
                  <div className="space-y-2">
                    <Label>Serial Numbers to Add *</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter serial number"
                        value={addSnInput}
                        onChange={(e) => setAddSnInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSn(); } }}
                        className="rounded-xl font-mono flex-1"
                      />
                      <Button type="button" variant="outline" className="rounded-xl shrink-0" onClick={handleAddSn}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {addSnList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {addSnList.map((sn) => (
                          <span key={sn} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono" style={{ background: "#f0fff4", color: "#0d6604", border: "1px solid #bbf7d0" }}>
                            {sn}
                            <button onClick={() => setAddSnList(addSnList.filter((s) => s !== sn))} className="ml-0.5 hover:text-red-500"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    {addSnList.length > 0 && (
                      <p className="text-xs text-slate-500">{addSnList.length} SN(s) staged</p>
                    )}
                  </div>
                )}
                {/* QTY input */}
                {addFoundProduct.trackingType === "QTY" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="add-qty">Quantity to Add *</Label>
                    <Input id="add-qty" type="number" min="1" placeholder="Enter quantity" value={addQty} onChange={(e) => setAddQty(e.target.value)} className="rounded-xl" />
                    {addQty && parseInt(addQty) > 0 && (
                      <p className="text-xs" style={{ color: "#0d6604" }}>New total: {addFoundProduct.quantity + parseInt(addQty)} units</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* New product form */}
            {addIsNew && (
              <div className="space-y-4 rounded-xl p-5 border border-slate-200 bg-white shadow-sm mt-4">
                <p className="text-sm font-semibold" style={{ color: "#0a1565" }}>New Product Details</p>
                <div className="space-y-1.5">
                  <Label htmlFor="np-name">Product Name *</Label>
                  <Input id="np-name" placeholder="Enter product name" value={newProdForm.name} onChange={(e) => setNewProdForm({ ...newProdForm, name: e.target.value })} className="rounded-xl" />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label>Category *</Label>
                    <button 
                      type="button" 
                      onClick={() => { setIsCustomCategory(!isCustomCategory); setNewProdForm({...newProdForm, category: ""}); }} 
                      className="text-xs font-semibold text-[#0a1565] hover:underline"
                    >
                      {isCustomCategory ? "Pick Existing" : "+ New Category"}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <Input placeholder="Type new category..." value={newProdForm.category} onChange={(e) => setNewProdForm({ ...newProdForm, category: e.target.value })} className="rounded-xl" autoFocus />
                  ) : (
                    <Select value={newProdForm.category} onValueChange={(v) => setNewProdForm({ ...newProdForm, category: v })}>
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
                      onClick={() => { setIsCustomSupplier(!isCustomSupplier); setNewProdForm({...newProdForm, supplierName: ""}); }} 
                      className="text-xs font-semibold text-[#0a1565] hover:underline"
                    >
                      {isCustomSupplier ? "Pick Existing" : "+ New Supplier"}
                    </button>
                  </div>
                  {isCustomSupplier ? (
                    <Input placeholder="Type new supplier name..." value={newProdForm.supplierName} onChange={(e) => setNewProdForm({ ...newProdForm, supplierName: e.target.value })} className="rounded-xl" autoFocus />
                  ) : (
                    <Select value={newProdForm.supplierName} onValueChange={(v) => setNewProdForm({ ...newProdForm, supplierName: v })}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select supplier (optional)" /></SelectTrigger>
                      <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Tracking Type *</Label>
                  <Select value={newProdForm.trackingType} onValueChange={(v: "SN" | "QTY") => setNewProdForm({ ...newProdForm, trackingType: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QTY">Quantity (bulk tracking)</SelectItem>
                      <SelectItem value="SN">Serial Number (track individual units)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Initial stock */}
                {newProdForm.trackingType === "SN" && (
                  <div className="space-y-2">
                    <Label>Initial Serial Numbers *</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Enter SN" value={addSnInput} onChange={(e) => setAddSnInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSn(); } }} className="rounded-xl font-mono flex-1" />
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
                {newProdForm.trackingType === "QTY" && (
                  <div className="space-y-1.5">
                    <Label>Initial Quantity *</Label>
                    <Input type="number" min="1" placeholder="0" value={addQty} onChange={(e) => setAddQty(e.target.value)} className="rounded-xl" />
                  </div>
                )}
              </div>
            )}

            {/* Note */}
            {(addFoundProduct || addIsNew) && (
              <div className="space-y-1.5">
                <Label htmlFor="add-note">Note <span className="text-slate-400 font-normal">(optional)</span></Label>
                <Input id="add-note" placeholder="e.g. New shipment from supplier" value={addNote} onChange={(e) => setAddNote(e.target.value)} className="rounded-xl" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setIsAddOpen(false); resetAdd(); }}>Cancel</Button>
            <Button
              className="rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
              disabled={!canDoAddStock()}
              onClick={() => setConfirmAddOpen(true)}
            >
              <ArrowDownToLine className="w-4 h-4 mr-1.5" />Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
          <Input placeholder="e.g. Electronics" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="rounded-xl" />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
            <Button className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={handleAddCategory}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier dialog */}
      <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Add New Supplier</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { id: "ns-n", l: "Name *", k: "name", p: "ABC Distributors" },
              { id: "ns-ph", l: "Phone *", k: "phone", p: "+1-555-0123" },
              { id: "ns-em", l: "Email *", k: "email", p: "contact@supplier.com" },
              { id: "ns-ad", l: "Address", k: "address", p: "Street, City" },
              { id: "ns-co", l: "Country", k: "country", p: "United States" },
            ].map((f) => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={f.id}>{f.l}</Label>
                <Input id={f.id} placeholder={f.p} value={(newSupplier as any)[f.k]} onChange={(e) => setNewSupplier({ ...newSupplier, [f.k]: e.target.value })} className="rounded-xl" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsAddSupplierOpen(false)}>Cancel</Button>
            <Button className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Add Stock */}
      <ConfirmDialog
        open={confirmAddOpen}
        onClose={() => setConfirmAddOpen(false)}
        onConfirm={executeAddStock}
        title="Confirm Add Stock"
        icon={<ArrowDownToLine className="w-5 h-5 text-[#0a1565]" />}
        description={
          <div className="space-y-1">
            {addFoundProduct && !addIsNew && (
              <>
                <p>Adding to: <strong>{addFoundProduct.name}</strong></p>
                {addFoundProduct.trackingType === "SN"
                  ? <p>{addSnList.length} serial number(s): <span className="font-mono text-xs">{addSnList.join(", ")}</span></p>
                  : <p>Quantity: <strong>+{addQty}</strong> units</p>}
              </>
            )}
            {addIsNew && <p>Creating new product: <strong>{newProdForm.name}</strong> (Part #: {addPn})</p>}
          </div>
        }
        confirmLabel="Confirm Add Stock"
        confirmStyle={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }}
      />

      {/* ═══ OUT STOCK MODAL ═══ */}
      <Dialog open={isOutOpen} onOpenChange={(v) => { if (!v) { setIsOutOpen(false); resetOut(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #16c60c, #0d9904)" }}>
                <ArrowUpFromLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Out Stock</DialogTitle>
                <DialogDescription>Move stock out of inventory</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="out-pn">Part Number *</Label>
              <Input id="out-pn" placeholder="e.g. PN-LAPTOP-HP-001" value={outPn} onChange={(e) => handleOutPnChange(e.target.value)} className="rounded-xl font-mono" />
            </div>

            {outPn.trim().length > 3 && !outFoundProduct && (
              <div className="rounded-xl p-3 border border-red-200 bg-red-50">
                <p className="text-sm text-red-600">Part number not found in inventory.</p>
              </div>
            )}

            {outFoundProduct && (
              <>
                <ProductCard product={outFoundProduct} />

                {outFoundProduct.trackingType === "SN" && (
                  <div className="space-y-2">
                    <Label>Scan Serial Numbers *</Label>
                    {outFoundProduct.serialNumbers.length === 0 ? (
                      <p className="text-sm text-red-500">No serial numbers available in inventory.</p>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="Scan or type serial number…"
                              value={outSnInput}
                              onChange={(e) => setOutSnInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleOutSnScan(); } }}
                              className="rounded-xl font-mono pl-9"
                            />
                          </div>
                          <Button type="button" variant="outline" className="rounded-xl shrink-0" onClick={handleOutSnScan}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400">{outFoundProduct.serialNumbers.length} SNs available in inventory</p>
                        {outSelectedSns.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium" style={{ color: "#e05a00" }}>{outSelectedSns.length} SN(s) staged for out:</p>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                              {outSelectedSns.map((sn) => (
                                <span key={sn} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono" style={{ background: "#fff7ed", color: "#9a3a00", border: "1px solid #fed7aa" }}>
                                  {sn}
                                  <button onClick={() => setOutSelectedSns(outSelectedSns.filter((s) => s !== sn))} className="hover:text-red-600">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {outFoundProduct.trackingType === "QTY" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="out-qty">Quantity to Remove *</Label>
                    <Input id="out-qty" type="number" min="1" max={outFoundProduct.quantity} placeholder="Enter quantity" value={outQty} onChange={(e) => setOutQty(e.target.value)} className="rounded-xl" />
                    {outQty && parseInt(outQty) > 0 && parseInt(outQty) <= outFoundProduct.quantity && (
                      <p className="text-xs" style={{ color: "#e05a00" }}>Remaining after out: {outFoundProduct.quantity - parseInt(outQty)} units</p>
                    )}
                    {outQty && parseInt(outQty) > outFoundProduct.quantity && (
                      <p className="text-xs text-red-500">Exceeds available stock ({outFoundProduct.quantity})</p>
                    )}
                  </div>
                )}

                {/* Customer (optional) */}
                <div className="space-y-1.5">
                  <Label>Customer <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <div className="flex gap-2">
                    <Select value={outCustomerId} onValueChange={setOutCustomerId}>
                      <SelectTrigger className="rounded-xl flex-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0" onClick={() => setIsAddCustomerOpen(true)}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="out-note">Reference / Note <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <Input id="out-note" placeholder="e.g. PO #123, delivery note" value={outNote} onChange={(e) => setOutNote(e.target.value)} className="rounded-xl" />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => { setIsOutOpen(false); resetOut(); }}>Cancel</Button>
            {outFoundProduct && canFreeze && (
              <Button
                variant="outline"
                className="rounded-xl gap-1.5"
                style={{ borderColor: "#0ea5e9", color: "#0369a1" }}
                disabled={!canDoOutStock()}
                onClick={() => {
                  // Transfer to freeze form
                  setIsOutOpen(false);
                  setFreezePn(outPn);
                  setFreezeFoundProduct(outFoundProduct);
                  setFreezeSelectedSns(outSelectedSns);
                  setFreezeQty(outQty);
                  setFreezeCustomer((outCustomerId && outCustomerId !== "none" ? customers.find(c => c.id === outCustomerId)?.name : undefined) || "");
                  setFreezeNote(outNote);
                  resetOut();
                  setConfirmFreezeOpen(true);
                }}
              >
                <Snowflake className="w-4 h-4" />Freeze Stock
              </Button>
            )}
            <Button
              className="rounded-xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #16c60c, #0d9904)" }}
              disabled={!canDoOutStock()}
              onClick={() => setConfirmOutOpen(true)}
            >
              <ArrowUpFromLine className="w-4 h-4 mr-1.5" />Confirm Out Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer (from out stock) */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { id: "nc-n", l: "Full Name *", k: "name", p: "Jane Doe" },
              { id: "nc-e", l: "Email *", k: "email", p: "jane@example.com" },
              { id: "nc-ph", l: "Phone *", k: "phone", p: "+1-555-0000" },
              { id: "nc-ad", l: "Address", k: "address", p: "Street, City" },
              { id: "nc-co", l: "Country", k: "country", p: "United States" },
            ].map((f) => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={f.id}>{f.l}</Label>
                <Input id={f.id} placeholder={f.p} value={(newCustomer as any)[f.k]} onChange={(e) => setNewCustomer({ ...newCustomer, [f.k]: e.target.value })} className="rounded-xl" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsAddCustomerOpen(false)}>Cancel</Button>
            <Button className="rounded-xl text-white" style={{ background: "linear-gradient(135deg, #0a1565, #1229b3)" }} onClick={handleAddCustomer}>Add Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Out Stock */}
      <ConfirmDialog
        open={confirmOutOpen}
        onClose={() => setConfirmOutOpen(false)}
        onConfirm={executeOutStock}
        title="Confirm Out Stock"
        icon={<ArrowUpFromLine className="w-5 h-5 text-green-600" />}
        description={
          outFoundProduct ? (
            <div className="space-y-1">
              <p>Removing from: <strong>{outFoundProduct.name}</strong></p>
              {outFoundProduct.trackingType === "SN"
                ? <p>{outSelectedSns.length} SN(s): <span className="font-mono text-xs">{outSelectedSns.join(", ")}</span></p>
                : <p>Quantity: <strong>{outQty}</strong> units</p>}
              {outCustomerId && outCustomerId !== "none" && <p>Customer: <strong>{customers.find(c => c.id === outCustomerId)?.name}</strong></p>}
            </div>
          ) : "Are you sure?"
        }
        confirmLabel="Confirm Out Stock"
        confirmStyle={{ background: "linear-gradient(135deg, #16c60c, #0d9904)" }}
      />

      {/* ═══ FREEZE STOCK MODAL ═══ */}
      <Dialog open={isFreezeOpen} onOpenChange={(v) => { if (!v) { setIsFreezeOpen(false); resetFreeze(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}>
                <Snowflake className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Freeze Stock</DialogTitle>
                <DialogDescription>Reserve stock — release manually later</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="frz-pn">Part Number *</Label>
              <Input id="frz-pn" placeholder="e.g. PN-LAPTOP-HP-001" value={freezePn} onChange={(e) => handleFreezePnChange(e.target.value)} className="rounded-xl font-mono" />
            </div>

            {freezePn.trim().length > 3 && !freezeFoundProduct && (
              <div className="rounded-xl p-3 border border-red-200 bg-red-50">
                <p className="text-sm text-red-600">Part number not found in inventory.</p>
              </div>
            )}

            {freezeFoundProduct && (
              <>
                <ProductCard product={freezeFoundProduct} />

                {freezeFoundProduct.trackingType === "SN" && (
                  <div className="space-y-2">
                    <Label>Scan Serial Numbers to Freeze *</Label>
                    {freezeFoundProduct.serialNumbers.length === 0 ? (
                      <p className="text-sm text-red-500">No serial numbers available.</p>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              placeholder="Scan or type serial number…"
                              value={freezeSnInput}
                              onChange={(e) => setFreezeSnInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFreezeSnScan(); } }}
                              className="rounded-xl font-mono pl-9"
                            />
                          </div>
                          <Button type="button" variant="outline" className="rounded-xl shrink-0" onClick={handleFreezeSnScan}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400">{freezeFoundProduct.serialNumbers.length} SNs available in inventory</p>
                        {freezeSelectedSns.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium" style={{ color: "#0369a1" }}>{freezeSelectedSns.length} SN(s) staged to freeze:</p>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                              {freezeSelectedSns.map((sn) => (
                                <span key={sn} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono" style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
                                  {sn}
                                  <button onClick={() => setFreezeSelectedSns(freezeSelectedSns.filter((s) => s !== sn))} className="hover:text-red-600">
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {freezeFoundProduct.trackingType === "QTY" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="frz-qty">Quantity to Freeze *</Label>
                    <Input id="frz-qty" type="number" min="1" max={freezeFoundProduct.quantity} placeholder="Enter quantity" value={freezeQty} onChange={(e) => setFreezeQty(e.target.value)} className="rounded-xl" />
                    {freezeQty && parseInt(freezeQty) > 0 && parseInt(freezeQty) <= freezeFoundProduct.quantity && (
                      <p className="text-xs" style={{ color: "#0369a1" }}>Remaining after freeze: {freezeFoundProduct.quantity - parseInt(freezeQty)} units</p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="frz-cust">Reserved for <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <Input id="frz-cust" placeholder="Customer name or reference" value={freezeCustomer} onChange={(e) => setFreezeCustomer(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="frz-note">Note <span className="text-slate-400 font-normal">(optional)</span></Label>
                  <Input id="frz-note" placeholder="Reason for freezing" value={freezeNote} onChange={(e) => setFreezeNote(e.target.value)} className="rounded-xl" />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setIsFreezeOpen(false); resetFreeze(); }}>Cancel</Button>
            <Button
              className="rounded-xl text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}
              disabled={!canDoFreezeStock()}
              onClick={() => setConfirmFreezeOpen(true)}
            >
              <Snowflake className="w-4 h-4 mr-1.5" />Freeze Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Freeze */}
      <ConfirmDialog
        open={confirmFreezeOpen}
        onClose={() => setConfirmFreezeOpen(false)}
        onConfirm={executeFreezeStock}
        title="Confirm Freeze Stock"
        icon={<Snowflake className="w-5 h-5 text-sky-500" />}
        description={
          freezeFoundProduct ? (
            <div className="space-y-1">
              <p>Freezing from: <strong>{freezeFoundProduct.name}</strong></p>
              {freezeFoundProduct.trackingType === "SN"
                ? <p>{freezeSelectedSns.length} SN(s): <span className="font-mono text-xs">{freezeSelectedSns.join(", ")}</span></p>
                : <p>Quantity: <strong>{freezeQty}</strong> units</p>}
              {freezeCustomer && <p>Reserved for: <strong>{freezeCustomer}</strong></p>}
              <p className="text-slate-500 text-xs mt-1">Stock will be held until manually released.</p>
            </div>
          ) : "Are you sure?"
        }
        confirmLabel="Freeze"
        confirmStyle={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1)" }}
      />

      {/* ═══ FREEZE LIST MODAL ═══ */}
      <Dialog open={isFreezeListOpen} onOpenChange={setIsFreezeListOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
                <List className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>Frozen Stock List</DialogTitle>
                <DialogDescription>{frozenStocks.length} item{frozenStocks.length !== 1 ? "s" : ""} currently frozen</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            {frozenStocks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Snowflake className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No frozen stock items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {frozenStocks.map((frozen) => (
                  <div key={frozen.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #e0f2fe, #bae6fd)" }}>
                        <Snowflake className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{frozen.productName}</p>
                        <p className="text-xs font-mono text-slate-500">{frozen.partNumber}</p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {frozen.trackingType === "SN" ? (
                            <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "#f0f5ff", color: "#0a1565" }}>
                              {frozen.serialNumbers.length} SN: {frozen.serialNumbers.join(", ")}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "#f0f5ff", color: "#0a1565" }}>
                              {frozen.quantity} QTY
                            </span>
                          )}
                          {frozen.customerName && (
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                              For: {frozen.customerName}
                            </span>
                          )}
                        </div>
                        {frozen.note && <p className="text-xs text-slate-400 mt-1">{frozen.note}</p>}
                        <p className="text-xs text-slate-400 mt-1">
                          Frozen by {frozen.frozenBy} · {new Date(frozen.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="rounded-lg text-xs text-white gap-1"
                          style={{ background: "linear-gradient(135deg, #16c60c, #0d9904)" }}
                          onClick={() => { setReleasingFrozen(frozen); setReleaseAction("confirm"); }}
                        >
                          <Check className="w-3 h-3" />Confirm Out
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs gap-1 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => { setReleasingFrozen(frozen); setReleaseAction("cancel"); }}
                        >
                          <X className="w-3 h-3" />Return Stock
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsFreezeListOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Release (Out / Return) */}
      <ConfirmDialog
        open={!!(releasingFrozen && releaseAction)}
        onClose={() => { setReleasingFrozen(null); setReleaseAction(null); }}
        onConfirm={executeRelease}
        title={releaseAction === "confirm" ? "Confirm Out Stock" : "Return to Stock"}
        icon={releaseAction === "confirm" ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-500" />}
        description={
          releasingFrozen ? (
            <div className="space-y-1">
              <p>{releaseAction === "confirm" ? "Confirm final out for" : "Return frozen stock of"}: <strong>{releasingFrozen.productName}</strong></p>
              {releasingFrozen.trackingType === "SN"
                ? <p>SNs: <span className="font-mono text-xs">{releasingFrozen.serialNumbers.join(", ")}</span></p>
                : <p>Quantity: <strong>{releasingFrozen.quantity}</strong> units</p>}
              {releaseAction === "cancel" && <p className="text-slate-500 text-xs">Stock will be returned to the available inventory.</p>}
            </div>
          ) : ""
        }
        confirmLabel={releaseAction === "confirm" ? "Confirm Out Stock" : "Return to Stock"}
        confirmStyle={releaseAction === "confirm"
          ? { background: "linear-gradient(135deg, #16c60c, #0d9904)" }
          : { background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
      />
    </QuickActionsContext.Provider>
  );
}
