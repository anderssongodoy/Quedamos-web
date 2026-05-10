# Configurar Resend como SMTP para Supabase Auth

Esto saca el rate limit del SMTP built-in de Supabase (2 emails/h en free) y los reemplaza por el límite de Resend (3000 emails/mes free, sin tope por hora).

## Paso 1 — Crear cuenta en Resend (1 min)

1. https://resend.com/signup
2. Registrate con tu correo personal (no con el que probás Quedamos para evitar conflictos).
3. Confirmá tu email.

## Paso 2 — Generar API key

1. https://resend.com/api-keys → "Create API Key"
2. Nombre: `quedamos-supabase-auth`
3. Permission: **Sending access** (no necesita Full access)
4. Copiá la key — empieza con `re_…`. **Solo se muestra una vez.**

## Paso 3 — Decidir el sender

**Opción A: usar el dominio sandbox de Resend (la más rápida para hoy)**

- Sender email: `onboarding@resend.dev`
- Sin verificación necesaria.
- Limitación: Resend solo deja enviar a la dirección con la que te registraste — útil para vos pero no para invitados de prueba reales.

**Opción B: usar tu propio dominio (recomendado para usuarios reales)**

1. https://resend.com/domains → "Add Domain"
2. Ingresá tu dominio (ej: `quedamos.app` cuando lo tengas; mientras tanto sirve cualquier dominio que controles).
3. Resend te muestra registros DNS (TXT, MX, SPF, DKIM).
4. Pegalos en tu proveedor de DNS (Cloudflare, Namecheap, donde sea).
5. Esperá ~5 min y dale "Verify" en Resend.
6. Sender email: `noreply@tudominio` o `hola@tudominio`.

> **Para hoy:** andá con la Opción A. Cuando tengas dominio real, migrás en 5 min sin tocar código (solo el campo "Sender email" en Supabase).

## Paso 4 — Configurar SMTP en Supabase

Andá a https://supabase.com/dashboard/project/rygnsemdmmbvnwecwvva/auth/templates → tab **"SMTP Settings"** → activá **"Enable Custom SMTP"**.

Pegá esto:

| Campo | Valor |
|---|---|
| **Sender email** | `onboarding@resend.dev` (Opción A) o tu `noreply@tudominio` (B) |
| **Sender name** | `Quedamos` |
| **Host** | `smtp.resend.com` |
| **Port** | `465` |
| **Username** | `resend` |
| **Password** | la API key del Paso 2 (`re_…`) |
| **Minimum interval** | `1` (segundos entre emails — bajalo para destrabar tu testing) |

Click **"Save"**.

## Paso 5 — Subir el rate limit del Auth (ahora que el SMTP no es el cuello de botella)

https://supabase.com/dashboard/project/rygnsemdmmbvnwecwvva/auth/rate-limits

- **Rate limit for sending emails:** subilo de 2/h (lo que tenés ahora) a `30` o `100`.
- **Rate limit for token verifications:** dejá el default (suele estar bien).

Save.

## Paso 6 — Probarlo

1. Cerrá la sesión actual si la tenés.
2. https://localhost:3000/login → pedí magic link a tu correo.
3. Mirá Resend → https://resend.com/emails — deberías ver el email saliendo en tiempo real.
4. El correo te llega. Click → entrás.

## Costos

- **Resend free tier**: 3000 emails/mes, 100 emails/día. Sin tarjeta de crédito.
- **Quedamos en early stage**: vas a estar muy lejos del límite (cada usuario manda ~1-2 mails al mes).
- Cuando crezca: $20/mes por 50k emails. No urgente.

## Si algo falla

- Email no llega → revisar https://resend.com/emails (Resend te muestra el delivery log).
- "535 Authentication failed" → la API key está mal pegada.
- "Sender not allowed" → usaste un dominio no verificado. Pasate a `onboarding@resend.dev`.
- Sigue rate-limited en Supabase → en Auth → Rate Limits, asegurate de subirlo (Paso 5).
