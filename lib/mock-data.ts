import { User, Transaction, AuditLog, SenderIdSeries, Permission, BankAccount, UserLedger, Order, OrderSeries, ExpenseCategory } from '@/types';

// Available permissions
export const permissions: Permission[] = [
  {
    id: '1',
    name: 'View Bank Accounts',
    description: 'Can view bank account details',
    code: 'VIEW_BANK_ACCOUNTS',
  },
  {
    id: '2',
    name: 'Manage Bank Accounts',
    description: 'Can create and manage bank accounts',
    code: 'MANAGE_BANK_ACCOUNTS',
  },
  {
    id: '3',
    name: 'Create Transactions',
    description: 'Can create new transactions',
    code: 'CREATE_TRANSACTIONS',
  },
  {
    id: '4',
    name: 'Approve Transactions',
    description: 'Can approve transactions',
    code: 'APPROVE_TRANSACTIONS',
  },
  {
    id: '5',
    name: 'View Audit Logs',
    description: 'Can view audit logs',
    code: 'VIEW_AUDIT_LOGS',
  },
  {
    id: '6',
    name: 'Manage Employees',
    description: 'Can create and manage employees',
    code: 'MANAGE_EMPLOYEES',
  },
  {
    id: '7',
    name: 'Load Money',
    description: 'Can load money to employee accounts',
    code: 'LOAD_MONEY',
  },
  {
    id: '8',
    name: 'Use Bank Accounts',
    description: 'Can use bank accounts for transactions',
    code: 'USE_BANK_ACCOUNTS',
  },
  {
    id: '9',
    name: 'Use Cash',
    description: 'Can use cash for transactions',
    code: 'USE_CASH',
  },
  {
    id: '10',
    name: 'Manage Orders',
    description: 'Can create and manage orders',
    code: 'MANAGE_ORDERS',
  },
  {
    id: '11',
    name: 'Manage Expense Categories',
    description: 'Can create and manage expense categories',
    code: 'MANAGE_EXPENSE_CATEGORIES',
  },
];

// Default permission sets for roles
const adminPermissions = permissions.map(p => p.code);
const accountantPermissions = [
  'VIEW_BANK_ACCOUNTS',
  'CREATE_TRANSACTIONS',
  'APPROVE_TRANSACTIONS',
  'USE_BANK_ACCOUNTS',
  'USE_CASH',
  'MANAGE_ORDERS',
  'VIEW_AUDIT_LOGS',
];
const employeePermissions = [
  'CREATE_TRANSACTIONS',
  'USE_CASH',
];

