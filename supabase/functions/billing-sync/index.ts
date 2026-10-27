import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: cors });
  if (request.method !== "POST")
    return json({ error: "Método no permitido" }, 405);
  try {
    const authorization = request.headers.get("Authorization") || "",
      url = Deno.env.get("SUPABASE_URL")!;
    const auth = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) return json({ error: "Sesión requerida" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),
      { invoice_id, action = "send" } = await request.json();
    const { data: invoice } = await admin
      .from("billing_invoices")
      .select(
        "*,payments(amount_ars,provider,status,membership_id,enrollment_id),profiles(full_name,email,phone,role)",
      )
      .eq("id", invoice_id)
      .single();
    if (!invoice) return json({ error: "Factura inexistente" }, 404);
    const requesterRole = (
      await admin.from("profiles").select("role").eq("id", user.id).single()
    ).data?.role;
    if (invoice.user_id !== user.id && requesterRole !== "admin")
      return json({ error: "Sin permiso" }, 403);
    const syncUrl = Deno.env.get("BILLING_SYNC_URL"),
      syncSecret = Deno.env.get("BILLING_SYNC_SECRET"),
      provider = Deno.env.get("BILLING_PROVIDER") || "pending_integration";
    if (!syncUrl || !syncSecret) {
      await admin
        .from("billing_invoices")
        .update({
          provider,
          status: "pending",
          last_sync_at: new Date().toISOString(),
          error_message: "Integración fiscal pendiente",
        })
        .eq("id", invoice.id);
      await admin
        .from("billing_events")
        .insert({
          invoice_id: invoice.id,
          event_type: "sync_pending",
          detail:
            "Solicitud registrada. Falta conectar ARCA o el sistema de gestión.",
        });
      return json({
        configured: false,
        status: "pending",
        message: "Solicitud registrada; integración fiscal pendiente.",
      });
    }
    await admin
      .from("billing_invoices")
      .update({
        provider,
        status: "processing",
        last_sync_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", invoice.id);
    const payload = {
      action,
      invoice_id: invoice.id,
      payment_id: invoice.payment_id,
      amount_ars: Number(invoice.payments?.amount_ars || 0),
      payment_provider: invoice.payments?.provider,
      customer: {
        id: invoice.user_id,
        name: invoice.profiles?.full_name,
        email: invoice.recipient_email || invoice.profiles?.email,
        phone: invoice.profiles?.phone,
      },
      callback_url: `${url}/functions/v1/billing-callback`,
    };
    const response = await fetch(syncUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${syncSecret}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${invoice.id}-${action}`,
        },
        body: JSON.stringify(payload),
      }),
      result = await response.json().catch(() => ({}));
    if (!response.ok) {
      await admin
        .from("billing_invoices")
        .update({
          status: "failed",
          error_message:
            result.message || "El proveedor rechazó la sincronización",
        })
        .eq("id", invoice.id);
      return json({ error: "Falló la sincronización fiscal." }, 502);
    }
    const status = result.status || "processing";
    await admin
      .from("billing_invoices")
      .update({
        provider,
        status,
        external_id: result.external_id || null,
        invoice_type: result.invoice_type || null,
        point_of_sale: result.point_of_sale || null,
        invoice_number: result.invoice_number || null,
        cae: result.cae || null,
        cae_expires_at: result.cae_expires_at || null,
        pdf_url: result.pdf_url || null,
        recipient_email: result.recipient_email || payload.customer.email,
        issued_at: result.issued_at || null,
        sent_at: result.sent_at || null,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoice.id);
    await admin
      .from("billing_events")
      .insert({
        invoice_id: invoice.id,
        event_type: `sync_${status}`,
        detail: result.message || `Respuesta de ${provider}`,
      });
    return json({
      configured: true,
      status,
      message: result.message || "Sincronización iniciada.",
    });
  } catch (error) {
    console.error(error);
    return json({ error: "No pudimos sincronizar la factura." }, 500);
  }
});
