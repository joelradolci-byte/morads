# Lemon Squeezy — Guía de configuración (Mora Watchdog $26.99/mes)

## 1. Cuenta y legal

1. Crear cuenta en [https://www.lemonsqueezy.com](https://www.lemonsqueezy.com)
2. Completar **Settings → Store**: nombre, email de soporte, URL del sitio
3. **Payouts / Identity**: datos fiscales y cuenta bancaria para cobros
4. Revisar **Taxes** (IVA según tu país y clientes)
5. Publicar y enlazar desde el checkout:
   - `/terminos` — suscripción, cancelación, trial 14 días
   - `/privacidad` — Google Ads, OpenAI, Anthropic
   - Política de reembolsos (Lemon suele pedirla en productos digitales)

## 2. Producto

1. **Products → New** → nombre: `Mora Watchdog`
2. Crear **Variant** suscripción **$26.99 USD / month** (recurring)
3. Copiar **Variant ID** y **Store ID**

## 3. Variables en `.env` (servidor)

```env
LEMON_SQUEEZY_API_KEY=
LEMON_SQUEEZY_STORE_ID=
LEMON_SQUEEZY_VARIANT_ID=
LEMON_SQUEEZY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

## 4. Webhook

1. Lemon → **Settings → Webhooks → New**
2. URL: `https://tu-dominio.com/api/billing/lemon-webhook`
3. Eventos mínimos:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_payment_success`
   - `subscription_payment_failed`
4. Copiar **Signing secret** → `LEMON_SQUEEZY_WEBHOOK_SECRET`

## 5. Checkout

- Redirect success: `{NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`
- El checkout envía `custom[user_id]` con el UUID de Supabase

## 6. Customer portal

En Lemon: habilitar **Customer portal** para cancelar o actualizar el método de pago.

En Mora, usuarios de Mora Watchdog pueden usar **Gestionar suscripción** (Facturación o Configuración). La app llama a `GET /api/billing/portal`, obtiene una URL firmada de Lemon (válida 24 h) y abre el portal en una pestaña nueva.

## 7. Pruebas

1. Modo **Test** en Lemon
2. Flujo: registro → conectar Ads → trial → **Activar Watchdog** → pagar → verificar `suscripciones.estado = activa`
3. Cancelar en Lemon → webhook → usuario sin Watchdog (sin segundo trial)

## 8. SQL previo

En este proyecto remoto ya están aplicados:

1. `user_usage` / `usage_events` / `increment_user_usage`
2. Migración `suscripciones_trial_lemon_upgrade` (columnas trial + Lemon en `suscripciones`)

Si clonás otro entorno, ejecutá en orden `usage_limits.sql` y luego `suscripciones_trial.sql` o el upgrade según corresponda.
