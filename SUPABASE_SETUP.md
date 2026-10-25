# Configuración de Supabase para MUSIK

## 1. Crear el proyecto

1. Entrar en https://supabase.com/dashboard y elegir **New project**.
2. Crear una organización si todavía no existe.
3. Nombre sugerido: `musik-club`.
4. Elegir una contraseña de base de datos fuerte y guardarla en un gestor de contraseñas.
5. Elegir la región más próxima disponible y esperar a que termine la creación.

## 2. Crear las tablas y la seguridad

1. Abrir **SQL Editor**.
2. Elegir **New query**.
3. Copiar todo el archivo `supabase/schema.sql`.
4. Ejecutar con **Run**.

El esquema incluye perfiles, membresías, cursos, inscripciones, actividades, reservas, contenidos y referencias de pagos. Todas las tablas expuestas tienen Row Level Security.

## 3. Obtener los datos públicos de conexión

En **Project Settings > API** copiar:

- Project URL.
- Publishable key o anon key.

Pegarlos en `auth-config.js`. Es normal que estos dos valores estén en el frontend; la seguridad real está en las políticas RLS.

Nunca colocar en el navegador la `service_role`, la contraseña de Postgres ni secretos de pagos.

## 4. Activar Google

1. En Google Cloud crear un proyecto y configurar OAuth Consent Screen.
2. Crear credenciales **OAuth Client ID > Web application**.
3. En Supabase abrir **Authentication > Providers > Google** y copiar la Callback URL que muestra Supabase.
4. En Google agregar esa URL en **Authorized redirect URIs**.
5. En Google agregar como JavaScript origins:
   - `https://musik-club-academia.silbersteinsantiago.chatgpt.site`
   - `http://localhost:4173`
6. Copiar Client ID y Client Secret en el proveedor Google de Supabase y guardar.
7. En **Authentication > URL Configuration** usar como Site URL:
   - `https://musik-club-academia.silbersteinsantiago.chatgpt.site`
8. Agregar como Redirect URLs:
   - `https://musik-club-academia.silbersteinsantiago.chatgpt.site/club.html`
   - `http://localhost:4173/club.html`

## 5. Definir al dueño como administrador

Primero iniciar sesión una vez con Google. Después ejecutar en SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'TU_EMAIL_DE_GOOGLE';
```

## 6. Pagos

La tabla `payments` guarda importe, estado e identificador del proveedor. La creación y actualización de pagos debe realizarse desde una función segura o backend usando webhooks de Mercado Pago u otro proveedor. No almacenar números de tarjeta, códigos de seguridad ni secretos del proveedor.

## 7. Conectar las publicaciones de Instagram

La página de inicio ya consume la función segura `instagram-feed`. El token nunca se coloca en GitHub ni en el navegador.

1. En Meta for Developers crear una app y habilitar **Instagram API with Instagram Login** para la cuenta profesional `@musik_academy`.
2. Obtener el identificador de la cuenta y un access token de larga duración.
3. En Supabase, abrir **Edge Functions > Secrets** y crear:
   - `INSTAGRAM_USER_ID`
   - `INSTAGRAM_ACCESS_TOKEN`
4. Desplegar `supabase/functions/instagram-feed/index.ts` como función `instagram-feed`.
5. Al publicar una novedad en Instagram, el inicio de MUSIK mostrará automáticamente las seis publicaciones más recientes. La respuesta se almacena en caché durante 10 minutos.

No guardar el token de Instagram en `auth-config.js`, archivos `.env` versionados ni GitHub Pages.