// Mock users data
export const users: User[] = [
  {
    id: 'admin1',
    email: 'admin@example.com',
    name: 'Admin User',
    printName: 'ADMIN',
    role: 'admin',
    senderId: 'RBC-2025-ADMIN',
    password: 'admin123', // In a real app, this would be hashed
    permissions: adminPermissions,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'acc1',
    email: 'accountant@example.com',
    name: 'John Accountant',
    printName: 'JOHN-ACC',
    role: 'accountant',
    senderId: 'RBC-2025-JOHN-ACC',
    password: 'accountant123',
    permissions: accountantPermissions,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'emp1',
    email: 'employee@example.com',
    name: 'Jane Employee',
    printName: 'JANE-EMP',
    role: 'employee',
    senderId: 'RBC-2025-JANE-EMP',
    password: 'employee123',
    permissions: employeePermissions,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Mock expense categories
export const expenseCategories: ExpenseCategory[] = [
  {
    id: 'exp1',
    name: 'Office Supplies',
    description: 'Stationery, printer cartridges, etc.',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'exp2',
    name: 'Travel',
    description: 'Transportation, accommodation, meals',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'exp3',
    name: 'Utilities',
    description: 'Electricity, water, internet bills',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Mock orders data
export const orders: Order[] = [
  {
    id: 'order1',
    orderNumber: 'ORD-2024-001',
    description: 'Office supplies procurement',
    amount: 5000,
    status: 'ACTIVE',
    createdBy: 'admin1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'order2',
    orderNumber: 'ORD-2024-002',
    description: 'Travel expenses for team',
    amount: 10000,
    status: 'ACTIVE',
    createdBy: 'acc1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
];

// Mock transactions data
export const transactions: Transaction[] = [
  // Admin -> John (emp1)
  {
    id: 'RBC-2025-ADMIN-IMP-001',
    amount: 1000,
    type: 'imprest',
    senderId: 'admin1',
    receiverId: 'emp1',
    remark: 'Initial imprest allocation for John',
    paymentMethod: 'bank',
    bankAccountId: 'bank1',
    orderId: 'order1',
    entryDate: new Date('2024-01-15'),
    transactionDate: new Date('2024-01-15'),
    status: 'approved',
    createdBy: 'admin1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  // John's expense
  {
    id: 'RBC-2025-JANE-EMP-EXP-001',
    amount: 200,
    type: 'expense',
    senderId: 'emp1',
    receiverId: 'EXPENSE',
    remark: 'Office supplies purchase',
    paymentMethod: 'cash',
    orderId: 'order1',
    expenseCategoryId: 'exp1',
    hasInvoice: true,
    invoiceUrl: 'https://example.com/invoice1.pdf',
    entryDate: new Date('2024-01-16'),
    transactionDate: new Date('2024-01-16'),
    status: 'approved',
    createdBy: 'emp1',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  // Admin -> Accountant
  {
    id: 'RBC-2025-ADMIN-IMP-002',
    amount: 1500,
    type: 'imprest',
    senderId: 'admin1',
    receiverId: 'acc1',
    remark: 'Initial imprest allocation for accountant',
    paymentMethod: 'bank',
    bankAccountId: 'bank1',
    orderId: 'order2',
    entryDate: new Date('2024-01-17'),
    transactionDate: new Date('2024-01-17'),
    status: 'approved',
    createdBy: 'admin1',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
  // Accountant's transaction
  {
    id: 'RBC-2025-JOHN-ACC-IMP-001',
    amount: 300,
    type: 'imprest',
    senderId: 'acc1',
    receiverId: 'emp1',
    remark: 'Travel expenses advance',
    paymentMethod: 'bank',
    bankAccountId: 'bank1',
    orderId: 'order2',
    entryDate: new Date('2024-01-18'),
    transactionDate: new Date('2024-01-18'),
    status: 'approved',
    createdBy: 'acc1',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
];

// Mock bank accounts data
export const bankAccounts: BankAccount[] = [
  {
    id: 'bank1',
    bankName: 'Example Bank',
    accountNumber: '1234567890',
    accountName: 'Company Account',
    branchName: 'Main Branch',
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Mock audit logs data
export const auditLogs: AuditLog[] = [
  {
    id: 'audit1',
    userId: 'admin1',
    action: 'create',
    entityType: 'transaction',
    entityId: 'RBC-2025-ADMIN-IMP-001',
    details: {
      action: 'Created imprest transaction',
      amount: 1000,
      receiver: 'Jane Employee',
    },
    timestamp: new Date('2024-01-15'),
  },
  {
    id: 'audit2',
    userId: 'emp1',
    action: 'create',
    entityType: 'transaction',
    entityId: 'RBC-2025-JANE-EMP-EXP-001',
    details: {
      action: 'Created expense transaction',
      amount: 200,
      category: 'Office Supplies',
    },
    timestamp: new Date('2024-01-16'),
  },
  {
    id: 'audit3',
    userId: 'admin1',
    action: 'create',
    entityType: 'transaction',
    entityId: 'RBC-2025-ADMIN-IMP-002',
    details: {
      action: 'Created imprest transaction',
      amount: 1500,
      receiver: 'John Accountant',
    },
    timestamp: new Date('2024-01-17'),
  },
  {
    id: 'audit4',
    userId: 'acc1',
    action: 'create',
    entityType: 'transaction',
    entityId: 'RBC-2025-JOHN-ACC-IMP-001',
    details: {
      action: 'Created imprest transaction',
      amount: 300,
      receiver: 'Jane Employee',
    },
    timestamp: new Date('2024-01-18'),
  },
  {
    id: 'audit5',
    userId: 'admin1',
    action: 'create',
    entityType: 'bank_account',
    entityId: 'bank1',
    details: {
      action: 'Added bank account',
      bankName: 'Example Bank',
      accountNumber: '1234567890',
    },
    timestamp: new Date('2024-01-01'),
  },
];

// Mock sender ID series data
export const senderIdSeries: SenderIdSeries[] = [
  { 
    id: '1',
    prefix: 'RBC-2025', 
    description: 'Royal Business Corp 2025',
    isDefault: true,
    lastNumber: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
];

// Mock order series data
export const orderSeries: OrderSeries[] = [
  { 
    id: '1',
    prefix: 'ORD-2024', 
    description: 'Orders 2024',
    isDefault: true,
    startNumber: 1,
    lastNumber: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
];

// Helper function to check if a user has a specific permission
export const hasPermission = (userId: string, permissionCode: string): boolean => {
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  return user.permissions.includes(permissionCode);
};

// Helper function to generate order number
export const generateOrderNumber = (): string => {
  const defaultSeries = orderSeries.find(s => s.isDefault);
  if (!defaultSeries) throw new Error('No default order series found');

  defaultSeries.lastNumber += 1;
  const newNumber = defaultSeries.lastNumber.toString().padStart(3, '0');
  return `${defaultSeries.prefix}-${newNumber}`;
};

// Helper function to check if print name is unique
export const isPrintNameUnique = (printName: string, excludeUserId?: string): boolean => {
  return !users.some(u => 
    u.printName === printName && (!excludeUserId || u.id !== excludeUserId)
  );
};

// Helper function to generate transaction ID
export const generateTransactionId = (type: string, senderId: string): string => {
  const user = users.find(u => u.id === senderId);
  if (!user) throw new Error('User not found');

  const series = senderIdSeries.find(s => s.isDefault);
  if (!series) throw new Error('No default series found');

  const prefix = type === 'imprest' ? 'IMP' : 'EXP';
  series.lastNumber += 1;
  const sequenceNumber = series.lastNumber.toString().padStart(3, '0');
  
  return `${series.prefix}-${user.printName}-${prefix}-${sequenceNumber}`;
};

// Helper function to get user by ID
export const getUserById = (userId: string): User | undefined => {
  return users.find(u => u.id === userId);
};

// Helper function to get bank account by ID
export const getBankAccountById = (accountId: string): BankAccount | undefined => {
  return bankAccounts.find(a => a.id === accountId);
};

// Helper function to get order by ID
export const getOrderById = (orderId: string): Order | undefined => {
  return orders.find(o => o.id === orderId);
};

// Helper function to get user's ledger
export const getUserLedger = (userId: string): UserLedger => {
  // Get user's transactions where they are directly involved
  const userTransactions = transactions.filter(t => {
    return t.senderId === userId || t.receiverId === userId;
  });

  // Calculate totals
  const summary = userTransactions.reduce(
    (acc, t) => {
      if (t.receiverId === userId) {
        acc.totalCredit += t.amount;
      }
      if (t.senderId === userId) {
        acc.totalDebit += t.amount;
      }
      return acc;
    },
    { totalCredit: 0, totalDebit: 0, balance: 0 }
  );

  // Calculate final balance
  summary.balance = summary.totalCredit - summary.totalDebit;

  // Map transactions to ledger entries
  const entries = userTransactions.map(t => ({
    transactionId: t.id,
    type: t.type,
    from: getUserById(t.senderId)?.name || t.senderId,
    to: t.receiverId === 'EXPENSE' ? 'Expense' : getUserById(t.receiverId)?.name || t.receiverId,
    credit: t.receiverId === userId ? t.amount : 0,
    debit: t.senderId === userId ? t.amount : 0,
    remark: t.remark,
    paymentMethod: t.paymentMethod,
    bankAccountId: t.bankAccountId,
    orderId: t.orderId,
    expenseCategoryId: t.expenseCategoryId,
    hasInvoice: t.hasInvoice,
    invoiceUrl: t.invoiceUrl,
    entryDate: t.entryDate,
    transactionDate: t.transactionDate,
    senderId: t.senderId,
    receiverId: t.receiverId,
  }));

  return {
    userId,
    summary,
    entries: entries.sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()),
  };
};

// Function to add a new bank account
export const addBankAccount = (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
  const newAccount: BankAccount = {
    id: `bank${bankAccounts.length + 1}`,
    ...account,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  bankAccounts.push(newAccount);

  // Add audit log
  addAuditLog('admin1', 'create', 'bank_account', newAccount.id, {
    action: 'Added bank account',
    bankName: newAccount.bankName,
    accountNumber: newAccount.accountNumber,
  });

  return newAccount;
};

// Function to set default bank account
export const setDefaultBankAccount = (accountId: string) => {
  bankAccounts.forEach(account => {
    account.isDefault = account.id === accountId;
  });

  // Add audit log
  addAuditLog('admin1', 'update', 'bank_account', accountId, {
    action: 'Set default bank account',
  });
};

// Function to delete a bank account
export const deleteBankAccount = (accountId: string) => {
  const account = bankAccounts.find(a => a.id === accountId);
  if (!account) throw new Error('Bank account not found');
  if (account.isDefault) throw new Error('Cannot delete default bank account');
  const index = bankAccounts.findIndex(a => a.id === accountId);
  bankAccounts.splice(index, 1);

  // Add audit log
  addAuditLog('admin1', 'delete', 'bank_account', accountId, {
    action: 'Deleted bank account',
    bankName: account.bankName,
  });
};

// Function to add a new sender ID series
export const addSenderIdSeries = (prefix: string, description: string) => {
  const newSeries: SenderIdSeries = {
    id: `${senderIdSeries.length + 1}`,
    prefix,
    description,
    isDefault: senderIdSeries.length === 0,
    lastNumber: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  senderIdSeries.push(newSeries);

  // Add audit log
  addAuditLog('admin1', 'create', 'sender_id_series', newSeries.id, {
    action: 'Added sender ID series',
    prefix,
    description,
  });

  return newSeries;
};

// Function to set default sender ID series
export const setDefaultSenderIdSeries = (seriesId: string) => {
  senderIdSeries.forEach(series => {
    series.isDefault = series.id === seriesId;
  });

  // Add audit log
  addAuditLog('admin1', 'update', 'sender_id_series', seriesId, {
    action: 'Set default sender ID series',
  });
};

// Function to delete a sender ID series
export const deleteSenderIdSeries = (seriesId: string) => {
  const series = senderIdSeries.find(s => s.id === seriesId);
  if (!series) throw new Error('Sender ID series not found');
  if (series.isDefault) throw new Error('Cannot delete default series');
  const index = senderIdSeries.findIndex(s => s.id === seriesId);
  senderIdSeries.splice(index, 1);

  // Add audit log
  addAuditLog('admin1', 'delete', 'sender_id_series', seriesId, {
    action: 'Deleted sender ID series',
    prefix: series.prefix,
  });
};

// Function to add a new order
export const addOrder = (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
  const newOrder: Order = {
    id: `order${orders.length + 1}`,
    orderNumber: generateOrderNumber(),
    ...order,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  orders.push(newOrder);

  // Add audit log
  addAuditLog(
    order.createdBy!,
    'create',
    'order',
    newOrder.id,
    {
      action: 'Created order',
      orderNumber: newOrder.orderNumber,
      amount: newOrder.amount,
    }
  );

  return newOrder;
};

// Function to update order status
export const updateOrderStatus = (orderId: string, status: Order['status']) => {
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found');
  order.status = status;
  order.updatedAt = new Date();

  // Add audit log
  addAuditLog('admin1', 'update', 'order', orderId, {
    action: 'Updated order status',
    orderNumber: order.orderNumber,
    status,
  });

  return order;
};

// Add new helper function to get transactions by order ID
export const getTransactionsByOrderId = (orderId: string) => {
  return transactions.filter(t => t.orderId === orderId);
};

// Add new helper function to get order summary
export const getOrderSummary = (orderId: string) => {
  const orderTransactions = getTransactionsByOrderId(orderId);
  
  return orderTransactions.reduce(
    (acc, t) => {
      if (t.type === 'imprest') {
        acc.totalTransferred += t.amount;
      } else {
        acc.totalSpent += t.amount;
      }
      acc.transactionCount++;
      return acc;
    },
    
    { totalTransferred: 0, totalSpent: 0, transactionCount: 0 }
  );
};
// Function to add a new order series
export const addOrderSeries = (prefix: string, description: string) => {
  const newSeries: OrderSeries = {
    id: `${orderSeries.length + 1}`,
    prefix,
    description,
    isDefault: orderSeries.length === 0,
    startNumber: 1,
    lastNumber: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  orderSeries.push(newSeries);
  orderSeries.push(newSeries);

  // Add audit log
  addAuditLog('admin1', 'create', 'order_series', newSeries.id, {
    action: 'Added order series',
    prefix,
    description,
  });

  return newSeries;
};

// Function to set default order series
export const setDefaultOrderSeries = (seriesId: string) => {
  orderSeries.forEach(series => {
    series.isDefault = series.id === seriesId;
  });

  // Add audit log
  addAuditLog('admin1', 'update', 'order_series', seriesId, {
    action: 'Set default order series',
  });
};

// Function to delete an order series
export const deleteOrderSeries = (seriesId: string) => {
  const series = orderSeries.find(s => s.id === seriesId);
  if (!series) throw new Error('Order series not found');
  if (series.isDefault) throw new Error('Cannot delete default series');
  const index = orderSeries.findIndex(s => s.id === seriesId);
  orderSeries.splice(index, 1);

  // Add audit log
  addAuditLog('admin1', 'delete', 'order_series', seriesId, {
    action: 'Deleted order series',
    prefix: series.prefix,
  });
};

// Function to add a new expense category
export const addExpenseCategory = (category: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => {
  const newCategory: ExpenseCategory = {
    id: `exp${expenseCategories.length + 1}`,
    ...category,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  expenseCategories.push(newCategory);

  // Add audit log
  addAuditLog('admin1', 'create', 'expense_category', newCategory.id, {
    action: 'Added expense category',
    name: newCategory.name,
  });

  return newCategory;
};

// Function to update expense category
export const updateExpenseCategory = (id: string, updates: Partial<ExpenseCategory>) => {
  const category = expenseCategories.find(c => c.id === id);
  if (!category) throw new Error('Expense category not found');
  
  Object.assign(category, {
    ...updates,
    updatedAt: new Date(),
  });

  // Add audit log
  addAuditLog('admin1', 'update', 'expense_category', id, {
    action: 'Updated expense category',
    name: category.name,
  });
  
  return category;
};

// Function to toggle expense category status
export const toggleExpenseCategory = (id: string) => {
  const category = expenseCategories.find(c => c.id === id);
  if (!category) throw new Error('Expense category not found');
  
  category.isActive = !category.isActive;
  category.updatedAt = new Date();

  // Add audit log
  addAuditLog('admin1', 'update', 'expense_category', id, {
    action: `${category.isActive ? 'Activated' : 'Deactivated'} expense category`,
    name: category.name,
  });
  
  return category;
};

// Helper function to add audit logs
export const addAuditLog = (
  userId: string,
  action: 'create' | 'update' | 'delete',
  entityType: string,
  entityId: string,
  details: Record<string, any>
) => {
  const newLog: AuditLog = {
    id: `audit${auditLogs.length + 1}`,
    userId,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date(),
  };
  auditLogs.push(newLog);
  return newLog;
};

// Update addTransaction function to include audit logging
export const addTransaction = (transaction: Transaction) => {
  transactions.push(transaction);
  
  // Add audit log
  addAuditLog(
    transaction.createdBy,
    'create',
    'transaction',
    transaction.id,
    {
      action: `Created ${transaction.type} transaction`,
      amount: transaction.amount,
      from: getUserById(transaction.senderId)?.name,
      to: transaction.receiverId === 'EXPENSE' ? 'Expense' : getUserById(transaction.receiverId)?.name,
      category: transaction.expenseCategoryId ? 
        expenseCategories.find(c => c.id === transaction.expenseCategoryId)?.name : 
        undefined,
      hasInvoice: transaction.hasInvoice,
      paymentMethod: transaction.paymentMethod,
      bankAccount: transaction.bankAccountId ? 
        getBankAccountById(transaction.bankAccountId)?.bankName : 
        undefined,
      orderId: transaction.orderId,
    }
  );
  
  return transaction;
};