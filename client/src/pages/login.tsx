import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, User, Lock, LogIn, UserPlus, Star, Heart, Zap } from "lucide-react";

export default function LoginPage() {
  const [rfc, setRfc] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch('/api/auth-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rfc, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Autenticación exitosa
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRfc", data.user.rfc);
        localStorage.setItem("userName", data.user.nombre);
        
        // Redirect al dashboard
        window.location.href = "/";
      } else {
        setError(data.message || "Error al iniciar sesión");
      }
    } catch (error) {
      setError("Error de conexión. Intenta de nuevo.");
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!nombre || !rfc || !password) {
      setError("Todos los campos son requeridos");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          rfc: rfc.toUpperCase(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Usuario registrado exitosamente. Puedes iniciar sesión.");
        setNombre("");
        setRfc("");
        setPassword("");
      } else {
        setError(data.message || "Error al registrar usuario");
      }
    } catch (error) {
      setError("Error de conexión. Intenta de nuevo.");
    }
    
    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setSuccess("");
    setNombre("");
    setRfc("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Elementos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-blue-200 animate-bounce">
          <Truck size={40} />
        </div>
        <div className="absolute top-40 right-32 text-purple-200 animate-pulse">
          <Star size={32} />
        </div>
        <div className="absolute bottom-32 left-40 text-indigo-200 animate-bounce delay-300">
          <Zap size={36} />
        </div>
        <div className="absolute bottom-20 right-20 text-pink-200 animate-pulse delay-500">
          <Heart size={28} />
        </div>
        <div className="absolute top-1/2 left-10 text-blue-100 animate-bounce delay-700">
          <Star size={24} />
        </div>
        <div className="absolute top-1/3 right-10 text-purple-100 animate-pulse delay-1000">
          <Truck size={32} />
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FlotillaManager
            </CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">
              {isRegistering ? "📝 Crear Nueva Cuenta" : "🚛 Gestión Profesional de Flotillas 📊"}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-green-500" />
                  Nombre Completo
                </label>
                <Input
                  type="text"
                  placeholder="Ingresa tu nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-12 border-2 focus:border-green-400 transition-colors"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                RFC
              </label>
              <Input
                type="text"
                placeholder="Ingresa tu RFC"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                className="h-12 text-center font-mono tracking-wider border-2 focus:border-blue-400 transition-colors"
                maxLength={13}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                Contraseña
              </label>
              <Input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-center border-2 focus:border-purple-400 transition-colors"
                required
              />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700 text-sm">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 ${isRegistering 
                ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              } text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-105`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isRegistering ? "Registrando..." : "Iniciando sesión..."}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isRegistering ? "Registrarse" : "Iniciar Sesión"}
                </div>
              )}
            </Button>
          </form>

          <div className="text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">o</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={toggleMode}
              className="w-full h-10 border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-purple-600">
                {isRegistering ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
              </div>
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>🔐 {isRegistering ? "Crea tu cuenta con RFC y contraseña segura" : "Inicia sesión con tu RFC registrado"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer divertido */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-xs text-gray-400">
        <p className="flex items-center gap-1">
          Hecho con <Heart className="w-3 h-3 text-red-400" /> para gestionar flotillas como un pro 🚛✨
        </p>
      </div>
    </div>
  );
}
