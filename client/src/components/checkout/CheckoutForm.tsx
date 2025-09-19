import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Loader2, CreditCard, Shield } from 'lucide-react';

interface CheckoutFormProps {
  planName: string;
  planPrice: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function CheckoutForm({ planName, planPrice, onSuccess, onError }: CheckoutFormProps) {
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5" />
          Upgrade a {planName}
        </CardTitle>
        <CardDescription>
          Precio: ${planPrice.toLocaleString('es-MX')} MXN
        </CardDescription>
      </CardHeader>
      
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
