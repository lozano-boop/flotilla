// API configuration for FlotillaManager - Netlify Functions
export const api = {
  // Auth endpoints
  login: async (rfc: string, password: string) => {
    const response = await fetch('/api/auth-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rfc, password }),
    });
    return response;
  },

  register: async (nombre: string, rfc: string, password: string) => {
    const response = await fetch('/api/auth-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre, rfc: rfc.toUpperCase(), password }),
    });
    return response;
  },

  // Other API calls
  createPaymentIntent: async (planId: string, userId: string) => {
    const response = await fetch('/api/payments-create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, userId }),
    });
    return response;
  },

  migrate: async () => {
    const response = await fetch('/api/db-migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  }
};

export default api;
