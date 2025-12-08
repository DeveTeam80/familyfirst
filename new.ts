import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

(async () => {
  try {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    console.log('🔐 Password:', password);
    console.log('🔑 Hash:', hash);
    console.log('');

    const user = await prisma.user.upsert({
      where: { email: 'admin@familyfirst.com' },
      update: {
        passwordHash: hash,
        name: 'Admin User'
      },
      create: {
        email: 'admin@familyfirst.com',
        name: 'Admin User',
        passwordHash: hash,
      },
    });

    console.log('✅ User updated:', user.email);
    console.log('   Use email:', user.email);
    console.log('   Use password:', password);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();