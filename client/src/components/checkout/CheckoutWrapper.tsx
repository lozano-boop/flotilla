import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, CreditCard, Shield, CheckCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  planId: number;
  planName: string;
  planPrice: number;
  userId: number;
}

interface PaymentIntentResponse {
  paymentIntent: {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
  };
  upgradeId: number;
  plan: {
    name: string;
    price: number;
  };
}

export default function CheckoutWrapper({ 
  isOpen, 
  onClose, 
  planId, 
  planName, 
  planPrice, 
  userId 
}: CheckoutWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && !clientSecret) {
      createPaymentIntent();
    }
  }, [isOpen, planId, userId]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://flotilla-manager-a395al66o-lozanos-projects-1f482492.vercel.app/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error creating payment intent');
      }

      const data: PaymentIntentResponse = await response.json();
      setClientSecret(data.paymentIntent.client_secret);
    } catch (err: any) {
      setError(err.message || 'Error creating payment intent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setPaymentSuccess(true);
    // Reload page after 2 seconds to refresh subscription status
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    setClientSecret('');
    setError(null);
    setPaymentSuccess(false);
    onClose();
  };

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Upgrade a {planName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {paymentSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¡Pago Exitoso!</h3>
            <p className="text-gray-600 mb-4">
              Tu suscripción ha sido actualizada a {planName}
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo en unos segundos...
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Preparando checkout...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md mb-4">
              {error}
            </div>
            <Button onClick={createPaymentIntent} variant="outline">
              Reintentar
            </Button>
          </div>
        ) : clientSecret ? (
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm 
              planName={planName}
              planPrice={planPrice}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface CheckoutFormProps {
  planName: string;
  planPrice: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ planName, planPrice, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pricing?success=true`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || 'Error en el pago');
        onError(error.message || 'Error en el pago');
      } else {
        setMessage('Error inesperado. Intenta de nuevo.');
        onError('Error inesperado. Intenta de nuevo.');
      }
    } else {
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg font-semibold">
          ${planPrice.toLocaleString('es-MX')} MXN
        </p>
        <p className="text-sm text-gray-600">Pago único por upgrade</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-lg bg-gray-50">
          <PaymentElement 
            options={{
              layout: "tabs"
            }}
          />
        </div>

        {message && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {message}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={isLoading || !stripe || !elements}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando pago...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Pagar ${planPrice.toLocaleString('es-MX')} MXN
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <Shield className="inline h-3 w-3 mr-1" />
          Pago seguro procesado por Stripe
        </div>
      </form>
    </div>
  );
}
