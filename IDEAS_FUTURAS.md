# Quedamos — backlog de mejoras

Ideas que surgieron durante el desarrollo del MVP, ordenadas por valor / esfuerzo.

## Próximas a tocar (post-MVP, pre-lanzamiento)

### 🗓️ Auto-add a calendario tras confirmación
Cuando todos terminan de votar y el creador confirma el plan:
- **Botón "Agregar a mi calendario"** ya existe (genera `.ics`).
- **Mejora:** Para invitados con cuenta Quedamos → ofrecerles "Conectar Google Calendar" una sola vez (OAuth scope `calendar.events`). Cuando un plan en el que participan se confirma, se inserta el evento solo (con su preferencia opt-in).
- Para invitados sin cuenta → solo el botón manual del `.ics` (ya hecho).
- **Cuando exista la app móvil:** usar `expo-calendar` que escribe directo al calendario nativo del teléfono — sin OAuth, mejor UX.

### ✅ Cierre automático de votación
Detectar cuando "todos los participantes confirmados ya votaron al menos una opción" y mostrar al creador un botón destacado tipo "Cerrar votación · ya votaron 5/5". Ese botón:
1. Setea `is_winner = true` en la opción más votada (mayoría yes, desempata por +maybe, luego por antigüedad).
2. Pasa el plan a `status='confirmed'`.
3. Si los participantes tienen Google Calendar conectado, inserta el evento.
4. Si tienen email, manda un mail "Plan confirmado: [título] el [fecha]".

### 🧠 Mejor manejo de fechas relativas
Ya implementado en el prompt v2 con ejemplos. Tests pendientes:
- "este viernes" un viernes (ambiguo: hoy vs próxima semana)
- "fin de semana" (rango)
- Strings con typos
- Fechas en otros formatos (DD/MM/YYYY vs MM/DD/YYYY)

### 🌎 TZ por usuario
Hoy hardcodeado a `America/Lima`. Cuando agreguemos selector de país/ciudad en el perfil:
- Guardar `profiles.timezone` (IANA).
- Pasarlo a `describeNow(tz)` en el worker.
- Reemplazar el offset fijo `-05:00` en `localToUtcIso` por uno calculado con `Intl.DateTimeFormat`.

### 📧 Notificaciones por email
- "Te invitaron a un plan" cuando alguien comparte un link y el invitado deja su email.
- "Tu plan se va a confirmar pronto" 24h antes de la fecha si nadie cerró aún.
- "Recordatorio: tu plan es mañana" — usa `plan_reminders`.
- Implementar con Resend (3k mails/mes free).

## Más adelante (cuando exista tracción)

### 📱 App móvil
React Native + Expo. Lo importante de mobile:
- **Share extension** desde galería/Safari → "Compartir a Quedamos" crea el plan al toque.
- **Push notifications** para votos nuevos + confirmaciones + recordatorios (`expo-notifications`).
- **Calendario nativo** con `expo-calendar` (sin OAuth).
- **Deep links** (`quedamos://p/[token]`) para abrir un plan desde un mensaje.

### 🔗 Extensión de Chrome
Para gente que descubre planes desde desktop:
- Botón en la toolbar: "Guardar como plan en Quedamos".
- Click derecho en una imagen → "Crear plan".
- Click derecho en una página → toma OG metadata + screenshot opcional.

### 👥 Grupos frecuentes
- Crear grupo "Familia", "Universidad", "Colegas del trabajo".
- Al crear un plan, elegir grupo → agrega a todos los participantes recurrentes.
- Aprende patrones: "este grupo prefiere viernes noche".

### 📐 Plantillas de plan
- "Cumpleaños" → checklist autollenado (torta, decoración, música).
- "Cine" → 2 opciones de horario, lugar fijo (cinema más cercano).
- Premium feature.

### 🎨 Personalización visual
- Cover image AI-generada acorde al tipo de plan (DALL-E o Flux).
- Color tema por plan.
- Premium feature.

## Mejoras técnicas pendientes

### ⚙️ Reintentos del worker IA
Hoy si Anthropic falla queda el job en `failed`. Falta:
- Reintento automático con backoff (1 vez en 30s, 1 vez en 5min, después marcar failed).
- Botón "Reintentar procesamiento" en la ficha del plan.

### 📊 Dashboard de costos
- Vista admin con `cost_usd` agregado por día, modelo, usuario.
- Alerta si un usuario supera N capturas/mes.

### 🛡️ Rate limit por usuario
- Free tier: 20 capturas/mes (definido en plan).
- Implementar contador en `processing_jobs` y rechazar antes de gastar IA.

### 🧪 Tests
- E2E con Playwright: signup → upload → confirm → guest vote.
- Unit tests del prompt parser (con respuestas conocidas de Claude).

### 🔍 Observabilidad
- Sentry para errores client + server.
- PostHog para analytics de funnel (upload → confirm rate).
