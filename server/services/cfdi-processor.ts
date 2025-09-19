import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

export interface CFDIRecord {
  fecha: string;
  serie?: string;
  folio?: string;
  uuid?: string;
  rfcEmisor?: string;
  nombreEmisor?: string;
  rfcReceptor?: string;
  nombreReceptor?: string;
  subtotal: number;
  iva: number;
  total: number;
  moneda?: string;
  metodoPago?: string;
  formaPago?: string;
  usoCFDI?: string;
  xmlPath?: string;
}

export interface MonthlyTotals {
  mes: number;
  subtotal: number;
  iva: number;
  total: number;
}

export interface ISRCalculation {
  mes: number;
  ingresosGravadosPeriodo: number;
  ingresosAcumulados: number;
  deduccionesPeriodo: number;
  deduccionesAcumuladas: number;
  baseGravable: number;
  menosLimInferior: number;
  tasaAplicable: number;
  igualDif: number;
  impuestoMarginal: number;
  cuotaFija: number;
  isrEjercicio: number;
  isrAPagar: number;
}

export interface CedulaFiscal {
  ingresos: CFDIRecord[];
  gastos: CFDIRecord[];
  totalesMensuales: MonthlyTotals[];
  calculoISR: ISRCalculation[];
  resumenAnual: {
    totalIngresos: number;
    totalGastos: number;
    totalIVACausado: number;
    totalIVARetenido: number;
    isrAnual: number;
  };
}

export class CFDIProcessorService {
  private scriptsPath: string;

  constructor() {
    this.scriptsPath = path.join(process.cwd(), 'scripts');
  }

