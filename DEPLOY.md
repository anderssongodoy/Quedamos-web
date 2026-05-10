# Deploy a Vercel (vía GitHub)

Este repo es la app Next.js completa en la raíz — no es monorepo. Vercel lo detecta solo.

## 1. Subir a GitHub

Si el repo todavía no existe:

1. https://github.com/new → nombre `quedamos` → **Private** (importante por la restricción contractual) → **NO** marques "Add README" → Create.
2. En tu máquina, desde la carpeta del proyecto:

```bash
git init -b main          # solo si no está inicializado
git add -A
git commit -m "Quedamos MVP"
git remote add origin https://github.com/<tu-usuario>/quedamos.git
git push -u origin main
```

> Si Git te pide auth, en Windows se abre el Git Credential Manager (login con browser, una vez).

## 2. Importar en Vercel

1. https://vercel.com/new → "Import Git Repository" → elegí `quedamos`.
2. Framework Preset: **Next.js** (auto-detectado).
3. Root Directory: **`./`** (la raíz — no es monorepo).
4. **Antes de hacer "Deploy"**, expandí "Environment Variables" y pegá estas (los valores reales están en tu `.env.local` local):

| Name | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rygnsemdmmbvnwecwvva.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | (de tu .env.local) |
| `ANTHROPIC_API_KEY` | (de tu .env.local) |
| `R2_ACCOUNT_ID` | `fff78f8cd58210ea337044f3b2eee179` |
| `R2_ACCESS_KEY_ID` | (de tu .env.local) |
| `R2_SECRET_ACCESS_KEY` | (de tu .env.local) |
| `R2_BUCKET_NAME` | `quedamos-uploads` |
| `R2_S3_ENDPOINT` | `https://fff78f8cd58210ea337044f3b2eee179.r2.cloudflarestorage.com` |
| `QUEDAMOS_WORKER_SECRET` | (de tu .env.local) |

(No agregues `NEXT_PUBLIC_APP_URL` todavía — va en el paso 4.)

5. Click **Deploy**.

## 3. ⚠️ Build settings

Vercel por defecto corre `pnpm install` + `pnpm build`. Eso funciona. Si el build falla por `sharp` (bindings nativos), agregá en **Settings → General → Build & Development Settings → Install Command**:

```
pnpm install --config.confirmModulesPurge=false
```

(Suele no hacer falta — el `package.json` ya tiene `pnpm.onlyBuiltDependencies` con `sharp`.)

## 4. Setear `NEXT_PUBLIC_APP_URL` con la URL final

1. Vercel te da una URL: `https://quedamos-xxxx.vercel.app`.
2. Settings → Environment Variables → Add:
   - `NEXT_PUBLIC_APP_URL` = `https://quedamos-xxxx.vercel.app` (Production)
3. Deployments → último deploy → "..." → **Redeploy** (para que el bundle tome el valor).

(Si conectás un dominio propio más adelante, repetí este paso con el dominio.)

## 5. Habilitar la URL de prod en Supabase Auth

1. https://supabase.com/dashboard/project/rygnsemdmmbvnwecwvva/auth/url-configuration
2. **Site URL**: `https://quedamos-xxxx.vercel.app`
3. **Redirect URLs**: agregá `https://quedamos-xxxx.vercel.app/auth/callback`

Sin esto los magic links de producción rebotan.

## 6. Verificación

```bash
curl https://quedamos-xxxx.vercel.app/                        # 200
curl -X POST https://quedamos-xxxx.vercel.app/api/process-job  # 403 (sin secret) — esperado
```

Abrí la URL, login con tu correo, creá un plan con texto, copiá el link público, abrilo en incógnito y votá como invitado.

## A futuro: SMTP de Resend

Por defecto Supabase usa su SMTP built-in (rate-limited). Para producción configurá Resend — ver `RESEND_SMTP.md`.
