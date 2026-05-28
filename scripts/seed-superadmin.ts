import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "support@cpn.com.np";
  const password = "Coffee@2025";
  const hashedPassword = await bcrypt.hash(password, 10);

  // Delete any existing platform user with this email (in case of partial record)
  await prisma.platformUser.deleteMany({
    where: { email },
  });

  await prisma.platformUser.create({
    data: {
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`\n✅ Platform Super Admin Seeded Successfully`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     SUPER_ADMIN\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