  /**
   * Procesa archivos CFDI desde un directorio ZIP o XML
   */
  async processCFDIFiles(
    xmlDirectory: string,
    userRfc?: string
  ): Promise<CedulaFiscal> {
    try {
      // Crear archivo temporal Excel para procesamiento
      const tempExcelPath = path.join(process.cwd(), 'uploads', `temp_cedula_${Date.now()}.xlsx`);
      
      // Ejecutar script de procesamiento CFDI
      await this.runPythonScript('cfdi_to_cedula.py', [
        '--xml-dir', xmlDirectory,
        '--excel', tempExcelPath,
        '--sheet', 'ingresos',
        ...(userRfc ? ['--rfc', userRfc] : [])
      ]);

      // Ejecutar script de cédula IVA
      await this.runPythonScript('cedula_iva.py', [
        '--excel', tempExcelPath
      ]);

      // Ejecutar script de tablas ISR
      await this.runPythonScript('crear_tablas_isr.py', [
        '--excel', tempExcelPath
      ]);

      // Leer el Excel procesado y convertir a formato JSON
      const cedulaData = await this.readExcelToCedula(tempExcelPath);

      // Limpiar archivo temporal
      if (fs.existsSync(tempExcelPath)) {
        fs.unlinkSync(tempExcelPath);
      }

      return cedulaData;
    } catch (error) {
      console.error('Error procesando archivos CFDI:', error);
      throw new Error(`Error procesando CFDI: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Genera papel de trabajo anual basado en los datos de cédula
   */
  async generatePapelTrabajo(
    cedulaData: CedulaFiscal,
    year: number = new Date().getFullYear()
  ): Promise<string> {
    try {
      const outputPath = path.join(process.cwd(), 'uploads', `papel_trabajo_${year}_${Date.now()}.xlsx`);
      
      // Crear archivo temporal con datos de cédula
      const tempCedulaPath = path.join(process.cwd(), 'uploads', `temp_cedula_${Date.now()}.xlsx`);
      await this.writeCedulaToExcel(cedulaData, tempCedulaPath);

      // Ejecutar script de papel de trabajo
      await this.runPythonScript('crear_papel_trabajo_anual.py', [
        '--excel', tempCedulaPath,
        '--output', outputPath,
        '--year', year.toString()
      ]);

      // Mejorar con información fiscal
      await this.runPythonScript('mejorar_papel_trabajo_fisco.py', [
        '--excel', outputPath
      ]);

      // Limpiar archivo temporal
      if (fs.existsSync(tempCedulaPath)) {
        fs.unlinkSync(tempCedulaPath);
      }

      return outputPath;
    } catch (error) {
      console.error('Error generando papel de trabajo:', error);
      throw new Error(`Error generando papel de trabajo: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Procesa retenciones de plataformas (Uber, Didi, etc.)
   */
  async processRetenciones(xmlDirectory: string): Promise<any> {
    try {
      const tempExcelPath = path.join(process.cwd(), 'uploads', `temp_retenciones_${Date.now()}.xlsx`);
      
      await this.runPythonScript('procesar_retenciones.py', [
        '--xml-dir', xmlDirectory,
        '--excel', tempExcelPath
      ]);

      const retencionesData = await this.readRetencionesFromExcel(tempExcelPath);

      if (fs.existsSync(tempExcelPath)) {
        fs.unlinkSync(tempExcelPath);
      }

      return retencionesData;
    } catch (error) {
      console.error('Error procesando retenciones:', error);
      throw new Error(`Error procesando retenciones: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ejecuta un script de Python con argumentos
   */
  private async runPythonScript(scriptName: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.scriptsPath, scriptName);
      
      if (!fs.existsSync(scriptPath)) {
        reject(new Error(`Script no encontrado: ${scriptPath}`));
        return;
      }

      // Usar el entorno virtual de Python
      const venvPython = path.join(process.cwd(), 'venv', 'bin', 'python');
      const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

      const python = spawn(pythonCmd, [scriptPath, ...args], {
        cwd: this.scriptsPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          console.log(`Script ${scriptName} ejecutado exitosamente`);
          resolve();
        } else {
          console.error(`Error ejecutando ${scriptName}:`, stderr);
          reject(new Error(`Script ${scriptName} falló con código ${code}: ${stderr}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Error ejecutando Python script: ${error.message}`));
      });
    });
  }

  /**
   * Lee datos de Excel y los convierte a formato CedulaFiscal
   */
  private async readExcelToCedula(excelPath: string): Promise<CedulaFiscal> {
    // Esta función necesitaría una implementación para leer Excel
    // Por ahora retornamos estructura básica
    return {
      ingresos: [],
      gastos: [],
      totalesMensuales: [],
      calculoISR: [],
      resumenAnual: {
        totalIngresos: 0,
        totalGastos: 0,
        totalIVACausado: 0,
        totalIVARetenido: 0,
        isrAnual: 0
      }
    };
  }

  /**
   * Escribe datos de cédula a Excel
   */
  private async writeCedulaToExcel(cedulaData: CedulaFiscal, excelPath: string): Promise<void> {
    // Implementación para escribir datos a Excel
    // Por ahora creamos archivo básico
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    
    // Hoja de ingresos
    const wsIngresos = XLSX.utils.json_to_sheet(cedulaData.ingresos);
    XLSX.utils.book_append_sheet(wb, wsIngresos, 'ingresos');
    
    // Hoja de gastos
    const wsGastos = XLSX.utils.json_to_sheet(cedulaData.gastos);
    XLSX.utils.book_append_sheet(wb, wsGastos, 'gastos');
    
    // Hoja de totales mensuales
    const wsTotales = XLSX.utils.json_to_sheet(cedulaData.totalesMensuales);
    XLSX.utils.book_append_sheet(wb, wsTotales, 'totales');
    
    XLSX.writeFile(wb, excelPath);
  }

  /**
   * Lee datos de retenciones desde Excel
   */
  private async readRetencionesFromExcel(excelPath: string): Promise<any> {
    const XLSX = require('xlsx');
    const wb = XLSX.readFile(excelPath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(ws);
  }

  /**
   * Valida estructura de archivos CFDI
   */
  async validateCFDIStructure(directory: string): Promise<{
    valid: boolean;
    xmlCount: number;
    zipCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let xmlCount = 0;
    let zipCount = 0;

    try {
      if (!fs.existsSync(directory)) {
        errors.push(`Directorio no existe: ${directory}`);
        return { valid: false, xmlCount: 0, zipCount: 0, errors };
      }

      const files = fs.readdirSync(directory, { recursive: true });
      
      for (const file of files) {
        const filePath = path.join(directory, file as string);
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.xml') {
          xmlCount++;
        } else if (ext === '.zip') {
          zipCount++;
        }
      }

      if (xmlCount === 0 && zipCount === 0) {
        errors.push('No se encontraron archivos XML o ZIP en el directorio');
      }

      return {
        valid: errors.length === 0,
        xmlCount,
        zipCount,
        errors
      };
    } catch (error) {
      errors.push(`Error validando directorio: ${error instanceof Error ? error.message : String(error)}`);
      return { valid: false, xmlCount: 0, zipCount: 0, errors };
    }
  }
}

export const cfdiProcessorService = new CFDIProcessorService();
