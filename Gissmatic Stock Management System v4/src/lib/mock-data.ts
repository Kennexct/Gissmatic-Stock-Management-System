import { User, Product, AuditLog, Supplier, Customer, OutgoingSale, UserPermissions, FrozenStock } from "./types";

export const mockUsers: User[] = [];
export const mockPermissions: UserPermissions[] = [];
export const mockProducts: Product[] = [];
export const mockSuppliers: Supplier[] = [];
export const mockCustomers: Customer[] = [];
export const mockOutgoingSales: OutgoingSale[] = [];
export const defaultCategories = ["Electronics", "Accessories", "Furniture", "Office Supplies", "Hardware", "Software"];
export const mockAuditLogs: AuditLog[] = [];
export const mockFrozenStocks: FrozenStock[] = [];
