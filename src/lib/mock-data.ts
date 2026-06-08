
import { Property, Tenant, Invoice, User } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Sterling',
  email: 'alex@rentflow.com',
  phone: '+91 9876543210',
  role: 'landlord',
  createdAt: '2023-01-15'
};

export const mockProperties: Property[] = [
  { id: 'p1', landlordId: 'u1', propertyName: 'Skyline Heights', address: '123 Downtown Ave, Metro City', createdAt: '2023-01-20' },
  { id: 'p2', landlordId: 'u1', propertyName: 'Greenwood Villas', address: '45 Suburban Lane, Garden District', createdAt: '2023-02-10' },
  { id: 'p3', landlordId: 'u1', propertyName: 'Blue Ocean Condos', address: '88 Beachfront Road, Coastal View', createdAt: '2023-03-05' }
];

export const mockTenants: Tenant[] = [
  { id: 't1', propertyId: 'p1', landlordId: 'u1', name: 'John Doe', phone: '+91 9000000001', rentAmount: 25000, dueDate: 5, upiId: 'john@upi', status: 'active' },
  { id: 't2', propertyId: 'p1', landlordId: 'u1', name: 'Sarah Miller', phone: '+91 9000000002', rentAmount: 18000, dueDate: 1, upiId: 'sarah@okaxis', status: 'active' },
  { id: 't3', propertyId: 'p2', landlordId: 'u1', name: 'David Smith', phone: '+91 9000000003', rentAmount: 32000, dueDate: 10, upiId: 'david@ybl', status: 'active' },
  { id: 't4', propertyId: 'p3', landlordId: 'u1', name: 'Emma Wilson', phone: '+91 9000000004', rentAmount: 15000, dueDate: 5, upiId: 'emma@upi', status: 'active' }
];

export const mockInvoices: Invoice[] = [
  { id: 'i1', tenantId: 't1', propertyId: 'p1', month: '2024-03', amount: 25000, status: 'paid', paymentDate: '2024-03-04', createdAt: '2024-03-01', paymentLink: 'upi://pay?pa=landlord@upi&am=25000' },
  { id: 'i2', tenantId: 't2', propertyId: 'p1', month: '2024-03', amount: 18000, status: 'pending', createdAt: '2024-03-01', paymentLink: 'upi://pay?pa=landlord@upi&am=18000' },
  { id: 'i3', tenantId: 't3', propertyId: 'p2', month: '2024-03', amount: 32000, status: 'overdue', createdAt: '2024-03-01', paymentLink: 'upi://pay?pa=landlord@upi&am=32000' },
  { id: 'i4', tenantId: 't4', propertyId: 'p3', month: '2024-03', amount: 15000, status: 'paid', paymentDate: '2024-03-06', createdAt: '2024-03-01', paymentLink: 'upi://pay?pa=landlord@upi&am=15000' }
];
