# Activación de Mercado Pago

La integración usa Checkout Pro y Supabase Edge Functions. Las credenciales privadas nunca deben guardarse en GitHub, `auth-config.js` ni archivos públicos.

## 1. Base de datos

Ejecutar en Supabase SQL Editor, en este orden:

1. `supabase/schema.sql`
2. `supabase/payments_checkout.sql`

Luego cargar en `membership_plans` y `courses` los nombres y precios definitivos. Los nombres deben coincidir con los botones publicados en el sitio.

## 2. Secretos de las funciones

En Supabase > Edge Functions > Secrets agregar:

- `MP_ACCESS_TOKEN`: Access Token de producción de Mercado Pago.
- `MP_WEBHOOK_SECRET`: firma secreta de Webhooks de Mercado Pago.
- `PUBLIC_SITE_URL`: URL pública sin `/` final. Actualmente `https://infovoidsystem-coder.github.io/musik-sitio-app`.

## 3. Desplegar funciones

Con Supabase CLI vinculado al proyecto:

```bash
supabase functions deploy create-checkout
supabase functions deploy mercadopago-webhook --no-verify-jwt
```

## 4. Webhook de Mercado Pago

En Mercado Pago Developers > Tus integraciones > Webhooks configurar:

`https://koedrcteupwjgdfbrfev.supabase.co/functions/v1/mercadopago-webhook`

Seleccionar eventos de pagos y copiar la firma secreta generada a `MP_WEBHOOK_SECRET`.

## 5. Pruebas

Usar credenciales y usuarios de prueba antes de habilitar producción. Verificar los retornos aprobado, pendiente y rechazado, y confirmar que `payments`, `memberships` o `enrollments` cambien de estado mediante el webhook.

Cuando todo funcione, cambiar `paymentsEnabled` a `true` en `auth-config.js`.

