import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Basic permissions for employees
  const permissions = [
    {
      code: 'USE_CASH',
      name: 'Use Cash',
      description: 'Permission to use cash transactions',
    },
    {
      code: 'USE_BANK_ACCOUNTS',
      name: 'Use Bank Accounts',
      description: 'Permission to use bank account transactions',
    },
    {
      code: 'MANAGE_ORDERS',
      name: 'Manage Orders',
      description: 'Permission to create and manage orders',
    },
    {
      code: 'MANAGE_EXPENSES',
      name: 'Manage Expenses',
      description: 'Permission to manage expense categories and create expenses',
    },
  ];

  console.log('Seeding permissions...');
  
  // Create each permission if it doesn't exist
  for (const permission of permissions) {
    const existing = await prisma.permission.findUnique({
      where: { code: permission.code },
    });

    if (!existing) {
      await prisma.permission.create({
        data: permission,
      });
      console.log(`Created permission: ${permission.name}`);
    } else {
      console.log(`Permission already exists: ${permission.name}`);
    }
  }

  console.log('Permissions seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
