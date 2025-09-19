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

// SAT Mass Download (robust option)
export const satJobs = pgTable("sat_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfc: text("rfc").notNull(),
  type: text("type").notNull(), // issued | received
  dateStart: date("date_start").notNull(),
  dateEnd: date("date_end").notNull(),
  status: text("status").notNull().default("queued"), // queued|running|done|error
  requestedPackages: integer("requested_packages").default(0),
  availablePackages: integer("available_packages").default(0),
  downloadedPackages: integer("downloaded_packages").default(0),
  importedXml: integer("imported_xml").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`now()`),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
});

export const satPackages = pgTable("sat_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  satPackageId: text("sat_package_id").notNull(),
  status: text("status").notNull().default("pending"), // pending|available|downloading|downloaded|imported|error
  zipPath: text("zip_path"),
  downloadedAt: timestamp("downloaded_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const satFiles = pgTable("sat_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packageId: varchar("package_id").notNull(),
  uuid: text("uuid"),
  xmlPath: text("xml_path"),
  parsed: boolean("parsed").default(false),
  invoiceId: varchar("invoice_id"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const satLogs = pgTable("sat_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  level: text("level").notNull().default("info"), // info|warn|error
  message: text("message").notNull(),
  ts: timestamp("ts").default(sql`now()`),
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

// Nuevas tablas para funcionalidad fiscal tipo Heru
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  folio: text("folio").notNull().unique(),
  uuid: text("uuid").unique(), // UUID del CFDI
  series: text("series"),
  clientRfc: text("client_rfc").notNull(),
  clientName: text("client_name").notNull(),
  clientAddress: text("client_address"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  paymentMethod: text("payment_method").notNull(), // 01, 02, 03, etc.
  paymentForm: text("payment_form").notNull(), // PUE, PPD
  cfdiUse: text("cfdi_use").notNull(), // G01, G02, G03, etc.
  status: text("status").notNull().default("draft"), // draft, sent, paid, cancelled
  xmlPath: text("xml_path"), // ruta del XML generado
  pdfPath: text("pdf_path"), // ruta del PDF generado
  issueDate: timestamp("issue_date").notNull(),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  productCode: text("product_code").notNull(), // código SAT
  unitCode: text("unit_code").notNull(), // unidad SAT
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull().default("0.16"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const taxReports = pgTable("tax_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportType: text("report_type").notNull(), // monthly, annual, iva
  period: text("period").notNull(), // YYYY-MM o YYYY
  totalIncome: decimal("total_income", { precision: 12, scale: 2 }),
  totalExpenses: decimal("total_expenses", { precision: 12, scale: 2 }),
  deductibleExpenses: decimal("deductible_expenses", { precision: 12, scale: 2 }),
  taxableIncome: decimal("taxable_income", { precision: 12, scale: 2 }),
  taxOwed: decimal("tax_owed", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("draft"), // draft, submitted, approved
  filePath: text("file_path"), // ruta del reporte generado
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rfc: text("rfc").notNull().unique(),
  businessName: text("business_name").notNull(),
  commercialName: text("commercial_name"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  contactPerson: text("contact_person"),
  rfcStatus: text("rfc_status").default("pending"), // active, inactive, suspended, pending
  lastValidation: timestamp("last_validation"),
  isActive: boolean("is_active").default(true),
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

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

export const insertTaxReportSchema = createInsertSchema(taxReports).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
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

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export type InsertTaxReport = z.infer<typeof insertTaxReportSchema>;
export type TaxReport = typeof taxReports.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// SAT types
export const insertSatJobSchema = createInsertSchema(satJobs).omit({ id: true, createdAt: true, startedAt: true, finishedAt: true });
export type InsertSatJob = z.infer<typeof insertSatJobSchema>;
export type SatJob = typeof satJobs.$inferSelect;

export const insertSatPackageSchema = createInsertSchema(satPackages).omit({ id: true, createdAt: true, downloadedAt: true });
export type InsertSatPackage = z.infer<typeof insertSatPackageSchema>;
export type SatPackage = typeof satPackages.$inferSelect;

export const insertSatFileSchema = createInsertSchema(satFiles).omit({ id: true, createdAt: true });
export type InsertSatFile = z.infer<typeof insertSatFileSchema>;
export type SatFile = typeof satFiles.$inferSelect;

export const insertSatLogSchema = createInsertSchema(satLogs).omit({ id: true, ts: true });
export type InsertSatLog = z.infer<typeof insertSatLogSchema>;
export type SatLog = typeof satLogs.$inferSelect;
