import { useEffect, useState } from "react";
import Page from "@/components/layout/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const [userRfc, setUserRfc] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/config", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setUserRfc(json.userRfc || "");
        }
      } catch {}
    })();
  }, []);

  const save = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userRfc }),
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error guardando configuración");
      }
      setMessage("RFC actualizado correctamente.");
    } catch (e: any) {
      setMessage(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Configuración" subtitle="Preferencias del usuario y parámetros del sistema">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>RFC del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ej. XAXX010101000"
                value={userRfc}
                onChange={(e) => setUserRfc(e.target.value.toUpperCase())}
                className="max-w-xs"
              />
              <Button onClick={save} disabled={loading || !userRfc.trim()}>
                {loading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
            {message && (
              <div className="text-sm mt-2 text-muted-foreground">{message}</div>
            )}
            <div className="text-xs text-muted-foreground mt-3">
              Este RFC se utiliza para distinguir facturas Emitidas vs. Recibidas y para la Descarga Masiva SAT.
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
