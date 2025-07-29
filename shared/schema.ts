import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, date, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plate: text("plate").notNull().unique(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  type: text("type").notNull(), // sedan, pickup, van, truck
  status: text("status").notNull().default("active"), // active, maintenance, out_of_service
  driverId: varchar("driver_id"),
  insurancePdf: text("insurance_pdf"), // path to insurance PDF file
  insuranceExpiry: date("insurance_expiry"), // insurance expiry date
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  licenseExpiry: date("license_expiry"),
  status: text("status").notNull().default("active"), // active, inactive
  licensePdf: text("license_pdf"), // path to license PDF/photo
  addressProofPdf: text("address_proof_pdf"), // path to address proof PDF/photo
  inePdf: text("ine_pdf"), // path to INE PDF/photo
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull(),
  type: text("type").notNull(), // oil_change, general_inspection, alignment, etc.
  description: text("description"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  performedAt: date("performed_at").notNull(),
  nextDue: date("next_due"),
  status: text("status").notNull().default("completed"), // completed, pending, overdue
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id"),
  category: text("category").notNull(), // fuel, maintenance, insurance, etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  receipt: text("receipt"), // file path or URL
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const driverDocuments = pgTable("driver_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull(),
  type: text("type").notNull(), // license, medical_certificate, insurance, etc.
  documentNumber: text("document_number"),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  status: text("status").notNull().default("valid"), // valid, expired, expiring_soon
  filePath: text("file_path"), // document file location
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertDriverDocumentSchema = createInsertSchema(driverDocuments).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertDriverDocument = z.infer<typeof insertDriverDocumentSchema>;
export type DriverDocument = typeof driverDocuments.$inferSelect;
