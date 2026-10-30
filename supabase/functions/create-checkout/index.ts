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
    const authorization = request.headers.get("Authorization") || "";
    const url = Deno.env.get("SUPABASE_URL")!,
      anon = Deno.env.get("SUPABASE_ANON_KEY")!,
      service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(url, anon, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user)
      return json({ error: "Iniciá sesión para continuar con el pago." }, 401);
    const admin = createClient(url, service),
      body = await request.json(),
      kind = String(body.kind || ""),
      sku = String(body.sku || "").trim(),
      profile = body.profile || {};
    if (!["membership", "course"].includes(kind) || !sku)
      return json({ error: "Producto inválido." }, 400);
    const fullName = String(profile.full_name || "").trim(),
      phone = String(profile.phone || "").trim(),
      documentNumber = String(profile.document_number || "").trim(),
      address = String(profile.address || "").trim();
    if (!fullName || !phone || !documentNumber || !address)
      return json({ error: "Completá los datos obligatorios de tu ficha." }, 400);
    let title = "",
      amount = 0,
      targetId = "";
    if (kind === "membership") {
      const { data, error } = await admin
        .from("membership_plans")
        .select("id,name,price_ars")
        .ilike("name", sku)
        .eq("active", true)
        .single();
      if (error || !data)
        return json(
          { error: "El plan todavía no está publicado en la base de datos." },
          404,
        );
      title = `MUSIK Club · ${data.name}`;
      amount = Number(data.price_ars);
      const { data: membership, error: membershipError } = await admin
        .from("memberships")
        .insert({ user_id: user.id, plan_id: data.id, status: "pending" })
        .select("id")
        .single();
      if (membershipError) throw membershipError;
      targetId = membership.id;
    } else {
      const { data, error } = await admin
        .from("courses")
        .select("id,title,price_ars")
        .ilike("title", sku)
        .eq("active", true)
        .single();
      if (error || !data)
        return json(
          { error: "El curso todavía no está publicado en la base de datos." },
          404,
        );
      title = `MUSIK · ${data.title}`;
      amount = Number(data.price_ars);
      const { data: enrollment, error: enrollmentError } = await admin
        .from("enrollments")
        .upsert(
          { user_id: user.id, course_id: data.id, status: "pending" },
          { onConflict: "user_id,course_id" },
        )
        .select("id")
        .single();
      if (enrollmentError) throw enrollmentError;
      targetId = enrollment.id;
    }
    if (!Number.isFinite(amount) || amount <= 0)
      return json({ error: "El precio no está configurado." }, 400);
    const { error: profileError } = await admin.from("profiles").update({
      full_name: fullName,
      phone,
      document_number: documentNumber,
      birth_date: profile.birth_date || null,
      address,
      emergency_contact: String(profile.emergency_contact || "").trim() || null,
      current_course: kind === "course" ? title.replace(/^MUSIK · /, "") : null,
      membership_label: kind === "membership" ? title.replace(/^MUSIK Club · /, "") : "Acceso por curso",
      account_status: "pendiente",
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (profileError) throw profileError;
    const paymentId = crypto.randomUUID(),
      payment = {
        id: paymentId,
        user_id: user.id,
        provider: "mercadopago",
        amount_ars: amount,
        status: "pending",
        external_reference: paymentId,
        ...(kind === "membership"
          ? { membership_id: targetId }
          : { enrollment_id: targetId }),
      };
    const { error: paymentError } = await admin
      .from("payments")
      .insert(payment);
    if (paymentError) throw paymentError;
    const site = (Deno.env.get("PUBLIC_SITE_URL") || "").replace(/\/$/, "");
    const preferenceResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": paymentId,
        },
        body: JSON.stringify({
          items: [
            {
              id: targetId,
              title,
              quantity: 1,
              currency_id: "ARS",
              unit_price: amount,
            },
          ],
          payer: { email: user.email },
          external_reference: paymentId,
          statement_descriptor: "MUSIK",
          back_urls: {
            success: `${site}/payment.html?result=approved`,
            pending: `${site}/payment.html?result=pending`,
            failure: `${site}/payment.html?result=failure`,
          },
          auto_return: "approved",
          notification_url: `${url}/functions/v1/mercadopago-webhook?source_news=webhooks`,
        }),
      },
    );
    const preference = await preferenceResponse.json();
    if (!preferenceResponse.ok) {
      await admin
        .from("payments")
        .update({ status: "rejected", status_detail: "preference_error" })
        .eq("id", paymentId);
      return json(
        {
          error: "No pudimos iniciar Mercado Pago.",
          detail: preference.message,
        },
        502,
      );
    }
    await admin
      .from("payments")
      .update({ provider_preference_id: preference.id })
      .eq("id", paymentId);
    return json({
      checkout_url: preference.init_point,
      preference_id: preference.id,
    });
  } catch (error) {
    console.error(error);
    return json({ error: "No pudimos preparar el pago." }, 500);
  }
});
