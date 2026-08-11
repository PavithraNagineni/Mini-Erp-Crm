import { api } from "./client";

export type Role = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  address?: string | null;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  followUpDate?: string | null;
  createdAt: string;
  notes?: CustomerNote[];
  challans?: { id: string; challanNumber: string; status: string; totalQuantity: number; createdAt: string }[];
}

export interface CustomerNote {
  id: string;
  note: string;
  createdAt: string;
  createdBy: { id: string; name: string };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: string | number;
  currentStock: number;
  minStockAlert: number;
  location?: string | null;
  isLowStock?: boolean;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  quantityChanged: number;
  movementType: "IN" | "OUT";
  reason: string;
  createdAt: string;
  createdBy: { id: string; name: string };
}

export interface ChallanItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: string | number;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  totalQuantity: number;
  createdAt: string;
  customer: { id: string; name: string; businessName?: string | null };
  items: ChallanItem[];
  createdBy?: { id: string; name: string };
}

interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) => api.post<{ token: string; user: User }>("/auth/login", { email, password }),
  me: () => api.get<User>("/auth/me"),
};

// ---- Customers ----
export const customerApi = {
  list: (params: { search?: string; status?: string; page?: number; limit?: number }) =>
    api.get<Paginated<Customer>>("/customers", { params }),
  get: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<Customer>("/customers", data),
  update: (id: string, data: Partial<Customer>) => api.put<Customer>(`/customers/${id}`, data),
  addNote: (id: string, note: string) => api.post<CustomerNote>(`/customers/${id}/notes`, { note }),
};

// ---- Products ----
export const productApi = {
  list: (params: { search?: string; lowStock?: boolean; page?: number; limit?: number }) =>
    api.get<Paginated<Product>>("/products", { params }),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>("/products", data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  addStockMovement: (id: string, data: { quantityChanged: number; movementType: "IN" | "OUT"; reason: string }) =>
    api.post(`/products/${id}/stock-movement`, data),
  listMovements: (id: string, params: { page?: number; limit?: number }) =>
    api.get<Paginated<StockMovement>>(`/products/${id}/stock-movements`, { params }),
};

// ---- Challans ----
export const challanApi = {
  list: (params: { status?: string; customerId?: string; page?: number; limit?: number }) =>
    api.get<Paginated<Challan>>("/challans", { params }),
  get: (id: string) => api.get<Challan>(`/challans/${id}`),
  create: (data: { customerId: string; items: { productId: string; quantity: number }[] }) =>
    api.post<Challan>("/challans", data),
  update: (id: string, data: { customerId?: string; items?: { productId: string; quantity: number }[] }) =>
    api.put<Challan>(`/challans/${id}`, data),
  confirm: (id: string) => api.post<Challan>(`/challans/${id}/confirm`),
  cancel: (id: string) => api.post<Challan>(`/challans/${id}/cancel`),
};
