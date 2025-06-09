import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database setup...');
 
  await prisma.permission.deleteMany();

 
  console.log('📋 Creating permissions...');
  await Promise.all([
    prisma.permission.create({
      data: {
        name: 'View Bank Accounts',
        description: 'Can view bank account details',
        code: 'VIEW_BANK_ACCOUNTS',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Manage Bank Accounts',
        description: 'Can create and manage bank accounts',
        code: 'MANAGE_BANK_ACCOUNTS',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Create Transactions',
        description: 'Can create new transactions',
        code: 'CREATE_TRANSACTIONS',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Approve Transactions',
        description: 'Can approve transactions',
        code: 'APPROVE_TRANSACTIONS',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'View Audit Logs',
        description: 'Can view audit logs',
        code: 'VIEW_AUDIT_LOGS',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Manage Employees',
        description: 'Can create and manage employees',
        code: 'MANAGE_EMPLOYEES',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Load Money',
        description: 'Can load money to employee accounts',
        code: 'LOAD_MONEY',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Use Bank Accounts',
        description: 'Can use bank accounts for transactions',
        code: 'USE_BANK_ACCOUNTS',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Use Cash',
        description: 'Can use cash for transactions',
        code: 'USE_CASH',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Manage Orders',
        description: 'Can create and manage orders',
        code: 'MANAGE_ORDERS',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'Manage Expense Categories',
        description: 'Can create and manage expense categories',
        code: 'MANAGE_EXPENSE_CATEGORIES',
      },
    }),
  ]);


  console.log('✅ Database setup completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Create your first admin user through the application');
  console.log('2. Add bank accounts through the settings');
  console.log('3. Start creating transactions and orders');
}

main()
  .catch((e) => {
    console.error('❌ Error during setup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
