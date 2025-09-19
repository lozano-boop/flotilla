import fs from 'fs/promises';
import path from 'path';

export interface Declaration {
  id: string;
  periodo: string;
  tipo: 'mensual' | 'bimestral' | 'anual';
  estado: 'ceros' | 'datos' | 'complementaria';
  fechaSubida: string;
  archivo: string;
  ingresosCfdi?: number;
  inconsistencia?: boolean;
  descripcionInconsistencia?: string;
}

export interface Inconsistency {
  periodo: string;
  descripcion: string;
  tipo: 'ingresos_sin_declarar' | 'declaracion_ceros_con_ingresos' | 'diferencia_montos';
  montoDeclarado?: number;
  montoCfdi?: number;
}

export class DeclarationsService {
  private declarationsPath = path.join(process.cwd(), 'data', 'declarations');
  private uploadsPath = path.join(process.cwd(), 'uploads', 'declarations');

  constructor() {
    this.ensureDirectories();
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.declarationsPath, { recursive: true });
      await fs.mkdir(this.uploadsPath, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async saveDeclaration(declaration: Omit<Declaration, 'id' | 'fechaSubida'>): Promise<Declaration> {
    const id = `decl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fechaSubida = new Date().toISOString().split('T')[0];
    
    const newDeclaration: Declaration = {
      ...declaration,
      id,
      fechaSubida
    };

    const filePath = path.join(this.declarationsPath, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(newDeclaration, null, 2));

    return newDeclaration;
  }

  async getDeclarations(): Promise<Declaration[]> {
    try {
      const files = await fs.readdir(this.declarationsPath);
      const declarations: Declaration[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.declarationsPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          declarations.push(JSON.parse(content));
        }
      }

      return declarations.sort((a, b) => b.periodo.localeCompare(a.periodo));
    } catch (error) {
      console.error('Error reading declarations:', error);
      return [];
    }
  }

  async detectInconsistencies(cfdiData: any[]): Promise<Inconsistency[]> {
    const declarations = await this.getDeclarations();
    const inconsistencies: Inconsistency[] = [];

    // Agrupar datos CFDI por periodo (año-mes)
    const cfdiByPeriod = this.groupCfdiByPeriod(cfdiData);

    for (const declaration of declarations) {
      const [year, month] = declaration.periodo.split('-');
      const periodKey = `${year}-${month.padStart(2, '0')}`;
      const cfdiForPeriod = cfdiByPeriod[periodKey];

      if (declaration.estado === 'ceros' && cfdiForPeriod && cfdiForPeriod.totalIngresos > 0) {
        inconsistencies.push({
          periodo: declaration.periodo,
          descripcion: `Declaración en ceros pero se detectaron ingresos de $${cfdiForPeriod.totalIngresos.toLocaleString()} en CFDI`,
          tipo: 'declaracion_ceros_con_ingresos',
          montoCfdi: cfdiForPeriod.totalIngresos
        });
      }

      if (declaration.estado === 'datos' && declaration.ingresosCfdi && cfdiForPeriod) {
        const diferencia = Math.abs(declaration.ingresosCfdi - cfdiForPeriod.totalIngresos);
        const porcentajeDiferencia = (diferencia / cfdiForPeriod.totalIngresos) * 100;

        if (porcentajeDiferencia > 5) { // Más del 5% de diferencia
          inconsistencies.push({
            periodo: declaration.periodo,
            descripcion: `Diferencia significativa: Declarado $${declaration.ingresosCfdi.toLocaleString()} vs CFDI $${cfdiForPeriod.totalIngresos.toLocaleString()}`,
            tipo: 'diferencia_montos',
            montoDeclarado: declaration.ingresosCfdi,
            montoCfdi: cfdiForPeriod.totalIngresos
          });
        }
      }
    }

    // Detectar periodos con ingresos CFDI pero sin declaración
    for (const [periodo, data] of Object.entries(cfdiByPeriod)) {
      const hasDeclaration = declarations.some(d => {
        const [year, month] = d.periodo.split('-');
        return `${year}-${month.padStart(2, '0')}` === periodo;
      });

      if (!hasDeclaration && data.totalIngresos > 0) {
        inconsistencies.push({
          periodo,
          descripcion: `Ingresos de $${data.totalIngresos.toLocaleString()} detectados en CFDI pero sin declaración registrada`,
          tipo: 'ingresos_sin_declarar',
          montoCfdi: data.totalIngresos
        });
      }
    }

    return inconsistencies;
  }

  private groupCfdiByPeriod(cfdiData: any[]): Record<string, { totalIngresos: number; count: number }> {
    const grouped: Record<string, { totalIngresos: number; count: number }> = {};

    for (const item of cfdiData) {
      if (item.direction === 'issued') { // Solo ingresos
        const date = new Date(item.date);
        const periodo = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!grouped[periodo]) {
          grouped[periodo] = { totalIngresos: 0, count: 0 };
        }
        
        grouped[periodo].totalIngresos += item.total || 0;
        grouped[periodo].count += 1;
      }
    }

    return grouped;
  }

  async updateDeclarationInconsistencies(cfdiData: any[]): Promise<void> {
    const declarations = await this.getDeclarations();
    const inconsistencies = await this.detectInconsistencies(cfdiData);

    for (const declaration of declarations) {
      const hasInconsistency = inconsistencies.some(inc => inc.periodo === declaration.periodo);
      const inconsistencyData = inconsistencies.find(inc => inc.periodo === declaration.periodo);

      declaration.inconsistencia = hasInconsistency;
      declaration.descripcionInconsistencia = inconsistencyData?.descripcion;

      const filePath = path.join(this.declarationsPath, `${declaration.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(declaration, null, 2));
    }
  }

  async saveDeclarationFile(file: Express.Multer.File, declarationId: string): Promise<string> {
    const fileName = `${declarationId}_${file.originalname}`;
    const filePath = path.join(this.uploadsPath, fileName);
    
    await fs.writeFile(filePath, file.buffer);
    return fileName;
  }

  async getDeclarationFile(fileName: string): Promise<Buffer> {
    const filePath = path.join(this.uploadsPath, fileName);
    return await fs.readFile(filePath);
  }
}
