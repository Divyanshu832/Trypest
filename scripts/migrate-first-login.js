// Migration script to set existing users' isFirstLogin to false
// Run this once after deploying the first login feature

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateFirstLoginFlag() {
  console.log('🔄 Starting first login flag migration...');
  
  try {
    // Find all existing users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isFirstLogin: true,
      }
    });

    console.log(`📊 Found ${users.length} users to update`);

    // Update all existing users to set isFirstLogin to false
    // since they are already using the system
    const updateResult = await prisma.user.updateMany({
      where: {
        // Update all users
      },
      data: {
        isFirstLogin: false,
      },
    });

    console.log(`✅ Updated ${updateResult.count} users`);
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Important notes:');
    console.log('- All existing users now have isFirstLogin set to false');
    console.log('- New users will have isFirstLogin set to true by default');
    console.log('- Users will be forced to change password on first login');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateFirstLoginFlag()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
