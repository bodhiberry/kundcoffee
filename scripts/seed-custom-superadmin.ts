import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "support@cpn.com.np";
  const password = "Coffee@2025";
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.platformUser.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      name: "Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`--- Platform Super Admin Updated/Created Successfully ---`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: SUPER_ADMIN`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
