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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const superadminPermissions: Omit<UserPermissions, "userId"> = {
  showQuickAddStock: true, showQuickOutStock: true,
  canAccessDashboard: true,
  canViewInventory: true, canAddStock: true, canStockIn: true, canOutStock: true, canFreezeStock: true,
  canViewCustomers: true, canManageCustomers: true,
  canViewSuppliers: true, canManageSuppliers: true,
  canViewReports: true, canExportReports: true,
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

  const deleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
    setPermissions(permissions.filter((p) => p.userId !== id));
  };

  const addProduct = (productData: Omit<Product, "id" | "lastUpdated">) => {
    const newProduct: Product = { ...productData, id: `P${Date.now()}`, lastUpdated: new Date().toISOString() };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(products.map((p) => p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString() } : p));
  };

  const addAuditLog = (logData: Omit<AuditLog, "id" | "timestamp">) => {
    const newLog: AuditLog = { ...logData, id: `A${Date.now()}`, timestamp: new Date().toISOString() };
    setAuditLogs([newLog, ...auditLogs]);
  };

  const addSupplier = (supplierData: Omit<Supplier, "id" | "createdAt">) => {
    const newSupplier: Supplier = { ...supplierData, id: `S${Date.now()}`, createdAt: new Date().toISOString() };
    setSuppliers([...suppliers, newSupplier]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(suppliers.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  const addCustomer = (customerData: Omit<Customer, "id" | "createdAt">) => {
    const newCustomer: Customer = { ...customerData, id: `C${Date.now()}`, createdAt: new Date().toISOString() };
    setCustomers([...customers, newCustomer]);
  };

  const deleteCustomer = (id: string) => setCustomers(customers.filter((c) => c.id !== id));

  const addOutgoingSale = (saleData: Omit<OutgoingSale, "id" | "timestamp">) => {
    const newSale: OutgoingSale = { ...saleData, id: `OS${Date.now()}`, timestamp: new Date().toISOString() };
    setOutgoingSales([newSale, ...outgoingSales]);
  };

  const addFrozenStock = (frozenData: Omit<FrozenStock, "id" | "timestamp">) => {
    const newFrozen: FrozenStock = { ...frozenData, id: `FS${Date.now()}`, timestamp: new Date().toISOString() };
    setFrozenStocks([...frozenStocks, newFrozen]);
  };

  const releaseFrozenStock = (id: string, action: "confirm" | "cancel") => {
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

    setFrozenStocks(frozenStocks.filter((f) => f.id !== id));
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

  const updateUserPermissions = (userId: string, updates: Partial<UserPermissions>) => {
    const existing = permissions.find((p) => p.userId === userId);
    if (existing) {
      setPermissions(permissions.map((p) => p.userId === userId ? { ...p, ...updates } : p));
    } else {
      const base = getUserPermissions(userId);
      setPermissions([...permissions, { ...base, ...updates }]);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser, users, products, auditLogs, suppliers, customers, outgoingSales, frozenStocks,
      permissions, categories, currency, login, logout, addUser, deleteUser,
      addProduct, updateProduct, addAuditLog, addSupplier, updateSupplier, addCustomer, deleteCustomer,
      addOutgoingSale, addFrozenStock, releaseFrozenStock, addCategory, setCurrency,
      getUserPermissions, updateUserPermissions,
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