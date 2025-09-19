import { 
  vehicles,
  drivers, 
  maintenanceRecords,
  expenses,
  driverDocuments,
  invoices,
  invoiceItems,
  taxReports,
  suppliers,
  satJobs,
  satPackages,
  satFiles,
  satLogs,
  type Vehicle, 
  type InsertVehicle,
  type Driver,
  type InsertDriver,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type Expense,
  type InsertExpense,
  type DriverDocument,
  type InsertDriverDocument,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type TaxReport,
  type InsertTaxReport,
  type Supplier,
  type InsertSupplier,
  type SatJob,
  type InsertSatJob,
  type SatPackage,
  type InsertSatPackage,
  type SatFile,
  type InsertSatFile,
  type SatLog,
  type InsertSatLog
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";
import { eq } from "drizzle-orm";

// Compact update types for SAT persistence to avoid overly verbose inline generics
type SatJobUpdate = Partial<InsertSatJob> & {
  status?: string;
  requestedPackages?: number;
  availablePackages?: number;
  downloadedPackages?: number;
  importedXml?: number;
  errorMessage?: string;
  startedAt?: Date;
  finishedAt?: Date;
};

type SatPackageUpdate = Partial<InsertSatPackage> & {
  status?: string;
  zipPath?: string;
  downloadedAt?: Date;
  errorMessage?: string;
};

type SatFileUpdate = Partial<InsertSatFile> & {
  parsed?: boolean;
  invoiceId?: string | null;
  errorMessage?: string;
};

// Initialize database connection if available
const localConn = process.env.DATABASE_URL; // e.g. postgres://flotilla:flotilla@localhost:5432/flotilla
const neonConn = process.env.NEON_DATABASE_URL;

// Drizzle DB instance (either Neon or node-postgres)
const db = (() => {
  if (localConn) {
    const pool = new PgPool({ connectionString: localConn, max: 10 });
    return drizzlePg(pool);
  }
  if (neonConn) {
    const sql = neon(neonConn);
    return drizzleNeon(sql);
  }
  return undefined as unknown as ReturnType<typeof drizzlePg>;
})();

export interface IStorage {
  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;

  // Drivers
  getDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<boolean>;

  // Maintenance Records
  getMaintenanceRecords(): Promise<MaintenanceRecord[]>;
  getMaintenanceRecordsByVehicle(vehicleId: string): Promise<MaintenanceRecord[]>;
  getMaintenanceRecord(id: string): Promise<MaintenanceRecord | undefined>;
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: string, record: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined>;
  deleteMaintenanceRecord(id: string): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getExpensesByVehicle(vehicleId: string): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  // Driver Documents
  getDriverDocuments(): Promise<DriverDocument[]>;
  getDriverDocumentsByDriver(driverId: string): Promise<DriverDocument[]>;
  getDriverDocument(id: string): Promise<DriverDocument | undefined>;
  createDriverDocument(document: InsertDriverDocument): Promise<DriverDocument>;
  updateDriverDocument(id: string, document: Partial<InsertDriverDocument>): Promise<DriverDocument | undefined>;
  deleteDriverDocument(id: string): Promise<boolean>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;

  // Tax Reports
  getTaxReports(): Promise<TaxReport[]>;
  getTaxReport(id: string): Promise<TaxReport | undefined>;
  createTaxReport(report: InsertTaxReport): Promise<TaxReport>;
  updateTaxReport(id: string, report: Partial<InsertTaxReport>): Promise<TaxReport | undefined>;
  deleteTaxReport(id: string): Promise<boolean>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;

  // SAT Mass Download (robust persistence)
  createSatJob(job: InsertSatJob): Promise<SatJob>;
  updateSatJob(id: string, update: SatJobUpdate): Promise<SatJob | undefined>;
  getSatJob(id: string): Promise<SatJob | undefined>;
  listSatJobs(): Promise<SatJob[]>;

  createSatPackage(p: InsertSatPackage): Promise<SatPackage>;
  updateSatPackage(id: string, update: SatPackageUpdate): Promise<SatPackage | undefined>;
  listSatPackagesByJob(jobId: string): Promise<SatPackage[]>;

  createSatFile(f: InsertSatFile): Promise<SatFile>;
  updateSatFile(id: string, update: SatFileUpdate): Promise<SatFile | undefined>;

  addSatLog(l: InsertSatLog): Promise<SatLog>;
  listSatLogs(jobId: string, limit?: number): Promise<SatLog[]>;
}

export class PostgresStorage implements IStorage {
  public pool: any;

  constructor() {
    if (localConn) {
      this.pool = new PgPool({ connectionString: localConn, max: 10 });
    }
  }
  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const result = await db.insert(vehicles).values(insertVehicle).returning();
    return result[0];
  }

  async updateVehicle(id: string, updateData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles).set(updateData).where(eq(vehicles.id, id)).returning();
    return result[0];
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return result.length > 0;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const result = await db.select().from(drivers).where(eq(drivers.id, id));
    return result[0];
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const result = await db.insert(drivers).values(insertDriver).returning();
    return result[0];
  }

  async updateDriver(id: string, updateData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const result = await db.update(drivers).set(updateData).where(eq(drivers.id, id)).returning();
    return result[0];
  }

  async deleteDriver(id: string): Promise<boolean> {
    const result = await db.delete(drivers).where(eq(drivers.id, id)).returning();
    return result.length > 0;
  }

  // Maintenance Records
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return await db.select().from(maintenanceRecords);
  }

  async getMaintenanceRecordsByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.vehicleId, vehicleId));
  }

  async getMaintenanceRecord(id: string): Promise<MaintenanceRecord | undefined> {
    const result = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id));
    return result[0];
  }

  async createMaintenanceRecord(insertRecord: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const result = await db.insert(maintenanceRecords).values(insertRecord).returning();
    return result[0];
  }

  async updateMaintenanceRecord(id: string, updateData: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined> {
    const result = await db.update(maintenanceRecords).set(updateData).where(eq(maintenanceRecords.id, id)).returning();
    return result[0];
  }

  async deleteMaintenanceRecord(id: string): Promise<boolean> {
    const result = await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, id)).returning();
    return result.length > 0;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses);
  }

  async getExpensesByVehicle(vehicleId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.vehicleId, vehicleId));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const result = await db.insert(expenses).values(insertExpense).returning();
    return result[0];
  }

  async updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
    const result = await db.update(expenses).set(updateData).where(eq(expenses.id, id)).returning();
    return result[0];
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Driver Documents
  async getDriverDocuments(): Promise<DriverDocument[]> {
    return await db.select().from(driverDocuments);
  }

  async getDriverDocumentsByDriver(driverId: string): Promise<DriverDocument[]> {
    return await db.select().from(driverDocuments).where(eq(driverDocuments.driverId, driverId));
  }

  async getDriverDocument(id: string): Promise<DriverDocument | undefined> {
    const result = await db.select().from(driverDocuments).where(eq(driverDocuments.id, id));
    return result[0];
  }

  async createDriverDocument(insertDocument: InsertDriverDocument): Promise<DriverDocument> {
    const result = await db.insert(driverDocuments).values(insertDocument).returning();
    return result[0];
  }

  async updateDriverDocument(id: string, updateData: Partial<InsertDriverDocument>): Promise<DriverDocument | undefined> {
    const result = await db.update(driverDocuments).set(updateData).where(eq(driverDocuments.id, id)).returning();
    return result[0];
  }

  async deleteDriverDocument(id: string): Promise<boolean> {
    const result = await db.delete(driverDocuments).where(eq(driverDocuments.id, id)).returning();
    return result.length > 0;
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoice(insertInvoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Transacción para asegurar atomicidad entre factura e ítems
    const created = await db.transaction(async (tx) => {
      const res = await tx.insert(invoices).values(insertInvoice).returning();
      const inv = res[0];
      if (items && items.length > 0) {
        const itemsWithInvoiceId = items.map(item => ({ ...item, invoiceId: inv.id }));
        await tx.insert(invoiceItems).values(itemsWithInvoiceId);
      }
      return inv;
    });
    return created;
  }

  async updateInvoice(id: string, updateData: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices).set(updateData).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const deleted = await db.transaction(async (tx) => {
      // Borrar ítems primero
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      const res = await tx.delete(invoices).where(eq(invoices.id, id)).returning();
      return res.length > 0;
    });
    return deleted;
  }

  // Tax Reports
  async getTaxReports(): Promise<TaxReport[]> {
    return await db.select().from(taxReports);
  }

  async getTaxReport(id: string): Promise<TaxReport | undefined> {
    const result = await db.select().from(taxReports).where(eq(taxReports.id, id));
    return result[0];
  }

  async createTaxReport(insertReport: InsertTaxReport): Promise<TaxReport> {
    const result = await db.insert(taxReports).values(insertReport).returning();
    return result[0];
  }

  async updateTaxReport(id: string, updateData: Partial<InsertTaxReport>): Promise<TaxReport | undefined> {
    const result = await db.update(taxReports).set(updateData).where(eq(taxReports.id, id)).returning();
    return result[0];
  }

  async deleteTaxReport(id: string): Promise<boolean> {
    const result = await db.delete(taxReports).where(eq(taxReports.id, id)).returning();
    return result.length > 0;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result[0];
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(insertSupplier).returning();
    return result[0];
  }

  async updateSupplier(id: string, updateData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const result = await db.update(suppliers).set(updateData).where(eq(suppliers.id, id)).returning();
    return result[0];
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    return result.length > 0;
  }

  // SAT Mass Download
  async createSatJob(job: InsertSatJob): Promise<SatJob> {
    const res = await db.insert(satJobs).values(job as any).returning();
    return res[0];
  }
  async updateSatJob(id: string, update: SatJobUpdate): Promise<SatJob | undefined> {
    const res = await db.update(satJobs).set(update as any).where(eq(satJobs.id, id)).returning();
    return res[0];
  }
  async getSatJob(id: string): Promise<SatJob | undefined> {
    const res = await db.select().from(satJobs).where(eq(satJobs.id, id));
    return res[0];
  }
  async listSatJobs(): Promise<SatJob[]> {
    return await db.select().from(satJobs);
  }
  async createSatPackage(p: InsertSatPackage): Promise<SatPackage> {
    const res = await db.insert(satPackages).values(p as any).returning();
    return res[0];
  }
  async updateSatPackage(id: string, update: SatPackageUpdate): Promise<SatPackage | undefined> {
    const res = await db.update(satPackages).set(update as any).where(eq(satPackages.id, id)).returning();
    return res[0];
  }
  async listSatPackagesByJob(jobId: string): Promise<SatPackage[]> {
    return await db.select().from(satPackages).where(eq(satPackages.jobId, jobId));
  }
  async createSatFile(f: InsertSatFile): Promise<SatFile> {
    const res = await db.insert(satFiles).values(f as any).returning();
    return res[0];
  }
  async updateSatFile(id: string, update: SatFileUpdate): Promise<SatFile | undefined> {
    const res = await db.update(satFiles).set(update as any).where(eq(satFiles.id, id)).returning();
    return res[0];
  }
  async addSatLog(l: InsertSatLog): Promise<SatLog> {
    const res = await db.insert(satLogs).values(l as any).returning();
    return res[0];
  }
  async listSatLogs(jobId: string, limit = 200): Promise<SatLog[]> {
    // drizzle doesn't have orderBy here inline; keeping simple select (note: could add custom SQL for order/limit)
    const rows = await db.select().from(satLogs);
    return rows.filter(r => (r as any).jobId === jobId).slice(-limit);
  }
}

