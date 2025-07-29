import { 
  type Vehicle, 
  type InsertVehicle,
  type Driver,
  type InsertDriver,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type Expense,
  type InsertExpense,
  type DriverDocument,
  type InsertDriverDocument
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private vehicles: Map<string, Vehicle> = new Map();
  private drivers: Map<string, Driver> = new Map();
  private maintenanceRecords: Map<string, MaintenanceRecord> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private driverDocuments: Map<string, DriverDocument> = new Map();

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
}

export const storage = new MemStorage();
