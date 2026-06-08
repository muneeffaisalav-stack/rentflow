
export type Role = 'landlord' | 'super-admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  phone?: string;
}

export interface Property {
  id: string;
  landlordId: string;
  propertyName: string;
  address: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  propertyId: string;
  landlordId: string;
  name: string;
  phone: string;
  rentAmount: number;
  dueDate: number; // Day of the month
  upiId: string;
  status: 'active' | 'inactive';
}

export interface Invoice {
  id: string;
  tenantId: string;
  propertyId: string;
  month: string; // YYYY-MM
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentDate?: string;
  createdAt: string;
}