export class MemStorage implements IStorage {
  private vehicles: Map<string, Vehicle> = new Map();
  private drivers: Map<string, Driver> = new Map();
  private maintenanceRecords: Map<string, MaintenanceRecord> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private driverDocuments: Map<string, DriverDocument> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private taxReports: Map<string, TaxReport> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private invoiceItemsStore: Map<string, InvoiceItem[]> = new Map(); // key: invoiceId
  // SAT in-memory stores
  private satJobsStore: Map<string, SatJob> = new Map();
  private satPackagesStore: Map<string, SatPackage[]> = new Map(); // key jobId
  private satFilesStore: Map<string, SatFile[]> = new Map(); // key packageId
  private satLogsStore: Map<string, SatLog[]> = new Map(); // key jobId

  constructor() {
    // Initialize with empty maps
  }

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id, 
      status: insertVehicle.status || "active",
      driverId: insertVehicle.driverId || null,
      insurancePdf: insertVehicle.insurancePdf || null,
      insuranceExpiry: insertVehicle.insuranceExpiry || null,
      createdAt: new Date() 
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: string, update: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existing = this.vehicles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = randomUUID();
    const driver: Driver = {
      ...insertDriver,
      id,
      status: insertDriver.status || "active",
      phone: insertDriver.phone || null,
      email: insertDriver.email || null,
      address: insertDriver.address || null,
      licenseExpiry: insertDriver.licenseExpiry || null,
      licensePdf: insertDriver.licensePdf ?? null,
      addressProofPdf: insertDriver.addressProofPdf ?? null,
      inePdf: insertDriver.inePdf ?? null,
      createdAt: new Date()
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: string, update: Partial<InsertDriver>): Promise<Driver | undefined> {
    const existing = this.drivers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.drivers.set(id, updated);
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    return this.drivers.delete(id);
  }

