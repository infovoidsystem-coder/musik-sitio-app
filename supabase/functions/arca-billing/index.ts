import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Adaptador preparado para homologación. No almacena ni recibe clave fiscal.
// En producción debe firmar el TRA con ARCA_CERTIFICATE y ARCA_PRIVATE_KEY,
// obtener el token WSAA y luego invocar WSFEv1.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });

  const payload = await request.json().catch(() => ({}));
  const environment = Deno.env.get("ARCA_ENVIRONMENT") || "demo";
  const configured = Boolean(
    Deno.env.get("ARCA_CERTIFICATE") && Deno.env.get("ARCA_PRIVATE_KEY"),
  );

  if (payload.action === "list_points_of_sale" && (environment === "demo" || !configured)) {
    return Response.json(
      {
        ok: true,
        demo: true,
        points_of_sale: [
          { number: 3, label: "MUSIK WEB", recommended: true },
          { number: 1, label: "Facturación general", recommended: false },
        ],
      },
      { headers: cors },
    );
  }

  if (environment === "demo" || !configured) {
    return Response.json(
      {
        ok: true,
        demo: true,
        status: "issued",
        invoice_number: "00001-00000124",
        cae: "DEMO-NO-VALIDO",
        cae_expires_at: null,
        message: "Comprobante demostrativo. No posee validez fiscal.",
      },
      { headers: cors },
    );
  }

  return Response.json(
    {
      ok: false,
      code: "ARCA_ADAPTER_PENDING",
      message:
        "El adaptador productivo WSAA/WSFE debe activarse después de la validación del contador y la autorización del certificado.",
    },
    { status: 501, headers: cors },
  );
});

