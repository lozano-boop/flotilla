import { Pool } from 'pg';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  max_monthly_reports: number;
  max_annual_reports: number;
  has_fleet_management: boolean;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  trial_start_date?: Date;
  trial_end_date?: Date;
  subscription_start_date?: Date;
  subscription_end_date?: Date;
  monthly_reports_used: number;
  annual_reports_used: number;
  last_reset_date: Date;
  payment_method?: string;
  stripe_subscription_id?: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  payment_type: 'monthly' | 'annual' | 'one_time_report';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  payment_method?: string;
  description?: string;
}

export class SubscriptionService {
  constructor(private pool: Pool) {}

  // Obtener todos los planes activos
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    const result = await this.pool.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price_monthly ASC'
    );
    return result.rows;
  }

  // Obtener plan por ID
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const result = await this.pool.query(
      'SELECT * FROM subscription_plans WHERE id = $1',
      [planId]
    );
    return result.rows[0] || null;
  }

  // Obtener suscripción activa del usuario
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const result = await this.pool.query(
      `SELECT * FROM user_subscriptions 
       WHERE user_id = $1 AND status IN ('active', 'trial') 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  // Crear suscripción de prueba para nuevo usuario
  async createTrialSubscription(userId: string): Promise<UserSubscription> {
    const trialPlan = await this.pool.query(
      "SELECT id FROM subscription_plans WHERE name = 'Prueba Gratuita' LIMIT 1"
    );
    
    if (!trialPlan.rows[0]) {
      throw new Error('Plan de prueba no encontrado');
    }

    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setMonth(trialEndDate.getMonth() + 1); // 1 mes de prueba

    const result = await this.pool.query(
      `INSERT INTO user_subscriptions 
       (user_id, plan_id, status, trial_start_date, trial_end_date, monthly_reports_used, annual_reports_used)
       VALUES ($1, $2, 'trial', $3, $4, 0, 0)
       RETURNING *`,
      [userId, trialPlan.rows[0].id, trialStartDate, trialEndDate]
    );

    return result.rows[0];
  }

  // Verificar si el usuario puede generar un papel de trabajo mensual
  async canGenerateMonthlyReport(userId: string): Promise<{ canGenerate: boolean; reason?: string }> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      return { canGenerate: false, reason: 'No tienes una suscripción activa' };
    }

    // Verificar si la suscripción ha expirado
    if (subscription.status === 'trial' && subscription.trial_end_date && new Date() > subscription.trial_end_date) {
      await this.expireSubscription(subscription.id);
      return { canGenerate: false, reason: 'Tu período de prueba ha expirado' };
    }

    if (subscription.status === 'active' && subscription.subscription_end_date && new Date() > subscription.subscription_end_date) {
      await this.expireSubscription(subscription.id);
      return { canGenerate: false, reason: 'Tu suscripción ha expirado' };
    }

    const plan = await this.getPlanById(subscription.plan_id);
    if (!plan) {
      return { canGenerate: false, reason: 'Plan no encontrado' };
    }

    // Verificar límites de reportes mensuales
    if (plan.max_monthly_reports > 0 && subscription.monthly_reports_used >= plan.max_monthly_reports) {
      return { canGenerate: false, reason: 'Has alcanzado el límite de reportes mensuales' };
    }

    return { canGenerate: true };
  }

  // Verificar si el usuario puede generar un papel de trabajo anual
  async canGenerateAnnualReport(userId: string): Promise<{ canGenerate: boolean; reason?: string }> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      return { canGenerate: false, reason: 'No tienes una suscripción activa' };
    }

    const plan = await this.getPlanById(subscription.plan_id);
    if (!plan) {
      return { canGenerate: false, reason: 'Plan no encontrado' };
    }

    // Solo el plan anual permite reportes anuales ilimitados
    if (plan.name === 'Plan Anual') {
      return { canGenerate: true };
    }

    // Verificar límites de reportes anuales para otros planes
    if (plan.max_annual_reports > 0 && subscription.annual_reports_used >= plan.max_annual_reports) {
      return { canGenerate: false, reason: 'Has alcanzado el límite de reportes anuales' };
    }

    return { canGenerate: true };
  }

  // Incrementar uso de reportes
  async incrementReportUsage(userId: string, reportType: 'monthly' | 'annual'): Promise<void> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new Error('Suscripción no encontrada');
    }

    const field = reportType === 'monthly' ? 'monthly_reports_used' : 'annual_reports_used';
    
    await this.pool.query(
      `UPDATE user_subscriptions 
       SET ${field} = ${field} + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [subscription.id]
    );
  }

  // Expirar suscripción
  async expireSubscription(subscriptionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE user_subscriptions 
       SET status = 'expired', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [subscriptionId]
    );
  }

  // Crear suscripción de pago
  async createPaidSubscription(
    userId: string, 
    planId: string, 
    paymentMethod: string,
    stripeSubscriptionId?: string
  ): Promise<UserSubscription> {
    const plan = await this.getPlanById(planId);
    if (!plan) {
      throw new Error('Plan no encontrado');
    }

    // Expirar suscripción actual si existe
    const currentSubscription = await this.getUserSubscription(userId);
    if (currentSubscription) {
      await this.expireSubscription(currentSubscription.id);
    }

    const startDate = new Date();
    const endDate = new Date();
    
    // Determinar duración según el plan
    if (plan.price_annual > 0) {
      endDate.setFullYear(endDate.getFullYear() + 1); // Plan anual
    } else {
      endDate.setMonth(endDate.getMonth() + 1); // Plan mensual
    }

    const result = await this.pool.query(
      `INSERT INTO user_subscriptions 
       (user_id, plan_id, status, subscription_start_date, subscription_end_date, 
        monthly_reports_used, annual_reports_used, payment_method, stripe_subscription_id)
       VALUES ($1, $2, 'active', $3, $4, 0, 0, $5, $6)
       RETURNING *`,
      [userId, planId, startDate, endDate, paymentMethod, stripeSubscriptionId]
    );

    return result.rows[0];
  }

  // Crear transacción de pago
  async createPaymentTransaction(
    userId: string,
    amount: number,
    paymentType: 'monthly' | 'annual' | 'one_time_report',
    subscriptionId?: string,
    stripePaymentIntentId?: string
  ): Promise<PaymentTransaction> {
    const result = await this.pool.query(
      `INSERT INTO payment_transactions 
       (user_id, subscription_id, amount, currency, payment_type, status, stripe_payment_intent_id)
       VALUES ($1, $2, $3, 'MXN', $4, 'pending', $5)
       RETURNING *`,
      [userId, subscriptionId, amount, paymentType, stripePaymentIntentId]
    );

    return result.rows[0];
  }

  // Actualizar estado de transacción
  async updatePaymentStatus(
    transactionId: string, 
    status: 'completed' | 'failed' | 'refunded'
  ): Promise<void> {
    await this.pool.query(
      `UPDATE payment_transactions 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, transactionId]
    );
  }

  // Obtener información completa de suscripción del usuario
  async getUserSubscriptionInfo(userId: string): Promise<{
    subscription: UserSubscription | null;
    plan: SubscriptionPlan | null;
    canGenerateMonthly: boolean;
    canGenerateAnnual: boolean;
    monthlyReportsRemaining: number;
    annualReportsRemaining: number;
  }> {
    const subscription = await this.getUserSubscription(userId);
    let plan = null;
    
    if (subscription) {
      plan = await this.getPlanById(subscription.plan_id);
    }

    const monthlyCheck = await this.canGenerateMonthlyReport(userId);
    const annualCheck = await this.canGenerateAnnualReport(userId);

    let monthlyRemaining = 0;
    let annualRemaining = 0;

    if (plan && subscription) {
      monthlyRemaining = Math.max(0, plan.max_monthly_reports - subscription.monthly_reports_used);
      annualRemaining = plan.max_annual_reports === 999 ? 999 : Math.max(0, plan.max_annual_reports - subscription.annual_reports_used);
    }

    return {
      subscription,
      plan,
      canGenerateMonthly: monthlyCheck.canGenerate,
      canGenerateAnnual: annualCheck.canGenerate,
      monthlyReportsRemaining: monthlyRemaining,
      annualReportsRemaining: annualRemaining
    };
  }
}