  // Maintenance Records
  async getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return Array.from(this.maintenanceRecords.values());
  }

  async getMaintenanceRecordsByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return Array.from(this.maintenanceRecords.values())
      .filter(record => record.vehicleId === vehicleId);
  }

  async getMaintenanceRecord(id: string): Promise<MaintenanceRecord | undefined> {
    return this.maintenanceRecords.get(id);
  }

  async createMaintenanceRecord(insertRecord: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const id = randomUUID();
    const record: MaintenanceRecord = { 
      ...insertRecord, 
      id, 
      status: insertRecord.status || "completed",
      description: insertRecord.description || null,
      cost: insertRecord.cost || null,
      nextDue: insertRecord.nextDue || null,
      createdAt: new Date() 
    };
    this.maintenanceRecords.set(id, record);
    return record;
  }

  async updateMaintenanceRecord(id: string, update: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined> {
    const existing = this.maintenanceRecords.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.maintenanceRecords.set(id, updated);
    return updated;
  }

  async deleteMaintenanceRecord(id: string): Promise<boolean> {
    return this.maintenanceRecords.delete(id);
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpensesByVehicle(vehicleId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.vehicleId === vehicleId);
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = { 
      ...insertExpense, 
      id, 
      vehicleId: insertExpense.vehicleId || null,
      receipt: insertExpense.receipt || null,
      createdAt: new Date() 
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, update: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existing = this.expenses.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.expenses.set(id, updated);
    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Driver Documents
  async getDriverDocuments(): Promise<DriverDocument[]> {
    return Array.from(this.driverDocuments.values());
  }

  async getDriverDocumentsByDriver(driverId: string): Promise<DriverDocument[]> {
    return Array.from(this.driverDocuments.values())
      .filter(doc => doc.driverId === driverId);
  }

  async getDriverDocument(id: string): Promise<DriverDocument | undefined> {
    return this.driverDocuments.get(id);
  }

  async createDriverDocument(insertDocument: InsertDriverDocument): Promise<DriverDocument> {
    const id = randomUUID();
    const document: DriverDocument = { 
      ...insertDocument, 
      id, 
      status: insertDocument.status || "valid",
      documentNumber: insertDocument.documentNumber || null,
      issueDate: insertDocument.issueDate || null,
      expiryDate: insertDocument.expiryDate || null,
      filePath: insertDocument.filePath || null,
      createdAt: new Date() 
    };
    this.driverDocuments.set(id, document);
    return document;
  }

  async updateDriverDocument(id: string, update: Partial<InsertDriverDocument>): Promise<DriverDocument | undefined> {
    const existing = this.driverDocuments.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.driverDocuments.set(id, updated);
    return updated;
  }

  async deleteDriverDocument(id: string): Promise<boolean> {
    return this.driverDocuments.delete(id);
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return this.invoiceItemsStore.get(invoiceId) || [];
  }

  async createInvoice(insertInvoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      ...insertInvoice,
      id,
      status: insertInvoice.status || "draft",
      currency: insertInvoice.currency || "MXN",
      uuid: insertInvoice.uuid || null,
      series: insertInvoice.series || null,
      clientAddress: insertInvoice.clientAddress || null,
      xmlPath: insertInvoice.xmlPath || null,
      pdfPath: insertInvoice.pdfPath || null,
      dueDate: insertInvoice.dueDate || null,
      createdAt: new Date()
    };
    this.invoices.set(id, invoice);
    // Persistir items en memoria
    if (items && items.length > 0) {
      const normalized: InvoiceItem[] = items.map((it) => ({
        ...it,
        id: (it as any).id ?? randomUUID(),
        invoiceId: id,
        taxRate: (it as any).taxRate ?? "0",
        createdAt: new Date()
      }));
      this.invoiceItemsStore.set(id, normalized);
    } else {
      this.invoiceItemsStore.set(id, []);
    }
    return invoice;
  }

  async updateInvoice(id: string, update: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existing = this.invoices.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.invoices.set(id, updated);
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const invDeleted = this.invoices.delete(id);
    this.invoiceItemsStore.delete(id);
    return invDeleted;
  }

  // Tax Reports
  async getTaxReports(): Promise<TaxReport[]> {
    return Array.from(this.taxReports.values());
  }

  async getTaxReport(id: string): Promise<TaxReport | undefined> {
    return this.taxReports.get(id);
  }

  async createTaxReport(insertReport: InsertTaxReport): Promise<TaxReport> {
    const id = randomUUID();
    const report: TaxReport = {
      ...insertReport,
      id,
      status: insertReport.status || "draft",
      totalIncome: insertReport.totalIncome || null,
      totalExpenses: insertReport.totalExpenses || null,
      deductibleExpenses: insertReport.deductibleExpenses || null,
      taxableIncome: insertReport.taxableIncome || null,
      taxOwed: insertReport.taxOwed || null,
      filePath: insertReport.filePath || null,
      createdAt: new Date()
    };
    this.taxReports.set(id, report);
    return report;
  }

  async updateTaxReport(id: string, update: Partial<InsertTaxReport>): Promise<TaxReport | undefined> {
    const existing = this.taxReports.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.taxReports.set(id, updated);
    return updated;
  }

  async deleteTaxReport(id: string): Promise<boolean> {
    return this.taxReports.delete(id);
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const supplier: Supplier = {
      ...insertSupplier,
      id,
      commercialName: insertSupplier.commercialName || null,
      address: insertSupplier.address || null,
      phone: insertSupplier.phone || null,
      email: insertSupplier.email || null,
      contactPerson: insertSupplier.contactPerson || null,
      rfcStatus: insertSupplier.rfcStatus || "pending",
      lastValidation: insertSupplier.lastValidation || null,
      isActive: insertSupplier.isActive ?? true,
      createdAt: new Date()
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: string, update: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existing = this.suppliers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...update };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // SAT Mass Download (Mem)
  async createSatJob(job: InsertSatJob): Promise<SatJob> {
    const id = randomUUID();
    const satJob: SatJob = {
      ...(job as any),
      id,
      status: (job as any).status || 'queued',
      requestedPackages: (job as any).requestedPackages ?? 0,
      availablePackages: (job as any).availablePackages ?? 0,
      downloadedPackages: (job as any).downloadedPackages ?? 0,
      importedXml: (job as any).importedXml ?? 0,
      createdAt: new Date(),
      startedAt: null as any,
      finishedAt: null as any,
    };
    this.satJobsStore.set(id, satJob);
    return satJob;
  }
  async updateSatJob(id: string, update: SatJobUpdate): Promise<SatJob | undefined> {
    const existing = this.satJobsStore.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...update } as SatJob;
    this.satJobsStore.set(id, updated);
    return updated;
  }
  async getSatJob(id: string): Promise<SatJob | undefined> {
    return this.satJobsStore.get(id);
  }
  async listSatJobs(): Promise<SatJob[]> {
    return Array.from(this.satJobsStore.values());
  }
  async createSatPackage(p: InsertSatPackage): Promise<SatPackage> {
    const id = randomUUID();
    const pkg: SatPackage = { ...(p as any), id, createdAt: new Date() } as any;
    const arr = this.satPackagesStore.get(p.jobId as any) || [];
    arr.push(pkg);
    this.satPackagesStore.set(p.jobId as any, arr);
    return pkg;
  }
  async updateSatPackage(id: string, update: SatPackageUpdate): Promise<SatPackage | undefined> {
    let result: SatPackage | undefined;
    this.satPackagesStore.forEach((list, jobId) => {
      if (result) return;
      const idx = list.findIndex(p => (p as any).id === id);
      if (idx >= 0) {
        const updated = { ...list[idx], ...update } as SatPackage;
        list[idx] = updated;
        this.satPackagesStore.set(jobId, list);
        result = updated;
      }
    });
    return result;
  }
  async listSatPackagesByJob(jobId: string): Promise<SatPackage[]> {
    return this.satPackagesStore.get(jobId) || [];
    }
  async createSatFile(f: InsertSatFile): Promise<SatFile> {
    const id = randomUUID();
    const file: SatFile = { ...(f as any), id, createdAt: new Date() } as any;
    const arr = this.satFilesStore.get(f.packageId as any) || [];
    arr.push(file);
    this.satFilesStore.set(f.packageId as any, arr);
    return file;
  }
  async updateSatFile(id: string, update: SatFileUpdate): Promise<SatFile | undefined> {
    let result: SatFile | undefined;
    this.satFilesStore.forEach((list, pkgId) => {
      if (result) return;
      const idx = list.findIndex(f => (f as any).id === id);
      if (idx >= 0) {
        const updated = { ...list[idx], ...update } as SatFile;
        list[idx] = updated;
        this.satFilesStore.set(pkgId, list);
        result = updated;
      }
    });
    return result;
  }
  async addSatLog(l: InsertSatLog): Promise<SatLog> {
    const id = randomUUID();
    const log: SatLog = { ...(l as any), id, ts: new Date() } as any;
    const arr = this.satLogsStore.get((l as any).jobId) || [];
    arr.push(log);
    this.satLogsStore.set((l as any).jobId, arr);
    return log;
  }
  async listSatLogs(jobId: string, limit = 200): Promise<SatLog[]> {
    const arr = this.satLogsStore.get(jobId) || [];
    return arr.slice(-limit);
  }
}
const useDb = Boolean(localConn || neonConn);
export const storage = useDb ? new PostgresStorage() : new MemStorage();
