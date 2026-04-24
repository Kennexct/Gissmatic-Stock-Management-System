import { User, Product, AuditLog, Supplier, Customer, OutgoingSale, UserPermissions, FrozenStock } from "./types";

export const mockUsers: User[] = [
  { id: "1", name: "Admin User", email: "admin@stockms.com", role: "superadmin", createdAt: "2025-01-15T10:00:00Z" },
  { id: "2", name: "John Manager", email: "john@stockms.com", role: "manager", createdAt: "2025-02-01T09:30:00Z" },
  { id: "3", name: "Sarah Clerk", email: "sarah@stockms.com", role: "clerk", createdAt: "2025-02-10T14:00:00Z" },
  { id: "4", name: "Mike Viewer", email: "mike@stockms.com", role: "viewer", createdAt: "2025-02-15T11:00:00Z" },
];

export const mockPermissions: UserPermissions[] = [
  {
    userId: "2",
    showQuickAddStock: true, showQuickOutStock: true,
    canAccessDashboard: true,
    canViewInventory: true, canAddStock: true, canStockIn: true, canOutStock: true, canFreezeStock: true,
    canViewCustomers: true, canManageCustomers: true,
    canViewSuppliers: true, canManageSuppliers: false,
    canViewReports: true, canExportReports: false,
  },
  {
    userId: "3",
    showQuickAddStock: false, showQuickOutStock: true,
    canAccessDashboard: false,
    canViewInventory: true, canAddStock: false, canStockIn: true, canOutStock: true, canFreezeStock: true,
    canViewCustomers: true, canManageCustomers: false,
    canViewSuppliers: true, canManageSuppliers: false,
    canViewReports: false, canExportReports: false,
  },
  {
    userId: "4",
    showQuickAddStock: false, showQuickOutStock: false,
    canAccessDashboard: false,
    canViewInventory: true, canAddStock: false, canStockIn: false, canOutStock: false, canFreezeStock: false,
    canViewCustomers: false, canManageCustomers: false,
    canViewSuppliers: false, canManageSuppliers: false,
    canViewReports: false, canExportReports: false,
  },
];

export const mockProducts: Product[] = [
  {
    id: "P001", partNumber: "PN-LAPTOP-HP-001", name: "HP Pavilion Laptop", category: "Electronics",
    trackingType: "SN", quantity: 3,
    serialNumbers: ["SN-HP-A1B2C3", "SN-HP-D4E5F6", "SN-HP-G7H8I9"],
    supplierName: "Tech Distributors Inc", lastUpdated: "2026-02-20T10:30:00Z",
  },
  {
    id: "P002", partNumber: "PN-MOUSE-LOG-002", name: "Logitech Wireless Mouse", category: "Accessories",
    trackingType: "QTY", quantity: 8, serialNumbers: [],
    supplierName: "Global Tech Supply", lastUpdated: "2026-02-22T14:15:00Z",
  },
  {
    id: "P003", partNumber: "PN-DESK-STAND-003", name: "Adjustable Desk Stand", category: "Furniture",
    trackingType: "QTY", quantity: 120, serialNumbers: [],
    supplierName: "Office Furniture Co", lastUpdated: "2026-02-18T09:00:00Z",
  },
  {
    id: "P004", partNumber: "PN-CABLE-USB-004", name: "USB-C Cable 2m", category: "Accessories",
    trackingType: "QTY", quantity: 200, serialNumbers: [],
    supplierName: "Global Tech Supply", lastUpdated: "2026-02-25T16:45:00Z",
  },
  {
    id: "P005", partNumber: "PN-MONITOR-DELL-005", name: "Dell 27\" 4K Monitor", category: "Electronics",
    trackingType: "SN", quantity: 2,
    serialNumbers: ["SN-DELL-X1Y2Z3", "SN-DELL-A4B5C6"],
    supplierName: "Tech Distributors Inc", lastUpdated: "2026-02-24T11:20:00Z",
  },
  {
    id: "P006", partNumber: "PN-KEYBOARD-MEC-006", name: "Mechanical Keyboard RGB", category: "Accessories",
    trackingType: "QTY", quantity: 5, serialNumbers: [],
    supplierName: "Global Tech Supply", lastUpdated: "2026-02-23T13:00:00Z",
  },
  {
    id: "P007", partNumber: "PN-CHAIR-ERG-007", name: "Ergonomic Office Chair", category: "Furniture",
    trackingType: "QTY", quantity: 25, serialNumbers: [],
    supplierName: "Office Furniture Co", lastUpdated: "2026-02-21T10:00:00Z",
  },
  {
    id: "P008", partNumber: "PN-HEADSET-SONY-008", name: "Sony Wireless Headset", category: "Electronics",
    trackingType: "SN", quantity: 1,
    serialNumbers: ["SN-SONY-WH1-001"],
    supplierName: "Tech Distributors Inc", lastUpdated: "2026-02-26T08:30:00Z",
  },
];

export const mockSuppliers: Supplier[] = [
  { id: "S001", name: "Tech Distributors Inc", phone: "+1-555-0123", email: "contact@techdist.com", address: "123 Tech Street, Silicon Valley", country: "United States", createdAt: "2025-01-10T08:00:00Z" },
  { id: "S002", name: "Global Tech Supply", phone: "+1-555-0456", email: "info@globaltech.com", address: "456 Supply Avenue, New York", country: "United States", createdAt: "2025-01-15T10:00:00Z" },
  { id: "S003", name: "Office Furniture Co", phone: "+1-555-0789", email: "sales@officefurn.com", address: "789 Furniture Blvd, Chicago", country: "United States", createdAt: "2025-02-01T09:00:00Z" },
];

