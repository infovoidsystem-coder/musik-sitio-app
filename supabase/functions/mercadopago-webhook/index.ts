import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const encoder = new TextEncoder();
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let value = 0;
  for (let i = 0; i < a.length; i++) value |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return value === 0;
}
async function validSignature(request: Request, dataId: string) {
  const signature = request.headers.get("x-signature") || "",
    requestId = request.headers.get("x-request-id") || "",
    secret = Deno.env.get("MP_WEBHOOK_SECRET") || "";
  if (!signature || !requestId || !secret) return false;
  const parts = Object.fromEntries(
    signature.split(",").map((part) => part.trim().split("=")),
  );
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`,
    key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    ),
    digest = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest)),
    hex = [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  return safeEqual(hex, parts.v1);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("ok");
  try {
    const body = await request.json(),
      requestUrl = new URL(request.url),
      dataId = String(
        requestUrl.searchParams.get("data.id") || body?.data?.id || "",
      );
    if (!dataId || !(await validSignature(request, dataId)))
      return new Response("Firma inválida", { status: 401 });
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
      {
        headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` },
      },
    );
    if (!response.ok)
      return new Response("No se pudo verificar el pago", { status: 502 });
    const mp = await response.json(),
      reference = String(mp.external_reference || ""),
      statusMap: Record<string, string> = {
        approved: "approved",
        pending: "pending",
        in_process: "pending",
        rejected: "rejected",
        cancelled: "cancelled",
        refunded: "refunded",
        charged_back: "refunded",
      },
      status = statusMap[mp.status] || "pending";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: payment } = await admin
      .from("payments")
      .select("id,membership_id,enrollment_id")
      .eq("external_reference", reference)
      .single();
    if (!payment) return new Response("ok");
    await admin
      .from("payments")
      .update({
        provider_payment_id: String(mp.id),
        status,
        status_detail: mp.status_detail || null,
        paid_at:
          status === "approved"
            ? mp.date_approved || new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);
    if (status === "approved" && payment.membership_id)
      await admin
        .from("memberships")
        .update({ status: "active", starts_at: new Date().toISOString() })
        .eq("id", payment.membership_id);
    if (status === "approved" && payment.enrollment_id)
      await admin
        .from("enrollments")
        .update({ status: "active" })
        .eq("id", payment.enrollment_id);
    return new Response("ok");
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
});
