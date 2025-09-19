import React, { useState, useEffect } from 'react';
import { Check, Star, Zap, Crown, FileText, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import CheckoutWrapper from '../components/checkout/CheckoutWrapper';

interface SubscriptionPlan {
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

interface UserSubscriptionInfo {
  subscription: any;
  plan: SubscriptionPlan | null;
  canGenerateMonthly: boolean;
  canGenerateAnnual: boolean;
  monthlyReportsRemaining: number;
  annualReportsRemaining: number;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userInfo, setUserInfo] = useState<UserSubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{id: number, name: string, price: number} | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchUserInfo();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app/api/subscriptions/plans');
      const data = await response.json();
      setPlans(data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const userId = localStorage.getItem('userId'); // Asumiendo que guardamos el userId en localStorage
      if (!userId) return;

      const response = await fetch(`https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app/api/subscriptions/user-info?userId=${userId}`);
      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Prueba Gratuita':
        return <Star className="w-6 h-6 text-yellow-500" />;
      case 'Plan Mensual':
        return <Zap className="w-6 h-6 text-blue-500" />;
      case 'Plan Anual':
        return <Crown className="w-6 h-6 text-purple-500" />;
      case 'Papel de Trabajo Individual':
        return <FileText className="w-6 h-6 text-green-500" />;
      default:
        return <CreditCard className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'Prueba Gratuita':
        return 'border-yellow-200 bg-yellow-50';
      case 'Plan Mensual':
        return 'border-blue-200 bg-blue-50';
      case 'Plan Anual':
        return 'border-purple-200 bg-purple-50';
      case 'Papel de Trabajo Individual':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const handleSelectPlan = (plan: any) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert('Debes iniciar sesión para seleccionar un plan');
      return;
    }

    setSelectedPlan({
      id: parseInt(plan.id),
      name: plan.name,
      price: plan.price_monthly || plan.price_annual
    });
    setCheckoutOpen(true);
  };

  const isCurrentPlan = (planId: string) => {
    return userInfo?.plan?.id === planId;
  };

  const getTrialDaysRemaining = () => {
    if (!userInfo?.subscription || userInfo.subscription.status !== 'trial') return 0;
    
    const trialEnd = new Date(userInfo.subscription.trial_end_date);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Planes y Precios
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan perfecto para tu negocio. Gestiona tu flotilla sin límites y 
            genera papeles de trabajo fiscales con total confianza.
          </p>
        </div>

        {/* Current Plan Status */}
        {userInfo?.plan && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPlanIcon(userInfo.plan.name)}
                <div>
                  <h3 className="font-semibold text-lg">Plan Actual: {userInfo.plan.name}</h3>
                  {userInfo.subscription?.status === 'trial' && (
                    <p className="text-sm text-orange-600">
                      Prueba gratuita - {getTrialDaysRemaining()} días restantes
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Reportes mensuales restantes</p>
                <p className="font-semibold text-2xl text-blue-600">{userInfo.monthlyReportsRemaining}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${getPlanColor(plan.name)} ${
                plan.name === 'Plan Anual' ? 'ring-2 ring-purple-500 scale-105' : ''
              } ${isCurrentPlan(plan.id) ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.name === 'Plan Anual' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
                  Más Popular
                </Badge>
              )}
              
              {isCurrentPlan(plan.id) && (
                <Badge className="absolute -top-3 right-4 bg-green-500">
                  Plan Actual
                </Badge>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  {plan.price_monthly > 0 && (
                    <div className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price_monthly)}
                      <span className="text-sm font-normal text-gray-600">/mes</span>
                    </div>
                  )}
                  {plan.price_annual > 0 && (
                    <div className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price_annual)}
                      <span className="text-sm font-normal text-gray-600">/año</span>
                    </div>
                  )}
                  {plan.price_monthly === 0 && plan.price_annual === 0 && (
                    <div className="text-3xl font-bold text-green-600">Gratis</div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-600 space-y-1">
                    {plan.max_monthly_reports > 0 && (
                      <p>• {plan.max_monthly_reports} reporte(s) mensual(es)</p>
                    )}
                    {plan.max_annual_reports > 0 && plan.max_annual_reports < 999 && (
                      <p>• {plan.max_annual_reports} reporte(s) anual(es)</p>
                    )}
                    {plan.max_annual_reports === 999 && (
                      <p>• Reportes anuales ilimitados</p>
                    )}
                    {plan.has_fleet_management && (
                      <p>• Gestión completa de flotilla</p>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full"
                  variant={isCurrentPlan(plan.id) ? "outline" : "default"}
                  disabled={isCurrentPlan(plan.id) || plan.name === 'Prueba Gratuita'}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrentPlan(plan.id) 
                    ? 'Plan Actual' 
                    : plan.name === 'Prueba Gratuita' 
                    ? 'Automático al registrarse'
                    : 'Seleccionar Plan'
                  }
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Comparación de Características</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Característica</th>
                  <th className="text-center py-3 px-4">Prueba</th>
                  <th className="text-center py-3 px-4">Mensual</th>
                  <th className="text-center py-3 px-4">Anual</th>
                  <th className="text-center py-3 px-4">Individual</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4">Gestión de Flotilla</td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-3 px-4"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-3 px-4">-</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Reportes Mensuales</td>
                  <td className="text-center py-3 px-4">1</td>
                  <td className="text-center py-3 px-4">1</td>
                  <td className="text-center py-3 px-4">12</td>
                  <td className="text-center py-3 px-4">-</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Reportes Anuales</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">-</td>
                  <td className="text-center py-3 px-4">Ilimitados</td>
                  <td className="text-center py-3 px-4">1</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Soporte Técnico</td>
                  <td className="text-center py-3 px-4">Básico</td>
                  <td className="text-center py-3 px-4">Estándar</td>
                  <td className="text-center py-3 px-4">Prioritario</td>
                  <td className="text-center py-3 px-4">Básico</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Duración</td>
                  <td className="text-center py-3 px-4">30 días</td>
                  <td className="text-center py-3 px-4">1 mes</td>
                  <td className="text-center py-3 px-4">12 meses</td>
                  <td className="text-center py-3 px-4">Pago único</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">¿Qué incluye la prueba gratuita?</h3>
              <p className="text-gray-600 text-sm">
                30 días completos con acceso a todas las funcionalidades, incluyendo 1 papel de trabajo mensual.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
              <p className="text-gray-600 text-sm">
                Sí, puedes actualizar o cambiar tu plan cuando lo necesites. Los cambios se aplican inmediatamente.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">¿Qué métodos de pago aceptan?</h3>
              <p className="text-gray-600 text-sm">
                Aceptamos tarjetas de crédito y débito, transferencias bancarias y pagos en OXXO.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">¿La gestión de flotilla es gratuita?</h3>
              <p className="text-gray-600 text-sm">
                Sí, todas las funciones de administración de flotilla están disponibles sin costo adicional.
              </p>
            </div>
          </div>
        </div>

        {/* Checkout Modal */}
        {selectedPlan && (
          <CheckoutWrapper
            isOpen={checkoutOpen}
            onClose={() => {
              setCheckoutOpen(false);
              setSelectedPlan(null);
            }}
            planId={selectedPlan.id}
            planName={selectedPlan.name}
            planPrice={selectedPlan.price}
            userId={parseInt(localStorage.getItem('userId') || '0')}
          />
        )}
      </div>
    </div>
  );
}
