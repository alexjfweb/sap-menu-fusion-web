import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TxItem {
  id: string;
  status: string | null;
  created_at: string | null;
  metadata?: any;
}

const ProductionDeployment: React.FC = () => {
  const [checkingConfig, setCheckingConfig] = useState(false);
  const [mpConfigured, setMpConfigured] = useState<null | { ok: boolean; detail?: string }>(null);

  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<null | { ok: boolean; message: string }>(null);

  const [loadingTx, setLoadingTx] = useState(false);
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [txError, setTxError] = useState<string | null>(null);

  // SEO basics for this page
  useEffect(() => {
    const title = "Despliegue a Producción | Checklist Seguro";
    const desc = "Checklist de despliegue a producción: pre-check, deploy y validación";
    document.title = title;

    const ensureMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    ensureMeta("description", desc);

    // Canonical
    const existing = document.querySelector("link[rel='canonical']");
    if (!existing) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", window.location.href);
      document.head.appendChild(link);
    } else {
      existing.setAttribute("href", window.location.href);
    }
  }, []);

  const checkMercadoPagoConfig = useCallback(async () => {
    try {
      setCheckingConfig(true);
      setMpConfigured(null);
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, name, configuration, is_active")
        .eq("type", "mercado_pago")
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        setMpConfigured({ ok: false, detail: error.message });
        toast.error("Error al leer configuración de Mercado Pago");
        return;
      }

      if (data && (data as any).configuration?.private_key) {
        setMpConfigured({ ok: true });
        toast.success("Mercado Pago está configurado (clave detectada)");
      } else {
        setMpConfigured({ ok: false, detail: "Falta private_key en configuration" });
        toast.warning("Mercado Pago activo pero falta private_key");
      }
    } finally {
      setCheckingConfig(false);
    }
  }, []);

  const pingWebhook = useCallback(async () => {
    try {
      setPinging(true);
      setPingResult(null);
      const { data, error } = await supabase.functions.invoke("mercadopago-webhook", {
        body: { type: "payment", data: { id: "TEST_ID" } },
      });
      if (error) {
        setPingResult({ ok: false, message: error.message });
        toast.error("Ping falló");
        return;
      }
      setPingResult({ ok: true, message: typeof data === "string" ? data : "ok" });
      toast.success("Webhook respondió correctamente");
    } catch (e: any) {
      setPingResult({ ok: false, message: e?.message || "Error" });
      toast.error("Error al invocar webhook");
    } finally {
      setPinging(false);
    }
  }, []);

  const loadRecentTransactions = useCallback(async () => {
    try {
      setLoadingTx(true);
      setTxError(null);
      const { data, error } = await supabase
        .from("transactions")
        .select("id,status,created_at,metadata")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) {
        setTxError(error.message);
        setTransactions([]);
        return;
      }
      setTransactions((data || []) as TxItem[]);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  const mpStatusBadge = useMemo(() => {
    if (mpConfigured == null) return null;
    return mpConfigured.ok ? (
      <Badge variant="default">Mercado Pago OK</Badge>
    ) : (
      <Badge variant="destructive">Mercado Pago incompleto</Badge>
    );
  }, [mpConfigured]);

  return (
    <>
      <header className="px-4 py-6">
        <h1 className="text-2xl font-semibold">Despliegue a producción (Checklist)</h1>
      </header>
      <main className="px-4 pb-8 space-y-6">
        <section>
          <Card>
            <CardHeader>
              <CardTitle>1. Preparación previa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button onClick={checkMercadoPagoConfig} disabled={checkingConfig}>
                  {checkingConfig ? "Verificando…" : "Verificar Mercado Pago activo"}
                </Button>
                {mpStatusBadge}
              </div>
              <p className="text-sm opacity-80">
                Realiza un backup desde Supabase (Database → Backups) antes de desplegar. Confirma rama de producción con tests aprobados.
              </p>
              <div className="text-sm">
                <a
                  className="underline"
                  href={`https://supabase.com/dashboard/project/hlbbaaewjebasisxgnrt/sql/new`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir SQL Editor (Supabase)
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>2. Despliegue (Funciones y Frontend)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm opacity-80">Usa Supabase CLI para desplegar funciones.</p>
              <div className="bg-muted/30 rounded p-3 text-sm font-mono overflow-auto">
                supabase login && supabase link --project-ref hlbbaaewjebasisxgnrt
                <br />
                supabase functions deploy create-mercadopago-preference
                <br />
                supabase functions deploy mercadopago-webhook
                <br />
                supabase functions deploy create-employee
                <br />
                supabase functions deploy bulk-product-operations
              </div>
              <Separator />
              <p className="text-sm opacity-80">Luego compila y publica el frontend (Vercel/Lovable/Netlify):</p>
              <div className="bg-muted/30 rounded p-3 text-sm font-mono overflow-auto">
                npm ci && npm run build
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>3. Validación post-despliegue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button onClick={pingWebhook} disabled={pinging}>
                  {pinging ? "Pingeando…" : "Probar webhook de Mercado Pago"}
                </Button>
                {pingResult && (
                  <Badge variant={pingResult.ok ? "default" : "destructive"}>
                    {pingResult.ok ? "Respuesta OK" : "Error"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={loadRecentTransactions} disabled={loadingTx}>
                  {loadingTx ? "Cargando…" : "Ver últimas transacciones"}
                </Button>
                {txError && <span className="text-sm text-red-500">{txError}</span>}
              </div>
              {transactions.length > 0 && (
                <div className="mt-2 space-y-2">
                  {transactions.map((t) => (
                    <div key={t.id} className="text-sm p-2 rounded border">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs opacity-80">{t.id}</span>
                        <Badge variant="secondary">{t.status || "pending"}</Badge>
                      </div>
                      <div className="opacity-80 mt-1">
                        {new Date(t.created_at || "").toLocaleString()}
                      </div>
                      {t.metadata?.external_reference && (
                        <div className="text-xs opacity-80 mt-1">
                          Ref: {t.metadata.external_reference}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default ProductionDeployment;
