import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { verifyPassword } from "../src/lib/auth";

(async () => {
  const url = process.env.DATABASE_URL!;
  const adapter = new PrismaPg({ connectionString: url });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({ where: { email: "admin@storydb.com" } });
  if (!user) {
    console.error("❌ admin@storydb.com not found in DB");
    process.exit(1);
  }
  console.log("User row:", { id: user.id, email: user.email, role: user.role, status: user.status, hasPassword: !!user.password });

  if (!user.password) {
    console.error("❌ User has no password set");
    process.exit(1);
  }

  const ok = await verifyPassword("admin123", user.password);
  console.log(ok ? "✅ Password 'admin123' matches the stored hash" : "❌ Password mismatch");

  const userCount = await prisma.user.count();
  console.log("Total users in DB:", userCount);

  await prisma.$disconnect();
})();
