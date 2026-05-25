import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "reception", "financial_manager", "room_supervisor", "medical", "data_entry"] }).default("data_entry").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()).notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()).notNull(),
});

export const patients = sqliteTable("patients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  nationalId: text("national_id").unique().notNull(),
  passportNumber: text("passport_number"),
  gender: text("gender").notNull(),
  dob: text("dob").notNull(), // ISO Date string
  mobile: text("mobile").notNull(),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  governorate: text("governorate").notNull(),
  address: text("address").notNull(),
  diagnosis: text("diagnosis"),
  specialty: text("specialty"),
  hospital: text("hospital"),
  doctor: text("doctor"),
  referralOrg: text("referral_org"),
  status: text("status").default("active"),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  documentsUrls: text("documents_urls"),
  caseStatus: text("case_status").default("stable"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()).notNull(),
}, (table) => ({
  fullNameIdx: index("full_name_idx").on(table.fullName),
  nationalIdIdx: index("national_id_idx").on(table.nationalId),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  mobileIdx: index("mobile_idx").on(table.mobile),
}));

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // medical_report, id_card, prescription, other
  url: text("url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()).notNull(),
}, (table) => ({
  patientDocIdx: index("patient_doc_idx").on(table.patientId),
}));

export const companions = sqliteTable("companions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  fullName: text("full_name").notNull(),
  nationalId: text("national_id").notNull(),
  relationship: text("relationship").notNull(),
  mobile: text("mobile"),
  isEmergencyContact: integer("is_emergency_contact", { mode: "boolean" }).default(false).notNull(),
  gender: text("gender").notNull(),
  age: integer("age"),
  asylumStatus: text("asylum_status"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()).notNull(),
}, (table) => ({
  patientCompIdx: index("patient_comp_idx").on(table.patientId),
  compNationalIdIdx: index("comp_national_id_idx").on(table.nationalId),
}));

export const rooms = sqliteTable("rooms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  building: text("building").notNull(),
  floor: text("floor").notNull(),
  roomNumber: text("room_number").notNull(),
  type: text("type").notNull(), // e.g. Single, Double, Ward
  capacity: integer("capacity").notNull(),
  status: text("status", { enum: ["available", "occupied", "maintenance", "reserved"] }).default("available").notNull(),
});

export const beds = sqliteTable("beds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  bedNumber: text("bed_number").notNull(),
  status: text("status").default("available").notNull(), // available, occupied, maintenance
});

export const stays = sqliteTable("stays", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  bedId: integer("bed_id").references(() => beds.id).notNull(),
  checkInDate: integer("check_in_date", { mode: "timestamp" }).default(new Date()).notNull(),
  expectedCheckOutDate: integer("expected_check_out_date", { mode: "timestamp" }),
  actualCheckOutDate: integer("actual_check_out_date", { mode: "timestamp" }),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).default("active").notNull(),
  letterDuration: integer("letter_duration"),
  letterUrl: text("letter_url"),
  parentStayId: integer("parent_stay_id"),
  notes: text("notes"),
  admissionNotes: text("admission_notes"),
  dischargeNotes: text("discharge_notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()).notNull(),
}, (table) => ({
  patientIdIdx: index("patient_id_idx").on(table.patientId),
}));

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // Meals, Transportation, Laundry, Medical, etc.
  unitCost: real("unit_cost").notNull(),
});

export const stayServices = sqliteTable("stay_services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stayId: integer("stay_id").references(() => stays.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  totalCost: real("total_cost").notNull(),
  serviceDate: integer("service_date", { mode: "timestamp" }).default(new Date()).notNull(),
  notes: text("notes"),
}, (table) => ({
  stayIdIdx: index("stay_id_idx").on(table.stayId),
}));

