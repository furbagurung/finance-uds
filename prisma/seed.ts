import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminEmail = "connect@uniteddigitalservice.com";
  const adminPassword = "uds@123";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: "United Digital Admin",
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      name: "United Digital Admin",
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  const defaultCategories = [
    // Investment
    { name: "Founder Investment", type: "INVESTMENT" },
    { name: "Partner Investment", type: "INVESTMENT" },
    { name: "Business Loan", type: "INVESTMENT" },
    { name: "Emergency Fund Added", type: "INVESTMENT" },
    { name: "Other Investment", type: "INVESTMENT" },

    // Income
    { name: "Website Project", type: "INCOME" },
    { name: "SEO Retainer", type: "INCOME" },
    { name: "Social Media Management", type: "INCOME" },
    { name: "Branding Project", type: "INCOME" },
    { name: "Ad Management Fee", type: "INCOME" },
    { name: "Content Production Fee", type: "INCOME" },
    { name: "Design Service", type: "INCOME" },
    { name: "Development Service", type: "INCOME" },
    { name: "Consultation", type: "INCOME" },
    { name: "Other Income", type: "INCOME" },

    // Company Expenses
    { name: "Salary", type: "EXPENSE" },
    { name: "Rent", type: "EXPENSE" },
    { name: "Software", type: "EXPENSE" },
    { name: "Hosting", type: "EXPENSE" },
    { name: "Domain", type: "EXPENSE" },
    { name: "Internet", type: "EXPENSE" },
    { name: "Office Supplies", type: "EXPENSE" },
    { name: "Travel", type: "EXPENSE" },
    { name: "Food & Meeting", type: "EXPENSE" },
    { name: "Internal Marketing", type: "EXPENSE" },
    { name: "Legal & Accounting", type: "EXPENSE" },
    { name: "Equipment", type: "EXPENSE" },
    { name: "Miscellaneous", type: "EXPENSE" },

    // Client Expenses
    { name: "Meta Ads Spend", type: "EXPENSE" },
    { name: "Google Ads Spend", type: "EXPENSE" },
    { name: "TikTok Ads Spend", type: "EXPENSE" },
    { name: "Influencer Payment", type: "EXPENSE" },
    { name: "Content Production", type: "EXPENSE" },
    { name: "Printing", type: "EXPENSE" },
    { name: "Freelancer Payment", type: "EXPENSE" },
    { name: "Client Domain", type: "EXPENSE" },
    { name: "Client Hosting", type: "EXPENSE" },
    { name: "Stock Assets", type: "EXPENSE" },
    { name: "Third-party Tools", type: "EXPENSE" },
    { name: "Other Client Cost", type: "EXPENSE" },

    // Withdrawal
    { name: "Founder Withdrawal", type: "WITHDRAWAL" },
    { name: "Partner Withdrawal", type: "WITHDRAWAL" },
    { name: "Owner Drawings", type: "WITHDRAWAL" },
    { name: "Profit Withdrawal", type: "WITHDRAWAL" },
    { name: "Other Withdrawal", type: "WITHDRAWAL" },
  ] as const;
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {
        isDefault: true,
      },
      create: {
        name: category.name,
        type: category.type,
        isDefault: true,
      },
    });
  }

  console.log("Default categories ready.");
  console.log("Admin user ready:");
  console.log({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });