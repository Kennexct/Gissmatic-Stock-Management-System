import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Product, AuditLog, Supplier, Customer, OutgoingSale, UserPermissions, FrozenStock } from "../../lib/types";
import { mockUsers, mockProducts, mockAuditLogs, mockSuppliers, mockCustomers, mockOutgoingSales, mockPermissions, defaultCategories, mockFrozenStocks } from "../../lib/mock-data";
import { supabase, supabaseAdmin } from "../../lib/supabase";

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  products: Product[];
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
  addUser: (user: Omit<User, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (id: string) => void;
  addProduct: (product: Omit<Product, "id" | "lastUpdated">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt">) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => void;
  deleteCustomer: (id: string) => void;
  addOutgoingSale: (sale: Omit<OutgoingSale, "id" | "timestamp">) => void;
  addFrozenStock: (frozen: Omit<FrozenStock, "id" | "timestamp">) => void;
  releaseFrozenStock: (id: string, action: "confirm" | "cancel") => void;
  addCategory: (category: string) => void;
  setCurrency: (currency: string) => void;
  getUserPermissions: (userId: string) => UserPermissions;
  updateUserPermissions: (userId: string, updates: Partial<UserPermissions>) => void;
  factoryReset: () => Promise<{ success: boolean; error?: string }>;
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
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [outgoingSales, setOutgoingSales] = useState<OutgoingSale[]>([]);
  const [frozenStocks, setFrozenStocks] = useState<FrozenStock[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currency, setCurrencyState] = useState<string>("USD");

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    const storedUsers = localStorage.getItem("users");
    const storedProducts = localStorage.getItem("products_v2");
    const storedLogs = localStorage.getItem("auditLogs_v2");
    const storedSuppliers = localStorage.getItem("suppliers");
    const storedCustomers = localStorage.getItem("customers");
    const storedSales = localStorage.getItem("outgoingSales_v2");
    const storedFrozen = localStorage.getItem("frozenStocks");
    const storedPermissions = localStorage.getItem("userPermissions_v2");
    const storedCategories = localStorage.getItem("categories");
    const storedCurrency = localStorage.getItem("currency");

    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    setUsers(storedUsers ? JSON.parse(storedUsers) : mockUsers);
    setProducts(storedProducts ? JSON.parse(storedProducts) : mockProducts);
    setAuditLogs(storedLogs ? JSON.parse(storedLogs) : mockAuditLogs);
    setSuppliers(storedSuppliers ? JSON.parse(storedSuppliers) : mockSuppliers);
    setCustomers(storedCustomers ? JSON.parse(storedCustomers) : mockCustomers);
    setOutgoingSales(storedSales ? JSON.parse(storedSales) : mockOutgoingSales);
    setFrozenStocks(storedFrozen ? JSON.parse(storedFrozen) : mockFrozenStocks);
    setPermissions(storedPermissions ? JSON.parse(storedPermissions) : mockPermissions);
    setCategories(storedCategories ? JSON.parse(storedCategories) : defaultCategories);
    setCurrencyState(storedCurrency || "USD");

    // Fetch all cloud data from Supabase on Mount
    const fetchAllFromSupabase = async () => {
      // ── Products ──
      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData && prodData.length > 0) {
        const mappedProducts: Product[] = prodData.map((db: any) => ({
          id: db.id,
          partNumber: db.part_number,
          name: db.name,
          description: db.description,
          imageUrl: db.image_url,
          category: db.category,
          trackingType: db.tracking_type,
          quantity: db.quantity,
          serialNumbers: db.serial_numbers || [],
          supplierName: db.supplier_name,
          lastUpdated: db.last_updated || db.created_at || new Date().toISOString(),
        }));
        mappedProducts.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        setProducts(mappedProducts);
        const dbCategories = Array.from(new Set(mappedProducts.map(p => p.category).filter(Boolean))) as string[];
        setCategories(prev => [...new Set([...prev, ...dbCategories])]);
      }

      // ── Audit Logs ──
      const { data: logData } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
      if (logData && logData.length > 0) {
        setAuditLogs(logData.map((db: any) => ({
          id: db.id,
          timestamp: db.timestamp,
          userName: db.user_name,
          userEmail: db.user_email,
          action: db.action,
          itemName: db.item_name,
          changeDetail: db.change_detail,
          customerName: db.customer_name,
          note: db.note,
        })));
      }

      // ── Outgoing Sales ──
      const { data: salesData } = await supabase.from('outgoing_sales').select('*').order('timestamp', { ascending: false }).limit(500);
      if (salesData && salesData.length > 0) {
        setOutgoingSales(salesData.map((db: any) => ({
          id: db.id,
          timestamp: db.timestamp,
          customerId: db.customer_id,
          customerName: db.customer_name,
          productId: db.product_id,
          productName: db.product_name,
          partNumber: db.part_number,
          trackingType: db.tracking_type,
          serialNumbers: db.serial_numbers || [],
          quantity: db.quantity,
          note: db.note || '',
        })));
      }

      // ── Frozen Stocks ──
      const { data: frozenData } = await supabase.from('frozen_stocks').select('*').order('timestamp', { ascending: false });
      if (frozenData && frozenData.length > 0) {
        setFrozenStocks(frozenData.map((db: any) => ({
          id: db.id,
          timestamp: db.timestamp,
          productId: db.product_id,
          productName: db.product_name,
          partNumber: db.part_number,
          trackingType: db.tracking_type,
          serialNumbers: db.serial_numbers || [],
          quantity: db.quantity,
          frozenBy: db.frozen_by,
          frozenByEmail: db.frozen_by_email,
          customerName: db.customer_name,
          note: db.note,
        })));
      }

      // ── Suppliers ──
      const { data: supplierData } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (supplierData && supplierData.length > 0) {
        setSuppliers(supplierData.map((db: any) => ({
          id: db.id,
          name: db.name,
          phone: db.phone || '',
          email: db.email || '',
          address: db.address || '',
          country: db.country || '',
          createdAt: db.created_at,
        })));
      }

      // ── Customers ──
      const { data: customerData } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (customerData && customerData.length > 0) {
        setCustomers(customerData.map((db: any) => ({
          id: db.id,
          name: db.name,
          email: db.email || '',
          phone: db.phone || '',
          address: db.address || '',
          country: db.country || '',
          createdAt: db.created_at,
        })));
      }
      // ── Users (Staff) ──
      const { data: userData } = await supabase.from('users').select('*');
      if (userData && userData.length > 0) {
        setUsers(userData.map((db: any) => ({
          id: db.id, name: db.name, email: db.email, role: db.role || 'viewer', createdAt: db.created_at,
        })));
      }

      // ── User Permissions ──
      const { data: permData } = await supabase.from('user_permissions').select('*');
      if (permData && permData.length > 0) {
        setPermissions(permData.map((db: any) => ({
          userId: db.user_id,
          showQuickAddStock: db.show_quick_add_stock ?? false,
          showQuickOutStock: db.show_quick_out_stock ?? false,
          canAccessDashboard: db.can_access_dashboard ?? false,
          canViewInventory: db.can_view_inventory ?? false,
          canAddStock: db.can_add_stock ?? false,
          canStockIn: db.can_stock_in ?? false,
          canOutStock: db.can_out_stock ?? false,
          canFreezeStock: db.can_freeze_stock ?? false,
          canViewCustomers: db.can_view_customers ?? false,
          canManageCustomers: db.can_manage_customers ?? false,
          canViewSuppliers: db.can_view_suppliers ?? false,
          canManageSuppliers: db.can_manage_suppliers ?? false,
          canViewReports: db.can_view_reports ?? false,
          canExportReports: db.can_export_reports ?? false,
        })));
      }
    };
    fetchAllFromSupabase();
  }, []);

  // ── Supabase Realtime: sync all tables across devices ──
  useEffect(() => {
    const timers: Record<string, ReturnType<typeof setTimeout>> = {};
    const debounced = (key: string, fn: () => void) => {
      if (timers[key]) clearTimeout(timers[key]);
      timers[key] = setTimeout(fn, 400);
    };

    const refetch = {
      products: async () => {
        const { data } = await supabase.from('products').select('*');
        if (data) {
          const m: Product[] = data.map((d: any) => ({ id: d.id, partNumber: d.part_number, name: d.name, description: d.description, imageUrl: d.image_url, category: d.category, trackingType: d.tracking_type, quantity: d.quantity, serialNumbers: d.serial_numbers || [], supplierName: d.supplier_name, lastUpdated: d.last_updated || d.created_at || new Date().toISOString() }));
          m.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
          setProducts(m);
        }
      },
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => debounced('products', refetch.products))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => debounced('logs', refetch.auditLogs))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outgoing_sales' }, () => debounced('sales', refetch.sales))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frozen_stocks' }, () => debounced('frozen', refetch.frozen))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => debounced('suppliers', refetch.suppliers))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => debounced('customers', refetch.customers))
      .subscribe();

    // Auto-refresh polling every 30s as realtime fallback
    const pollInterval = setInterval(() => {
      refetch.products();
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

  useEffect(() => {
    if (currentUser) localStorage.setItem("currentUser", JSON.stringify(currentUser));
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("products_v2", JSON.stringify(products));
    localStorage.setItem("auditLogs_v2", JSON.stringify(auditLogs));
    localStorage.setItem("suppliers", JSON.stringify(suppliers));
    localStorage.setItem("customers", JSON.stringify(customers));
    localStorage.setItem("outgoingSales_v2", JSON.stringify(outgoingSales));
    localStorage.setItem("frozenStocks", JSON.stringify(frozenStocks));
    localStorage.setItem("userPermissions_v2", JSON.stringify(permissions));
    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem("currency", currency);
  }, [currentUser, users, products, auditLogs, suppliers, customers, outgoingSales, frozenStocks, permissions, categories, currency]);

  const login = async (email: string, password: string): Promise<{ success: boolean; needsSetup?: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };

    const { error: profileError, data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
    if (profileError || !profile) return { success: false, error: "Profile not found" };

    const userObj: User = {
      id: data.user.id,
      name: profile.name,
      email: profile.email,
      role: profile.role as any,
      createdAt: profile.created_at,
    };

    if (profile.requires_password_change) {
      return { success: true, needsSetup: true };
    }

    setCurrentUser(userObj);
    return { success: true };
  };

  const logout = async () => { 
    await supabase.auth.signOut();
    setCurrentUser(null); 
    localStorage.removeItem("currentUser"); 
  };

  const updateProfile = async (name: string, email: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    // Update local state first (optimistic)
    const updatedUser = { ...currentUser, name, email };
    setCurrentUser(updatedUser);
    // Update users array
    setUsers(users.map(u => u.id === currentUser.id ? { ...u, name, email } : u));
    
    // Update Supabase DB
    const { error: dbError } = await supabase.from('users').update({ name, email }).eq('id', currentUser.id);
    if (dbError) return { success: false, error: dbError.message };
    
    // FORCE Update Supabase Auth every time without checking the previous state.
    // This un-sticks any credentials that fell out of sync.
    const { error: authError } = await supabase.auth.updateUser({ email });
    if (authError) {
      console.error("Auth Update Error:", authError);
      return { success: false, error: authError.message };
    }
    
    return { success: true };
  };

  const updatePassword = async (newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const addUser = async (userData: Omit<User, "id" | "createdAt">): Promise<{ success: boolean; error?: string }> => {
    // 1. Sign up on secondary client to avoid logging out the admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: userData.email,
      password: "Gissmatic2026",
    });
    if (authError) return { success: false, error: authError.message };
    if (!authData.user) return { success: false, error: "User creation failed" };

    // 2. Insert into users DB
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      requires_password_change: true
    });
    if (dbError) return { success: false, error: dbError.message };

    // 3. Insert default permissions into DB (snake case)
    const dbPerms = {
      user_id: authData.user.id, show_quick_add_stock: false, show_quick_out_stock: false,
      can_access_dashboard: false, can_view_inventory: true, can_add_stock: false,
      can_stock_in: false, can_out_stock: false, can_freeze_stock: false,
      can_view_customers: false, can_manage_customers: false,
      can_view_suppliers: false, can_manage_suppliers: false,
      can_view_reports: false, can_export_reports: false,
    };
    await supabase.from('user_permissions').insert(dbPerms);

    // 4. Update local state
    const newUser: User = { ...userData, id: authData.user.id, createdAt: new Date().toISOString() };
    setUsers([...users, newUser]);
    
    const localPerms: UserPermissions = {
      userId: authData.user.id, showQuickAddStock: false, showQuickOutStock: false,
      canAccessDashboard: false, canViewInventory: true, canAddStock: false,
      canStockIn: false, canOutStock: false, canFreezeStock: false,
      canViewCustomers: false, canManageCustomers: false,
      canViewSuppliers: false, canManageSuppliers: false,
      canViewReports: false, canExportReports: false,
    };
    setPermissions([...permissions, localPerms]);

    return { success: true };
  };

  const deleteUser = async (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
    setPermissions(permissions.filter((p) => p.userId !== id));
    // Sync to Supabase
    await supabase.from('user_permissions').delete().eq('user_id', id);
    await supabase.from('users').delete().eq('id', id);
  };

  const addProduct = async (productData: Omit<Product, "id" | "lastUpdated">) => {
    // 0. If a custom supplier name was typed that isn't in our list, auto-create it
    if (productData.supplierName) {
      const exists = suppliers.some(s => s.name.toLowerCase() === productData.supplierName.toLowerCase());
      if (!exists) {
        await addSupplier({ name: productData.supplierName, phone: "", email: "", address: "", country: "" });
      }
    }
    const tempId = `P${Date.now()}`;
    const newProduct: Product = { ...productData, id: tempId, lastUpdated: new Date().toISOString() };
    setProducts(prev => [newProduct, ...prev]);

    // 2. Add to Custom Categories list instantly
    if (productData.category && !categories.includes(productData.category)) {
      setCategories(prev => [...prev, productData.category]);
    }

    // 3. Push to Supabase
    const dbPayload = {
      part_number: productData.partNumber,
      name: productData.name,
      description: productData.description || null,
      image_url: productData.imageUrl || null,
      category: productData.category,
      tracking_type: productData.trackingType,
      quantity: productData.quantity,
      serial_numbers: productData.serialNumbers || [],
      supplier_name: productData.supplierName || null,
      last_updated: newProduct.lastUpdated
    };

    const { data, error } = await supabase.from('products').insert([dbPayload]).select().single();
    if (error) {
      console.error("Supabase insert error:", error);
    } else if (data && data.id) {
      // Replace temporary ID with actual real DB ID
      setProducts(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    // 1. Optimistic Local Update
    const timestamp = new Date().toISOString();
    setProducts(prev => prev.map((p) => p.id === id ? { ...p, ...updates, lastUpdated: timestamp } : p));

    // 2. Update Custom Categories list
    if (updates.category && !categories.includes(updates.category)) {
      setCategories(prev => [...prev, updates.category]);
    }

    // 3. Sync to Supabase
    const dbPayload: any = { last_updated: timestamp };
    if (updates.partNumber !== undefined) dbPayload.part_number = updates.partNumber;
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.imageUrl !== undefined) dbPayload.image_url = updates.imageUrl;
    if (updates.category !== undefined) dbPayload.category = updates.category;
    if (updates.trackingType !== undefined) dbPayload.tracking_type = updates.trackingType;
    if (updates.quantity !== undefined) dbPayload.quantity = updates.quantity;
    if (updates.serialNumbers !== undefined) dbPayload.serial_numbers = updates.serialNumbers;
    if (updates.supplierName !== undefined) dbPayload.supplier_name = updates.supplierName;

    const { error } = await supabase.from('products').update(dbPayload).eq('id', id);
    if (error) console.error("Supabase update product error:", error);
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
      const product = products.find((p) => p.id === frozen.productId);
      if (product) {
        if (frozen.trackingType === "SN") {
          updateProduct(product.id, {
            serialNumbers: [...product.serialNumbers, ...frozen.serialNumbers],
            quantity: product.quantity + frozen.serialNumbers.length,
          });
        } else {
          updateProduct(product.id, { quantity: product.quantity + frozen.quantity });
        }
      }
    }
    // For "confirm", stock was already deducted when frozen, so no product update needed

    // Remove from local state
    setFrozenStocks(prev => prev.filter((f) => f.id !== id));
    // Delete from Supabase
    await supabase.from('frozen_stocks').delete().eq('id', id);
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) setCategories([...categories, category]);
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
        supabase.from('frozen_stocks').delete().not('id', 'is', null)
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
      currentUser, users, products, auditLogs, suppliers, customers, outgoingSales, frozenStocks,
      permissions, categories, currency, login, logout, updateProfile, updatePassword, addUser, deleteUser,
      addProduct, updateProduct, addAuditLog, addSupplier, updateSupplier, addCustomer, deleteCustomer,
      addOutgoingSale, addFrozenStock, releaseFrozenStock, addCategory, setCurrency: setCurrencyState,
      getUserPermissions, updateUserPermissions, factoryReset
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