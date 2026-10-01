# Wallet demo

Aplicación móvil de demostración que reproduce el prototipo visual de Wallet. La primera entrega está orientada a Android y conserva compatibilidad con iOS mediante React Native/Expo.

La API y la base de datos pueden ejecutarse localmente o publicarse en el VPS. El sistema incluye registro, login, sesiones, transferencias internas, compras, intercambios y un panel administrativo respaldado por MariaDB/MySQL.

## Requisitos

- Node.js 22.13 o superior
- MariaDB/MySQL local (la configuración incluida usa XAMPP en `127.0.0.1:3306`)
- Android Studio o Expo Go para ejecutar Android

## Inicio rápido

1. Copia `api/.env.example` a `api/.env` si necesitas cambiar las credenciales.
2. Ejecuta `npm install`.
3. Ejecuta `npm run db:init`.
4. En una terminal ejecuta `npm run dev:api`.
5. En otra terminal ejecuta `npm run dev:mobile`.

Por defecto `MAIL_MODE=console` imprime los correos de verificación y actividad en la terminal de la API. Para envío real, configura SMTP y una clave de aplicación en `api/.env` siguiendo `api/.env.example`; en producción consulta `docs/DEPLOY.md`.

La app usa `http://10.0.2.2:4100` en el emulador Android y `http://localhost:4100` en web. En un teléfono físico, define `EXPO_PUBLIC_API_URL` con la IP local de la PC.

Cuenta de demostración:

- Correo: `demo@wallet.local`
- Contraseña: `Demo1234!`
- PIN: `123456`

Esta cuenta tiene rol `admin`. Desde **Perfil → Administrar cuentas** puede acreditar activos a los usuarios registrados. Las cuentas nuevas comienzan con todos sus balances en cero.

## APK de demostración

El APK instalable local se genera en `artifacts/Wallet-demo-android.apk`. La última versión desplegada se descarga directamente desde:

https://wallet-rest.armandovelasquez.com/downloads/wallet-android.apk

GitHub Actions recompila Android con la URL HTTPS de producción y publica el APK junto al backend en cada deploy. Está firmado para instalación directa de pruebas y no debe publicarse en Google Play como compilación de producción.

La versión del enlace usa `EXPO_PUBLIC_API_URL=https://wallet-rest.armandovelasquez.com`, por lo que un teléfono físico persiste sus operaciones en la base de producción.

## Deploy del backend

El workflow `.github/workflows/backend.yml` despliega la API en `wallet-rest.armandovelasquez.com`. La lista de variables, secretos, preparación de MySQL y activación de HTTPS está en `docs/DEPLOY.md`.

La explicación completa con arquitectura, navegación, flujo, directorios y modelo de datos está en `docs/PROJECT_GUIDE.md`. Los endpoints también están resumidos en `docs/architecture.md`, y la guía para retomar el desarrollo sin reinspeccionar el repositorio está en `docs/HANDOFF.md`.
