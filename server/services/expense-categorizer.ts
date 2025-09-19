import { Expense } from "@shared/schema";

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  deductiblePercentage: number;
  taxCode?: string;
}

export const TAX_CATEGORIES: ExpenseCategory[] = [
  {
    id: "fuel",
    name: "Combustible",
    description: "Gastos de gasolina, diesel y otros combustibles",
    keywords: ["gasolina", "diesel", "combustible", "pemex", "shell", "bp", "mobil", "fuel"],
    deductiblePercentage: 100,
    taxCode: "25101500"
  },
  {
    id: "maintenance",
    name: "Mantenimiento Vehicular",
    description: "Reparaciones, servicios y mantenimiento de vehículos",
    keywords: ["taller", "reparacion", "servicio", "aceite", "llantas", "frenos", "transmision", "motor"],
    deductiblePercentage: 100,
    taxCode: "25101600"
  },
  {
    id: "insurance",
    name: "Seguros",
    description: "Pólizas de seguro vehicular y responsabilidad civil",
    keywords: ["seguro", "poliza", "gnp", "qualitas", "axa", "mapfre", "insurance"],
    deductiblePercentage: 100,
    taxCode: "84121600"
  },
  {
    id: "tolls",
    name: "Casetas y Peajes",
    description: "Pagos de casetas de autopistas y peajes",
    keywords: ["caseta", "peaje", "autopista", "toll", "capufe", "oca"],
    deductiblePercentage: 100,
    taxCode: "78111600"
  },
  {
    id: "parking",
    name: "Estacionamientos",
    description: "Gastos de estacionamiento y parquímetros",
    keywords: ["estacionamiento", "parking", "parquimetro", "pension"],
    deductiblePercentage: 100,
    taxCode: "78111700"
  },
  {
    id: "vehicle_registration",
    name: "Trámites Vehiculares",
    description: "Tenencias, verificaciones, placas y trámites oficiales",
    keywords: ["tenencia", "verificacion", "placas", "refrendo", "tramite", "gobierno"],
    deductiblePercentage: 100,
    taxCode: "93141500"
  },
  {
    id: "driver_expenses",
    name: "Gastos de Conductores",
    description: "Viáticos, hospedaje y gastos de personal operativo",
    keywords: ["viaticos", "hospedaje", "hotel", "comida", "conductor", "chofer"],
    deductiblePercentage: 100,
    taxCode: "90101500"
  },
  {
    id: "office_supplies",
    name: "Suministros de Oficina",
    description: "Papelería, materiales de oficina y suministros administrativos",
    keywords: ["papeleria", "oficina", "suministros", "papel", "tinta", "computadora"],
    deductiblePercentage: 100,
    taxCode: "44121700"
  },
  {
    id: "communications",
    name: "Comunicaciones",
    description: "Teléfono, internet, radio y sistemas de comunicación",
    keywords: ["telefono", "internet", "comunicacion", "telcel", "movistar", "radio"],
    deductiblePercentage: 100,
    taxCode: "43191500"
  },
  {
    id: "professional_services",
    name: "Servicios Profesionales",
    description: "Honorarios profesionales, consultorías y servicios especializados",
    keywords: ["honorarios", "consultoria", "abogado", "contador", "profesional"],
    deductiblePercentage: 100,
    taxCode: "80101500"
  },
  {
    id: "equipment",
    name: "Equipo y Herramientas",
    description: "Compra de equipo, herramientas y activos fijos",
    keywords: ["equipo", "herramientas", "maquinaria", "activo", "inversion"],
    deductiblePercentage: 100,
    taxCode: "48101500"
  },
  {
    id: "rent",
    name: "Arrendamientos",
    description: "Renta de oficinas, bodegas y espacios comerciales",
    keywords: ["renta", "arrendamiento", "oficina", "bodega", "local"],
    deductiblePercentage: 100,
    taxCode: "80141600"
  },
  {
    id: "utilities",
    name: "Servicios Públicos",
    description: "Luz, agua, gas y otros servicios básicos",
    keywords: ["luz", "agua", "gas", "cfe", "electricidad", "servicio"],
    deductiblePercentage: 100,
    taxCode: "27111700"
  },
  {
    id: "meals_entertainment",
    name: "Alimentos y Entretenimiento",
    description: "Gastos de representación, comidas de negocios",
    keywords: ["comida", "restaurante", "entretenimiento", "representacion", "cliente"],
    deductiblePercentage: 50, // Solo 50% deducible según normativa fiscal
    taxCode: "90101600"
  },
  {
    id: "other",
    name: "Otros Gastos",
    description: "Gastos diversos no clasificados en otras categorías",
    keywords: ["otro", "diversos", "varios", "miscelaneo"],
    deductiblePercentage: 100,
    taxCode: "93141600"
  }
];

export class ExpenseCategorizer {
  
