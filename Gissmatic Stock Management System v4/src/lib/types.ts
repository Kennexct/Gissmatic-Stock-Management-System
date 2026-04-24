export type UserRole = "superadmin" | "manager" | "clerk" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UserPermissions {
  userId: string;
  // Global quick action buttons
  showQuickAddStock: boolean;
  showQuickOutStock: boolean;
  // Dashboard
  canAccessDashboard: boolean;
  // Inventory
  canViewInventory: boolean;
  canAddStock: boolean;
  canStockIn: boolean;
  canOutStock: boolean;
  canFreezeStock: boolean;
  // Customers
  canViewCustomers: boolean;
  canManageCustomers: boolean;
  // Suppliers
  canViewSuppliers: boolean;
  canManageSuppliers: boolean;
  // Reports
  canViewReports: boolean;
  canExportReports: boolean;
}

export interface Product {
  id: string;
  partNumber: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category: string;
  trackingType: "SN" | "QTY";
  quantity: number;         // QTY: actual count. SN: equals serialNumbers.length
  serialNumbers: string[];  // Available serial numbers (SN type only)
  supplierName: string;
  lastUpdated: string;
}

export interface FrozenStock {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  partNumber: string;
  trackingType: "SN" | "QTY";
  serialNumbers: string[];  // Frozen serial numbers (SN type)
  quantity: number;         // Frozen quantity (QTY type)
  frozenBy: string;
  frozenByEmail: string;
  customerName?: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  createdAt: string;
}

export interface OutgoingSale {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  partNumber: string;
  trackingType: "SN" | "QTY";
  serialNumbers: string[];
  quantity: number;
  note: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userEmail: string;
  action: "Stock-In" | "Stock-Out" | "Adjustment" | "Created" | "Updated" | "Deleted" | "Frozen" | "Released" | "Cancelled";
  itemName: string;
  changeDetail: string;
  customerName?: string;
  note?: string;
}