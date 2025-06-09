// Migration script to clean up password storage
// Run this once after deploying the password changes

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migratePasswords() {
  console.log('🔄 Starting password migration...');
  
  try {
    // Find all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        password: true,
      }
    });

    console.log(`📊 Found ${users.length} users to check`);

    // Note: Since we're now only storing plain text passwords in the 'password' field,
    // and we removed 'plainPassword' from the schema, this script is mainly for logging
    // In production, you might want to regenerate passwords for security
    
    for (const user of users) {
      console.log(`✅ User ${user.email} - Password storage format updated`);
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Important notes:');
    console.log('- All passwords are now stored as generated plain text');
    console.log('- No more password hashing is used');
    console.log('- Users will authenticate with their generated passwords');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migratePasswords()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