  /**
   * Categoriza automáticamente un gasto basado en su descripción y categoría
   */
  static categorizeExpense(expense: Expense): ExpenseCategory {
    const searchText = `${expense.category} ${expense.description || ""}`.toLowerCase();
    
    // Buscar coincidencias exactas primero
    for (const category of TAX_CATEGORIES) {
      for (const keyword of category.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    // Si no encuentra coincidencias, devolver categoría "otros"
    return TAX_CATEGORIES.find(cat => cat.id === "other") || TAX_CATEGORIES[TAX_CATEGORIES.length - 1];
  }

  /**
   * Calcula el monto deducible de un gasto
   */
  static calculateDeductibleAmount(expense: Expense, category?: ExpenseCategory): number {
    const expenseCategory = category || this.categorizeExpense(expense);
    return parseFloat(expense.amount) * (expenseCategory.deductiblePercentage / 100);
  }

  /**
   * Obtiene estadísticas de categorización para un conjunto de gastos
   */
  static getCategoryStats(expenses: Expense[]): {
    categoryId: string;
    categoryName: string;
    count: number;
    totalAmount: number;
    deductibleAmount: number;
    percentage: number;
  }[] {
    const categoryStats = new Map();
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    expenses.forEach(expense => {
      const category = this.categorizeExpense(expense);
      const amount = parseFloat(expense.amount);
      const deductibleAmount = this.calculateDeductibleAmount(expense, category);

      if (!categoryStats.has(category.id)) {
        categoryStats.set(category.id, {
          categoryId: category.id,
          categoryName: category.name,
          count: 0,
          totalAmount: 0,
          deductibleAmount: 0,
          percentage: 0
        });
      }

      const stats = categoryStats.get(category.id);
      stats.count += 1;
      stats.totalAmount += amount;
      stats.deductibleAmount += deductibleAmount;
    });

    // Calcular porcentajes
    const result = Array.from(categoryStats.values());
    result.forEach(stat => {
      stat.percentage = totalExpenses > 0 ? (stat.count / totalExpenses) * 100 : 0;
    });

    // Ordenar por monto total descendente
    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Genera recomendaciones fiscales basadas en los gastos categorizados
   */
  static getFiscalRecommendations(expenses: Expense[]): {
    totalDeductible: number;
    potentialSavings: number;
    recommendations: string[];
    alerts: string[];
  } {
    const categoryStats = this.getCategoryStats(expenses);
    const totalDeductible = categoryStats.reduce((sum, stat) => sum + stat.deductibleAmount, 0);
    
    // Estimación de ahorro fiscal (aproximado 30% de ISR)
    const potentialSavings = totalDeductible * 0.30;
    
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Recomendaciones basadas en categorías
    const fuelExpenses = categoryStats.find(s => s.categoryId === "fuel");
    if (fuelExpenses && fuelExpenses.percentage > 40) {
      recommendations.push("Considera implementar un sistema de control de combustible más estricto");
    }

    const maintenanceExpenses = categoryStats.find(s => s.categoryId === "maintenance");
    if (maintenanceExpenses && maintenanceExpenses.percentage > 25) {
      recommendations.push("Evalúa implementar un programa de mantenimiento preventivo");
    }

    const mealsExpenses = categoryStats.find(s => s.categoryId === "meals_entertainment");
    if (mealsExpenses && mealsExpenses.totalAmount > 50000) {
      alerts.push("Los gastos de alimentos solo son 50% deducibles. Revisa la documentación.");
    }

    // Alertas generales
    const uncategorizedExpenses = categoryStats.find(s => s.categoryId === "other");
    if (uncategorizedExpenses && uncategorizedExpenses.percentage > 20) {
      alerts.push("Tienes muchos gastos sin categorizar. Revisa y clasifica correctamente.");
    }

    if (categoryStats.length < 3) {
      recommendations.push("Diversifica tus gastos deducibles para optimizar tu situación fiscal");
    }

    return {
      totalDeductible,
      potentialSavings,
      recommendations,
      alerts
    };
  }

  /**
   * Valida si un gasto cumple con los requisitos fiscales básicos
   */
  static validateFiscalRequirements(expense: Expense): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones obligatorias
    if (!expense.category || expense.category.trim().length < 3) {
      errors.push("La categoría debe tener al menos 3 caracteres");
    }

    if (parseFloat(expense.amount) <= 0) {
      errors.push("El monto debe ser mayor a cero");
    }

    if (parseFloat(expense.amount) > 2000 && !expense.receipt) {
      errors.push("Gastos mayores a $2,000 requieren comprobante");
    }

    // Validaciones de advertencia
    if (!expense.description) {
      warnings.push("Se recomienda agregar una descripción detallada");
    }

    if (parseFloat(expense.amount) > 5000) {
      warnings.push("Gasto elevado - verifica que sea necesario para la operación");
    }

    const category = this.categorizeExpense(expense);
    if (category.id === "other") {
      warnings.push("Gasto no categorizado - podría no ser deducible");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default ExpenseCategorizer;
