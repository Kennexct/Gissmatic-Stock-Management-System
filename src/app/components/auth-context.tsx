import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { User, Product, AuditLog, Supplier, Customer, OutgoingSale, UserPermissions, FrozenStock } from "../../lib/types";
import { mockUsers, mockProducts, mockAuditLogs, mockSuppliers, mockCustomers, mockOutgoingSales, mockPermissions, defaultCategories, mockFrozenStocks } from "../../lib/mock-data";
import { supabase, supabaseAdmin } from "../../lib/supabase";

interface AuthContextType {
  currentUser: User | null;
  users: any[];
  auditLogs: AuditLog[];
  suppliers: Supplier[];
  customers: Customer[];
  outgoingSales: OutgoingSale[];
  frozenStocks: FrozenStock[];
  permissions: UserPermissions[];
  categories: string[];
  currency: string;
  login: (email: string, password: string) => Promise<{ success: boolean; needsSetup?: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
  addUser: (email: string, name: string, role: string) => Promise<string>;
  deleteUser: (id: string) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt">) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => void;
  deleteCustomer: (id: string) => void;
  addOutgoingSale: (sale: Omit<OutgoingSale, "id" | "timestamp">) => void;
  addFrozenStock: (frozen: Omit<FrozenStock, "id" | "timestamp">) => void;
  releaseFrozenStock: (id: string, action: "confirm" | "cancel") => void;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  setCurrency: (currency: string) => void;
  getUserPermissions: (userId: string) => UserPermissions;
  updateUserPermissions: (userId: string, updates: Partial<UserPermissions>) => void;
  factoryReset: () => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const superadminPermissions: Omit<UserPermissions, "userId"> = {
  showQuickAddStock: true, showQuickOutStock: true,
  canAccessDashboard: true,
  canViewInventory: true, canAddStock: true, canStockIn: true, canOutStock: true, canFreezeStock: true,
  canViewCustomers: true, canManageCustomers: true,
  canViewSuppliers: true, canManageSuppliers: true,
  canViewReports: true, canExportReports: true,
  canImportProducts: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [outgoingSales, setOutgoingSales] = useState<OutgoingSale[]>([]);
  const [frozenStocks, setFrozenStocks] = useState<FrozenStock[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currency, setCurrencyState] = useState<string>("USD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch all cloud data from Supabase on Mount
    const fetchAllFromSupabase = async () => {
      const [usersRes, logsRes, outRes, frozenRes, catsRes, suppRes, custRes, permRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500),
        supabase.from('outgoing_sales').select('*').order('timestamp', { ascending: false }).limit(500),
        supabase.from('frozen_stocks').select('*').order('timestamp', { ascending: false }),
        supabase.from('categories').select('name'),
        supabase.from('suppliers').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('user_permissions').select('*')
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data.map((u: any) => ({
          id: u.id, name: u.name, email: u.email, role: u.role || 'viewer', createdAt: u.created_at,
        })));
      }

      if (logsRes.data) {
        setAuditLogs(logsRes.data.map((db: any) => ({
          id: db.id, timestamp: db.timestamp, userName: db.user_name, userEmail: db.user_email,
          action: db.action, itemName: db.item_name, changeDetail: db.change_detail,
          customerName: db.customer_name, note: db.note,
        })));
      }

      if (outRes.data) {
        setOutgoingSales(outRes.data.map((db: any) => ({
          id: db.id, timestamp: db.timestamp, customerId: db.customer_id, customerName: db.customer_name,
          productId: db.product_id, productName: db.product_name, partNumber: db.part_number,
          trackingType: db.tracking_type, serialNumbers: db.serial_numbers || [],
          quantity: db.quantity, note: db.note || '',
        })));
      }

      if (frozenRes.data) {
        setFrozenStocks(frozenRes.data.map((db: any) => ({
          id: db.id, timestamp: db.timestamp, productId: db.product_id, productName: db.product_name,
          partNumber: db.part_number, trackingType: db.tracking_type, serialNumbers: db.serial_numbers || [],
          quantity: db.quantity, frozenBy: db.frozen_by, frozenByEmail: db.frozen_by_email,
          customerName: db.customer_name, note: db.note,
        })));
      }

      if (catsRes.data) {
        setCategories(catsRes.data.map(c => c.name));
      }

      if (suppRes.data) {
        setSuppliers(suppRes.data.map((db: any) => ({
          id: db.id, name: db.name, phone: db.phone || '', email: db.email || '',
          address: db.address || '', country: db.country || '', createdAt: db.created_at,
        })));
      }

      if (custRes.data) {
        setCustomers(custRes.data.map((db: any) => ({
          id: db.id, name: db.name, email: db.email || '', phone: db.phone || '',
          address: db.address || '', country: db.country || '', createdAt: db.created_at,
        })));
      }

      if (permRes.data) {
        setPermissions(permRes.data.map((db: any) => ({
          userId: db.user_id,
          showQuickAddStock: db.show_quick_add_stock ?? false, showQuickOutStock: db.show_quick_out_stock ?? false,
          canAccessDashboard: db.can_access_dashboard ?? false, canViewInventory: db.can_view_inventory ?? false,
          canAddStock: db.can_add_stock ?? false, canStockIn: db.can_stock_in ?? false,
          canOutStock: db.can_out_stock ?? false, canFreezeStock: db.can_freeze_stock ?? false,
          canViewCustomers: db.can_view_customers ?? false, canManageCustomers: db.can_manage_customers ?? false,
          canViewSuppliers: db.can_view_suppliers ?? false, canManageSuppliers: db.can_manage_suppliers ?? false,
          canViewReports: db.can_view_reports ?? false, canExportReports: db.can_export_reports ?? false,
        })));
      }
      setIsLoading(false);
    };
    fetchAllFromSupabase();
  }, []);

  useEffect(() => {
    const timers: Record<string, ReturnType<typeof setTimeout>> = {};
    const debounced = (key: string, fn: () => void) => {
      if (timers[key]) clearTimeout(timers[key]);
      timers[key] = setTimeout(fn, 400);
    };

    const refetch = {
      auditLogs: async () => {
        const { data } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
        if (data) setAuditLogs(data.map((d: any) => ({ id: d.id, timestamp: d.timestamp, userName: d.user_name, userEmail: d.user_email, action: d.action, itemName: d.item_name, changeDetail: d.change_detail, customerName: d.customer_name, note: d.note })));
      },
      sales: async () => {
        const { data } = await supabase.from('outgoing_sales').select('*').order('timestamp', { ascending: false }).limit(500);
        if (data) setOutgoingSales(data.map((d: any) => ({ id: d.id, timestamp: d.timestamp, customerId: d.customer_id, customerName: d.customer_name, productId: d.product_id, productName: d.product_name, partNumber: d.part_number, trackingType: d.tracking_type, serialNumbers: d.serial_numbers || [], quantity: d.quantity, note: d.note || '' })));
      },
      frozen: async () => {
        const { data } = await supabase.from('frozen_stocks').select('*').order('timestamp', { ascending: false });
        if (data) setFrozenStocks(data.map((d: any) => ({ id: d.id, timestamp: d.timestamp, productId: d.product_id, productName: d.product_name, partNumber: d.part_number, trackingType: d.tracking_type, serialNumbers: d.serial_numbers || [], quantity: d.quantity, frozenBy: d.frozen_by, frozenByEmail: d.frozen_by_email, customerName: d.customer_name, note: d.note })));
      },
      suppliers: async () => {
        const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
        if (data) setSuppliers(data.map((d: any) => ({ id: d.id, name: d.name, phone: d.phone || '', email: d.email || '', address: d.address || '', country: d.country || '', createdAt: d.created_at })));
      },
      customers: async () => {
        const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (data) setCustomers(data.map((d: any) => ({ id: d.id, name: d.name, email: d.email || '', phone: d.phone || '', address: d.address || '', country: d.country || '', createdAt: d.created_at })));
      },
    };

    const channel = supabase
      .channel('gissmatic-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => debounced('logs', refetch.auditLogs))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outgoing_sales' }, () => debounced('sales', refetch.sales))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frozen_stocks' }, () => debounced('frozen', refetch.frozen))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => debounced('suppliers', refetch.suppliers))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => debounced('customers', refetch.customers))
      .subscribe();

    const pollInterval = setInterval(() => {
      refetch.auditLogs();
      refetch.sales();
      refetch.frozen();
      refetch.suppliers();
      refetch.customers();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      Object.values(timers).forEach(clearTimeout);
      clearInterval(pollInterval);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; needsSetup?: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    const { error: profileError, data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (profileError || !profile) {
      return { success: false, error: profileError ? `Profile error: ${profileError.message}` : "No profile found." };
    }

    if (profile.requires_password_change) {
      return { success: true, needsSetup: true };
    }

    setCurrentUser({
      id: data.user.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      createdAt: profile.created_at,
    });
    return { success: true };
  };

  const logout = async () => { 
    await supabase.auth.signOut();
    setCurrentUser(null); 
  };

  const updateProfile = async (name: string, email: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Not logged in" };

    // 1. Update Auth Email first if changed
    if (email !== currentUser.email) {
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) {
        let msg = authError.message;
        if (msg.toLowerCase().includes("rate limit exceeded") || msg.toLowerCase().includes("exceed")) {
          msg = "Email update limit exceeded. Supabase only allows a few email changes per hour for security. Please check your inbox for verification links or try again later.";
        }
        return { success: false, error: msg };
      }
    }

    // 2. If auth update succeeds (or wasn't needed), update public.users
    const { error: dbError } = await supabase.from('users').update({ name, email }).eq('id', currentUser.id);
    if (dbError) {
      // If DB fails, we return error, but auth might have sent the email. This is an edge case.
      return { success: false, error: dbError.message };
    }

    // 3. Update local state
    const updatedUser = { ...currentUser, name, email };
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === currentUser.id ? { ...u, name, email } : u));
    
    return { success: true };
  };

  const updatePassword = async (newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const addUser = async (email: string, name: string, role: string): Promise<string> => {
    const tempPassword = crypto.randomUUID().slice(0, 16) + '!Aa1';
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({ email, password: tempPassword });
    if (authError || !authData.user) throw new Error(authError?.message || "User creation failed");

    await supabase.from('users').insert({ id: authData.user.id, name, email, role, requires_password_change: true });
    await supabase.from('user_permissions').insert({ user_id: authData.user.id });
    
    setUsers([...users, { id: authData.user.id, name, email, role, createdAt: new Date().toISOString() }]);
    return tempPassword;
  };

  const deleteUser = async (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
    setPermissions(permissions.filter((p) => p.userId !== id));
    await supabase.from('user_permissions').delete().eq('user_id', id);
    await supabase.from('users').delete().eq('id', id);
  };

  const addAuditLog = async (logData: Omit<AuditLog, "id" | "timestamp">) => {
    const timestamp = new Date().toISOString();
    const newLog: AuditLog = { ...logData, id: `A${Date.now()}`, timestamp };
    setAuditLogs(prev => [newLog, ...prev]);
    // Sync to Supabase
    await supabase.from('audit_logs').insert({
      timestamp,
      user_name: logData.userName,
      user_email: logData.userEmail,
      action: logData.action,
      item_name: logData.itemName,
      change_detail: logData.changeDetail,
      customer_name: logData.customerName || null,
      note: logData.note || null,
    });
  };

  const addSupplier = async (supplierData: Omit<Supplier, "id" | "createdAt">) => {
    const createdAt = new Date().toISOString();
    const tempId = `S${Date.now()}`;
    const newSupplier: Supplier = { ...supplierData, id: tempId, createdAt };
    setSuppliers(prev => [...prev, newSupplier]);
    // Sync to Supabase
    const { data } = await supabase.from('suppliers').insert({
      name: supplierData.name,
      phone: supplierData.phone || null,
      email: supplierData.email || null,
      address: supplierData.address || null,
      country: supplierData.country || null,
      created_at: createdAt,
    }).select().single();
    if (data?.id) {
      setSuppliers(prev => prev.map(s => s.id === tempId ? { ...s, id: data.id } : s));
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
    // Sync to Supabase
    const dbPayload: any = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.phone !== undefined) dbPayload.phone = updates.phone;
    if (updates.email !== undefined) dbPayload.email = updates.email;
    if (updates.address !== undefined) dbPayload.address = updates.address;
    if (updates.country !== undefined) dbPayload.country = updates.country;
    if (Object.keys(dbPayload).length > 0) {
      const { error } = await supabase.from('suppliers').update(dbPayload).eq('id', id);
      if (error) console.error('Supabase updateSupplier error:', error);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, "id" | "createdAt">): Promise<string> => {
    const createdAt = new Date().toISOString();
    const tempId = `C${Date.now()}`;
    const newCustomer: Customer = { ...customerData, id: tempId, createdAt };
    setCustomers(prev => [...prev, newCustomer]);
    // Sync to Supabase
    const { data } = await supabase.from('customers').insert({
      name: customerData.name, email: customerData.email || null,
      phone: customerData.phone || null, address: customerData.address || null,
      country: customerData.country || null, created_at: createdAt,
    }).select().single();
    if (data?.id) {
      setCustomers(prev => prev.map(c => c.id === tempId ? { ...c, id: data.id } : c));
      return data.id;
    }
    return tempId;
  };

  const deleteCustomer = async (id: string) => {
    setCustomers(customers.filter((c) => c.id !== id));
    await supabase.from('customers').delete().eq('id', id);
  };

  const addOutgoingSale = async (saleData: Omit<OutgoingSale, "id" | "timestamp">) => {
    const timestamp = new Date().toISOString();
    const newSale: OutgoingSale = { ...saleData, id: `OS${Date.now()}`, timestamp };
    setOutgoingSales(prev => [newSale, ...prev]);
    // Sync to Supabase
    await supabase.from('outgoing_sales').insert({
      timestamp,
      customer_id: saleData.customerId || null,
      customer_name: saleData.customerName,
      product_id: saleData.productId,
      product_name: saleData.productName,
      part_number: saleData.partNumber,
      tracking_type: saleData.trackingType,
      serial_numbers: saleData.serialNumbers || [],
      quantity: saleData.quantity,
      note: saleData.note || null,
    });
  };

  const addFrozenStock = async (frozenData: Omit<FrozenStock, "id" | "timestamp">) => {
    const timestamp = new Date().toISOString();
    const newFrozen: FrozenStock = { ...frozenData, id: `FS${Date.now()}`, timestamp };
    setFrozenStocks(prev => [...prev, newFrozen]);
    // Sync to Supabase
    const { data } = await supabase.from('frozen_stocks').insert({
      timestamp,
      product_id: frozenData.productId,
      product_name: frozenData.productName,
      part_number: frozenData.partNumber,
      tracking_type: frozenData.trackingType,
      serial_numbers: frozenData.serialNumbers || [],
      quantity: frozenData.quantity,
      frozen_by: frozenData.frozenBy,
      frozen_by_email: frozenData.frozenByEmail,
      customer_name: frozenData.customerName || null,
      note: frozenData.note || null,
    }).select().single();
    // Replace temp ID with real Supabase ID
    if (data?.id) {
      setFrozenStocks(prev => prev.map(f => f.id === newFrozen.id ? { ...f, id: data.id } : f));
    }
  };

  const releaseFrozenStock = async (id: string, action: "confirm" | "cancel") => {
    const frozen = frozenStocks.find((f) => f.id === id);
    if (!frozen) return;

    if (action === "cancel") {
      // Return stock back to product
      const { data: product } = await supabase.from('products').select('*').eq('id', frozen.productId).single();
      if (product) {
        if (frozen.trackingType === "SN") {
          const currentSns = product.serial_numbers || [];
          await supabase.from('products').update({
            serial_numbers: [...currentSns, ...frozen.serialNumbers],
            quantity: product.quantity + frozen.serialNumbers.length,
          }).eq('id', product.id);
        } else {
          await supabase.from('products').update({ quantity: product.quantity + frozen.quantity }).eq('id', product.id);
        }
      }
    }
    // For "confirm", stock was already deducted when frozen, so no product update needed

    // Remove from local state
    setFrozenStocks(prev => prev.filter((f) => f.id !== id));
    // Delete from Supabase
    await supabase.from('frozen_stocks').delete().eq('id', id);
  };

  const addCategory = async (category: string) => {
    const trimmed = category.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      // Sync to Supabase
      await supabase.from('categories').insert({ name: trimmed });
    }
  };

  const deleteCategory = async (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
    // Sync to Supabase
    await supabase.from('categories').delete().eq('name', category);
  };

  const setCurrency = (newCurrency: string) => setCurrencyState(newCurrency);

  const getUserPermissions = (userId: string): UserPermissions => {
    const user = users.find((u) => u.id === userId);
    if (!user || user.role === "superadmin") return { userId, ...superadminPermissions };
    const stored = permissions.find((p) => p.userId === userId);
    if (stored) return stored;
    return {
      userId, showQuickAddStock: false, showQuickOutStock: false,
      canAccessDashboard: false, canViewInventory: true, canAddStock: false,
      canStockIn: false, canOutStock: false, canFreezeStock: false,
      canViewCustomers: false, canManageCustomers: false,
      canViewSuppliers: false, canManageSuppliers: false,
      canViewReports: false, canExportReports: false,
    };
  };

  const updateUserPermissions = async (userId: string, updates: Partial<UserPermissions>) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.userId === userId);
      if (existing) {
        return prev.map(p => p.userId === userId ? { ...p, ...updates } : p);
      }
      return [...prev, { userId, ...updates } as UserPermissions];
    });
    // Sync to Supabase (snake_case mapping)
    const dbPayload: any = { user_id: userId };
    if (updates.showQuickAddStock !== undefined) dbPayload.show_quick_add_stock = updates.showQuickAddStock;
    if (updates.showQuickOutStock !== undefined) dbPayload.show_quick_out_stock = updates.showQuickOutStock;
    if (updates.canAccessDashboard !== undefined) dbPayload.can_access_dashboard = updates.canAccessDashboard;
    if (updates.canViewInventory !== undefined) dbPayload.can_view_inventory = updates.canViewInventory;
    if (updates.canAddStock !== undefined) dbPayload.can_add_stock = updates.canAddStock;
    if (updates.canStockIn !== undefined) dbPayload.can_stock_in = updates.canStockIn;
    if (updates.canOutStock !== undefined) dbPayload.can_out_stock = updates.canOutStock;
    if (updates.canFreezeStock !== undefined) dbPayload.can_freeze_stock = updates.canFreezeStock;
    if (updates.canViewCustomers !== undefined) dbPayload.can_view_customers = updates.canViewCustomers;
    if (updates.canManageCustomers !== undefined) dbPayload.can_manage_customers = updates.canManageCustomers;
    if (updates.canViewSuppliers !== undefined) dbPayload.can_view_suppliers = updates.canViewSuppliers;
    if (updates.canManageSuppliers !== undefined) dbPayload.can_manage_suppliers = updates.canManageSuppliers;
    if (updates.canViewReports !== undefined) dbPayload.can_view_reports = updates.canViewReports;
    if (updates.canExportReports !== undefined) dbPayload.can_export_reports = updates.canExportReports;
    const { error } = await supabase.from('user_permissions').upsert(dbPayload, { onConflict: 'user_id' });
    if (error) console.error('Supabase updateUserPermissions error:', error);
  };

  const factoryReset = async (): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'superadmin') return { success: false, error: "Unauthorized" };

    try {
      // Wipe Supabase Tables (ignoring users/permissions to keep login working)
      // We use .not('id', 'is', null) to match all rows
      await Promise.all([
        supabase.from('products').delete().not('id', 'is', null),
        supabase.from('audit_logs').delete().not('id', 'is', null),
        supabase.from('suppliers').delete().not('id', 'is', null),
        supabase.from('customers').delete().not('id', 'is', null),
        supabase.from('outgoing_sales').delete().not('id', 'is', null),
        supabase.from('frozen_stocks').delete().not('id', 'is', null),
        supabase.from('categories').delete().not('name', 'is', null)
      ]);

      // Wipe Local State
      setProducts([]);
      setAuditLogs([]);
      setSuppliers([]);
      setCustomers([]);
      setOutgoingSales([]);
      setFrozenStocks([]);
      setCategories(defaultCategories);

      // Wipe LocalStorage
      const keysToWipe = ["products_v2", "auditLogs_v2", "suppliers", "customers", "outgoingSales_v2", "frozenStocks"];
      keysToWipe.forEach((k) => localStorage.removeItem(k));
      
      return { success: true };
    } catch (err: any) {
      console.error("Factory Reset Error:", err);
      return { success: false, error: err.message || "Failed to wipe database" };
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser, users, auditLogs, suppliers, customers, outgoingSales, frozenStocks,
      permissions, categories, currency, login, logout, updateProfile, updatePassword, addUser, deleteUser,
      addAuditLog, addSupplier, updateSupplier, addCustomer, deleteCustomer,
      addOutgoingSale, addFrozenStock, releaseFrozenStock, addCategory, deleteCategory, setCurrency: setCurrencyState,
      getUserPermissions, updateUserPermissions, factoryReset, isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}