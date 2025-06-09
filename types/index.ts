export type UserRole = 'admin' | 'accountant' | 'employee';

export interface Permission {
  id: string;
  name: string;
  description: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  plainPassword?: string; // Added field for plain-text password
  role: UserRole;
  printName: string;
  senderId: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  position?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  position: string;
  phone: string;
  whatsapp: string;
  address: string;
  panNumber?: string;
  aadhaarNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  branchName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  description?: string | null;
  amount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdBy?: string; // Made optional since it's commented out in Prisma
  createdAt: Date;
  updatedAt: Date;
}

export interface SubOrder {
  id: string;
  name: string;
  description?: string;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderSeries {
  id: string;
  prefix: string;
  suffix?: string | null;
  description?: string | null;
  isDefault: boolean;
  startNumber: number | null;
  lastNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'imprest' | 'expense';
  senderId: string;
  receiverId: string;
  remark: string;
  paymentMethod: 'cash' | 'bank';
  bankAccountId?: string;
  orderId?: string;
  subOrderId?: string;
  expenseCategoryId?: string;
  hasInvoice?: boolean;
  invoiceUrl?: string;
  entryDate: Date;
  transactionDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SenderIdSeries {
  id: string;
  prefix: string;
  description?: string | null;
  isDefault: boolean;
  lastNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface LedgerEntry {
  transactionId: string;
  type: 'imprest' | 'expense';
  from: string;
  to: string;
  credit: number;
  debit: number;
  remark: string;
  paymentMethod: 'cash' | 'bank';
  bankAccountId?: string;
  orderId?: string;
  expenseCategoryId?: string;
  hasInvoice?: boolean;
  invoiceUrl?: string;
  entryDate: Date;
  transactionDate: Date;
  senderId: string;
  receiverId: string;
}

export interface UserLedger {
  userId: string;
  summary: {
    balance: number;
    totalCredit: number;
    totalDebit: number;
  };
  entries: LedgerEntry[];
}