export const mockCustomers: Customer[] = [
  { id: "C001", name: "Alice Johnson", email: "alice@example.com", phone: "+1-555-1001", address: "10 Apple Street, New York", country: "United States", createdAt: "2026-01-20T10:00:00Z" },
  { id: "C002", name: "Bob Williams", email: "bob@example.com", phone: "+1-555-1002", address: "20 Banana Avenue, Los Angeles", country: "United States", createdAt: "2026-01-25T11:00:00Z" },
  { id: "C003", name: "Carol Smith", email: "carol@corp.com", phone: "+44-20-7946-0958", address: "30 Cherry Road, London", country: "United Kingdom", createdAt: "2026-02-05T09:00:00Z" },
  { id: "C004", name: "David Lee", email: "david.lee@bizmail.com", phone: "+65-9123-4567", address: "5 Orchard Tower, Singapore", country: "Singapore", createdAt: "2026-02-10T08:30:00Z" },
];

export const mockOutgoingSales: OutgoingSale[] = [
  { id: "OS001", timestamp: "2026-02-26T08:30:00Z", customerId: "C001", customerName: "Alice Johnson", productId: "P008", productName: "Sony Wireless Headset", partNumber: "PN-HEADSET-SONY-008", trackingType: "SN", serialNumbers: ["SN-SONY-WH1-002"], quantity: 1, note: "Online order #1001" },
  { id: "OS002", timestamp: "2026-02-25T16:00:00Z", customerId: "C002", customerName: "Bob Williams", productId: "P006", productName: "Mechanical Keyboard RGB", partNumber: "PN-KEYBOARD-MEC-006", trackingType: "QTY", serialNumbers: [], quantity: 10, note: "Bulk office purchase" },
  { id: "OS003", timestamp: "2026-02-24T11:00:00Z", customerId: "C003", customerName: "Carol Smith", productId: "P005", productName: "Dell 27\" 4K Monitor", partNumber: "PN-MONITOR-DELL-005", trackingType: "SN", serialNumbers: ["SN-DELL-P7Q8R9"], quantity: 1, note: "New office setup" },
  { id: "OS004", timestamp: "2026-02-23T14:00:00Z", customerId: "C001", customerName: "Alice Johnson", productId: "P001", productName: "HP Pavilion Laptop", partNumber: "PN-LAPTOP-HP-001", trackingType: "SN", serialNumbers: ["SN-HP-J1K2L3"], quantity: 1, note: "Personal use" },
  { id: "OS005", timestamp: "2026-02-22T10:00:00Z", customerId: "C002", customerName: "Bob Williams", productId: "P004", productName: "USB-C Cable 2m", partNumber: "PN-CABLE-USB-004", trackingType: "QTY", serialNumbers: [], quantity: 5, note: "" },
  { id: "OS006", timestamp: "2026-02-20T13:30:00Z", customerId: "C004", customerName: "David Lee", productId: "P007", productName: "Ergonomic Office Chair", partNumber: "PN-CHAIR-ERG-007", trackingType: "QTY", serialNumbers: [], quantity: 4, note: "Corporate procurement" },
];

export const defaultCategories = ["Electronics", "Accessories", "Furniture", "Office Supplies", "Hardware", "Software"];

export const mockAuditLogs: AuditLog[] = [
  { id: "A001", timestamp: "2026-02-26T08:30:15Z", userName: "Admin User", userEmail: "admin@stockms.com", action: "Stock-Out", itemName: "Sony Wireless Headset", changeDetail: "-1 SN: SN-SONY-WH1-002", customerName: "Alice Johnson", note: "Online order #1001" },
  { id: "A002", timestamp: "2026-02-25T16:45:22Z", userName: "John Manager", userEmail: "john@stockms.com", action: "Stock-In", itemName: "USB-C Cable 2m", changeDetail: "+50 QTY", note: "Supplier restock" },
  { id: "A003", timestamp: "2026-02-24T11:20:45Z", userName: "Sarah Clerk", userEmail: "sarah@stockms.com", action: "Stock-Out", itemName: "Dell 27\" 4K Monitor", changeDetail: "-1 SN: SN-DELL-P7Q8R9", customerName: "Carol Smith", note: "New office setup" },
  { id: "A004", timestamp: "2026-02-23T13:00:10Z", userName: "Admin User", userEmail: "admin@stockms.com", action: "Stock-Out", itemName: "Mechanical Keyboard RGB", changeDetail: "-10 QTY", customerName: "Bob Williams", note: "Bulk office purchase" },
  { id: "A005", timestamp: "2026-02-22T14:15:30Z", userName: "John Manager", userEmail: "john@stockms.com", action: "Adjustment", itemName: "Logitech Wireless Mouse", changeDetail: "-7 QTY", note: "Inventory correction" },
  { id: "A006", timestamp: "2026-02-21T10:00:00Z", userName: "Admin User", userEmail: "admin@stockms.com", action: "Stock-In", itemName: "Ergonomic Office Chair", changeDetail: "+15 QTY", note: "New shipment arrived" },
  { id: "A007", timestamp: "2026-02-20T10:30:20Z", userName: "Sarah Clerk", userEmail: "sarah@stockms.com", action: "Stock-In", itemName: "HP Pavilion Laptop", changeDetail: "+3 SNs", note: "New units arrived" },
  { id: "A008", timestamp: "2026-02-18T09:00:15Z", userName: "Admin User", userEmail: "admin@stockms.com", action: "Created", itemName: "Adjustable Desk Stand", changeDetail: "Initial: 100 QTY" },
];

export const mockFrozenStocks: FrozenStock[] = [];
