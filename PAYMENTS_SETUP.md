# Activación de Mercado Pago

La integración usa Checkout Pro y Supabase Edge Functions. Las credenciales privadas nunca deben guardarse en GitHub, `auth-config.js` ni archivos públicos.

## 1. Base de datos

Ejecutar en Supabase SQL Editor, en este orden:

1. `supabase/schema.sql`
2. `supabase/payments_checkout.sql`
3. `supabase/billing_invoices.sql`

Luego cargar en `membership_plans` y `courses` los nombres y precios definitivos. Los nombres deben coincidir con los botones publicados en el sitio.

## 2. Secretos de las funciones

En Supabase > Edge Functions > Secrets agregar:

- `MP_ACCESS_TOKEN`: Access Token de producción de Mercado Pago.
- `MP_WEBHOOK_SECRET`: firma secreta de Webhooks de Mercado Pago.
- `PUBLIC_SITE_URL`: URL pública sin `/` final. Actualmente `https://infovoidsystem-coder.github.io/musik-sitio-app`.
- `BILLING_PROVIDER`: `arca`, el nombre del sistema de gestión o `pending_integration`.
- `BILLING_SYNC_URL`: endpoint del conector fiscal elegido.
- `BILLING_SYNC_SECRET`: clave privada compartida con ese conector.

## 3. Desplegar funciones

Con Supabase CLI vinculado al proyecto:

```bash
supabase functions deploy create-checkout
supabase functions deploy mercadopago-webhook --no-verify-jwt
supabase functions deploy billing-sync
supabase functions deploy billing-callback --no-verify-jwt
```

## 4. Webhook de Mercado Pago

En Mercado Pago Developers > Tus integraciones > Webhooks configurar:

`https://koedrcteupwjgdfbrfev.supabase.co/functions/v1/mercadopago-webhook`

Seleccionar eventos de pagos y copiar la firma secreta generada a `MP_WEBHOOK_SECRET`.

## 5. Pruebas

Usar credenciales y usuarios de prueba antes de habilitar producción. Verificar los retornos aprobado, pendiente y rechazado, y confirmar que `payments`, `memberships` o `enrollments` cambien de estado mediante el webhook.

Cuando todo funcione, cambiar `paymentsEnabled` a `true` en `auth-config.js`.

## Conector de facturación

`billing-sync` funciona como adaptador neutral. Envía al endpoint configurado el pago, el alumno, el importe y la acción solicitada. El conector de ARCA o del sistema de gestión debe responder JSON con:

- `status`: `processing`, `issued`, `sent` o `failed`.
- `external_id`: identificador en el sistema fiscal.
- `invoice_type`, `point_of_sale` e `invoice_number`.
- `cae` y `cae_expires_at` cuando corresponda.
- `pdf_url` para descargar el comprobante.
- `recipient_email`, `issued_at` y `sent_at`.

Mientras `BILLING_SYNC_URL` y `BILLING_SYNC_SECRET` no estén configurados, las solicitudes quedan registradas como “Pendiente de sincronización” y nunca se muestran falsamente como enviadas.

