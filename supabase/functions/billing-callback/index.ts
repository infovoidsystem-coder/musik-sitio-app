import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return json({ error: "Método no permitido" }, 405);
  try {
    const supplied = (request.headers.get("Authorization") || "").replace(
        /^Bearer\s+/i,
        "",
      ),
      secret = Deno.env.get("BILLING_SYNC_SECRET") || "";
    if (!secret || supplied !== secret)
      return json({ error: "Firma inválida" }, 401);
    const body = await request.json(),
      allowed = ["processing", "issued", "sent", "failed", "cancelled"];
    if (!body.invoice_id || !allowed.includes(body.status))
      return json({ error: "Respuesta inválida" }, 400);
    const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      ),
      updates = {
        status: body.status,
        external_id: body.external_id || null,
        invoice_type: body.invoice_type || null,
        point_of_sale: body.point_of_sale || null,
        invoice_number: body.invoice_number || null,
        cae: body.cae || null,
        cae_expires_at: body.cae_expires_at || null,
        pdf_url: body.pdf_url || null,
        recipient_email: body.recipient_email || null,
        issued_at: body.issued_at || null,
        sent_at: body.sent_at || null,
        error_message: body.error_message || null,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    const { error } = await admin
      .from("billing_invoices")
      .update(updates)
      .eq("id", body.invoice_id);
    if (error) throw error;
    await admin
      .from("billing_events")
      .insert({
        invoice_id: body.invoice_id,
        event_type: `callback_${body.status}`,
        detail:
          body.message || "Actualización recibida desde el sistema fiscal.",
      });
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: "No pudimos actualizar la factura." }, 500);
  }
});
