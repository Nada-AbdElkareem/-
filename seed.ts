import { sqlite, db } from "./src/db/index";
import { users, appSettings } from "./src/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");
  
  // Check if admin exists
  const existingAdmin = await db.select().from(users).limit(1);
  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      name: "مدير النظام",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });
    console.log("Admin user created: admin@example.com / admin123");
  }

  // Default settings
  const settings = [
    { key: "hospital_name", value: "مستشفى الخير التخصصي" },
    { key: "service_categories", value: "Meals, Transportation, Laundry, Medical" },
    { key: "governorates", value: "القاهرة, الجيزة, الإسكندرية, مطروح, أسوان" },
    { key: "referral_entities", value: "المنظمة الدولية للهجرة, مفوضية اللاجئين, أطباء بلا حدود" },
    { key: "relationships", value: "درجة أولى, درجة ثانية, صديق, ممرض, أخرى" },
    { key: "asset_categories", value: "أثاث, كهربائيات, تجهيزات طبية, تكييفات, أخرى" },
    { key: "asset_statuses", value: "working, maintenance, broken, decommissioned" }
  ];

  for (const s of settings) {
    await db.insert(appSettings).values(s).onConflictDoNothing();
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
