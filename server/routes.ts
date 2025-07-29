import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  insertVehicleSchema,
  insertDriverSchema,
  insertMaintenanceRecordSchema,
  insertExpenseSchema,
  insertDriverDocumentSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      // Allow PDF files and common image formats
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF, JPG, PNG o WebP'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo" });
    }
    
    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size
    });
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });
  // Vehicles routes
  app.get("/api/vehicles", async (req, res) => {
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    const vehicle = await storage.getVehicle(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }
    res.json(vehicle);
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(validatedData);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const validatedData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(req.params.id, validatedData);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehículo no encontrado" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    const deleted = await storage.deleteVehicle(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Vehículo no encontrado" });
    }
    res.status(204).send();
  });

  // Drivers routes
  app.get("/api/drivers", async (req, res) => {
    const drivers = await storage.getDrivers();
    res.json(drivers);
  });

  app.get("/api/drivers/:id", async (req, res) => {
    const driver = await storage.getDriver(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    res.json(driver);
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validatedData);
      res.status(201).json(driver);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.partial().parse(req.body);
      const driver = await storage.updateDriver(req.params.id, validatedData);
      if (!driver) {
        return res.status(404).json({ message: "Conductor no encontrado" });
      }
      res.json(driver);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    const deleted = await storage.deleteDriver(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Conductor no encontrado" });
    }
    res.status(204).send();
  });

  // Maintenance records routes
  app.get("/api/maintenance", async (req, res) => {
    const { vehicleId } = req.query;
    if (vehicleId) {
      const records = await storage.getMaintenanceRecordsByVehicle(vehicleId as string);
      res.json(records);
    } else {
      const records = await storage.getMaintenanceRecords();
      res.json(records);
    }
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const validatedData = insertMaintenanceRecordSchema.parse(req.body);
      const record = await storage.createMaintenanceRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/maintenance/:id", async (req, res) => {
    try {
      const validatedData = insertMaintenanceRecordSchema.partial().parse(req.body);
      const record = await storage.updateMaintenanceRecord(req.params.id, validatedData);
      if (!record) {
        return res.status(404).json({ message: "Registro de mantenimiento no encontrado" });
      }
      res.json(record);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/maintenance/:id", async (req, res) => {
    const deleted = await storage.deleteMaintenanceRecord(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Registro de mantenimiento no encontrado" });
    }
    res.status(204).send();
  });

  // Expenses routes
  app.get("/api/expenses", async (req, res) => {
    const { vehicleId } = req.query;
    if (vehicleId) {
      const expenses = await storage.getExpensesByVehicle(vehicleId as string);
      res.json(expenses);
    } else {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, validatedData);
      if (!expense) {
        return res.status(404).json({ message: "Gasto no encontrado" });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    const deleted = await storage.deleteExpense(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Gasto no encontrado" });
    }
    res.status(204).send();
  });

  // Driver documents routes
  app.get("/api/driver-documents", async (req, res) => {
    const { driverId } = req.query;
    if (driverId) {
      const documents = await storage.getDriverDocumentsByDriver(driverId as string);
      res.json(documents);
    } else {
      const documents = await storage.getDriverDocuments();
      res.json(documents);
    }
  });

  app.post("/api/driver-documents", async (req, res) => {
    try {
      const validatedData = insertDriverDocumentSchema.parse(req.body);
      const document = await storage.createDriverDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.put("/api/driver-documents/:id", async (req, res) => {
    try {
      const validatedData = insertDriverDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDriverDocument(req.params.id, validatedData);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: "Datos inválidos", error });
    }
  });

  app.delete("/api/driver-documents/:id", async (req, res) => {
    const deleted = await storage.deleteDriverDocument(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }
    res.status(204).send();
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      const drivers = await storage.getDrivers();
      const expenses = await storage.getExpenses();
      const maintenanceRecords = await storage.getMaintenanceRecords();

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyExpenses = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((total, expense) => total + parseFloat(expense.amount || "0"), 0);

      const pendingMaintenance = maintenanceRecords.filter(record => 
        record.status === "pending" || record.status === "overdue"
      ).length;

      const overdueMaintenance = maintenanceRecords.filter(record => 
        record.status === "overdue"
      ).length;

      const activeVehicles = vehicles.filter(vehicle => vehicle.status === "active").length;
      const maintenanceVehicles = vehicles.filter(vehicle => vehicle.status === "maintenance").length;
      const outOfServiceVehicles = vehicles.filter(vehicle => vehicle.status === "out_of_service").length;
      const activeDrivers = drivers.filter(driver => driver.status === "active").length;

      const stats = {
        totalVehicles: vehicles.length,
        activeVehicles,
        maintenanceVehicles,
        outOfServiceVehicles,
        activeDrivers,
        monthlyExpenses,
        pendingMaintenance,
        overdueMaintenance,
        availability: vehicles.length > 0 ? (activeVehicles / vehicles.length) * 100 : 0
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