export const stayCompanions = sqliteTable("stay_companions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stayId: integer("stay_id").references(() => stays.id).notNull(),
  companionId: integer("companion_id").references(() => companions.id).notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stayId: integer("stay_id").references(() => stays.id).notNull(),
  totalAmount: real("total_amount").notNull(),
  discount: real("discount").default(0).notNull(),
  finalAmount: real("final_amount").notNull(),
  status: text("status", { enum: ["unpaid", "paid", "partial"] }).default("unpaid").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()).notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  targetTable: text("target_table"),
  targetId: integer("target_id"),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()).notNull(),
});

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  companions: many(companions),
  stays: many(stays),
  documents: many(documents),
}));

export const staysRelations = relations(stays, ({ one, many }) => ({
  patient: one(patients, { fields: [stays.patientId], references: [patients.id] }),
  room: one(rooms, { fields: [stays.roomId], references: [rooms.id] }),
  bed: one(beds, { fields: [stays.bedId], references: [beds.id] }),
  services: many(stayServices),
  companions: many(stayCompanions),
  invoice: one(invoices, { fields: [stays.id], references: [invoices.stayId] }),
}));

export const stayCompanionsRelations = relations(stayCompanions, ({ one }) => ({
  stay: one(stays, { fields: [stayCompanions.stayId], references: [stays.id] }),
  companion: one(companions, { fields: [stayCompanions.companionId], references: [companions.id] }),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  beds: many(beds),
  stays: many(stays),
}));

export const bedsRelations = relations(beds, ({ one }) => ({
  room: one(rooms, { fields: [beds.roomId], references: [rooms.id] }),
}));

export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // food, medical, cleaning, office, etc.
  unit: text("unit").notNull(), // pieces, kg, pack, etc.
  minQuantity: integer("min_quantity").default(0).notNull(),
  currentQuantity: integer("current_quantity").default(0).notNull(),
  pricePerUnit: real("price_per_unit").default(0).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(new Date()).notNull(),
});

export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id").references(() => inventoryItems.id).notNull(),
  type: text("type", { enum: ["in", "out"] }).notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"), // donation, purchase, withdrawal for patient, etc.
  performedBy: integer("performed_by").references(() => users.id).notNull(),
  transactionDate: integer("transaction_date", { mode: "timestamp" }).default(new Date()).notNull(),
});

export const assets = sqliteTable("assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // furniture, electronics, medical_equipment, etc.
  roomId: integer("room_id").references(() => rooms.id),
  purchaseDate: integer("purchase_date", { mode: "timestamp" }),
  purchaseCost: real("purchase_cost").default(0).notNull(),
  lifespanMonths: integer("lifespan_months").default(60).notNull(), // Default 5 years
  status: text("status", { enum: ["active", "maintenance", "broken", "disposed"] }).default("active").notNull(),
  serialNumber: text("serial_number"),
  description: text("description"),
});

export const maintenanceSchedules = sqliteTable("maintenance_schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  taskName: text("task_name").notNull(),
  frequencyDays: integer("frequency_days").notNull(),
  lastMaintenanceDate: integer("last_maintenance_date", { mode: "timestamp" }),
  nextMaintenanceDate: integer("next_maintenance_date", { mode: "timestamp" }).notNull(),
  assignedTo: text("assigned_to"), // can be a person name or external company
});

export const maintenanceLogs = sqliteTable("maintenance_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: integer("asset_id").references(() => assets.id).notNull(),
  scheduleId: integer("schedule_id").references(() => maintenanceSchedules.id),
  actionDate: integer("action_date", { mode: "timestamp" }).default(new Date()).notNull(),
  actionTaken: text("action_taken").notNull(),
  result: text("result").notNull(), // fixed, needs_replacement, pending, etc.
  cost: real("cost").default(0).notNull(),
  performedBy: text("performed_by").notNull(),
  notes: text("notes"),
});

export const assetRelations = relations(assets, ({ one, many }) => ({
  room: one(rooms, { fields: [assets.roomId], references: [rooms.id] }),
  maintenanceSchedules: many(maintenanceSchedules),
  maintenanceLogs: many(maintenanceLogs),
}));

export const inventoryItemRelations = relations(inventoryItems, ({ many }) => ({
  transactions: many(inventoryTransactions),
}));
