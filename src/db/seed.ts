import { db } from "./index";
import { users, rooms, beds, services } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding started...");

  // 1. Create Admin User
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    name: "System Admin",
    email: "admin@guesthouse.com",
    password: hashedPassword,
    role: "admin",
  }).onConflictDoNothing();

  // 2. Create Rooms & Beds
  const roomTypes = ["Single", "Double", "Ward"];
  for (let i = 1; i <= 5; i++) {
    const type = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const capacity = type === "Single" ? 1 : type === "Double" ? 2 : 4;
    
    const [room] = await db.insert(rooms).values({
      building: "Main Building",
      floor: (Math.floor(i / 3) + 1).toString(),
      roomNumber: `10${i}`,
      type,
      capacity,
      status: "available"
    }).returning();

    for (let j = 1; j <= capacity; j++) {
      await db.insert(beds).values({
        roomId: room.id,
        bedNumber: `${room.roomNumber}-${j}`,
        status: "available"
      });
    }
  }

  // 3. Create Services
  const defaultServices = [
    { name: "Meal - Breakfast", category: "Meals", unitCost: 15.00 },
    { name: "Meal - Lunch", category: "Meals", unitCost: 25.00 },
    { name: "Meal - Dinner", category: "Meals", unitCost: 20.00 },
    { name: "Hospital Transport", category: "Transportation", unitCost: 30.00 },
    { name: "Laundry Service", category: "Laundry", unitCost: 10.00 },
    { name: "Medical Kit", category: "Medical Supplies", unitCost: 50.00 },
  ];

  for (const svc of defaultServices) {
    await db.insert(services).values(svc).onConflictDoNothing();
  }

  console.log("Seeding completed!");
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
